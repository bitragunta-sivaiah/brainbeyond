import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Import Models
import LiveClass from '../models/LiveClass.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import Subscription from '../models/Subscription.js';

// Import Middleware
import { protect, authorize } from '../middleware/authMiddleware.js';

dotenv.config();

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10), // Ensure port is a number
    secure: process.env.SMTP_PORT === '465', // True if port is 465 (SSL), false for 587 (TLS)
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

/**
 * Helper function to send a professionally styled email.
 * @param {object} options - Email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.emailTitle - Main title inside the email body.
 * @param {string} options.emailBodyHtml - HTML content for the main body of the email.
 * @param {string} [options.actionUrl] - URL for the call-to-action button.
 * @param {string} [options.actionText='Join Class'] - Text for the call-to-action button.
 */
const sendProfessionalEmail = async (options) => {
    const { to, subject, emailTitle, emailBodyHtml, actionUrl, actionText = 'Join Class' } = options;

    const htmlContent = `
    <div style="font-family: 'Poppins', sans-serif; background-color: #f8f8f8; padding: 20px; color: #333;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <tr>
          <td style="background-color: #2f27ce; padding: 30px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h1 style="margin: 0; font-size: 28px; font-family: 'Outfit', sans-serif;">HDS LMS</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <h2 style="font-size: 22px; color: #2f27ce; margin-top: 0; font-family: 'Outfit', sans-serif;">${emailTitle}</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${emailBodyHtml}</p>
            ${actionUrl ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 5px; background-color: #433bff;">
                          <a href="${actionUrl}" target="_blank" style="font-size: 16px; font-family: 'Poppins', sans-serif; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block; font-weight: bold;">
                            ${actionText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            ` : ''}
            <p style="font-size: 14px; color: #777; margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f1f3f5; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            &copy; ${new Date().getFullYear()} HDS LMS. All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  `;

    const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.SMTP_EMAIL}>`,
        to: to,
        subject: subject,
        html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Professional email sent to: %s', to);
};

// --- Zoom API Helper Functions ---

const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

const getZoomAccessToken = async () => {
    try {
        const authString = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            {},
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching Zoom access token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Zoom.');
    }
};

const createZoomMeeting = async (title, description, startTime, endTime) => {
    const accessToken = await getZoomAccessToken();
    const durationMinutes = Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60));
    const response = await axios.post(
        `https://api.zoom.us/v2/users/me/meetings`,
        {
            topic: title,
            type: 2, // Scheduled meeting
            start_time: new Date(startTime).toISOString(),
            duration: durationMinutes > 0 ? durationMinutes : 15, // Ensure duration is at least 1 minute
            timezone: 'Asia/Kolkata', // Default timezone
            agenda: description,
            settings: {
                join_before_host: true,
                mute_upon_entry: true,
                waiting_room: false,
                participant_video: false,
                host_video: true,
            },
        },
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data;
};

const updateZoomMeeting = async (meetingId, title, description, startTime, endTime) => {
    const accessToken = await getZoomAccessToken();
    const durationMinutes = Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60));
    const response = await axios.patch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
            topic: title,
            start_time: new Date(startTime).toISOString(),
            duration: durationMinutes > 0 ? durationMinutes : 15,
            agenda: description,
        },
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data;
};

// --- CRUD Routes for Live Classes ---

/**
 * @desc      Create a new live class
 * @route     POST /api/v1/liveclasses
 * @access    Private (Admin, Instructor)
 */
