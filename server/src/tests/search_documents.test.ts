
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable, usersTable, documentsTable } from '../db/schema';
import { type SearchDocumentsInput } from '../schema';
import { searchDocuments } from '../handlers/search_documents';

// Test data setup
const testOPD1 = {
  name: 'Dinas Kesehatan',
  code: 'DINKES',
  description: 'Dinas Kesehatan Kota'
};

const testOPD2 = {
  name: 'Dinas Pendidikan',
  code: 'DINDIK',
  description: 'Dinas Pendidikan Kota'
};

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  full_name: 'Test User',
  role: 'staf' as const,
  opd_id: 1
};

describe('searchDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty results when no documents exist', async () => {
    const input: SearchDocumentsInput = {
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should return all documents with default pagination', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    // Create test documents
    await db.insert(documentsTable).values([
      {
        title: 'Document 1',
        description: 'First test document',
        file_path: '/uploads/doc1.pdf',
        file_name: 'doc1.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'health,report',
        is_public: true
      },
      {
        title: 'Document 2',
        description: 'Second test document',
        file_path: '/uploads/doc2.pdf',
        file_name: 'doc2.pdf',
        file_size: 2048,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'education,policy',
        is_public: false
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.documents[0].title).toBeDefined();
    expect(result.documents[0].opd_id).toBe(opd.id);
  });

  it('should search documents by title', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    await db.insert(documentsTable).values([
      {
        title: 'Health Report 2024',
        description: 'Annual health report',
        file_path: '/uploads/health.pdf',
        file_name: 'health.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'health,annual',
        is_public: true
      },
      {
        title: 'Education Budget',
        description: 'Budget allocation document',
        file_path: '/uploads/budget.pdf',
        file_name: 'budget.pdf',
        file_size: 2048,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'budget,education',
        is_public: true
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      q: 'health',
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].title).toBe('Health Report 2024');
  });

  it('should search documents by description', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    await db.insert(documentsTable).values({
      title: 'Annual Report',
      description: 'Comprehensive health statistics and analysis',
      file_path: '/uploads/report.pdf',
      file_name: 'report.pdf',
      file_size: 1024,
      document_type: 'pdf',
      mime_type: 'application/pdf',
      opd_id: opd.id,
      uploaded_by: user.id,
      tags: 'statistics',
      is_public: true
    }).execute();

    const input: SearchDocumentsInput = {
      q: 'statistics',
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].description).toContain('statistics');
  });

  it('should filter documents by OPD', async () => {
    // Create multiple OPDs
    const [opd1] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [opd2] = await db.insert(opdsTable).values(testOPD2).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd1.id }).returning().execute();

    await db.insert(documentsTable).values([
      {
        title: 'Health Document',
        description: 'From health department',
        file_path: '/uploads/health.pdf',
        file_name: 'health.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd1.id,
        uploaded_by: user.id,
        tags: 'health',
        is_public: true
      },
      {
        title: 'Education Document',
        description: 'From education department',
        file_path: '/uploads/education.pdf',
        file_name: 'education.pdf',
        file_size: 2048,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd2.id,
        uploaded_by: user.id,
        tags: 'education',
        is_public: true
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      opd_id: opd1.id,
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].opd_id).toBe(opd1.id);
    expect(result.documents[0].title).toBe('Health Document');
  });

  it('should filter documents by document type', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    await db.insert(documentsTable).values([
      {
        title: 'PDF Document',
        description: 'A PDF file',
        file_path: '/uploads/doc.pdf',
        file_name: 'doc.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'document',
        is_public: true
      },
      {
        title: 'Image Document',
        description: 'An image file',
        file_path: '/uploads/image.jpg',
        file_name: 'image.jpg',
        file_size: 2048,
        document_type: 'image',
        mime_type: 'image/jpeg',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'image',
        is_public: true
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      document_type: 'pdf',
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].document_type).toBe('pdf');
    expect(result.documents[0].title).toBe('PDF Document');
  });

  it('should filter documents by date range', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    const pastDate = new Date('2023-01-01');
    const recentDate = new Date('2024-01-01');

    await db.insert(documentsTable).values([
      {
        title: 'Old Document',
        description: 'Old document',
        file_path: '/uploads/old.pdf',
        file_name: 'old.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        upload_date: pastDate,
        tags: 'old',
        is_public: true
      },
      {
        title: 'Recent Document',
        description: 'Recent document',
        file_path: '/uploads/recent.pdf',
        file_name: 'recent.pdf',
        file_size: 2048,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        upload_date: recentDate,
        tags: 'recent',
        is_public: true
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      date_from: new Date('2023-12-01'),
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].title).toBe('Recent Document');
  });

  it('should filter documents by tags', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    await db.insert(documentsTable).values([
      {
        title: 'Policy Document',
        description: 'Policy document',
        file_path: '/uploads/policy.pdf',
        file_name: 'policy.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'policy,important,2024',
        is_public: true
      },
      {
        title: 'Report Document',
        description: 'Report document',
        file_path: '/uploads/report.pdf',
        file_name: 'report.pdf',
        file_size: 2048,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd.id,
        uploaded_by: user.id,
        tags: 'report,annual',
        is_public: true
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      tags: 'policy',
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].title).toBe('Policy Document');
    expect(result.documents[0].tags).toContain('policy');
  });

  it('should handle pagination correctly', async () => {
    // Create test data
    const [opd] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd.id }).returning().execute();

    // Create 5 documents
    const documents = Array.from({ length: 5 }, (_, i) => ({
      title: `Document ${i + 1}`,
      description: `Test document ${i + 1}`,
      file_path: `/uploads/doc${i + 1}.pdf`,
      file_name: `doc${i + 1}.pdf`,
      file_size: 1024 * (i + 1),
      document_type: 'pdf' as const,
      mime_type: 'application/pdf',
      opd_id: opd.id,
      uploaded_by: user.id,
      tags: `tag${i + 1}`,
      is_public: true
    }));

    await db.insert(documentsTable).values(documents).execute();

    // Test first page with limit 2
    const input1: SearchDocumentsInput = {
      page: 1,
      limit: 2
    };

    const result1 = await searchDocuments(input1);

    expect(result1.documents).toHaveLength(2);
    expect(result1.total).toBe(5);

    // Test second page
    const input2: SearchDocumentsInput = {
      page: 2,
      limit: 2
    };

    const result2 = await searchDocuments(input2);

    expect(result2.documents).toHaveLength(2);
    expect(result2.total).toBe(5);

    // Test third page (should have 1 document)
    const input3: SearchDocumentsInput = {
      page: 3,
      limit: 2
    };

    const result3 = await searchDocuments(input3);

    expect(result3.documents).toHaveLength(1);
    expect(result3.total).toBe(5);
  });

  it('should combine multiple filters correctly', async () => {
    // Create test data
    const [opd1] = await db.insert(opdsTable).values(testOPD1).returning().execute();
    const [opd2] = await db.insert(opdsTable).values(testOPD2).returning().execute();
    const [user] = await db.insert(usersTable).values({ ...testUser, opd_id: opd1.id }).returning().execute();

    await db.insert(documentsTable).values([
      {
        title: 'Health Policy PDF',
        description: 'Health department policy',
        file_path: '/uploads/health_policy.pdf',
        file_name: 'health_policy.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd1.id,
        uploaded_by: user.id,
        tags: 'health,policy',
        is_public: true
      },
      {
        title: 'Health Report Image',
        description: 'Health department image',
        file_path: '/uploads/health_image.jpg',
        file_name: 'health_image.jpg',
        file_size: 2048,
        document_type: 'image',
        mime_type: 'image/jpeg',
        opd_id: opd1.id,
        uploaded_by: user.id,
        tags: 'health,report',
        is_public: true
      },
      {
        title: 'Education Policy PDF',
        description: 'Education department policy',
        file_path: '/uploads/edu_policy.pdf',
        file_name: 'edu_policy.pdf',
        file_size: 1500,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd2.id,
        uploaded_by: user.id,
        tags: 'education,policy',
        is_public: true
      }
    ]).execute();

    const input: SearchDocumentsInput = {
      q: 'health',
      opd_id: opd1.id,
      document_type: 'pdf',
      page: 1,
      limit: 20
    };

    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.documents[0].title).toBe('Health Policy PDF');
    expect(result.documents[0].opd_id).toBe(opd1.id);
    expect(result.documents[0].document_type).toBe('pdf');
  });
});
