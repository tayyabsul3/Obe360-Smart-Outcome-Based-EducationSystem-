-- RLS Hardening Update: Drops all existing selective policies and implements a clean policy 
-- that grants authenticated users full operations (SELECT, INSERT, UPDATE, DELETE) across all tables,
-- while keeping RLS enabled to secure the database against unauthenticated public access.

-- 1. Dynamically drop all existing policies on all public schema tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Ensure RLS is active on all schema tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clo_plo_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

-- 3. Implement full access policies for authenticated users
CREATE POLICY "Allow all authenticated operations" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.plos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.program_courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.course_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.course_learning_outcomes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.clo_plo_mapping FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.assessments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.assessment_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.student_marks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.invitations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.semester_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated operations" ON public.semesters FOR ALL TO authenticated USING (true) WITH CHECK (true);
