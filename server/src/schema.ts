
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['admin', 'pengelola', 'staf']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Document type enum
export const documentTypeSchema = z.enum(['pdf', 'image', 'word', 'excel']);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  opd_id: z.number().nullable(), // Nullable for admin users
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// OPD (Organisasi Perangkat Daerah) schema
export const opdSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type OPD = z.infer<typeof opdSchema>;

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  file_path: z.string(),
  file_name: z.string(),
  file_size: z.number(),
  document_type: documentTypeSchema,
  mime_type: z.string(),
  opd_id: z.number(),
  uploaded_by: z.number(),
  upload_date: z.coerce.date(),
  created_date: z.coerce.date().nullable(), // Document creation date (metadata)
  tags: z.string().nullable(), // Comma-separated tags
  is_public: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string(),
  role: userRoleSchema,
  opd_id: z.number().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createOPDInputSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string().nullable()
});

export type CreateOPDInput = z.infer<typeof createOPDInputSchema>;

export const createDocumentInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  file_path: z.string(),
  file_name: z.string(),
  file_size: z.number().positive(),
  document_type: documentTypeSchema,
  mime_type: z.string(),
  opd_id: z.number(),
  uploaded_by: z.number(),
  created_date: z.coerce.date().nullable(),
  tags: z.string().nullable(),
  is_public: z.boolean().default(false)
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

// Update schemas
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  role: userRoleSchema.optional(),
  opd_id: z.number().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateOPDInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().nullable().optional()
});

export type UpdateOPDInput = z.infer<typeof updateOPDInputSchema>;

export const updateDocumentInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  opd_id: z.number().optional(),
  created_date: z.coerce.date().nullable().optional(),
  tags: z.string().nullable().optional(),
  is_public: z.boolean().optional()
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;

// Search and filter schemas
export const searchDocumentsInputSchema = z.object({
  q: z.string().optional(), // Search query
  opd_id: z.number().optional(),
  document_type: documentTypeSchema.optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  tags: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type SearchDocumentsInput = z.infer<typeof searchDocumentsInputSchema>;

// Authentication schemas
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// ID parameter schema
export const idParamSchema = z.object({
  id: z.number()
});

export type IdParam = z.infer<typeof idParamSchema>;
