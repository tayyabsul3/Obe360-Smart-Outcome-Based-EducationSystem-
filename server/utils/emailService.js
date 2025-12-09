const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendInvitationEmail = async (email, password, fullName) => {
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

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendInvitationEmail,
};
