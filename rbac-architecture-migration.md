 **Requirements** : The application is a multi-tenant School Management SaaS where all user types (Super Admin, School Admin, Employees, Students, and Parents) use the same application. Super Admin controls which administrative modules are available to each School Admin (tenant) also controll students and parent menus tenant wise. School Admin manages role-based menu and action permissions only for employees within the enabled administrative modules. Student and Parent menus are predefined menus by super admin within the same application .

# Unified RBAC & Menu Architecture Migration Plan

## 1. Overview

This document outlines the architectural migration for the `user-system/rback-users` backend. The goal is to transition from a basic resource-action permission matrix to a fully robust, database-driven Menu and RBAC SaaS system.

This architecture supports:

- Super Admin controlling which administrative modules are available to a School (Tenant).
- School Admin managing employee RBAC within those allowed modules.
- Super Admin explicitly defining which menus are visible to Students and Parents on a per-tenant basis.

## 2. Naming Conventions & Design System

To maintain consistency with the current `user-system` backend:

- **Database Tables:** Plural, snake_case, NO `tbl` prefix (e.g., `menus`, `tenant_menus`).
- **TypeORM Entities:** PascalCase with `TypeOrmEntity` suffix (e.g., `MenuTypeOrmEntity`).
- **Foreign Keys:** UUIDs string types (length 36).
- **Organization:** The term `Organization` translates directly to `Tenant`.

---

## 3. Current State Analysis (To Be Deprecated / Modified)

| Current Entity                | Current Table      | Status / Action                                                                       |
| :---------------------------- | :----------------- | :------------------------------------------------------------------------------------ |
| `PermissionTypeOrmEntity`     | `permissions`      | **DEPRECATE**. Replaced by `menus` and specific action columns in `menu_permissions`. |
| `RolePermissionTypeOrmEntity` | `role_permissions` | **DEPRECATE**. Replaced by `menu_permissions`.                                        |
| `RoleTypeOrmEntity`           | `roles`            | **MODIFY**. Already exists and scoped to `tenantId`. Just needs relations updated.    |
| `UserRoleTypeOrmEntity`       | `user_roles`       | **KEEP AS-IS**. Properly maps `userId` to `roleId` within a `tenantId`.               |
| `PermissionGuard`             | N/A                | **MODIFY**. Logic must change to verify `TenantMenu` and `MenuPermission`.            |

---

## 4. New Target Architecture (To Be Created)

### 4.1 `MenuTypeOrmEntity` (Table: `menus`)

The central master registry for EVERY menu in the entire SaaS (Employees (STAFF), Students, and Parents).

- **id:** `string` (UUID) - Primary Key
- **parentId:** `string` (UUID, nullable) - Self-referencing for folders.
- **name:** `string`
- **path:** `string`
- **icon:** `string`
- **sortOrder:** `number`
- **isActive:** `boolean` (default: true)
- **isForSuperAdmin:** `boolean` (default: false) - For Platform Admins.
- **allowedActions:** `json` (e.g., `["canView", "canCreate", "canEdit", "canDelete"]`)

### 4.2 `MenuClosureTypeOrmEntity` (Table: `menu_closure`)

Mathematical table to support infinitely deep nested sidebar menus.

- **ancestorId:** `string` (UUID)
- **descendantId:** `string` (UUID)

### 4.3 `TenantMenuTypeOrmEntity` (Table: `tenant_menus`)

**The Super Admin Gate for Employees (STAFF).** Links an Administrative Menu to a Tenant.

- **id:** `string` (UUID) - Primary Key
- **tenantId:** `string` (UUID) - Foreign Key to `tenants`
- **menuId:** `string` (UUID) - Foreign Key to `menus`
- **isActive:** `boolean` (default: true)

### 4.4 `StudentMenuTypeOrmEntity` (Table: `student_menus`)

**The Super Admin Gate for Students.** Defines exactly which menus Students can see in a specific School.

- **id:** `string` (UUID) - Primary Key
- **tenantId:** `string` (UUID) - Foreign Key to `tenants`
- **menuId:** `string` (UUID) - Foreign Key to `menus` (Should map to a menu intended for students)
- **isActive:** `boolean` (default: true)

### 4.5 `ParentMenuTypeOrmEntity` (Table: `parent_menus`)

**The Super Admin Gate for Parents.** Defines exactly which menus Parents can see in a specific School.

- **id:** `string` (UUID) - Primary Key
- **tenantId:** `string` (UUID) - Foreign Key to `tenants`
- **menuId:** `string` (UUID) - Foreign Key to `menus` (Should map to a menu intended for parents)
- **isActive:** `boolean` (default: true)

### 4.6 `MenuPermissionTypeOrmEntity` (Table: `menu_permissions`)

**The School Admin RBAC.** Maps a Role to an Employee Menu, explicitly defining boolean actions.

- **id:** `string` (UUID) - Primary Key
- **menuId:** `string` (UUID) - Foreign Key to `menus`
- **roleId:** `string` (UUID) - Foreign Key to `roles`
- **canView, canCreate, canEdit, canDelete, canApprove, canDownload:** `boolean` (default: false)

---

## 5. API Endpoints Required

### Super Admin Endpoints (Platform Level)

- `GET /api/v1/super-admin/menus` - List all master menus in the system.
- `POST /api/v1/super-admin/menus` - Create a new master menu.
-
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

### Universal Endpoints (Auth & Hydration)

- `GET /api/v1/auth/me` - **The routing endpoint hit by frontend on login.**
  - If `userType === STUDENT`: Returns menus by joining `menus` with `student_menus` for the user's `tenantId`.
  - If `userType === PARENT`: Returns menus by joining `menus` with `parent_menus` for the user's `tenantId`.
  - If `userType === STAFF`: Returns menus by joining `menus`, `tenant_menus`, and `menu_permissions` based on the user's roles.
