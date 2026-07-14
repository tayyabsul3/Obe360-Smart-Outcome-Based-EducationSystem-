-- Add organization columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS organization_code TEXT;
