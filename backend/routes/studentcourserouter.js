import express from 'express';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { protect, authorize } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Order from '../models/Order.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';

dotenv.config();

const router = express.Router();

// --- Initialize Razorpay Instance ---
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- Helper Function to Check Course Access ---
const checkCourseAccess = async (userId, courseId) => {
    if (!userId || !courseId) return false;

    const user = await User.findById(userId).populate({
        path: 'purchasedSubscriptions.subscription',
        model: 'Subscription'
    });

    if (!user) return false;

    // Check for direct enrollment or purchase
    const isDirectlyEnrolled = user.enrolledCourses.some(c => c.course && c.course.equals(courseId)) ||
        user.enrollCoursePurchase.some(c => c.course && c.course.equals(courseId));

    if (isDirectlyEnrolled) return true;

    // Check for access via an active subscription
    const hasSubscriptionAccess = user.purchasedSubscriptions.some(sub => {
        const isActive = sub.isActive && (!sub.endDate || sub.endDate > new Date());
        if (!isActive || !sub.subscription) return false;

        const plan = sub.subscription;
        return plan.status === 'active' && (plan.courses.isAllIncluded || plan.courses.includedCourses.some(id => id && id.equals(courseId)));
    });

    return hasSubscriptionAccess;
};

// Helper function to send notifications
const sendNotification = async (userId, title, message, type, itemId, itemType, navigateLink) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedItem: { itemId, itemType },
            navigateLink,
        });
        console.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
    }
};

// --- Apply Middleware to all routes in this file ---
router.use(protect, authorize('student'));

// ----------------------------------------------------------------------------------
// --- COURSE BROWSING & DETAILS ---
// ----------------------------------------------------------------------------------

/**
 * @route   GET /api/student/courses
 * @desc    Get all available (published) courses for browsing
 * @access  Private (Student)
 */
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .populate({
                path: 'instructors',
                select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar',
            })
            .select(
                'title slug shortDescription thumbnail category price discountedPrice isFree rating totalStudents level'
            );
        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/student/courses/my-courses
 * @desc    Get all courses the student has access to, including their progress
 * @access  Private (Student)
 */
