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
import { ClassTypeOrmEntity } from './class.typeorm.entity';
import { GroupTypeOrmEntity } from './group.typeorm.entity';
import { SubjectTypeOrmEntity } from './subject.typeorm.entity';

@Entity('subject_allocations')
@Index(
  'idx_tenant_subject_allocation_unique',
  ['tenantId', 'classId', 'groupId', 'subjectId'],
  { unique: true },
)
export class SubjectAllocationTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  // Class Relation
  @Column({ type: 'varchar', length: 36 })
  classId: string;

  @ManyToOne(() => ClassTypeOrmEntity)
  @JoinColumn({ name: 'classId' })
  classEntity: ClassTypeOrmEntity;

  // Group Relation (Optional for lower classes)
  @Column({ type: 'varchar', length: 36, nullable: true })
  groupId: string | null;

  @ManyToOne(() => GroupTypeOrmEntity, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: GroupTypeOrmEntity | null;

  // Subject Relation
  @Column({ type: 'varchar', length: 36 })
  subjectId: string;

  @ManyToOne(() => SubjectTypeOrmEntity)
  @JoinColumn({ name: 'subjectId' })
  subject: SubjectTypeOrmEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
