// routes/user.routes.js

import express from 'express';
import {
  getUsers,
  // getUser,
  // updateUser,
  // changePassword,
  // uploadProfilePicture,
  // deleteUser,
  // toggleUserStatus,
  // getUserStats
} from '../controllers/user.controller.js';

import {
  protect,
  authorize,
  // resourceOwnership
} from '../middleware/auth.js';


const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Admin only routes
// router.get('/stats', authorize('admin'), getUserStats);
router.get('/', getUsers);


export default router;
