import express from 'express';
import mongoose from 'mongoose';

// IMPORTANT: Adjust these paths to correctly point to your model files
import User from '../models/User.js';
import InstructorProfile from '../models/InstructorProfile.js';
import Course from '../models/Course.js';
import { protect, authorize } from '../middleware/authMiddleware.js'; // Adjust path as necessary

const router = express.Router();

/**
 * @desc    Create a new instructor profile for a user
 * @route   POST /api/instructors/profile
 * @access  Private (Auth: Instructor only, and only for their own userId)
 */
router.post('/profile', protect, authorize('instructor'), async (req, res) => {
  const { userId, bio, specializations, headline } = req.body;

  // Ensure the authenticated user is creating a profile for themselves
  if (req.user.id !== userId) {
    return res.status(403).json({ success: false, error: 'Not authorized to create a profile for another user.' });
  }

  // Basic validation
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID provided.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'User is not an instructor.' });
    }

    // Check if a profile already exists
    if (user.profiles.instructorProfile) {
      return res.status(409).json({ success: false, error: 'Instructor profile already exists for this user.' });
    }

    const newProfile = await InstructorProfile.create({
      user: userId,
      bio, // This 'bio' goes to instructorProfile.bio
      specializations,
      headline,
    });

    // Link the new profile to the user
    user.profiles.instructorProfile = newProfile._id;
    await user.save();

    res.status(201).json({
      success: true,
      data: newProfile,
      message: 'Instructor profile created successfully.',
    });
  } catch (error) {
    console.error('Error creating instructor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

 

/**
 * @desc    Get an instructor's profile
 * @route   GET /api/instructors/:userId/profile
 * @access  Public (Anyone can view an instructor's public profile)
 */
router.get('/:userId/profile', async (req, res) => { // This route can remain public for viewing
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    const profile = await InstructorProfile.findOne({ user: userId }).populate({
      path: 'user',
      select: 'username email profileInfo socialLinks isVerified',
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found.' });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error getting instructor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

 

/**
 * @desc    Update both the User and InstructorProfile for a specific instructor.
 * @route   PUT /api/instructors/:userId/profile
 * @access  Private (Auth: Instructor only, and only for their own userId)
 *
 * @body    Can include fields for User.profileInfo, User.socialLinks,
 * and InstructorProfile fields (headline, bio, specializations, etc.)
 */
router.put('/:userId/profile', protect, authorize('instructor'), async (req, res) => {
  const { userId } = req.params;
  // Deconstruct the nested objects from the request body
  const { profileInfo, instructorProfile, socialLinks } = req.body;

  // Ensure the authenticated user is updating their own profile
  if (req.user.id !== userId) {
    return res.status(403).json({ success: false, error: 'Not authorized to update another user\'s profile.' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    // Find the User and InstructorProfile documents
    const user = await User.findById(userId);
    const instructorDoc = await InstructorProfile.findOne({ user: userId });

    if (!user || !instructorDoc) {
      return res.status(404).json({ success: false, error: 'User or Instructor profile not found.' });
    }

    // Update the User model's nested profileInfo and socialLinks fields
    if (profileInfo) {
      Object.keys(profileInfo).forEach(key => {
        // Handle nested address object specifically
        if (key === 'address' && profileInfo.address) {
          user.profileInfo.address = { ...user.profileInfo.address, ...profileInfo.address };
        } else {
          user.profileInfo[key] = profileInfo[key];
        }
      });
    }

    if (socialLinks) {
      user.socialLinks = { ...user.socialLinks, ...socialLinks };
    }

    // Update the InstructorProfile model fields
    if (instructorProfile) {
      Object.keys(instructorProfile).forEach(key => {
        instructorDoc[key] = instructorProfile[key];
      });
    }

    // Save both documents
    await user.save();
    await instructorDoc.save();

    // Optionally, re-fetch and send back the updated data to keep the client in sync
    const updatedUser = await User.findById(userId).select('-password');
    const updatedInstructor = await InstructorProfile.findOne({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
        instructorProfile: updatedInstructor,
      },
      message: 'User and instructor profile updated successfully.',
    });

  } catch (error) {
    console.error('Error updating instructor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

 

/**
 * @desc    Delete an instructor's profile
 * @route   DELETE /api/instructors/:userId/profile
 * @access  Private (Auth: Instructor only, and only for their own userId, or Admin)
 */
router.delete('/:userId/profile', protect, authorize('instructor', 'admin'), async (req, res) => {
  const { userId } = req.params;

  // Allow deletion only if the user is an admin or is deleting their own profile
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    return res.status(403).json({ success: false, error: 'Not authorized to delete this profile.' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    const deletedProfile = await InstructorProfile.findOneAndDelete({ user: userId });

    if (!deletedProfile) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found.' });
    }

    // Also remove the reference from the user document
    await User.findByIdAndUpdate(userId, {
      $unset: { 'profiles.instructorProfile': '' }
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Instructor profile deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting instructor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

 

/**
 * @desc    Get all courses created by a specific instructor
 * @route   GET /api/instructors/:userId/courses
 * @access  Private (Auth: Any authenticated user can view an instructor's courses, or even public if desired)
 * For this example, we'll keep it protected to ensure valid requests.
 */
router.get('/:userId/courses', protect, async (req, res) => { // Anyone logged in can view
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    const courses = await Course.find({ instructors: userId })
      .populate({ path: 'instructors', select: 'profileInfo.firstName profileInfo.lastName' })
      .select('title slug thumbnail shortDescription price rating totalStudents');

    if (!courses || courses.length === 0) {
      return res.status(404).json({ success: false, error: 'No courses found for this instructor.' });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('Error getting instructor courses:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

export default router;