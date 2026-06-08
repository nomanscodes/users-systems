import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserType } from '../../../../common/enums/user-type.enum';
import { UserStatus } from '../../../../common/enums/user-status.enum';

@Entity('users')
@Index('idx_user_email', ['email'], { unique: true })
@Index('idx_user_tenant', ['tenantId'])
@Index('idx_user_type', ['tenantId', 'userType'], {
  unique: true,
  where: "userType = 'SCHOOL_ADMIN'",
})
export class UserTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  phone: string | null;

  @Column({
    type: 'enum',
    enum: UserType,
    nullable: false,
    // No default — must always be set explicitly by the system
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    nullable: false,
  })
  status: UserStatus;

  /**
   * Incremented whenever the user changes their password or is suspended.
   * JwtAuthGuard compares this against the value in the JWT — a mismatch
   * immediately invalidates all existing access tokens for this user.
   */
  @Column({ type: 'int', default: 1, nullable: false })
  tokenVersion: number;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  createdBy: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
