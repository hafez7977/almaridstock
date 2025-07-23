import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Car } from '@/types/car';

interface PdfManagerProps {
  car: Car;
  onUpdate: () => void;
}

interface StoredPdf {
  id: string;
  name: string;
  data: string; // base64
  uploadedAt: string;
}

export const PdfManager = ({ car, onUpdate }: PdfManagerProps) => {
  const [pdfs, setPdfs] = useState<StoredPdf[]>(() => {
    const stored = localStorage.getItem(`car-pdfs-${car.id}`);
    return stored ? JSON.parse(stored) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newPdf: StoredPdf = {
        id: Date.now().toString(),
        name: file.name,
        data: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };

      const updatedPdfs = [...pdfs, newPdf];
      setPdfs(updatedPdfs);
      localStorage.setItem(`car-pdfs-${car.id}`, JSON.stringify(updatedPdfs));
      
      toast({
        title: "Success",
        description: `PDF "${file.name}" uploaded successfully`,
      });
      
      onUpdate();
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (pdf: StoredPdf) => {
    const link = document.createElement('a');
    link.href = pdf.data;
    link.download = pdf.name;
    link.click();
  };

  const handleDelete = (pdfId: string) => {
    const updatedPdfs = pdfs.filter(pdf => pdf.id !== pdfId);
    setPdfs(updatedPdfs);
    localStorage.setItem(`car-pdfs-${car.id}`, JSON.stringify(updatedPdfs));
    
    toast({
      title: "Success",
      description: "PDF deleted successfully",
    });
    
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Documents for {car.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Badge variant="outline">
            {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {pdfs.length > 0 && (
          <div className="space-y-2">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{pdf.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(pdf)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pdf.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};