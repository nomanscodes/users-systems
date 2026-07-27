import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuTypeOrmEntity } from './infrastructure/typeorm/entities/menu.typeorm.entity';
import { MenuPermissionTypeOrmEntity } from './infrastructure/typeorm/entities/menu-permission.typeorm.entity';
import { TenantMenuTypeOrmEntity } from './infrastructure/typeorm/entities/tenant-menu.typeorm.entity';
import { StudentMenuTypeOrmEntity } from './infrastructure/typeorm/entities/student-menu.typeorm.entity';
import { ParentMenuTypeOrmEntity } from './infrastructure/typeorm/entities/parent-menu.typeorm.entity';
import { MenuService } from './application/services/menu.service';
// import { PermissionsSeederService } from './application/services/permissions-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuTypeOrmEntity,
      MenuPermissionTypeOrmEntity,
      TenantMenuTypeOrmEntity,
      StudentMenuTypeOrmEntity,
      ParentMenuTypeOrmEntity,
    ]),
  ],
  providers: [MenuService /* PermissionsSeederService */],
  exports: [MenuService, TypeOrmModule],
})
export class PermissionsModule {}
