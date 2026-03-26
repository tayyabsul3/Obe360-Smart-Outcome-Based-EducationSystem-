-- 7. Course Learning Outcomes (CLOs)
create table public.course_learning_outcomes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  description text not null,
  code text not null, -- e.g., 'CLO-1'
  created_at timestamptz default now()
);

-- 8. CLO-PLO Mapping (Many-to-Many)
create table public.clo_plo_mapping (
  id uuid default gen_random_uuid() primary key,
  clo_id uuid references public.course_learning_outcomes(id) on delete cascade not null,
  plo_id uuid references public.plos(id) on delete cascade not null,
  level_of_emphasis text default 'Low', -- 'Low', 'Medium', 'High'
  created_at timestamptz default now(),
  unique(clo_id, plo_id)
);

-- RLS
alter table public.course_learning_outcomes enable row level security;
alter table public.clo_plo_mapping enable row level security;

create policy "CLOs viewable by everyone" on public.course_learning_outcomes for select using (true);
create policy "Mappings viewable by everyone" on public.clo_plo_mapping for select using (true);
