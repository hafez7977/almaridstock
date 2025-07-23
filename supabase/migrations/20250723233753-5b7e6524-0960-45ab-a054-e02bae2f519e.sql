-- Remove foreign key constraint from specs.uploader_id since app uses AdminContext
-- This allows uploads without requiring a valid user reference in users table
ALTER TABLE public.specs DROP CONSTRAINT IF EXISTS specs_uploader_id_fkey;