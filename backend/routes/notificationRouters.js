import express from 'express';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

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
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <div style="display: inline-block; vertical-align: middle;">
                             <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="height: 40px; width: 40px; fill: #2f27ce;">
                                <title>Brain Beyond</title>
                                <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
                            </svg>
                        </div>
                        <h1 style="font-family: 'Manrope', sans-serif; color: #2f27ce; font-size: 24px; margin: 10px 0 0;">Brain Beyond</h1>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <h2 style="font-family: 'Poppins', sans-serif; font-size: 22px; margin-top: 0;">${options.subject}</h2>
                        <p style="font-family: 'Poppins', sans-serif; font-size: 16px;">${options.message}</p>
                        ${options.navigateLink ? `<a href="${options.navigateLink}" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #2f27ce; color: #ffffff; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
                    </div>
                    
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                        <p>&copy; ${new Date().getFullYear()} Brain Beyond. All rights reserved.</p>
                        <p>If you did not expect this email, please ignore it.</p>
                    </div>
                </div>
            `,
        };
        await transporter.sendMail(message);
        console.log('Notification email sent to:', options.email);
    } catch (error) {
        console.error('Error sending notification email:', error);
        throw new Error('Email could not be sent.');
    }
};

/**
 * @desc    Create a new notification
 * @route   POST /api/v1/notifications
 * @access  Private/Admin
 * @body    { userId, title, message, type, navigateLink }
 */
router.post('/', protect, authorize('admin', 'customercare'), async (req, res) => {
    try {
        const { userId, title, message, type = 'system', navigateLink, relatedItem } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({ success: false, message: 'User ID, title, and message are required.' });
        }

        const user = await User.findById(userId).select('email notificationPreferences.email isDeleted isActive');
        if (!user || user.isDeleted || !user.isActive) {
            return res.status(404).json({ success: false, message: 'Recipient user not found or is inactive.' });
        }

        const newNotification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            navigateLink,
            relatedItem
        });

        // Send email notification based on user preferences
        if (user.notificationPreferences.email[type] || user.notificationPreferences.email.accountActivity) {
            await sendEmail({
                email: user.email,
                subject: `New Notification: ${title}`,
                message: `${message}`,
                navigateLink: navigateLink
            });
        }

        res.status(201).json({ success: true, data: newNotification, message: 'Notification created successfully.' });
    } catch (error) {
        console.error('Notification Creation Error:', error);
        res.status(500).json({ success: false, message: 'Server error creating notification.' });
    }
});

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/v1/notifications/my-notifications
 * @access  Private
 */
router.get('/my-notifications', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        console.error('Fetch Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
    }
});

/**
 * @desc    Get the count of unread notifications for the logged-in user
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('Unread Count Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching unread count.' });
    }
});

/**
 * @desc    Mark all notifications for the logged-in user as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error marking notifications as read.' });
    }
});

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found or already read.' });
        }

        res.status(200).json({ success: true, data: notification, message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error marking notification as read.' });
    }
});

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }
        
        await notification.deleteOne();

        res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting notification.' });
    }
});


export default router;
