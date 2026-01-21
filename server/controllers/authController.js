const supabaseAdmin = require('../config/supabase');
const { sendInvitationEmail } = require('../utils/emailService');
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
      console.error('Supabase Create User Error:', error);
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;

    // 4. Send Email with Credentials
    const emailResult = await sendInvitationEmail(email, password, fullName);

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // User is created but email failed. 
      // We might want to return a warning or specific status.
      return res.status(200).json({
        message: "User created, but failed to send email. Please inform the user manually.",
        user: user,
        credentials: { email, password }, // RETURN CREDENTIALS TO ADMIN IN RESPONSE just in case
        emailError: emailResult.error
      });
    }

    res.json({ message: "Invitation sent successfully!", user: user });

  } catch (err) {
    console.error('Server Error inviting teacher:', err);
    res.status(500).json({ error: 'Internal Server Error' });
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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_first_login')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Login Profile Fetch Error:', profileError);
      // Fallback or just continue with auth data
    }

    res.json({
      message: "Login successful!",
      user: data.user,
      session: data.session,
      role: profile?.role || 'teacher',
      isFirstLogin: profile?.is_first_login // return the flag
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
// Update user password and set is_first_login to false
const updatePassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  try {
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

module.exports = {
  inviteTeacher,
  register,
  login,
  updatePassword,
  getTeachers
};
