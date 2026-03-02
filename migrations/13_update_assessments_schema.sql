-- Phase 10: Class Activities (Assessments) Schema Expansion

-- 1. Extend Assessments Table
alter table public.assessments 
add column if not exists date date,
add column if not exists gpa_weight numeric(5,2) default 0.00,
add column if not exists is_complex_engineering_problem boolean default false,
add column if not exists include_in_gpa boolean default true,
add column if not exists show_result boolean default false,
add column if not exists allow_student_upload boolean default false,
add column if not exists upload_start_date timestamptz,
add column if not exists upload_end_date timestamptz;

-- 2. Extend Assessment Questions (Sub Activities) Table
alter table public.assessment_questions 
add column if not exists obe_weight numeric(5,2) default 0.00,
add column if not exists complexity text,
add column if not exists not_for_obe boolean default false,
add column if not exists question_guideline text,
add column if not exists answer_guideline text;

-- 3. Extend Student Marks Table (Activity Outcomes)
-- We need to track 'absent' status in addition to numeric marks
alter table public.student_marks 
add column if not exists is_absent boolean default false;
