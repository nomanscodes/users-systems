## 1. Create New TypeORM Entities

- [x] 1.1 Create `MenuTypeOrmEntity` in `menu.typeorm.entity.ts`
- [x] 1.2 Create Super Admin Tenant Gating Tables (`TenantMenuTypeOrmEntity`, `StudentMenuTypeOrmEntity`, `ParentMenuTypeOrmEntity`)
- [x] 1.3 Create School Admin Role RBAC Table (`MenuPermissionTypeOrmEntity`)

## 2. Deprecate Old Logic & Database Migration

- [x] 2.1 Delete old entities (`permission.typeorm.entity.ts` and `role-permission.typeorm.entity.ts`)
- [x] 2.2 Update `RoleTypeOrmEntity` relation to point to the new `MenuPermissionTypeOrmEntity`
- [x] 2.3 Run database sync/migration to drop old tables and create new ones

## 3. Implement Universal GET /auth/me/menus Endpoint

- [x] 3.1 Add `getMyMenus` endpoint in `auth.controller.ts`
- [x] 3.2 Implement logic for `SUPER_ADMIN` to get all platform menus
- [x] 3.3 Implement logic for `STUDENT` to get tenant-specific student menus
- [x] 3.4 Implement logic for `PARENT` to get tenant-specific parent menus
- [x] 3.5 Implement logic for `STAFF`/`SCHOOL_ADMIN` checking roles, tenant_menus, and menu_permissions

## 4. Refactor PermissionGuard

- [x] 4.1 Rename `@RequirePermission` decorator to `@RequireAction(path, action)`
- [x] 4.2 Update `PermissionGuard` SQL join logic to verify `tenant_menus`, `menus`, `menu_permissions`, and `user_roles`

## 5. Super Admin APIs (Platform Level)

- [x] 5.1 Implement `GET /api/v1/super-admin/menus` and `POST /api/v1/super-admin/menus`
- [x] 5.2 Implement Employee Module Assignment endpoints (`/api/v1/super-admin/tenant-menus/...`)
- [x] 5.3 Implement Student Assignment endpoints (`/api/v1/super-admin/student-menus/...`)
- [x] 5.4 Implement Parent Assignment endpoints (`/api/v1/super-admin/parent-menus/...`)

## 6. School Admin APIs (Tenant Level RBAC)

- [x] 6.1 Implement `GET /api/v1/tenant-admin/menus` to list admin menus enabled for tenant
- [x] 6.2 Implement `POST /api/v1/tenant-admin/roles` to create custom roles
- [x] 6.3 Implement endpoints to get/assign menu action permissions to roles (`/api/v1/tenant-admin/menu-permissions/...`)

## 7. Frontend Integration

- [x] 7.1 Fetch `/auth/me` on successful login and store in `usePermissionStore` (Zustand)
- [x] 7.2 Refactor `<Sidebar />` component to map over the Zustand store array dynamically
- [x] 7.3 Wrap restricted UI buttons with `<PermissionGuard require="..." action="...">` checking Zustand store
