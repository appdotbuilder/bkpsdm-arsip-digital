
import { db } from '../db';
import { opdsTable } from '../db/schema';
import { type CreateOPDInput, type OPD } from '../schema';

export const createOPD = async (input: CreateOPDInput): Promise<OPD> => {
  try {
    // Insert OPD record
    const result = await db.insert(opdsTable)
      .values({
        name: input.name,
        code: input.code,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('OPD creation failed:', error);
    throw error;
  }
};
