
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, opdsTable, documentsTable } from '../db/schema';
import { getDocuments, type GetDocumentsInput } from '../handlers/get_documents';

describe('getDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOPD1: any;
  let testOPD2: any;
  let adminUser: any;
  let pengelolaUser: any;
  let stafUser: any;
  let userWithoutOPD: any;

  beforeEach(async () => {
    // Create test OPDs
    const opds = await db.insert(opdsTable)
      .values([
        {
          name: 'OPD Kesehatan',
          code: 'DINKES',
          description: 'Dinas Kesehatan'
        },
        {
          name: 'OPD Pendidikan',
          code: 'DINDIK',
          description: 'Dinas Pendidikan'
        }
      ])
      .returning()
      .execute();

    testOPD1 = opds[0];
    testOPD2 = opds[1];

    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'admin',
          email: 'admin@test.com',
          password_hash: 'hash123',
          full_name: 'Admin User',
          role: 'admin',
          opd_id: null,
          is_active: true
        },
        {
          username: 'pengelola1',
          email: 'pengelola1@test.com',
          password_hash: 'hash123',
          full_name: 'Pengelola OPD1',
          role: 'pengelola',
          opd_id: testOPD1.id,
          is_active: true
        },
        {
          username: 'staf1',
          email: 'staf1@test.com',
          password_hash: 'hash123',
          full_name: 'Staf OPD1',
          role: 'staf',
          opd_id: testOPD1.id,
          is_active: true
        },
        {
          username: 'user_no_opd',
          email: 'user@test.com',
          password_hash: 'hash123',
          full_name: 'User Without OPD',
          role: 'staf',
          opd_id: null,
          is_active: true
        }
      ])
      .returning()
      .execute();

    adminUser = users[0];
    pengelolaUser = users[1];
    stafUser = users[2];
    userWithoutOPD = users[3];

    // Create test documents
    await db.insert(documentsTable)
      .values([
        {
          title: 'Public Document OPD1',
          description: 'Public document from OPD1',
          file_path: '/files/public1.pdf',
          file_name: 'public1.pdf',
          file_size: 1024,
          document_type: 'pdf',
          mime_type: 'application/pdf',
          opd_id: testOPD1.id,
          uploaded_by: pengelolaUser.id,
          tags: 'public,test',
          is_public: true
        },
        {
          title: 'Private Document OPD1',
          description: 'Private document from OPD1',
          file_path: '/files/private1.pdf',
          file_name: 'private1.pdf',
          file_size: 2048,
          document_type: 'pdf',
          mime_type: 'application/pdf',
          opd_id: testOPD1.id,
          uploaded_by: pengelolaUser.id,
          tags: 'private,test',
          is_public: false
        },
        {
          title: 'Public Document OPD2',
          description: 'Public document from OPD2',
          file_path: '/files/public2.pdf',
          file_name: 'public2.pdf',
          file_size: 1536,
          document_type: 'pdf',
          mime_type: 'application/pdf',
          opd_id: testOPD2.id,
          uploaded_by: adminUser.id,
          tags: 'public,test',
          is_public: true
        },
        {
          title: 'Private Document OPD2',
          description: 'Private document from OPD2',
          file_path: '/files/private2.pdf',
          file_name: 'private2.pdf',
          file_size: 3072,
          document_type: 'pdf',
          mime_type: 'application/pdf',
          opd_id: testOPD2.id,
          uploaded_by: adminUser.id,
          tags: 'private,test',
          is_public: false
        }
      ])
      .execute();
  });

  it('should throw error for non-existent user', async () => {
    const input: GetDocumentsInput = {
      user_id: 999999
    };

    await expect(getDocuments(input)).rejects.toThrow(/user not found/i);
  });

  it('should allow admin to see all public documents by default', async () => {
    const input: GetDocumentsInput = {
      user_id: adminUser.id
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(2);
    results.forEach(doc => {
      expect(doc.is_public).toBe(true);
    });

    const titles = results.map(doc => doc.title);
    expect(titles).toContain('Public Document OPD1');
    expect(titles).toContain('Public Document OPD2');
  });

  it('should allow admin to see all documents when include_private is true', async () => {
    const input: GetDocumentsInput = {
      user_id: adminUser.id,
      include_private: true
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(4);

    const titles = results.map(doc => doc.title);
    expect(titles).toContain('Public Document OPD1');
    expect(titles).toContain('Private Document OPD1');
    expect(titles).toContain('Public Document OPD2');
    expect(titles).toContain('Private Document OPD2');
  });

  it('should allow pengelola to see public documents only by default', async () => {
    const input: GetDocumentsInput = {
      user_id: pengelolaUser.id
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(2);
    results.forEach(doc => {
      expect(doc.is_public).toBe(true);
    });
  });

  it('should allow pengelola to see own OPD documents and public documents from other OPDs when include_private is true', async () => {
    const input: GetDocumentsInput = {
      user_id: pengelolaUser.id,
      include_private: true
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(3);

    const titles = results.map(doc => doc.title);
    expect(titles).toContain('Public Document OPD1');
    expect(titles).toContain('Private Document OPD1'); // Can see private from own OPD
    expect(titles).toContain('Public Document OPD2'); // Can see public from other OPD
    expect(titles).not.toContain('Private Document OPD2'); // Cannot see private from other OPD
  });

  it('should allow staf to see public documents only by default', async () => {
    const input: GetDocumentsInput = {
      user_id: stafUser.id
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(2);
    results.forEach(doc => {
      expect(doc.is_public).toBe(true);
    });
  });

  it('should allow staf to see own OPD documents and public documents from other OPDs when include_private is true', async () => {
    const input: GetDocumentsInput = {
      user_id: stafUser.id,
      include_private: true
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(3);

    const titles = results.map(doc => doc.title);
    expect(titles).toContain('Public Document OPD1');
    expect(titles).toContain('Private Document OPD1'); // Can see private from own OPD
    expect(titles).toContain('Public Document OPD2'); // Can see public from other OPD
    expect(titles).not.toContain('Private Document OPD2'); // Cannot see private from other OPD
  });

  it('should allow user without OPD to see only public documents', async () => {
    const input: GetDocumentsInput = {
      user_id: userWithoutOPD.id,
      include_private: true // Even with this flag, should only see public
    };

    const results = await getDocuments(input);

    expect(results).toHaveLength(2);
    results.forEach(doc => {
      expect(doc.is_public).toBe(true);
    });

    const titles = results.map(doc => doc.title);
    expect(titles).toContain('Public Document OPD1');
    expect(titles).toContain('Public Document OPD2');
  });

  it('should return documents with correct fields', async () => {
    const input: GetDocumentsInput = {
      user_id: adminUser.id
    };

    const results = await getDocuments(input);

    expect(results.length).toBeGreaterThan(0);
    const doc = results[0];

    expect(doc.id).toBeDefined();
    expect(doc.title).toBeDefined();
    expect(doc.file_path).toBeDefined();
    expect(doc.file_name).toBeDefined();
    expect(doc.file_size).toBeDefined();
    expect(doc.document_type).toBeDefined();
    expect(doc.mime_type).toBeDefined();
    expect(doc.opd_id).toBeDefined();
    expect(doc.uploaded_by).toBeDefined();
    expect(doc.upload_date).toBeInstanceOf(Date);
    expect(doc.is_public).toBeDefined();
    expect(doc.created_at).toBeInstanceOf(Date);
    expect(doc.updated_at).toBeInstanceOf(Date);
  });

  it('should return documents ordered by upload date (newest first)', async () => {
    const input: GetDocumentsInput = {
      user_id: adminUser.id,
      include_private: true
    };

    const results = await getDocuments(input);

    expect(results.length).toBeGreaterThan(1);

    // Check that results are ordered by upload_date in descending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].upload_date >= results[i].upload_date).toBe(true);
    }
  });
});
