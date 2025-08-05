
import { db } from '../db';
import { opdsTable } from '../db/schema';
import { type UpdateOPDInput, type OPD } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOPD = async (input: UpdateOPDInput): Promise<OPD> => {
  try {
    // Check if OPD exists
    const existingOPD = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, input.id))
      .execute();

    if (existingOPD.length === 0) {
      throw new Error('OPD not found');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof opdsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.code !== undefined) {
      updateData.code = input.code;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update OPD record
    const result = await db.update(opdsTable)
      .set(updateData)
      .where(eq(opdsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('OPD update failed:', error);
    throw error;
  }
};
