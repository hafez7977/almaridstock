import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, Download, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface FileUpload {
  id: string;
  file: File;
  specCode: string;
}

interface SpecFile {
  id: string;
  spec_code: string;
  file_name: string;
  file_path: string;
  uploader_name: string;
  upload_date: string;
}

export const SpecsUpload = () => {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [specs, setSpecs] = useState<SpecFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all uploaded specs
  const fetchSpecs = async () => {
    try {
      const { data, error } = await supabase
        .from('specs')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setSpecs(data || []);
    } catch (error) {
      console.error('Error fetching specs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded files.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newUploads: FileUpload[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf') {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a PDF file and will be skipped.`,
            variant: "destructive",
          });
          continue;
        }
        
        // Extract spec code from filename (remove .pdf extension)
        const specCode = file.name.replace(/\.pdf$/i, '');
        
        newUploads.push({
          id: Math.random().toString(36).substring(7),
          file,
          specCode
        });
      }
      
      setFileUploads(prev => [...prev, ...newUploads]);
    }
  };

  const updateSpecCode = (id: string, specCode: string) => {
    setFileUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, specCode } : upload
      )
    );
  };

  const removeFileUpload = (id: string) => {
    setFileUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const handleBatchUpload = async () => {
    if (fileUploads.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    // Validate all files have spec codes (they should auto-extract from filename)
    const invalidFiles = fileUploads.filter(upload => !upload.specCode || upload.specCode.trim() === '');
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid filenames",
        description: `Some files don't have valid spec codes. Ensure filenames end with .pdf (e.g., "10535.pdf").`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate file names that already exist in the database
    const duplicateFiles = fileUploads.filter(upload => 
      specs.some(existingSpec => existingSpec.file_name === upload.file.name)
    );
    
    if (duplicateFiles.length > 0) {
      toast({
        title: "Duplicate files detected",
        description: `The following files already exist: ${duplicateFiles.map(f => f.file.name).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // For now, use a simple admin identifier since we're using AdminContext
      const uploaderName = 'Admin User';

      let successCount = 0;
      let errorCount = 0;

      for (const upload of fileUploads) {
        try {
          // Create unique file path
          const fileExtension = upload.file.name.split('.').pop();
          const fileName = `${upload.specCode}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
          const filePath = `${fileName}`;

          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('spec_files')
            .upload(filePath, upload.file);

          if (uploadError) {
            throw uploadError;
          }

           // Save metadata to specs table
           const { error: dbError } = await supabase
             .from('specs')
             .insert({
               spec_code: upload.specCode.trim(),
               file_name: upload.file.name,
               file_path: filePath,
               uploader_name: uploaderName,
               uploader_id: '00000000-0000-0000-0000-000000000000', // Admin placeholder
             });

          if (dbError) {
            // If database insert fails, clean up the uploaded file
            await supabase.storage
              .from('spec_files')
              .remove([filePath]);
            throw dbError;
          }

          successCount++;
        } catch (error) {
          console.error(`Upload error for ${upload.file.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload completed",
          description: `Successfully uploaded ${successCount} files${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
        });
        
        // Reset form and refresh data
        setFileUploads([]);
        fetchSpecs();
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Upload failed",
          description: "All uploads failed. Please try again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (spec: SpecFile) => {
    try {
      const { data: fileData, error } = await supabase.storage
        .from('spec_files')
        .download(spec.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = url;
      link.download = spec.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${spec.file_name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the file.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (spec: SpecFile) => {
    if (!isAdmin) return;
    
    try {
      console.log('Deleting spec:', spec.id, spec.file_path);
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('specs')
        .delete()
        .eq('id', spec.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      // Then delete from storage
      const { error: storageError } = await supabase.storage
        .from('spec_files')
        .remove([spec.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Don't throw storage error as the database record is already deleted
      }

      // Refetch data to ensure consistency
      await fetchSpecs();

      toast({
        title: "File deleted",
        description: `${spec.file_name} has been deleted successfully.`,
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Upload Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Specs (Admin Only)
            </CardTitle>
            <CardDescription>
              Upload multiple PDF files. File names should be the spec codes with .pdf extension (e.g., "10535.pdf").
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select PDF Files</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                You can select multiple PDF files at once
              </p>
            </div>

            {fileUploads.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Files to Upload</h4>
                {fileUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{upload.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                     <div className="flex-1">
                       <div className="text-sm">
                         <span className="text-muted-foreground">Spec Code: </span>
                         <span className="font-medium">{upload.specCode}</span>
                       </div>
                     </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFileUpload(upload.id)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  onClick={handleBatchUpload} 
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : `Upload ${fileUploads.length} Files`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Files List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Specs
            <Badge variant="outline">{specs.length} files</Badge>
          </CardTitle>
          <CardDescription>
            All uploaded specification files. Click on file names to download.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                <span>Loading uploaded files...</span>
              </div>
            </div>
          ) : specs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spec Code</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specs.map((spec) => (
                  <TableRow key={spec.id}>
                    <TableCell className="font-medium">{spec.spec_code}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDownload(spec)}
                        className="text-primary hover:text-primary/80 hover:underline"
                      >
                        {spec.file_name}
                      </button>
                    </TableCell>
                    <TableCell>
                      {new Date(spec.upload_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{spec.uploader_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(spec)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(spec)}
                            title="Delete file (Admin only)"
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No specification files uploaded yet</p>
              {isAdmin && (
                <p className="text-sm mt-2">Upload some files using the form above</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};