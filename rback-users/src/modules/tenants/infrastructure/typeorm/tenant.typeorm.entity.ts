import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';

@Entity('tenants')
@Index('idx_tenant_slug', ['slug'], { unique: true })
@Index('idx_tenant_email', ['email'], { unique: true })
@Index('idx_tenant_status', ['status'])
export class TenantTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  phone: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  address: string | null;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
    nullable: false,
  })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  createdBy: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
