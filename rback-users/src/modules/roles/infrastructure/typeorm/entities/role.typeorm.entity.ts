import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { MenuPermissionTypeOrmEntity } from '../../../../permissions/infrastructure/typeorm/entities/menu-permission.typeorm.entity';
import { UserRoleTypeOrmEntity } from './user-role.typeorm.entity';

@Entity('roles')
@Index('uq_tenant_role_name', ['tenantId', 'name'], { unique: true })
export class RoleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSystemRole: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MenuPermissionTypeOrmEntity, (mp) => mp.roleId)
  menuPermissions: MenuPermissionTypeOrmEntity[];

  @OneToMany(() => UserRoleTypeOrmEntity, (ur) => ur.role)
  userRoles: UserRoleTypeOrmEntity[];
}
