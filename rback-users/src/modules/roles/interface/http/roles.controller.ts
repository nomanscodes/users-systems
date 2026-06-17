import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from '../../application/services/roles.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from '../dto/role.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';

@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermission('roles', 'write')
  async createRole(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(user.tenantId, dto);
  }

  @Get()
  @RequirePermission('roles', 'read')
  async getRoles(@CurrentUser() user: JwtPayload) {
    return this.rolesService.getRoles(user.tenantId);
  }

  @Get(':id')
  @RequirePermission('roles', 'read')
  async getRole(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rolesService.getRole(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission('roles', 'write')
  async updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('roles', 'write')
  async deleteRole(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.rolesService.deleteRole(user.tenantId, id);
    return { success: true };
  }

  @Post(':id/permissions')
  @RequirePermission('roles', 'write')
  async assignPermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(user.tenantId, id, dto);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermission('roles', 'write')
  async removePermission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('permissionId') permId: string,
  ) {
    await this.rolesService.removePermission(user.tenantId, id, permId);
    return { success: true };
  }
}

@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles', 'read')
  async getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }
}