router.get('/my-courses', async (req, res) => {
    try {
        const userId = req.user.id;
        const courseFieldsToSelect = 'title slug thumbnail shortDescription category totalLessons level reviews rating duration instructors';
        const instructorFieldsToSelect = 'profileInfo.firstName profileInfo.lastName profileInfo.avatar';

        const user = await User.findById(userId)
            .select('purchasedSubscriptions enrolledCourses enrollCoursePurchase')
            .populate({
                path: 'purchasedSubscriptions.subscription',
                select: 'courses',
                populate: {
                    path: 'courses.includedCourses',
                    model: 'Course',
                    select: courseFieldsToSelect,
                    populate: {
                        path: 'instructors',
                        model: 'User',
                        select: instructorFieldsToSelect
                    }
                }
            });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const allUserCourses = new Map();

        // Fetch progress for all courses for this user in a single query
        const allProgressRecords = await Progress.find({ user: userId }).select('course progressPercentage lastAccessed');
        const progressMap = new Map(allProgressRecords.map(p => [p.course.toString(), p]));

        // Fetch direct enrollments and purchases from the User model (for course IDs only)
        const directCourseIds = user.enrolledCourses.map(e => e.course).concat(user.enrollCoursePurchase.map(e => e.course));
        const directCourses = await Course.find({ _id: { $in: directCourseIds } })
            .select(courseFieldsToSelect)
            .populate('instructors', instructorFieldsToSelect);

        directCourses.forEach(course => {
            const courseId = course._id.toString();
            if (!allUserCourses.has(courseId)) {
                const progressRecord = progressMap.get(courseId);
                allUserCourses.set(courseId, {
                    ...course.toObject(),
                    progress: progressRecord ? progressRecord.progressPercentage : 0
                });
            }
        });

        // Add courses from active subscriptions
        for (const sub of user.purchasedSubscriptions) {
            if (sub.isActive && sub.subscription) {
                if (sub.subscription.courses.isAllIncluded) {
                    const allPublishedCourses = await Course.find({ isPublished: true })
                        .select(courseFieldsToSelect)
                        .populate('instructors', instructorFieldsToSelect);

                    allPublishedCourses.forEach(course => {
                        const courseId = course._id.toString();
                        if (!allUserCourses.has(courseId)) {
                            const progressRecord = progressMap.get(courseId);
                            allUserCourses.set(courseId, {
                                ...course.toObject(),
                                progress: progressRecord ? progressRecord.progressPercentage : 0
                            });
                        }
                    });
                    break;
                } else {
                    for (const includedCourse of sub.subscription.courses.includedCourses) {
                        if (includedCourse) {
                            const courseId = includedCourse._id.toString();
                            if (!allUserCourses.has(courseId)) {
                                const progressRecord = progressMap.get(courseId);
                                allUserCourses.set(courseId, {
                                    ...includedCourse.toObject(),
                                    progress: progressRecord ? progressRecord.progressPercentage : 0
                                });
                            }
                        }
                    }
                }
            }
        }

        const coursesData = Array.from(allUserCourses.values());

        res.status(200).json({ success: true, data: coursesData });

    } catch (error) {
        console.error('Error fetching my courses:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/student/courses/:slug/details
 * @desc    Get course details. Shows full curriculum and lesson content only if user has access.
 * @access  Private (Student)
 */
router.get('/:slug/details', async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate('instructors', 'profileInfo.firstName profileInfo.lastName profileInfo.avatar')
            .populate('reviews.user', 'profileInfo.firstName profileInfo.lastName profileInfo.avatar');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const hasAccess = await checkCourseAccess(req.user.id, course._id);

        if (hasAccess || course.isFree) {
            await course.populate({
                path: 'chapters',
                select: 'title description position',
                populate: {
                    path: 'lessons'
                }
            });
        }

        const courseData = course.toObject();
        courseData.hasAccess = hasAccess;

        // Corrected section: Safely map over instructors and reviews
        courseData.instructors = courseData.instructors
            .filter(i => i) // Filter out any null instructors
            .map(i => ({
                _id: i._id,
                fullName: i.profileInfo.firstName + ' ' + i.profileInfo.lastName,
                avatar: i.profileInfo.avatar
            }));

        courseData.reviews = courseData.reviews
            .filter(r => r.user) // Filter out reviews with null users
            .map(r => ({
                ...r,
                user: {
                    _id: r.user._id,
                    fullName: r.user.profileInfo.firstName + ' ' + r.user.profileInfo.lastName,
                    avatar: r.user.profileInfo.avatar
                }
            }));

        res.status(200).json({ success: true, data: courseData });

    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ----------------------------------------------------------------------------------
// --- COURSE PURCHASE AND ENROLLMENT ---
// ----------------------------------------------------------------------------------

/**
 * @route   POST /api/student/courses/:slug/enroll-free
 * @desc    Enroll the current student in a FREE course
 * @access  Private (Student)
 */
router.post('/:slug/enroll-free', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const course = await Course.findOne({ slug: req.params.slug }).session(session);
        if (!course) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        if (!course.isFree) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'This course is not free. Please proceed to payment.' });
        }

        const user = await User.findById(req.user.id).session(session);
        const hasAccess = await checkCourseAccess(user._id, course._id);

        if (hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'You already have access to this course' });
        }

        // Add course to user's enrolledCourses
        user.enrolledCourses.push({ course: course._id, progress: 0, completedLessons: [], enrolledAt: new Date(), lastAccessed: new Date() });
        await user.save({ session });
        // Create a new progress document
        await Progress.create([{
            user: user._id,
            course: course._id,
            progressPercentage: 0
        }], { session });

        course.totalStudents += 1;
        await course.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Send a notification to the user
        await sendNotification(
            req.user.id,
            'Enrollment Successful!',
            `You have successfully enrolled in the free course: ${course.title}.`,
            'course',
            course._id,
            'Course',
            `/course/${course.slug}`
        );

        res.status(201).json({ success: true, message: `Successfully enrolled in ${course.title}` });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error enrolling in free course:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/student/courses/:slug/create-order
 * @desc    Create a Razorpay order to purchase a course
 * @access  Private (Student)
 */
router.post('/:slug/create-order', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const course = await Course.findOne({ slug: req.params.slug }).session(session);
        if (!course) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        if (course.isFree) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'This course is free and cannot be purchased.' });
        }

        const user = await User.findById(req.user.id).session(session);
        const hasAccess = await checkCourseAccess(user._id, course._id);

        if (hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'You already have access to this course.' });
        }

        const price = course.discountedPrice || course.price;
        const amountInPaise = Math.round(price * 100);

        const receiptId = `rcpt_${course._id.toString().substring(0, 12)}_${req.user.id.toString().substring(0, 10)}`;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                userId: req.user.id,
                courseId: course._id
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        await Order.create([{
            user: req.user.id,
            items: [{ itemType: 'Course', itemId: course._id, name: course.title, price: price }],
            pricing: { subtotal: price, total: price },
            payment: { method: 'Razorpay', transactionId: razorpayOrder.id },
            orderStatus: 'pending'
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating Razorpay order:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.description || 'Server Error',
            error: error
        });
    }
});

