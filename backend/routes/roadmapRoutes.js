import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';

// Import required models and middleware
import LearningRoadmap from '../models/LearningRoadmap.js';
// import User from '../models/User.js'; // Uncomment if needed
// import Notification from '../models/Notification.js'; // Uncomment if needed
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ==============================================================================
// --- CORE HELPER FUNCTIONS (WITH RESILIENCE) ---
// ==============================================================================

/**
 * **NEW: ROBUST API CALL HELPER WITH EXPONENTIAL BACKOFF**
 * This function replaces direct API calls to handle transient errors like overloads.
 * It automatically retries on server errors (5xx) or rate limiting (429).
 * @param {string} url - The API endpoint URL.
 * @param {object} options - The request options (method, headers, body).
 * @param {number} retries - The maximum number of retries.
 * @returns {Promise<object>} The parsed JSON data from the successful API response.
 */
const callApiWithRetry = async (url, options, retries = 5) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // If the request is successful or it's a client error that shouldn't be retried
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response.json();
            }
            // If it's a rate limit or server error, wait and retry
            if (response.status === 429 || response.status >= 500) {
                console.warn(`Attempt ${i + 1} failed with status ${response.status}. Retrying...`);
                lastError = new Error(`API call failed with status: ${response.status}`);
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed with network error: ${error.message}. Retrying...`);
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    // If all retries fail, throw the last known error
    throw new Error(`API call failed after ${retries} attempts. Last error: ${lastError.message}`);
};


// ==============================================================================
// --- ROUTES ---
// ==============================================================================

/**
 * @route   POST /api/v1/roadmaps/generate-with-ai
 * @desc    Generate a new learning roadmap using Gemini AI, including resources
 * @access  Private
 */
router.post('/generate-with-ai', protect, async (req, res) => {
    const { skill, skillLevel, totalDurationDays, isPublic } = req.body;

    // 1. Input Validation
    if (!skill || !skillLevel || !totalDurationDays) {
        return res.status(400).json({ success: false, message: 'Please provide a skill, skill level, and duration.' });
    }
    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set in environment variables.');
        return res.status(500).json({ success: false, message: 'AI service is not configured.' });
    }

    // 2. AI Prompt Engineering
    const title = `Learn ${skill} (${skillLevel}) in ${totalDurationDays} Days`;
    const userPrompt = `Create a comprehensive, practical, day-by-day learning roadmap for a student who wants to learn "${skill}".
    The target proficiency level is "${skillLevel}", and the plan must be structured for exactly "${totalDurationDays}" days.`;

    // ADDED: The complete systemInstruction prompt as requested
    const systemInstruction = `You are an expert curriculum designer and career coach. Your task is to generate a detailed, day-by-day learning roadmap.
    
    You MUST return the response as a single, valid JSON object. Do not include any text, markdown, or explanations outside of the JSON object.
    
    The JSON object must strictly adhere to the following structure:
    {
      "description": "A concise and engaging summary of the roadmap. Use simple markdown for paragraphs and lists.",
      "category": "A broad category for the skill (e.g., 'Web Development', 'Data Science', 'Machine Learning').",
      "prerequisites": ["A list of essential skills or tools the user should know beforehand."],
      "tags": ["A list of relevant lowercase keywords for searching."],
      "dailyPlan": [
        {
          "day": 1,
          "title": "A theme for the day (e.g., 'Introduction to Core Concepts').",
          "activities": [
            {
              "title": "A specific activity for the day.",
              "description": "A brief explanation of the activity's goal. Use simple markdown (e.g., bullet points with '-') for clarity.",
              "activityType": "Choose from 'learning', 'practice', 'project', 'assessment'.",
              "estimatedTimeMinutes": 90,
              "resources": [
                {
                  "title": "Title of the resource.",
                  "url": "https://example.com/resource-url",
                  "resourceType": "Choose from 'video', 'article', 'documentation', 'book', 'project_source'."
                }
              ]
            }
          ]
        }
      ]
    }

    **CRITICAL INSTRUCTIONS:**
    1.  **Resources are Mandatory:** For every activity with type 'learning', you MUST provide at least one and up to three relevant, high-quality, real-world resources. The URLs must be valid and useful.
    2.  **Markdown for Descriptions:** Use simple markdown in all "description" fields for better readability when rendered as HTML.
    3.  **Realistic Plan:** Ensure the daily activities and estimated times are practical and realistic for a learner.
    4.  **No Extra Text:** The final output must be ONLY the JSON object, starting with { and ending with }.`;

    // CORRECTED: Use a stable, recent model for better performance and reliability.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
        // 3. Call Gemini AI API (Now with retry logic)
        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
                responseMimeType: "application/json",
            }
        };
        
        const result = await callApiWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 4. Parse AI Response
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!jsonText) {
            console.error('Invalid AI response structure:', JSON.stringify(result, null, 2));
            return res.status(500).json({ success: false, message: 'Received an invalid response from the AI service.' });
        }
        
        let aiData;
        try {
            aiData = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse AI JSON response:', parseError);
            console.error('Raw AI text that failed parsing:', jsonText);
            return res.status(500).json({ success: false, message: 'AI returned invalid JSON format.' });
        }

        // 5. Create and Save Roadmap to Database
        const newRoadmap = await LearningRoadmap.create({
            ...aiData,
            title,
            skill,
            skillLevel,
            totalDurationDays,
            owner: req.user.id,
            status: 'draft',
            isPublic: isPublic || false,
        });

        res.status(201).json({ success: true, data: newRoadmap });

    } catch (error) {
        console.error('Error in /generate-with-ai route:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while generating AI roadmap.' });
    }
});


/**
 * @route   GET /api/v1/roadmaps
 * @desc    Get all public, published learning roadmaps with pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const roadmaps = await LearningRoadmap.find({ isPublic: true, status: 'published' })
            .populate('owner', 'username profileInfo.avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await LearningRoadmap.countDocuments({ isPublic: true, status: 'published' });

        res.status(200).json({
            success: true,
            count: roadmaps.length,
            pagination: {
                next: (skip + roadmaps.length) < total ? { page: page + 1, limit } : null,
                prev: page > 1 ? { page: page - 1, limit } : null,
            },
            data: roadmaps,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/v1/roadmaps/my-roadmaps
 * @desc    Get all roadmaps created by the logged-in user
 * @access  Private
 */
router.get('/my-roadmaps', protect, async (req, res) => {
    try {
        const roadmaps = await LearningRoadmap.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: roadmaps.length, data: roadmaps });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   POST /api/v1/roadmaps
 * @desc    Create a new learning roadmap manually
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    try {
        req.body.owner = req.user.id;
        const roadmap = await LearningRoadmap.create(req.body);
        res.status(201).json({ success: true, data: roadmap });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});


/**
 * @route   GET /api/v1/roadmaps/:slug
 * @desc    Get a single roadmap by slug and increment view count
 * @access  Public
 */
router.get('/:slug', async (req, res) => {
    try {
        const roadmap = await LearningRoadmap.findOne({ slug: req.params.slug })
            .populate('owner', 'username profileInfo')
            .populate('ratings.user', 'username profileInfo.avatar');

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }
        
        roadmap.recordView().catch(err => console.error("Failed to record view:", err));

        res.status(200).json({ success: true, data: roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   PUT /api/v1/roadmaps/:id
 * @desc    Update a learning roadmap
 * @access  Private (Owner or Admin)
 */
router.put('/:id', protect, async (req, res) => { 
    try {
        let roadmap = await LearningRoadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        if (roadmap.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this roadmap' });
        }

        roadmap = await LearningRoadmap.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: roadmap });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});


/**
 * @route   DELETE /api/v1/roadmaps/:id
 * @desc    Delete a learning roadmap
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const roadmap = await LearningRoadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        if (roadmap.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this roadmap' });
        }

        await roadmap.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   PUT /api/v1/roadmaps/:id/like
 * @desc    Like or unlike a roadmap
 * @access  Private
 */
router.put('/:id/like', protect, async (req, res) => {
    try {
        const roadmap = await LearningRoadmap.findById(req.params.id);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        const isLiked = roadmap.likedBy.some(userId => userId.equals(req.user.id));
        let update;
        if (isLiked) {
            update = {
                $pull: { likedBy: req.user.id },
                $inc: { likesCount: -1 }
            };
        } else {
            update = {
                $addToSet: { likedBy: req.user.id },
                $inc: { likesCount: 1 }
            };
        }

        const updatedRoadmap = await LearningRoadmap.findByIdAndUpdate(req.params.id, update, { new: true });
        res.status(200).json({ success: true, data: { likesCount: updatedRoadmap.likesCount } });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/v1/roadmaps/:id/fork
 * @desc    Create a copy of a roadmap for the current user
 * @access  Private
 */
router.post('/:id/fork', protect, async (req, res) => {
    try {
        const originalRoadmap = await LearningRoadmap.findById(req.params.id);
        if (!originalRoadmap || !originalRoadmap.isPublic) {
            return res.status(404).json({ success: false, message: 'Public roadmap not found' });
        }
        
        if (originalRoadmap.owner.equals(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot fork your own roadmap.' });
        }

        const forkData = originalRoadmap.toObject();
        delete forkData._id;
        delete forkData.slug;
        
        forkData.owner = req.user.id;
        forkData.title = `Fork of: ${originalRoadmap.title}`;
        forkData.status = 'draft';
        forkData.isPublic = false;
        forkData.viewsCount = 0;
        forkData.likesCount = 0;
        forkData.likedBy = [];
        forkData.forksCount = 0;
        forkData.ratings = [];
        forkData.createdAt = new Date();
        forkData.updatedAt = new Date();

        const forkedRoadmap = await LearningRoadmap.create(forkData);
        
        originalRoadmap.forksCount++;
        await originalRoadmap.save();

        res.status(201).json({ success: true, data: forkedRoadmap });

    } catch (error) {
        console.error("Forking error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   POST /api/v1/roadmaps/:id/ratings
 * @desc    Add or update a rating for a roadmap
 * @access  Private
 */
router.post('/:id/ratings', protect, async (req, res) => {
    try {
        const { rating, review } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a rating between 1 and 5.' });
        }

        const roadmap = await LearningRoadmap.findById(req.params.id);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }
        
        if (roadmap.owner.equals(req.user.id)) {
            return res.status(403).json({ success: false, message: 'You cannot rate your own roadmap.' });
        }

        const existingRatingIndex = roadmap.ratings.findIndex(r => r.user.equals(req.user.id));
        
        if (existingRatingIndex > -1) {
            roadmap.ratings[existingRatingIndex].rating = rating;
            roadmap.ratings[existingRatingIndex].review = review;
        } else {
            roadmap.ratings.push({ user: req.user.id, rating, review });
        }

        await roadmap.save();
        res.status(201).json({ success: true, data: roadmap.ratings });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


export default router;