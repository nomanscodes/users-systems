import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuTypeOrmEntity } from '../../../permissions/infrastructure/typeorm/entities/menu.typeorm.entity';
import { TenantMenuTypeOrmEntity } from '../../../permissions/infrastructure/typeorm/entities/tenant-menu.typeorm.entity';
import { StudentMenuTypeOrmEntity } from '../../../permissions/infrastructure/typeorm/entities/student-menu.typeorm.entity';
import { ParentMenuTypeOrmEntity } from '../../../permissions/infrastructure/typeorm/entities/parent-menu.typeorm.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(MenuTypeOrmEntity)
    private readonly menuRepo: Repository<MenuTypeOrmEntity>,
    @InjectRepository(TenantMenuTypeOrmEntity)
    private readonly tenantMenuRepo: Repository<TenantMenuTypeOrmEntity>,
    @InjectRepository(StudentMenuTypeOrmEntity)
    private readonly studentMenuRepo: Repository<StudentMenuTypeOrmEntity>,
    @InjectRepository(ParentMenuTypeOrmEntity)
    private readonly parentMenuRepo: Repository<ParentMenuTypeOrmEntity>,
  ) {}

  // 5.1 Menus
  async getPlatformMenus() {
    return this.menuRepo.find();
  }

  async createPlatformMenu(dto: any) {
    const menu = this.menuRepo.create(dto);
    return this.menuRepo.save(menu);
  }

  // 5.2 Tenant (Employee) Menus
  async getTenantMenus(tenantId: string) {
    return this.tenantMenuRepo.find({
      where: { tenantId },
      relations: { menu: true },
    });
  }

  async assignTenantMenu(tenantId: string, menuId: string) {
    const existing = await this.tenantMenuRepo.findOne({
      where: { tenantId, menuId },
    });
    if (!existing) {
      const entity = this.tenantMenuRepo.create({ tenantId, menuId });
      await this.tenantMenuRepo.save(entity);
    }
    return { success: true };
  }

  async unassignTenantMenu(tenantId: string, menuId: string) {
    await this.tenantMenuRepo.delete({ tenantId, menuId });
    return { success: true };
  }

  // 5.3 Student Menus
  async getStudentMenus(tenantId: string) {
    return this.studentMenuRepo.find({
      where: { tenantId },
      relations: { menu: true },
    });
  }

  async assignStudentMenu(tenantId: string, menuId: string) {
    const existing = await this.studentMenuRepo.findOne({
      where: { tenantId, menuId },
    });
    if (!existing) {
      const entity = this.studentMenuRepo.create({ tenantId, menuId });
      await this.studentMenuRepo.save(entity);
    }
    return { success: true };
  }

  async unassignStudentMenu(tenantId: string, menuId: string) {
    await this.studentMenuRepo.delete({ tenantId, menuId });
    return { success: true };
  }

  // 5.4 Parent Menus
  async getParentMenus(tenantId: string) {
    return this.parentMenuRepo.find({
      where: { tenantId },
      relations: { menu: true },
    });
  }

  async assignParentMenu(tenantId: string, menuId: string) {
    const existing = await this.parentMenuRepo.findOne({
      where: { tenantId, menuId },
    });
    if (!existing) {
      const entity = this.parentMenuRepo.create({ tenantId, menuId });
      await this.parentMenuRepo.save(entity);
    }
    return { success: true };
  }

  async unassignParentMenu(tenantId: string, menuId: string) {
    await this.parentMenuRepo.delete({ tenantId, menuId });
    return { success: true };
  }
}
