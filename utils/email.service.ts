import nodemailer from 'nodemailer';
import config from '../config/app.config';

/**
 * Email Service - Handles email sending functionality
 * This service manages email configuration and provides methods for sending
 * various types of emails including verification emails
 */

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize nodemailer transporter with configuration from config file
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });


  }

  /**
   * Sends email verification email with cool design
   * @param email - Recipient email address
   * @param token - Verification token
   * @param userName - User's display name
   * @returns Promise<boolean> - Success status
   */
  public async sendVerificationEmail(email: string, token: string, userName: string, location: string, browserOnOS: string, ipAddress:string): Promise<boolean> {
    try {
      const verificationUrl = `https://prepay24.in/auth/v?token=${token}`;

      
      const mailOptions = {
        from: `"Prepay24" <${config.email.user}>`,
        to: email,
        subject: "Verify Your Email - Prepay24",
        html: this.getVerificationEmailTemplate(userName, verificationUrl, email, location, browserOnOS, ipAddress),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw error;
    }
  }

  /**
   * Sends password reset email with cool design
   * @param email - Recipient email address
   * @param newPassword - New generated password
   * @param userName - User's display name
   * @returns Promise<boolean> - Success status
   */
  public async sendPasswordResetEmail(email: string, newPassword: string, userName: string, location: string, browserOnOS: string, ipAddress: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Prepay24" <${config.email.user}>`,
        to: email,
        subject: "Password Reset - Prepay24",
        html: this.getPasswordResetEmailTemplate(userName, newPassword, email, location, browserOnOS, ipAddress),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Generates cool HTML template for email verification
   * @param userName - User's display name
   * @param verificationUrl - Verification URL with token
   * @returns string - HTML email template
   */
  private getVerificationEmailTemplate(userName: string, verificationUrl: string, email: string, location: string, browserOnOS: string, ipAddress:string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Prepay24</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          
          .email-wrapper {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          .logo-section {
            text-align: center;
            padding: 40px 20px 30px 20px;
            background-color: #ffffff;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .logo {
            width: 150px;
            height: auto;
          }
          
          .content-section {
            padding: 40px 30px;
            text-align: center;
          }
          
          .greeting {
            font-size: 24px;
            color: #333333;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          
          .verification-button {
            display: inline-block;
            background-color: #1275FD;
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0;
          }
          
          .expiry-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
            font-size: 14px;
          }
          
          .security-info {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #1275FD;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: left;
            box-shadow: 0 8px 32px rgba(18, 117, 253, 0.15);
            position: relative;
            overflow: hidden;
          }
          
          .security-info::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #1275FD, #18A3FE, #1275FD);
          }
          
          .security-info h3 {
            color: #ffffff;
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .security-info h3::before {
            content: '🔒';
            font-size: 24px;
          }
          
          .security-info .info-grid {
            display: grid;
            gap: 12px;
          }
          
          .security-info .info-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .security-info .info-item:last-child {
            border-bottom: none;
          }
          
          .security-info .info-icon {
            width: 24px;
            height: 24px;
            background: rgba(18, 117, 253, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #1275FD;
            flex-shrink: 0;
          }
          
          .security-info .info-content {
            flex: 1;
          }
          
          .security-info .info-label {
            color: #a0a0a0;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          
          .security-info .info-value {
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Courier New', monospace;
          }
          
          .security-note {
            background-color: #f8f9fa;
            border-left: 4px solid #1275FD;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
            text-align: left;
          }
          
          .security-note h3 {
            color: #333333;
            font-size: 18px;
            margin-bottom: 10px;
          }
          
          .security-note p {
            color: #666666;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          
          .footer p {
            color: #666666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .social-links {
            margin-top: 20px;
          }
          
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #1275FD;
            text-decoration: none;
            font-weight: 600;
          }
          
          @media (max-width: 600px) {
            .email-wrapper {
              margin: 0;
            }
            
            .content-section {
              padding: 30px 20px;
            }
            
            .greeting {
              font-size: 20px;
            }
            
            .verification-button {
              padding: 12px 30px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="logo-section">
            <img src="https://prepay24.in/prepay-logo-main.png" alt="Prepay24 Logo" class="logo">
          </div>
          
          <div class="content-section">
            <div class="greeting">Hello ${userName}! 👋</div>
            
            <div class="message">
              Thank you for joining Prepay24! To complete your registration and start using our secure financial services, 
              please verify your email address by clicking the button below.
            </div>
            
            <a href="${verificationUrl}" class="verification-button">
              Verify Email Address
            </a>
            
            <div class="expiry-notice">
              ⏰ This verification link will expire in 10 minutes for your security.
            </div>
            
            <div class="security-note">
              <h3>🔒 Security Information</h3>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>IP Address:</strong> ${ipAddress}</p>
              <p><strong>Device:</strong> ${browserOnOS}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="message">
              If the button above doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #1275FD; word-break: break-all;">${verificationUrl}</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Prepay24. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates cool HTML template for password reset
   * @param userName - User's display name
   * @param newPassword - New generated password
   * @returns string - HTML email template
   */
  private getPasswordResetEmailTemplate(userName: string, newPassword: string, email: string, location: string, browserOnOS: string, ipAddress: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Prepay24</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          
          .email-wrapper {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          .logo-section {
            text-align: center;
            padding: 40px 20px 30px 20px;
            background-color: #ffffff;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .logo {
            width: 150px;
            height: auto;
          }
          
          .content-section {
            padding: 40px 30px;
            text-align: center;
          }
          
          .greeting {
            font-size: 24px;
            color: #333333;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          
          .password-box {
            background-color: #1275FD;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
          }
          
          .security-note {
            background-color: #f8f9fa;
            border-left: 4px solid #1275FD;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
            text-align: left;
          }
          
          .security-note h3 {
            color: #333333;
            font-size: 18px;
            margin-bottom: 10px;
          }
          
          .security-note p {
            color: #666666;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            color: #856404;
            font-size: 14px;
            text-align: left;
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          
          .footer p {
            color: #666666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .social-links {
            margin-top: 20px;
          }
          
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #1275FD;
            text-decoration: none;
            font-weight: 600;
          }
          
          @media (max-width: 600px) {
            .email-wrapper {
              margin: 0;
            }
            
            .content-section {
              padding: 30px 20px;
            }
            
            .greeting {
              font-size: 20px;
            }
            
            .password-box {
              font-size: 16px;
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="logo-section">
            <img src="https://prepay24.in/prepay-logo-main.png" alt="Prepay24 Logo" class="logo">
          </div>
          
          <div class="content-section">
            <div class="greeting">Hello ${userName}! 🔐</div>
            
            <div class="message">
              We received a request to reset your password. Your new password has been generated and is ready to use.
            </div>
            
            <div class="password-box">
              ${newPassword}
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Important:</strong> Please change this password immediately after logging in for security purposes.
            </div>

            
            <div class="security-note">
              <h3>🔒 Security Information</h3>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>IP Address:</strong> ${ipAddress}</p>
              <p><strong>Device:</strong> ${browserOnOS}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="message">
              You can now log in to your Prepay24 account using this new password. 
              We recommend changing it to something more memorable once you're logged in.
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 Prepay24. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Verifies email configuration by testing the connection
   * @returns Promise<boolean> - Connection status
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService; 