/**
 * @route   POST /api/student/courses/payment/verify
 * @desc    Verify Razorpay payment and grant course access
 * @access  Private (Student)
 */
router.post('/payment/verify', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Payment details are missing.' });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' });
        }

        const order = await Order.findOne({ 'payment.transactionId': razorpay_order_id }).session(session);
        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (order.orderStatus === 'completed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'This order has already been processed.' });
        }

        order.payment.status = 'completed';
        order.orderStatus = 'completed';
        order.payment.razorpayPaymentId = razorpay_payment_id;
        await order.save({ session });

        const courseItem = order.items.find(item => item.itemType === 'Course');
        if (courseItem) {
            const user = await User.findById(req.user.id).session(session);
            const course = await Course.findById(courseItem.itemId).session(session);
            
            user.enrollCoursePurchase.push({ course: courseItem.itemId, progress: 0, completedLessons: [], enrolledAt: new Date(), lastAccessed: new Date() });
            await user.save({ session });

            // Create a new progress document
            await Progress.create([{
                user: user._id,
                course: courseItem.itemId,
                progressPercentage: 0
            }], { session });

            course.totalStudents += 1;
            await course.save({ session });

            // Send a notification to the user
            await sendNotification(
                req.user.id,
                'Payment Successful!',
                `You have successfully purchased and been enrolled in the course: ${course.title}.`,
                'payment',
                course._id,
                'Course',
                `/course/${course.slug}`
            );
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, message: 'Payment successful! You now have access to the course.' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ----------------------------------------------------------------------------------
// --- LESSON CONTENT AND INTERACTION ---
// ----------------------------------------------------------------------------------

/**
 * @route   POST /api/student/courses/lessons/:lessonId/complete
 * @desc    Mark a lesson as complete
 * @access  Private (Student)
 */
router.post('/lessons/:lessonId/complete', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }

        const lesson = await Lesson.findById(lessonId).select('course').session(session);
        if (!lesson) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const courseId = lesson.course;

        const hasAccess = await checkCourseAccess(userId, courseId);
        if (!hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'You are not enrolled in this course.' });
        }

        // Find or create the progress document for the user and course
        let progress = await Progress.findOneAndUpdate(
            { user: userId, course: courseId },
            { $addToSet: { completedLessons: { lesson: lessonId } }, $set: { lastAccessed: new Date() } },
            { new: true, upsert: true, session }
        );

        // Update progress percentage
        await progress.calculateProgress();

        await session.commitTransaction();
        session.endSession();

        // Send a notification to the user
        await sendNotification(
            req.user.id,
            'Lesson Complete! ✅',
            `You have completed a lesson. Keep up the great work!`,
            'course',
            lessonId,
            'Lesson',
            `/course/${lesson.course.slug}/lesson/${lesson.slug}` // Assumes lesson has a slug and can be navigated to
        );

        res.status(200).json({ success: true, message: 'Lesson marked as complete.', progress: progress.progressPercentage });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error completing lesson:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/student/courses/lessons/:lessonId/incomplete
 * @desc    Mark a lesson as incomplete (removes it from progress)
 * @access  Private (Student)
 */
