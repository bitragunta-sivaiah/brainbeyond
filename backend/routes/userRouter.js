import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

dotenv.config();

const router = express.Router();

// --- UTILITIES & HELPERS ---

// Async Handler Middleware to remove repetitive try-catch blocks
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Professional Email Template (Enhanced)
const createEmailHtml = (title, messageContent) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; margin: 0; padding: 0; background-color: #f4f7f6; color: #333; }
            .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background-color: #2c3e50; padding: 30px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px; line-height: 1.6; }
            .content h2 { color: #2c3e50; font-size: 24px; margin-top: 0; }
            .content p { margin-bottom: 20px; font-size: 16px; color: #555; }
            .cta-button { display: inline-block; padding: 12px 25px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; }
            .cta-button:hover { background-color: #2980b9; }
            .code-box { background-color: #ecf0f1; border: 1px dashed #bdc3c7; padding: 15px; text-align: center; font-size: 24px; font-weight: 700; color: #2c3e50; border-radius: 8px; letter-spacing: 2px; }
            .footer { background-color: #ecf0f1; padding: 20px 40px; text-align: center; color: #7f8c8d; font-size: 14px; border-top: 1px solid #e0e0e0; }
            .footer p { margin: 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Brain Beyond</h1>
            </div>
            <div class="content">
                <h2>${title}</h2>
                ${messageContent}
                <p>
                    At Brain Beyond, we are committed to providing you with the best tools and resources to unlock your potential and master new skills. Our platform is designed to make learning engaging and accessible, wherever you are.
                </p>
                <p>
                    If you have any questions or need support, our customer care team is always ready to help.
                </p>
            </div>
            <div class="footer">
                <p>Unleash your potential with Brain Beyond.</p>
                <p>&copy; ${new Date().getFullYear()} Brain Beyond. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
};

// Nodemailer Transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
});

// Helper function to send email
const sendEmail = async (options) => {
    const message = {
        from: `${process.env.FROM_NAME || 'Brain Beyond Support'} <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };
    await transporter.sendMail(message);
};

// Helper function to send JWT token and user data in response
const sendTokenResponse = async (user, statusCode, res, message, req) => {
    user.sessionToken = crypto.randomBytes(32).toString('hex');
    user.lastLogin = Date.now();
    user.loginHistory.push({
        ipAddress: req.ip,
        device: req.headers['user-agent'] || 'Unknown',
    });
    if (user.loginHistory.length > 15) {
        user.loginHistory.shift();
    }
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(statusCode).json({ success: true, message, token, user: userResponse });
};


// --- ROUTE TO DELETE UNVERIFIED USERS ---
const cleanupUnverifiedUsers = asyncHandler(async (req, res, next) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await User.deleteMany({
        isVerified: false,
        createdAt: { $lt: oneHourAgo }
    });
    console.log(`Cleanup: ${result.deletedCount} unverified users deleted.`);
    next();
});

// Apply the cleanup middleware
router.use(cleanupUnverifiedUsers);


// =================================================================
// --- AUTHENTICATION ROUTES (Public) ---
// =================================================================

// @desc      Register user (creates unverified user, sends OTP)
// @route     POST /api/v1/auth/register
// @access    Public
router.post('/register', asyncHandler(async (req, res) => {
    const { username, email, password, role = 'student' } = req.body;

    if (await User.findOne({ $or: [{ email }, { username }] })) {
        return res.status(400).json({ success: false, message: 'An account with that email or username already exists.' });
    }
    
    const user = new User({ username, email, password, role, isVerified: false });
    const otp = user.generateOneTimeToken();
    await user.save();

    const html = createEmailHtml(
        'Welcome to Brain Beyond!', 
        `<p>Thank you for registering. Use this One-Time Password (OTP) to verify your account. It is valid for 5 minutes.</p><div class="code-box">${otp}</div>`
    );
    await sendEmail({ email, subject: 'Brain Beyond Account Verification', html });

    res.status(201).json({ success: true, message: 'Registration successful. Please check your email for a verification OTP.' });
}));


// @desc      Verify new user account with OTP
// @route     POST /api/v1/auth/verify-email
// @access    Public
router.post('/verify-email', asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, isVerified: false }).select('+oneTimeToken +oneTimeTokenExpire');

    if (!user || !user.oneTimeToken || user.oneTimeTokenExpire < Date.now() || !user.matchOneTimeToken(otp)) {
        if (user) {
            user.oneTimeToken = undefined;
            user.oneTimeTokenExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.oneTimeToken = undefined;
    user.oneTimeTokenExpire = undefined;
    
    await sendTokenResponse(user, 200, res, 'Email verified and account created. You are now logged in.', req);
}));

// @desc      Resend verification OTP
// @route     POST /api/v1/auth/resend-verification
// @access    Public
router.post('/resend-verification', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with that email.' });
    }
    if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    const otp = user.generateOneTimeToken();
    await user.save({ validateBeforeSave: false });

    const html = createEmailHtml('New Verification OTP', `<p>Your new verification OTP is below. It is valid for 5 minutes.</p><div class="code-box">${otp}</div>`);
    await sendEmail({ email, subject: 'Your New Brain Beyond Verification OTP', html });

    res.status(200).json({ success: true, message: 'A new verification OTP has been sent.' });
}));


// @desc      Login user with email/username and password
// @route     POST /api/v1/auth/login
// @access    Public
router.post('/login', asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Please provide an identifier and password.' });
    }

    const user = await User.findOne({ 
        $or: [{ email: identifier }, { username: identifier }] 
    }).select('+password');
    
    if (!user || !password) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!user.isVerified) {
        return res.status(403).json({ success: false, message: 'Account not verified. Please check your email.' });
    }
    if (!user.isActive || user.isDeleted) {
        return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact support.' });
    }

    await sendTokenResponse(user, 200, res, 'Login successful.', req);
}));

// @desc      Login with a one-time password (OTP)
// @route     POST /api/v1/auth/login-otp
// @access    Public
router.post('/login-otp', asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Please provide an email and OTP.' });
    }

    const user = await User.findOne({ email }).select('+oneTimeToken +oneTimeTokenExpire');

    if (!user || !user.isVerified || !user.isActive || user.isDeleted) {
        return res.status(403).json({ success: false, message: 'Account is not active or verified.' });
    }

    if (!user.oneTimeToken || user.oneTimeTokenExpire < Date.now() || !user.matchOneTimeToken(otp)) {
        if (user) {
            user.oneTimeToken = undefined;
            user.oneTimeTokenExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }
        return res.status(401).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    
    user.oneTimeToken = undefined;
    user.oneTimeTokenExpire = undefined;
    await sendTokenResponse(user, 200, res, 'Successfully logged in with OTP.', req);
}));


// =================================================================
// --- PASSWORD MANAGEMENT (Public / Private) ---
// =================================================================

// @desc      Request passwordless login OTP
// @route     POST /api/v1/auth/request-otp
// @access    Public
router.post('/request-otp', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user && user.isVerified && user.isActive && !user.isDeleted) {
        const otp = user.generateOneTimeToken();
        await user.save({ validateBeforeSave: false });
        const html = createEmailHtml('One-Time Login Password', `<p>Your login OTP is below. It's valid for 5 minutes.</p><div class="code-box">${otp}</div>`);
        await sendEmail({ email, subject: 'Your Brain Beyond Login OTP', html });
    }

    res.status(200).json({ success: true, message: 'If an account exists for this email, an OTP has been sent.' });
}));


// @desc      Forgot password - Request reset token
// @route     POST /api/v1/auth/forgot-password
// @access    Public
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });
        
        // Construct the full reset URL using CLIENT_URL
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        const html = createEmailHtml('Password Reset Request', `
            <p>You have requested to reset your password. Please use the token below to reset your password:</p>
            <div class="code-box" style="letter-spacing: 1px; font-size: 16px;">${resetToken}</div>
            <p>Alternatively, you can click the link below to be taken to the password reset page. This link is valid for 10 minutes.</p>
            <a href="${resetUrl}" class="cta-button">Reset My Password</a>
        `);
        await sendEmail({ email, subject: 'Brain Beyond Password Reset Request', html });
    }

    res.status(200).json({ success: true, message: 'If an account exists, a password reset email has been sent.' });
}));

