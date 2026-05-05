const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Helps with some cloud hosting certificate issues
  },
  // Reduced timeouts for serverless environments
  connectionTimeout: 8000, 
  greetingTimeout: 8000,
  socketTimeout: 8000,
});

// Removed transporter.verify() for production to avoid blocking serverless startup

const sendInvitationEmail = async (email, password, fullName) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000)
  );

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"OBE360 Admin" <noreply@obe360.com>',
      to: email,
      subject: 'Welcome to OBE360 - Teacher Invitation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to OBE360!</h2>
          <p>Hello ${fullName || 'Teacher'},</p>
          <p>You have been invited to join the OBE360 platform as a Teacher.</p>
          <p>Your account has been created with the following credentials:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please login and change your password immediately.</p>
          <p>
            <a href="http://localhost:5173/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to OBE360</a>
          </p>
          <p style="font-size: 12px; color: #777; margin-top: 30px;">If you did not expect this email, please ignore it.</p>
        </div>
      `,
    };

    const info = await Promise.race([transporter.sendMail(mailOptions), timeoutPromise]);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n========== NODEMAILER / SMTP ERROR ==========');
    console.error('Error Message:', error.message);
    throw error;
  }
};

const send2FAEmail = async (email, otpCode, fullName) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Email sending timed out after 8 seconds')), 8000)
  );

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"OBE360 Security" <noreply@obe360.com>',
      to: email,
      subject: 'Your OBE360 Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Login Verification Code</h2>
          <p>Hello ${fullName || 'User'},</p>
          <p>Please use the following 6-digit code to complete your login. This code will expire in 10 minutes.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #007bff; font-size: 32px;">${otpCode}</h1>
          </div>
          <p style="font-size: 12px; color: #777; margin-top: 30px;">If you did not attempt to login, please change your password immediately.</p>
        </div>
      `,
    };

    const info = await Promise.race([transporter.sendMail(mailOptions), timeoutPromise]);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n========== 2FA SMTP ERROR ==========');
    console.error('To:', email);
    console.error('Error Message:', error.message);
    throw error; // Throw so the controller can catch it
  }
};

module.exports = {
  sendInvitationEmail,
  send2FAEmail,
};
