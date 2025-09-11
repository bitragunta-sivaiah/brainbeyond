import express from 'express';
import axios from 'axios';
import { protect, authorize } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
// Import Mongoose Models
import Certificate from '../models/CourseCertificate.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendEmail = async (options) => {
    try {
        const message = {
            from: `${process.env.FROM_NAME || 'Support'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${options.subject}</title>
                    <style>
                        body {
                            font-family: 'Poppins', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border: 1px solid #ddd;
                            border-radius: 10px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                        }
                        .header {
                            text-align: center;
                            padding-bottom: 20px;
                            border-bottom: 1px solid #eee;
                        }
                        .logo {
                            display: inline-block;
                            vertical-align: middle;
                        }
                        .logo svg {
                            height: 40px;
                            width: 40px;
                            fill: #2f27ce;
                            bgcolor: #f4f4f4; 
                            border-radius: 50%;
                            padding: 5px;
                        }
                        .brand-name {
                            font-family: 'Manrope', sans-serif;
                            color: #2f27ce;
                            font-size: 24px;
                            margin: 10px 0 0;
                        }
                        .content {
                            padding: 20px 0;
                        }
                        .content h2 {
                            font-family: 'Poppins', sans-serif;
                            font-size: 22px;
                            margin-top: 0;
                            color: #2f27ce;
                        }
                        .content p {
                            font-family: 'Poppins', sans-serif;
                            font-size: 16px;
                            color: #555;
                        }
                        .button-link {
                            display: inline-block;
                            padding: 12px 24px;
                            margin-top: 20px;
                            background-color: #2f27ce;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                        }
                        .footer {
                            text-align: center;
                            padding-top: 20px;
                            border-top: 1px solid #eee;
                            font-size: 12px;
                            color: #888;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">
                                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#2f27ce">
                                    <title>Brain Beyond</title>
                                    <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
                                </svg>
                            </div>
                            <h1 class="brand-name">Brain Beyond</h1>
                        </div>
                        
                        <div class="content">
                            <h2>${options.title}</h2>
                            <p>${options.message}</p>
                            ${options.navigateLink ? `<a href="${options.navigateLink}" class="button-link">View Certificate</a>` : ''}
                        </div>
                        
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Brain Beyond. All rights reserved.</p>
                            <p>If you did not expect this email, please ignore it.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        await transporter.sendMail(message);
        console.log('Notification email sent to:', options.email);
    } catch (error) {
        console.error('Error sending notification email:', error);
        throw new Error('Email could not be sent.');
    }
};

// --- Helper Function to Check Course Access and determine its type ---
const checkCourseAccessAndType = async (userId, courseId) => {
    if (!userId || !courseId) return { hasAccess: false, type: 'Unknown' };

    const user = await User.findById(userId).populate({
        path: 'purchasedSubscriptions.subscription',
        model: 'Subscription'
    });

    if (!user) return { hasAccess: false, type: 'Unknown' };

    // 1. Check for direct free enrollment
    const isDirectlyFreeEnrolled = user.enrolledCourses.some(c => c.course && c.course.equals(courseId));
    if (isDirectlyFreeEnrolled) {
        const course = await Course.findById(courseId).select('isFree');
        if (course && course.isFree) {
            return { hasAccess: true, type: 'Free Course' };
        }
    }

    // 2. Check for direct purchase
    const isDirectlyPurchased = user.enrollCoursePurchase.some(c => c.course && c.course.equals(courseId));
    if (isDirectlyPurchased) {
        return { hasAccess: true, type: 'Purchased Course' }; 
    }

    // 3. Check for access via an active subscription
    for (const sub of user.purchasedSubscriptions) {
        // Ensure the subscription is active and its end date is in the future or not set (for lifetime)
        const isActive = sub.isActive && (!sub.endDate || sub.endDate > new Date());
        if (isActive && sub.subscription) {
            const plan = sub.subscription;
            if (plan.status === 'active' && (plan.courses.isAllIncluded || plan.courses.includedCourses.some(id => id && id.equals(courseId)))) {
                let subscriptionType = '';
                const billingCycle = plan.pricing.billingCycle; // Get billing cycle here

                // Use a more robust mapping based on billingCycle and planType combination
                if (plan.planType === 'free') {
                    subscriptionType = 'Free Subscription Plan';
                } else if (billingCycle === 'monthly') {
                    // Assuming monthly plans are 'Basic' as per your enum
                    subscriptionType = 'Basic Monthly Subscription'; 
                } else if (billingCycle === 'yearly') {
                    // Assuming yearly plans are 'Standard' as per your enum
                    subscriptionType = 'Standard Yearly Subscription'; 
                } else if (billingCycle === 'quarterly') {
                    // If a quarterly plan has a 'basic' planType (as per your data),
                    // but the enum only has 'Pro Quarterly Subscription', we map it here.
                    // This handles the potential inconsistency where a 'Pro Quarterly' plan
                    // might have a 'Pro Quarterly' planType stored in the database.
                    subscriptionType = 'Pro Quarterly Subscription'; 
                } else if (billingCycle === 'lifetime') {
                    // Assuming lifetime plans are 'Premium' as per your enum
                    subscriptionType = 'Premium Lifetime Subscription'; 
                } else {
                    // Fallback for any other combinations not explicitly handled
                    const planTypeName = plan.planType ? plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1) : 'Unknown';
                    const billingCycleName = billingCycle ? billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1) : 'Unknown';
                    subscriptionType = `${planTypeName} ${billingCycleName} Subscription`;
                }
                return { hasAccess: true, type: subscriptionType };
            }
        }
    }

    return { hasAccess: false, type: 'Unknown' };
};

// --- Helper Function to Check Course Completion (Updated to use Progress model) ---
const checkCourseCompletion = async (userId, courseId) => {
    if (!userId || !courseId) return false;

    // Find the progress document for the specific user and course
    const progressRecord = await Progress.findOne({ user: userId, course: courseId });

    // Return true if a progress record exists and its progressPercentage is 100
    return progressRecord && progressRecord.progressPercentage === 100;
};

// --- ROUTES ---

/**
 * @desc    Issue a new certificate for the logged-in user
 * @route   POST /api/v1/certificates
 * @access  Private (Any logged-in user can request for their own completed course)
 */
router.post('/', protect, async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id; // Get user ID from the 'protect' middleware

        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Valid Course ID is required.' });
        }

        // 1. Check for existing certificate to prevent duplicates
        const existingCert = await Certificate.findOne({ user: userId, course: courseId });
        if (existingCert) {
            return res.status(400).json({ message: 'Certificate already issued for this course.' });
        }
        
        // 2. Verify the user has legitimate access to the course via any method
        const accessInfo = await checkCourseAccessAndType(userId, courseId);
        if (!accessInfo.hasAccess) {
            return res.status(403).json({ message: 'You do not have access to this course.' });
        }

        // 3. CRITICAL FIX: Verify course completion using the Progress model.
        const isCompleted = await checkCourseCompletion(userId, courseId);
        if (!isCompleted) {
            return res.status(403).json({ message: 'You must complete the course to receive a certificate.' });
        }

        // 4. Get user, course, and instructor details. Fetch `username` for the email message.
        const user = await User.findById(userId).select('username email notificationPreferences');
        const course = await Course.findById(courseId).populate({
            path: 'instructors',
            select: 'profileInfo.firstName profileInfo.lastName'
        });

        if (!user || !course) {
            return res.status(404).json({ message: 'User or course not found.' });
        }

        const instructorNames = course.instructors
            .filter(inst => inst && inst.profileInfo) // Filter out null instructors and those without profileInfo
            .map(inst => `${inst.profileInfo.firstName} ${inst.profileInfo.lastName}`.trim())
            .join(', ');

        // 5. Use Gemini AI to generate a congratulatory message (optional)
        // Use user.username in the prompt as requested.
        const prompt = `Generate a concise, professional, one-sentence congratulatory message for a certificate. The student's name is ${user.username}, the course is "${course.title}", and the instructor is ${instructorNames}.`;

        let aiGeneratedMessage = "Congratulations on completing your course!"; // Default message
        try {
            const geminiResponse = await axios.post(GEMINI_API_URL, {
                contents: [{ parts: [{ text: prompt }] }],
            });
            aiGeneratedMessage = geminiResponse.data.candidates[0].content.parts[0].text;
        } catch (aiError) {
            console.warn('Gemini AI message generation failed, using default message:', aiError.message);
        }

        // 6. Create the certificate record in the database
        const newCertificate = await Certificate.create({
            user: userId,
            course: courseId,
            courseTitle: course.title,
            instructorName: instructorNames,
            certificateUrl: `/certs/placeholder/${Date.now()}.pdf`, // Placeholder URL
            courseDesignType: accessInfo.type, // Store the determined course design type
            generationInfo: {
                generatedBy: 'ai',
                aiModel: 'Gemini 1.5 Flash'
            },
        });

        await User.findByIdAndUpdate(userId, {
            $push: { certificates: newCertificate._id }
        }, { new: true });

        const notificationTitle = `Certificate Issued: ${course.title}`;
        const notificationMessage = aiGeneratedMessage;
        
        // Use a full URL for the email link as requested
        const notificationLink = `${process.env.CLIENT_URL}/certificates/${newCertificate._id}`;
        
        // 7. Create and save a notification document
        await Notification.create({
            user: userId,
            title: notificationTitle,
            message: notificationMessage,
            navigateLink: notificationLink,
            type: 'course',
            relatedItem: {
                itemType: 'Certificate',
                itemId: newCertificate._id
            }
        });

        // 8. Send an email notification if the user has opted in
        if (user.notificationPreferences.email.courseUpdates) {
            await sendEmail({
                email: user.email,
                title: notificationTitle,
                message: notificationMessage,
                navigateLink: notificationLink,
            });
        }

        // After creating, re-fetch the document and populate all necessary fields
        const populatedCertificate = await Certificate.findById(newCertificate._id)
            .populate('user', 'username email profileInfo')
            .populate('course', 'title thumbnail');

        res.status(201).json({ success: true, data: populatedCertificate, aiMessage: aiGeneratedMessage, message: 'Certificate and notification issued successfully.' });

    } catch (error) {
        console.error('Certificate Issuance Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Server error during certificate issuance.' });
    }
});


