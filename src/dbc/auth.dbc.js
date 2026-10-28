
import {User} from "../models/User.models.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendEmail , emailTemplates} from "../utils/emailService.js";
import { nanoid } from 'nanoid'
import { notificationService } from "../services/notification.service.js";
import { ApiError } from "../utils/apiError.js";
import { RegistrationVerification } from "../models/RegistrationVerification.models.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const REGISTRATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const getOtpHashSecret = () => {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'Email verification is not configured.');
  }
  return secret;
};

const hashOtp = (otp) => crypto
  .createHmac('sha256', getOtpHashSecret())
  .update(otp)
  .digest('hex');

class AuthService {
  async requestRegistrationOtp(email) {
    getOtpHashSecret();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser?.isEmailVerified) {
      throw new ApiError(409, 'An account already exists with this email. Please sign in.');
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);
    const now = new Date();
    const verification = await RegistrationVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          otpHash,
          otpExpiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
          attempts: 0,
          expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS)
        },
        $unset: {
          verifiedAt: 1,
          verificationTokenHash: 1,
          verificationTokenExpiresAt: 1,
          completedAt: 1
        },
        $setOnInsert: { email: normalizedEmail }
      },
      { upsert: true, new: true, runValidators: true }
    );

    try {
      await notificationService.sendEmailVerificationOtp(normalizedEmail, otp);
    } catch (error) {
      await RegistrationVerification.deleteOne({
        _id: verification._id,
        otpHash
      });
      console.error('Registration OTP email delivery failed.');
      throw new ApiError(503, 'Unable to send a verification code right now. Please try again.');
    }

    return {
      email: normalizedEmail,
      message: 'A verification code has been sent to your email.'
    };
  }

  async verifyRegistrationOtp(email, otp) {
    const normalizedEmail = email.trim().toLowerCase();
    const verification = await RegistrationVerification.findOne({
      email: normalizedEmail,
      completedAt: { $exists: false }
    });

    if (!verification || !verification.otpHash) {
      throw new ApiError(400, 'Invalid or expired verification code.');
    }

    if (verification.otpExpiresAt <= new Date() || verification.attempts >= MAX_OTP_ATTEMPTS) {
      await RegistrationVerification.deleteOne({
        _id: verification._id,
        otpHash: verification.otpHash
      });
      throw new ApiError(400, 'Verification code expired. Request a new code.');
    }

    const suppliedHash = Buffer.from(hashOtp(otp), 'hex');
    const storedHash = Buffer.from(verification.otpHash, 'hex');
    const isMatch = suppliedHash.length === storedHash.length
      && crypto.timingSafeEqual(suppliedHash, storedHash);

    if (!isMatch) {
      const updated = await RegistrationVerification.findOneAndUpdate(
        {
          _id: verification._id,
          otpHash: verification.otpHash,
          attempts: { $lt: MAX_OTP_ATTEMPTS }
        },
        { $inc: { attempts: 1 } },
        { new: true }
      );

      if (!updated || updated.attempts >= MAX_OTP_ATTEMPTS) {
        await RegistrationVerification.deleteOne({
          _id: verification._id,
          otpHash: verification.otpHash
        });
        throw new ApiError(400, 'Too many incorrect codes. Request a new code.');
      }

      throw new ApiError(400, 'Invalid verification code.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const verified = await RegistrationVerification.findOneAndUpdate(
      {
        _id: verification._id,
        otpHash: verification.otpHash,
        otpExpiresAt: { $gt: now },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
        completedAt: { $exists: false }
      },
      {
        $set: {
          verifiedAt: now,
          verificationTokenHash: crypto.createHash('sha256').update(verificationToken).digest('hex'),
          verificationTokenExpiresAt: new Date(now.getTime() + REGISTRATION_TOKEN_EXPIRY_MS),
          expiresAt: new Date(now.getTime() + REGISTRATION_TOKEN_EXPIRY_MS)
        },
        $unset: { otpHash: 1, otpExpiresAt: 1 }
      },
      { new: true }
    );

    if (!verified) {
      throw new ApiError(400, 'Invalid or expired verification code.');
    }

    return {
      verificationToken,
      message: 'Email verified. Complete your account details.'
    };
  }

  async completeRegistration(userData) {
    const { email, verificationToken, firstName, lastName, password, phoneNumber } = userData;
    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const now = new Date();
    const verification = await RegistrationVerification.findOneAndUpdate(
      {
        email: normalizedEmail,
        verificationTokenHash: tokenHash,
        verifiedAt: { $exists: true },
        verificationTokenExpiresAt: { $gt: now },
        completedAt: { $exists: false }
      },
      { $set: { completedAt: now } },
      { new: true }
    );

    if (!verification) {
      throw new ApiError(400, 'Email verification expired. Verify your email again.');
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user?.isEmailVerified) {
      throw new ApiError(409, 'An account already exists with this email. Please sign in.');
    }

    if (user) {
      user.firstName = firstName;
      user.lastName = lastName;
      user.password = password;
      user.phoneNumber = phoneNumber;
      user.role = 'student';
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.emailVerificationCodeHash = undefined;
      user.emailVerificationCodeExpires = undefined;
      user.emailVerificationAttempts = undefined;
      await user.save();
    } else {
      const newUser = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        password,
        phoneNumber,
        role: 'student',
        ownerId: nanoid(),
        isEmailVerified: true
      });
      user = newUser;
    }
    const tokens = await this.generateTokens(user);

    await RegistrationVerification.deleteOne({ _id: verification._id });

    return {
      user: this.getUserResponse(user),
      tokens
    };
  }

  // Login user
  async loginUser(email, password) {
    try {
      // Use the static method to authenticate
      const result = await User.getAuthenticated(email, password);
      

      if (!result.user) {
        let message = 'Invalid credentials';
        
        switch (result.reason) {
          case User.failedLogin.NOT_FOUND:
            message = 'Invalid email or password not found ';
            break;
          case User.failedLogin.PASSWORD_INCORRECT:
            message = 'Invalid email or password';
            break;
          case User.failedLogin.MAX_ATTEMPTS:
            message = 'Account temporarily locked due to too many failed login attempts';
            break;
        }

        throw new Error(message);
      }

      // Update last login
      result.user.lastLogin = new Date();
      await result.user.save();

      // Generate tokens
      const tokens = await this.generateTokens(result.user);

      return {
        user: this.getUserResponse(result.user),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  async logoutUser(userId, refreshToken) {
    try {
      if (refreshToken) {
        // Remove refresh token from user
        await User.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: { token: refreshToken } }
        });
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.getUserResponse(user);
    } catch (error) {
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Find user and check if refresh token exists
      const user = await User.findOne({
        _id: decoded.id,
        'refreshTokens.token': refreshToken
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = user.generateAccessToken();

      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('No user found with that email');
      }

      // Get reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send email
      await this.sendPasswordResetEmail(user, resetToken);

      return { message: 'Password reset email sent' };
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(resetToken, password) {
    try {
      // Get hashed token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: resetPasswordToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      // Set new password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.loginAttempts = undefined;
      user.lockUntil = undefined;
      await user.save();

      return { message: 'Password reset successful' };
    } catch (error) {
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      // Get hashed token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmailOtp(email, otp) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
      isEmailVerified: false
    });

    if (!user || !user.emailVerificationCodeHash) {
      throw new ApiError(400, 'Invalid or expired verification code.');
    }

    if (
      !user.emailVerificationCodeExpires
      || user.emailVerificationCodeExpires <= new Date()
      || user.emailVerificationAttempts >= MAX_OTP_ATTEMPTS
    ) {
      await User.updateOne(
        {
          _id: user._id,
          emailVerificationCodeHash: user.emailVerificationCodeHash
        },
        {
          $unset: {
            emailVerificationCodeHash: 1,
            emailVerificationCodeExpires: 1
          },
          $set: { emailVerificationAttempts: 0 }
        }
      );
      throw new ApiError(400, 'Verification code expired. Request a new code.');
    }

    const suppliedHash = Buffer.from(hashOtp(otp), 'hex');
    const storedHash = Buffer.from(user.emailVerificationCodeHash, 'hex');
    const isMatch = suppliedHash.length === storedHash.length
      && crypto.timingSafeEqual(suppliedHash, storedHash);

    if (!isMatch) {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          isEmailVerified: false,
          emailVerificationCodeHash: user.emailVerificationCodeHash,
          emailVerificationAttempts: { $lt: MAX_OTP_ATTEMPTS }
        },
        { $inc: { emailVerificationAttempts: 1 } },
        { new: true }
      );

      if (!updatedUser || updatedUser.emailVerificationAttempts >= MAX_OTP_ATTEMPTS) {
        await User.updateOne(
          {
            _id: user._id,
            emailVerificationAttempts: { $gte: MAX_OTP_ATTEMPTS }
          },
          {
            $unset: {
              emailVerificationCodeHash: 1,
              emailVerificationCodeExpires: 1
            },
            $set: { emailVerificationAttempts: 0 }
          }
        );
        throw new ApiError(400, 'Too many incorrect codes. Request a new code.');
      }

      throw new ApiError(400, 'Invalid or expired verification code.');
    }

    const verifiedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        isEmailVerified: false,
        emailVerificationCodeHash: user.emailVerificationCodeHash,
        emailVerificationCodeExpires: { $gt: new Date() },
        emailVerificationAttempts: { $lt: MAX_OTP_ATTEMPTS }
      },
      {
        $set: { isEmailVerified: true },
        $unset: {
          emailVerificationCodeHash: 1,
          emailVerificationCodeExpires: 1,
          emailVerificationAttempts: 1
        }
      },
      { new: true }
    );

    if (!verifiedUser) {
      throw new ApiError(400, 'Invalid or expired verification code.');
    }

    const tokens = await this.generateTokens(verifiedUser);
    return {
      user: this.getUserResponse(verifiedUser),
      tokens
    };
  }

  async resendEmailVerificationOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
      isEmailVerified: false
    });

    if (user) {
      await this.issueEmailVerificationOtp(user);
    }

    return {
      message: 'If this account needs verification, a new code has been sent.'
    };
  }

  async issueEmailVerificationOtp(user) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationCodeHash = hashOtp(otp);
    user.emailVerificationCodeExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.emailVerificationAttempts = 0;
    await user.save();

    try {
      await notificationService.sendEmailVerificationOtp(user.email, otp, user.firstName);
    } catch {
      console.error('Verification OTP email delivery failed.');
      throw new ApiError(503, 'Unable to send a verification code right now. Please try again.');
    }
  }

  // Resend verification email
  async resendVerificationEmail(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await this.sendVerificationEmail(user, verificationToken);

      return { message: 'Verification email sent' };
    } catch (error) {
      throw error;
    }
  }

  // Helper method to generate tokens
  async generateTokens(user) {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date()
    });
    await user.save();

    return {
      accessToken,
      refreshToken
    };
  }

  // Helper method to send verification email
  async sendVerificationEmail(user, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      const emailContent = emailTemplates.welcome(user.firstName, verificationUrl);
      
      await sendEmail({
        email: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (error) {
      console.error('Verification email delivery failed');
      // Don't fail registration if email fails
    }
  }

  // Helper method to send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const emailContent = emailTemplates.passwordReset(user.firstName, resetUrl);
      
      await sendEmail({
        email: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (error) {
      console.error('Password reset email delivery failed');
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new Error('Email could not be sent');
    }
  }

  // Helper method to format user response
  getUserResponse(user) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }
}

export default new AuthService();
