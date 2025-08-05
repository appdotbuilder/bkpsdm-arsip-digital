
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';
import { DocumentList } from '@/components/DocumentList';
import { DocumentUpload } from '@/components/DocumentUpload';
import { UserManagement } from '@/components/UserManagement';
import { OPDManagement } from '@/components/OPDManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, FileText, Users, Building2, Upload, Home } from 'lucide-react';
import type { User, Document, OPD } from '../../server/src/schema';

type ActiveTab = 'dashboard' | 'documents' | 'upload' | 'users' | 'opds';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [opds, setOpds] = useState<OPD[]>([]);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [documentsResult, opdsResult] = await Promise.all([
        trpc.getDocuments.query(),
        trpc.getOPDs.query()
      ]);
      
      setDocuments(documentsResult);
      setOpds(opdsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      trpc.getCurrentUser.query({ token })
        .then((currentUser) => {
          if (currentUser) {
            setUser(currentUser);
          } else {
            localStorage.removeItem('auth_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await trpc.login.mutate({ username, password });
      if (result) {
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    setActiveTab('dashboard');
  };

  const handleDocumentUploaded = (newDocument: Document) => {
    setDocuments((prev: Document[]) => [newDocument, ...prev]);
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

  const getOPDName = (opdId: number | null) => {
    if (!opdId) return 'Semua OPD';
    const opd = opds.find((o: OPD) => o.id === opdId);
    return opd ? opd.name : 'OPD tidak diketahui';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Memuat aplikasi...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistem Arsip Digital
            </h1>
            <p className="text-gray-600">
              BKPSDM - Badan Kepegawaian dan Pengembangan SDM
            </p>
          </div>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  const canAccessUserManagement = user.role === 'admin';
  const canAccessOPDManagement = user.role === 'admin';
  const canUploadDocuments = user.role === 'admin' || user.role === 'pengelola';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Sistem Arsip Digital
                  </h1>
                  <p className="text-xs text-gray-500">BKPSDM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleText(user.role)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {getOPDName(user.opd_id)}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Dokumen</span>
            </TabsTrigger>
            {canUploadDocuments && (
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Unggah</span>
              </TabsTrigger>
            )}
            {canAccessUserManagement && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Pengguna</span>
              </TabsTrigger>
            )}
            {canAccessOPDManagement && (
              <TabsTrigger value="opds" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>OPD</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard 
              user={user} 
              documents={documents} 
              opds={opds}
              getOPDName={getOPDName}
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentList 
              documents={documents} 
              opds={opds} 
              user={user}
              onDocumentDeleted={(deletedId: number) => {
                setDocuments((prev: Document[]) => prev.filter((d: Document) => d.id !== deletedId));
              }}
              onDocumentUpdated={(updatedDoc: Document) => {
                setDocuments((prev: Document[]) => 
                  prev.map((d: Document) => d.id === updatedDoc.id ? updatedDoc : d)
                );
              }}
            />
          </TabsContent>

          {canUploadDocuments && (
            <TabsContent value="upload">
              <DocumentUpload 
                user={user} 
                opds={opds} 
                onDocumentUploaded={handleDocumentUploaded}
              />
            </TabsContent>
          )}

          {canAccessUserManagement && (
            <TabsContent value="users">
              <UserManagement opds={opds} />
            </TabsContent>
          )}

          {canAccessOPDManagement && (
            <TabsContent value="opds">
              <OPDManagement 
                opds={opds}
                onOPDCreated={(newOPD: OPD) => {
                  setOpds((prev: OPD[]) => [...prev, newOPD]);
                }}
                onOPDUpdated={(updatedOPD: OPD) => {
                  setOpds((prev: OPD[]) => 
                    prev.map((o: OPD) => o.id === updatedOPD.id ? updatedOPD : o)
                  );
                }}
                onOPDDeleted={(deletedId: number) => {
                  setOpds((prev: OPD[]) => prev.filter((o: OPD) => o.id !== deletedId));
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default App;
