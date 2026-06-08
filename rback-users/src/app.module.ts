import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import configService from './database/ormconfig.service';

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
  ],
})
export class AppModule {}
