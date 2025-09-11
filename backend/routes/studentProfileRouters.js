import express from 'express';
import StudentProfile from '../models/StudentProfile.js'; // Adjust the path as needed
import User from '../models/User.js'; // Assuming the User model is in this path
import { protect, authorize } from '../middleware/authMiddleware.js'; // Import your actual middleware

const router = express.Router();

// @route   POST /api/v1/studentprofiles
// @desc    Create a new student profile
// @access  Private (for the authenticated user, creates profile for themselves)
router.post('/', protect, async (req, res) => {
  try {
    // Ensure the profile is created for the authenticated user
    const userId = req.user.id; 
    
    // Check if a profile already exists for this user
    const existingProfile = await StudentProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({ success: false, error: 'A profile for this user already exists.' });
    }

    // Create the student profile, linking it to the authenticated user
    const studentProfile = await StudentProfile.create({
      ...req.body, // Spread other profile fields from the request body
      user: userId // Assign the authenticated user's ID
    });

    // Update the User model to reference the new student profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 'profiles.studentProfile': studentProfile._id },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      // Clean up the created profile if user update fails (unlikely if user exists)
      await StudentProfile.findByIdAndDelete(studentProfile._id);
      return res.status(404).json({ success: false, error: 'User not found, profile creation failed to link.' });
    }

    res.status(201).json({ success: true, data: studentProfile });
  } catch (error) {
    console.error(error); // Log the full error for debugging
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// @route   GET /api/v1/studentprofiles/me
// @desc    Get the currently authenticated user's student profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user.id })
      .populate('user' );

    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found for this user.' });
    }
    res.status(200).json({ success: true, data: studentProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/v1/studentprofiles/:id
// @desc    Update a student profile
// @access  Private (Only the profile owner can update)
router.put('/:id', protect, async (req, res) => {
  try {
    let studentProfile = await StudentProfile.findById(req.params.id) ;
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // Authorization check: ensure the user is updating their own profile
    if (studentProfile.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to update this profile.' });
    }

    // Prevent direct update of 'user' field
    if (req.body.user && req.body.user.toString() !== req.user.id) {
      delete req.body.user; // Or explicitly return an an error if trying to change ownership
    }

    studentProfile = await StudentProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('user');

    res.status(200).json({ success: true, data: studentProfile });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// @route   DELETE /api/v1/studentprofiles/:id
// @desc    Delete a student profile
// @access  Private (Only the profile owner or admin can delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findById(req.params.id);
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // Authorization check: owner or admin
    if (studentProfile.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this profile.' });
    }

    // If deleting, first remove the reference from the User document
    await User.findByIdAndUpdate(studentProfile.user, { 'profiles.studentProfile': null });
    
    // Then delete the student profile document
    await studentProfile.deleteOne(); // Using deleteOne() to trigger any pre-hooks

    res.status(200).json({ success: true, data: {} });
  } catch(error){
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

export default router;
