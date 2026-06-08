import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects any endpoint by requiring a valid JWT in the Authorization header.
 * After validation, request.user is populated with the JWT payload.
 *
 * Usage: @UseGuards(JwtAuthGuard)
 *
 * Lives in src/common/guards/ — used by ALL modules, not just auth.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        'Access denied. Please provide a valid authentication token.',
      );
    }
    return user;
  }
}
