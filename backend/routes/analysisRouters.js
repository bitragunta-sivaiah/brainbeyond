import express from 'express';
import mongoose from 'mongoose';
import * as XLSX from "xlsx";
import { protect, authorize } from '../middleware/authMiddleware.js';

// Import all necessary models
import Ad from '../models/Ad.js';
import Announcement from '../models/Announcement.js';
import BlogPost from '../models/Blog.js';
import Contact from '../models/Contact.js';
import Coupon from '../models/Coupon.js';
import Course from '../models/Course.js';
import FAQ from '../models/FAQ.js';
import GroupChat from '../models/GroupChat.js';
import Lesson from '../models/Lesson.js';
import LiveClass from '../models/LiveClass.js';
import Order from '../models/Order.js';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';

const router = express.Router();

// Helper function to get date ranges
const getDateRanges = (period) => {
    const now = new Date();
    let start, end;
    switch (period) {
        case 'weekly':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            end = new Date(start);
            end.setDate(start.getDate() + 7);
            break;
        case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        case 'yearly':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear() + 1, 0, 1);
            break;
        default: // daily
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(start);
            end.setDate(start.getDate() + 1);
            break;
    }
    return { start, end };
};

// Helper function to calculate average time to resolution for tickets
const getAverageResolutionTime = async () => {
    const resolvedTickets = await SupportTicket.find({ status: 'resolved' });
    if (resolvedTickets.length === 0) return 0;

    const totalMilliseconds = resolvedTickets.reduce((sum, ticket) => {
        if (ticket.closedAt && ticket.createdAt) {
            return sum + (ticket.closedAt.getTime() - ticket.createdAt.getTime());
        }
        return sum;
    }, 0);

    const averageInDays = (totalMilliseconds / resolvedTickets.length) / (1000 * 60 * 60 * 24);
    return parseFloat(averageInDays.toFixed(2));
};

