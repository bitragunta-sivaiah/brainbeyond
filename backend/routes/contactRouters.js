import express from 'express';
import Contact from '../models/Contact.js';
import User from '../models/User.js'; // Assuming your User model is in this path
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// --- Middleware (copied from your provided code) ---

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({
                message: 'Not authorized, token failed'
            });
        }
    }
    if (!token) {
        res.status(401).json({
            message: 'Not authorized, no token'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// --- End of Middleware ---

const router = express.Router();

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Public (anyone can submit a message)
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    try {
        const newContact = await Contact.create({
            name,
            email,
            subject,
            message,
            // If the user is authenticated, save their ID with the message
            user: req.user ? req.user._id : null
        });

        res.status(201).json({
            message: 'Your message has been sent successfully. We will get back to you shortly.',
            contact: newContact
        });

    } catch (error) {
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        console.error('Error creating contact message:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin/CustomerCare
router.get('/', protect, authorize('admin', 'customercare'), async (req, res) => {
    try {
        const contactMessages = await Contact.find()
            .populate('user', 'username email') // Populate the user field to see who submitted it
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json(contactMessages);

    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Update the status of a contact message
// @route   PUT /api/contact/:id/status
// @access  Private/Admin/CustomerCare
router.put('/:id/status', protect, authorize('admin', 'customercare'), async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    try {
        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id, { status }, { new: true, runValidators: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact message not found.' });
        }

        res.status(200).json({
            message: 'Contact message status updated successfully.',
            contact: updatedContact
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        console.error('Error updating contact status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// @desc    Add an internal note to a contact message
// @route   POST /api/contact/:id/notes
// @access  Private/Admin/CustomerCare
router.post('/:id/notes', protect, authorize('admin', 'customercare'), async (req, res) => {
    const { note } = req.body;
    if (!note) {
        return res.status(400).json({ message: 'Note content is required.' });
    }

    try {
        const contactMessage = await Contact.findById(req.params.id);

        if (!contactMessage) {
            return res.status(404).json({ message: 'Contact message not found.' });
        }

        contactMessage.internalNotes.push({
            note,
            notedBy: req.user._id,
        });

        await contactMessage.save();

        res.status(200).json({
            message: 'Note added successfully.',
            contact: contactMessage
        });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;