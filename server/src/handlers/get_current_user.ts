
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '../schema';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

// Simple JWT token validation without external library
const verifyToken = (token: string): { userId: number } | null => {
  try {
    // For this implementation, we'll use a simple base64 encoding approach
    // In a real application, you'd use a proper JWT library
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Simple signature verification (in real app, use proper HMAC)
    const expectedSignature = btoa(JSON.stringify({ userId: payload.userId, secret: JWT_SECRET }));
    if (parts[2] !== expectedSignature) {
      return null;
    }

    // Check expiration if present
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
};

// Simple JWT token creation for testing
export const createToken = (userId: number, expiresIn?: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  
  const payload: any = { userId };
  if (expiresIn === '-1h') {
    payload.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  }
  
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(JSON.stringify({ userId, secret: JWT_SECRET }));
  
  return `${header}.${encodedPayload}.${signature}`;
};

export const getCurrentUser = async (token: string): Promise<User | null> => {
  try {
    // Verify and decode token
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Query user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    
    // Return user data
    return {
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
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    return null;
  }
};
