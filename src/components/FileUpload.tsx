import { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}
const FileUpload = ({
  onFileUpload,
  isProcessing
}: FileUploadProps) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].name.toLowerCase().endsWith('.csv')) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      onFileUpload(file);
    }
  }, [onFileUpload]);
  return <div className="financial-card p-8 text-center hover:border-primary/40 transition-all duration-300">
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 hover:border-primary/50 transition-colors" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text">Upload Your BML Bank Statement</h3>
            <p className="text-muted-foreground">
              Drag and drop your CSV file here, or click to select
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>CSV files only</span>
          </div>
          
          <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="file-upload" disabled={isProcessing} />
          
          <Button asChild variant="default" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessing}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {isProcessing ? 'Processing...' : 'Select CSV File'}
            </label>
          </Button>
        </div>
      </div>
    </div>;
};
export default FileUpload;