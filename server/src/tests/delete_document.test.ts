
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, opdsTable, usersTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteDocument } from '../handlers/delete_document';
import { eq } from 'drizzle-orm';

describe('deleteDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing document', async () => {
    // Create prerequisite OPD
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test OPD for document deletion'
      })
      .returning()
      .execute();

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'staf',
        opd_id: opdResult[0].id
      })
      .returning()
      .execute();

    // Create test document
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        description: 'A document for testing deletion',
        file_path: '/uploads/test.pdf',
        file_name: 'test.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opdResult[0].id,
        uploaded_by: userResult[0].id,
        is_public: false
      })
      .returning()
      .execute();

    const input: IdParam = { id: documentResult[0].id };

    // Delete the document
    const result = await deleteDocument(input);

    // Verify deletion success
    expect(result.success).toBe(true);

    // Verify document no longer exists in database
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentResult[0].id))
      .execute();

    expect(documents).toHaveLength(0);
  });

  it('should throw error when document does not exist', async () => {
    const input: IdParam = { id: 999 };

    await expect(deleteDocument(input)).rejects.toThrow(/not found/i);
  });

  it('should verify document exists before deletion', async () => {
    // Create prerequisite OPD
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST002',
        description: 'Test OPD for verification'
      })
      .returning()
      .execute();

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User 2',
        role: 'staf',
        opd_id: opdResult[0].id
      })
      .returning()
      .execute();

    // Create test document
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document 2',
        description: 'Another document for testing',
        file_path: '/uploads/test2.pdf',
        file_name: 'test2.pdf',
        file_size: 2048,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opdResult[0].id,
        uploaded_by: userResult[0].id,
        is_public: true
      })
      .returning()
      .execute();

    // Verify document exists before deletion
    const beforeDeletion = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentResult[0].id))
      .execute();

    expect(beforeDeletion).toHaveLength(1);
    expect(beforeDeletion[0].title).toEqual('Test Document 2');

    // Delete the document
    const input: IdParam = { id: documentResult[0].id };
    const result = await deleteDocument(input);

    expect(result.success).toBe(true);

    // Verify document no longer exists
    const afterDeletion = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentResult[0].id))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });
});
