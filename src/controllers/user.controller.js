
// @desc    Get all users (Admin only)
// @route   GET /api/users
import {
  getAllUsers,
  GetAllUsersQuery,
  getUserById,
  updateUserProfile,
  userQuerry
} from "../dbc/user.dbc.js";

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


const usersQuery = async (req, res, next) => {
  try {

    logger.debug("checking data while sending from frontend userQueryy controller.js", req.body)
    const UserQuery = await userQuerry(req.body);
    logger.debug("checking data after Saved DB from frontend userQueryy controller.js", UserQuery)

    res.status(200).json({
      success: true,
      message: "Query Send Successfully",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllUsersQuery = async (req, res, next) => {
  try {

    const UserQuery = await GetAllUsersQuery()

    res.status(200).json({
      success: true,
      message: "Query fetch Successfully",
      data:UserQuery,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export {
  getUsers,
  getUser,
  updateUser,
  usersQuery,
  getAllUsersQuery
};
