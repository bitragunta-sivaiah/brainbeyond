import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

// Helper function to send notifications
const sendNotification = async (userId, title, message, type, itemId, itemType, navigateLink) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedItem: { itemId, itemType },
            navigateLink
        });
        console.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
    }
};

// Helper function to safely parse potentially malformed JSON from AI
const cleanAndParseJson = (text) => {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON object found in AI response.');
    }
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const cleanedString = jsonString.replace(/```json|```/g, '').trim();

    return JSON.parse(cleanedString);
};

// --- CORRECTED SECTION 1: AI generation for course details only ---
// Helper function to generate course content using Gemini API
const generateCourseContent = async (courseTitle) => {
    const prompt = `
        You are an expert online course creator. Generate comprehensive and modern course metadata in JSON format for a course titled "${courseTitle}".

        The JSON object must strictly adhere to the following structure and guidelines and using Html tags for formatting where appropriate (e.g., <b>, <i>, <ul>, <li>, etc.):
        {
          "courseDescription": "A detailed, engaging, and professional description of the course. Explain what the student will learn and how it will benefit their career. and use HTML tags for formatting. and it contain all about for complete course structure",
          "shortDescription": "A concise, 1-2 sentence summary for previews and social media sharing.",
          "category": "Web Development", // Choose from predefined categories: 'Web Development', 'Data Science', 'Mobile Development', 'Design', 'Marketing', 'Other' and if other, provide a customCategoryName.
          "level": "intermediate",
          "language": "English",
          "prerequisites": ["List 3-5 key skills or technologies a student needs to know before starting."],
          "tags": ["tag1", "tag2", "tag3"]
        }

        Follow these rules strictly:
        1. The entire response must be a single, valid JSON object.
        2. Do not include any text before or after the JSON.
        3. Do not include markdown code block formatting (e.g., \`\`\`json).
        4. All fields must be populated with realistic and high-quality data relevant to the course title.
    `;

    try {
        const response = await axios.post(GEMINI_API_URL, {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const generatedText = response.data.candidates[0].content.parts[0].text;
        const jsonResponse = cleanAndParseJson(generatedText);

        if (!jsonResponse || !jsonResponse.courseDescription) {
            throw new Error('AI generated invalid or incomplete course metadata.');
        }

        return jsonResponse;
    } catch (error) {
        console.error('Error generating course content from AI:', error.response ? error.response.data : error.message);
        throw new Error(`Failed to generate course content from AI: ${error.message}`);
    }
};

// @desc    Create a new course (AI-powered or manual)
// @route   POST /api/courses
// @access  Private (Admin, Instructor)
router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            title, instructors, thumbnail, previewVideo, isFeatured, isPublished,
            price, discountedPrice, isFree, isIncludedInSubscription, availableInPlans,
            useAiGeneration, description, shortDescription, category, customCategoryName,
            prerequisites, level, language, tags
        } = req.body;

        if (!title || !instructors) {
            return res.status(400).json({ message: 'Course title and instructors are required.' });
        }

        const validInstructorIds = instructors.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validInstructorIds.length !== instructors.length) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'One or more instructor IDs are invalid.' });
        }
        
        let courseData = {
            title,
            instructors: validInstructorIds,
            thumbnail,
            previewVideo,
            isFeatured,
            isPublished,
            price,
            discountedPrice,
            isFree,
            isIncludedInSubscription,
            availableInPlans,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        };

        if (useAiGeneration) {
            const aiGeneratedContent = await generateCourseContent(title);
            
            // Overwrite fields with AI-generated content
            courseData = {
                ...courseData,
                description: aiGeneratedContent.courseDescription,
                shortDescription: aiGeneratedContent.shortDescription,
                category: aiGeneratedContent.category,
                prerequisites: aiGeneratedContent.prerequisites,
                level: aiGeneratedContent.level,
                language: aiGeneratedContent.language,
                tags: aiGeneratedContent.tags || [],
            };
        } else {
            // Assign manual fields
            courseData = {
                ...courseData,
                description, shortDescription, category, customCategoryName,
                prerequisites, level, language, tags
            };
        }

        const course = new Course(courseData);
        const createdCourse = await course.save({ session });
        
        await session.commitTransaction();
        session.endSession();

        // Notify instructors about the new course
        const navigateLink = `/course/${createdCourse.slug}`;
        for (const instructorId of createdCourse.instructors) {
            await sendNotification(
                instructorId,
                'New Course Created!',
                `The course "${createdCourse.title}" has been successfully created and you are an assigned instructor.`,
                'course',
                createdCourse._id,
                'Course',
                navigateLink
            );
        }

        const populatedCourse = await Course.findById(createdCourse._id)
            .populate('instructors', 'username email profileInfo.firstName profileInfo.lastName');
        
        return res.status(201).json(populatedCourse);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error creating course:', error);

        switch (error.name) {
            case 'ValidationError':
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({ message: messages.join(', ') });
            case 'MongoServerError':
                if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                    return res.status(400).json({ message: 'A course with this title already exists. Please choose a different title.' });
                }
            default:
                return res.status(500).json({ message: 'Server error' });
        }
    }
});


// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({})
            .populate('instructors', ' username email profileInfo.firstName profileInfo.lastName')
            .populate({
                path: 'chapters',
                options: { sort: { position: 1 } },
                populate: { path: 'lessons', options: { sort: { order: 1 } } }
            })
            .populate('coupons', 'code discountType discountValue');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get single course by slug
// @route   GET /api/courses/:slug
// @access  Public
router.get('/:slug', async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate('instructors', ' username email profileInfo.firstName profileInfo.lastName')
            .populate({
                path: 'chapters',
                options: { sort: { position: 1 } },
                populate: { path: 'lessons', options: { sort: { order: 1 } } }
            })
            .populate('enrolledStudents.user', 'username email profileInfo.firstName profileInfo.lastName')
            .populate('reviews.user', 'username profileInfo.firstName profileInfo.lastName')
            .populate('coupons', 'code discountType discountValue startDate endDate isActive');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Error fetching course by slug:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update a course
// @route   PUT /api/courses/:slug
// @access  Private (Admin, Instructor)
router.put('/:slug', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const {
            title, description, shortDescription, thumbnail, previewVideo, category, customCategoryName,
            instructors, prerequisites, level, language, duration, price, discountedPrice,
            isFree, isFeatured, isPublished, tags,
        } = req.body;
        const course = await Course.findOne({ slug: req.params.slug }).populate('enrolledStudents.user', '_id');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const isAssignedInstructor = course.instructors.some(inst => inst.toString() === req.user._id.toString());
        if (req.user.role !== 'admin' && !isAssignedInstructor) {
            return res.status(403).json({ message: 'Not authorized to update this course. You must be an admin or an assigned instructor.' });
        }

        const originalTitle = course.title;
        course.title = title ?? course.title;
        course.description = description ?? course.description;
        course.shortDescription = shortDescription ?? course.shortDescription;
        course.thumbnail = thumbnail ?? course.thumbnail;
        course.previewVideo = previewVideo ?? course.previewVideo;
        course.category = category ?? course.category;
        course.customCategoryName = category === 'Other' ? (customCategoryName ?? course.customCategoryName) : undefined;
        if (instructors !== undefined) {
            const validInstructorIds = instructors.filter(id => mongoose.Types.ObjectId.isValid(id));
            if (validInstructorIds.length !== instructors.length) {
                return res.status(400).json({ message: 'One or more instructor IDs are invalid in the update request.' });
            }
            course.instructors = validInstructorIds;
        }
        course.prerequisites = prerequisites ?? course.prerequisites;
        course.level = level ?? course.level;
        course.language = language ?? course.language;
        course.duration = duration ?? course.duration;
        course.price = price ?? course.price;
        course.discountedPrice = discountedPrice ?? course.discountedPrice;
        course.isFree = isFree ?? course.isFree;
        course.isFeatured = isFeatured ?? course.isFeatured;
        course.isPublished = isPublished ?? course.isPublished;
        course.tags = tags ?? course.tags;
        
        const updatedCourse = await course.save();

        if (updatedCourse.title !== originalTitle) {
            const enrolledStudentIds = course.enrolledStudents.map(s => s.user._id);
            const navigateLink = `/course/${updatedCourse.slug}`;
            for (const studentId of enrolledStudentIds) {
                await sendNotification(
                    studentId,
                    'Course Updated!',
                    `The course you are enrolled in, "${originalTitle}", has been updated and renamed to "${updatedCourse.title}".`,
                    'course',
                    updatedCourse._id,
                    'Course',
                    navigateLink
                );
            }
        }

        const populatedCourse = await Course.findById(updatedCourse._id)
            .populate('instructors', 'username email profileInfo.firstName profileInfo.lastName')
            .populate('coupons', 'code discountType discountValue');
        res.json(populatedCourse);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            return res.status(400).json({ message: 'Course with this title already exists. Please choose a different title.' });
        }
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- CORRECTED SECTION 2: Delete route without transaction to prevent timeout ---
// @desc    Delete a course
// @route   DELETE /api/courses/:slug
// @access  Private (Admin)
router.delete('/:slug', protect, authorize('admin'), async (req, res) => {
    try {
        // Find the course without starting a session
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Get enrolled student IDs before deleting
        const enrolledStudentIds = course.enrolledStudents.map(s => s.user);

        // Remove course from all user enrollments
        await User.updateMany(
            { 'enrolledCourses.course': course._id },
            { $pull: { enrolledCourses: { course: course._id } } }
        );

        // Remove course from all user purchase histories
        await User.updateMany(
            { 'enrollCoursePurchase.course': course._id },
            { $pull: { enrollCoursePurchase: { course: course._id } } }
        );

        // Delete all chapters and lessons associated with the course
        await Chapter.deleteMany({ course: course._id });
        await Lesson.deleteMany({ course: course._id });

        // Delete the course itself
        await Course.deleteOne({ _id: course._id });

        // Send notifications to enrolled students that the course has been deleted
        for (const studentId of enrolledStudentIds) {
            await sendNotification(
                studentId,
                'Course Removed',
                `The course "${course.title}" has been permanently removed from the platform.`,
                'course',
                course._id,
                'Course',
                '/' // Or a generic dashboard link
            );
        }

        res.json({ message: 'Course and all related data removed successfully' });

    } catch (error) {
        // Since there's no transaction, we just log the error and send a response
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Server error during course deletion.' });
    }
});

// @desc    Add coupons to a course
// @route   PUT /api/courses/:slug/add-coupons
// @access  Private (Admin, Instructor)
router.put('/:slug/add-coupons', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { couponIds } = req.body;
        if (!couponIds || !Array.isArray(couponIds) || couponIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of coupon IDs.' });
        }
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        const isAssignedInstructor = course.instructors.some(inst => inst.toString() === req.user._id.toString());
        if (req.user.role !== 'admin' && !isAssignedInstructor) {
            return res.status(403).json({ message: 'Not authorized to add coupons to this course. You must be an admin or an assigned instructor.' });
        }
        const validCouponIds = couponIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const uniqueCouponIds = [...new Set(validCouponIds)];
        uniqueCouponIds.forEach(couponId => {
            if (!course.coupons.includes(couponId)) {
                course.coupons.push(couponId);
            }
        });
        await course.save();
        const populatedCourse = await Course.findById(course._id)
            .populate('instructors', 'username email profileInfo.firstName profileInfo.lastName')
            .populate('coupons', 'code discountType discountValue');
        res.status(200).json({ message: 'Coupons added to course successfully.', course: populatedCourse });
    } catch (error) {
        console.error('Error adding coupons to course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Remove coupons from a course
// @route   PUT /api/courses/:slug/remove-coupons
// @access  Private (Admin, Instructor)
router.put('/:slug/remove-coupons', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { couponIds } = req.body;
        if (!couponIds || !Array.isArray(couponIds) || couponIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of coupon IDs to remove.' });
        }
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        const isAssignedInstructor = course.instructors.some(inst => inst.toString() === req.user._id.toString());
        if (req.user.role !== 'admin' && !isAssignedInstructor) {
            return res.status(403).json({ message: 'Not authorized to remove coupons from this course. You must be an admin or an assigned instructor.' });
        }
        course.coupons = course.coupons.filter((existingCouponId) => !couponIds.includes(existingCouponId.toString()));
        await course.save();
        const populatedCourse = await Course.findById(course._id)
            .populate('instructors', 'username email profileInfo.firstName profileInfo.lastName')
            .populate('coupons', 'code discountType discountValue');
        res.status(200).json({ message: 'Coupons removed from course successfully.', course: populatedCourse });
    } catch (error) {
        console.error('Error removing coupons from course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all instructors (users with role 'instructor')
// @route   GET /api/courses/instructors
// @access  Private (Admin, Instructor)
router.get('/instructors', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const instructors = await User.find({ role: 'instructor' }).select('username email profileInfo.firstName profileInfo.lastName');
        res.json(instructors);
    } catch (error) {
        console.error('Error fetching instructors:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;