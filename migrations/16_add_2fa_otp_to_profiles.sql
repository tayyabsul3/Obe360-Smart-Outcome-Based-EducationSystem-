-- Add OTP columns for 2FA to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS temp_session_data JSONB;
