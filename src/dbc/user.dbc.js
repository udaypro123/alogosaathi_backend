import User from '../models/User.models.js'
import { deleteFile } from '../utils/fileUpload.js'

// Get all users with pagination and filtering
const getAllUsers = async (queryParams) => {
  try {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (queryParams.role) {
      filter.role = queryParams.role;
    }
    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true';
    }
    if (queryParams.search) {
      filter.$or = [
        { firstName: { $regex: queryParams.search, $options: 'i' } },
        { lastName: { $regex: queryParams.search, $options: 'i' } },
        { email: { $regex: queryParams.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get single user by ID
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -refreshTokens');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// Update user profile
const updateUserProfile = async (userId, updateData) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      gender,
      address
    } = updateData;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    return getUserResponse(user);
  } catch (error) {
    throw error;
  }
};

// const changePassword = async (userId, currentPassword, newPassword) => {
//   try {
//     const user = await User.findById(userId);

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Check current password
//     const isMatch = await user.matchPassword(currentPassword);

//     if (!isMatch) {
//       throw new Error('Current password is incorrect');
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();

//     return { message: 'Password changed successfully' };
//   } catch (error) {
//     throw error;
//   }
// };

// Upload profile picture
const uploadProfilePicture = async (userId, file) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      await deleteFile(user.profilePicture);
    }

    // Update profile picture
    user.profilePicture = file.filename;
    await user.save();

    return getUserResponse(user);
  } catch (error) {
    throw error;
  }
};

// Delete user (soft delete)
const deleteUser = async (userId, currentUserId) => {
  try {
    if (userId === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    return { message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Toggle user status
const toggleUserStatus = async (userId, isActive, currentUserId) => {
  try {
    if (userId === currentUserId) {
      throw new Error('You cannot change your own status');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = isActive;
    if (!isActive) {
      user.deletedAt = new Date();
    } else {
      user.deletedAt = undefined;
    }

    await user.save();

    return getUserResponse(user);
  } catch (error) {
    throw error;
  }
};

// Get user statistics
const getUserStatistics = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Recent users
    const recentUsers = await User.find({ isActive: true })
      .select('firstName lastName email profilePicture createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      newUsersThisMonth,
      recentUsers
    };
  } catch (error) {
    throw error;
  }
};

// Format user response (remove sensitive data)
const getUserResponse = (user) => {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    // fullName: user.fullName,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
    profilePicture: user.profilePicture,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

// Search users
const searchUsers = async (searchQuery, currentUserId) => {
  try {
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { isActive: true },
        {
          $or: [
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    }).select('firstName lastName email profilePicture role')
      .limit(10);

    return users;
  } catch (error) {
    throw error;
  }
};

// Get users by role
const getUsersByRole = async (role) => {
  try {
    const users = await User.find({ role, isActive: true })
      .select('firstName lastName email phoneNumber profilePicture')
      .sort({ firstName: 1 });

    return users;
  } catch (error) {
    throw error;
  }
};

export  {
  getAllUsers,
  getUserById,
  updateUserProfile,
  // changePassword,
  uploadProfilePicture,
  deleteUser,
  toggleUserStatus,
  getUserStatistics,
  getUserResponse,
  searchUsers,
  getUsersByRole
};
