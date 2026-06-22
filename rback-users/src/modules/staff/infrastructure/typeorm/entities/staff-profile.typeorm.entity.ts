import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserTypeOrmEntity } from '../../../../users/infrastructure/typeorm/user.typeorm.entity';
import { DesignationTypeOrmEntity } from '../../../../designations/infrastructure/typeorm/entities/designation.typeorm.entity';
import { TeacherAssignmentTypeOrmEntity } from './teacher-assignment.typeorm.entity';

@Entity('staff_profiles')
@Index('idx_tenant_staff', ['tenantId'])
export class StaffProfileTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'varchar', length: 36 })
  designationId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employeeId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'date', nullable: true })
  joiningDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualification: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subjectSpecialty: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserTypeOrmEntity;

  @ManyToOne(() => DesignationTypeOrmEntity)
  @JoinColumn({ name: 'designationId' })
  designation: DesignationTypeOrmEntity;

  @OneToMany(() => TeacherAssignmentTypeOrmEntity, (ta) => ta.staffProfile)
  assignments: TeacherAssignmentTypeOrmEntity[];
}
