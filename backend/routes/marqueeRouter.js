import { Router } from 'express';
import MarqueeMessage from '../models/MarqueeMessage.js';
import { protect, authorize } from '../middleware/authMiddleware.js'; // Assuming you have these middleware functions

const router = Router();

// =====================================
// === PUBLIC ROUTES (GET requests) ===
// =====================================

/**
 * @desc    Get all active marquee messages, sorted by priority
 * @route   GET /api/marquee
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const activeMessages = await MarqueeMessage.find({ 
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: new Date() } }
      ]
    }).sort({ priority: -1, createdAt: 1 }); // Sort by priority (desc), then creation date

    res.status(200).json({
      success: true,
      data: activeMessages,
    });
  } catch (error) {
    console.error('Error fetching public marquee messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================
// === ADMIN ROUTES (Protected) ===
// =====================================

/**
 * @desc    Get all marquee messages (active and inactive)
 * @route   GET /api/marquee/admin
 * @access  Private (Admin)
 */
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const allMessages = await MarqueeMessage.find().sort({ priority: -1, createdAt: 1 });
    res.status(200).json({
      success: true,
      data: allMessages,
    });
  } catch (error) {
    console.error('Error fetching all marquee messages for admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @desc    Create a new marquee message
 * @route   POST /api/marquee
 * @access  Private (Admin)
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { message, link, isActive, startDate, endDate, priority } = req.body;
    
    // Create new message with optional fields
    const newMessage = new MarqueeMessage({
      message,
      link,
      isActive,
      startDate,
      endDate,
      priority,
    });

    const createdMessage = await newMessage.save();
    res.status(201).json({
      success: true,
      message: 'Marquee message created successfully.',
      data: createdMessage,
    });
  } catch (error) {
    console.error('Error creating marquee message:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Update an existing marquee message
 * @route   PUT /api/marquee/:id
 * @access  Private (Admin)
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { message, link, isActive, startDate, endDate, priority } = req.body;
    const updateData = { ...req.body, updatedAt: Date.now() };

    const updatedMessage = await MarqueeMessage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true } // `new: true` returns the updated document
    );

    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: 'Marquee message not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Marquee message updated successfully.',
      data: updatedMessage,
    });
  } catch (error) {
    console.error(`Error updating marquee message with ID ${req.params.id}:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Delete a marquee message
 * @route   DELETE /api/marquee/:id
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const deletedMessage = await MarqueeMessage.findByIdAndDelete(req.params.id);

    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: 'Marquee message not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Marquee message deleted successfully.',
    });
  } catch (error) {
    console.error(`Error deleting marquee message with ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;