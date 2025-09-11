import { Router } from 'express';
import FAQ from '../models/FAQ.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// =====================================
// === PUBLIC ROUTES (GET requests) ===
// =====================================

/**
 * @desc    Get all published FAQs, sorted by order
 * @route   GET /api/faq
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find({ isPublished: true }).sort({ order: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================
// === ADMIN ROUTES (Protected) ===
// =====================================

/**
 * @desc    Get all FAQs (including unpublished), sorted by order
 * @route   GET /api/faq/admin
 * @access  Private (Admin)
 */
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Error fetching all FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @desc    Create a new FAQ
 * @route   POST /api/faq
 * @access  Private (Admin)
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { question, answer, category, isPublished } = req.body;
    const lastFaq = await FAQ.findOne().sort({ order: -1 });
    const newOrder = lastFaq ? lastFaq.order + 1 : 0;

    const newFaq = new FAQ({
      question,
      answer,
      category,
      isPublished,
      order: newOrder,
    });

    const createdFaq = await newFaq.save();
    res.status(201).json({ success: true, data: createdFaq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// --- FIX IS HERE: Place the more specific '/order' route first ---
/**
 * @desc    Update the order of multiple FAQs (for drag-and-drop)
 * @route   PUT /api/faq/order
 * @access  Private (Admin)
 */
router.put('/order', protect, authorize('admin'), async (req, res) => {
  try {
    const { faqs } = req.body; 
    if (!Array.isArray(faqs) || faqs.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty array of FAQs' });
    }

    const bulkOps = faqs.map(faq => ({
      updateOne: {
        filter: { _id: faq._id },
        update: { order: faq.order },
      },
    }));

    const result = await FAQ.bulkWrite(bulkOps);
    
    res.status(200).json({ success: true, message: `${result.modifiedCount} FAQs updated successfully.` });
  } catch (error) {
    console.error('Error updating FAQ order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @desc    Update an FAQ
 * @route   PUT /api/faq/:id
 * @access  Private (Admin)
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { question, answer, category, isPublished, order } = req.body;
    
    const updatedFaq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer, category, isPublished, order, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedFaq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    res.status(200).json({ success: true, data: updatedFaq });
  } catch (error) {
    console.error(`Error updating FAQ with ID ${req.params.id}:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get a single FAQ by ID
 * @route   GET /api/faq/:id
 * @access  Private (Admin)
 */
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    console.error(`Error fetching FAQ with ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


/**
 * @desc    Delete an FAQ
 * @route   DELETE /api/faq/:id
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const deletedFaq = await FAQ.findByIdAndDelete(req.params.id);

    if (!deletedFaq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error(`Error deleting FAQ with ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;