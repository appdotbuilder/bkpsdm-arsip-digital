
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, usersTable, opdsTable } from '../db/schema';
import { type CreateDocumentInput } from '../schema';
import { createDocument } from '../handlers/create_document';
import { eq } from 'drizzle-orm';

describe('createDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOpdId: number;
  let testUserId: number;

  const setupPrerequisiteData = async () => {
    // Create test OPD
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test OPD for document creation'
      })
      .returning()
      .execute();
    testOpdId = opdResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'staf',
        opd_id: testOpdId,
        is_active: true
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;
  };

  it('should create a document with all required fields', async () => {
    await setupPrerequisiteData();

    const testInput: CreateDocumentInput = {
      title: 'Test Document',
      description: 'A test document for unit testing',
      file_path: '/uploads/test-document.pdf',
      file_name: 'test-document.pdf',
      file_size: 1024000,
      document_type: 'pdf',
      mime_type: 'application/pdf',
      opd_id: testOpdId,
      uploaded_by: testUserId,
      created_date: new Date('2024-01-15'),
      tags: 'test,document,pdf',
      is_public: false
    };

    const result = await createDocument(testInput);

    // Validate basic fields
    expect(result.title).toEqual('Test Document');
    expect(result.description).toEqual('A test document for unit testing');
    expect(result.file_path).toEqual('/uploads/test-document.pdf');
    expect(result.file_name).toEqual('test-document.pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.document_type).toEqual('pdf');
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.opd_id).toEqual(testOpdId);
    expect(result.uploaded_by).toEqual(testUserId);
    expect(result.tags).toEqual('test,document,pdf');
    expect(result.is_public).toEqual(false);

    // Validate generated fields
    expect(result.id).toBeDefined();
    expect(result.upload_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_date).toBeInstanceOf(Date);
  });

  it('should save document to database', async () => {
    await setupPrerequisiteData();

    const testInput: CreateDocumentInput = {
      title: 'Database Test Document',
      description: 'Testing database persistence',
      file_path: '/uploads/db-test.pdf',
      file_name: 'db-test.pdf',
      file_size: 512000,
      document_type: 'pdf',
      mime_type: 'application/pdf',
      opd_id: testOpdId,
      uploaded_by: testUserId,
      created_date: null,
      tags: null,
      is_public: true
    };

    const result = await createDocument(testInput);

    // Query document from database
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    const savedDocument = documents[0];
    expect(savedDocument.title).toEqual('Database Test Document');
    expect(savedDocument.description).toEqual('Testing database persistence');
    expect(savedDocument.file_size).toEqual(512000);
    expect(savedDocument.is_public).toEqual(true);
    expect(savedDocument.created_date).toBeNull();
    expect(savedDocument.tags).toBeNull();
  });

  it('should create document with minimal required fields', async () => {
    await setupPrerequisiteData();

    const minimalInput: CreateDocumentInput = {
      title: 'Minimal Document',
      description: null,
      file_path: '/uploads/minimal.pdf',
      file_name: 'minimal.pdf',
      file_size: 100000,
      document_type: 'pdf',
      mime_type: 'application/pdf',
      opd_id: testOpdId,
      uploaded_by: testUserId,
      created_date: null,
      tags: null,
      is_public: false
    };

    const result = await createDocument(minimalInput);

    expect(result.title).toEqual('Minimal Document');
    expect(result.description).toBeNull();
    expect(result.created_date).toBeNull();
    expect(result.tags).toBeNull();
    expect(result.is_public).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should handle different document types correctly', async () => {
    await setupPrerequisiteData();

    const imageInput: CreateDocumentInput = {
      title: 'Test Image',
      description: 'An image document',
      file_path: '/uploads/test-image.jpg',
      file_name: 'test-image.jpg',
      file_size: 2048000,
      document_type: 'image',
      mime_type: 'image/jpeg',
      opd_id: testOpdId,
      uploaded_by: testUserId,
      created_date: null,
      tags: 'image,jpeg',
      is_public: true
    };

    const result = await createDocument(imageInput);

    expect(result.document_type).toEqual('image');
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.file_name).toEqual('test-image.jpg');
  });

  it('should throw error when OPD does not exist', async () => {
    await setupPrerequisiteData();

    const invalidInput: CreateDocumentInput = {
      title: 'Invalid Document',
      description: null,
      file_path: '/uploads/invalid.pdf',
      file_name: 'invalid.pdf',
      file_size: 100000,
      document_type: 'pdf',
      mime_type: 'application/pdf',
      opd_id: 99999, // Non-existent OPD
      uploaded_by: testUserId,
      created_date: null,
      tags: null,
      is_public: false
    };

    await expect(createDocument(invalidInput)).rejects.toThrow(/OPD with id 99999 not found/i);
  });

  it('should throw error when uploader user does not exist', async () => {
    await setupPrerequisiteData();

    const invalidInput: CreateDocumentInput = {
      title: 'Invalid Document',
      description: null,
      file_path: '/uploads/invalid.pdf',
      file_name: 'invalid.pdf',
      file_size: 100000,
      document_type: 'pdf',
      mime_type: 'application/pdf',
      opd_id: testOpdId,
      uploaded_by: 99999, // Non-existent user
      created_date: null,
      tags: null,
      is_public: false
    };

    await expect(createDocument(invalidInput)).rejects.toThrow(/User with id 99999 not found/i);
  });
});
