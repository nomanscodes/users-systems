import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleTypeOrmEntity } from './infrastructure/typeorm/entities/role.typeorm.entity';
import { RolePermissionTypeOrmEntity } from './infrastructure/typeorm/entities/role-permission.typeorm.entity';
import { UserRoleTypeOrmEntity } from './infrastructure/typeorm/entities/user-role.typeorm.entity';
import { PermissionTypeOrmEntity } from '../permissions/infrastructure/typeorm/entities/permission.typeorm.entity';
import { RolesService } from './application/services/roles.service';
import {
  RolesController,
  PermissionsController,
} from './interface/http/roles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleTypeOrmEntity,
      RolePermissionTypeOrmEntity,
      UserRoleTypeOrmEntity,
      PermissionTypeOrmEntity,
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
