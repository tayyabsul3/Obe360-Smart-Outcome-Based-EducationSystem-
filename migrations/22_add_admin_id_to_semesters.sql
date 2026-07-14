-- Migration 22: Add admin_id to semesters table for multitenancy isolation
ALTER TABLE public.semesters 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add unique constraint scoped by admin_id (semester name must be unique per university/admin)
ALTER TABLE public.semesters DROP CONSTRAINT IF EXISTS semesters_admin_name_unique;
ALTER TABLE public.semesters 
ADD CONSTRAINT semesters_admin_name_unique UNIQUE (admin_id, name);
