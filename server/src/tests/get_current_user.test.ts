
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, opdsTable } from '../db/schema';
import { getCurrentUser, createToken } from '../handlers/get_current_user';

describe('getCurrentUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user for valid token', async () => {
    // Create OPD first
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test OPD description'
      })
      .returning()
      .execute();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'staf',
        opd_id: opdResult[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    // Create valid token
    const token = createToken(testUser.id);

    const result = await getCurrentUser(token);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testUser.id);
    expect(result!.username).toEqual('testuser');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.full_name).toEqual('Test User');
    expect(result!.role).toEqual('staf');
    expect(result!.opd_id).toEqual(opdResult[0].id);
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for invalid token', async () => {
    const invalidToken = 'invalid.jwt.token';

    const result = await getCurrentUser(invalidToken);

    expect(result).toBeNull();
  });

  it('should return null for token with non-existent user', async () => {
    // Create token with non-existent user ID
    const token = createToken(99999);

    const result = await getCurrentUser(token);

    expect(result).toBeNull();
  });

  it('should return null for malformed token', async () => {
    // Create malformed token (not 3 parts)
    const token = 'malformed.token';

    const result = await getCurrentUser(token);

    expect(result).toBeNull();
  });

  it('should return null for expired token', async () => {
    // Create expired token
    const token = createToken(1, '-1h');

    const result = await getCurrentUser(token);

    expect(result).toBeNull();
  });

  it('should handle admin user without opd_id', async () => {
    // Create admin user without OPD
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'admin',
        opd_id: null,
        is_active: true
      })
      .returning()
      .execute();

    const adminUser = userResult[0];
    const token = createToken(adminUser.id);

    const result = await getCurrentUser(token);

    expect(result).not.toBeNull();
    expect(result!.role).toEqual('admin');
    expect(result!.opd_id).toBeNull();
  });

  it('should return null for token with wrong signature', async () => {
    // Create token with manually crafted wrong signature
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ userId: 1 }));
    const wrongSignature = btoa('wrong-signature');
    
    const invalidToken = `${header}.${payload}.${wrongSignature}`;

    const result = await getCurrentUser(invalidToken);

    expect(result).toBeNull();
  });
});
