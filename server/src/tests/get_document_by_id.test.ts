
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable, usersTable, documentsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getDocumentById } from '../handlers/get_document_by_id';

describe('getDocumentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOpdId: number;
  let testUserId: number;
  let testDocumentId: number;

  beforeEach(async () => {
    // Create test OPD
    const opd = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test organization'
      })
      .returning()
      .execute();
    testOpdId = opd[0].id;

    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'staf',
        opd_id: testOpdId,
        is_active: true
      })
      .returning()
      .execute();
    testUserId = user[0].id;

    // Create test document
    const document = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        description: 'A test document',
        file_path: '/uploads/test.pdf',
        file_name: 'test.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: testOpdId,
        uploaded_by: testUserId,
        created_date: new Date('2023-01-01'),
        tags: 'test,document',
        is_public: true
      })
      .returning()
      .execute();
    testDocumentId = document[0].id;
  });

  it('should return document when id exists', async () => {
    const input: IdParam = { id: testDocumentId };
    const result = await getDocumentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testDocumentId);
    expect(result!.title).toEqual('Test Document');
    expect(result!.description).toEqual('A test document');
    expect(result!.file_path).toEqual('/uploads/test.pdf');
    expect(result!.file_name).toEqual('test.pdf');
    expect(result!.file_size).toEqual(1024);
    expect(result!.document_type).toEqual('pdf');
    expect(result!.mime_type).toEqual('application/pdf');
    expect(result!.opd_id).toEqual(testOpdId);
    expect(result!.uploaded_by).toEqual(testUserId);
    expect(result!.upload_date).toBeInstanceOf(Date);
    expect(result!.created_date).toBeInstanceOf(Date);
    expect(result!.tags).toEqual('test,document');
    expect(result!.is_public).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when document does not exist', async () => {
    const input: IdParam = { id: 99999 };
    const result = await getDocumentById(input);

    expect(result).toBeNull();
  });

  it('should handle documents with null optional fields', async () => {
    // Create document with minimal fields
    const minimalDocument = await db.insert(documentsTable)
      .values({
        title: 'Minimal Document',
        description: null,
        file_path: '/uploads/minimal.pdf',
        file_name: 'minimal.pdf',
        file_size: 512,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: testOpdId,
        uploaded_by: testUserId,
        created_date: null,
        tags: null,
        is_public: false
      })
      .returning()
      .execute();

    const input: IdParam = { id: minimalDocument[0].id };
    const result = await getDocumentById(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Document');
    expect(result!.description).toBeNull();
    expect(result!.created_date).toBeNull();
    expect(result!.tags).toBeNull();
    expect(result!.is_public).toEqual(false);
  });

  it('should return document with different document types', async () => {
    // Test image document
    const imageDocument = await db.insert(documentsTable)
      .values({
        title: 'Test Image',
        file_path: '/uploads/image.jpg',
        file_name: 'image.jpg',
        file_size: 2048,
        document_type: 'image',
        mime_type: 'image/jpeg',
        opd_id: testOpdId,
        uploaded_by: testUserId,
        is_public: true
      })
      .returning()
      .execute();

    const input: IdParam = { id: imageDocument[0].id };
    const result = await getDocumentById(input);

    expect(result).not.toBeNull();
    expect(result!.document_type).toEqual('image');
    expect(result!.mime_type).toEqual('image/jpeg');
    expect(result!.file_size).toEqual(2048);
  });
});
