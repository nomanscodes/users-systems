import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuTypeOrmEntity } from '../../infrastructure/typeorm/entities/menu.typeorm.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuTypeOrmEntity)
    private readonly menuRepo: Repository<MenuTypeOrmEntity>,
  ) {}

  async getSuperAdminMenus() {
    return this.menuRepo.query(`SELECT * FROM menus WHERE isForSuperAdmin = 1`);
  }

  async getStudentMenus(tenantId: string) {
    return this.menuRepo.query(
      `SELECT m.* FROM menus m JOIN student_menus sm ON m.id = sm.menuId WHERE sm.tenantId = ?`,
      [tenantId],
    );
  }

  async createPlatformMenu(dto: any) {
    const menu = this.menuRepo.create(dto);
    return this.menuRepo.save(menu);
  }

  // 6.1 Tenant Admin Menus
  async getMenusForTenantAdmin(tenantId: string) {
    return this.menuRepo.query(
      `SELECT m.* FROM menus m JOIN tenant_menus tm ON m.id = tm.menuId WHERE tm.tenantId = ?`,
      [tenantId],
    );
  }

  async getParentMenus(tenantId: string) {
    return this.menuRepo.query(
      `SELECT m.* FROM menus m JOIN parent_menus pm ON m.id = pm.menuId WHERE pm.tenantId = ?`,
      [tenantId],
    );
  }

  async getStaffMenus(userId: string, tenantId: string) {
    return this.menuRepo.query(
      `SELECT DISTINCT m.*, mp.canView, mp.canCreate, mp.canEdit, mp.canDelete
       FROM tenant_menus tm
       JOIN menus m ON tm.menuId = m.id
       JOIN menu_permissions mp ON m.id = mp.menuId
       JOIN user_roles ur ON mp.roleId = ur.roleId
       WHERE ur.userId = ? AND tm.tenantId = ?`,
      [userId, tenantId],
    );
  }
}
