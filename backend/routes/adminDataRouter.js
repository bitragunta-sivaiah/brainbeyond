import express from 'express';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs'; // Replaced json2csv with exceljs

// --- Import your security middleware ---
// Note: Adjust the path based on your project structure.
import { protect, authorize } from '../middleware/authMiddleware.js'; 

// --- Import all your Mongoose Models ---
import User from '../models/User.js';
import Order from '../models/Order.js';
import Subscription from '../models/Subscription.js';
import Resume from '../models/Resume.js';
import ATSResumeChecker from '../models/atsResumeCheckerModel.js';
import InterviewPreparation from '../models/InterviewPreparation.js';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import LiveClass from '../models/LiveClass.js';

const router = express.Router();

// HELPER FUNCTION (Updated to use ExcelJS)
const sendResponse = async (req, res, data, fields, fileName) => {
    // To export, your API call should now use ?export=excel
    if (req.query.export === 'excel') {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(fileName);

            // Create columns from the 'fields' array, also creating friendlier header names
            worksheet.columns = fields.map(field => ({
                header: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                key: field,
                width: 20 // Adjust column width as needed
            }));

            // Add the data rows
            worksheet.addRows(data);
            
            // Set headers for the Excel file download
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=${fileName}.xlsx`
            );

            // Write the workbook to the response
            await workbook.xlsx.write(res);
            return res.end();

        } catch (error) {
            console.error('Error generating Excel file:', error);
            return res.status(500).send('Error generating Excel file');
        }
    } else {
        // Default JSON response remains the same
        return res.json({ success: true, count: data.length, data });
    }
};


/**
 * =========================================================================
 * SECURED ADMIN ROUTES
 * =========================================================================
 * All routes below are now protected. Only an authenticated user with the 
 * 'admin' role can access them.
 */

// 1. PURCHASE HISTORY
router.get(
    '/purchase-history', 
    protect,              // First, ensure the user is logged in and the session is valid
    authorize('admin'),   // Next, ensure the user has the 'admin' role
    async (req, res) => {
    try {
        const completedOrders = await Order.find({ 'payment.status': 'completed' })
            .populate('user', 'username')
            .populate('items.itemId')
            .lean();

        const history = [];

        for (const order of completedOrders) {
            if (!order.user) continue;

            for (const item of order.items) {
                const baseDetail = {
                    userName: order.user.username,
                    paymentId: order.payment.transactionId,
                    orderDate: order.createdAt.toISOString().split('T')[0],
                };

                if (item.itemType === 'Subscription' && item.itemId) {
                    history.push({
                        ...baseDetail,
                        itemType: 'Subscription',
                        itemName: item.name,
                        billingCycle: item.itemId.pricing?.billingCycle || 'N/A',
                        planType: item.itemId.planType || 'N/A',
                        startDate: 'See User History',
                        endDate: 'See User History',
                        enrolledOrPurchased: 'Yes',
                        courseProgress: 'N/A',
                        getCertificate: 'N/A',
                    });
                } else if (item.itemType === 'Course' && item.itemId) {
                    const student = await User.findOne({ _id: order.user._id, 'enrollCoursePurchase.course': item.itemId._id });
                    const progress = student ? student.enrollCoursePurchase.find(c => c.course.equals(item.itemId._id))?.progress : 0;
                    history.push({
                        ...baseDetail,
                        itemType: 'Course',
                        itemName: item.name,
                        billingCycle: 'One-Time',
                        planType: 'N/A',
                        startDate: order.createdAt.toISOString().split('T')[0],
                        endDate: 'N/A',
                        enrolledOrPurchased: 'Yes',
                        courseProgress: `${progress || 0}%`,
                        getCertificate: progress === 100 ? 'Eligible' : 'No',
                    });
                }
            }
        }

        const fields = ['userName', 'paymentId', 'orderDate', 'itemType', 'itemName', 'billingCycle', 'planType', 'startDate', 'endDate', 'enrolledOrPurchased', 'courseProgress', 'getCertificate'];
        sendResponse(req, res, history, fields, 'purchase-history');

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 2. USER HISTORY
router.get(
    '/user-history', 
    protect, 
    authorize('admin'), 
    async (req, res) => {
    try {
        const users = await User.find({}).lean();
        const history = users.map(user => {
            const activeSubscription = user.purchasedSubscriptions?.find(sub => sub.isActive && (!sub.endDate || new Date(sub.endDate) > new Date()));
            return {
                userId: user._id,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified ? 'Yes' : 'No',
                certificatesCount: user.certificates?.length || 0,
                hasValidSubscription: activeSubscription ? 'Yes' : 'No',
                subscriptionStartDate: activeSubscription ? activeSubscription.startDate?.toISOString().split('T')[0] : 'N/A',
                subscriptionEndDate: activeSubscription ? activeSubscription.endDate?.toISOString().split('T')[0] : 'N/A',
                coursesPurchased: (user.enrolledCourses?.length || 0) + (user.enrollCoursePurchase?.length || 0)
            };
        });
        const fields = ['userId', 'username', 'role', 'isVerified', 'certificatesCount', 'hasValidSubscription', 'subscriptionStartDate', 'subscriptionEndDate', 'coursesPurchased'];
        sendResponse(req, res, history, fields, 'user-history');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 3. SUBSCRIPTION HISTORY
router.get(
    '/subscription-history', 
    protect, 
    authorize('admin'), 
    async (req, res) => {
    try {
        const subscriptions = await Subscription.find({}).lean();
        const revenueData = await Order.aggregate([
            { $match: { 'payment.status': 'completed', 'items.itemType': 'Subscription' } },
            { $unwind: '$items' },
            { $match: { 'items.itemType': 'Subscription' } },
            { $group: { _id: '$items.itemId', totalRevenue: { $sum: '$items.price' } } }
        ]);
        const revenueMap = revenueData.reduce((map, item) => {
            map[item._id.toString()] = item.totalRevenue;
            return map;
        }, {});
        const history = [];
        for (const sub of subscriptions) {
            const totalPurchasers = await User.countDocuments({ 'purchasedSubscriptions.subscription': sub._id });
            const currentSubscribers = await User.countDocuments({ 'purchasedSubscriptions': { $elemMatch: { subscription: sub._id, isActive: true, $or: [{ endDate: null }, { endDate: { $gt: new Date() } }] } } });
            history.push({
                packageName: sub.name,
                totalPurchasers,
                currentSubscribers,
                amount: sub.pricing?.basePrice || 0,
                totalRevenue: revenueMap[sub._id.toString()] || 0,
            });
        }
        const fields = ['packageName', 'totalPurchasers', 'currentSubscribers', 'amount', 'totalRevenue'];
        sendResponse(req, res, history, fields, 'subscription-history');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 4. RESUME BUILDER HISTORY
router.get(
    '/resume-builder-history', 
    protect, 
    authorize('admin'), 
    async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resumeStats = await Resume.aggregate([
            { $group: { _id: '$userId', totalResumes: { $sum: 1 }, todayResumes: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' }
        ]);
        const atsStats = await ATSResumeChecker.aggregate([
            { $group: { _id: '$userId', totalATSChecks: { $sum: 1 }, todayATSChecks: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } } } }
        ]);
        const atsMap = atsStats.reduce((map, item) => {
            map[item._id.toString()] = item;
            return map;
        }, {});
        const history = resumeStats.map(stat => {
            const userAts = atsMap[stat._id.toString()];
            return {
                userName: stat.user.username,
                todayResumeUsed: stat.todayResumes,
                todayATSUsed: userAts ? userAts.todayATSChecks : 0,
                totalResumeUsed: stat.totalResumes,
                totalATSUsed: userAts ? userAts.totalATSChecks : 0
            };
        });
        const fields = ['userName', 'todayResumeUsed', 'todayATSUsed', 'totalResumeUsed', 'totalATSUsed'];
        sendResponse(req, res, history, fields, 'resume-builder-history');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 5. INTERVIEW PREPARATION HISTORY
router.get(
    '/interview-preparation-history', 
    protect, 
    authorize('admin'), 
    async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const preparations = await InterviewPreparation.find({}).populate('user', 'username').lean();
        const history = preparations.map(prep => {
            const totalMockInterviews = prep.assessment?.aiMockInterviews?.length || 0;
            const todayMockInterviews = prep.assessment?.aiMockInterviews?.filter(interview => new Date(interview.date) >= today).length || 0;
            return {
                userName: prep.user?.username || 'N/A',
                targetRole: prep.target.role,
                targetCompany: prep.target.company,
                prepStartDate: prep.startDate?.toISOString().split('T')[0],
                prepEndDate: prep.targetDate?.toISOString().split('T')[0] || 'Ongoing',
                todayAIMockUsage: todayMockInterviews,
                totalAIMockUsage: totalMockInterviews
            };
        });
        const fields = ['userName', 'targetRole', 'targetCompany', 'prepStartDate', 'prepEndDate', 'todayAIMockUsage', 'totalAIMockUsage'];
        sendResponse(req, res, history, fields, 'interview-prep-history');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 6. COURSES HISTORY
router.get(
    '/courses-history', 
    protect, 
    authorize('admin'), 
    async (req, res) => {
    try {
        const courses = await Course.find({}).lean();
        const revenueData = await Order.aggregate([
            { $match: { 'payment.status': 'completed', 'items.itemType': 'Course' } },
            { $unwind: '$items' },
            { $match: { 'items.itemType': 'Course' } },
            { $group: { _id: '$items.itemId', totalRevenue: { $sum: '$items.price' } } }
        ]);
        const revenueMap = revenueData.reduce((map, item) => {
            map[item._id.toString()] = item.totalRevenue;
            return map;
        }, {});
        const history = [];
        for (const course of courses) {
            const courseId = course._id;
            const certificateCount = await User.countDocuments({ 'enrollCoursePurchase.course': courseId, 'enrollCoursePurchase.progress': 100 });
            const chapterIds = await Chapter.find({ course: courseId }).select('_id').lean();
            const liveClassCount = await LiveClass.countDocuments({ chapter: { $in: chapterIds.map(c => c._id) } });
            history.push({
                courseName: course.title,
                chapters: course.chapters?.length || 0,
                lessons: course.totalLessons || 0,
                enrolledStudents: course.totalStudents || 0,
                revenue: revenueMap[courseId.toString()] || 0,
                createdDate: course.createdAt?.toISOString().split('T')[0],
                certificatesIssued: certificateCount,
                liveClasses: liveClassCount
            });
        }
        const fields = ['courseName', 'chapters', 'lessons', 'enrolledStudents', 'revenue', 'createdDate', 'certificatesIssued', 'liveClasses'];
        sendResponse(req, res, history, fields, 'courses-history');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;