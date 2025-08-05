
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, usersTable, opdsTable } from '../db/schema';
import { type UpdateDocumentInput } from '../schema';
import { updateDocument } from '../handlers/update_document';
import { eq } from 'drizzle-orm';

describe('updateDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOpdId: number;
  let testUserId: number;
  let testDocumentId: number;

  const setupTestData = async () => {
    // Create OPD
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test OPD for document tests'
      })
      .returning()
      .execute();
    testOpdId = opdResult[0].id;

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'staf',
        opd_id: testOpdId
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create document
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Original Document',
        description: 'Original description',
        file_path: '/path/to/original.pdf',
        file_name: 'original.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: testOpdId,
        uploaded_by: testUserId,
        created_date: new Date('2024-01-01'),
        tags: 'original,test',
        is_public: false
      })
      .returning()
      .execute();
    testDocumentId = documentResult[0].id;
  };

  it('should update document title', async () => {
    await setupTestData();

    const input: UpdateDocumentInput = {
      id: testDocumentId,
      title: 'Updated Document Title'
    };

    const result = await updateDocument(input);

    expect(result.id).toEqual(testDocumentId);
    expect(result.title).toEqual('Updated Document Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    await setupTestData();

    const input: UpdateDocumentInput = {
      id: testDocumentId,
      title: 'New Title',
      description: 'New description',
      tags: 'updated,tags',
      is_public: true
    };

    const result = await updateDocument(input);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.tags).toEqual('updated,tags');
    expect(result.is_public).toEqual(true);
    expect(result.opd_id).toEqual(testOpdId); // Should remain unchanged
  });

  it('should update created_date to null', async () => {
    await setupTestData();

    const input: UpdateDocumentInput = {
      id: testDocumentId,
      created_date: null
    };

    const result = await updateDocument(input);

    expect(result.created_date).toBeNull();
  });

  it('should save changes to database', async () => {
    await setupTestData();

    const input: UpdateDocumentInput = {
      id: testDocumentId,
      title: 'Database Test Title',
      is_public: true
    };

    await updateDocument(input);

    // Verify changes were persisted
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, testDocumentId))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].title).toEqual('Database Test Title');
    expect(documents[0].is_public).toEqual(true);
    expect(documents[0].description).toEqual('Original description'); // Unchanged
  });

  it('should throw error for non-existent document', async () => {
    await setupTestData();

    const input: UpdateDocumentInput = {
      id: 99999,
      title: 'This should fail'
    };

    expect(updateDocument(input)).rejects.toThrow(/not found/i);
  });

  it('should update opd_id when provided', async () => {
    await setupTestData();

    // Create another OPD
    const newOpdResult = await db.insert(opdsTable)
      .values({
        name: 'New OPD',
        code: 'NEW001',
        description: 'New OPD for testing'
      })
      .returning()
      .execute();

    const input: UpdateDocumentInput = {
      id: testDocumentId,
      opd_id: newOpdResult[0].id
    };

    const result = await updateDocument(input);

    expect(result.opd_id).toEqual(newOpdResult[0].id);
    expect(result.title).toEqual('Original Document'); // Should remain unchanged
  });

  it('should handle partial updates correctly', async () => {
    await setupTestData();

    const input: UpdateDocumentInput = {
      id: testDocumentId,
      description: 'Only description updated'
    };

    const result = await updateDocument(input);

    expect(result.description).toEqual('Only description updated');
    expect(result.title).toEqual('Original Document'); // Should remain unchanged
    expect(result.is_public).toEqual(false); // Should remain unchanged
    expect(result.tags).toEqual('original,test'); // Should remain unchanged
  });
});
