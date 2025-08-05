
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, opdsTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users with complete user data', async () => {
    // Create test OPD first
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Test OPD',
        code: 'TEST001',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const testOpd = opdResult[0];

    // Create test users
    const testPasswordHash = 'hashed_password_123';
    
    await db.insert(usersTable)
      .values([
        {
          username: 'admin_user',
          email: 'admin@test.com',
          password_hash: testPasswordHash,
          full_name: 'Admin User',
          role: 'admin',
          opd_id: null, // Admin user without OPD
          is_active: true
        },
        {
          username: 'staff_user',
          email: 'staff@test.com',
          password_hash: testPasswordHash,
          full_name: 'Staff User',
          role: 'staf',
          opd_id: testOpd.id,
          is_active: true
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);

    // Verify admin user
    const adminUser = result.find(u => u.role === 'admin');
    expect(adminUser).toBeDefined();
    expect(adminUser!.username).toEqual('admin_user');
    expect(adminUser!.email).toEqual('admin@test.com');
    expect(adminUser!.full_name).toEqual('Admin User');
    expect(adminUser!.opd_id).toBeNull();
    expect(adminUser!.is_active).toBe(true);
    expect(adminUser!.id).toBeDefined();
    expect(adminUser!.created_at).toBeInstanceOf(Date);
    expect(adminUser!.updated_at).toBeInstanceOf(Date);

    // Verify staff user
    const staffUser = result.find(u => u.role === 'staf');
    expect(staffUser).toBeDefined();
    expect(staffUser!.username).toEqual('staff_user');
    expect(staffUser!.email).toEqual('staff@test.com');
    expect(staffUser!.full_name).toEqual('Staff User');
    expect(staffUser!.opd_id).toEqual(testOpd.id);
    expect(staffUser!.is_active).toBe(true);
  });

  it('should return users with different roles and activity status', async () => {
    const testPasswordHash = 'hashed_password_456';

    // Create users with different roles and active status
    await db.insert(usersTable)
      .values([
        {
          username: 'pengelola_user',
          email: 'pengelola@test.com',
          password_hash: testPasswordHash,
          full_name: 'Pengelola User',
          role: 'pengelola',
          opd_id: null,
          is_active: false // Inactive user
        },
        {
          username: 'active_staff',
          email: 'active@test.com',
          password_hash: testPasswordHash,
          full_name: 'Active Staff',
          role: 'staf',
          opd_id: null,
          is_active: true
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);

    // Verify inactive pengelola user is included
    const pengelolaUser = result.find(u => u.role === 'pengelola');
    expect(pengelolaUser).toBeDefined();
    expect(pengelolaUser!.is_active).toBe(false);

    // Verify active staff user
    const activeStaff = result.find(u => u.role === 'staf');
    expect(activeStaff).toBeDefined();
    expect(activeStaff!.is_active).toBe(true);
  });

  it('should handle users with and without OPD associations', async () => {
    // Create OPD
    const opdResult = await db.insert(opdsTable)
      .values({
        name: 'Another OPD',
        code: 'TEST002',
        description: 'Another test organization'
      })
      .returning()
      .execute();

    const testOpd = opdResult[0];
    const testPasswordHash = 'hashed_password_789';

    // Create users - some with OPD, some without
    await db.insert(usersTable)
      .values([
        {
          username: 'user_with_opd',
          email: 'withopd@test.com',
          password_hash: testPasswordHash,
          full_name: 'User With OPD',
          role: 'staf',
          opd_id: testOpd.id,
          is_active: true
        },
        {
          username: 'user_without_opd',
          email: 'withoutopd@test.com',
          password_hash: testPasswordHash,
          full_name: 'User Without OPD',
          role: 'admin',
          opd_id: null,
          is_active: true
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);

    const userWithOpd = result.find(u => u.username === 'user_with_opd');
    const userWithoutOpd = result.find(u => u.username === 'user_without_opd');

    expect(userWithOpd!.opd_id).toEqual(testOpd.id);
    expect(userWithoutOpd!.opd_id).toBeNull();
  });
});
