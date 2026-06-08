import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/interface/strategies/jwt.strategy';
import { UserType } from '../enums/user-type.enum';

/**
 * Restricts an endpoint to SUPER_ADMIN users only.
 * Must be used AFTER JwtAuthGuard (which populates request.user).
 *
 * Usage: @UseGuards(JwtAuthGuard, SuperAdminGuard)
 *
 * Lives in src/common/guards/ — used by tenant endpoints, system endpoints, etc.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    if (!user || user.userType !== UserType.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Access denied. This endpoint requires Super Admin privileges.',
      );
    }

    return true;
  }
}
