import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionTypeOrmEntity } from '../../infrastructure/typeorm/entities/permission.typeorm.entity';

@Injectable()
export class PermissionsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsSeederService.name);

  constructor(
    @InjectRepository(PermissionTypeOrmEntity)
    private readonly permissionRepo: Repository<PermissionTypeOrmEntity>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking system permissions...');
    await this.seedPermissions();
  }

  private async seedPermissions() {
    // Only permissions that match real @RequirePermission() decorators in controllers.
    // Do NOT add speculative permissions for modules that don't exist yet.
    const systemPermissions = [
      // ── academics (AcademicsController) ───────────────────────────
      {
        resource: 'academics',
        action: 'read',
        description:
          'Can view academic structure (branches, sessions, classes, groups, sections, subjects, batches, allocations)',
      },
      {
        resource: 'academics',
        action: 'write',
        description: 'Can create, update, and delete academic structure',
      },

      // ── staff (StaffController + DesignationsController) ─────────
      {
        resource: 'staff',
        action: 'read',
        description:
          'Can view staff profiles, designations, roles, and assignments',
      },
      {
        resource: 'staff',
        action: 'write',
        description:
          'Can invite staff, update profiles, assign roles, manage designations and teaching assignments',
      },

      // ── roles (RolesController + PermissionsController) ──────────
      {
        resource: 'roles',
        action: 'read',
        description: 'Can view roles and permissions',
      },
      {
        resource: 'roles',
        action: 'write',
        description:
          'Can create, update, and delete roles, and manage role permissions',
      },
    ];

    let insertedCount = 0;
    for (const perm of systemPermissions) {
      const exists = await this.permissionRepo.findOne({
        where: { resource: perm.resource, action: perm.action },
      });

      if (!exists) {
        await this.permissionRepo.save(this.permissionRepo.create(perm));
        insertedCount++;
      }
    }

    if (insertedCount > 0) {
      this.logger.log(`Seeded ${insertedCount} new system permissions.`);
    } else {
      this.logger.log('All system permissions are already seeded.');
    }
  }
}
