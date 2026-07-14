const supabaseAdmin = require('../config/supabase');
const { sendInvitationEmail, send2FAEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Generate a random password
const generatePassword = (length = 12) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Invite a teacher by email
const inviteTeacher = async (req, res) => {
  const { email, fullName, invitedBy } = req.body;
  const adminId = req.adminId || invitedBy;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Fetch inviting Admin's profile to copy organization info
    let adminProfile = null;
    if (adminId) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('organization_name, organization_code')
        .eq('id', adminId)
        .single();
      adminProfile = profileData;
    }

    const password = generatePassword();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Teacher',
        role: 'teacher',
        admin_id: adminId,
        organization_name: adminProfile?.organization_name,
        organization_code: adminProfile?.organization_code
      }
    });

    if (error) {
      console.error('\n========== SUPABASE CREATE USER ERROR ==========');
      console.error('Error Message:', error.message);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      console.error('================================================\n');
      return res.status(400).json({ error: error.message, fullError: error });
    }

    // 2. Upsert profiles table with teacher role and organization (with retry for trigger race condition)
    let teacherProfileSet = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      const { error: upsertErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          role: 'teacher',
          full_name: fullName || 'Teacher',
          email: email,
          admin_id: adminId,
          organization_name: adminProfile?.organization_name,
          organization_code: adminProfile?.organization_code,
          is_first_login: true
        }, { onConflict: 'id' });

      if (!upsertErr) {
        teacherProfileSet = true;
        console.log(`[INVITE] Teacher profile upsert succeeded on attempt ${attempt + 1}`);
        break;
      }
      console.warn(`[INVITE] Teacher profile upsert attempt ${attempt + 1} failed:`, upsertErr.message);
    }

    if (!teacherProfileSet) {
      console.error('[INVITE] CRITICAL: Could not set teacher role in profiles table after 5 attempts!');
    }

    const user = data.user;

    // 4. Send Email with Credentials
    try {
        await sendInvitationEmail(email, password, fullName);
    } catch (err) {
        console.error('Invitation Email Failure:', err);
        return res.json({ 
            message: "User created, but invitation email failed to send. Please check SMTP settings.", 
            user: user,
            emailError: err.message
        });
    }

    res.json({ 
      message: "Invitation process initiated. User created and email is being sent.", 
      user: user 
    });

  } catch (err) {
    console.error('\n========== GENERAL SERVER ERROR (INVITE) ==========');
    console.error('Error Stack:', err.stack);
    console.error('Full Error:', err);
    console.error('===================================================\n');
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// Register a new admin user — protected by a static passphrase
const register = async (req, res) => {
  const { email, password, fullName, adminKey, organizationName, organizationCode } = req.body;

  // 1. Gate: validate the admin passphrase FIRST — before touching the DB
  const expectedKey = process.env.ADMIN_REGISTER_KEY;
  if (!adminKey || !expectedKey || adminKey.trim() !== expectedKey.trim()) {
    console.warn(`[SECURITY] Blocked unauthorized admin registration attempt for email: ${email}`);
    return res.status(403).json({ error: 'Invalid admin access key. You are not authorized to create an account.' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin',
          organization_name: organizationName,
          organization_code: organizationCode
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Explicitly set role and organization in profiles table via upsert with retry
    // (The auth trigger that creates the profile row may not have run yet)
    let profileSet = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 300 * (attempt + 1))); // 300ms, 600ms, 900ms...
      const { error: upsertErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          role: 'admin',
          full_name: fullName,
          organization_name: organizationName,
          organization_code: organizationCode,
          email: email
        }, { onConflict: 'id' });

      if (!upsertErr) {
        profileSet = true;
        console.log(`[ADMIN] Profile upsert succeeded on attempt ${attempt + 1}`);
        break;
      }
      console.warn(`[ADMIN] Profile upsert attempt ${attempt + 1} failed:`, upsertErr.message);
    }

    if (!profileSet) {
      console.error('[ADMIN] CRITICAL: Could not set admin role in profiles table after 5 attempts!');
    }

    console.log(`[ADMIN] New admin account created for ${organizationName} (${organizationCode}): ${email}`);
    res.json({ message: "Admin registration successful!", user: data.user, session: data.session });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Login a user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch user profile to get role and is_first_login
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, is_first_login, full_name, admin_id, organization_name, organization_code, is_active')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.is_active === false) {
      await supabaseAdmin.auth.signOut();
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your organization administrator.' });
    }

    // Sync profile metadata to the user object
    if (data.user && profile) {
      data.user.user_metadata = {
        ...data.user.user_metadata,
        full_name: profile.full_name,
        role: profile.role,
        admin_id: profile.admin_id,
        organization_name: profile.organization_name,
        organization_code: profile.organization_code
      };
    }

    // 2FA Generation
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const tempSessionData = {
      user: data.user,
      session: data.session,
      role: profile?.role || 'teacher',
      isFirstLogin: profile?.is_first_login
    };

    // Update profile with 2FA code and temp session data
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
        temp_session_data: tempSessionData
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Failed to update profile 2FA:', updateError);
      return res.status(500).json({ error: 'Failed to initialize security session' });
    }

    // Send 2FA Email
    try {
      await send2FAEmail(email, otpCode, profile?.full_name || 'User');
    } catch (emailErr) {
      console.error('2FA Email Failure:', emailErr);
      // Always log the OTP in Render logs so that the developer can retrieve it if SMTP fails
      console.log(`\n=========================================\n[2FA FALLBACK] OTP for ${email} is: ${otpCode}\n=========================================\n`);
      return res.status(500).json({ 
        error: `SMTP connection failed. Check your SMTP_USER/PASS or firewall on Render. Debug OTP is printed in server console logs: ${otpCode}` 
      });
    }

    // Log OTP for easy developer testing
    console.log(`\n=========================================\n[2FA SUCCESS] OTP for ${email} is: ${otpCode}\n=========================================\n`);

    res.json({
      message: "Verification code sent to your email!",
      requires2FA: true,
      email: email
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

const resendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // Find user by email
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return res.status(500).json({ error: 'Failed to query authentication database' });

    const user = listData.users?.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Fetch profile for name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, temp_session_data')
      .eq('id', user.id)
      .single();

    if (!profile?.temp_session_data) {
      return res.status(400).json({ error: 'No pending login session found. Please log in again.' });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({ otp_code: otpCode, otp_expires_at: otpExpiresAt })
      .eq('id', user.id);

    try {
      await send2FAEmail(email, otpCode, profile?.full_name || 'User');
    } catch (emailErr) {
      console.log(`\n[2FA RESEND FALLBACK] OTP for ${email} is: ${otpCode}\n`);
      return res.status(500).json({ error: `SMTP failed. Debug OTP is printed in server logs: ${otpCode}` });
    }

    console.log(`\n[2FA RESEND] OTP for ${email} is: ${otpCode}\n`);
    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

const verify2FA = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code required" });

    try {
        // 1. Find user by email
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
            console.error('Failed to list users:', listError);
            return res.status(500).json({ error: "Failed to query authentication database" });
        }

        const user = listData.users?.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // 2. Fetch OTP from profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(400).json({ error: "Security profile not found" });
        }

        if (!profile.otp_code || !profile.otp_expires_at) {
            return res.status(400).json({ error: "No active verification session" });
        }

        // 3. Validate
        if (new Date() > new Date(profile.otp_expires_at)) {
            return res.status(400).json({ error: "OTP expired" });
        }

        if (profile.otp_code !== code) {
            return res.status(400).json({ error: "Invalid code" });
        }

        // 4. Clear OTP and return session data
        await supabaseAdmin
            .from('profiles')
            .update({
                otp_code: null,
                otp_expires_at: null,
                temp_session_data: null
            })
            .eq('id', user.id);

        // Always read the CURRENT role from profiles (not the cached value in temp_session_data)
        // This handles cases where temp_session_data.role was stale/null at login time
        const freshRole = profile.role || profile.temp_session_data?.role || 'teacher';

        res.json({
            message: "Login successful!",
            ...profile.temp_session_data,
            role: freshRole  // override with the freshest role value
        });
    } catch (err) {
        console.error('Verify 2FA Error:', err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateProfile = async (req, res) => {
    const { userId, fullName } = req.body;
    if (!userId || !fullName) return res.status(400).json({ error: "User ID and full name are required" });

    try {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: { full_name: fullName } }
        );
        if (authError) throw authError;

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
};

// Update user password and set is_first_login to false
const updatePassword = async (req, res) => {
  const { userId, newPassword, oldPassword, email } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  try {
    // Check old password if provided
    if (oldPassword && email) {
        const { error: testLoginError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password: oldPassword
        });
        if (testLoginError) {
            return res.status(401).json({ error: "Incorrect current password" });
        }
    }

    // 1. Update Password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (authError) {
      throw authError;
    }

    // 2. Update Profile (is_first_login = false)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_first_login: false })
      .eq('id', userId);

    const fs = require('fs');
    const logPath = require('path').join(__dirname, '../debug.log');

    if (profileError) {
      console.error('Profile Update Error:', profileError);
      fs.appendFileSync(logPath, `[ERROR] ${new Date().toISOString()} - Profile Update Error for user ${userId}: ${JSON.stringify(profileError)}\n`);
    } else {
      fs.appendFileSync(logPath, `[SUCCESS] ${new Date().toISOString()} - Profile Update succeeded for user ${userId}\n`);
    }

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error('Update Password Error:', err);
    try {
      const fs = require('fs');
      const logPath = require('path').join(__dirname, '../debug.log');
      fs.appendFileSync(logPath, `[CATCH ERROR] ${new Date().toISOString()} - General error for user ${userId}: ${err.message || err}\n`);
    } catch(e) {}
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
};

const getTeachers = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'teacher');

    if (req.adminId) {
      query = query.eq('admin_id', req.adminId);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  const adminKey = req.body.adminKey || req.query.adminKey;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const expectedKey = process.env.ADMIN_REGISTER_KEY;
  if (!adminKey || !expectedKey || adminKey.trim() !== expectedKey.trim()) {
    return res.status(403).json({ error: 'Invalid admin registration access key. You are not authorized to delete faculty.' });
  }

  try {
    // 1. Delete from Supabase Auth (This will cascade to profiles table)
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      console.error('\n========== SUPABASE DELETE USER ERROR ==========');
      console.error('Error Message:', error.message);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      console.error('================================================\n');
      return res.status(400).json({ error: error.message, fullError: error });
    }

    res.json({ message: "Teacher deleted successfully", data });
  } catch (err) {
    console.error('\n========== GENERAL SERVER ERROR (DELETE TEACHER) ==========');
    console.error('Error Stack:', err.stack);
    console.error('===========================================================\n');
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

const toggleTeacherStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!id || isActive === undefined) {
    return res.status(400).json({ error: 'User ID and isActive status are required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `Teacher account ${isActive ? 'activated' : 'deactivated'} successfully`, data });
  } catch (err) {
    console.error('Toggle Teacher Status Error:', err);
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  inviteTeacher,
  register,
  login,
  resendOTP,
  verify2FA,
  updateProfile,
  updatePassword,
  getTeachers,
  deleteTeacher,
  toggleTeacherStatus
};
