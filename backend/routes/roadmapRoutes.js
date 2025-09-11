// routes/roadmapRoutes.js

import express from 'express';
import mongoose from 'mongoose';
import LearningRoadmap from '../models/LearningRoadmap.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';
import { generateRoadmapFromAI } from '../services/aiService.js'; // Import the new service

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

// --- AI-Powered Roadmap Creation ---
// @desc    Create a new learning roadmap using AI
// @route   POST /api/roadmaps
// @access  Private
router.post('/', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { skill, skillLevel, totalDurationDays } = req.body;

    if (!skill || !skillLevel || !totalDurationDays) {
      return res.status(400).json({ message: 'Skill, skill level, and total duration are required.' });
    }

    // 1. Delegate all complex AI logic to the service layer
    const aiData = await generateRoadmapFromAI({ skill, skillLevel, totalDurationDays });

    // 2. Create the new roadmap. The slug is now handled automatically by the model's pre-save hook.
    const newRoadmap = new LearningRoadmap({
      ...aiData, // Spread AI data like title, description, dailyPlan
      owner: req.user._id,
      skill,
      skillLevel,
      totalDurationDays,
    });

    // 3. Save the new roadmap to the database
    const savedRoadmap = await newRoadmap.save({ session });

    // 4. Send a notification to the creator
    await sendNotification(
      req.user._id,
      'Roadmap Created!',
      `Your new learning roadmap "${savedRoadmap.title}" is ready.`,
      'system',
      savedRoadmap._id,
      'LearningRoadmap',
      `/roadmaps/${savedRoadmap.slug}` // Use the generated slug for the link
    );

    await session.commitTransaction();
    res.status(201).json(savedRoadmap);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in POST /api/roadmaps:', error);
    res.status(500).json({ message: error.message || 'Failed to create roadmap with AI.' });
  } finally {
    session.endSession();
  }
});

// --- Read Operations ---
// @desc    Get all public roadmaps with filtering and pagination
// @route   GET /api/roadmaps
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { skill, skillLevel, tag, page = 1, limit = 10, owner } = req.query;
    const query = {};

    if (skill) query.skill = { $regex: skill, $options: 'i' };
    if (skillLevel) query.skillLevel = skillLevel;
    if (tag) query.tags = { $in: [tag.toLowerCase()] };
    
    // By default, only show public roadmaps
    query.isPublic = true;
    
    // If a user is logged in and requests their own roadmaps
    if (owner === 'me' && req.headers.authorization) {
        await protect(req, res, () => {
            if (req.user) {
                query.owner = req.user._id;
                delete query.isPublic; // Allow user to see their own private roadmaps
            }
        });
    }

    const roadmaps = await LearningRoadmap.find(query)
      .populate('owner', 'username')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await LearningRoadmap.countDocuments(query);

    res.status(200).json({
      roadmaps,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error in GET /api/roadmaps:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// @desc    Get a single learning roadmap by slug or ID
// @route   GET /api/roadmaps/:identifier
// @access  Public (if public), Private (if private and owner)
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let roadmap;

    // Prioritize finding by the unique slug, then fall back to ID
    roadmap = await LearningRoadmap.findOne({ slug: identifier }).populate('owner', 'username email');
    if (!roadmap && mongoose.Types.ObjectId.isValid(identifier)) {
      roadmap = await LearningRoadmap.findById(identifier).populate('owner', 'username email');
    }

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Authorization check for private roadmaps
    if (!roadmap.isPublic) {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Not authorized. Please log in.' });
        }
        // Use protect middleware to verify token and attach user to req
        await protect(req, res, async () => {
            if (!req.user || roadmap.owner._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Forbidden: You do not have access to this roadmap.' });
            }
            // If authorized, proceed to send the roadmap
            roadmap.viewsCount++;
            await roadmap.save();
            res.status(200).json(roadmap);
        });
    } else {
      // Public roadmaps are accessible to all
      roadmap.viewsCount++;
      await roadmap.save();
      res.status(200).json(roadmap);
    }
  } catch (error) {
    console.error('Error in GET /api/roadmaps/:identifier:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
});


