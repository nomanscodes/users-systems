# RBAC Architecture Implementation Guide

This document provides a step-by-step technical implementation guide to transition the `rback-users` backend and `frontend` to the new Unified RBAC & Menu System.

---

## Phase 1: Create New TypeORM Entities

Create the following files inside `src/modules/permissions/infrastructure/typeorm/entities/` (or a dedicated `menus` module).

### 1. `menu.typeorm.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("menus")
export class MenuTypeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true })
  parentId: string | null;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  path: string;

  @Column({ type: "varchar", length: 100 })
  icon: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  isForSuperAdmin: boolean;

  @Column({ type: "json", nullable: true })
  allowedActions: string[]; // e.g., ["canView", "canCreate", "canEdit", "canDelete"]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Super Admin Tenant Gating Tables

These mapping tables determine which modules/menus a specific school (Tenant) is allowed to access.

**`tenant-menu.typeorm.entity.ts` (For STAFF)**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { MenuTypeOrmEntity } from "./menu.typeorm.entity";
// Import TenantTypeOrmEntity

@Entity("tenant_menus")
@Index("uq_tenant_menu", ["tenantId", "menuId"], { unique: true })
export class TenantMenuTypeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  tenantId: string;

  @Column({ type: "uuid" })
  menuId: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @ManyToOne(() => MenuTypeOrmEntity)
  @JoinColumn({ name: "menuId" })
  menu: MenuTypeOrmEntity;
}
```

**`student-menu.typeorm.entity.ts` (For STUDENTS)**
_(Exact same structure as above, but `@Entity('student_menus')`)_

**`parent-menu.typeorm.entity.ts` (For PARENTS)**
_(Exact same structure as above, but `@Entity('parent_menus')`)_

### 3. School Admin Role RBAC Table

**`menu-permission.typeorm.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
// Import RoleTypeOrmEntity and MenuTypeOrmEntity

@Entity("menu_permissions")
@Index("uq_role_menu", ["roleId", "menuId"], { unique: true })
export class MenuPermissionTypeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  roleId: string;

  @Column({ type: "uuid" })
  menuId: string;

  @Column({ type: "boolean", default: false })
  canView: boolean;

  @Column({ type: "boolean", default: false })
  canCreate: boolean;

  @Column({ type: "boolean", default: false })
  canEdit: boolean;

  @Column({ type: "boolean", default: false })
  canDelete: boolean;
}
```

---

## Phase 2: Deprecate Old Logic & Database Migration

This is a **Structural Upgrade**. You are keeping about 50% of your current RBAC system and replacing the rest.

### 🟢 What STAYS ALIVE (Do NOT delete these)
*   **`RoleTypeOrmEntity` (`roles` table):** Stays completely alive.
*   **`UserRoleTypeOrmEntity` (`user_roles` table):** Stays completely alive.
*   **`PermissionGuard`:** The file stays, only the SQL query inside changes.
*   **User JWT Structure:** Your `UserType` logic stays the same.

### 🔴 What gets FULLY REMOVED (Deprecated)
1. **Delete Old Entities:** Remove `permission.typeorm.entity.ts` and `role-permission.typeorm.entity.ts`.
2. **Update Role Entity:** Remove the `@OneToMany` relation to the old `rolePermissions` and point it to the new `MenuPermissionTypeOrmEntity`.
3. **Database Sync:** Use TypeORM CLI to drop the `permissions` and `role_permissions` tables, and generate the migration script to build the new tables.

---

## Phase 3: The Universal `GET /auth/me` Endpoint

This is the most critical logic for your frontend. Add this to your `auth.controller.ts`.

```typescript
@Get('me/menus')
@UseGuards(JwtAuthGuard)
async getMyMenus(@Request() req) {
  const user = req.user; // Contains tenantId and userType

  if (user.userType === UserType.SUPER_ADMIN) {
    return this.menuService.getSuperAdminMenus();
    // SELECT * FROM menus m WHERE m.isForSuperAdmin = 1 (or all platform menus)
  }

  if (user.userType === UserType.STUDENT) {
    return this.menuService.getStudentMenus(user.tenantId);
    // SELECT m.* FROM menus m JOIN student_menus sm ON m.id = sm.menuId WHERE sm.tenantId = ?
  }

  if (user.userType === UserType.PARENT) {
    return this.menuService.getParentMenus(user.tenantId);
    // SELECT m.* FROM menus m JOIN parent_menus pm ON m.id = pm.menuId WHERE pm.tenantId = ?
  }

  if (user.userType === UserType.STAFF || user.userType === UserType.SCHOOL_ADMIN) {
    // 1. Get User's Roles
    // 2. JOIN tenant_menus (to ensure Super Admin allows it)
    // 3. JOIN menu_permissions (to ensure School Admin allows it)
    return this.menuService.getStaffMenus(user.id, user.tenantId);
  }
}
```

---

## Phase 4: Refactor `PermissionGuard`

1. Rename `@RequirePermission(resource, action)` to `@RequireAction(path, action)`.
   _Example:_ `@RequireAction('/dashboard/staff', 'canCreate')`
2. Update `src/common/guards/permission.guard.ts` to perform the new SQL join check:

```sql
SELECT 1
FROM tenant_menus tm
JOIN menus m ON tm.menuId = m.id
JOIN menu_permissions mp ON m.id = mp.menuId
JOIN user_roles ur ON mp.roleId = ur.roleId
WHERE ur.userId = ?
  AND tm.tenantId = ?
  AND m.path = ?
  AND mp.canCreate = 1 -- (Dynamic based on requested action)
```

---

## Phase 5: Super Admin & School Admin APIs

### Super Admin Endpoints (Platform Level)

- `GET /api/v1/super-admin/menus` - List all master menus in the system.
- `POST /api/v1/super-admin/menus` - Create a new master menu.
- **Employee Module Assignment:**
  - `GET /api/v1/super-admin/tenant-menus/:tenantId` - View which admin modules are enabled for a school.
  - `POST /api/v1/super-admin/tenant-menus/assign` - Enable/Disable admin modules for a school.
- **Student/Parent Assignment:**
  - `GET /api/v1/super-admin/student-menus/:tenantId` - View enabled student menus for a school.
  - `POST /api/v1/super-admin/student-menus/assign` - Assign specific menus to Students in a school.
  - `GET /api/v1/super-admin/parent-menus/:tenantId` - View enabled parent menus for a school.
  - `POST /api/v1/super-admin/parent-menus/assign` - Assign specific menus to Parents in a school.

### School Admin Endpoints (Tenant Level RBAC)

- `GET /api/v1/tenant-admin/menus` - List only the admin menus the Super Admin enabled for this tenant.
- `POST /api/v1/tenant-admin/roles` - Create a custom role.
- `GET /api/v1/tenant-admin/menu-permissions/:roleId` - Get action permissions for a specific role.
- `POST /api/v1/tenant-admin/menu-permissions` - Assign actions (`canEdit`, `canView`, etc.) on a menu to a role.

---

## Phase 6: Frontend Integration

1. Upon successful login, call `GET /auth/me/menus`.
2. Store the returned JSON array in `usePermissionStore` (Zustand).
3. The `<Sidebar />` component maps over this state array to render links, instead of using a hardcoded `config.ts` array.
4. UI Buttons (like `Add Staff`) wrap themselves in a `<PermissionGuard require="/dashboard/staff" action="canCreate">` component which checks the Zustand store.
