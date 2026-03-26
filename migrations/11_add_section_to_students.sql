-- Migration: 11_add_section_to_students.sql
-- Adding section column to students table and ensuring data organization.

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS batch TEXT; -- Ensure batch exists (added in 08_update_schema but being explicit)

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);
CREATE INDEX IF NOT EXISTS idx_students_section ON public.students(section);
