import express from 'express';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

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

// @desc    Get all events
// @route   GET /api/events
// @access  Public
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({}).populate('organizer', 'name email');
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('attendees', 'name email');
        if (!event || !event.isPublished) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin/Instructor
router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
    const { title, description, startDate, endDate, location, isOnline, onlineLink, image, registrationRequired, registrationDeadline, maxAttendees, tags } = req.body;
    try {
        const newEvent = new Event({
            title,
            description,
            startDate,
            endDate,
            location,
            isOnline,
            onlineLink,
            image,
            registrationRequired,
            registrationDeadline,
            maxAttendees,
            tags,
            organizer: req.user._id,
            updatedAt: new Date(),
        });

        const event = await newEvent.save();

        // Send notification to the organizer
        const navigateLink = `/events/${event._id}`;
        await sendNotification(
            req.user._id,
            'Event Created',
            `Your event "${event.title}" has been successfully created.`,
            'event',
            event._id,
            'Event',
            navigateLink
        );

        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(400).json({ message: 'Invalid event data', error: error.message });
    }
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin/Instructor
router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the logged-in user is the organizer or an admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        // Notify all attendees about the update
        const navigateLink = `/events/${updatedEvent._id}`;
        for (const attendeeId of updatedEvent.attendees) {
            await sendNotification(
                attendeeId,
                'Event Updated',
                `The event "${updatedEvent.title}" has been updated. Please check the details.`,
                'event',
                updatedEvent._id,
                'Event',
                navigateLink
            );
        }

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(400).json({ message: 'Invalid update data', error: error.message });
    }
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin/Instructor
router.delete('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the logged-in user is the organizer or an admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        const attendeeIds = event.attendees;
        await event.deleteOne();

        // Notify all former attendees about the deletion
        const navigateLink = '/events';
        for (const attendeeId of attendeeIds) {
            await sendNotification(
                attendeeId,
                'Event Canceled',
                `The event "${event.title}" has been canceled.`,
                'event',
                event._id,
                'Event',
                navigateLink
            );
        }

        res.status(200).json({ message: 'Event removed' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private/Student
router.post('/:id/register', protect, authorize('student'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.registrationRequired) {
            return res.status(400).json({ message: 'Registration is not required for this event' });
        }

        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }

        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ message: 'This event is at full capacity' });
        }

        if (event.attendees.includes(req.user._id)) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        event.attendees.push(req.user._id);
        await event.save();

        // Create a notification for the user with navigateLink
        const navigateLink = `/events/${event._id}`;
        await sendNotification(
            req.user._id,
            'Event Registration Successful',
            `You have successfully registered for the event: ${event.title}`,
            'event',
            event._id,
            'Event',
            navigateLink
        );

        res.status(200).json({ message: 'Successfully registered for the event' });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;