router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        // Since the model's platform is fixed to 'zoom', we don't need to destructure it from req.body
        const { title, description, courseId, chapterId, instructor, startTime, endTime } = req.body;

        // 1. Validate required fields
        if (!title || !courseId || !instructor || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields: title, courseId, instructor, startTime, and endTime.' });
        }

        // Validate time
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ success: false, message: 'End time must be after start time.' });
        }
        if (new Date(startTime) < new Date()) {
            return res.status(400).json({ success: false, message: 'Start time cannot be in the past.' });
        }

        // Meeting details will always be for Zoom as per the model
        const zoomData = await createZoomMeeting(title, description, startTime, endTime);
        const meetingDetails = {
            platform: 'zoom', // Fixed as per model
            meetingId: zoomData.id,
            password: zoomData.password,
            joinUrl: zoomData.join_url,
            startUrl: zoomData.start_url,
        };

        // 2. Create and save the live class document
        const liveClass = await LiveClass.create({
            title,
            slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, ''),
            description,
            course: courseId,
            chapter: chapterId,
            instructor,
            startTime,
            endTime,
            meetingDetails,
            status: 'scheduled',
        });

        // 3. Send Notifications to relevant users
        const course = await Course.findById(courseId);
        if (!course) {
            console.warn(`Course with ID ${courseId} not found for live class ${liveClass._id}. Notifications may be incomplete.`);
        }

        const userEmailsToNotify = new Set();
        const userIdsForInAppNotifications = new Set();

        // Add instructor's email and ID
        const instructorUser = await User.findById(instructor).select('email');
        if (instructorUser) {
            userEmailsToNotify.add(instructorUser.email);
            userIdsForInAppNotifications.add(instructorUser._id.toString());
        }

        // Add admin emails and IDs
        const admins = await User.find({ role: 'admin' }).select('email');
        admins.forEach(admin => {
            userEmailsToNotify.add(admin.email);
            userIdsForInAppNotifications.add(admin._id.toString());
        });

        // Add enrolled students' emails and IDs
        if (course && course.enrolledStudents.length > 0) {
            const enrolledUserIds = course.enrolledStudents.map(s => s.user);
            const enrolledUsers = await User.find({ _id: { $in: enrolledUserIds } }).select('email');
            enrolledUsers.forEach(user => {
                userEmailsToNotify.add(user.email);
                userIdsForInAppNotifications.add(user._id.toString());
            });
        }

        // Add subscribed students' emails and IDs (if the course is included in a subscription)
        if (course && course.isIncludedInSubscription) {
            const relevantSubscriptionPlans = await Subscription.find({
                status: 'active',
                $or: [
                    { 'courses.isAllIncluded': true },
                    { 'courses.includedCourses': courseId }
                ]
            }).distinct('_id');

            if (relevantSubscriptionPlans.length > 0) {
                const subscribedUsers = await User.find({
                    'purchasedSubscriptions.isActive': true,
                    'purchasedSubscriptions.subscription': { $in: relevantSubscriptionPlans }
                }).select('email');
                subscribedUsers.forEach(user => {
                    userEmailsToNotify.add(user.email);
                    userIdsForInAppNotifications.add(user._id.toString());
                });
            }
        }
        
        // Prepare notification content
        const classStartTimeFormatted = new Date(startTime).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        });

        const emailTitle = `New Live Class: ${title}`;
        const emailBodyHtml = `
            <p style="font-size: 16px; line-height: 1.6;">Dear Learner,</p>
            <p style="font-size: 16px; line-height: 1.6;">A new live class titled <strong>"${title}"</strong> for the course <strong>"${course ? course.title : 'N/A'}"</strong> has been scheduled!</p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>Description:</strong> ${description || 'No description provided.'}</p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>Starts:</strong> ${classStartTimeFormatted}</p>
            <p style="font-size: 16px; line-height: 1.6;">Please join on time. We look forward to seeing you there!</p>
        `;
        
        // Use CLIENT_URL to form the action URL for the email
        const actionUrl = `${CLIENT_URL}/live-class/${liveClass.slug}`;

        // Send emails and create in-app notifications
        const notificationDocs = [];
        for (const email of userEmailsToNotify) {
            try {
                await sendProfessionalEmail({
                    to: email,
                    subject: `Live Class Alert: ${title}`,
                    emailTitle: emailTitle,
                    emailBodyHtml: emailBodyHtml,
                    actionUrl: actionUrl,
                    actionText: 'Go to Class Page'
                });
            } catch (emailError) {
                console.error(`Failed to send email to ${email}:`, emailError);
            }
        }

        for (const userId of userIdsForInAppNotifications) {
            notificationDocs.push({
                user: userId,
                title: `Live Class: ${title}`,
                message: `Your live class "${title}" for "${course ? course.title : 'N/A'}" is scheduled for ${classStartTimeFormatted}. Click to join!`,
                type: 'event',
                relatedItem: {
                    itemType: 'LiveClass',
                    itemId: liveClass._id,
                    meetingUrl: meetingDetails.joinUrl,
                },
            });
        }
        
        if (notificationDocs.length > 0) {
            await Notification.insertMany(notificationDocs);
        }

        res.status(201).json({
            success: true,
            data: liveClass,
            message: 'Live class scheduled and notifications sent successfully!',
        });

    } catch (error) {
        console.error('Error scheduling live class:', error);
        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error while scheduling the live class.', error: error.message });
    }
});

