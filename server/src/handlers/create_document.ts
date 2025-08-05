
import { db } from '../db';
import { documentsTable, usersTable, opdsTable } from '../db/schema';
import { type CreateDocumentInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const createDocument = async (input: CreateDocumentInput): Promise<Document> => {
  try {
    // Validate that OPD exists
    const opd = await db.select()
      .from(opdsTable)
      .where(eq(opdsTable.id, input.opd_id))
      .execute();

    if (opd.length === 0) {
      throw new Error(`OPD with id ${input.opd_id} not found`);
    }

    // Validate that uploader user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.uploaded_by))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.uploaded_by} not found`);
    }

    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        title: input.title,
        description: input.description,
        file_path: input.file_path,
        file_name: input.file_name,
        file_size: input.file_size,
        document_type: input.document_type,
        mime_type: input.mime_type,
        opd_id: input.opd_id,
        uploaded_by: input.uploaded_by,
        created_date: input.created_date,
        tags: input.tags,
        is_public: input.is_public
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document creation failed:', error);
    throw error;
  }
};
