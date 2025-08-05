
import { db } from '../db';
import { usersTable, opdsTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getUsers = async (): Promise<User[]> => {
  try {
    // Query users with their OPD relations using a left join
    // Left join ensures admin users (with null opd_id) are included
    const results = await db.select()
      .from(usersTable)
      .leftJoin(opdsTable, eq(usersTable.opd_id, opdsTable.id))
      .execute();

    // Map results to User schema format
    return results.map(result => ({
      id: result.users.id,
      username: result.users.username,
      email: result.users.email,
      password_hash: result.users.password_hash,
      full_name: result.users.full_name,
      role: result.users.role,
      opd_id: result.users.opd_id,
      is_active: result.users.is_active,
      created_at: result.users.created_at,
      updated_at: result.users.updated_at
    }));
  } catch (error) {
    console.error('Failed to get users:', error);
    throw error;
  }
};
