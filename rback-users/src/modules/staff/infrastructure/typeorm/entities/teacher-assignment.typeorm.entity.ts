import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StaffProfileTypeOrmEntity } from './staff-profile.typeorm.entity';
import { BatchTypeOrmEntity } from '../../../../academics/infrastructure/typeorm/entities/batch.typeorm.entity';
import { SubjectTypeOrmEntity } from '../../../../academics/infrastructure/typeorm/entities/subject.typeorm.entity';

@Entity('teacher_assignments')
@Index('uq_teacher_batch_subject', ['staffProfileId', 'batchId', 'subjectId'], {
  unique: true,
})
@Index('idx_batch_subject', ['batchId', 'subjectId'])
export class TeacherAssignmentTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'varchar', length: 36 })
  staffProfileId: string;

  @Column({ type: 'varchar', length: 36 })
  batchId: string;

  @Column({ type: 'varchar', length: 36 })
  subjectId: string;

  @Column({ type: 'varchar', length: 36 })
  sessionId: string;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => StaffProfileTypeOrmEntity, (sp) => sp.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'staffProfileId' })
  staffProfile: StaffProfileTypeOrmEntity;

  @ManyToOne(() => BatchTypeOrmEntity)
  @JoinColumn({ name: 'batchId' })
  batch: BatchTypeOrmEntity;

  @ManyToOne(() => SubjectTypeOrmEntity)
  @JoinColumn({ name: 'subjectId' })
  subject: SubjectTypeOrmEntity;
}
