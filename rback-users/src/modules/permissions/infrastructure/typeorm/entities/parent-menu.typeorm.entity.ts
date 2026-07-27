import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MenuTypeOrmEntity } from './menu.typeorm.entity';

@Entity('parent_menus')
@Index('uq_parent_menu', ['tenantId', 'menuId'], { unique: true })
export class ParentMenuTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  menuId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => MenuTypeOrmEntity)
  @JoinColumn({ name: 'menuId' })
  menu: MenuTypeOrmEntity;
}
