-- Migration: 12_add_student_details.sql
-- Adding further details to students based on teacher portal requirements.

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS current_city TEXT;
