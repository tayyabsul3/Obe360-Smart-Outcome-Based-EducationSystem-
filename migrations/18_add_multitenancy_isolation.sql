-- Add multi-tenancy columns and drop/re-add unique constraints scoped by admin_id

-- 1. Add admin_id to public.profiles (to associate teachers with their university admin)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Update public.programs
-- First, drop the global unique constraint on 'code' if it exists
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_code_key;

-- Add admin_id column
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add scoped unique constraint (code must be unique per university/admin)
ALTER TABLE public.programs 
ADD CONSTRAINT programs_admin_code_unique UNIQUE (admin_id, code);


-- 3. Update public.courses
-- Drop the global unique constraint on 'code'
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_code_key;

-- Add admin_id column
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add scoped unique constraint (code must be unique per university/admin)
ALTER TABLE public.courses 
ADD CONSTRAINT courses_admin_code_unique UNIQUE (admin_id, code);


-- 4. Update public.students
-- Drop the global unique constraint on 'reg_no'
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_reg_no_key;

-- Add admin_id column
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add scoped unique constraint (reg_no must be unique per university/admin)
ALTER TABLE public.students 
ADD CONSTRAINT students_admin_reg_no_unique UNIQUE (admin_id, reg_no);
