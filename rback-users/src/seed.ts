/**
 * CLI Seed Script — Create First Super Admin
 * 
 * Usage:
 *   SUPER_ADMIN_EMAIL=admin@company.com SUPER_ADMIN_PASSWORD=YourSecurePassword npm run seed:superadmin
 * 
 * This script:
 *   1. Creates a user in the `users` table with userType 'SUPER_ADMIN'
 *   2. Skips if email already exists
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserTypeOrmEntity } from './modules/users/infrastructure/typeorm/user.typeorm.entity';
import { UserType } from './common/enums/user-type.enum';
import { UserStatus } from './common/enums/user-status.enum';

async function seed() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@company.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'VeryStrongPassword123!';

  console.log('='.repeat(50));
  console.log('  SUPER ADMIN SEED SCRIPT');
  console.log('='.repeat(50));
  console.log(`  Email: ${email}`);
  console.log('='.repeat(50));

  // Boot NestJS app (without HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userRepo = app.get<Repository<UserTypeOrmEntity>>(getRepositoryToken(UserTypeOrmEntity));

    // Check if email already exists
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      console.log(`  ⚠️  User already exists: ${email}`);
      if (existingUser.userType === UserType.SUPER_ADMIN) {
        console.log('  ✅ User is already a SUPER_ADMIN. Nothing to do.');
      } else {
        // Promote existing user
        existingUser.userType = UserType.SUPER_ADMIN;
        existingUser.tenantId = null;
        await userRepo.save(existingUser);
        console.log(`  ✅ Promoted user ${email} to SUPER_ADMIN and detached from tenant`);
      }
      await app.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('  ✅ Password hashed');

    // Create user in users table
    const user = userRepo.create({
      id: uuidv4(),
      email: email,
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: null,
      userType: UserType.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      tokenVersion: 1,
      tenantId: null, // Super Admins are platform-level
    });

    await userRepo.save(user);
    console.log(`  ✅ Created SUPER_ADMIN user (ID: ${user.id})`);

    console.log('');
    console.log('='.repeat(50));
    console.log('  🎉 SUPER ADMIN CREATED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`  Email:    ${email}`);
    console.log(`  Role:     SUPER_ADMIN`);
    console.log(`  Org:      NULL (platform-level)`);
    console.log('='.repeat(50));
    console.log(`  Login at: POST /api/v1/auth/login`);
    console.log(`  Body:     { "email": "${email}", "password": "****" }`);
    console.log('='.repeat(50));

  } catch (error: any) {
    console.error('  ❌ Seed failed:', error.message || error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
