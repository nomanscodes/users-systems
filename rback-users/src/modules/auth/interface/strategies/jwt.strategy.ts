import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserType } from '../../../../common/enums/user-type.enum';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: UserType;
  tenantId: string | null;
  tokenVersion: number;
  roleNames?: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Called after Passport verifies the JWT signature and expiry.
   * We additionally check tokenVersion to support immediate invalidation.
   * The returned object is attached to request.user.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // tokenVersion check — ensures revoked tokens are immediately rejected
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: { id: true, tokenVersion: true, status: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      // Throw explicitly rather than returning null as any
      throw new UnauthorizedException('Session is invalid or expired.');
    }

    return payload;
  }
}
