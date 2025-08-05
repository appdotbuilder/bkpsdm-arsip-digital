
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { opdsTable } from '../db/schema';
import { type CreateOPDInput } from '../schema';
import { getOPDs } from '../handlers/get_opds';

// Test OPD data
const testOPD1: CreateOPDInput = {
  name: 'Dinas Pendidikan',
  code: 'DISDIK',
  description: 'Dinas Pendidikan Kota'
};

const testOPD2: CreateOPDInput = {
  name: 'Dinas Kesehatan',
  code: 'DINKES',
  description: 'Dinas Kesehatan Kota'
};

const testOPD3: CreateOPDInput = {
  name: 'Bagian Hukum',
  code: 'HUKUM',
  description: null
};

describe('getOPDs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no OPDs exist', async () => {
    const result = await getOPDs();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all OPDs', async () => {
    // Create test OPDs
    await db.insert(opdsTable)
      .values([testOPD1, testOPD2, testOPD3])
      .execute();

    const result = await getOPDs();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Verify all OPDs are returned
    const names = result.map(opd => opd.name);
    expect(names).toContain('Dinas Pendidikan');
    expect(names).toContain('Dinas Kesehatan');
    expect(names).toContain('Bagian Hukum');

    const codes = result.map(opd => opd.code);
    expect(codes).toContain('DISDIK');
    expect(codes).toContain('DINKES');
    expect(codes).toContain('HUKUM');
  });

  it('should return OPDs with correct structure and types', async () => {
    // Create a single test OPD
    await db.insert(opdsTable)
      .values(testOPD1)
      .execute();

    const result = await getOPDs();

    expect(result).toHaveLength(1);
    const opd = result[0];

    // Verify OPD structure
    expect(opd.id).toBeDefined();
    expect(typeof opd.id).toBe('number');
    expect(opd.name).toEqual('Dinas Pendidikan');
    expect(opd.code).toEqual('DISDIK');
    expect(opd.description).toEqual('Dinas Pendidikan Kota');
    expect(opd.created_at).toBeInstanceOf(Date);
    expect(opd.updated_at).toBeInstanceOf(Date);
  });

  it('should handle OPDs with null description', async () => {
    // Create OPD with null description
    await db.insert(opdsTable)
      .values(testOPD3)
      .execute();

    const result = await getOPDs();

    expect(result).toHaveLength(1);
    const opd = result[0];

    expect(opd.name).toEqual('Bagian Hukum');
    expect(opd.code).toEqual('HUKUM');
    expect(opd.description).toBeNull();
    expect(opd.created_at).toBeInstanceOf(Date);
    expect(opd.updated_at).toBeInstanceOf(Date);
  });

  it('should return OPDs in creation order', async () => {
    // Create OPDs one by one to test ordering
    await db.insert(opdsTable)
      .values(testOPD1)
      .execute();

    await db.insert(opdsTable)
      .values(testOPD2)
      .execute();

    await db.insert(opdsTable)
      .values(testOPD3)
      .execute();

    const result = await getOPDs();

    expect(result).toHaveLength(3);
    
    // Verify they are returned in creation order (by id)
    expect(result[0].name).toEqual('Dinas Pendidikan');
    expect(result[1].name).toEqual('Dinas Kesehatan');
    expect(result[2].name).toEqual('Bagian Hukum');

    // Verify IDs are in ascending order
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
