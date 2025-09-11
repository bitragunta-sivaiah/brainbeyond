import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

// Import all required models
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import LiveClass from '../models/LiveClass.js';
 
import User from '../models/User.js'; // User model now contains instructor data
import Notification from '../models/Notification.js';
import Subscription from '../models/Subscription.js';

import {
    protect,
    authorize
} from '../middleware/authMiddleware.js';

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const router = express.Router();

// --- Transaction Retry Utility ---
const withRetry = async (session, operation, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const result = await operation(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) {
                console.warn(`Write conflict detected. Retrying transaction... Attempt ${attempt + 1}`);
                attempt++;
                if (attempt < maxRetries) {
                    await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
                } else {
                    await session.abortTransaction();
                    throw new Error('Transaction failed after multiple retries due to persistent write conflicts.');
                }
            } else {
                await session.abortTransaction();
                throw error;
            }
        }
    }
};

// --- CORRECTED Utility Function to Update Instructor Stats ---
// This function now updates the User document directly for users with the 'instructor' role.
const updateInstructorStats = async (userId) => {
    try {
        const courses = await Course.find({
            instructors: userId,
            isPublished: true
        });

        const totalStudents = courses.reduce((sum, course) => sum + (course.totalStudents || 0), 0);
        const totalReviews = courses.reduce((sum, course) => sum + (course.totalRatings || 0), 0);

        let totalWeightedRating = 0;
        courses.forEach(course => {
            totalWeightedRating += (course.rating || 0) * (course.totalRatings || 0);
        });

        const averageRating = totalReviews > 0 ? (totalWeightedRating / totalReviews).toFixed(1) : 0;
        const totalCourses = courses.length;

        // CORRECTED: Find and update the User model where the role is 'instructor'.
        await User.findByIdAndUpdate(userId, {
            $set: {
                // These fields are defined in the instructorSchema discriminator
                totalStudents,
                totalReviews,
                averageRating,
                totalCourses,
            },
            $addToSet: {
                courses: { $each: courses.map(c => c._id) }
            },
        }, {
            new: true // Return the updated document
        });

        console.log(`Instructor stats updated for user: ${userId}`);
    } catch (error) {
        console.error(`Error updating instructor stats for ${userId}:`, error);
    }
};


// --- Notification Utility for Live Classes ---
/**
 * Finds all users eligible for a live class notification and creates the notifications.
 * @param {string} liveClassId - The ID of the LiveClass document.
 * @param {string} eventType - 'created' or 'updated'.
 */
const sendLiveClassNotification = async (liveClassId, eventType = 'created') => {
    try {
        const liveClass = await LiveClass.findById(liveClassId).populate({
            path: 'chapter',
            select: 'course',
            populate: {
                path: 'course',
                select: 'title availableInPlans'
            }
        });

        if (!liveClass || !liveClass.chapter || !liveClass.chapter.course) {
            console.error(`Could not send notification: LiveClass or associated course not found for ID ${liveClassId}`);
            return;
        }

        const course = liveClass.chapter.course;
        const courseId = course._id;

        // 1. Find users directly enrolled in the course
        const directlyEnrolledUsers = await User.find({
            $or: [
                { 'enrolledCourses.course': courseId },
                { 'enrollCoursePurchase.course': courseId }
            ]
        }).select('_id');

        // 2. Find users with an active subscription that includes this course
        const relevantSubscriptions = await Subscription.find({
            status: 'active',
            $or: [
                { 'courses.isAllIncluded': true },
                { 'courses.includedCourses': courseId }
            ]
        }).select('_id');

        const subscriptionIds = relevantSubscriptions.map(s => s._id);

        let subscriptionUsers = [];
        if (subscriptionIds.length > 0) {
            subscriptionUsers = await User.find({
                purchasedSubscriptions: {
                    $elemMatch: {
                        subscription: { $in: subscriptionIds },
                        isActive: true,
                        $or: [
                            { endDate: { $gte: new Date() } },
                            { endDate: null } // For lifetime plans
                        ]
                    }
                }
            }).select('_id');
        }

        // 3. Combine and deduplicate user IDs
        const allUserIds = [
            ...directlyEnrolledUsers.map(u => u._id.toString()),
            ...subscriptionUsers.map(u => u._id.toString())
        ];
        const uniqueUserIds = [...new Set(allUserIds)];

        if (uniqueUserIds.length === 0) {
            console.log(`No users to notify for live class: ${liveClass.title}`);
            return;
        }

        // 4. Create notification payload for each user
        const title = eventType === 'created'
            ? `📢 New Live Class Scheduled: ${liveClass.title}`
            : `🔄 Live Class Updated: ${liveClass.title}`;

        const message = `A live class for the course "${course.title}" is scheduled for ${new Date(liveClass.schedule.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Click to join!`;

        const notifications = uniqueUserIds.map(userId => ({
            user: userId,
            title: title,
            message: message,
            navigateLink: liveClass.joinUrl, // Virtual property from LiveClass model
            type: 'event',
            relatedItem: {
                itemType: 'LiveClass',
                itemId: liveClass._id
            }
        }));

        // 5. Insert all notifications
        await Notification.insertMany(notifications);
        console.log(`Successfully sent ${notifications.length} notifications for live class: ${liveClass.title}`);

    } catch (error) {
        console.error(`Failed to send notifications for live class ${liveClassId}:`, error);
    }
};

