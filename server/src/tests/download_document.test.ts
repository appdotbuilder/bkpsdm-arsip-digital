
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable, usersTable, documentsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { downloadDocument } from '../handlers/download_document';

// Test setup data
const testOPD = {
  name: 'Test OPD',
  code: 'TEST001',
  description: 'Test OPD for testing'
};

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  full_name: 'Test User',
  role: 'staf' as const
};

const testDocument = {
  title: 'Test Document',
  description: 'A test document',
  file_path: '/uploads/documents/test-document.pdf',
  file_name: 'test-document.pdf',
  file_size: 1024,
  document_type: 'pdf' as const,
  mime_type: 'application/pdf',
  tags: 'test,document',
  is_public: true
};

describe('downloadDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return file information for existing document', async () => {
    // Create prerequisite data
    const opdResult = await db.insert(opdsTable)
      .values(testOPD)
      .returning()
      .execute();
    const opd = opdResult[0];

    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        opd_id: opd.id
      })
      .returning()
      .execute();
    const user = userResult[0];

    const documentResult = await db.insert(documentsTable)
      .values({
        ...testDocument,
        opd_id: opd.id,
        uploaded_by: user.id
      })
      .returning()
      .execute();
    const document = documentResult[0];

    const input: IdParam = { id: document.id };
    const result = await downloadDocument(input);

    expect(result.file_path).toEqual('/uploads/documents/test-document.pdf');
    expect(result.file_name).toEqual('test-document.pdf');
  });

  it('should throw error for non-existent document', async () => {
    const input: IdParam = { id: 999 };

    await expect(downloadDocument(input)).rejects.toThrow(/document not found/i);
  });

  it('should handle multiple documents and return correct one', async () => {
    // Create prerequisite data
    const opdResult = await db.insert(opdsTable)
      .values(testOPD)
      .returning()
      .execute();
    const opd = opdResult[0];

    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        opd_id: opd.id
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create first document
    const document1Result = await db.insert(documentsTable)
      .values({
        ...testDocument,
        opd_id: opd.id,
        uploaded_by: user.id
      })
      .returning()
      .execute();
    const document1 = document1Result[0];

    // Create second document
    const document2Result = await db.insert(documentsTable)
      .values({
        ...testDocument,
        title: 'Second Document',
        file_path: '/uploads/documents/second-document.pdf',
        file_name: 'second-document.pdf',
        opd_id: opd.id,
        uploaded_by: user.id
      })
      .returning()
      .execute();
    const document2 = document2Result[0];

    // Test retrieving first document
    const input1: IdParam = { id: document1.id };
    const result1 = await downloadDocument(input1);

    expect(result1.file_path).toEqual('/uploads/documents/test-document.pdf');
    expect(result1.file_name).toEqual('test-document.pdf');

    // Test retrieving second document
    const input2: IdParam = { id: document2.id };
    const result2 = await downloadDocument(input2);

    expect(result2.file_path).toEqual('/uploads/documents/second-document.pdf');
    expect(result2.file_name).toEqual('second-document.pdf');
  });
});
