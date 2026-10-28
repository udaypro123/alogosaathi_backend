import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

// Create transporter
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST) {
    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP credentials are not configured.');
    }

    const port = Number(SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP port is invalid.');
    }

    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }

  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email transport is not configured.');
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email function
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.FROM_EMAIL
      || process.env.SMTP_USER
      || process.env.EMAIL_USERNAME;
    const senderName = process.env.EMAIL_SENDER_NAME
      || (!process.env.SMTP_HOST && process.env.EMAIL_FROM)
      || 'AlgoSaathi';

    const message = {
      from: `${senderName} <${senderEmail}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(message);
    // console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email delivery failed');
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name, verificationUrl) => ({
    subject: 'Welcome to Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Hostel Management System!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with our Hostel Management System. We're excited to have you on board!</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account with us, please ignore this email.
        </p>
      </div>
    `
  }),

  passwordReset: (name, resetUrl) => ({
    subject: 'Password Reset Request - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You are receiving this email because you (or someone else) has requested a password reset for your account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          For security reasons, this reset link will only work once and expires in 10 minutes.
        </p>
      </div>
    `
  }),

  emailVerification: (name, verificationUrl) => ({
    subject: 'Verify Your Email Address - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification Required</h2>
        <p>Hello ${name},</p>
        <p>Please verify your email address to complete your account setup.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          If you didn't request this verification, please ignore this email.
        </p>
      </div>
    `
  }),

  emailVerificationOtp: (name, otp) => {
    const safeName = escapeHtml(name);

    return {
      subject: 'Your AlgoSaathi verification code',
      text: `Hello ${name}, your AlgoSaathi verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #172033;">
          <h2 style="margin-bottom: 12px;">Verify your email</h2>
          <p>Hello ${safeName},</p>
          <p>Use this one-time code to finish creating your AlgoSaathi account:</p>
          <div style="margin: 28px 0; padding: 18px; border-radius: 12px; background: #f1f5f9; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 10px;">
            ${otp}
          </div>
          <p>This code expires in <strong>10 minutes</strong>. If you did not request it, you can ignore this email.</p>
        </div>
      `
    };
  },

  passwordChanged: (name) => ({
    subject: 'Password Changed Successfully - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">
            <strong>Security Tip:</strong> Always use a strong, unique password for your account.
          </p>
        </div>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  })
};