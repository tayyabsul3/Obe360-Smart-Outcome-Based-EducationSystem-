-- Database Reset Script — DANGER: Wipes all existing data to start with a clean multi-tenant database state

-- 1. Truncate auth.users (This automatically deletes public.profiles and cascaded auth sessions)
TRUNCATE auth.users CASCADE;

-- 2. Truncate public schema tables
TRUNCATE TABLE 
    public.enrollments,
    public.student_marks,
    public.assessment_questions,
    public.assessments,
    public.course_assignments,
    public.classes,
    public.program_courses,
    public.clo_plo_mapping,
    public.course_learning_outcomes,
    public.plos,
    public.courses,
    public.programs,
    public.students
    CASCADE;