router.post('/lessons/:lessonId/incomplete', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }

        const lesson = await Lesson.findById(lessonId).select('course').session(session);
        if (!lesson) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const courseId = lesson.course;

        const hasAccess = await checkCourseAccess(userId, courseId);
        if (!hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'You are not enrolled in this course.' });
        }

        // Find and update the progress document
        const progress = await Progress.findOneAndUpdate(
            { user: userId, course: courseId },
            { $pull: { completedLessons: { lesson: lessonId } }, $set: { lastAccessed: new Date() } },
            { new: true, session }
        );

        if (progress) {
            await progress.calculateProgress();
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Lesson marked as incomplete.',
            progress: progress ? progress.progressPercentage : 0
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error marking lesson incomplete:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/student/courses/lessons/:lessonId/doubt
 * @desc    Add a doubt/question to a lesson
 * @access  Private (Student)
 */
router.post('/lessons/:lessonId/doubt', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { lessonId } = req.params;
        const { question } = req.body;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }
        if (!question || typeof question !== 'string' || question.trim() === '') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Question content is required.' });
        }

        const lesson = await Lesson.findById(lessonId)
            .populate({
                path: 'course',
                populate: {
                    path: 'instructors',
                    select: '_id'
                }
            })
            .session(session);

        if (!lesson) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const hasAccess = await checkCourseAccess(req.user.id, lesson.course._id);
        if (!hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'You must have access to this course to ask a question.' });
        }

        lesson.doubts.push({
            user: req.user.id,
            question: question.trim(),
        });

        await lesson.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Send a notification to all instructors of the course
        if (lesson.course && lesson.course.instructors && lesson.course.instructors.length > 0) {
            for (const instructor of lesson.course.instructors) {
                await sendNotification(
                    instructor._id,
                    'New Doubt Submitted!',
                    `A student has a question about lesson "${lesson.title}" in your course "${lesson.course.title}".`,
                    'support',
                    lesson._id,
                    'Lesson',
                    `/course/${lesson.course.slug}/lesson/${lesson.slug}`
                );
            }
        }

        res.status(201).json({ success: true, message: 'Your question has been submitted.' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error adding doubt:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/student/courses/lessons/:lessonId/submit-quiz
 * @desc    Submit answers for a quiz and get the result.
 * @access  Private (Student)
 */
router.post('/lessons/:lessonId/submit-quiz', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { lessonId } = req.params;
        const { answers } = req.body;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }
        if (!Array.isArray(answers)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Answers must be an array.' });
        }

        const lesson = await Lesson.findById(lessonId).session(session);
        if (!lesson || lesson.type !== 'quiz') {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Quiz lesson not found.' });
        }

        const hasAccess = await checkCourseAccess(req.user.id, lesson.course);
        if (!hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'You do not have access to this quiz.' });
        }

        const quizContent = lesson.content.quiz;
        const userAttempts = quizContent.attempts.filter(a => a.user.equals(req.user.id));

        if (quizContent.attemptsAllowed > 0 && userAttempts.length >= quizContent.attemptsAllowed) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'You have no more attempts for this quiz.' });
        }

        let score = 0;
        const processedAnswers = [];
        const totalPoints = quizContent.questions.reduce((sum, q) => sum + (q.points || 1), 0);

        for (const question of quizContent.questions) {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            let isCorrect = false;

            if (userAnswer) {
                const correctOptions = question.options.filter(o => o.isCorrect).map(o => o.optionText);
                isCorrect = userAnswer.selectedOptions &&
                    correctOptions.length === userAnswer.selectedOptions.length &&
                    correctOptions.every(o => userAnswer.selectedOptions.includes(o));
            }

            if (isCorrect) {
                score += (question.points || 1);
            }

            processedAnswers.push({
                questionId: question._id,
                selectedOptions: userAnswer ? userAnswer.selectedOptions : [],
                isCorrect: isCorrect,
                pointsAwarded: isCorrect ? (question.points || 1) : 0
            });
        }

        const scorePercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
        const isPassed = scorePercentage >= (quizContent.passScore || 50);

        const newAttempt = {
            user: req.user.id,
            score: scorePercentage,
            isPassed,
            answers: processedAnswers,
            completedAt: new Date()
        };

        quizContent.attempts.push(newAttempt);
        await lesson.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Quiz submitted successfully.',
            result: {
                score: newAttempt.score,
                isPassed: newAttempt.isPassed,
                totalQuestions: quizContent.questions.length,
                correctAnswers: processedAnswers.filter(a => a.isCorrect).length
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/student/courses/lessons/:lessonId/submit-coding-problem
 * @desc    Submit code for a coding problem.
 * @access  Private (Student)
 */
router.post('/lessons/:lessonId/submit-coding-problem', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { lessonId } = req.params;
        const { code, language } = req.body;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }
        if (!code || !language) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Code and language are required.' });
        }

        const lesson = await Lesson.findById(lessonId)
            .populate({
                path: 'course',
                populate: {
                    path: 'instructors',
                    select: '_id'
                }
            })
            .session(session);

        if (!lesson || lesson.type !== 'codingProblem') {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Coding problem not found.' });
        }

        const hasAccess = await checkCourseAccess(req.user.id, lesson.course._id);
        if (!hasAccess) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'You do not have access to this problem.' });
        }

        const problemContent = lesson.content.codingProblem;
        if (!problemContent.allowedLanguages.includes(language)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: `The language '${language}' is not allowed for this problem.` });
        }

        const newSubmission = {
            user: req.user.id,
            code,
            language,
            status: 'pending',
        };

        problemContent.submissions.push(newSubmission);
        await lesson.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Send notifications to all instructors about the new submission
        if (lesson.course && lesson.course.instructors && lesson.course.instructors.length > 0) {
            for (const instructor of lesson.course.instructors) {
                await sendNotification(
                    instructor._id,
                    'New Code Submission!',
                    `A student has submitted a solution for a coding problem in your course "${lesson.course.title}".`,
                    'support',
                    lesson._id,
                    'Lesson',
                    `/course/${lesson.course.slug}/lesson/${lesson.slug}`
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Your solution has been submitted and is pending evaluation.'
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error submitting coding problem:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// ----------------------------------------------------------------------------------
// --- COURSE PROGRESS AND REVIEWS ---
// ----------------------------------------------------------------------------------

/**
 * @route   GET /api/student/courses/:slug/progress
 * @desc    Get the student's progress for a specific enrolled course
 * @access  Private (Student)
 */
router.get('/:slug/progress', async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const progress = await Progress.findOne({ user: req.user.id, course: course._id });

        if (!progress) {
            const hasAccess = await checkCourseAccess(req.user.id, course._id);
            if (!hasAccess) {
                return res.status(404).json({ success: false, message: 'Progress not found. You may not be enrolled in this course.' });
            }
            // Return a default progress object for subscription users with no prior progress
            return res.status(200).json({
                success: true,
                data: {
                    _id: null,
                    completedLessons: [],
                    overallProgress: 0,
                    lastAccessed: null
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                _id: progress._id,
                completedLessons: progress.completedLessons,
                overallProgress: progress.progressPercentage,
                lastAccessed: progress.lastAccessed
            }
        });

    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/student/courses/:slug/review
 * @desc    Add or update a review for a course
 * @access  Private (Student)
 */
router.post('/:slug/review', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a rating between 1 and 5.' });
        }

        const course = await Course.findOne({ slug: req.params.slug }).populate('instructors', '_id');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const hasAccess = await checkCourseAccess(userId, course._id);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'You must have access to this course to leave a review.' });
        }

        const existingReviewIndex = course.reviews.findIndex(r => r.user.equals(userId));

        if (existingReviewIndex > -1) {
            course.reviews[existingReviewIndex].rating = rating;
            course.reviews[existingReviewIndex].comment = comment;
        } else {
            course.reviews.push({ user: userId, rating, comment });
        }

        course.totalRatings = course.reviews.length;
        course.rating = course.reviews.reduce((acc, item) => item.rating + acc, 0) / course.reviews.length;

        await course.save();

        // Send a notification to all instructors about the new review
        if (course.instructors && course.instructors.length > 0) {
            for (const instructor of course.instructors) {
                await sendNotification(
                    instructor._id,
                    'New Course Review!',
                    `A new ${rating}-star review was submitted for your course "${course.title}".`,
                    'support',
                    course._id,
                    'Course',
                    `/course/${course.slug}`
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for your review!',
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;