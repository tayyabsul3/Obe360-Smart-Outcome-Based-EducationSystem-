-- Phase 2: Academic Structure Schema

-- 1. Programs Table
create table public.programs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  code text not null unique, -- e.g., 'BSSE', 'BSCS'
  duration_years integer default 4,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Program Learning Outcomes (PLOs)
create table public.plos (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  title text not null, -- e.g., 'PLO-1'
  description text,
  created_at timestamptz default now()
);

-- 3. Courses Catalog (Global list of courses)
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  code text not null unique, -- e.g., 'CSC-101'
  title text not null,
  credit_hours integer default 3,
  lab_hours integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Study Plan / Curriculum (Linking Courses to Programs & Semesters)
create table public.program_courses (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  semester integer not null check (semester >= 1 and semester <= 8),
  course_type text default 'Core', -- 'Core', 'Elective', 'Gen Ed'
  is_lab_embedded boolean default false,
  created_at timestamptz default now(),
  unique(program_id, course_id, semester) -- Prevent duplicate assignments
);

-- 5. Classes (Sections e.g., BSSE-1A)
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  name text not null, -- e.g., 'BSSE-1A'
  semester integer not null,
  section text not null, -- 'A', 'B', 'C'
  academic_session text not null, -- 'Fall 2024'
  created_at timestamptz default now()
);

-- 6. Course Assignments (Teacher -> Class -> Course)
create table public.course_assignments (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  teacher_id uuid references public.profiles(id) on delete set null, -- Nullable if not assigned yet
  status text default 'Active', -- 'Active', 'Completed'
  created_at timestamptz default now(),
  unique(class_id, course_id) -- Only one assignment per course per class (simplification)
);

-- RLS Policies (Security)
-- Enable RLS
alter table public.programs enable row level security;
alter table public.plos enable row level security;
alter table public.courses enable row level security;
alter table public.program_courses enable row level security;
alter table public.classes enable row level security;
alter table public.course_assignments enable row level security;

-- Read Policies (Public/Authenticated can read)
create policy "Programs are viewable by everyone" on public.programs for select using (true);
create policy "PLOs are viewable by everyone" on public.plos for select using (true);
create policy "Courses are viewable by everyone" on public.courses for select using (true);
create policy "Study Plans are viewable by everyone" on public.program_courses for select using (true);
create policy "Classes are viewable by everyone" on public.classes for select using (true);
create policy "Assignments are viewable by everyone" on public.course_assignments for select using (true);

-- Write Policies (Admins only - assuming we check role in app logic or via custom claim if implemented)
-- For now, simpler policy: Only allow updates if user is authenticated (Backend service key bypasses this anyway)
-- Ideally, you'd check (auth.jwt() ->> 'role') = 'service_role' or check profiles table. 
-- Since we use Node backend with Service Key for writes, RLS mainly affects CLIENT side.
-- We will allow 'authenticated' users (teachers/admins) to read everything. Writes will be handled by Backend.

