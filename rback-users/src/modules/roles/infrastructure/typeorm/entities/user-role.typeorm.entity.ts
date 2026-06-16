import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';
import { RoleTypeOrmEntity } from './role.typeorm.entity';
import { UserTypeOrmEntity } from '../../../../users/infrastructure/typeorm/user.typeorm.entity';

@Entity('user_roles')
export class UserRoleTypeOrmEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  roleId: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => UserTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserTypeOrmEntity;

  @ManyToOne(() => RoleTypeOrmEntity, (role) => role.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: RoleTypeOrmEntity;
}