// --- Course Routes ---


router.get('/course', async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .populate('instructors', 'profileInfo.firstName profileInfo.lastName')
            .populate({
                path: 'chapters',
                options: { sort: { order: 1 } },
                populate: {
                    path: 'lessons',
                    options: { sort: { order: 1 } },
                }
            })
            .populate({
                path: 'chapters',
                options: { sort: { order: 1 } },
                populate: {
                    path: 'liveClasses',
                    options: { sort: { order: 1 } },
                }
            });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/course/:slug', async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate('instructors', 'profileInfo.firstName profileInfo.lastName')
            .populate({
                path: 'chapters',
                options: { sort: { order: 1 } },
                populate: [{
                    path: 'lessons',
                    options: { sort: { order: 1 } },
                }, {
                    path: 'liveClasses',
                    options: { sort: { 'schedule.startTime': 1 } },
                }]
            });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/course', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        // Ensure the creator is listed as an instructor
        if (!req.body.instructors || !req.body.instructors.includes(req.user._id.toString())) {
            req.body.instructors = [...(req.body.instructors || []), req.user._id];
        }
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ message: 'Invalid course data', error: error.message });
    }
});

router.put('/course/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('instructors', 'username email profileInfo.firstName profileInfo.lastName')
          .populate('coupons', 'code discountType discountValue');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(400).json({ message: 'Invalid course data', error: error.message });
    }
});

router.delete('/course/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const course = await Course.findById(req.params.id).session(session);
        if (!course) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Course not found' });
        }
        // The pre('remove'/'deleteOne') hooks on the Course, Chapter, and Lesson models will handle cascade deletes.
        await course.deleteOne({ session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Course and all its contents deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server error during course deletion', error: error.message });
    } finally {
        session.endSession();
    }
});

// --- Chapter Routes ---

router.post('/courses/:courseId/chapters', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const course = await Course.findById(req.params.courseId).session(session);
        if (!course) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Course not found' });
        }
        const order = course.chapters.length; // Chapters are 0-indexed
        const newChapter = new Chapter({
            ...req.body,
            course: course._id,
            order,
        });
        await newChapter.save({ session });
        course.chapters.push(newChapter._id);
        await course.save({ session });
        await session.commitTransaction();
        res.status(201).json(newChapter);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: 'Invalid chapter data', error: error.message });
    } finally {
        session.endSession();
    }
});

router.put('/chapters/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        res.status(200).json(chapter);
    } catch (error) {
        res.status(400).json({ message: 'Invalid chapter data', error: error.message });
    }
});

router.delete('/chapters/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const operation = async (currentSession) => {
            const chapter = await Chapter.findById(req.params.id).session(currentSession);
            if (!chapter) {
                const notFoundError = new Error('Chapter not found');
                notFoundError.statusCode = 404;
                throw notFoundError;
            }
            // The pre('deleteOne') hook on the Chapter model handles deleting associated lessons and live classes.
            await Course.findByIdAndUpdate(chapter.course, {
                $pull: { chapters: chapter._id }
            }, { session: currentSession });
            await chapter.deleteOne({ session: currentSession });
            return { message: 'Chapter and its content deleted successfully' };
        };
        const result = await withRetry(session, operation);
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during chapter deletion', error: error.message });
    } finally {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
    }
});


router.put('/courses/:courseId/chapters/reorder', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { chapterIds } = req.body;
        if (!Array.isArray(chapterIds)) {
            return res.status(400).json({ message: 'Invalid chapterIds array' });
        }
        const updates = chapterIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, course: req.params.courseId },
                update: { $set: { order: index } }
            }
        }));
        await Chapter.bulkWrite(updates, { session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Chapters reordered successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        session.endSession();
    }
});

// --- Lesson Routes ---

