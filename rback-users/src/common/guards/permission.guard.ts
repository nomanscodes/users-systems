import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import {
  ACTION_KEY,
  ActionRequirements,
} from '../decorators/require-action.decorator';
import { UserType } from '../enums/user-type.enum';
import type { JwtPayload } from '../../modules/auth/interface/strategies/jwt.strategy';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAction = this.reflector.getAllAndOverride<ActionRequirements>(
      ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAction) {
      return true; // Route does not require any specific action
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    // 1. SUPER_ADMIN has unrestricted access
    if (user.userType === UserType.SUPER_ADMIN) {
      return true;
    }

    // 2. SCHOOL_ADMIN has unrestricted access within their tenant (assuming tenant-menus check is done elsewhere or we should do it here)
    if (user.userType === UserType.SCHOOL_ADMIN) {
      // Still need to verify if the menu is assigned to the tenant
      const hasTenantMenu = await this.checkTenantMenuAccess(
        user.tenantId,
        requiredAction.path,
      );
      if (!hasTenantMenu) {
        throw new ForbiddenException(
          `Module ${requiredAction.path} is not enabled for this tenant`,
        );
      }
      return true;
    }

    // 3. Query the database to verify permission chain
    const hasPermission = await this.checkUserPermission(
      user.sub, // JWT uses `sub` not `id`
      user.tenantId,
      requiredAction.path,
      requiredAction.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${requiredAction.action} on ${requiredAction.path}`,
      );
    }

    return true;
  }

  private async checkTenantMenuAccess(
    tenantId: string,
    path: string,
  ): Promise<boolean> {
    const query = `
      SELECT 1
      FROM tenant_menus tm
      JOIN menus m ON tm.menuId = m.id
      WHERE tm.tenantId = ? AND m.path = ?
      LIMIT 1
    `;
    const result = await this.dataSource.query(query, [tenantId, path]);
    return result.length > 0;
  }

  private async checkUserPermission(
    userId: string,
    tenantId: string,
    path: string,
    action: string,
  ): Promise<boolean> {
    // Validating action to prevent SQL Injection
    const validActions = ['canView', 'canCreate', 'canEdit', 'canDelete'];
    const safeAction = validActions.includes(action) ? action : 'canView';

    const query = `
      SELECT 1
      FROM tenant_menus tm
      JOIN menus m ON tm.menuId = m.id
      JOIN menu_permissions mp ON m.id = mp.menuId
      JOIN user_roles ur ON mp.roleId = ur.roleId
      WHERE ur.userId = ?
        AND tm.tenantId = ?
        AND m.path = ?
        AND mp.${safeAction} = 1
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [userId, tenantId, path]);

    return result.length > 0;
  }
}
