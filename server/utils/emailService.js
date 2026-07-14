const nodemailer = require('nodemailer');
require('dotenv').config();

console.log(`[SMTP INIT] Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, Secure: ${process.env.SMTP_SECURE}, User: ${process.env.SMTP_USER}`);

const createTransporter = (port, secure) => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(port || '587', 10),
    secure: secure === true || secure === 'true', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Helps with certificate verification on cloud hosting like Render
    },
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

// Primary transporter
let transporter = createTransporter(process.env.SMTP_PORT, process.env.SMTP_SECURE);

// Generic send helper with automatic port 587 fallback
const sendMailWithFallback = async (mailOptions) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Email sending timed out after 20 seconds')), 20000)
  );

  try {
    // Try primary SMTP connection
    console.log(`[SMTP] Attempting email delivery to ${mailOptions.to} via port ${process.env.SMTP_PORT || '587'}...`);
    const sendPromise = transporter.sendMail(mailOptions);
    return await Promise.race([sendPromise, timeoutPromise]);
  } catch (primaryError) {
    console.warn(`[SMTP WARN] Primary port ${process.env.SMTP_PORT || '587'} failed: ${primaryError.message}. Trying auto-fallback on port 587 (STARTTLS)...`);
    
    const fallbackPort = (process.env.SMTP_PORT === '587') ? '465' : '587';
    const fallbackSecure = (fallbackPort === '465');
    
    try {
      const fallbackTransporter = createTransporter(fallbackPort, fallbackSecure);
      const sendPromise = fallbackTransporter.sendMail(mailOptions);
      return await Promise.race([sendPromise, timeoutPromise]);
    } catch (fallbackError) {
      console.error(`[SMTP ERROR] Fallback port ${fallbackPort} also failed: ${fallbackError.message}`);
      throw new Error(`Email delivery failed on both primary and fallback ports. Details: ${primaryError.message} | Fallback: ${fallbackError.message}`);
    }
  }
};

const sendInvitationEmail = async (email, password, fullName) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"OBE360 Admin" <noreply@obe360.com>',
      to: email,
      subject: 'Welcome to OBE360 - Faculty Invitation',
      html: `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
            
            <!-- Header Accent -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); padding: 30px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome to OBE360</h2>
              <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Outcome-Based Education Portal</p>
            </div>

            <!-- Body Content -->
            <div style="padding: 40px 35px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #334155;">Hello <strong>${fullName || 'Teacher'}</strong>,</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #475569;">
                You have been registered as a Faculty Member on the <strong>OBE360</strong> platform. Your account has been initialized with the following credentials:
              </p>

              <!-- Credentials Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600; width: 80px;">Email</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #1e293b; font-weight: 500; font-family: monospace;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Password</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #1e293b; font-weight: 500; font-family: monospace;">${password}</td>
                  </tr>
                </table>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="http://localhost:5173/login" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 14px; font-weight: 600; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); transition: background-color 0.2s;">
                  Access OBE360 Portal
                </a>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #ef4444; background-color: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; text-align: center; font-weight: 500;">
                ⚠️ For security reasons, you will be prompted to change this temporary password immediately upon your first login.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 35px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This email was sent automatically. If you did not expect this request, please contact your department administrator.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: 600;">
                © ${new Date().getFullYear()} OBE360 System. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `,
    };

    const info = await sendMailWithFallback(mailOptions);
    console.log('[SMTP SUCCESS] Invitation email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n========== NODEMAILER / SMTP ERROR ==========');
    console.error('Error Message:', error.message);
    throw error;
  }
};

const send2FAEmail = async (email, otpCode, fullName) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"OBE360 Security" <noreply@obe360.com>',
      to: email,
      subject: `Your OBE360 Login Code: ${otpCode}`,
      html: `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
            
            <!-- Header Accent (Blue Lock Theme) -->
            <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 25px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Security Verification</h2>
              <p style="color: #e0f2fe; margin: 3px 0 0 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Two-Factor Authentication</p>
            </div>

            <!-- Body Content -->
            <div style="padding: 35px 30px; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 24px; color: #1e293b; text-align: left;">Hello <strong>${fullName || 'User'}</strong>,</p>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 22px; color: #475569; text-align: left;">
                Use the verification code below to authorize your session on <strong>OBE360</strong>. This code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #0f172a; border-radius: 14px; padding: 22px; margin: 0 auto 28px auto; max-width: 280px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
                <span style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; display: block; padding-left: 8px;">${otpCode}</span>
              </div>

              <p style="margin: 0; font-size: 11px; line-height: 16px; color: #94a3b8; text-align: left; padding: 0 10px;">
                If you did not initiate this login request, your account password may be compromised. Please change your password immediately.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This security code is system-generated. Never share this code with anyone.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: 600;">
                © ${new Date().getFullYear()} OBE360 Security. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `,
    };

    const info = await sendMailWithFallback(mailOptions);
    console.log('[SMTP SUCCESS] 2FA email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n========== 2FA SMTP ERROR ==========');
    console.error('To:', email);
    console.error('Error Message:', error.message);
    throw error;
  }
};

module.exports = {
  sendInvitationEmail,
  send2FAEmail,
};
