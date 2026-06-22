import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DesignationCategory } from '../../../../../common/enums/designation-category.enum';

@Entity('designations')
@Index('idx_tenant_designation', ['tenantId'])
@Index('uq_tenant_designation_title', ['tenantId', 'title'], { unique: true })
export class DesignationTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({
    type: 'enum',
    enum: DesignationCategory,
    default: DesignationCategory.NON_TEACHING,
  })
  category: DesignationCategory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
