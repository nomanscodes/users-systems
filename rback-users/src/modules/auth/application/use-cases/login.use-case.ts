import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';
import { TenantTypeOrmEntity } from '../../../tenants/infrastructure/typeorm/tenant.typeorm.entity';
import { RefreshTokenRepository } from '../../infrastructure/typeorm/refresh-token.repository';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserSuspendedError } from '../../domain/errors/user-suspended.error';
import { TenantSuspendedError } from '../../domain/errors/tenant-suspended.error';
import { UserStatus } from '../../../../common/enums/user-status.enum';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';
import { UserType } from '../../../../common/enums/user-type.enum';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    tenantId: string | null;
    tenantStatus: TenantStatus | null;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
    @InjectRepository(TenantTypeOrmEntity)
    private readonly tenantRepo: Repository<TenantTypeOrmEntity>,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    // ─── 1. Find user by email ───
    const user = await this.userRepo.findOneBy({ email: input.email });
    if (!user) throw new InvalidCredentialsError();

    // ─── 2. Verify password ───
    const passwordMatch = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatch) throw new InvalidCredentialsError();

    // ─── 3. Check user status ───
    if (user.status !== UserStatus.ACTIVE) throw new UserSuspendedError();

    // ─── 4. Check tenant status (skip for SUPER_ADMIN) ───
    let tenantStatus: TenantStatus | null = null;
    if (user.tenantId) {
      const tenant = await this.tenantRepo.findOneBy({ id: user.tenantId });
      if (tenant) {
        tenantStatus = tenant.status;
        if (tenant.status === TenantStatus.SUSPENDED)
          throw new TenantSuspendedError();
      }
    }

    // ─── 4.5 Fetch User Roles ───
    let roleNames: string[] = [];
    if (user.userType === UserType.STAFF) {
      const query = `
        SELECT r.name 
        FROM user_roles ur
        JOIN roles r ON ur.roleId = r.id
        WHERE ur.userId = ?
      `;

      const roles = await this.userRepo.query(query, [user.id]);

      roleNames = roles.map((r: any) => r.name);
    }

    // ─── 5. Sign Access Token ───
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: user.tenantId ?? null,
      tokenVersion: user.tokenVersion,
      roleNames,
    });

    // ─── 6. Sign and store Refresh Token ───
    const rawRefreshToken = uuidv4() + '.' + uuidv4(); // opaque random token
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    const tokenHash = await bcrypt.hash(rawRefreshToken, +saltRounds);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days default

    await this.refreshTokenRepo.create({
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        tenantId: user.tenantId ?? null,
        tenantStatus,
      },
    };
  }
}
