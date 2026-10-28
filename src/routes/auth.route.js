// routes/auth.routes.js

import express from 'express';
import {
  register,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  completeRegistration,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  verifyEmailOtp,
  resendEmailVerificationOtp,
  googleAuth
} from '../controllers/auth.controller.js';

import { protect, authRateLimit } from '../middleware/auth.js';
import {
  validateRegistrationEmail,
  validateCompleteRegistration,
  validateVerifyEmailOtp,
  validateResendEmailVerificationOtp,
  // validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register/request-otp', authRateLimit, validateRegistrationEmail, register);
router.post('/register', authRateLimit, validateRegistrationEmail, register);
router.post('/register/verify-otp', authRateLimit, validateVerifyEmailOtp, verifyRegistrationOtp);
router.post('/register/resend-otp', authRateLimit, validateRegistrationEmail, resendRegistrationOtp);
router.post('/register/complete', authRateLimit, validateCompleteRegistration, completeRegistration);
router.post('/login', authRateLimit, login);
router.post('/verify-email-otp', authRateLimit, validateVerifyEmailOtp, verifyEmailOtp);
router.post('/resend-verification-otp', authRateLimit, validateResendEmailVerificationOtp, resendEmailVerificationOtp);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authRateLimit, validateForgotPassword, forgotPassword);
router.put('/reset-password/:resettoken', validateResetPassword, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/resend-verification', protect, resendVerification);

export default router;
