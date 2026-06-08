import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('classes')
@Index(['tenantId'])
@Index('idx_tenant_class_name_unique', ['tenantId', 'name'], { unique: true })
export class ClassTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g., "Class 10"

  @Column({ type: 'int' })
  numericValue: number; // e.g., 10 (Useful for promotion logic)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
