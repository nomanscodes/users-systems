import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MenuTypeOrmEntity } from './menu.typeorm.entity';

@Entity('menu_permissions')
@Index('uq_role_menu', ['roleId', 'menuId'], { unique: true })
export class MenuPermissionTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'uuid' })
  menuId: string;

  @ManyToOne(() => MenuTypeOrmEntity)
  @JoinColumn({ name: 'menuId' })
  menu: MenuTypeOrmEntity;

  @Column({ type: 'boolean', default: false })
  canView: boolean;

  @Column({ type: 'boolean', default: false })
  canCreate: boolean;

  @Column({ type: 'boolean', default: false })
  canEdit: boolean;

  @Column({ type: 'boolean', default: false })
  canDelete: boolean;
}
