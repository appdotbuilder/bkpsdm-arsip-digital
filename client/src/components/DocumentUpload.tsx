
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { User, OPD, Document, CreateDocumentInput, DocumentType } from '../../../server/src/schema';

interface DocumentUploadProps {
  user: User;
  opds: OPD[];
  onDocumentUploaded: (document: Document) => void;
}

export function DocumentUpload({ user, opds, onDocumentUploaded }: DocumentUploadProps) {
  const [formData, setFormData] = useState<Omit<CreateDocumentInput, 'file_path' | 'file_name' | 'file_size' | 'mime_type' | 'document_type' | 'uploaded_by'>>({
    title: '',
    description: null,
    opd_id: user.opd_id || (opds.length > 0 ? opds[0].id : 1),
    created_date: null,
    tags: null,
    is_public: false
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Filter OPDs based on user role
  const getAvailableOPDs = () => {
    if (user.role === 'admin') {
      return opds;
    }
    if (user.role === 'pengelola' && user.opd_id) {
      return opds.filter((opd: OPD) => opd.id === user.opd_id);
    }
    return [];
  };

  const availableOPDs = getAvailableOPDs();

  const getDocumentType = (file: File): DocumentType => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'image';
      case 'doc':
      case 'docx':
        return 'word';
      case 'xls':
      case 'xlsx':
        return 'excel';
      default:
        return 'pdf'; // Default fallback
    }
  };

  const isValidFileType = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return allowedTypes.includes(file.type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isValidFileType(file)) {
      setErrorMessage('Jenis file tidak didukung. Pilih file PDF, gambar, Word, atau Excel.');
      setUploadStatus('error');
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setErrorMessage('Ukuran file terlalu besar. Maksimal 50MB.');
      setUploadStatus('error');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    // This is a placeholder for file upload functionality
    // In a real application, you would upload to a storage service like AWS S3, Google Cloud Storage, etc.
    // For now, we'll simulate the upload and return a storage path
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storagePath = `/uploads/${fileName}`;
        resolve(storagePath);
      }, 1000); // Simulate upload delay
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Pilih file untuk diunggah.');
      setUploadStatus('error');
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage('Judul dokumen harus diisi.');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      // Upload file to storage service
      const filePath = await uploadFileToStorage(selectedFile);
      
      const documentData: CreateDocumentInput = {
        ...formData,
        file_path: filePath,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        document_type: getDocumentType(selectedFile),
        uploaded_by: user.id
      };

      const newDocument = await trpc.createDocument.mutate(documentData);
      
      onDocumentUploaded(newDocument);
      setUploadStatus('success');
      
      // Reset form
      setFormData({
        title: '',
        description: null,
        opd_id: user.opd_id || (opds.length > 0 ? opds[0].id : 1),
        created_date: null,
        tags: null,
        is_public: false
      });
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (uploadError) {
      setErrorMessage('Gagal mengunggah dokumen. Silakan coba lagi.');
      setUploadStatus('error');
      console.error('Upload failed:', uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Unggah Dokumen Baru</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadStatus === 'success' && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Dokumen berhasil diunggah! 🎉
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">File Dokumen *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.doc,.docx,.xls,.xlsx"
                disabled={isUploading}
                required
              />
              <p className="text-sm text-gray-500">
                Jenis file yang didukung: PDF, Gambar (JPG, PNG, GIF, BMP), Word (DOC, DOCX), Excel (XLS, XLSX). 
                Maksimal 50MB.
              </p>
              
              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)} • {getDocumentType(selectedFile).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul Dokumen *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Masukkan judul dokumen"
                disabled={isUploading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                placeholder="Deskripsi dokumen (opsional)"
                disabled={isUploading}
                rows={3}
              />
            </div>

            {/* OPD Selection */}
            <div className="space-y-2">
              <Label>OPD *</Label>
              <Select
                value={formData.opd_id.toString()}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, opd_id: parseInt(value) }))
                }
                disabled={isUploading || availableOPDs.length <= 1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih OPD" />
                </SelectTrigger>
                <SelectContent>
                  {availableOPDs.map((opd: OPD) => (
                    <SelectItem key={opd.id} value={opd.id.toString()}>
                      {opd.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user.role === 'pengelola' && (
                <p className="text-sm text-gray-500">
                  Anda hanya dapat mengunggah dokumen untuk OPD Anda.
                </p>
              )}
            </div>

            {/* Created Date */}
            <div className="space-y-2">
              <Label htmlFor="created_date">Tanggal Dokumen Dibuat</Label>
              <Input
                id="created_date"
                type="date"
                value={formData.created_date ? new Date(formData.created_date).toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ 
                    ...prev, 
                    created_date: e.target.value ? new Date(e.target.value) : null 
                  }))
                }
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500">
                Tanggal saat dokumen ini dibuat (berbeda dengan tanggal upload)
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tag</Label>
              <Input
                id="tags"
                value={formData.tags || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ 
                    ...prev, 
                    tags: e.target.value || null 
                  }))
                }
                placeholder="Contoh: surat, keputusan, laporan (pisahkan dengan koma)"
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500">
                Tag membantu dalam pencarian dokumen. Pisahkan dengan koma.
              </p>
            </div>

            {/* Public Access */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked: boolean) =>
                  setFormData((prev) => ({ ...prev, is_public: checked }))
                }
                disabled={isUploading}
              />
              <Label htmlFor="is_public">
                Dokumen dapat diakses oleh semua pengguna (publik)
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Unggah Dokumen
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
