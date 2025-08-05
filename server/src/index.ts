
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  updateUserInputSchema, 
  createOPDInputSchema, 
  updateOPDInputSchema, 
  createDocumentInputSchema, 
  updateDocumentInputSchema, 
  searchDocumentsInputSchema,
  loginInputSchema,
  idParamSchema 
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createOPD } from './handlers/create_opd';
import { getOPDs } from './handlers/get_opds';
import { updateOPD } from './handlers/update_opd';
import { deleteOPD } from './handlers/delete_opd';
import { createDocument } from './handlers/create_document';
import { getDocuments } from './handlers/get_documents';
import { searchDocuments } from './handlers/search_documents';
import { getDocumentById } from './handlers/get_document_by_id';
import { updateDocument } from './handlers/update_document';
import { deleteDocument } from './handlers/delete_document';
import { downloadDocument } from './handlers/download_document';
import { login } from './handlers/login';
import { getCurrentUser } from './handlers/get_current_user';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  getCurrentUser: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ input }) => getCurrentUser(input.token)),
  
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteUser(input)),
  
  // OPD management
  createOPD: publicProcedure
    .input(createOPDInputSchema)
    .mutation(({ input }) => createOPD(input)),
  
  getOPDs: publicProcedure
    .query(() => getOPDs()),
  
  updateOPD: publicProcedure
    .input(updateOPDInputSchema)
    .mutation(({ input }) => updateOPD(input)),
  
  deleteOPD: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteOPD(input)),
  
  // Document management
  createDocument: publicProcedure
    .input(createDocumentInputSchema)
    .mutation(({ input }) => createDocument(input)),
  
  getDocuments: publicProcedure
    .query(() => getDocuments()),
  
  searchDocuments: publicProcedure
    .input(searchDocumentsInputSchema)
    .query(({ input }) => searchDocuments(input)),
  
  getDocumentById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getDocumentById(input)),
  
  updateDocument: publicProcedure
    .input(updateDocumentInputSchema)
    .mutation(({ input }) => updateDocument(input)),
  
  deleteDocument: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteDocument(input)),
  
  downloadDocument: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => downloadDocument(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`BKPSDM Digital Archive Management System listening at port: ${port}`);
}

start();
