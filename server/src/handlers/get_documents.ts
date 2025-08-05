
import { db } from '../db';
import { documentsTable, usersTable } from '../db/schema';
import { type Document } from '../schema';
import { eq, and, or, desc } from 'drizzle-orm';

export interface GetDocumentsInput {
  user_id: number;
  include_private?: boolean;
}

export const getDocuments = async (input: GetDocumentsInput): Promise<Document[]> => {
  try {
    // First, get the user to determine their role and OPD
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Determine what documents the user can see based on role and access rights
    let results;

    if (user.role === 'admin') {
      // Admin can see all documents or just public ones
      if (input.include_private) {
        // Admin sees all documents
        results = await db.select()
          .from(documentsTable)
          .orderBy(desc(documentsTable.upload_date))
          .execute();
      } else {
        // Admin sees only public documents
        results = await db.select()
          .from(documentsTable)
          .where(eq(documentsTable.is_public, true))
          .orderBy(desc(documentsTable.upload_date))
          .execute();
      }
    } else if ((user.role === 'pengelola' || user.role === 'staf') && user.opd_id && input.include_private) {
      // Non-admin users with OPD can see all documents from their OPD + public documents from other OPDs
      results = await db.select()
        .from(documentsTable)
        .where(
          or(
            eq(documentsTable.opd_id, user.opd_id),
            eq(documentsTable.is_public, true)
          )
        )
        .orderBy(desc(documentsTable.upload_date))
        .execute();
    } else {
      // Default case: only public documents
      results = await db.select()
        .from(documentsTable)
        .where(eq(documentsTable.is_public, true))
        .orderBy(desc(documentsTable.upload_date))
        .execute();
    }

    return results.map(doc => ({
      ...doc,
      upload_date: doc.upload_date,
      created_date: doc.created_date,
      created_at: doc.created_at,
      updated_at: doc.updated_at
    }));
  } catch (error) {
    console.error('Get documents failed:', error);
    throw error;
  }
};
