
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type IdParam, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const getDocumentById = async (input: IdParam): Promise<Document | null> => {
  try {
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const document = results[0];
    return {
      ...document,
      file_size: document.file_size, // Integer - no conversion needed
      upload_date: document.upload_date,
      created_date: document.created_date,
      created_at: document.created_at,
      updated_at: document.updated_at
    };
  } catch (error) {
    console.error('Document retrieval failed:', error);
    throw error;
  }
};