// --- Update and Delete ---
// @desc    Update a learning roadmap
// @route   PUT /api/roadmaps/:id
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const roadmap = await LearningRoadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this roadmap' });
    }

    // Update fields from the request body
    Object.assign(roadmap, req.body);
    
    const updatedRoadmap = await roadmap.save();
    res.status(200).json(updatedRoadmap);
  } catch (error) {
    console.error('Error updating roadmap:', error);
    res.status(400).json({ message: error.message || 'Failed to update roadmap' });
  }
});

// @desc    Delete a learning roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const roadmap = await LearningRoadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this roadmap' });
    }

    await LearningRoadmap.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Roadmap removed successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- User Interactions ---
// @desc    Like or unlike a learning roadmap
// @route   PUT /api/roadmaps/:id/like
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const roadmap = await LearningRoadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }
    if (roadmap.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot like your own roadmap.' });
    }

    const hasLiked = roadmap.likedBy.includes(req.user._id);
    let message;

    if (hasLiked) {
      // Unlike
      roadmap.likedBy.pull(req.user._id);
      message = 'Roadmap unliked.';
    } else {
      // Like
      roadmap.likedBy.push(req.user._id);
      message = 'Roadmap liked.';

      // Send a notification to the owner
      await sendNotification(
        roadmap.owner,
        'Someone liked your roadmap! 🎉',
        `${req.user.username} liked your roadmap "${roadmap.title}".`,
        'social',
        roadmap._id,
        'LearningRoadmap',
        `/roadmaps/${roadmap.slug}`
      );
    }
    
    roadmap.likesCount = roadmap.likedBy.length;
    await roadmap.save();

    res.status(200).json({ message, likesCount: roadmap.likesCount });
  } catch (error) {
    console.error('Error liking roadmap:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Fork a learning roadmap
// @route   POST /api/roadmaps/:id/fork
// @access  Private
router.post('/:id/fork', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalRoadmap = await LearningRoadmap.findById(req.params.id).session(session);

    if (!originalRoadmap) {
      return res.status(404).json({ message: 'Original roadmap not found' });
    }
    if (originalRoadmap.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot fork your own roadmap.' });
    }

    // Deep copy the dailyPlan and reset isCompleted status
    const newDailyPlan = originalRoadmap.dailyPlan.map(day => ({
      ...day.toObject(),
      activities: day.activities.map(activity => ({
        ...activity.toObject(),
        isCompleted: false
      }))
    }));

    const forkedRoadmap = new LearningRoadmap({
      title: `Fork of: ${originalRoadmap.title}`,
      description: originalRoadmap.description,
      owner: req.user._id,
      skill: originalRoadmap.skill,
      skillLevel: originalRoadmap.skillLevel,
      totalDurationDays: originalRoadmap.totalDurationDays,
      dailyPlan: newDailyPlan,
      tags: [...originalRoadmap.tags, 'forked'],
      isPublic: false, // Forks are private by default
      status: 'draft',
      // Reset counts
      viewsCount: 0,
      likesCount: 0,
      forksCount: 0
    });

    const savedFork = await forkedRoadmap.save({ session });

    // Increment forksCount on the original roadmap
    originalRoadmap.forksCount++;
    await originalRoadmap.save({ session });
    
    // Notify the original owner
    await sendNotification(
      originalRoadmap.owner,
      'Your roadmap was forked! 🌳',
      `${req.user.username} forked your roadmap "${originalRoadmap.title}".`,
      'social',
      originalRoadmap._id,
      'LearningRoadmap',
      `/roadmaps/${originalRoadmap.slug}`
    );

    await session.commitTransaction();
    res.status(201).json(savedFork);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error forking roadmap:', error);
    res.status(500).json({ message: 'Failed to fork roadmap' });
  } finally {
    session.endSession();
  }
});

export default router;