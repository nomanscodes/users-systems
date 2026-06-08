import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('subjects')
@Index(['tenantId'])
@Index('idx_tenant_subject_name_unique', ['tenantId', 'name'], { unique: true })
export class SubjectTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g., "Physics"

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null; // e.g., "PHY-101"

  @Column({
    type: 'enum',
    enum: ['MANDATORY', 'OPTIONAL'],
    default: 'MANDATORY',
  })
  type: 'MANDATORY' | 'OPTIONAL';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
