import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/interface/strategies/jwt.strategy';

/**
 * Ensures the authenticated user belongs to a tenant (tenantId is not null).
 * Must be used AFTER JwtAuthGuard (which populates request.user).
 *
 * Blocks SUPER_ADMIN and any user without a tenantId from calling
 * tenant-scoped endpoints (e.g., all /academics/* routes).
 *
 * Usage: @UseGuards(JwtAuthGuard, TenantScopeGuard)
 */
@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    if (!user?.tenantId) {
      throw new ForbiddenException(
        'Access denied. This endpoint requires a tenant-scoped account. ' +
          'SUPER_ADMIN users must use the admin panel.',
      );
    }

    return true;
  }
}
