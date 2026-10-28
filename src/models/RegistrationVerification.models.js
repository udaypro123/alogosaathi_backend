import mongoose from 'mongoose';

const registrationVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  otpHash: {
    type: String,
    required: true
  },
  otpExpiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  verifiedAt: Date,
  verificationTokenHash: String,
  verificationTokenExpiresAt: Date,
  completedAt: Date,
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  }
}, { timestamps: true });

export const RegistrationVerification = mongoose.model(
  'RegistrationVerification',
  registrationVerificationSchema
);
