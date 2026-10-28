import { emailTemplates, sendEmail } from '../utils/emailService.js';

class NotificationService {
  async sendEmailVerificationOtp(email, otp, name = 'there') {
    const notification = emailTemplates.emailVerificationOtp(name, otp);

    return sendEmail({
      email,
      subject: notification.subject,
      text: notification.text,
      html: notification.html
    });
  }
}

export const notificationService = new NotificationService();
