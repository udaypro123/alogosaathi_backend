
import {User} from "../models/User.models.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendEmail , emailTemplates} from "../utils/emailService.js";
import { nanoid } from 'nanoid'

class AuthService {
  // Register new user
  async registerUser(userData) {
    try {
      let {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role,
        ownerId
      } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      if(!ownerId){
        ownerId = nanoid();
      }
      
      console.log("ownerId", ownerId)

      if(!phoneNumber || phoneNumber.trim() === ''){
        throw new Error('Phone number is required');
      }
      if(email && email.trim() === ''){
        throw new Error('Email is required');
      }
      if(ownerId && ownerId.trim() === ''){
        throw new Error('ownerId is required');
      }
      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phoneNumber: phoneNumber,
        // role: role || 'admin',
        role: role || 'users',
        ownerId
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await this.sendVerificationEmail(user, verificationToken);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        user: this.getUserResponse(user),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async loginUser(email, password) {
    try {
      // Use the static method to authenticate
      const result = await User.getAuthenticated(email, password);
      
      // console.log("result", result)

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

      // Update user
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw error;
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
      console.error('Error sending verification email:', error);
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
      console.error('Error sending password reset email:', error);
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