/**
 * @desc      Get all live classes
 * @route     GET /api/v1/liveclasses
 * @access    Private (Admin, Instructor, Student)
 */
router.get('/', protect, async (req, res) => {
    try {
        const liveClasses = await LiveClass.find()
            .populate('instructor', 'username profileInfo.firstName profileInfo.lastName')
            .populate('course', 'title')
            .populate('chapter', 'title')

        res.status(200).json({ success: true, count: liveClasses.length, data: liveClasses });
    } catch (error) {
        console.error('Error retrieving live classes:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving live classes.' });
    }
});

/**
 * @desc      Get a single live class by ID
 * @route     GET /api/v1/liveclasses/:id
 * @access    Private (Owner or Admin)
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id)
            .populate('instructor', 'username profileInfo.firstName profileInfo.lastName');

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found.' });
        }

        // Check ownership or admin status for full details (including startUrl/password)
        if (liveClass.instructor.toString() === req.user.id || req.user.role === 'admin') {
            return res.status(200).json({ success: true, data: liveClass });
        } else {
            // For students (or other non-authorized roles), return limited public information
            const publicClass = {
                _id: liveClass._id,
                title: liveClass.title,
                description: liveClass.description,
                startTime: liveClass.startTime,
                endTime: liveClass.endTime,
                instructor: liveClass.instructor,
                course: liveClass.course,
                status: liveClass.status,
                meetingDetails: {
                    platform: liveClass.meetingDetails.platform, // This will always be 'zoom' now
                    joinUrl: liveClass.meetingDetails.joinUrl // Only join URL for public view
                },
                recordingUrl: liveClass.recordingUrl,
                createdAt: liveClass.createdAt,
                updatedAt: liveClass.updatedAt,
            };
            return res.status(200).json({ success: true, data: publicClass });
        }
    } catch (error) {
        console.error('Error retrieving single live class:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving live class.' });
    }
});

/**
 * @desc      Update a live class by ID
 * @route     PUT /api/v1/liveclasses/:id
 * @access    Private (Owner or Admin)
 */
router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        // Remove 'platform' from destructuring as it's fixed in the model and should not be updated via req.body
        const { title, description, startTime, endTime } = req.body;
        let liveClass = await LiveClass.findById(req.params.id);

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found.' });
        }

        // Authorization check: Only owner or admin can update
        if (liveClass.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this live class.' });
        }

        // Validate time
        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ success: false, message: 'End time must be after start time.' });
        }
        if (startTime && new Date(startTime) < new Date()) {
            return res.status(400).json({ success: false, message: 'Start time cannot be in the past.' });
        }

        // Update Zoom meeting since platform is fixed to 'zoom'
        // Use current values if new ones are not provided in the request body
        try {
            await updateZoomMeeting(
                liveClass.meetingDetails.meetingId,
                title || liveClass.title,
                description || liveClass.description,
                startTime || liveClass.startTime,
                endTime || liveClass.endTime
            );
        } catch (zoomError) {
            console.error('Error updating Zoom meeting:', zoomError.response?.data || zoomError.message);
            // Continue with database update even if Zoom update fails, but log it
        }

        // Update the live class document in MongoDB
        liveClass = await LiveClass.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on update
        });

        res.status(200).json({ success: true, data: liveClass, message: 'Live class updated successfully.' });
    } catch (error) {
        console.error('Error updating live class:', error);
        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error updating live class.' });
    }
});

/**
 * @desc      Delete a live class by ID
 * @route     DELETE /api/v1/liveclasses/:id
 * @access    Private (Owner or Admin)
 */
router.delete('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found.' });
        }

        // Authorization check
        if (liveClass.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this live class.' });
        }

        // Optionally, integrate with Zoom API to delete the meeting here if needed
        // Example: await deleteZoomMeeting(liveClass.meetingDetails.meetingId);

        await liveClass.deleteOne(); // Use deleteOne() to trigger pre-hooks if any

        res.status(200).json({ success: true, message: 'Live class deleted successfully.' });
    } catch (error) {
        console.error('Error deleting live class:', error);
        res.status(500).json({ success: false, message: 'Server error deleting live class.' });
    }
});

export default router;