-- Fix storage policies for spec_files bucket to allow uploads
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Give anon users access to own folder 1ffg0oo_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to own folder 1ffg0oo_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to own folder 1ffg0oo_2" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to own folder 1ffg0oo_3" ON storage.objects;

-- Create permissive policies for spec_files bucket
CREATE POLICY "Allow public uploads to spec_files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'spec_files');

CREATE POLICY "Allow public downloads from spec_files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'spec_files');

CREATE POLICY "Allow public updates to spec_files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'spec_files');

CREATE POLICY "Allow public deletes from spec_files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'spec_files');