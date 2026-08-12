
// @desc    Get all users (Admin only)
// @route   GET /api/users
import {
  getAllUsers,
  getUserById,
  updateUserProfile,
} from "../dbc/user.dbc.js";

// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const result = await getAllUsers(req.query);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await updateUserProfile(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// // @desc    Upload profile picture
// // @route   POST /api/users/:id/profile-picture
// // @access  Private
// const uploadProfilePicture = async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload a file'
//       });
//     }

//     const result = await uploadProfilePicture(req.params.id, req.file);

//     res.status(200).json({
//       success: true,
//       message: result.message,
//       profilePicture: result.profilePicture
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Delete user (Admin only)
// // @route   DELETE /api/users/:id
// // @access  Private/Admin
// const deleteUser = async (req, res, next) => {
//   try {
//     const result = await deleteUser(req.params.id, req.user._id);

//     res.status(200).json({
//       success: true,
//       message: result.message
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Deactivate/Activate user account
// // @route   PATCH /api/users/:id/status
// // @access  Private/Admin
// const toggleUserStatus = async (req, res, next) => {
//   try {
//     const { isActive } = req.body;
//     const result = await toggleUserStatus(req.params.id, isActive, req.user._id);

//     res.status(200).json({
//       success: true,
//       message: result.message,
//       data: result.user
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get user statistics (Admin only)
// // @route   GET /api/users/stats
// // @access  Private/Admin
// const getUserStats = async (req, res, next) => {
//   try {
//     const stats = await getUserStatistics();

//     res.status(200).json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

export {
  getUsers,
  getUser,
  updateUser,
  // uploadProfilePicture,
  // deleteUser,
  // toggleUserStatus,
  // getUserStats
};
