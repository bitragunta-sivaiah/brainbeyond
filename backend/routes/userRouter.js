import express from 'express';
import User from '../models/User.js'; // The ONLY User model you need
import { protect, authorize } from '../middleware/authMiddleware.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// This is a temporary, in-memory store for pending registrations.
const pendingRegistrations = {};


// --- Professional Email Template ---
const createEmailHtml = (title, messageContent) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            .header { background-color: #00466a; color: #ffffff; padding: 25px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; text-align: left; line-height: 1.7; color: #333333; }
            .code-box { font-size: 32px; font-weight: bold; color: #00466a; margin: 25px 0; text-align: center; letter-spacing: 5px; padding: 15px; background-color: #f4f7f6; border-radius: 5px; }
            .footer { background-color: #fafafa; color: #888888; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #eaeaea; }
            p { margin: 0 0 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>HDS LMS Portal</h1></div>
            <div class="content">
                <h2 style="color: #00466a;">${title}</h2>
                ${messageContent}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} HDS LMS. All rights reserved.</p>
                <p>If you did not initiate this request, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>`;
};

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
});

// Helper function to send email
const sendEmail = async (options) => {
    const message = {
        from: `${process.env.FROM_NAME || 'HDS LMS Support'} <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };
    await transporter.sendMail(message);
    console.log('Email sent to: %s', options.email);
};

// --- Helper function to send token and user data ---
const sendTokenResponse = async (user, statusCode, res, message, req) => {
    user.sessionToken = crypto.randomBytes(32).toString('hex');
    user.lastLogin = Date.now();
    const loginInfo = {
        ipAddress: req.ip,
        device: req.headers['user-agent'] || 'Unknown',
    };
    user.loginHistory.push(loginInfo);
    if (user.loginHistory.length > 15) {
        user.loginHistory.shift();
    }
    await user.save({ validateBeforeSave: false });
    const token = user.getSignedJwtToken();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(statusCode).json({ success: true, message, token, user: userResponse });
};

// --- AUTH ROUTES ---

// @desc      Register a new user (Step 1: Request Verification)
// @route     POST /api/v1/auth/register
// @access    Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role = 'student' } = req.body;
        if (await User.findOne({ $or: [{ email }, { username }] })) {
            return res.status(400).json({ success: false, message: 'Email or username already exists.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        pendingRegistrations[email] = {
            username,
            email,
            password,
            role,
            otp,
            expires: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
        };
        const html = createEmailHtml('Welcome to HDS!', `<p>Thank you for registering. Use this One-Time Password (OTP) to verify your account. It's valid for 10 minutes.</p><div class="code-box">${otp}</div>`);
        await sendEmail({ email: email, subject: 'HDS Account Verification', html });
        res.status(201).json({ success: true, message: 'Registration request received. Please check your email for a verification OTP.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Verify email with OTP and create account (Step 2: Complete Registration)
// @route     POST /api/v1/auth/verify-email
// @access    Public
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const pending = pendingRegistrations[email];
        if (!pending || pending.otp !== otp || pending.expires < Date.now()) {
            if (pending) delete pendingRegistrations[email];
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }
        const user = await User.create({
            username: pending.username,
            email: pending.email,
            password: pending.password,
            role: pending.role,
            isVerified: true,
        });
        delete pendingRegistrations[email];
        await sendTokenResponse(user, 200, res, 'Email verified and account created successfully. You are now logged in.', req);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or username already exists.' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Resend Email Verification OTP
// @route     POST /api/v1/auth/resend-verification-otp
// @access    Public
router.post('/resend-verification-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const pending = pendingRegistrations[email];
        if (pending) {
            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
            pending.otp = newOtp;
            pending.expires = Date.now() + 10 * 60 * 1000;
            const html = createEmailHtml('New Verification OTP', `<p>You requested a new email verification OTP for your account.</p><div class="code-box">${newOtp}</div><p>This OTP is valid for 10 minutes.</p>`);
            await sendEmail({ email: pending.email, subject: 'Your New HDS Verification OTP', html });
            return res.status(200).json({ success: true, message: 'A new verification OTP has been sent to your email.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ success: false, message: 'This account is already verified.' });
        }
        res.status(200).json({ success: true, message: 'If a registration is pending for this email, a new OTP has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Login user with password
// @route     POST /api/v1/auth/login
// @access    Public
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an identifier and password.' });
        }
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Account not verified. Please check your email.' });
        }
        if (!user.isActive || user.isDeleted) {
            return res.status(403).json({ success: false, message: 'Account is inactive. Please contact support.' });
        }
        await sendTokenResponse(user, 200, res, 'Login successful.', req);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Request a one-time password for login (EMAIL ONLY)
// @route     POST /api/v1/auth/request-otp
// @access    Public
router.post('/request-otp', async (req, res) => {
    try {
        // CORRECTED: Changed 'identifier' to 'email' to enforce email-only OTP requests.
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email address.' });
        }

        // CORRECTED: The query now only searches by email.
        const user = await User.findOne({ email });

        if (user && user.isVerified && user.isActive && !user.isDeleted) {
            const otp = user.generateOneTimeToken();
            await user.save({ validateBeforeSave: false });
            
            const html = createEmailHtml('One-Time Login Password', `<p>You requested a one-time password to log in.</p><div class="code-box">${otp}</div><p>This OTP is valid for 5 minutes.</p>`);
            await sendEmail({ email: user.email, subject: 'Your HDS Login OTP', html });
        }

        // Generic response to prevent user enumeration.
        res.status(200).json({ success: true, message: 'If an account with that email exists, a login OTP has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Login with a one-time password (OTP) (EMAIL ONLY)
// @route     POST /api/v1/auth/login-with-otp
// @access    Public
router.post('/login-with-otp', async (req, res) => {
    try {
        // CORRECTED: Changed 'identifier' to 'email' for consistency.
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide an email and OTP.' });
        }

        // CORRECTED: The query now only searches by email.
        const user = await User.findOne({ email }).select('+oneTimeToken +oneTimeTokenExpire');

        if (!user || !user.oneTimeToken || user.oneTimeTokenExpire < Date.now() || !user.matchOneTimeToken(otp)) {
             if(user) { 
                 user.oneTimeToken = undefined;
                 user.oneTimeTokenExpire = undefined;
                 await user.save({validateBeforeSave: false});
             }
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP.' });
        }
        
        user.oneTimeToken = undefined;
        user.oneTimeTokenExpire = undefined;
        
        await sendTokenResponse(user, 200, res, 'Successfully logged in with OTP.', req);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
router.post('/forgotpassword', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const resetToken = user.generatePasswordResetToken();
            await user.save({ validateBeforeSave: false });
            
            const html = createEmailHtml('Password Reset Request', `<p>You requested a password reset. Use the token below. It's valid for 10 minutes.</p><div class="code-box" style="letter-spacing: 1px; font-size: 16px;">${resetToken}</div>`);
            await sendEmail({ email: user.email, subject: 'HDS Password Reset Token', html });
        }
        res.status(200).json({ success: true, message: 'If an account with that email exists, a reset token has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword
// @access    Public
router.put('/resetpassword', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        
        await sendTokenResponse(user, 200, res, 'Password reset successfully. You are now logged in.', req);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- USER-SPECIFIC ROUTES (Protected) ---

// @desc      Get current logged-in user
// @route     GET /api/v1/auth/me
// @access    Private
router.get('/me', protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
});

// @desc      Update current user's details
// @route     PUT /api/v1/auth/me
// @access    Private
router.put('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const commonFields = ['profileInfo', 'socialLinks'];
        const roleSpecificFields = {
            student: ['careerGoals', 'learningObjectives', 'preferredLearningStyles', 'timeAvailability', 'achievements', 'education', 'skills', 'interests', 'workExperience'],
            instructor: ['experience', 'certifications', 'specializations', 'teachingPhilosophy', 'portfolioUrl'],
            customercare: ['position', 'specialization', 'languages', 'availability', 'skills', 'tools'],
            admin: []
        };
        const allowedFieldsForUpdate = [...commonFields, ...(roleSpecificFields[user.role] || [])];
        const updatePayload = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFieldsForUpdate.includes(key)) {
                updatePayload[key] = req.body[key];
            }
        });
        user.set(updatePayload);
        const updatedUser = await user.save();
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Change password for current user
// @route     PUT /api/v1/auth/changepassword
// @access    Private
router.put('/changepassword', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Logout user (client-side action)
// @route     GET /api/v1/auth/logout
// @access    Private
router.get('/logout', protect, (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully. Please clear your token.' });
});

// --- ADMIN-ONLY ROUTES (Protected) ---

// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
    const users = await User.find();
    res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc      Get single user by ID
// @route     GET /api/v1/auth/users/:id
// @access    Private (Admin)
router.get('/users/:id', protect, authorize('admin'), async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, data: user });
});

// @desc      Update user by ID (by Admin)
// @route     PUT /api/v1/auth/users/:id
// @access    Private (Admin)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const updateData = { ...req.body };
        delete updateData.password;
        delete updateData._id;
        user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: user, message: 'User updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Update user role
// @route     PUT /api/v1/auth/users/update-role/:id
// @access    Private (Admin only)
router.put('/users/update-role/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { newRole } = req.body;
        const validRoles = ['admin', 'student', 'instructor', 'customercare'];
        if (!newRole || !validRoles.includes(newRole)) {
            return res.status(400).json({ success: false, message: 'A valid new role is required.' });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (user._id.toString() === req.user.id) {
            return res.status(403).json({ success: false, message: 'Admins cannot change their own role.' });
        }
        user.role = newRole;
        await user.save();
        res.status(200).json({ success: true, data: user, message: `User role updated to ${newRole}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc      Soft-delete user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private (Admin)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.isDeleted = true;
    user.deletedAt = Date.now();
    user.isActive = false;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'User soft-deleted successfully.' });
});

// @desc      Restore a soft-deleted user
// @route     PUT /api/v1/auth/users/restore/:id
// @access    Private (Admin)
router.put('/users/restore/:id', protect, authorize('admin'), async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.isDeleted = false;
    user.deletedAt = null;
    user.isActive = true;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'User restored successfully.' });
});

export default router;
