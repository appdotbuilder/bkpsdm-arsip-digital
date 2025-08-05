
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteDocument = async (input: IdParam): Promise<{ success: boolean }> => {
  try {
    // Check if document exists
    const existingDocuments = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .execute();

    if (existingDocuments.length === 0) {
      throw new Error(`Document with id ${input.id} not found`);
    }

    // Delete the document record
    const result = await db.delete(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Document deletion failed:', error);
    throw error;
  }
};
