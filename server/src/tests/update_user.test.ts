
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'staf',
        opd_id: null,
        is_active: true
      })
      .returning()
      .execute();

    testUserId = result[0].id;
  });

  it('should update user with all fields', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'updateduser',
      email: 'updated@example.com',
      full_name: 'Updated User',
      role: 'pengelola',
      opd_id: 123,
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('updated@example.com');
    expect(result.full_name).toEqual('Updated User');
    expect(result.role).toEqual('pengelola');
    expect(result.opd_id).toEqual(123);
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user with partial fields', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'partialupdate',
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.username).toEqual('partialupdate');
    expect(result.role).toEqual('admin');
    // Original values should remain unchanged
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.is_active).toEqual(true);
  });

  it('should update user in database', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      full_name: 'Database Updated User',
      is_active: false
    };

    await updateUser(updateInput);

    // Verify database update
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].full_name).toEqual('Database Updated User');
    expect(users[0].is_active).toEqual(false);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update opd_id to null', async () => {
    // First set opd_id to a value
    await db.update(usersTable)
      .set({ opd_id: 456 })
      .where(eq(usersTable.id, testUserId))
      .execute();

    const updateInput: UpdateUserInput = {
      id: testUserId,
      opd_id: null
    };

    const result = await updateUser(updateInput);

    expect(result.opd_id).toBeNull();
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    const updateInput: UpdateUserInput = {
      id: testUserId
    };

    const result = await updateUser(updateInput);

    expect(result.username).toEqual(originalUser[0].username);
    expect(result.email).toEqual(originalUser[0].email);
    expect(result.full_name).toEqual(originalUser[0].full_name);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUser[0].updated_at.getTime());
  });
});
