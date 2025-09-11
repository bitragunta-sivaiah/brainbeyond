import { Router } from 'express';
import User from '../models/User.js';
import AdminProfile from '../models/AdminProfile.js';
import StudentProfile from '../models/StudentProfile.js';
import InstructorProfile from '../models/InstructorProfile.js';
import CustomerCareProfile from '../models/CustomerCareProfile.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Order from '../models/Order.js';

const adminRouter = Router();

// Middleware to protect all routes in this router and authorize only admins
adminRouter.use(protect);
adminRouter.use(authorize('admin'));

// Helper function to get the correct profile model
const getProfileModel = (role) => {
  switch (role) {
    case 'student':
      return StudentProfile;
    case 'instructor':
      return InstructorProfile;
    case 'admin':
      return AdminProfile;
    case 'customercare':
      return CustomerCareProfile;
    default:
      return null;
  }
};

/**
 * @desc Get the current admin's profile
 * @route GET /api/v1/admin/me
 * @access Private/Admin
 */
adminRouter.get('/me', async (req, res) => {
  try {
    const adminProfile = await AdminProfile.findOne({ user: req.user._id }).populate('user', '-password').populate('user.profiles.adminProfile');

    if (!adminProfile) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    res.status(200).json({ success: true, data: adminProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @desc Update the current admin's profile and user details
 * @route PUT /api/v1/admin/me
 * @access Private/Admin
 */
// A more robust version of your router
adminRouter.put('/me', protect, async (req, res) => {
  try {
    const {
      profileInfo = {}, // Destructure with default empty objects to prevent errors
      socialLinks = {},
      notificationPreferences = {},
      ...adminProfileUpdates
    } = req.body;

    console.log('Incoming request body:', req.body);
    console.log('User profile info to update:', profileInfo);

    const userId = req.user._id;

    // --- Prepare User document updates with dot notation ---
    const userUpdates = {};

    // Helper function to safely assign values
    const assignIfDefined = (target, path, value) => {
      if (value !== undefined) {
        target[path] = value;
      }
    };

    // Profile Information
    assignIfDefined(userUpdates, 'profileInfo.firstName', profileInfo.firstName);
    assignIfDefined(userUpdates, 'profileInfo.lastName', profileInfo.lastName);
    assignIfDefined(userUpdates, 'profileInfo.avatar', profileInfo.avatar);
    assignIfDefined(userUpdates, 'profileInfo.phone', profileInfo.phone);
    assignIfDefined(userUpdates, 'profileInfo.dateOfBirth', profileInfo.dateOfBirth);
    assignIfDefined(userUpdates, 'profileInfo.gender', profileInfo.gender);
    assignIfDefined(userUpdates, 'profileInfo.bio', profileInfo.bio);

    // Address
    if (profileInfo.address) {
      assignIfDefined(userUpdates, 'profileInfo.address.street', profileInfo.address.street);
      assignIfDefined(userUpdates, 'profileInfo.address.city', profileInfo.address.city);
      assignIfDefined(userUpdates, 'profileInfo.address.state', profileInfo.address.state);
      assignIfDefined(userUpdates, 'profileInfo.address.country', profileInfo.address.country);
      assignIfDefined(userUpdates, 'profileInfo.address.zipCode', profileInfo.address.zipCode);
    }

    // Social Links
    Object.entries(socialLinks).forEach(([key, value]) => {
      assignIfDefined(userUpdates, `socialLinks.${key}`, value);
    });

    // Notification Preferences
    Object.entries(notificationPreferences).forEach(([type, prefs]) => {
      Object.entries(prefs).forEach(([key, value]) => {
        assignIfDefined(userUpdates, `notificationPreferences.${type}.${key}`, value);
      });
    });

    // --- Prepare AdminProfile document updates ---
    const adminProfileUpdateFields = {};
    assignIfDefined(adminProfileUpdateFields, 'position', adminProfileUpdates.position);
    assignIfDefined(adminProfileUpdateFields, 'department', adminProfileUpdates.department);
    assignIfDefined(adminProfileUpdateFields, 'responsibilities', adminProfileUpdates.responsibilities);
    assignIfDefined(adminProfileUpdateFields, 'accessLevel', adminProfileUpdates.accessLevel);
    assignIfDefined(adminProfileUpdateFields, 'permissions', adminProfileUpdates.permissions);

    // Contact Information
    if (adminProfileUpdates.contactInformation) {
      assignIfDefined(adminProfileUpdateFields, 'contactInformation.officeLocation', adminProfileUpdates.contactInformation.officeLocation);
      assignIfDefined(adminProfileUpdateFields, 'contactInformation.phoneExtension', adminProfileUpdates.contactInformation.phoneExtension);
      assignIfDefined(adminProfileUpdateFields, 'contactInformation.emergencyContact', adminProfileUpdates.contactInformation.emergencyContact);
    }

    // Perform updates only if there are changes to be made
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(
        userId,
        { $set: userUpdates },
        { new: true, runValidators: true }
      );
    }

    let updatedAdminProfile;
    if (Object.keys(adminProfileUpdateFields).length > 0) {
      updatedAdminProfile = await AdminProfile.findOneAndUpdate(
        { user: userId },
        { $set: adminProfileUpdateFields },
        { new: true, runValidators: true }
      );
    } else {
      updatedAdminProfile = await AdminProfile.findOne({ user: userId });
    }

    if (!updatedAdminProfile) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    // Re-fetch the user to get the latest state after updates
    const updatedUser = await User.findById(userId).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
        profile: updatedAdminProfile,
      },
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    // Use a more generic error message for security
    res.status(500).json({
      success: false,
      message: 'Server error',
      // In a production environment, you might not want to send the raw error message
      // error: error.message, 
    });
  }
});



/**
 * @desc Get all users and their associated profiles
 * @route GET /api/v1/admin/users
 * @access Private/Admin
 */
adminRouter.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const ProfileModel = getProfileModel(user.role);
        const profile = ProfileModel ? await ProfileModel.findOne({ user: user._id }) : null;
        return { ...user.toObject(), profile };
      })
    );
    res.status(200).json({ success: true, count: users.length, data: usersWithProfiles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @desc Get a single user by ID with their profile
 * @route GET /api/v1/admin/users/:id
 * @access Private/Admin
 */
adminRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ProfileModel = getProfileModel(user.role);
    const profile = ProfileModel ? await ProfileModel.findOne({ user: user._id }) : null;

    res.status(200).json({ success: true, data: { ...user.toObject(), profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @desc Update a user's role and automatically create/delete associated profiles
 * @route PUT /api/v1/admin/users/:id/role
 * @access Private/Admin
 */
adminRouter.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'student', 'instructor', 'customercare'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    if (req.user._id.toString() === req.params.id && role !== 'admin') {
      return res.status(403).json({ message: 'Cannot change your own role to a non-admin role' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    const newRole = role;

    if (oldRole !== newRole) {
      const OldProfileModel = getProfileModel(oldRole);
      const NewProfileModel = getProfileModel(newRole);

      // Delete the old profile
      if (OldProfileModel) {
        await OldProfileModel.findOneAndDelete({ user: user._id });
        user.profiles[`${oldRole}Profile`] = undefined;
      }

      // Create the new profile
      if (NewProfileModel) {
        const newProfile = await NewProfileModel.create({ user: user._id });
        user.profiles[`${newRole}Profile`] = newProfile._id;
      }

      user.role = newRole;
      await user.save();
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @desc Update a user's status
 * @route PUT /api/v1/admin/users/:id/status
 * @access Private/Admin
 */
adminRouter.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'banned', 'deleted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Cannot change the status of another admin' });
    }

    if (status === 'deleted') {
      await user.remove(); // This triggers the pre-remove hook
    } else {
      user.isActive = status === 'active';
      await user.save();
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


/**
 * @desc Delete a user permanently
 * @route DELETE /api/v1/admin/users/:id
 * @access Private/Admin
 */
adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete another admin' });
    }

    await user.remove();

    res.status(200).json({ success: true, message: 'User and associated profile deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @desc Get all orders with a summary of enrollments and revenue
 * @route GET /api/v1/admin/orders
 * @access Private/Admin
 */
adminRouter.get('/orders', async (req, res) => {
  try {
    // 1. Fetch all orders
    const orders = await Order.find()
      .populate('user', 'profileInfo.firstName profileInfo.lastName email')
      .populate('items.itemId')
      .sort({ createdAt: -1 });

    // 2. Calculate summary statistics
    let totalRevenue = 0;
    const enrolledStudents = new Set();
    const orderCount = orders.length;

    orders.forEach(order => {
      // Sum the total of each order
      // Mongoose's Decimal128 type needs to be converted to a number or string for calculations
      totalRevenue += parseFloat(order.pricing.total.toString());

      // Add the user ID to the Set to count unique enrolled students
      if (order.user) {
        enrolledStudents.add(order.user._id.toString());
      }
    });

    const totalStudentsEnrolled = enrolledStudents.size;

    // 3. Send the response
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: orderCount,
          totalStudentsEnrolled: totalStudentsEnrolled,
          totalRevenue: totalRevenue.toFixed(2), // Format revenue to two decimal places
        },
        orders,
      },
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});


export default adminRouter;