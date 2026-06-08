import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { UserTypeOrmEntity } from '../users/infrastructure/typeorm/user.typeorm.entity';
import { TenantTypeOrmEntity } from '../tenants/infrastructure/typeorm/tenant.typeorm.entity';
import { RefreshTokenTypeOrmEntity } from './infrastructure/typeorm/refresh-token.typeorm.entity';

// Infrastructure
import { RefreshTokenRepository } from './infrastructure/typeorm/refresh-token.repository';

// Use-cases
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { MeUseCase } from './application/use-cases/me.use-case';

// Interface
import { JwtStrategy } from './interface/strategies/jwt.strategy';
import { AuthController } from './interface/http/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ) as unknown as number,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserTypeOrmEntity,
      TenantTypeOrmEntity,
      RefreshTokenTypeOrmEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Strategy (must be in auth module — depends on JwtModule)
    JwtStrategy,
    // Infrastructure
    RefreshTokenRepository,
    // Use-cases
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    MeUseCase,
  ],
  exports: [
    // Export JwtStrategy and PassportModule so guards can be used in other modules
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}
