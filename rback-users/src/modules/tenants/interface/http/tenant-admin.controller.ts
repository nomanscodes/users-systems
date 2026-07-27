import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { MenuService } from '../../../permissions/application/services/menu.service';
import { success } from '../../../../common/response/api-response';

@Controller('tenant-admin')
@UseGuards(JwtAuthGuard, TenantScopeGuard)
export class TenantAdminController {
  constructor(private readonly menuService: MenuService) {}

  @Get('menus')
  async getTenantMenus(@CurrentUser() user: JwtPayload) {
    const menus = await this.menuService.getMenusForTenantAdmin(user.tenantId);
    return success(menus);
  }
}