// @desc      Reset password using token
// @route     PUT /api/v1/auth/reset-password
// @access    Public
router.put('/reset-password', asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() },
    }).select('+password');
    
    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    
    await sendTokenResponse(user, 200, res, 'Password reset successfully. You are now logged in.', req);
}));

// @desc      Change password for logged-in user
// @route     PUT /api/v1/auth/change-password
// @access    Private
router.put('/change-password', protect, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user || !(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
}));


// =================================================================
// --- CURRENT USER PROFILE MANAGEMENT (Private) ---
// =================================================================

// @desc      Get current logged-in user details
// @route     GET /api/v1/auth/me
// @access    Private
router.get('/me', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
}));

// @desc      Update current user's profile
// @route     PUT /api/v1/auth/me
// @access    Private
router.put('/me', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    const allowedFields = {
        common: ['profileInfo', 'socialLinks'],
        student: ['careerGoals', 'learningObjectives', 'education', 'skills', 'interests', 'workExperience', 'timeAvailability', 'stats', 'achievements'],
        instructor: ['experience', 'certifications', 'specializations', 'teachingPhilosophy', 'portfolioUrl', 'courses', 'totalStudents', 'totalCourses', 'totalReviews', 'averageRating'],
        customercare: ['languages', 'availability', 'position', 'specialization', 'skills', 'tools', 'stats', 'performanceReviews', 'currentAssignments'],
        admin: ['profileInfo', 'socialLinks']
    };
    
    const fieldsForRole = [...allowedFields.common, ...(allowedFields[user.role] || [])];
    const updatePayload = {};

    Object.keys(req.body).forEach(key => {
        if (fieldsForRole.includes(key)) {
            updatePayload[key] = req.body[key];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(req.user.id, { $set: updatePayload }, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({ success: true, data: updatedUser });
}));

// @desc      Logout user (invalidate session token)
// @route     POST /api/v1/auth/logout
// @access    Private
router.post('/logout', protect, asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { $unset: { sessionToken: "" } });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
}));


