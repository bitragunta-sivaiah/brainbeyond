import express from 'express';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper function to check for valid subscription or enrollment
// Optimized for efficiency and to not modify the user document
const hasCourseAccess = async (user, courseId) => {
    if (!user || !courseId) {
        return false;
    }

    // Admins and instructors have full access
    if (user.role === 'admin' || user.role === 'instructor') {
        return true;
    }

    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // Check for direct enrollment
    const isEnrolled = user.enrollments.some(
        (enrollment) => enrollment.course.equals(courseObjectId)
    );
    if (isEnrolled) {
        return true;
    }

    // Check for a valid subscription
    // Only check if the course is subscription-based
    const course = await Course.findById(courseId).select('isIncludedInSubscription availableInPlans').lean().populate({
                path: 'chapters',
                model: Chapter,
                select: 'title description lessons order',
                options: { sort: { order: 1 } },
                populate: {
                    path: 'lessons',
                    model: Lesson,
                    select: 'title description type order isFree' // Only show essential lesson details
                }
            });

    if (course?.isIncludedInSubscription) {
        const hasValidSubscription = user.purchasedSubscriptions.some(
            (purchasedSub) => purchasedSub.isActive && 
                              purchasedSub.endDate > new Date() && 
                              (purchasedSub.subscription.toString() === 'all' || course.availableInPlans.some(planId => planId.equals(purchasedSub.subscription)))
        );

        if (hasValidSubscription) {
            return true;
        }
    }

    return false;
};

// -----------------------------------------------------------------------------
// Public Course Routes
// -----------------------------------------------------------------------------

// @route   GET /api/v1/courses/public
// @desc    Get all published, non-free courses for public view
// @access  Public
router.get('/public', async (req, res, next) => {
    try {
        const courses = await Course.find({ isPublished: true, isFree: false }).select('-enrolledStudents -reviews');
        return res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/v1/courses/:slug/details
// @desc    Get a single course's details with full chapter and lesson data
// @access  Public
router.get('/:slug/details', async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate({ path: 'instructors', select: 'profileInfo.firstName profileInfo.lastName username profileInfo.avatar' })
            .populate({
                path: 'chapters',
                model: Chapter,
                select: 'title description lessons order',
                options: { sort: { order: 1 } },
                populate: {
                    path: 'lessons',
                    model: Lesson,
                    select: 'title description type order isFree' // Only show essential lesson details
                }
            })
            .select('-enrolledStudents -reviews');
        
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        return res.status(200).json({ success: true, data: course });
    } catch (err) {
        next(err);
    }
});

// -----------------------------------------------------------------------------
// User-Specific Course Routes
// -----------------------------------------------------------------------------

// @route   GET /api/v1/courses/my
// @desc    Get all courses a user is enrolled in or has access to via subscription
// @access  Private
router.get('/my', protect, async (req, res, next) => {
    try {
        // Collect all course IDs the user has access to
        const enrolledCourseIds = req.user.enrollments.map(enrollment => enrollment.course);
        let subscriptionCourseIds = [];

        // Find all active subscription plans
        const activeSubPlans = req.user.purchasedSubscriptions
            .filter(sub => sub.isActive && sub.endDate > new Date())
            .map(sub => sub.subscription);

        // Find all courses from those active subscription plans
        const coursesFromSubscriptions = await Subscription.find({ _id: { $in: activeSubPlans } })
            .select('courses.isAllIncluded courses.includedCourses');

        for (const subPlan of coursesFromSubscriptions) {
            if (subPlan.courses.isAllIncluded) {
                // If a plan includes all courses, find all published courses
                const allCourses = await Course.find({ isPublished: true }).select('_id');
                subscriptionCourseIds.push(...allCourses.map(c => c._id));
            } else {
                // Otherwise, add the included courses
                subscriptionCourseIds.push(...subPlan.courses.includedCourses);
            }
        }

        // Combine and de-duplicate all course IDs
        const allCourseIds = [...new Set([...enrolledCourseIds, ...subscriptionCourseIds])];
        
        const allCourses = await Course.find({ _id: { $in: allCourseIds } }).select('-enrolledStudents -reviews');
        
        return res.status(200).json({ success: true, count: allCourses.length, data: allCourses });
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/v1/courses/:slug/progress
// @desc    Get course progress for a user, populating chapters and lessons based on access
// @access  Private
router.get('/:slug/progress', protect, async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug }).select('_id isPublished');
        if (!course || !course.isPublished) {
            return res.status(404).json({ success: false, message: 'Course not found or not published' });
        }

        const isAdminOrInstructor = req.user.role === 'admin' || req.user.role === 'instructor';
        const hasAccess = await hasCourseAccess(req.user, course._id);
        
        if (!hasAccess && !isAdminOrInstructor) {
            return res.status(403).json({ success: false, message: 'Access denied to this course' });
        }
        
        // Populate the course, chapters, and lessons in a single query
        const courseData = await Course.findOne({ slug: req.params.slug })
            .select('title description instructors totalLessons')
            .populate({
                path: 'chapters',
                model: Chapter,
                select: 'title description order lessons',
                options: { sort: { order: 1 } },
                populate: {
                    path: 'lessons',
                    model: Lesson,
                    select: 'title description type order isFree content'
                }
            });

        if (!courseData) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const enrolledCourse = req.user.enrollments.find(e => e.course.toString() === courseData._id.toString());
        const completedLessonsIds = enrolledCourse ? enrolledCourse.completedLessons.map(id => id.toString()) : [];
        const progressPercentage = enrolledCourse ? enrolledCourse.progress : 0;

        const chaptersWithLessons = courseData.chapters.map(chapter => {
            const lessons = chapter.lessons.map(lesson => {
                const isCompleted = completedLessonsIds.includes(lesson._id.toString());
                const isFree = lesson.isFree;
                
                // Determine if sensitive content should be hidden
                const isHidden = !isAdminOrInstructor && !hasAccess && !isFree;

                return {
                    _id: lesson._id,
                    title: lesson.title,
                    description: isHidden ? 'Purchase the course or a subscription to unlock this lesson.' : lesson.description,
                    type: lesson.type,
                    order: lesson.order,
                    isFree: lesson.isFree,
                    isCompleted,
                    content: isHidden ? undefined : lesson.content
                };
            });

            return {
                _id: chapter._id,
                title: chapter.title,
                description: chapter.description,
                order: chapter.order,
                lessons,
            };
        });

        res.status(200).json({
            success: true,
            data: {
                _id: courseData._id,
                title: courseData.title,
                description: courseData.description,
                chapters: chaptersWithLessons,
                progress: progressPercentage
            }
        });
    } catch (err) {
        next(err);
    }
});

