import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

import { StaffProfileTypeOrmEntity } from '../../infrastructure/typeorm/entities/staff-profile.typeorm.entity';
import { TeacherAssignmentTypeOrmEntity } from '../../infrastructure/typeorm/entities/teacher-assignment.typeorm.entity';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';
import { RoleTypeOrmEntity } from '../../../roles/infrastructure/typeorm/entities/role.typeorm.entity';
import { UserRoleTypeOrmEntity } from '../../../roles/infrastructure/typeorm/entities/user-role.typeorm.entity';
import { DesignationTypeOrmEntity } from '../../../designations/infrastructure/typeorm/entities/designation.typeorm.entity';
import { BatchTypeOrmEntity } from '../../../academics/infrastructure/typeorm/entities/batch.typeorm.entity';
import { SubjectTypeOrmEntity } from '../../../academics/infrastructure/typeorm/entities/subject.typeorm.entity';

import {
  InviteStaffDto,
  AssignTeacherDto,
  UpdateStaffProfileDto,
  AssignStaffRoleDto,
} from '../../interface/dto/staff-request.dto';
import { UserType } from '../../../../common/enums/user-type.enum';
import { UserStatus } from '../../../../common/enums/user-status.enum';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffProfileTypeOrmEntity)
    private readonly staffRepo: Repository<StaffProfileTypeOrmEntity>,
    @InjectRepository(TeacherAssignmentTypeOrmEntity)
    private readonly assignmentRepo: Repository<TeacherAssignmentTypeOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private generateTempPassword(): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + 'A1!';
  }

  async inviteStaff(tenantId: string, createdBy: string, dto: InviteStaffDto) {
    const existingUser = await this.dataSource
      .getRepository(UserTypeOrmEntity)
      .findOne({ where: { email: dto.email } });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    const designation = await this.dataSource
      .getRepository(DesignationTypeOrmEntity)
      .findOne({ where: { id: dto.designationId, tenantId } });

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    if (dto.roleIds.length > 0) {
      const rolesCount = await this.dataSource
        .getRepository(RoleTypeOrmEntity)
        .count({ where: { id: In(dto.roleIds), tenantId } });

      if (rolesCount !== dto.roleIds.length) {
        throw new NotFoundException(
          'One or more roles not found in this tenant',
        );
      }
    }

    const tempPassword = this.generateTempPassword();
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(tempPassword, +saltRounds);

    const userId = uuidv4();
    const staffProfileId = uuidv4();
    const now = new Date();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.insert(UserTypeOrmEntity, {
        id: userId,
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,
        userType: UserType.STAFF,
        status: UserStatus.ACTIVE,
        createdBy,
        createdAt: now,
        updatedAt: now,
      });

      await queryRunner.manager.insert(StaffProfileTypeOrmEntity, {
        id: staffProfileId,
        userId,
        tenantId,
        designationId: dto.designationId,
        department: dto.department ?? null,
        createdAt: now,
        updatedAt: now,
      });

      if (dto.roleIds.length > 0) {
        const userRoles = dto.roleIds.map((roleId) => ({
          userId,
          roleId,
          tenantId,
          assignedAt: now,
        }));
        await queryRunner.manager.insert(UserRoleTypeOrmEntity, userRoles);
      }

      await queryRunner.commitTransaction();

      return {
        userId,
        staffProfileId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        temporaryPassword: tempPassword,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenantId: string) {
    return this.staffRepo.find({
      where: { tenantId },
      relations: { user: true, designation: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    const staff = await this.staffRepo.findOne({
      where: { id, tenantId },
      relations: {
        user: true,
        designation: true,
        assignments: {
          batch: {
            classEntity: true,
            group: true,
            section: true,
            session: true,
          },
          subject: true,
        },
      },
    });
    if (!staff) throw new NotFoundException('Staff profile not found');
    return staff;
  }

  async update(tenantId: string, id: string, dto: UpdateStaffProfileDto) {
    const staff = await this.findOne(tenantId, id);
    if (dto.designationId) {
      const designation = await this.dataSource
        .getRepository(DesignationTypeOrmEntity)
        .findOne({ where: { id: dto.designationId, tenantId } });
      if (!designation) throw new NotFoundException('Designation not found');
    }
    Object.assign(staff, dto);
    return this.staffRepo.save(staff);
  }

  async assignTeacher(
    tenantId: string,
    staffProfileId: string,
    dto: AssignTeacherDto,
  ) {
    const staff = await this.findOne(tenantId, staffProfileId);

    if (staff.designation.category !== 'TEACHING') {
      throw new ConflictException(
        'Staff member must have a TEACHING designation to be assigned to a batch',
      );
    }

    const batch = await this.dataSource
      .getRepository(BatchTypeOrmEntity)
      .findOne({ where: { id: dto.batchId, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');

    const subject = await this.dataSource
      .getRepository(SubjectTypeOrmEntity)
      .findOne({ where: { id: dto.subjectId, tenantId } });
    if (!subject) throw new NotFoundException('Subject not found');

    const existing = await this.assignmentRepo.findOne({
      where: { staffProfileId, batchId: dto.batchId, subjectId: dto.subjectId },
    });
    if (existing) throw new ConflictException('Assignment already exists');

    const assignment = this.assignmentRepo.create({
      tenantId,
      staffProfileId,
      batchId: dto.batchId,
      subjectId: dto.subjectId,
      sessionId: batch.sessionId,
    });

    return this.assignmentRepo.save(assignment);
  }

  async getTeachersByBatch(tenantId: string, batchId: string) {
    return this.assignmentRepo.find({
      where: { batchId, tenantId },
      relations: {
        staffProfile: {
          user: true,
        },
        subject: true,
      },
    });
  }

  async deactivate(tenantId: string, id: string) {
    const staff = await this.findOne(tenantId, id);
    const user = await this.dataSource
      .getRepository(UserTypeOrmEntity)
      .findOne({ where: { id: staff.userId } });
    if (user) {
      user.status = UserStatus.INACTIVE;
      await this.dataSource.getRepository(UserTypeOrmEntity).save(user);
    }
    return true;
  }

  async getAssignments(tenantId: string, staffProfileId: string) {
    return this.assignmentRepo.find({
      where: { staffProfileId, tenantId },
      relations: {
        batch: {
          classEntity: true,
          group: true,
          section: true,
          session: true,
        },
        subject: true,
      },
    });
  }

  async removeAssignment(
    tenantId: string,
    staffProfileId: string,
    assignmentId: string,
  ) {
    const existing = await this.assignmentRepo.findOne({
      where: { id: assignmentId, staffProfileId, tenantId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.assignmentRepo.delete(assignmentId);
    return true;
  }

  // ─── Staff → Roles ─────────────────────────────────────────────────────────

  async getStaffRoles(tenantId: string, staffProfileId: string) {
    const staff = await this.findOne(tenantId, staffProfileId);
    return this.dataSource
      .getRepository(UserRoleTypeOrmEntity)
      .find({
        where: { userId: staff.userId, tenantId },
        relations: { role: true },
      });
  }

  async assignStaffRole(
    tenantId: string,
    staffProfileId: string,
    dto: AssignStaffRoleDto,
  ) {
    const staff = await this.findOne(tenantId, staffProfileId);

    // Validate all role IDs exist in this tenant
    const rolesCount = await this.dataSource
      .getRepository(RoleTypeOrmEntity)
      .count({ where: { id: In(dto.roleIds), tenantId } });

    if (rolesCount !== dto.roleIds.length) {
      throw new NotFoundException(
        'One or more roles not found in this tenant',
      );
    }

    // Filter out already-assigned roles to avoid duplicate key errors
    const existing = await this.dataSource
      .getRepository(UserRoleTypeOrmEntity)
      .find({
        where: { userId: staff.userId, tenantId },
        select: { roleId: true },
      });
    const existingRoleIds = new Set(existing.map((ur) => ur.roleId));
    const newRoleIds = dto.roleIds.filter((id) => !existingRoleIds.has(id));

    if (newRoleIds.length === 0) {
      return { message: 'All specified roles are already assigned' };
    }

    const now = new Date();
    const userRoles = newRoleIds.map((roleId) => ({
      userId: staff.userId,
      roleId,
      tenantId,
      assignedAt: now,
    }));
    await this.dataSource.getRepository(UserRoleTypeOrmEntity).insert(userRoles);

    return { message: 'Role(s) assigned successfully' };
  }

  async removeStaffRole(
    tenantId: string,
    staffProfileId: string,
    roleId: string,
  ) {
    const staff = await this.findOne(tenantId, staffProfileId);

    const existing = await this.dataSource
      .getRepository(UserRoleTypeOrmEntity)
      .findOne({
        where: { userId: staff.userId, roleId, tenantId },
      });

    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.dataSource
      .getRepository(UserRoleTypeOrmEntity)
      .delete({ userId: staff.userId, roleId, tenantId });

    return true;
  }
}
