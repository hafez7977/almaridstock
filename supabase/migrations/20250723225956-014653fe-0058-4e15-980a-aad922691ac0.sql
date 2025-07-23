-- Create storage bucket for spec files
INSERT INTO storage.buckets (id, name, public) VALUES ('spec_files', 'spec_files', false);

-- Create specs table
CREATE TABLE public.specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spec_code TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploader_name TEXT NOT NULL,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specs ENABLE ROW LEVEL SECURITY;

-- Create policies for specs table
CREATE POLICY "Anyone can view specs" 
ON public.specs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert specs" 
ON public.specs 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update specs" 
ON public.specs 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete specs" 
ON public.specs 
FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Create storage policies for spec_files bucket
CREATE POLICY "Authenticated users can view spec files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'spec_files' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload spec files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'spec_files' AND public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update spec files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'spec_files' AND public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete spec files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'spec_files' AND public.get_user_role(auth.uid()) = 'admin');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_specs_updated_at
  BEFORE UPDATE ON public.specs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();