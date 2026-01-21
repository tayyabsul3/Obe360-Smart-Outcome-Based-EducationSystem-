-- 1. Students Table
create table public.students (
  id uuid not null default gen_random_uuid (),
  name text not null,
  reg_no text not null unique, -- Registration Number (e.g., 2023-CS-001)
  email text,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

-- 2. Enrollments Table (Course <-> Student)
create table public.enrollments (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  enrolled_at timestamp with time zone not null default now(),
  primary key (id),
  unique(course_id, student_id)
);

-- Enable RLS
alter table public.students enable row level security;
alter table public.enrollments enable row level security;

-- Policies
create policy "Allow all access to students" on public.students for all using (true);
create policy "Allow all access to enrollments" on public.enrollments for all using (true);