// -----------------------------------------------------------------------------
// Enrollment & Payment Routes
// -----------------------------------------------------------------------------

// @route   POST /api/v1/courses/:slug/enroll-free
// @desc    Enroll a user in a free course
// @access  Private
router.post('/:slug/enroll-free', protect, async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!course.isFree) {
            return res.status(400).json({ success: false, message: 'This course is not free' });
        }

        const isAlreadyEnrolled = req.user.enrollments.some(
            (enrollment) => enrollment.course.toString() === course._id.toString()
        );

        if (isAlreadyEnrolled) {
            return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
        }

        req.user.enrollments.push({ course: course._id });
        await req.user.save();
        
        course.enrolledStudents.push({ user: req.user._id });
        course.totalStudents = course.enrolledStudents.length;
        await course.save();

        // Create a notification for the user
        await Notification.create({
            user: req.user._id,
            title: 'Free Course Enrollment',
            message: `You have successfully enrolled in the course: ${course.title}.`,
            navigateLink: `/courses/${course.slug}/progress`,
            type: 'course',
            relatedItem: { itemType: 'Course', itemId: course._id }
        });

        return res.status(200).json({ success: true, message: 'Successfully enrolled in the free course' });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/courses/:slug/create-order
// @desc    Create a Razorpay order for a course
// @access  Private
router.post('/:slug/create-order', protect, async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const finalPrice = course.discountedPrice || course.price;
        const amountInPaise = Math.round(finalPrice * 100);

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: 'INR', // Assuming INR for Razorpay
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        });
        
        const newOrder = new Order({
            user: req.user._id,
            items: [{
                itemType: 'Course',
                itemId: course._id,
                name: course.title,
                price: finalPrice,
            }],
            pricing: {
                subtotal: finalPrice,
                total: finalPrice,
            },
            payment: {
                method: 'Razorpay',
                status: 'pending',
                transactionId: razorpayOrder.id,
            },
            orderStatus: 'pending'
        });

        await newOrder.save();

        return res.status(201).json({ success: true, data: { orderId: newOrder._id, razorpayOrder } });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/courses/:slug/payment-verify
