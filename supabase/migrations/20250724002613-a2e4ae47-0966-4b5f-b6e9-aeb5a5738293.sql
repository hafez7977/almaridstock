-- Fix RLS policies to work with current admin system
-- Drop the existing admin-only delete policy
DROP POLICY IF EXISTS "Admins can delete specs" ON public.specs;

-- Create a temporary policy that allows deletions for now
-- This will be replaced when we implement proper Supabase auth
CREATE POLICY "Allow spec deletions" 
ON public.specs 
FOR DELETE 
USING (true);

-- Also fix the update policy  
DROP POLICY IF EXISTS "Admins can update specs" ON public.specs;

CREATE POLICY "Allow spec updates" 
ON public.specs 
FOR UPDATE 
USING (true);