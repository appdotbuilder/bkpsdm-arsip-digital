
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable } from '../db/schema';
import { type UpdateOPDInput, type CreateOPDInput } from '../schema';
import { updateOPD } from '../handlers/update_opd';
import { eq } from 'drizzle-orm';

// Test data
const testOPDInput: CreateOPDInput = {
  name: 'Original OPD',
  code: 'ORIG001',
  description: 'Original description'
};

describe('updateOPD', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an OPD with all fields', async () => {
    // Create initial OPD
    const createResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();
    
    const originalOPD = createResult[0];

    // Update input
    const updateInput: UpdateOPDInput = {
      id: originalOPD.id,
      name: 'Updated OPD Name',
      code: 'UPD001',
      description: 'Updated description'
    };

    const result = await updateOPD(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(originalOPD.id);
    expect(result.name).toEqual('Updated OPD Name');
    expect(result.code).toEqual('UPD001');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(originalOPD.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalOPD.updated_at).toBe(true);
  });

  it('should update an OPD with partial fields', async () => {
    // Create initial OPD
    const createResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();
    
    const originalOPD = createResult[0];

    // Update only name
    const updateInput: UpdateOPDInput = {
      id: originalOPD.id,
      name: 'Partially Updated Name'
    };

    const result = await updateOPD(updateInput);

    // Verify only name is updated, others remain unchanged
    expect(result.id).toEqual(originalOPD.id);
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.code).toEqual(originalOPD.code);
    expect(result.description).toEqual(originalOPD.description);
    expect(result.created_at).toEqual(originalOPD.created_at);
    expect(result.updated_at > originalOPD.updated_at).toBe(true);
  });

  it('should update description to null', async () => {
    // Create initial OPD
    const createResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();
    
    const originalOPD = createResult[0];

    // Update description to null
    const updateInput: UpdateOPDInput = {
      id: originalOPD.id,
      description: null
    };

    const result = await updateOPD(updateInput);

    // Verify description is null
    expect(result.description).toBeNull();
    expect(result.name).toEqual(originalOPD.name);
    expect(result.code).toEqual(originalOPD.code);
  });

  it('should save updated OPD to database', async () => {
    // Create initial OPD
    const createResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();
    
    const originalOPD = createResult[0];

    // Update input
    const updateInput: UpdateOPDInput = {
      id: originalOPD.id,
      name: 'Database Test Update',
      code: 'DBTEST'
    };

    await updateOPD(updateInput);

    // Query database to verify changes
    const updatedOPDs = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, originalOPD.id))
      .execute();

    expect(updatedOPDs).toHaveLength(1);
    expect(updatedOPDs[0].name).toEqual('Database Test Update');
    expect(updatedOPDs[0].code).toEqual('DBTEST');
    expect(updatedOPDs[0].description).toEqual(originalOPD.description);
  });

  it('should throw error when OPD does not exist', async () => {
    const updateInput: UpdateOPDInput = {
      id: 99999,
      name: 'Non-existent OPD'
    };

    await expect(updateOPD(updateInput)).rejects.toThrow(/OPD not found/i);
  });

  it('should handle code uniqueness constraint', async () => {
    // Create two OPDs
    const opd1 = await db.insert(opdsTable)
      .values({ name: 'OPD 1', code: 'CODE001', description: 'First OPD' })
      .returning()
      .execute();

    await db.insert(opdsTable)
      .values({ name: 'OPD 2', code: 'CODE002', description: 'Second OPD' })
      .returning()
      .execute();

    // Try to update first OPD with second OPD's code
    const updateInput: UpdateOPDInput = {
      id: opd1[0].id,
      code: 'CODE002' // This should cause a uniqueness violation
    };

    await expect(updateOPD(updateInput)).rejects.toThrow();
  });
});
