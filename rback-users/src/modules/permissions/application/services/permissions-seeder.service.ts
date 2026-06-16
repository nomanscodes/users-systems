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
    const systemPermissions = [
      {
        resource: 'students',
        action: 'read',
        description: 'Can view student profiles',
      },
      {
        resource: 'students',
        action: 'write',
        description: 'Can create or edit student profiles',
      },
      {
        resource: 'students',
        action: 'delete',
        description: 'Can delete student profiles',
      },
      {
        resource: 'staff',
        action: 'read',
        description: 'Can view staff profiles',
      },
      {
        resource: 'staff',
        action: 'write',
        description: 'Can create or edit staff profiles',
      },
      { resource: 'fees', action: 'read', description: 'Can view fee records' },
      {
        resource: 'fees',
        action: 'write',
        description: 'Can create or collect fees',
      },
      {
        resource: 'fees',
        action: 'delete',
        description: 'Can delete fee records',
      },
      {
        resource: 'attendance',
        action: 'read',
        description: 'Can view attendance records',
      },
      {
        resource: 'attendance',
        action: 'write',
        description: 'Can mark attendance',
      },
      {
        resource: 'exams',
        action: 'read',
        description: 'Can view exam results',
      },
      {
        resource: 'exams',
        action: 'write',
        description: 'Can enter exam marks',
      },
      {
        resource: 'exams',
        action: 'publish',
        description: 'Can publish exam results to parents',
      },
      {
        resource: 'reports',
        action: 'read',
        description: 'Can view academic and financial reports',
      },
      {
        resource: 'reports',
        action: 'export',
        description: 'Can export reports to CSV/PDF',
      },
      {
        resource: 'academics',
        action: 'read',
        description: 'Can view academic structure (batches, subjects)',
      },
      {
        resource: 'academics',
        action: 'write',
        description: 'Can edit academic structure',
      },
      {
        resource: 'academics',
        action: 'delete',
        description: 'Can delete academic structure',
      },
      {
        resource: 'roles',
        action: 'read',
        description: 'Can view roles and permissions',
      },
      {
        resource: 'roles',
        action: 'write',
        description: 'Can create and assign roles',
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
