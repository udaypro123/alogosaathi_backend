// routes/auth.routes.js

import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/auth.controller.js';

import { protect, authRateLimit } from '../middleware/auth.js';
import {
  validateRegister,
  // validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimit, validateRegister, register);
router.post('/login', authRateLimit, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authRateLimit, validateForgotPassword, forgotPassword);
router.put('/reset-password/:resettoken', validateResetPassword, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/resend-verification', protect, resendVerification);

export default router;
