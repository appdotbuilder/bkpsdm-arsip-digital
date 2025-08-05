
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, opdsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for admin user (no OPD required)
const testAdminInput: CreateUserInput = {
  username: 'testadmin',
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Test Admin',
  role: 'admin',
  opd_id: null
};

// Test input for staff user (requires OPD)
const testStaffInput: CreateUserInput = {
  username: 'teststaff',
  email: 'staff@test.com',
  password: 'password123',
  full_name: 'Test Staff',
  role: 'staf',
  opd_id: 1
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an admin user', async () => {
    const result = await createUser(testAdminInput);

    // Basic field validation
    expect(result.username).toEqual('testadmin');
    expect(result.email).toEqual('admin@test.com');
    expect(result.full_name).toEqual('Test Admin');
    expect(result.role).toEqual('admin');
    expect(result.opd_id).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20);
  });

  it('should create a staff user with OPD', async () => {
    // Create an OPD first
    await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test OPD Description'
      })
      .execute();

    const result = await createUser(testStaffInput);

    expect(result.username).toEqual('teststaff');
    expect(result.email).toEqual('staff@test.com');
    expect(result.role).toEqual('staf');
    expect(result.opd_id).toEqual(1);
    expect(result.is_active).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testAdminInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testadmin');
    expect(users[0].email).toEqual('admin@test.com');
    expect(users[0].full_name).toEqual('Test Admin');
    expect(users[0].role).toEqual('admin');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createUser(testAdminInput);

    // Password should be hashed
    expect(result.password_hash).not.toEqual('password123');
    
    // Verify password can be verified with Bun's password utility
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testAdminInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      ...testAdminInput,
      email: 'different@test.com'
    };

    expect(createUser(duplicateInput)).rejects.toThrow(/username already exists/i);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testAdminInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      ...testAdminInput,
      username: 'differentuser'
    };

    expect(createUser(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should allow multiple users with different credentials', async () => {
    // Create first user
    const firstUser = await createUser(testAdminInput);

    // Create second user with different credentials
    const secondInput: CreateUserInput = {
      username: 'testuser2',
      email: 'user2@test.com',
      password: 'password456',
      full_name: 'Test User 2',
      role: 'pengelola',
      opd_id: null
    };

    const secondUser = await createUser(secondInput);

    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.username).toEqual('testadmin');
    expect(secondUser.username).toEqual('testuser2');

    // Both should exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});
