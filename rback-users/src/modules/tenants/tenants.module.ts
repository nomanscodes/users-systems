import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantTypeOrmEntity } from './infrastructure/typeorm/tenant.typeorm.entity';
import { UserTypeOrmEntity } from '../users/infrastructure/typeorm/user.typeorm.entity';

import { TENANT_REPOSITORY_PORT } from './application/di-tokens';
import { TenantTypeOrmRepository } from './infrastructure/typeorm/tenant.typeorm.repository';

import { RegisterTenantUseCase } from './application/use-cases/register-tenant.use-case';
import { FindAllTenantsQuery } from './application/use-cases/find-all-tenants.query';
import { FindTenantByIdQuery } from './application/use-cases/find-tenant-by-id.query';
import { UpdateTenantStatusUseCase } from './application/use-cases/update-tenant-status.use-case';
import { UpdateTenantUseCase } from './application/use-cases/update-tenant.use-case';

import { TenantController } from './interface/http/tenant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TenantTypeOrmEntity, UserTypeOrmEntity])],
  controllers: [TenantController],
  providers: [
    // ── Repository binding (port → implementation) ──
    {
      provide: TENANT_REPOSITORY_PORT,
      useClass: TenantTypeOrmRepository,
    },
    TenantTypeOrmRepository,

    // ── Use-cases & Queries ──
    RegisterTenantUseCase,
    FindAllTenantsQuery,
    FindTenantByIdQuery,
    UpdateTenantStatusUseCase,
    UpdateTenantUseCase,
  ],
  exports: [FindTenantByIdQuery],
})
export class TenantsModule {}
