import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/interface/strategies/jwt.strategy';

/**
 * Extracts the authenticated user's JWT payload from the request.
 *
 * Usage: async someEndpoint(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as JwtPayload;
  },
);
