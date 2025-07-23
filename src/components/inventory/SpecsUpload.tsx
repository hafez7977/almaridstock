import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SpecsUpload = () => {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [specCode, setSpecCode] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only admin users can access the Specs Upload section.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !specCode.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a spec code and select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile for uploader name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      const uploaderName = profile?.full_name || profile?.email || 'Unknown';

      // Create unique file path
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${specCode}_${Date.now()}.${fileExtension}`;
      const filePath = `${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('spec_files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Save metadata to specs table
      const { error: dbError } = await supabase
        .from('specs')
        .insert({
          spec_code: specCode.trim(),
          file_name: selectedFile.name,
          file_path: filePath,
          uploader_name: uploaderName,
          uploader_id: user.id,
        });

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await supabase.storage
          .from('spec_files')
          .remove([filePath]);
        throw dbError;
      }

      toast({
        title: "Upload successful",
        description: `Spec file for ${specCode} has been uploaded successfully.`,
      });

      // Reset form
      setSpecCode('');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Specs Upload
          </CardTitle>
          <CardDescription>
            Upload PDF specification files and link them to spec codes. Only admin users can upload files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spec-code">Spec Code</Label>
            <Input
              id="spec-code"
              value={specCode}
              onChange={(e) => setSpecCode(e.target.value)}
              placeholder="Enter the spec code"
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">PDF File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile || !specCode.trim()}
            className="w-full"
          >
            {uploading ? "Uploading..." : "Upload Spec File"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};