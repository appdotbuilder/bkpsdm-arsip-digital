
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type SearchDocumentsInput, type Document } from '../schema';
import { eq, and, gte, lte, ilike, or, count, desc, SQL } from 'drizzle-orm';

export const searchDocuments = async (input: SearchDocumentsInput): Promise<{ documents: Document[], total: number }> => {
  try {
    // Calculate offset for pagination
    const offset = (input.page - 1) * input.limit;

    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Full-text search across title, description, and tags
    if (input.q) {
      const searchTerm = `%${input.q}%`;
      conditions.push(
        or(
          ilike(documentsTable.title, searchTerm),
          ilike(documentsTable.description, searchTerm),
          ilike(documentsTable.tags, searchTerm)
        )!
      );
    }

    // Filter by OPD
    if (input.opd_id !== undefined) {
      conditions.push(eq(documentsTable.opd_id, input.opd_id));
    }

    // Filter by document type
    if (input.document_type !== undefined) {
      conditions.push(eq(documentsTable.document_type, input.document_type));
    }

    // Date range filter (using upload_date)
    if (input.date_from !== undefined) {
      conditions.push(gte(documentsTable.upload_date, input.date_from));
    }

    if (input.date_to !== undefined) {
      conditions.push(lte(documentsTable.upload_date, input.date_to));
    }

    // Filter by tags (partial match)
    if (input.tags !== undefined) {
      const tagSearchTerm = `%${input.tags}%`;
      conditions.push(ilike(documentsTable.tags, tagSearchTerm));
    }

    // Build where clause
    const whereClause = conditions.length === 0 
      ? undefined 
      : conditions.length === 1 
        ? conditions[0] 
        : and(...conditions);

    // Build main query
    const documentsQuery = db.select().from(documentsTable);
    const finalDocumentsQuery = whereClause 
      ? documentsQuery.where(whereClause).orderBy(desc(documentsTable.upload_date)).limit(input.limit).offset(offset)
      : documentsQuery.orderBy(desc(documentsTable.upload_date)).limit(input.limit).offset(offset);

    // Build count query
    const countQuery = db.select({ count: count() }).from(documentsTable);
    const finalCountQuery = whereClause 
      ? countQuery.where(whereClause)
      : countQuery;

    // Execute both queries
    const [documents, totalResult] = await Promise.all([
      finalDocumentsQuery.execute(),
      finalCountQuery.execute()
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      documents,
      total
    };
  } catch (error) {
    console.error('Document search failed:', error);
    throw error;
  }
};
