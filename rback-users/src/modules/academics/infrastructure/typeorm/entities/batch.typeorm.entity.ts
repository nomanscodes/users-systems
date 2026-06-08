import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BranchTypeOrmEntity } from './branch.typeorm.entity';
import { AcademicSessionTypeOrmEntity } from './academic-session.typeorm.entity';
import { ClassTypeOrmEntity } from './class.typeorm.entity';
import { GroupTypeOrmEntity } from './group.typeorm.entity';
import { SectionTypeOrmEntity } from './section.typeorm.entity';

@Entity('batches')
@Index(
  'idx_tenant_batch_unique',
  ['tenantId', 'branchId', 'sessionId', 'classId', 'groupId', 'sectionId'],
  { unique: true },
)
export class BatchTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  // Branch Relation
  @Column({ type: 'varchar', length: 36 })
  branchId: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'branchId' })
  branch: BranchTypeOrmEntity;

  // Session Relation
  @Column({ type: 'varchar', length: 36 })
  sessionId: string;

  @ManyToOne(() => AcademicSessionTypeOrmEntity)
  @JoinColumn({ name: 'sessionId' })
  session: AcademicSessionTypeOrmEntity;

  // Class Relation
  @Column({ type: 'varchar', length: 36 })
  classId: string;

  @ManyToOne(() => ClassTypeOrmEntity)
  @JoinColumn({ name: 'classId' })
  classEntity: ClassTypeOrmEntity;

  // Group Relation (Optional, as some lower classes might not have groups)
  @Column({ type: 'varchar', length: 36, nullable: true })
  groupId: string | null;

  @ManyToOne(() => GroupTypeOrmEntity, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: GroupTypeOrmEntity | null;

  // Section Relation
  @Column({ type: 'varchar', length: 36 })
  sectionId: string;

  @ManyToOne(() => SectionTypeOrmEntity)
  @JoinColumn({ name: 'sectionId' })
  section: SectionTypeOrmEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
