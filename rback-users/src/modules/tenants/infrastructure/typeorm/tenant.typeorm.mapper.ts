import { TenantTypeOrmEntity } from './tenant.typeorm.entity';
import { TenantEntity } from '../../domain/entities/tenant.entity';

export class TenantTypeOrmMapper {
  static toDomain(orm: TenantTypeOrmEntity): TenantEntity {
    return new TenantEntity(
      orm.id,
      orm.name,
      orm.slug,
      orm.email,
      orm.phone ?? null,
      orm.address ?? null,
      orm.status,
      orm.createdBy ?? null,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toPersistence(domain: TenantEntity): Partial<TenantTypeOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      email: domain.email,
      phone: domain.phone ?? undefined,
      address: domain.address ?? undefined,
      status: domain.status,
      createdBy: domain.createdBy ?? undefined,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