// --- New Universal Data Export Route ---
router.post('/export', protect, authorize('admin'), async (req, res) => {
    try {
        const { dataType, ids } = req.body;
        if (!dataType || !ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Invalid request: dataType and an array of ids are required.' });
        }

        let data = [];
        let exportFileName = 'export.xlsx';
        let worksheets = [];

        switch (dataType) {
            case 'users':
                const users = await User.find({ _id: { $in: ids } }).select('fullName email role createdAt');
                data = users.map(user => ({
                    'Full Name': user.fullName,
                    'Email': user.email,
                    'Role': user.role,
                    'Registration Date': user.createdAt.toISOString().slice(0, 10)
                }));
                exportFileName = 'users_export.xlsx';
                worksheets.push({ name: 'Users', data: data });
                break;

            case 'courses':
                const courses = await Course.find({ _id: { $in: ids } })
                    .populate({
                        path: 'chapters',
                        populate: {
                            path: 'lessons'
                        }
                    })
                    .populate('instructors', 'fullName');

                const courseSummaryData = courses.map(course => ({
                    'Course Title': course.title,
                    'Category': course.category,
                    'Price': course.price,
                    'Discounted Price': course.discountedPrice || 'N/A',
                    'Total Students': course.totalStudents,
                    'Total Chapters': course.chapters.length,
                    'Total Lessons': course.totalLessons,
                    'Instructors': course.instructors.map(i => i.fullName).join(', ')
                }));
                worksheets.push({ name: 'Course Summary', data: courseSummaryData });

                const detailedContentData = [['Course', 'Chapter', 'Lesson Title', 'Lesson Type', 'Duration (min)', 'Points']];
                courses.forEach(course => {
                    detailedContentData.push([`Course: ${course.title}`, '', '', '', '', '']);
                    if (course.chapters.length > 0) {
                        course.chapters.forEach(chapter => {
                            detailedContentData.push(['', `Chapter: ${chapter.title}`, '', '', '', '']);
                            if (chapter.lessons.length > 0) {
                                chapter.lessons.forEach(lesson => {
                                    detailedContentData.push([
                                        '', '',
                                        lesson.title,
                                        lesson.type,
                                        lesson.type === 'video' ? lesson.video?.duration : 'N/A',
                                        lesson.type === 'codingProblem' ? lesson.codingProblem?.points : 'N/A'
                                    ]);
                                });
                            } else {
                                detailedContentData.push(['', '', 'No lessons in this chapter.', '', '', '']);
                            }
                        });
                    } else {
                        detailedContentData.push(['', 'No chapters in this course.', '', '', '', '']);
                    }
                });
                worksheets.push({ name: 'Detailed Content', data: detailedContentData });
                exportFileName = 'courses_details.xlsx';
                break;

            case 'lessons':
                const lessons = await Lesson.find({ _id: { $in: ids } })
                    .populate('course', 'title')
                    .populate('chapter', 'title');

                data = lessons.map(lesson => ({
                    'Lesson Title': lesson.title,
                    'Course': lesson.course?.title,
                    'Chapter': lesson.chapter?.title,
                    'Type': lesson.type,
                    'Is Free': lesson.isFree ? 'Yes' : 'No',
                    'Duration (min)': lesson.type === 'video' ? lesson.video?.duration : 'N/A',
                    'Points': lesson.type === 'codingProblem' ? lesson.codingProblem?.points : 'N/A'
                }));
                exportFileName = 'lessons_export.xlsx';
                worksheets.push({ name: 'Lessons', data: data });
                break;

            case 'orders':
                const orders = await Order.find({ _id: { $in: ids } }).populate('user', 'fullName email');
                data = orders.map(order => ({
                    'Order ID': order._id,
                    'User': order.user?.fullName,
                    'User Email': order.user?.email,
                    'Total Amount': order.pricing?.total,
                    'Payment Status': order.payment?.status,
                    'Order Date': order.createdAt.toISOString().slice(0, 10)
                }));
                exportFileName = 'orders_export.xlsx';
                worksheets.push({ name: 'Orders', data: data });
                break;

            case 'tickets':
                const tickets = await SupportTicket.find({ _id: { $in: ids } })
                    .populate('user', 'fullName email')
                    .populate('assignedTo', 'fullName');

                data = tickets.map(ticket => ({
                    'Ticket ID': ticket._id,
                    'Subject': ticket.subject,
                    'User': ticket.user?.fullName,
                    'User Email': ticket.user?.email,
                    'Status': ticket.status,
                    'Priority': ticket.priority,
                    'Assigned To': ticket.assignedTo?.fullName || 'Unassigned',
                    'Created At': ticket.createdAt.toISOString().slice(0, 10),
                    'Closed At': ticket.closedAt ? ticket.closedAt.toISOString().slice(0, 10) : 'N/A'
                }));
                exportFileName = 'tickets_export.xlsx';
                worksheets.push({ name: 'Support Tickets', data: data });
                break;

            default:
                return res.status(400).json({ message: 'Invalid data type specified.' });
        }

        const workbook = XLSX.utils.book_new();
        worksheets.forEach(ws => {
            const worksheet = ws.name === 'Detailed Content' ? XLSX.utils.aoa_to_sheet(ws.data) : XLSX.utils.json_to_sheet(ws.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, ws.name);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${exportFileName}`);
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.send(buffer);

    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({ message: 'Failed to export data.', error: error.message });
    }
});


// --- ADMIN DASHBOARD ---
router.get('/admin', protect, authorize('admin'), async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        const { start, end } = getDateRanges(period);

        // 1. Overall Platform Analytics
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalInstructors = await User.countDocuments({ role: 'instructor' });
        const totalCourses = await Course.countDocuments();
        const totalLiveClasses = await LiveClass.countDocuments();
        const totalBlogPosts = await BlogPost.countDocuments();
        const totalAnnouncements = await Announcement.countDocuments();
        const totalCoupons = await Coupon.countDocuments();
        const totalFaqs = await FAQ.countDocuments();
        const totalAds = await Ad.countDocuments();
        const totalSupportTickets = await SupportTicket.countDocuments();
        const totalContacts = await Contact.countDocuments();

        // 2. Financials
        const financialSummary = await Order.aggregate([
            { $match: { 'payment.status': 'completed', createdAt: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$pricing.total' },
                    totalDiscounts: { $sum: '$pricing.discount' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);
        const revenueByMonth = await Order.aggregate([
            { $match: { 'payment.status': 'completed', createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$pricing.total' } } },
            { $sort: { _id: 1 } }
        ]);
        const topCoupons = await Coupon.find().sort({ uses: -1 }).limit(3).select('code title uses');

        // 3. User & Content Trends
        const newRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const mostEnrolledCourses = await Course.find().sort({ totalStudents: -1 }).limit(5).select('title totalStudents');
        const mostViewedBlogPosts = await BlogPost.find().sort({ 'meta.views': -1 }).limit(5).select('title meta.views');

        // 4. Support & Operations
        const ticketStats = await SupportTicket.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const averageResolutionTime = await getAverageResolutionTime();
        const adClicks = await Ad.aggregate([
            { $group: { _id: null, totalClicks: { $sum: '$clicks' }, totalImpressions: { $sum: '$impressions' } } }
        ]);
        const recentContacts = await Contact.find().sort({ createdAt: -1 }).limit(5).select('name subject status');

        // 5. Calendar
        const upcomingEvents = await LiveClass.find({ startTime: { $gte: new Date() } }).sort({ startTime: 1 }).limit(5).select('title startTime instructor');

        // 6. Marketing & Features
        const activeAds = await Ad.find({ isActive: true }).select('title position image');

        const adminDashboardData = {
            summary: { totalStudents, totalInstructors, totalCourses, totalLiveClasses, totalBlogPosts, totalAnnouncements, totalCoupons, totalFaqs, totalAds, totalSupportTickets, totalContacts },
            financials: {
                currentPeriod: financialSummary[0] || { totalSales: 0, totalDiscounts: 0, orderCount: 0 },
                revenueByMonth,
                topCoupons
            },
            trends: { newRegistrations, mostEnrolledCourses, mostViewedBlogPosts },
            operations: {
                ticketStats,
                averageResolutionTime,
                adPerformance: adClicks[0] || { totalClicks: 0, totalImpressions: 0 },
                recentContacts
            },
            marketing: { activeAds },
            calendar: { upcomingEvents }
        };
        res.status(200).json(adminDashboardData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- INSTRUCTOR DASHBOARD ---
router.get('/instructor', protect, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. My Course Analytics
        const myCourses = await Course.find({ instructors: userId })
            .select('title slug thumbnail totalStudents rating reviews chapters isPublished')
            .populate('chapters', 'title lessons');

        const totalEnrolledStudents = myCourses.reduce((sum, course) => sum + course.totalStudents, 0);
        const averageCourseRating = myCourses.length > 0 ? myCourses.reduce((sum, course) => sum + course.rating, 0) / myCourses.length : 0;
        const totalLiveClasses = await LiveClass.countDocuments({ instructor: userId });
        const totalAnnouncements = await Announcement.countDocuments({ author: userId });

        // 2. Earnings and Financials (from completed orders for my courses)
        const earningsResult = await Order.aggregate([
            { $match: { 'payment.status': 'completed' } },
            { $unwind: '$items' },
            { $match: { 'items.itemType': 'Course', 'items.itemId': { $in: myCourses.map(c => c._id) } } },
            { $group: { _id: null, totalEarnings: { $sum: '$items.price' } } }
        ]);
        const totalEarnings = earningsResult[0]?.totalEarnings.toString() || '0';

        // 3. User Engagement & Content
        const myBlogPosts = await BlogPost.find({ author: userId }).sort({ createdAt: -1 }).limit(5);
        const recentCourseReviews = myCourses.flatMap(course =>
            course.reviews.map(review => ({
                courseTitle: course.title,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt
            }))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

        const recentDoubts = await Lesson.aggregate([
            { $match: { 'course': { $in: myCourses.map(c => c._id) } } },
            { $unwind: '$doubts' },
            { $sort: { 'doubts.createdAt': -1 } },
            { $limit: 5 },
            { $project: { _id: 0, courseId: '$course', lessonTitle: '$title', question: '$doubts.question', status: '$doubts.status' } }
        ]);

        const instructorDashboardData = {
            summary: { totalEnrolledStudents, averageCourseRating: parseFloat(averageCourseRating.toFixed(2)), totalLiveClasses, totalAnnouncements, totalEarnings },
            myCourses: myCourses.map(c => ({
                title: c.title,
                slug: c.slug,
                thumbnail: c.thumbnail,
                totalStudents: c.totalStudents,
                rating: c.rating,
                totalLessons: c.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0),
                isPublished: c.isPublished
            })),
            content: { myBlogPosts },
            engagement: { recentCourseReviews, recentDoubts },
            upcomingClasses: await LiveClass.find({ instructor: userId, startTime: { $gte: new Date() } }).sort({ startTime: 1 }).limit(5)
        };
        res.status(200).json(instructorDashboardData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/customercare', protect, authorize('customercare', 'admin'), async (req, res) => {
    try {
        // 1. Ticket & Contact Overview
        const ticketCountsByStatus = await SupportTicket.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const totalTickets = ticketCountsByStatus.reduce((acc, curr) => acc + curr.count, 0);
        const recentContacts = await Contact.find().sort({ createdAt: -1 }).limit(5).select('name email subject status');

        // 2. My Assigned & Recent Activity
        const myOpenTickets = await SupportTicket.find({ assignedTo: req.user._id, status: { $in: ['open', 'in-progress'] } })
            .sort({ priority: -1, createdAt: 1 })
            .limit(10)
            .populate('user', 'profileInfo.firstName');

        const myRecentClosedTickets = await SupportTicket.find({ assignedTo: req.user._id, status: { $in: ['resolved', 'closed'] } })
            .sort({ closedAt: -1 })
            .limit(5);

        // 3. Knowledge Base & Announcements
        const recentFaqs = await FAQ.find().sort({ createdAt: -1 }).limit(5);
        const recentAnnouncements = await Announcement.find({ target: { $in: ['all', 'customercare'] } }).sort({ createdAt: -1 }).limit(5);

        // 4. Analytics
        const avgResolutionTime = await getAverageResolutionTime();
        const ticketHistory = await SupportTicket.aggregate([
            { $match: { 'history.actor': req.user._id } },
            { $unwind: '$history' },
            { $match: { 'history.actor': req.user._id } },
            { $sort: { 'history.timestamp': -1 } },
            { $limit: 5 },
            { $project: { _id: 1, subject: '$subject', eventType: '$history.eventType', details: '$history.details', timestamp: '$history.timestamp' } }
        ]);

        const customerCareDashboardData = {
            summary: { totalTickets, ticketCountsByStatus, avgResolutionTime },
            myTickets: { myOpenTickets, myRecentClosedTickets },
            inquiries: { recentContacts },
            knowledgeBase: { recentFaqs },
            activity: { recentAnnouncements, ticketHistory }
        };

        res.status(200).json(customerCareDashboardData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/student', protect, authorize('student', 'admin'), async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. My Courses & Progress - now uses the dedicated Progress model
        const progressRecords = await Progress.find({ user: userId })
            .populate({
                path: 'course',
                select: 'title slug thumbnail totalLessons totalQuizzes totalCodingProblems'
            });

        const myCourses = progressRecords.map(record => ({
            course: record.course,
            overallProgress: record.progressPercentage,
            completedLessons: record.completedLessons.length,
        }));

        const totalEnrolledCourses = myCourses.length;
        const averageProgress = totalEnrolledCourses > 0 ? myCourses.reduce((sum, course) => sum + course.overallProgress, 0) / totalEnrolledCourses : 0;

        // 2. Upcoming Schedule & Notifications
        const enrolledCourseIds = myCourses.map(p => p.course._id);
        const upcomingLiveClasses = await LiveClass.find({ course: { $in: enrolledCourseIds }, startTime: { $gte: new Date() } })
            .sort({ startTime: 1 }).limit(5).select('title startTime course').populate('course', 'title');
        const recentAnnouncements = await Announcement.find({ $or: [{ target: 'all' }, { course: { $in: enrolledCourseIds } }, { target: 'students' }] })
            .sort({ createdAt: -1 }).limit(5).select('title content course');

        // 3. Course Content & Engagement
        const recentLessonDoubt = await Lesson.aggregate([
            { $match: { 'course': { $in: enrolledCourseIds } } },
            { $unwind: '$doubts' },
            { $match: { 'doubts.user': userId } },
            { $sort: { 'doubts.createdAt': -1 } },
            { $limit: 1 },
            { $project: { _id: 0, lessonTitle: '$title', doubt: '$doubts.question', status: '$doubts.status' } }
        ]);

        // 4. Financials & Community
        const mySubscriptions = await User.findById(userId).select('purchasedSubscriptions').populate('purchasedSubscriptions.subscription', 'name pricing.billingCycle');
        const myGroupChats = await GroupChat.find({ 'members.user': userId }).limit(3).select('name course');

        const studentDashboardData = {
            progressSummary: { totalEnrolledCourses, averageProgress: parseFloat(averageProgress.toFixed(2)) },
            myCourses,
            upcomingSchedule: { upcomingLiveClasses },
            notifications: { recentAnnouncements },
            engagement: {
                recentDoubt: recentLessonDoubt[0]
            },
            financials: {
                mySubscriptions: mySubscriptions.purchasedSubscriptions
            },
            community: { myGroupChats }
        };
        res.status(200).json(studentDashboardData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;