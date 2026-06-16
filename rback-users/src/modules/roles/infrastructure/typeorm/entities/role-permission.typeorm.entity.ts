import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { RoleTypeOrmEntity } from './role.typeorm.entity';
import { PermissionTypeOrmEntity } from '../../../../permissions/infrastructure/typeorm/entities/permission.typeorm.entity';

@Entity('role_permissions')
export class RolePermissionTypeOrmEntity {
  @PrimaryColumn('uuid')
  roleId: string;

  @PrimaryColumn('uuid')
  permissionId: string;

  @ManyToOne(() => RoleTypeOrmEntity, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: RoleTypeOrmEntity;

  @ManyToOne(() => PermissionTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: PermissionTypeOrmEntity;
}
