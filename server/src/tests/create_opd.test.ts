
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable } from '../db/schema';
import { type CreateOPDInput } from '../schema';
import { createOPD } from '../handlers/create_opd';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateOPDInput = {
  name: 'Dinas Pendidikan',
  code: 'DISDIK',
  description: 'Dinas Pendidikan Kota XYZ'
};

describe('createOPD', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an OPD', async () => {
    const result = await createOPD(testInput);

    // Basic field validation
    expect(result.name).toEqual('Dinas Pendidikan');
    expect(result.code).toEqual('DISDIK');
    expect(result.description).toEqual('Dinas Pendidikan Kota XYZ');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save OPD to database', async () => {
    const result = await createOPD(testInput);

    // Query using proper drizzle syntax
    const opds = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, result.id))
      .execute();

    expect(opds).toHaveLength(1);
    expect(opds[0].name).toEqual('Dinas Pendidikan');
    expect(opds[0].code).toEqual('DISDIK');
    expect(opds[0].description).toEqual('Dinas Pendidikan Kota XYZ');
    expect(opds[0].created_at).toBeInstanceOf(Date);
    expect(opds[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create OPD with null description', async () => {
    const inputWithNullDesc: CreateOPDInput = {
      name: 'Dinas Kesehatan',
      code: 'DINKES',
      description: null
    };

    const result = await createOPD(inputWithNullDesc);

    expect(result.name).toEqual('Dinas Kesehatan');
    expect(result.code).toEqual('DINKES');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should enforce unique code constraint', async () => {
    // Create first OPD
    await createOPD(testInput);

    // Try to create second OPD with same code
    const duplicateInput: CreateOPDInput = {
      name: 'Another Department',
      code: 'DISDIK', // Same code
      description: 'Different description'
    };

    expect(createOPD(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle empty string description', async () => {
    const inputWithEmptyDesc: CreateOPDInput = {
      name: 'Dinas Perhubungan',
      code: 'DISHUB',
      description: ''
    };

    const result = await createOPD(inputWithEmptyDesc);

    expect(result.name).toEqual('Dinas Perhubungan');
    expect(result.code).toEqual('DISHUB');
    expect(result.description).toEqual('');
    expect(result.id).toBeDefined();
  });
});
