-- Migration 21: Add is_active column to profiles table for faculty deactivation support

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
