-- Temporarily allow anyone to insert specs for admin functionality
-- This is needed because the app uses AdminContext instead of Supabase auth
DROP POLICY IF EXISTS "Admins can insert specs" ON public.specs;

CREATE POLICY "Anyone can insert specs" 
ON public.specs 
FOR INSERT 
TO public 
WITH CHECK (true);