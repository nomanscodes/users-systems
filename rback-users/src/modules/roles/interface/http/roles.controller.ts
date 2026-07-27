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
  AssignMenuPermissionDto,
} from '../dto/role.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { RequireAction } from '../../../../common/decorators/require-action.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';

@Controller('roles')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequireAction('roles', 'write')
  async createRole(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(user.tenantId, dto);
  }

  @Get()
  @RequireAction('roles', 'read')
  async getRoles(@CurrentUser() user: JwtPayload) {
    return this.rolesService.getRoles(user.tenantId);
  }

  @Get(':id')
  @RequireAction('roles', 'read')
  async getRole(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rolesService.getRole(user.tenantId, id);
  }

  @Patch(':id')
  @RequireAction('roles', 'write')
  async updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequireAction('roles', 'write')
  async deleteRole(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.rolesService.deleteRole(user.tenantId, id);
    return { success: true };
  }

  @Post(':id/permissions')
  @RequireAction('roles', 'write')
  async assignPermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignMenuPermissionDto,
  ) {
    return this.rolesService.assignMenuPermission(user.tenantId, id, dto);
  }

  @Delete(':id/permissions/:menuId')
  @RequireAction('roles', 'write')
  async removePermission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('menuId') menuId: string,
  ) {
    await this.rolesService.removeMenuPermission(user.tenantId, id, menuId);
    return { success: true };
  }
}

// Deprecated PermissionsController since getAllPermissions is no longer used for the old table
/*
@Controller('permissions')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequireAction('roles', 'read')
  async getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }
}
*/
