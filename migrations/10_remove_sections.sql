-- Migration: 10_remove_sections.sql
-- Removing Section logic and simplifying Course Assignments to be direct Teacher-Course-Semester (Academic Session) mappings.

-- 1. Create a modern course_assignments table if it doesn't match our needs
-- We will use a NEW table to avoid conflicts with existing logic during migration if needed, 
-- but given the user request to "remove section logic", we'll modernize the existing concept.

-- First, ensure we don't break existing data if possible, but the user requested a pure system change.
-- Let's create the new structure.

CREATE TABLE IF NOT EXISTS public.semester_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE NOT NULL, -- This is the academic session (e.g. Fall 2024)
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 8), -- The 1-8 semester position
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, teacher_id, program_id, semester_id)
);

-- 2. Drop the redundant tables/views if they exist and are no longer needed
-- CAUTION: In a production environment we would migrate data first. 
-- For this development task, we are restructuring as requested.

-- DROP TABLE IF EXISTS public.sections CASCADE;
-- DROP TABLE IF EXISTS public.classes CASCADE;
-- DROP TABLE IF EXISTS public.course_assignments CASCADE;

-- 3. Enable RLS
ALTER TABLE public.semester_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semester assignments viewable by all" ON public.semester_assignments FOR SELECT USING (true);
CREATE POLICY "Admin full access to semester assignments" ON public.semester_assignments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Update programs to indicate they follow the 8-semester standard (meta info)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS total_semesters INTEGER DEFAULT 8;
