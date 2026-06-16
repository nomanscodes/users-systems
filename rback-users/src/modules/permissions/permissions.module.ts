import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionTypeOrmEntity } from './infrastructure/typeorm/entities/permission.typeorm.entity';
import { PermissionsSeederService } from './application/services/permissions-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionTypeOrmEntity])],
  providers: [PermissionsSeederService],
  exports: [TypeOrmModule],
})
export class PermissionsModule {}
