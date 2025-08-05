
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const login = async (input: LoginInput): Promise<AuthResponse | null> => {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return null; // User is inactive
    }

    // In a real implementation, you would hash the input password and compare
    // For now, we'll do a simple string comparison (this is not secure)
    if (user.password_hash !== input.password) {
      return null; // Invalid password
    }

    // Generate a simple JWT-like token (in real implementation, use proper JWT library)
    const token = `token_${user.id}_${Date.now()}`;

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        full_name: user.full_name,
        role: user.role,
        opd_id: user.opd_id,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
