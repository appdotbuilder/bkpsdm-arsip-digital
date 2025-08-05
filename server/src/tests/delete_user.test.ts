
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, opdsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

const testOPDInput = {
  name: 'Test OPD',
  code: 'TEST001',
  description: 'Test OPD for testing'
};

const testUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  role: 'staf' as const,
  is_active: true
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a user by setting is_active to false', async () => {
    // Create OPD first
    const opdResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserInput,
        opd_id: opdResult[0].id
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input: IdParam = { id: userId };

    // Delete user
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user still exists but is inactive
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].is_active).toBe(false);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
  });

  it('should update the updated_at timestamp', async () => {
    // Create OPD first
    const opdResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserInput,
        opd_id: opdResult[0].id
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const originalUpdatedAt = userResult[0].updated_at;
    const input: IdParam = { id: userId };

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Delete user
    await deleteUser(input);

    // Check updated_at was modified
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when user does not exist', async () => {
    const input: IdParam = { id: 99999 };

    await expect(deleteUser(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should handle admin user deletion', async () => {
    // Create admin user (no OPD required)
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserInput,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        opd_id: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input: IdParam = { id: userId };

    // Delete admin user
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify admin user is soft deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].is_active).toBe(false);
    expect(users[0].role).toEqual('admin');
    expect(users[0].opd_id).toBeNull();
  });

  it('should soft delete already inactive user', async () => {
    // Create OPD first
    const opdResult = await db.insert(opdsTable)
      .values(testOPDInput)
      .returning()
      .execute();

    // Create inactive user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserInput,
        opd_id: opdResult[0].id,
        is_active: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input: IdParam = { id: userId };

    // Delete already inactive user
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user remains inactive
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].is_active).toBe(false);
  });
});
