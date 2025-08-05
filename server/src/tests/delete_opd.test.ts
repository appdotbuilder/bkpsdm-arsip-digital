
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable, usersTable, documentsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteOPD } from '../handlers/delete_opd';
import { eq } from 'drizzle-orm';

describe('deleteOPD', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an OPD successfully', async () => {
    // Create test OPD
    const opd = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test description'
      })
      .returning()
      .execute();

    const testInput: IdParam = { id: opd[0].id };

    const result = await deleteOPD(testInput);

    expect(result.success).toBe(true);

    // Verify OPD is deleted
    const deletedOPD = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, opd[0].id))
      .execute();

    expect(deletedOPD).toHaveLength(0);
  });

  it('should throw error when OPD does not exist', async () => {
    const testInput: IdParam = { id: 99999 };

    await expect(deleteOPD(testInput)).rejects.toThrow(/OPD not found/i);
  });

  it('should throw error when OPD has associated users', async () => {
    // Create test OPD
    const opd = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create user associated with the OPD (no bcrypt needed for simple test)
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'staf',
        opd_id: opd[0].id,
        is_active: true
      })
      .execute();

    const testInput: IdParam = { id: opd[0].id };

    await expect(deleteOPD(testInput)).rejects.toThrow(/Cannot delete OPD with associated users/i);

    // Verify OPD still exists
    const existingOPD = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, opd[0].id))
      .execute();

    expect(existingOPD).toHaveLength(1);
  });

  it('should throw error when OPD has associated documents', async () => {
    // Create test OPD
    const opd = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create user for document uploader
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'admin',
        opd_id: null,
        is_active: true
      })
      .returning()
      .execute();

    // Create document associated with the OPD
    await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        description: 'Test description',
        file_path: '/test/path',
        file_name: 'test.pdf',
        file_size: 1024,
        document_type: 'pdf',
        mime_type: 'application/pdf',
        opd_id: opd[0].id,
        uploaded_by: user[0].id,
        created_date: new Date(),
        tags: 'test',
        is_public: false
      })
      .execute();

    const testInput: IdParam = { id: opd[0].id };

    await expect(deleteOPD(testInput)).rejects.toThrow(/Cannot delete OPD with associated documents/i);

    // Verify OPD still exists
    const existingOPD = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, opd[0].id))
      .execute();

    expect(existingOPD).toHaveLength(1);
  });
});
