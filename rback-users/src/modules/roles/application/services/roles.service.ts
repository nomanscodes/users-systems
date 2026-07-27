import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleTypeOrmEntity } from '../../infrastructure/typeorm/entities/role.typeorm.entity';
import { MenuPermissionTypeOrmEntity } from '../../../permissions/infrastructure/typeorm/entities/menu-permission.typeorm.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignMenuPermissionDto,
} from '../../interface/dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleTypeOrmEntity)
    private readonly roleRepo: Repository<RoleTypeOrmEntity>,
    @InjectRepository(MenuPermissionTypeOrmEntity)
    private readonly menuPermissionRepo: Repository<MenuPermissionTypeOrmEntity>,
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
      relations: { menuPermissions: { menu: true } },
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

  async assignMenuPermission(
    tenantId: string,
    roleId: string,
    dto: AssignMenuPermissionDto,
  ) {
    const role = await this.getRole(tenantId, roleId);

    let permission = await this.menuPermissionRepo.findOne({
      where: { roleId: role.id, menuId: dto.menuId },
    });

    if (permission) {
      permission.canView = dto.canView;
      permission.canCreate = dto.canCreate;
      permission.canEdit = dto.canEdit;
      permission.canDelete = dto.canDelete;
    } else {
      permission = this.menuPermissionRepo.create({
        roleId: role.id,
        menuId: dto.menuId,
        canView: dto.canView,
        canCreate: dto.canCreate,
        canEdit: dto.canEdit,
        canDelete: dto.canDelete,
      });
    }

    await this.menuPermissionRepo.save(permission);
    return this.getRole(tenantId, roleId);
  }

  async removeMenuPermission(tenantId: string, roleId: string, menuId: string) {
    const role = await this.getRole(tenantId, roleId);
    await this.menuPermissionRepo.delete({ roleId: role.id, menuId });
  }
}
