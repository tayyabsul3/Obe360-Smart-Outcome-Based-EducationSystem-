-- Add missing RLS policies for CLOs and CLO-PLO Mappings

-- 1. Policies for course_learning_outcomes
CREATE POLICY "Enable insert for authenticated users only" 
ON public.course_learning_outcomes FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" 
ON public.course_learning_outcomes FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" 
ON public.course_learning_outcomes FOR DELETE 
TO authenticated 
USING (true);

-- 2. Policies for clo_plo_mapping
CREATE POLICY "Enable insert for authenticated users only" 
ON public.clo_plo_mapping FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" 
ON public.clo_plo_mapping FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" 
ON public.clo_plo_mapping FOR DELETE 
TO authenticated 
USING (true);
