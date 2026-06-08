import { TenantEntity } from '../../domain/entities/tenant.entity';

export class TenantMapper {
  static toPlainObject(entity: TenantEntity) {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      status: entity.status,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
