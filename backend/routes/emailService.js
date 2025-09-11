import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Use 'true' for port 465, 'false' for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Function to send a verification email with a professional template
const sendVerificationEmail = async (user) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verifyemail/${user.verificationToken}`;

  // The new HTML template for the verification email
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
          background-color: #004d99; /* A professional blue color */
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 32px 24px;
          text-align: center;
        }
        .content h2 {
          color: #333333;
          font-size: 24px;
          margin-top: 0;
        }
        .content p {
          color: #666666;
          font-size: 16px;
          line-height: 1.6;
        }
        .button-container {
          margin: 30px 0;
          color: #ffffff;
        }
        .button {
          display: inline-block;
          background-color: #007bff; /* A prominent button color */
          color: #ffffff;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          background-color: #f0f0f0;
          padding: 24px;
          text-align: center;
          color: #999999;
          font-size: 12px;
        }
        .footer p {
          margin: 0;
        }
        .company-logo {
          font-size: 2em;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="company-logo">HDS</div>
          <h1>Welcome to HDS</h1>
        </div>
        <div class="content">
          <h2>Account Verification</h2>
          <p>Dear ${user.name},</p>
          <p>Thank you for joining HDS, your comprehensive e-learning management system. We are excited to have you as part of our community, where you can explore a world of knowledge and skill-building courses.</p>
          <p>To finalize your registration and begin your learning journey, please verify your email address by clicking the button below:</p>
          <div class="button-container">
            <a href="${verificationUrl}" class="button">Verify My Account</a>
          </div>
          <p>This link will be valid for 24 hours.</p>
          <p>If you did not create an account with HDS, please ignore this email.</p>
          <p>Best regards,<br>The HDS Team</p>
        </div>
        <div class="footer">
          <p>HDS - E-learning Management System</p>
          <p>123 Learning Lane, Knowledge City, 54321</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: 'Action Required: Verify Your HDS Account',
    html: htmlTemplate,
  };
  await transporter.sendMail(mailOptions);
};

// Function to send a password reset email with a professional template
const sendPasswordResetEmail = async (user, resetUrl) => {
  // The new HTML template for the password reset email
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
          background-color: #004d99;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 32px 24px;
          text-align: center;
        }
        .content h2 {
          color: #333333;
          font-size: 24px;
          margin-top: 0;
        }
        .content p {
          color: #666666;
          font-size: 16px;
          line-height: 1.6;
        }
        .button-container {
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background-color: #dc3545; /* A security-focused red color */
          color: #ffffff;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          background-color: #f0f0f0;
          padding: 24px;
          text-align: center;
          color: #999999;
          font-size: 12px;
        }
        .footer p {
          margin: 0;
        }
        .company-logo {
          font-size: 2em;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="company-logo">HDS</div>
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Dear ${user.name},</p>
          <p>We received a request to reset the password for your HDS account. If you made this request, please click the button below to set a new password:</p>
          <div class="button-container">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          <p>For your security, this link is valid for **15 minutes** and can only be used once.</p>
          <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>Best regards,<br>The HDS Team</p>
        </div>
        <div class="footer">
          <p>HDS - E-learning Management System</p>
          <p>123 Learning Lane, Knowledge City, 54321</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: 'HDS Password Reset Request',
    html: htmlTemplate,
  };
  await transporter.sendMail(mailOptions);
};

export { sendVerificationEmail, sendPasswordResetEmail };
