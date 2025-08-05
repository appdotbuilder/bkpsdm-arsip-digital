
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdParam } from '../schema';

export const downloadDocument = async (input: IdParam): Promise<{ file_path: string, file_name: string }> => {
  try {
    // Find the document by ID
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .execute();

    if (documents.length === 0) {
      throw new Error('Document not found');
    }

    const document = documents[0];

    // Return file information for download
    return {
      file_path: document.file_path,
      file_name: document.file_name
    };
  } catch (error) {
    console.error('Document download failed:', error);
    throw error;
  }
};
