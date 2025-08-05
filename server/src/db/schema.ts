
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'pengelola', 'staf']);
export const documentTypeEnum = pgEnum('document_type', ['pdf', 'image', 'word', 'excel']);

// OPD table
export const opdsTable = pgTable('opds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  opd_id: integer('opd_id'), // Nullable for admin users
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  file_path: text('file_path').notNull(),
  file_name: text('file_name').notNull(),
  file_size: integer('file_size').notNull(),
  document_type: documentTypeEnum('document_type').notNull(),
  mime_type: text('mime_type').notNull(),
  opd_id: integer('opd_id').notNull(),
  uploaded_by: integer('uploaded_by').notNull(),
  upload_date: timestamp('upload_date').defaultNow().notNull(),
  created_date: timestamp('created_date'), // Document creation date (metadata)
  tags: text('tags'), // Comma-separated tags
  is_public: boolean('is_public').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const opdsRelations = relations(opdsTable, ({ many }) => ({
  users: many(usersTable),
  documents: many(documentsTable),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  opd: one(opdsTable, {
    fields: [usersTable.opd_id],
    references: [opdsTable.id],
  }),
  documents: many(documentsTable),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  opd: one(opdsTable, {
    fields: [documentsTable.opd_id],
    references: [opdsTable.id],
  }),
  uploader: one(usersTable, {
    fields: [documentsTable.uploaded_by],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type OPD = typeof opdsTable.$inferSelect;
export type NewOPD = typeof opdsTable.$inferInsert;
export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  opds: opdsTable, 
  documents: documentsTable 
};
