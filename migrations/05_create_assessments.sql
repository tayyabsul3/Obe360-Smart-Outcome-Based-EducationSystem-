-- 1. Assessments Table
create table public.assessments (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  type text not null default 'Assignment', -- 'Quiz', 'Assignment', 'Exam'
  total_marks integer not null default 0,
  drive_link text, -- Folder link for submissions
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

-- 2. Questions Table (The OBE Core)
create table public.assessment_questions (
  id uuid not null default gen_random_uuid (),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_number text not null, -- 'Q1', '1a'
  text text, -- Optional question text
  max_marks integer not null,
  clo_id uuid references public.course_learning_outcomes (id) on delete set null,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

-- 3. Student Marks Table
create table public.student_marks (
  id uuid not null default gen_random_uuid (),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_id uuid not null references public.assessment_questions (id) on delete cascade,
  student_id uuid, -- Nullable for now if we don't have students table yet, or assume linking later
  obtained_marks float not null default 0,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.student_marks enable row level security;

-- Policies (Open for prototype, restrict later)
create policy "Allow all access to assessments" on public.assessments for all using (true);
create policy "Allow all access to assessment_questions" on public.assessment_questions for all using (true);
create policy "Allow all access to student_marks" on public.student_marks for all using (true);
