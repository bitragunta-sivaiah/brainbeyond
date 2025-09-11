import express from 'express';
import Hero from '../models/Hero.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a new hero page
// @route   POST /api/heroes
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink, image, role } = req.body;
    const hero = await Hero.create({
      title,
      subtitle,
      ctaText,
      ctaLink,
      image,
      role,
    });
    res.status(201).json(hero);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all active hero pages for a specific user role
// @route   GET /api/heroes
// @access  Public
router.get('/', async (req, res) => {
  const { role } = req.query; // Expects a role query parameter
  const filter = {  };
  if (role) {
    filter.role = { $in: ['all', role] };
  } else {
    filter.role = 'all'; // Default to 'all' if no role is provided
  }
  
  try {
    const heroes = await Hero.find(filter).sort({ createdAt: -1 });
    res.status(200).json(heroes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a hero page
// @route   PUT /api/heroes/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedHero = await Hero.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedHero) {
      return res.status(404).json({ message: 'Hero not found' });
    }
    res.status(200).json(updatedHero);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a hero page
// @route   DELETE /api/heroes/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const deletedHero = await Hero.findByIdAndDelete(id);
    if (!deletedHero) {
      return res.status(404).json({ message: 'Hero not found' });
    }
    res.status(200).json({ message: 'Hero removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;