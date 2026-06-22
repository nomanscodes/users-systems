import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { TENANT_REPOSITORY_PORT } from '../di-tokens';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';
import { UserType } from '../../../../common/enums/user-type.enum';
import { UserStatus } from '../../../../common/enums/user-status.enum';
import { TenantEmailAlreadyExistsError } from '../../domain/errors/tenant-email-exists.error';
import { AdminEmailAlreadyExistsError } from '../../domain/errors/admin-email-exists.error';
import { TenantMapper } from '../mappers/tenant.mapper';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';
import type { TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';

export interface RegisterTenantInput {
  schoolName: string;
  schoolEmail: string;
  schoolPhone?: string | null;
  address?: string | null;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string | null;
}

@Injectable()
export class RegisterTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY_PORT)
    private readonly tenantRepo: TenantRepositoryPort,
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'tenant';
    let counter = 1;

    while (await this.tenantRepo.findBySlug(slug)) {
      slug = `${baseSlug || 'tenant'}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * @param input       - School and admin details from the request DTO
   * @param createdBy   - null for self-registration; Super Admin user ID when admin creates
   * @param initialStatus - only Super Admin can set this; self-registration always gets TRIAL
   */
  async execute(
    input: RegisterTenantInput,
    createdBy: string | null,
    initialStatus?: TenantStatus,
  ) {
    // ─── 1. Uniqueness checks ───

    const existingByEmail = await this.tenantRepo.findByEmail(
      input.schoolEmail,
    );
    if (existingByEmail)
      throw new TenantEmailAlreadyExistsError(input.schoolEmail);

    const existingUser = await this.dataSource
      .getRepository(UserTypeOrmEntity)
      .findOneBy({ email: input.adminEmail });
    if (existingUser) throw new AdminEmailAlreadyExistsError(input.adminEmail);

    // ─── 2. Hash admin password & Generate Slug ───
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(input.adminPassword, +saltRounds);
    const generatedSlug = await this.generateUniqueSlug(input.schoolName);

    // ─── 3. Atomic transaction: create tenant + school admin ───
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenantId = uuidv4();
      const now = new Date();

      // Self-registration always gets TRIAL; Super Admin can override
      const status = initialStatus ?? TenantStatus.TRIAL;

      // Insert tenant
      await queryRunner.manager.insert('tenants', {
        id: tenantId,
        name: input.schoolName,
        slug: generatedSlug,
        email: input.schoolEmail,
        phone: input.schoolPhone ?? null,
        address: input.address ?? null,
        status,
        createdBy: createdBy ?? null,
        createdAt: now,
        updatedAt: now,
      });

      // Insert school admin — user_type is hardcoded here, NEVER from request input
      const adminId = uuidv4();
      await queryRunner.manager.insert('users', {
        id: adminId,
        tenantId: tenantId,
        email: input.adminEmail,
        passwordHash,
        firstName: input.adminFirstName,
        lastName: input.adminLastName,
        phone: input.adminPhone ?? null,
        userType: UserType.SCHOOL_ADMIN, // ← always hardcoded by system
        status: UserStatus.ACTIVE,
        createdBy: createdBy ?? null,
        createdAt: now,
        updatedAt: now,
      });

      await queryRunner.commitTransaction();

      const tenant = new TenantEntity(
        tenantId,
        input.schoolName,
        generatedSlug,
        input.schoolEmail,
        input.schoolPhone ?? null,
        input.address ?? null,
        status,
        createdBy ?? null,
        now,
        now,
      );

      return {
        tenant: TenantMapper.toPlainObject(tenant),
        admin: {
          id: adminId,
          email: input.adminEmail,
          firstName: input.adminFirstName,
          lastName: input.adminLastName,
          userType: UserType.SCHOOL_ADMIN,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