// @desc    Verify Razorpay payment signature and complete the order
// @access  Private
router.post('/:slug/payment-verify', protect, async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.payment.status = 'completed';
        order.orderStatus = 'completed';
        order.payment.transactionId = razorpay_payment_id;
        await order.save();

        const courseItem = order.items.find(item => item.itemType === 'Course');
        const course = await Course.findById(courseItem.itemId);

        const isAlreadyEnrolled = req.user.enrollments.some(
            (enrollment) => enrollment.course.toString() === course._id.toString()
        );
        if (!isAlreadyEnrolled) {
            req.user.enrollments.push({ course: course._id });
            course.enrolledStudents.push({ user: req.user._id });
            course.totalStudents = course.enrolledStudents.length;
            await Promise.all([req.user.save(), course.save()]);
        }
        
        await Notification.create({
            user: req.user._id,
            title: 'Course Purchase',
            message: `Your payment for ${course.title} was successful. You now have full access.`,
            navigateLink: `/courses/${course.slug}/progress`,
            type: 'payment',
            relatedItem: { itemType: 'Course', itemId: course._id }
        });

        return res.status(200).json({ success: true, message: 'Payment verified and order completed' });
    } catch (err) {
        next(err);
    }
});

// -----------------------------------------------------------------------------
// Lesson & Progress Routes
// -----------------------------------------------------------------------------

// @route   POST /api/v1/lessons/:lessonId/complete
// @desc    Mark a lesson as completed
// @access  Private
router.post('/lessons/:lessonId/complete', protect, async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId).select('course isFree').lean();
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const hasAccess = await hasCourseAccess(req.user, lesson.course) || lesson.isFree;
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied to this course' });
        }

        const userEnrollment = req.user.enrollments.find(e => e.course.toString() === lesson.course.toString());
        if (!userEnrollment) {
            return res.status(400).json({ success: false, message: 'You are not enrolled in this course.' });
        }
        
        if (userEnrollment.completedLessons.includes(lesson._id)) {
            return res.status(400).json({ success: false, message: 'Lesson already marked as complete.' });
        }
        
        userEnrollment.completedLessons.push(lesson._id);
        const course = await Course.findById(lesson.course).select('totalLessons');
        if (course.totalLessons > 0) {
            userEnrollment.progress = Math.round((userEnrollment.completedLessons.length / course.totalLessons) * 100);
        }
        userEnrollment.lastAccessed = new Date();
        await req.user.save();

        res.status(200).json({ success: true, message: 'Lesson marked as completed.', progress: userEnrollment.progress });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/lessons/:lessonId/incomplete
// @desc    Mark a lesson as incomplete (un-complete)
// @access  Private
router.post('/lessons/:lessonId/incomplete', protect, async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId).select('course isFree').lean();
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const hasAccess = await hasCourseAccess(req.user, lesson.course) || lesson.isFree;
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied to this course' });
        }

        const userEnrollment = req.user.enrollments.find(e => e.course.toString() === lesson.course.toString());
        if (!userEnrollment) {
            return res.status(400).json({ success: false, message: 'You are not enrolled in this course.' });
        }
        
        const initialCompletedCount = userEnrollment.completedLessons.length;
        userEnrollment.completedLessons = userEnrollment.completedLessons.filter(
            (lessonId) => lessonId.toString() !== lesson._id.toString()
        );

        if (userEnrollment.completedLessons.length === initialCompletedCount) {
            return res.status(400).json({ success: false, message: 'Lesson was not marked as complete.' });
        }

        const course = await Course.findById(lesson.course).select('totalLessons');
        if (course.totalLessons > 0) {
            userEnrollment.progress = Math.round((userEnrollment.completedLessons.length / course.totalLessons) * 100);
        }
        userEnrollment.lastAccessed = new Date();
        await req.user.save();

        res.status(200).json({ success: true, message: 'Lesson marked as incomplete.', progress: userEnrollment.progress });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/lessons/:lessonId/doubts
