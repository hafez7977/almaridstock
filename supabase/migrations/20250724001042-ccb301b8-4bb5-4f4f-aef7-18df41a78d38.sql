-- Security fixes for the application - with data cleanup

-- 1. First, create a default admin profile for orphaned records
INSERT INTO public.profiles (user_id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@admin.local', 'System Admin', 'admin'::app_role)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Remove the dangerous "Anyone can insert specs" policy
DROP POLICY IF EXISTS "Anyone can insert specs" ON public.specs;

-- 3. Create secure RLS policies for specs table that require authentication
CREATE POLICY "Authenticated admins can insert specs" 
ON public.specs 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Update existing policies to require authentication
DROP POLICY IF EXISTS "Admins can update specs" ON public.specs;
CREATE POLICY "Authenticated admins can update specs" 
ON public.specs 
FOR UPDATE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can delete specs" ON public.specs;
CREATE POLICY "Authenticated admins can delete specs" 
ON public.specs 
FOR DELETE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update the view policy to require authentication
DROP POLICY IF EXISTS "Anyone can view specs" ON public.specs;
CREATE POLICY "Authenticated users can view specs" 
ON public.specs 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Now restore foreign key constraint for specs.uploader_id
ALTER TABLE public.specs 
ADD CONSTRAINT specs_uploader_id_fkey 
FOREIGN KEY (uploader_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 5. Create audit log table for security monitoring
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 6. Create audit trigger function for specs table
CREATE OR REPLACE FUNCTION public.audit_specs_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'specs', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'specs', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'specs', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger for specs table
CREATE TRIGGER audit_specs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.specs
  FOR EACH ROW EXECUTE FUNCTION public.audit_specs_changes();

-- 7. Update storage policies to require authentication
DROP POLICY IF EXISTS "Allow public uploads to spec_files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads from spec_files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to spec_files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from spec_files" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Authenticated admins can upload to spec_files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'spec_files' AND 
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Authenticated users can download from spec_files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'spec_files');

CREATE POLICY "Authenticated admins can update spec_files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'spec_files' AND 
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Authenticated admins can delete from spec_files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'spec_files' AND 
  public.get_user_role(auth.uid()) = 'admin'
);