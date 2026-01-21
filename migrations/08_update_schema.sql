-- 1. Update Assessments
alter table public.assessments 
add column if not exists description text;

-- 2. Update CLOs
alter table public.course_learning_outcomes 
add column if not exists type text; -- e.g. 'Cognitive', 'Affective'

alter table public.course_learning_outcomes 
add column if not exists level text; -- e.g. 'C1', 'C2', 'P1'

-- 3. Update Students
alter table public.students 
add column if not exists batch text; -- e.g. '2020 SE'
