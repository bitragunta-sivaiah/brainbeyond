import express from 'express';
import Coupon from '../models/Coupon.js'; // Assuming CouponModel.js is in the same directory

const router = express.Router();

// Middleware to parse JSON request bodies
router.use(express.json());

// --- GET All Coupons ---
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json({
      status: 'success',
      results: coupons.length,
      data: {
        coupons,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// --- GET Single Coupon by ID ---
router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No coupon found with that ID',
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        coupon,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid coupon ID',
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// --- CREATE New Coupon ---
router.post('/', async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        coupon: newCoupon,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'fail',
        message: errors.join(', '),
      });
    }
    // Handle duplicate key error (for unique code)
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Coupon with this code already exists.',
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// --- UPDATE Coupon by ID ---
router.patch('/:id', async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Return the modified document rather than the original
      runValidators: true, // Run schema validators on update
    });

    if (!updatedCoupon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No coupon found with that ID',
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        coupon: updatedCoupon,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid coupon ID',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'fail',
        message: errors.join(', '),
      });
    }
    if (error.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: 'Coupon with this code already exists.',
        });
    }
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// --- DELETE Coupon by ID ---
router.delete('/:id', async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!deletedCoupon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No coupon found with that ID',
      });
    }
    res.status(204).json({ // 204 No Content for successful deletion
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid coupon ID',
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
