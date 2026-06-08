import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('refresh_tokens')
@Index('idx_rt_user_id', ['userId'])
export class RefreshTokenTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: false })
  userId: string;

  /** bcrypt hash of the raw refresh token — raw is never stored */
  @Column({ type: 'varchar', length: 255, nullable: false })
  tokenHash: string;

  @Column({ type: 'datetime', nullable: false })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false, nullable: false })
  isRevoked: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
