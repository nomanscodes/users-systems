import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleTypeOrmEntity } from './infrastructure/typeorm/entities/role.typeorm.entity';
import { UserRoleTypeOrmEntity } from './infrastructure/typeorm/entities/user-role.typeorm.entity';
import { MenuPermissionTypeOrmEntity } from '../permissions/infrastructure/typeorm/entities/menu-permission.typeorm.entity';
import { RolesService } from './application/services/roles.service';
import { RolesController } from './interface/http/roles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleTypeOrmEntity,
      UserRoleTypeOrmEntity,
      MenuPermissionTypeOrmEntity,
    ]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
