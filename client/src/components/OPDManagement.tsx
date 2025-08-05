
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import type { OPD, CreateOPDInput, UpdateOPDInput } from '../../../server/src/schema';

interface OPDManagementProps {
  opds: OPD[];
  onOPDCreated: (opd: OPD) => void;
  onOPDUpdated: (opd: OPD) => void;
  onOPDDeleted: (id: number) => void;
}

export function OPDManagement({ opds, onOPDCreated, onOPDUpdated, onOPDDeleted }: OPDManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateOPDInput>({
    name: '',
    code: '',
    description: null
  });
  
  const [editForm, setEditForm] = useState<UpdateOPDInput>({
    id: 0,
    name: '',
    code: '',
    description: null
  });

  const handleCreateOPD = async () => {
    try {
      const newOPD = await trpc.createOPD.mutate(createForm);
      onOPDCreated(newOPD);
      setIsCreateDialogOpen(false);
      
      // Reset form
      setCreateForm({
        name: '',
        code: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create OPD:', error);
    }
  };

  const handleEditOPD = (opd: OPD) => {
    setEditForm({
      id: opd.id,
      name: opd.name,
      code: opd.code,
      description: opd.description
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOPD = async () => {
    try {
      const updatedOPD = await trpc.updateOPD.mutate(editForm);
      onOPDUpdated(updatedOPD);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update OPD:', error);
    }
  };

  const handleDeleteOPD = async (opdId: number) => {
    setIsDeleting(true);
    try {
      await trpc.deleteOPD.mutate({ id: opdId });
      onOPDDeleted(opdId);
    } catch (error) {
      console.error('Failed to delete OPD:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen OPD</h2>
          <p className="text-gray-600">Kelola Organisasi Perangkat Daerah (OPD)</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah OPD
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah OPD Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama OPD</Label>
                <Input
                  value={createForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateOPDInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Contoh: Dinas Pendidikan"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Kode OPD</Label>
                <Input
                  value={createForm.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateOPDInput) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Contoh: DISPENDIK"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={createForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateForm((prev: CreateOPDInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Deskripsi OPD (opsional)"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateOPD}>
                Tambah OPD
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* OPD Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Daftar OPD ({opds.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama OPD</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opds.map((opd: OPD) => (
                <TableRow key={opd.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{opd.name}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {opd.code}
                    </code>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {opd.description || '-'}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(opd.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOPD(opd)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus OPD</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus OPD "{opd.name}"? 
                              Tindakan ini akan mempengaruhi semua pengguna dan dokumen yang terkait. 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOPD(opd.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Menghapus...' : 'Hapus'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {opds.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada OPD terdaftar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit OPD</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama OPD</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateOPDInput) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kode OPD</Label>
              <Input
                value={editForm.code || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateOPDInput) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditForm((prev: UpdateOPDInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateOPD}>
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
