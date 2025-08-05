
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteUser = async (input: IdParam): Promise<{ success: boolean }> => {
  try {
    // Check if user exists first
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Soft delete by setting is_active to false
    const result = await db.update(usersTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};
