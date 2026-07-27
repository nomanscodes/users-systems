import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import configService from './database/ormconfig.service';

import { AcademicsModule } from './modules/academics/academics.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { DesignationsModule } from './modules/designations/designations.module';
import { StaffModule } from './modules/staff/staff.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';

@Module({
  imports: [
    // ── Global config — reads .env ──
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Database connection via TypeORM ──
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),

    // ── Feature modules ──
    TenantsModule,
    AuthModule,
    AcademicsModule,
    PermissionsModule,
    RolesModule,
    DesignationsModule,
    StaffModule,
    SuperAdminModule,
  ],
})
export class AppModule {}
