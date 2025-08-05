
import { useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Search, Download, Edit, Trash2, Eye, Calendar, FileText, Building2, Tag } from 'lucide-react';
import type { Document, OPD, User, UpdateDocumentInput } from '../../../server/src/schema';

interface DocumentListProps {
  documents: Document[];
  opds: OPD[];
  user: User;
  onDocumentDeleted: (id: number) => void;
  onDocumentUpdated: (document: Document) => void;
}

export function DocumentList({ documents, opds, user, onDocumentDeleted, onDocumentUpdated }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOPD, setFilterOPD] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [editForm, setEditForm] = useState<UpdateDocumentInput>({
    id: 0,
    title: '',
    description: null,
    tags: null,
    is_public: false
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter documents based on user role and OPD
  const getAccessibleDocuments = useCallback(() => {
    if (user.role === 'admin') {
      return documents;
    }
    
    if (user.role === 'pengelola' && user.opd_id) {
      return documents.filter((doc: Document) => doc.opd_id === user.opd_id || doc.is_public);
    }
    
    // Staf can only see public documents and documents from their OPD
    if (user.role === 'staf' && user.opd_id) {
      return documents.filter((doc: Document) => 
        doc.is_public || doc.opd_id === user.opd_id
      );
    }
    
    return documents.filter((doc: Document) => doc.is_public);
  }, [documents, user]);

  const accessibleDocuments = getAccessibleDocuments();

  // Apply filters
  const filteredDocuments = accessibleDocuments.filter((doc: Document) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (doc.tags && doc.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesOPD = filterOPD === 'all' || doc.opd_id.toString() === filterOPD;
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    
    return matchesSearch && matchesOPD && matchesType;
  });

  const getOPDName = (opdId: number) => {
    const opd = opds.find((o: OPD) => o.id === opdId);
    return opd ? opd.name : 'OPD tidak diketahui';
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'word':
        return '📝';
      case 'excel':
        return '📊';
      default:
        return '📁';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'image':
        return 'Gambar';
      case 'word':
        return 'Word';
      case 'excel':
        return 'Excel';
      default:
        return type;
    }
  };

  const canEditDocument = (doc: Document) => {
    if (user.role === 'admin') return true;
    if (user.role === 'pengelola' && user.opd_id === doc.opd_id) return true;
    return false;
  };

  const canDeleteDocument = (doc: Document) => {
    if (user.role === 'admin') return true;
    if (user.role === 'pengelola' && user.opd_id === doc.opd_id) return true;
    return false;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (doc: Document) => {
    try {
      const result = await trpc.downloadDocument.query({ id: doc.id });
      // This would normally trigger a download
      console.log('Download initiated for:', result);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditForm({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      tags: doc.tags,
      is_public: doc.is_public
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const updatedDoc = await trpc.updateDocument.mutate(editForm);
      onDocumentUpdated(updatedDoc);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (docId: number) => {
    setIsDeleting(true);
    try {
      await trpc.deleteDocument.mutate({ id: docId });
      onDocumentDeleted(docId);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Cari dan Filter Dokumen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cari Dokumen</Label>
              <Input
                placeholder="Cari berdasarkan judul, deskripsi, atau tag..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Filter OPD</Label>
              <Select value={filterOPD} onValueChange={setFilterOPD}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih OPD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua OPD</SelectItem>
                  {opds.map((opd: OPD) => (
                    <SelectItem key={opd.id} value={opd.id.toString()}>
                      {opd.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Filter Jenis</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Gambar</SelectItem>
                  <SelectItem value="word">Word</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-4">
        Menampilkan {filteredDocuments.length} dari {accessibleDocuments.length} dokumen
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc: Document) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{getDocumentTypeIcon(doc.document_type)}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {canEditDocument(doc) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(doc)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDeleteDocument(doc) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Dokumen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus dokumen "{doc.title}"? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(doc.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Menghapus...' : 'Hapus'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{doc.title}</h3>
              
              {doc.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {doc.description}
                </p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{getOPDName(doc.opd_id)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(doc.upload_date).toLocaleDateString('id-ID')}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">
                  {getDocumentTypeLabel(doc.document_type)}
                </Badge>
                {doc.is_public && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Eye className="w-3 h-3 mr-1" />
                    Publik
                  </Badge>
                )}
              </div>
              
              {doc.tags && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Tag className="w-4 h-4" />
                  <span className="truncate">{doc.tags}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada dokumen ditemukan
            </h3>
            <p className="text-gray-500">
              Coba gunakan kata kunci pencarian yang berbeda atau ubah filter Anda.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dokumen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={editForm.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateDocumentInput) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditForm((prev: UpdateDocumentInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                placeholder="Deskripsi dokumen (opsional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input
                value={editForm.tags || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateDocumentInput) => ({ 
                    ...prev, 
                    tags: e.target.value || null 
                  }))
                }
                placeholder="Tag dipisahkan dengan koma"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.is_public || false}
                onCheckedChange={(checked: boolean) =>
                  setEditForm((prev: UpdateDocumentInput) => ({ ...prev, is_public: checked }))
                }
              />
              <Label>Dokumen dapat diakses publik</Label>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditSubmit}>
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