router.post('/chapters/:chapterId/lessons', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const chapter = await Chapter.findById(req.params.chapterId).session(session);
        if (!chapter) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Chapter not found' });
        }
        const newLesson = new Lesson({
            ...req.body,
            chapter: chapter._id,
            course: chapter.course,
            order: chapter.lessons.length
        });
        await newLesson.save({ session });
        chapter.lessons.push(newLesson._id);
        await chapter.save({ session });
        await session.commitTransaction();
        res.status(201).json(newLesson);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: 'Invalid lesson data', error: error.message });
    } finally {
        session.endSession();
    }
});

router.post('/chapters/:chapterId/lessons/ai', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { title, type, prompt } = req.body;
        if (!title || !type || !prompt) {
            return res.status(400).json({ message: 'Missing required fields: title, type, and prompt.' });
        }
        
        const chapter = await Chapter.findById(req.params.chapterId).session(session);
        if (!chapter) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Chapter not found.' });
        }

        let contentSchemaHint = '';
        switch (type) {
            case 'video':
                contentSchemaHint = `
                        "video": {
                            "duration": { "type": "NUMBER", "description": "Duration of the video in minutes, e.g., 30" },
                            "videoUrl": { "type": "STRING", "description": "URL of the video content, e.g., 'https://example.com/video.mp4'" }
                        }
                `;
                break;
            case 'article':
                contentSchemaHint = `
                        "article": {
                            "content": { "type": "STRING", "description": "Full markdown content of the article" },
                            "excerpt": { "type": "STRING", "description": "A short summary of the article, max 300 characters" },
                            "featuredImage": { "type": "STRING", "description": "Optional URL for a featured image, e.g., 'https://placehold.co/600x400/CCCCCC/000000?text=Article+Image'" },
                            "category": { "type": "STRING", "enum": ["Web Development", "Data Science", "Mobile Development", "Design", "Marketing", "Other"], "description": "Category of the article" },
                            "tags": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "List of relevant tags, e.g., ['react', 'javascript']" },
                            "isPublished": { "type": "BOOLEAN", "description": "Whether the article should be published, default to false" }
                        }
                `;
                break;
            case 'codingProblem':
                contentSchemaHint = `
                        "codingProblem": {
                            "description": { "type": "STRING", "description": "Detailed description of the coding problem, max 1000 characters" },
                            "difficulty": { "type": "STRING", "enum": ["easy", "medium", "hard"], "description": "Difficulty level of the problem" },
                            "starterCode": { "type": "STRING", "description": "Initial code snippet provided to the user" },
                            "solutionCode": { "type": "STRING", "description": "Complete solution code for the problem" },
                            "testCases": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "input": { "type": "STRING", "description": "Test case input (can be empty)" },
                                        "output": { "type": "STRING", "description": "Expected output for the test case" },
                                        "isHidden": { "type": "BOOLEAN", "description": "Whether the test case should be hidden from the user" }
                                    },
                                    "required": ["output"]
                                },
                                "description": "Array of test cases for the problem"
                            },
                            "allowedLanguages": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "List of allowed programming languages, e.g., ['javascript', 'python']" },
                            "points": { "type": "NUMBER", "description": "Points awarded for solving the problem, e.g., 10" },
                            "hints": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Optional hints for the problem" },
                            "topics": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Relevant topics, e.g., ['arrays', 'recursion']" }
                        }
                `;
                break;
            case 'quiz':
                contentSchemaHint = `
                        "quiz": {
                            "quizInstructions": { "type": "STRING", "description": "Instructions for the quiz, max 1000 characters" },
                            "questions": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "questionText": { "type": "STRING", "description": "The text of the question, max 500 characters" },
                                        "questionType": { "type": "STRING", "enum": ["single-choice", "multiple-choice", "true-false", "short-answer", "fill-in-the-blank"], "description": "Type of question" },
                                        "options": {
                                            "type": "ARRAY",
                                            "items": {
                                                "type": "OBJECT",
                                                "properties": {
                                                    "optionText": { "type": "STRING", "description": "Text of the option" },
                                                    "isCorrect": { "type": "BOOLEAN", "description": "Whether this option is correct" }
                                                },
                                                "required": ["optionText"]
                                            },
                                            "description": "Options for single/multiple choice questions"
                                        },
                                        "correctAnswer": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Correct answer(s) for short answer/fill-in-the-blank" },
                                        "explanation": { "type": "STRING", "description": "Explanation for the answer, max 500 characters" },
                                        "points": { "type": "NUMBER", "description": "Points for this question, e.g., 1" }
                                    },
                                    "required": ["questionText", "questionType", "points"]
                                },
                                "description": "Array of quiz questions"
                            },
                            "passScore": { "type": "NUMBER", "description": "Percentage score required to pass, e.g., 50" },
                            "attemptsAllowed": { "type": "NUMBER", "description": "Number of attempts allowed, e.g., 1" },
                            "shuffleQuestions": { "type": "BOOLEAN", "description": "Whether to shuffle questions, default to false" },
                            "showCorrectAnswersImmediately": { "type": "BOOLEAN", "description": "Whether to show correct answers immediately, default to false" }
                        }
                `;
                break;
            case 'contest':
                contentSchemaHint = `
                        "contest": {
                            "description": { "type": "STRING", "description": "Description of the contest, max 1000 characters" },
                            "startTime": { "type": "STRING", "format": "date-time", "description": "Start time of the contest in ISO format, e.g., '2025-08-27T10:00:00Z'" },
                            "endTime": { "type": "STRING", "format": "date-time", "description": "End time of the contest in ISO format, e.g., '2025-08-27T12:00:00Z'" },
                            "problems": {
                                "type": "ARRAY",
                                "items": { "type": "STRING", "description": "IDs of coding problems included in the contest (referencing Lesson._id of type codingProblem)" },
                                "description": "List of coding problem IDs for the contest"
                            },
                            "maxParticipants": { "type": "NUMBER", "description": "Maximum number of participants, e.g., 100" },
                            "isPublic": { "type": "BOOLEAN", "description": "Whether the contest is public, default to true" },
                            "rules": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "List of contest rules" },
                            "prices": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "position": { "type": "NUMBER", "description": "Winning position, e.g., 1" },
                                        "amount": { "type": "NUMBER", "description": "Prize amount, e.g., 500" }
                                    },
                                    "required": ["position", "amount"]
                                },
                                "description": "List of prizes for different positions"
                            },
                            "status": { "type": "STRING", "enum": ["upcoming", "ongoing", "completed", "cancelled"], "description": "Current status of the contest, default to 'upcoming'" }
                        }
                `;
                break;
            default:
                contentSchemaHint = `{}`;
        }

        const aiPrompt = `Generate a JSON object for a "${type}" lesson based on this prompt: "${prompt}". The JSON should strictly adhere to the following schema structure. Ensure all required fields for the specified lesson type are populated with realistic and relevant data. Also, generate 3-5 high-quality external resources (e.g., links to official documentation, tutorials, articles) that are relevant to the lesson's topic. Do not include any extra text or markdown formatting outside the JSON object and dont include that **.

        {
            "title": "Lesson Title",
            "description": "Short description of the lesson.",
            "isFree": { "type": "BOOLEAN", "description": "Whether the lesson is free, default to false" },
            "type": "${type}",
            "content": {
                ${contentSchemaHint}
            },
            "resources": {
                "type": "ARRAY",
                "description": "List of external resources for this lesson.",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": { "type": "STRING", "description": "Title of the resource." },
                        "url": { "type": "STRING", "description": "URL of the resource." },
                        "type": { "type": "STRING", "enum": ["pdf", "doc", "zip", "link", "image", "other"], "description": "Type of resource." }
                    }
                }
            }
        }
        `;

        const response = await axios.post(`${GEMINI_API_URL}`, {
            contents: [{ parts: [{ text: aiPrompt }] }]
        });
        
        let generatedContent = response.data.candidates[0].content.parts[0].text;

        const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            generatedContent = jsonMatch[1];
        } else {
            console.warn("Gemini response did not contain JSON in a markdown block. Attempting direct parse.");
        }

        const lessonData = JSON.parse(generatedContent);

        const newLesson = new Lesson({
            title: lessonData.title,
            description: lessonData.description,
            isFree: lessonData.isFree || false,
            type: lessonData.type,
            content: lessonData.content,
            resources: lessonData.resources || [], // Use the generated resources
            chapter: chapter._id,
            course: chapter.course,
            order: chapter.lessons.length,
        });

        if (newLesson.type === 'article' && newLesson.content?.article) {
            newLesson.content.article.author = req.user._id;
        }

        await newLesson.save({ session });
        
        chapter.lessons.push(newLesson._id);
        await chapter.save({ session });

        await session.commitTransaction();
        session.endSession();
        
        res.status(201).json({
            message: 'Lesson created successfully with AI assistance',
            lesson: newLesson
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating AI lesson:', error);
        res.status(500).json({
            message: 'Failed to create lesson with AI assistance. Check the server logs for more details.',
            error: error.response?.data || error.message
        });
    }
});