/**
 * @desc    Get all certificates for the logged-in user
 * @route   GET /api/v1/certificates/my-certificates
 * @access  Private
 */
router.get('/my-certificates', protect, async (req, res) => {
    try {
        const certificates = await Certificate.find({ user: req.user.id })
            .populate('course', 'title thumbnail')
            .populate('user', 'username email profileInfo.firstName profileInfo.lastName profileInfo.avatar')
            .sort({ issueDate: -1 });

        res.status(200).json({ success: true, count: certificates.length, data: certificates });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


/**
 * @desc    Public route to verify a certificate's authenticity
 * @route   GET /api/v1/certificates/verify/:verificationToken
 * @access  Public
 */
router.get('/verify/:verificationToken', async (req, res) => {
    try {
        const { verificationToken } = req.params;
        const certificate = await Certificate.findOne({ verificationToken })
            .populate('user', 'profileInfo.firstName profileInfo.lastName');

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found or invalid.' });
        }

        // Return only public-safe information
        res.status(200).json({
            success: true,
            message: 'Certificate is valid.',
            data: {
                studentName: `${certificate.user.profileInfo.firstName} ${certificate.user.profileInfo.lastName}`,
                courseTitle: certificate.courseTitle,
                issueDate: certificate.issueDate,
                issuedBy: "Your Platform Name", // Replace with your platform's name
                courseDesignType: certificate.courseDesignType // Include the design type
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


/**
 * @desc    Get a single certificate by its ID
 * @route   GET /api/v1/certificates/:id
 * @access  Private (Owner or Admin)
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('user', 'username email profileInfo.firstName profileInfo.lastName')
            .populate('course');

        if (!certificate) {
            return res.status(404).json({ message: `Certificate not found with ID ${req.params.id}` });
        }

        // Security Check: Ensure the requester is the owner or an admin
        if (certificate.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to view this certificate.' });
        }

        res.status(200).json({ success: true, data: certificate });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


/**
 * @desc    Delete a certificate (Admin only)
 * @route   DELETE /api/v1/certificates/:id
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ message: `Certificate not found with ID ${req.params.id}` });
        }

        await certificate.deleteOne();

        res.status(200).json({ success: true, message: 'Certificate revoked successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;
