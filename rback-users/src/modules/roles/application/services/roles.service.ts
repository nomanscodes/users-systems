import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleTypeOrmEntity } from '../../infrastructure/typeorm/entities/role.typeorm.entity';
import { RolePermissionTypeOrmEntity } from '../../infrastructure/typeorm/entities/role-permission.typeorm.entity';
import { PermissionTypeOrmEntity } from '../../../permissions/infrastructure/typeorm/entities/permission.typeorm.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from '../../interface/dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleTypeOrmEntity)
    private readonly roleRepo: Repository<RoleTypeOrmEntity>,
    @InjectRepository(RolePermissionTypeOrmEntity)
    private readonly rolePermissionRepo: Repository<RolePermissionTypeOrmEntity>,
    @InjectRepository(PermissionTypeOrmEntity)
    private readonly permissionRepo: Repository<PermissionTypeOrmEntity>,
  ) {}

  async createRole(tenantId: string, dto: CreateRoleDto) {
    const existing = await this.roleRepo.findOne({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(
        `Role with name ${dto.name} already exists`,
      );

    const role = this.roleRepo.create({
      tenantId,
      name: dto.name,
      description: dto.description,
      isSystemRole: false,
    });
    return this.roleRepo.save(role);
  }

  async getRoles(tenantId: string) {
    return this.roleRepo.find({ where: { tenantId } });
  }

  async getRole(tenantId: string, roleId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenantId },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async updateRole(tenantId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.getRole(tenantId, roleId);
    if (role.isSystemRole)
      throw new ForbiddenException(
        'Cannot modify a system role name/description',
      );

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepo.findOne({
        where: { tenantId, name: dto.name },
      });
      if (existing)
        throw new BadRequestException(
          `Role with name ${dto.name} already exists`,
        );
    }

    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await this.getRole(tenantId, roleId);
    if (role.isSystemRole)
      throw new ForbiddenException('Cannot delete a system role');

    // TypeORM handles ON DELETE CASCADE for role_permissions and user_roles
    await this.roleRepo.remove(role);
  }

  async assignPermissions(
    tenantId: string,
    roleId: string,
    dto: AssignPermissionsDto,
  ) {
    const role = await this.getRole(tenantId, roleId);

    // We allow adding permissions to system roles for tenant flexibility,
    // but the system default permissions are seeded.

    const newLinks = dto.permissionIds.map((permId) =>
      this.rolePermissionRepo.create({ roleId: role.id, permissionId: permId }),
    );

    // Using save will throw if unique constraint fails, but since it's a primary composite key
    // we can use upsert or delete-insert. Let's do save with ignore (MySQL IGNORE or try-catch).
    // Or simpler: filter out existing
    const existing = await this.rolePermissionRepo.find({
      where: { roleId: role.id },
    });
    const existingIds = existing.map((e) => e.permissionId);

    const toInsert = newLinks.filter(
      (l) => !existingIds.includes(l.permissionId),
    );
    if (toInsert.length > 0) {
      await this.rolePermissionRepo.save(toInsert);
    }

    return this.getRole(tenantId, roleId);
  }

  async removePermission(
    tenantId: string,
    roleId: string,
    permissionId: string,
  ) {
    const role = await this.getRole(tenantId, roleId);
    await this.rolePermissionRepo.delete({ roleId: role.id, permissionId });
  }

  async getAllPermissions() {
    return this.permissionRepo.find();
  }
}
