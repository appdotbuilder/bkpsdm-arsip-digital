
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2, Upload, Calendar, Eye } from 'lucide-react';
import type { User, Document, OPD } from '../../../server/src/schema';

interface DashboardProps {
  user: User;
  documents: Document[];
  opds: OPD[];
  getOPDName: (opdId: number | null) => string;
}

export function Dashboard({ user, documents, opds, getOPDName }: DashboardProps) {
  // Filter documents based on user role and OPD
  const getAccessibleDocuments = () => {
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
  };

  const accessibleDocuments = getAccessibleDocuments();
  
  // Statistics
  const totalDocuments = accessibleDocuments.length;
  const publicDocuments = accessibleDocuments.filter((doc: Document) => doc.is_public).length;
  const recentDocuments = accessibleDocuments
    .sort((a: Document, b: Document) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
    .slice(0, 5);

  const documentsByType = accessibleDocuments.reduce((acc, doc: Document) => {
    acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Selamat datang, {user.full_name}! 👋
        </h2>
        <p className="text-blue-100">
          Anda masuk sebagai {user.role === 'admin' ? 'Administrator' : user.role === 'pengelola' ? 'Pengelola' : 'Staf'} 
          {user.opd_id && ` di ${getOPDName(user.opd_id)}`}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dokumen</p>
                <p className="text-3xl font-bold text-gray-900">{totalDocuments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dokumen Publik</p>
                <p className="text-3xl font-bold text-gray-900">{publicDocuments}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total OPD</p>
                <p className="text-3xl font-bold text-gray-900">{opds.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unggahan Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">
                  {accessibleDocuments.filter((doc: Document) => {
                    const today = new Date();
                    const docDate = new Date(doc.upload_date);
                    return docDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Jenis Dokumen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(documentsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getDocumentTypeIcon(type)}</span>
                    <span className="font-medium">{getDocumentTypeLabel(type)}</span>
                  </div>
                  <Badge variant="secondary">{count} dokumen</Badge>
                </div>
              ))}
              {Object.keys(documentsByType).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Belum ada dokumen yang tersedia
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Dokumen Terbaru</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.map((doc: Document) => (
                <div key={doc.id} className="flex items-start space-x-3">
                  <div className="text-2xl">{getDocumentTypeIcon(doc.document_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500">
                        {getOPDName(doc.opd_id)}
                      </p>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.upload_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    {doc.is_public && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Publik
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {recentDocuments.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Belum ada dokumen yang tersedia
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
