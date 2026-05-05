const supabaseAdmin = require('../config/supabase');
const { sendInvitationEmail, send2FAEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Generate a random password
const generatePassword = (length = 12) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Invite a teacher by email
const inviteTeacher = async (req, res) => {
  const { email, fullName } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {

    const password = generatePassword();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Teacher',
        role: 'teacher' // Metadata role (optional, depending on trigger logic)
      }
    });

    if (error) {
      console.error('\n========== SUPABASE CREATE USER ERROR ==========');
      console.error('Error Message:', error.message);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      console.error('================================================\n');
      return res.status(400).json({ error: error.message, fullError: error });
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

// Register a new user (Self-Service)
const register = async (req, res) => {
  const { email, password, fullName } = req.body;

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
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Registration successful!", user: data.user, session: data.session });
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
      .select('role, is_first_login, full_name')
      .eq('id', data.user.id)
      .single();

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutes

    // Store OTP and Session Data in the database for persistence
    const { error: otpError } = await supabaseAdmin
        .from('profiles')
        .update({
            otp_code: otpCode,
            otp_expires_at: expires,
            temp_session_data: {
                user: data.user,
                session: data.session,
                role: profile?.role || 'teacher',
                isFirstLogin: profile?.is_first_login
            }
        })
        .eq('id', data.user.id);

    if (otpError) {
        console.error("Failed to store OTP:", otpError);
        throw new Error("Security initialization failed. Please try again.");
    }

    // Send 2FA Code (Wait for delivery or fail early)
    try {
        await send2FAEmail(email, otpCode, profile?.full_name || data.user?.user_metadata?.full_name);
    } catch (err) {
        console.error('2FA Email Send Failure:', err);
        // Fallback hint for presentation/emergency use
        return res.status(500).json({ 
          error: "Failed to send verification email. (Hint: If this is a presentation, check the 'profiles' table in your DB for the code.)",
          details: err.message 
        });
    }

    res.json({
      message: "Verification code has been sent to your email.",
      requires2FA: true,
      email: email
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

const verify2FA = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code required" });

    try {
        // 1. Find user by email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        
        if (userError || !userData?.user) {
            return res.status(400).json({ error: "User not found" });
        }

        const user = userData.user;

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

        res.json({
            message: "Login successful!",
            ...profile.temp_session_data
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

    if (profileError) {
      console.error('Profile Update Error:', profileError);
      // We don't fail the written password, but we log the error
    }

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error('Update Password Error:', err);
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
};

const getTeachers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'teacher');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
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

module.exports = {
  inviteTeacher,
  register,
  login,
  verify2FA,
  updateProfile,
  updatePassword,
  getTeachers,
  deleteTeacher
};
