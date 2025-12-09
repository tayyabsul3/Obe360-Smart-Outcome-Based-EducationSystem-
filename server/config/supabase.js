const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Admin Client (for server-side operations only)
// Requires SERVICE_ROLE_KEY - keep this secret!
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Service Role Key is missing in .env');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabaseAdmin;