router.put('/lessons/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.status(200).json(lesson);
    } catch (error) {
        res.status(400).json({ message: 'Invalid lesson data', error: error.message });
    }
});

router.delete('/lessons/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const lesson = await Lesson.findById(req.params.id).session(session);
        if (!lesson) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Lesson not found' });
        }
        // The pre('deleteOne') hook on Lesson model handles pulling from user records and chapter
        await lesson.deleteOne({ session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        session.endSession();
    }
});

router.put('/chapters/:chapterId/lessons/reorder', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { lessonIds } = req.body;
        if (!Array.isArray(lessonIds)) {
            return res.status(400).json({ message: 'Invalid lessonIds array' });
        }
        const updates = lessonIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, chapter: req.params.chapterId },
                update: { $set: { order: index } }
            }
        }));
        await Lesson.bulkWrite(updates, { session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Lessons reordered successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        session.endSession();
    }
});

// --- Live Class Routes (Jitsi) ---

router.post('/chapters/:chapterId/live-classes', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const chapter = await Chapter.findById(req.params.chapterId).session(session);
        if (!chapter) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Chapter not found' });
        }
        const newLiveClass = new LiveClass({
            ...req.body,
            chapter: chapter._id,
            instructor: req.body.instructor || req.user._id,
        });
        await newLiveClass.save({ session });
        chapter.liveClasses.push(newLiveClass._id);
        await chapter.save({ session });
        await session.commitTransaction();

        // Send notifications after the transaction is successfully committed
        sendLiveClassNotification(newLiveClass._id, 'created').catch(err => {
             console.error('Notification sending failed non-blockingly:', err);
        });

        res.status(201).json(newLiveClass);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: 'Failed to create live class', error: error.message });
    } finally {
        session.endSession();
    }
});

