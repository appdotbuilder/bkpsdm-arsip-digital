
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Edit, Trash2, Shield, ShieldCheck, Eye } from 'lucide-react';
import type { User, OPD, CreateUserInput, UpdateUserInput } from '../../../server/src/schema';

interface UserManagementProps {
  opds: OPD[];
}

export function UserManagement({ opds }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get safe default OPD ID
  const getDefaultOPDId = () => opds.length > 0 ? opds[0].id : null;
  
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'staf',
    opd_id: getDefaultOPDId()
  });
  
  const [editForm, setEditForm] = useState<UpdateUserInput>({
    id: 0,
    username: '',
    email: '',
    full_name: '',
    role: 'staf',
    opd_id: getDefaultOPDId(),
    is_active: true
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Update form defaults when OPDs change
  useEffect(() => {
    const defaultOPDId = getDefaultOPDId();
    setCreateForm((prev: CreateUserInput) => ({ ...prev, opd_id: defaultOPDId }));
    setEditForm((prev: UpdateUserInput) => ({ ...prev, opd_id: defaultOPDId }));
  }, [opds]);

  const getOPDName = (opdId: number | null) => {
    if (!opdId) return 'Semua OPD';
    const opd = opds.find((o: OPD) => o.id === opdId);
    return opd ? opd.name : 'OPD tidak diketahui';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-red-600" />;
      case 'pengelola':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'staf':
        return <Eye className="w-4 h-4 text-green-600" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'pengelola':
        return 'bg-blue-100 text-blue-800';
      case 'staf':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'pengelola':
        return 'Pengelola';
      case 'staf':
        return 'Staf';
      default:
        return role;
    }
  };

  const handleCreateUser = async () => {
    try {
      const newUser = await trpc.createUser.mutate(createForm);
      setUsers((prev: User[]) => [...prev, newUser]);
      setIsCreateDialogOpen(false);
      
      // Reset form
      setCreateForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'staf',
        opd_id: getDefaultOPDId()
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditForm({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      opd_id: user.opd_id,
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      const updatedUser = await trpc.updateUser.mutate(editForm);
      setUsers((prev: User[]) => 
        prev.map((u: User) => u.id === updatedUser.id ? updatedUser : u)
      );
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setIsDeleting(true);
    try {
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span>Memuat data pengguna...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-gray-600">Kelola akun pengguna sistem arsip digital</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={createForm.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="Username unik"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={createForm.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Nama lengkap pengguna"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Password (minimal 6 karakter)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peran</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value: 'admin' | 'pengelola' | 'staf') =>
                      setCreateForm((prev: CreateUserInput) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="pengelola">Pengelola</SelectItem>
                      <SelectItem value="staf">Staf</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>OPD</Label>
                  <Select
                    value={createForm.opd_id?.toString() || 'null'}
                    onValueChange={(value: string) =>
                      setCreateForm((prev: CreateUserInput) => ({ 
                        ...prev, 
                        opd_id: value === 'null' ? null : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih OPD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Semua OPD (Admin)</SelectItem>
                      {opds.length > 0 ? (
                        opds.map((opd: OPD) => (
                          <SelectItem key={opd.id} value={opd.id.toString()}>
                            {opd.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-opd" disabled>
                          Tidak ada OPD tersedia
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateUser}>
                Tambah Pengguna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Daftar Pengguna ({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>OPD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleText(user.role)}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm">{getOPDName(user.opd_id)}</span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
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
                            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus pengguna "{user.full_name}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
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
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada pengguna terdaftar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={editForm.username || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editForm.full_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateUserInput) => ({ ...prev, full_name: e.target.value }))
                }
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peran</Label>
                <Select
                  value={editForm.role || 'staf'}
                  onValueChange={(value: 'admin' | 'pengelola' | 'staf') =>
                    setEditForm((prev: UpdateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="pengelola">Pengelola</SelectItem>
                    <SelectItem value="staf">Staf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>OPD</Label>
                <Select
                  value={editForm.opd_id?.toString() || 'null'}
                  onValueChange={(value: string) =>
                    setEditForm((prev: UpdateUserInput) => ({ 
                      ...prev, 
                      opd_id: value === 'null' ? null : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Semua OPD (Admin)</SelectItem>
                    {opds.length > 0 ? (
                      opds.map((opd: OPD) => (
                        <SelectItem key={opd.id} value={opd.id.toString()}>
                          {opd.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-opd" disabled>
                        Tidak ada OPD tersedia
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.is_active || false}
                onCheckedChange={(checked: boolean) =>
                  setEditForm((prev: UpdateUserInput) => ({ ...prev, is_active: checked }))
                }
              />
              <Label>Akun aktif</Label>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateUser}>
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
