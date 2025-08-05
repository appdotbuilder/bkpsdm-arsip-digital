
import { db } from '../db';
import { opdsTable, usersTable, documentsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteOPD = async (input: IdParam): Promise<{ success: boolean }> => {
  try {
    // First check if OPD exists
    const existingOPD = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, input.id))
      .execute();

    if (existingOPD.length === 0) {
      throw new Error('OPD not found');
    }

    // Check for dependent users
    const dependentUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.opd_id, input.id))
      .execute();

    if (dependentUsers.length > 0) {
      throw new Error('Cannot delete OPD with associated users');
    }

    // Check for dependent documents
    const dependentDocuments = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.opd_id, input.id))
      .execute();

    if (dependentDocuments.length > 0) {
      throw new Error('Cannot delete OPD with associated documents');
    }

    // Delete the OPD
    await db.delete(opdsTable)
      .where(eq(opdsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('OPD deletion failed:', error);
    throw error;
  }
};