router.get('/chapters/:chapterId/live-classes', protect, async (req, res) => {
    try {
        const liveClasses = await LiveClass.find({ chapter: req.params.chapterId })
            .populate('instructor', 'profileInfo.firstName profileInfo.lastName')
            .sort({ 'schedule.startTime': 1 });
        res.status(200).json(liveClasses);
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving live classes', error: error.message });
    }
});

router.get('/live-classes/:id', protect, async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id)
            .populate('instructor', 'profileInfo.firstName profileInfo.lastName');
        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }
        res.status(200).json(liveClass);
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving live class', error: error.message });
    }
});

router.put('/live-classes/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const liveClass = await LiveClass.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }
        
        // Send notifications about the update
        sendLiveClassNotification(liveClass._id, 'updated').catch(err => {
            console.error('Notification sending failed non-blockingly:', err);
        });

        res.status(200).json(liveClass);
    } catch (error) {
        res.status(400).json({ message: 'Invalid live class data', error: error.message });
    }
});

router.delete('/live-classes/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const liveClass = await LiveClass.findById(req.params.id).session(session);
        if (!liveClass) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Live class not found' });
        }
        await Chapter.findByIdAndUpdate(liveClass.chapter, {
            $pull: { liveClasses: liveClass._id }
        }, { session });
        await liveClass.deleteOne({ session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Live class deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server error during live class deletion', error: error.message });
    } finally {
        session.endSession();
    }
});

// --- Doubt and Reply Routes ---

router.post('/lessons/:lessonId/doubts', protect, async (req, res) => {
    try {
        const { question } = req.body;
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        const newDoubt = {
            user: req.user._id,
            question,
        };
        lesson.doubts.push(newDoubt);
        await lesson.save();
        
        res.status(201).json({ message: 'Doubt submitted successfully', doubt: lesson.doubts[lesson.doubts.length - 1] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/lessons/:lessonId/doubts/:doubtId/replies', protect, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const { content } = req.body;
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        const doubt = lesson.doubts.id(req.params.doubtId);
        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }
        const newReply = {
            user: req.user._id,
            content,
        };
        doubt.answers.push(newReply);
        doubt.status = 'answered';
        await lesson.save();
        res.status(201).json({ message: 'Reply added successfully', reply: newReply });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/lessons/:lessonId/doubts/:doubtId/resolve', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

        const doubt = lesson.doubts.id(req.params.doubtId);
        if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

        if (doubt.user.toString() !== req.user._id.toString() && !['admin', 'instructor'].includes(req.user.role)) {
            return res.status(403).json({ message: 'You are not authorized to resolve this doubt' });
        }
        doubt.status = 'resolved';
        await lesson.save();
        res.status(200).json({ message: 'Doubt marked as resolved' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;