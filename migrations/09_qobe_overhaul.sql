-- Migration: Qobe UI Overhaul
-- Supporting Semesters, Sections, and Granular OBE Mapping

-- 1. Semesters Table
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., 'Fall 2020', 'Spring 2021'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sections Table (Linking Course, Semester, and Teacher)
-- This replaces the logic previously handled by 'assignments' loosely
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL, -- e.g., 'A', 'B', 'Morning', 'Evening'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, semester_id, name)
);

-- 3. Update CLOs with Active/Inactive and Type
ALTER TABLE public.course_learning_outcomes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Cognitive'; -- 'Cognitive', 'Psychomotor', 'Affective'

-- 4. Update CLO-PLO Mapping with granular fields
-- Note: Learning Type and Level should probably be on the CLO, 
-- but the user asked for them on the Plo mapping screen. 
-- However, "Batch" definitely helps filter PLOs.
ALTER TABLE public.clo_plo_mapping
ADD COLUMN IF NOT EXISTS batch_id UUID, -- References batches if we have that table
ADD COLUMN IF NOT EXISTS learning_type TEXT, -- e.g., 'Cognitive'
ADD COLUMN IF NOT EXISTS level TEXT, -- e.g., 'C1', 'C2'
ADD COLUMN IF NOT EXISTS emphasis_level TEXT DEFAULT 'Low'; -- 'Low', 'Medium', 'High'

-- 5. Seed initial Semesters
INSERT INTO public.semesters (name, is_active) 
VALUES 
('Fall 2020', true),
('Spring 2021', false),
('Fall 2021', false)
ON CONFLICT DO NOTHING;

-- Enable RLS for new tables
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semesters viewable by authenticated" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Sections viewable by authenticated" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Admin full access to semesters" ON public.semesters FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Admin full access to sections" ON public.sections FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
