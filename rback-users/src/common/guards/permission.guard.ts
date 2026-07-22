import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import {
  PERMISSION_KEY,
  PermissionRequirements,
} from '../decorators/require-permission.decorator';
import { UserType } from '../enums/user-type.enum';
import type { JwtPayload } from '../../modules/auth/interface/strategies/jwt.strategy';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionRequirements>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermission) {
      return true; // Route does not require any specific permission
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    // 1. SCHOOL_ADMIN has unrestricted access within their tenant
    if (user.userType === UserType.SCHOOL_ADMIN) {
      return true;
    }

    // 2. Query the database to verify permission chain
    const hasPermission = await this.checkUserPermission(
      user.sub, // JWT uses `sub` not `id`
      user.tenantId,
      requiredPermission.resource,
      requiredPermission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${requiredPermission.action} on ${requiredPermission.resource}`,
      );
    }

    return true;
  }

  private async checkUserPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const query = `
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.roleId = rp.roleId
      JOIN permissions p ON rp.permissionId = p.id
      WHERE ur.userId = ? AND ur.tenantId = ? AND p.resource = ? AND p.action = ?
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [
      userId,
      tenantId,
      resource,
      action,
    ]);

    return result.length > 0;
  }
}
