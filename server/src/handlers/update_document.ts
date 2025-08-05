
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type UpdateDocumentInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDocument = async (input: UpdateDocumentInput): Promise<Document> => {
  try {
    // Check if document exists
    const existingDocument = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .execute();

    if (existingDocument.length === 0) {
      throw new Error(`Document with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof documentsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.opd_id !== undefined) {
      updateData.opd_id = input.opd_id;
    }

    if (input.created_date !== undefined) {
      updateData.created_date = input.created_date;
    }

    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }

    if (input.is_public !== undefined) {
      updateData.is_public = input.is_public;
    }

    // Update the document
    const result = await db.update(documentsTable)
      .set(updateData)
      .where(eq(documentsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document update failed:', error);
    throw error;
  }
};