// =================================================================
// --- ADMIN USER MANAGEMENT (Private, Admin Only) ---
// =================================================================

const adminOnly = authorize('admin');

// @desc      Admin creates a new user with email and role
// @route     POST /api/v1/auth/users
// @access    Private (Admin)
router.post('/users', protect, adminOnly, asyncHandler(async (req, res) => {
    const { email, role = 'student' } = req.body;
    
    if (!email || !role) {
        return res.status(400).json({ success: false, message: 'Email and role are required.' });
    }

    if (await User.findOne({ email })) {
        return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    const username = email.split('@')[0];

    const user = await User.create({
        username,
        email,
        password: temporaryPassword,
        role,
        isVerified: true
    });

    const html = createEmailHtml('Your New Brain Beyond Account', `
        <p>A new account has been created for you on Brain Beyond. You can use the following temporary credentials to log in:</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <div class="code-box">${temporaryPassword}</div></p>
        <p>For your security, we highly recommend that you change this password immediately after your first login.</p>
        <p>Click the link below to get started:</p>
        <a href="${process.env.CLIENT_URL}/login" class="cta-button">Go to Login</a>
    `);

    await sendEmail({
        email,
        subject: 'Welcome to Brain Beyond! Your New Account Details',
        html
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ 
        success: true, 
        message: 'User created successfully and temporary password sent via email.',
        data: userResponse
    });
}));


// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private (Admin)
router.get('/users', protect, adminOnly, asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.status(200).json({ success: true, count: users.length, data: users });
}));

 

// @desc      Update a user's role
// @route     PUT /api/v1/auth/users/:id/role
// @access    Private (Admin)
router.put('/users/:id/role', protect, adminOnly, asyncHandler(async (req, res) => {
    const { newRole } = req.body;
    const userId = req.params.id;
    const validRoles = ['student', 'instructor', 'customercare', 'admin'];

    // 1. Validate the incoming new role
    if (!validRoles.includes(newRole)) {
        res.status(400);
        throw new Error('Invalid role provided.');
    }

    // 2. Find the original user and include the password for the new user creation
    const originalUser = await User.findById(userId).select('+password').lean();
    
    if (!originalUser) {
        res.status(404);
        throw new Error('User not found.');
    }

    const oldRole = originalUser.role;

    // Prevent unnecessary database operations if the role is already set
    if (oldRole === newRole) {
        res.status(400);
        throw new Error(`User is already a '${newRole}'.`);
    }

    // 3. Prepare the new user's data from the original
    const newUserData = { ...originalUser, role: newRole };

    // Define fields specific to certain roles that need to be removed when the role changes
    const roleSpecificFields = {
        student: ['careerGoals', 'learningObjectives', 'achievements', 'education', 'skills', 'interests', 'workExperience', 'stats'],
        instructor: ['experience', 'certifications', 'specializations', 'teachingPhilosophy', 'portfolioUrl', 'courses', 'totalStudents', 'totalCourses', 'totalReviews', 'averageRating'],
        customercare: ['position', 'specialization', 'languages', 'availability', 'stats', 'skills', 'tools', 'performanceReviews', 'currentAssignments']
    };
    
    // Remove fields associated with the OLD role
    const fieldsToRemove = roleSpecificFields[oldRole] || [];
    fieldsToRemove.forEach(field => {
        delete newUserData[field];
    });

    // 4. Clean up internal MongoDB fields before creating a new document
    delete newUserData._id;
    delete newUserData.__v;
    delete newUserData.__t; // This is the Mongoose discriminator key, it's important to remove it

    // 5. Perform the core operation: Delete the old user and create the new one
    try {
        // Delete the original user to free up unique keys (like username or email)
        await User.findByIdAndDelete(userId);

        // Create the new user with the updated role and cleaned data
        const newUser = await User.create(newUserData);

        // To include the password in the API response, re-query for the new user
        const createdUserWithPassword = await User.findById(newUser._id) 

        res.status(200).json({
            success: true,
            message: `User role successfully changed from '${oldRole}' to '${newRole}'.`,
            data: createdUserWithPassword
        });

    } catch (creationError) {
        console.error("CRITICAL ERROR: Failed to create new user after deleting the original.", creationError);

        // Fallback: Attempt to restore the original user to prevent data loss
        await User.create(originalUser);

        res.status(500);
        throw new Error('A critical error occurred. The role change failed but the original user has been restored.');
    }
}));



// @desc      Soft delete a user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private (Admin)
router.delete('/users/:id', protect, adminOnly, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isDeleted = true;
    user.deletedAt = Date.now();
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'User has been soft-deleted.' });
}));

// @desc      Restore a soft-deleted user
// @route     PUT /api/v1/auth/users/:id/restore
// @access    Private (Admin)
router.put('/users/:id/restore', protect, adminOnly, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (!user.isDeleted) {
        return res.status(400).json({ success: false, message: 'User is not deleted.' });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'User restored successfully.' });
}));


export default router;