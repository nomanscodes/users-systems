import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from '../../application/services/super-admin.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../../common/guards/super-admin.guard';
import { success } from '../../../../common/response/api-response';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('menus')
  async getMenus() {
    const data = await this.superAdminService.getPlatformMenus();
    return success(data);
  }

  @Post('menus')
  async createMenu(@Body() dto: any) {
    const data = await this.superAdminService.createPlatformMenu(dto);
    return success(data);
  }

  // Tenant Menus
  @Get('tenant-menus/:tenantId')
  async getTenantMenus(@Param('tenantId') tenantId: string) {
    const data = await this.superAdminService.getTenantMenus(tenantId);
    return success(data);
  }

  @Post('tenant-menus/:tenantId')
  async assignTenantMenu(
    @Param('tenantId') tenantId: string,
    @Body('menuId') menuId: string,
  ) {
    const data = await this.superAdminService.assignTenantMenu(
      tenantId,
      menuId,
    );
    return success(data);
  }

  @Delete('tenant-menus/:tenantId/:menuId')
  async unassignTenantMenu(
    @Param('tenantId') tenantId: string,
    @Param('menuId') menuId: string,
  ) {
    const data = await this.superAdminService.unassignTenantMenu(
      tenantId,
      menuId,
    );
    return success(data);
  }

  // Student Menus
  @Get('student-menus/:tenantId')
  async getStudentMenus(@Param('tenantId') tenantId: string) {
    const data = await this.superAdminService.getStudentMenus(tenantId);
    return success(data);
  }

  @Post('student-menus/:tenantId')
  async assignStudentMenu(
    @Param('tenantId') tenantId: string,
    @Body('menuId') menuId: string,
  ) {
    const data = await this.superAdminService.assignStudentMenu(
      tenantId,
      menuId,
    );
    return success(data);
  }

  @Delete('student-menus/:tenantId/:menuId')
  async unassignStudentMenu(
    @Param('tenantId') tenantId: string,
    @Param('menuId') menuId: string,
  ) {
    const data = await this.superAdminService.unassignStudentMenu(
      tenantId,
      menuId,
    );
    return success(data);
  }

  // Parent Menus
  @Get('parent-menus/:tenantId')
  async getParentMenus(@Param('tenantId') tenantId: string) {
    const data = await this.superAdminService.getParentMenus(tenantId);
    return success(data);
  }

  @Post('parent-menus/:tenantId')
  async assignParentMenu(
    @Param('tenantId') tenantId: string,
    @Body('menuId') menuId: string,
  ) {
    const data = await this.superAdminService.assignParentMenu(
      tenantId,
      menuId,
    );
    return success(data);
  }

  @Delete('parent-menus/:tenantId/:menuId')
  async unassignParentMenu(
    @Param('tenantId') tenantId: string,
    @Param('menuId') menuId: string,
  ) {
    const data = await this.superAdminService.unassignParentMenu(
      tenantId,
      menuId,
    );
    return success(data);
  }
}
