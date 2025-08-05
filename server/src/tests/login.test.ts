
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, opdsTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login with valid credentials', async () => {
    // Create test OPD first
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test OPD for testing'
      })
      .returning()
      .execute();

    // Create test user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'testpassword',
        full_name: 'Test User',
        role: 'staf',
        opd_id: opdResult[0].id,
        is_active: true
      })
      .execute();

    const input: LoginInput = {
      username: 'testuser',
      password: 'testpassword'
    };

    const result = await login(input);

    expect(result).not.toBeNull();
    expect(result!.user.username).toBe('testuser');
    expect(result!.user.email).toBe('test@example.com');
    expect(result!.user.full_name).toBe('Test User');
    expect(result!.user.role).toBe('staf');
    expect(result!.user.is_active).toBe(true);
    expect(result!.token).toBeDefined();
    expect(result!.token).toMatch(/^token_\d+_\d+$/);
  });

  it('should return null for invalid username', async () => {
    const input: LoginInput = {
      username: 'nonexistent',
      password: 'password'
    };

    const result = await login(input);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'correctpassword',
        full_name: 'Test User',
        role: 'admin',
        opd_id: null,
        is_active: true
      })
      .execute();

    const input: LoginInput = {
      username: 'testuser',
      password: 'wrongpassword'
    };

    const result = await login(input);

    expect(result).toBeNull();
  });

  it('should return null for inactive user', async () => {
    // Create test user that is inactive
    await db.insert(usersTable)
      .values({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password_hash: 'password',
        full_name: 'Inactive User',
        role: 'staf',
        opd_id: null,
        is_active: false
      })
      .execute();

    const input: LoginInput = {
      username: 'inactiveuser',
      password: 'password'
    };

    const result = await login(input);

    expect(result).toBeNull();
  });

  it('should work for admin user with null opd_id', async () => {
    // Create admin user with null opd_id
    await db.insert(usersTable)
      .values({
        username: 'adminuser',
        email: 'admin@example.com',
        password_hash: 'adminpass',
        full_name: 'Admin User',
        role: 'admin',
        opd_id: null,
        is_active: true
      })
      .execute();

    const input: LoginInput = {
      username: 'adminuser',
      password: 'adminpass'
    };

    const result = await login(input);

    expect(result).not.toBeNull();
    expect(result!.user.username).toBe('adminuser');
    expect(result!.user.role).toBe('admin');
    expect(result!.user.opd_id).toBeNull();
    expect(result!.token).toBeDefined();
  });
});