// @desc    Add a doubt to a lesson
// @access  Private
router.post('/lessons/:lessonId/doubts', protect, async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const hasAccess = await hasCourseAccess(req.user, lesson.course);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied to this course' });
        }

        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ success: false, message: 'Question text is required' });
        }

        lesson.doubts.push({
            user: req.user._id,
            question
        });

        await lesson.save();

        res.status(201).json({ success: true, message: 'Doubt added successfully' });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/lessons/:lessonId/submit-quiz
// @desc    Submit a quiz attempt
// @access  Private
router.post('/lessons/:lessonId/submit-quiz', protect, async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson || lesson.type !== 'quiz') {
            return res.status(404).json({ success: false, message: 'Lesson not found or is not a quiz' });
        }

        const hasAccess = await hasCourseAccess(req.user, lesson.course);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied to this course' });
        }

        const userAnswers = req.body.answers;
        let score = 0;
        const quizResults = [];

        lesson.content.quiz.questions.forEach(question => {
            const userAnswer = userAnswers.find(ua => ua.questionId === question._id.toString());
            if (userAnswer) {
                const isCorrect = question.options.every(opt => 
                    (userAnswer.selectedOptions.includes(opt.optionText) && opt.isCorrect) ||
                    (!userAnswer.selectedOptions.includes(opt.optionText) && !opt.isCorrect)
                );
                
                if (isCorrect) {
                    score += question.points;
                }
                
                quizResults.push({
                    questionId: question._id,
                    answeredText: userAnswer.answeredText,
                    selectedOptions: userAnswer.selectedOptions,
                    isCorrect,
                    pointsAwarded: isCorrect ? question.points : 0
                });
            }
        });

        const totalPoints = lesson.content.quiz.questions.reduce((acc, q) => acc + q.points, 0);
        const passScore = (totalPoints * lesson.content.quiz.passScore) / 100;
        const isPassed = score >= passScore;

        const newAttempt = {
            user: req.user._id,
            score,
            isPassed,
            answers: quizResults,
            completedAt: new Date()
        };

        lesson.content.quiz.attempts.push(newAttempt);
        await lesson.save();

        if (isPassed) {
            const userEnrollment = req.user.enrollments.find(e => e.course.toString() === lesson.course.toString());
            if (userEnrollment && !userEnrollment.completedLessons.includes(lesson._id)) {
                userEnrollment.completedLessons.push(lesson._id);
                const course = await Course.findById(lesson.course).select('totalLessons');
                if (course.totalLessons > 0) {
                    userEnrollment.progress = Math.round((userEnrollment.completedLessons.length / course.totalLessons) * 100);
                }
                userEnrollment.lastAccessed = new Date();
                await req.user.save();
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Quiz submitted successfully. You ${isPassed ? 'passed' : 'failed'}.`,
            data: { score, isPassed, results: quizResults }
        });

    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/lessons/:lessonId/submit-coding-problem
// @desc    Submit code to be compiled/run and graded
// @access  Private
router.post('/lessons/:lessonId/submit-coding-problem', protect, async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson || lesson.type !== 'codingProblem') {
            return res.status(404).json({ success: false, message: 'Lesson not found or is not a coding problem' });
        }

        const hasAccess = await hasCourseAccess(req.user, lesson.course);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied to this course' });
        }

        const { code, language } = req.body;
        if (!code || !language) {
            return res.status(400).json({ success: false, message: 'Code and language are required' });
        }

        const mockTestResults = lesson.content.codingProblem.testCases.map(tc => ({
            testCaseId: tc._id,
            passed: true, 
            executionTime: Math.random() * 100,
            memoryUsed: Math.random() * 50,
            output: 'Mock Output',
            expectedOutput: tc.output
        }));

        const isCorrect = mockTestResults.every(r => r.passed);
        const score = isCorrect ? lesson.content.codingProblem.points : 0;
        
        const newSubmission = {
            user: req.user._id,
            code,
            language,
            status: isCorrect ? 'correct' : 'incorrect',
            score,
            results: mockTestResults
        };
        
        lesson.content.codingProblem.submissions.push(newSubmission);
        await lesson.save();

        if (isCorrect) {
            const userEnrollment = req.user.enrollments.find(e => e.course.toString() === lesson.course.toString());
            if (userEnrollment && !userEnrollment.completedLessons.includes(lesson._id)) {
                userEnrollment.completedLessons.push(lesson._id);
                const course = await Course.findById(lesson.course).select('totalLessons');
                if (course.totalLessons > 0) {
                    userEnrollment.progress = Math.round((userEnrollment.completedLessons.length / course.totalLessons) * 100);
                }
                userEnrollment.lastAccessed = new Date();
                await req.user.save();
            }
        }
        
        res.status(200).json({
            success: true,
            message: isCorrect ? 'Submission correct! All tests passed.' : 'Submission incorrect. Some tests failed.',
            data: newSubmission
        });

    } catch (err) {
        next(err);
    }
});

// @route   POST /api/v1/lessons/run-code
// @desc    Run code for a lesson without submitting
// @access  Private
router.post('/lessons/run-code', protect, async (req, res, next) => {
    try {
        const { code, language, lessonId } = req.body;
        
        if (!code || !language) {
            return res.status(400).json({ success: false, message: 'Code and language are required' });
        }
        
        const mockResult = {
            output: `Mock output for ${language} code:\n${code}`,
            executionTime: Math.random() * 50,
            memoryUsed: Math.random() * 20
        };

        res.status(200).json({
            success: true,
            message: 'Code executed successfully.',
            data: mockResult
        });

    } catch (err) {
        next(err);
    }
});

// -----------------------------------------------------------------------------
// Review CRUD Operations
// -----------------------------------------------------------------------------

// @route   POST /api/v1/courses/:slug/reviews
// @desc    Add a review to a course
// @access  Private
router.post('/:slug/reviews', protect, async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const hasAccess = await hasCourseAccess(req.user, course._id);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'You must be enrolled to leave a review.' });
        }

        const { rating, comment } = req.body;
        if (!rating) {
            return res.status(400).json({ success: false, message: 'A rating is required.' });
        }

        const alreadyReviewed = course.reviews.some(
            (review) => review.user.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this course.' });
        }

        course.reviews.push({ user: req.user._id, rating, comment });
        
        // Recalculate average rating
        const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
        course.rating = (totalRating / course.reviews.length).toFixed(1);
        course.totalRatings = course.reviews.length;
        
        await course.save();

        res.status(201).json({ success: true, message: 'Review added successfully.', data: course.reviews.slice(-1)[0] });
    } catch (err) {
        next(err);
    }
});

// @route   PUT /api/v1/courses/:slug/reviews
// @desc    Update a user's review for a course
// @access  Private
router.put('/:slug/reviews', protect, async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const userReview = course.reviews.find(
            (review) => review.user.toString() === req.user._id.toString()
        );

        if (!userReview) {
            return res.status(404).json({ success: false, message: 'Review not found for this user.' });
        }

        const { rating, comment } = req.body;
        if (rating) userReview.rating = rating;
        if (comment) userReview.comment = comment;
        
        // Recalculate average rating
        const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
        course.rating = (totalRating / course.reviews.length).toFixed(1);
        
        await course.save();

        res.status(200).json({ success: true, message: 'Review updated successfully.', data: userReview });
    } catch (err) {
        next(err);
    }
});

// @route   DELETE /api/v1/courses/:slug/reviews
// @desc    Delete a user's review for a course
// @access  Private
router.delete('/:slug/reviews', protect, async (req, res, next) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const reviewIndex = course.reviews.findIndex(
            (review) => review.user.toString() === req.user._id.toString()
        );

        if (reviewIndex === -1) {
            return res.status(404).json({ success: false, message: 'Review not found for this user.' });
        }

        course.reviews.splice(reviewIndex, 1);
        
        // Recalculate average rating
        if (course.reviews.length > 0) {
            const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
            course.rating = (totalRating / course.reviews.length).toFixed(1);
        } else {
            course.rating = 0;
        }
        course.totalRatings = course.reviews.length;
        
        await course.save();

        res.status(200).json({ success: true, message: 'Review deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

export default router;