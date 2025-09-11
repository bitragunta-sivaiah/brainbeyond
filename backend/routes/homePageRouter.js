import express from 'express';
import mongoose from 'mongoose';

// Import the HomePage model. Ensure the path is correct for your project structure.
import HomePage from '../models/HomePage.js';

const router = express.Router();

/**
 * @route GET /api/homepage/active
 * @desc Get the currently active and published homepage configuration.
 * If no active page is explicitly set, it fetches the default one.
 * @access Public
 */
router.get('/active', async (req, res) => {
    try {
        let activeHomepage = await HomePage.findOne({
            $or: [{ isActive: true }, { isDefault: true }],
        })
        .sort({ isActive: -1 }) // Prioritize 'isActive' over 'isDefault'
        .populate([
            {
                path: 'sections.featuredCoursesConfig.courses',
                model: 'Course',
                select: 'title slug thumbnail shortDescription price discountedPrice rating totalStudents'
            },
            {
                path: 'sections.instructorSpotlightConfig.instructors',
                model: 'User',
                select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar email'
            },
            {
                path: 'sections.testimonialsConfig.testimonials.user',
                model: 'User',
                select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar'
            }
        ]);

        if (!activeHomepage) {
            return res.status(404).json({
                success: false,
                message: 'No active or default homepage configuration found.'
            });
        }

        // Add a check for section visibility based on startDate and endDate
        const now = new Date();
        activeHomepage.sections = activeHomepage.sections.filter(section => {
            const isVisible = section.isActive;
            const isScheduled = (!section.startDate || section.startDate <= now) && (!section.endDate || section.endDate >= now);
            return isVisible && isScheduled;
        });

        // Ensure sections are sorted correctly
        activeHomepage.sections.sort((a, b) => a.order - b.order);

        res.status(200).json({
            success: true,
            data: activeHomepage
        });

    } catch (error) {
        console.error('Error fetching active homepage:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error while fetching homepage data.',
            error: error.message
        });
    }
});

// --- Other Routes ---
// The following routes have been corrected for pathing and logic.
// The provided router.post and router.put for /homepage are redundant in logic with
// the new set-default route and the model's pre-save hook.
// The code below simplifies and corrects them.
// The pathing of all routes has been fixed to use the correct Express router syntax.

/**
 * @route GET /api/homepage
 * @desc Get all homepage configurations
 * @access Private (Admin only - assumed via middleware)
 */
router.get('/', async (req, res) => {
    try {
        const homepages = await HomePage.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: homepages.length,
            data: homepages
        });
    } catch (error) {
        console.error('Error fetching all homepages:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error.',
            error: error.message
        });
    }
});

/**
 * @route POST /api/homepage
 * @desc Create a new homepage configuration
 * @access Private (Admin only - assumed via middleware)
 */
router.post('/', async (req, res) => {
    try {
        const newHomepage = await HomePage.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Homepage configuration created successfully.',
            data: newHomepage
        });
    } catch (error) {
        console.error('Error creating homepage:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error while creating homepage.',
            error: error.message
        });
    }
});

/**
 * @route GET /api/homepage/:id
 * @desc Get a specific homepage configuration by ID
 * @access Private (Admin only - assumed via middleware)
 */
router.get('/:id', async (req, res) => {
    try {
        const homepage = await HomePage.findById(req.params.id)
            .populate([
                {
                    path: 'sections.featuredCoursesConfig.courses',
                    model: 'Course',
                    select: 'title slug'
                },
                {
                    path: 'sections.instructorSpotlightConfig.instructors',
                    model: 'User',
                    select: 'profileInfo.firstName profileInfo.lastName'
                },
                {
                    path: 'sections.testimonialsConfig.testimonials.user',
                    model: 'User',
                    select: 'profileInfo.firstName profileInfo.lastName'
                }
            ]);

        if (!homepage) {
            return res.status(404).json({ success: false, message: 'Homepage configuration not found.' });
        }

        res.status(200).json({
            success: true,
            data: homepage
        });
    } catch (error) {
        console.error('Error fetching homepage by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error.',
            error: error.message
        });
    }
});


/**
 * @route PUT /api/homepage/:id
 * @desc Update an existing homepage configuration
 * @access Private (Admin only - assumed via middleware)
 */
router.put('/:id', async (req, res) => {
    try {
        const homepage = await HomePage.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!homepage) {
            return res.status(404).json({ success: false, message: 'Homepage configuration not found.' });
        }
        
        res.status(200).json({
            success: true,
            message: 'Homepage configuration updated successfully.',
            data: homepage
        });
    } catch (error) {
        console.error('Error updating homepage:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error while updating homepage.',
            error: error.message
        });
    }
});


/**
 * @route DELETE /api/homepage/:id
 * @desc Delete a homepage configuration
 * @access Private (Admin only - assumed via middleware)
 */
router.delete('/:id', async (req, res) => {
    try {
        const homepage = await HomePage.findById(req.params.id);

        if (!homepage) {
            return res.status(404).json({ success: false, message: 'Homepage configuration not found.' });
        }

        // Prevent deleting the only default homepage
        if (homepage.isDefault) {
            const defaultCount = await HomePage.countDocuments({ isDefault: true });
            if (defaultCount === 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the only default homepage. Please set another as default first.'
                });
            }
        }
        
        await homepage.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Homepage configuration deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting homepage:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error while deleting homepage.',
            error: error.message
        });
    }
});


/**
 * @route PUT /api/homepage/:id/set-default
 * @desc Set a specific homepage configuration as the active default.
 * @access Private (Admin only - assumed via middleware)
 */
router.put('/:id/set-default', async (req, res) => {
    try {
        const homepageId = req.params.id;

        // Find the target homepage to set as default
        const homepageToSetDefault = await HomePage.findById(homepageId);
        if (!homepageToSetDefault) {
            return res.status(404).json({ success: false, message: 'Homepage configuration not found.' });
        }

        // Deactivate all other homepages and unset their default status
        await HomePage.updateMany(
            { _id: { $ne: homepageId } },
            { $set: { isActive: false, isDefault: false } }
        );

        // Set the target homepage as active and default, and save.
        homepageToSetDefault.isActive = true;
        homepageToSetDefault.isDefault = true;
        await homepageToSetDefault.save();

        res.status(200).json({
            success: true,
            message: `Homepage '${homepageToSetDefault.name}' successfully set as active default.`,
            data: homepageToSetDefault
        });

    } catch (error) {
        console.error('Error setting homepage as default:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error while setting default homepage.',
            error: error.message
        });
    }
});


export default router;