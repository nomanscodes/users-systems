## 1. Create New TypeORM Entities

- [ ] 1.1 Create `MenuTypeOrmEntity` in `menu.typeorm.entity.ts`
- [ ] 1.2 Create Super Admin Tenant Gating Tables (`TenantMenuTypeOrmEntity`, `StudentMenuTypeOrmEntity`, `ParentMenuTypeOrmEntity`)
- [ ] 1.3 Create School Admin Role RBAC Table (`MenuPermissionTypeOrmEntity`)

## 2. Deprecate Old Logic & Database Migration

- [ ] 2.1 Delete old entities (`permission.typeorm.entity.ts` and `role-permission.typeorm.entity.ts`)
- [ ] 2.2 Update `RoleTypeOrmEntity` relation to point to the new `MenuPermissionTypeOrmEntity`
- [ ] 2.3 Run database sync/migration to drop old tables and create new ones

## 3. Implement Universal GET /auth/me/menus Endpoint

- [ ] 3.1 Add `getMyMenus` endpoint in `auth.controller.ts`
- [ ] 3.2 Implement logic for `SUPER_ADMIN` to get all platform menus
- [ ] 3.3 Implement logic for `STUDENT` to get tenant-specific student menus
- [ ] 3.4 Implement logic for `PARENT` to get tenant-specific parent menus
- [ ] 3.5 Implement logic for `STAFF`/`SCHOOL_ADMIN` checking roles, tenant_menus, and menu_permissions

## 4. Refactor PermissionGuard

- [ ] 4.1 Rename `@RequirePermission` decorator to `@RequireAction(path, action)`
- [ ] 4.2 Update `PermissionGuard` SQL join logic to verify `tenant_menus`, `menus`, `menu_permissions`, and `user_roles`

## 5. Super Admin APIs (Platform Level)

- [ ] 5.1 Implement `GET /api/v1/super-admin/menus` and `POST /api/v1/super-admin/menus`
- [ ] 5.2 Implement Employee Module Assignment endpoints (`/api/v1/super-admin/tenant-menus/...`)
- [ ] 5.3 Implement Student Assignment endpoints (`/api/v1/super-admin/student-menus/...`)
- [ ] 5.4 Implement Parent Assignment endpoints (`/api/v1/super-admin/parent-menus/...`)

## 6. School Admin APIs (Tenant Level RBAC)

- [ ] 6.1 Implement `GET /api/v1/tenant-admin/menus` to list admin menus enabled for tenant
- [ ] 6.2 Implement `POST /api/v1/tenant-admin/roles` to create custom roles
- [ ] 6.3 Implement endpoints to get/assign menu action permissions to roles (`/api/v1/tenant-admin/menu-permissions/...`)

## 7. Frontend Integration

- [ ] 7.1 Fetch `/auth/me` on successful login and store in `usePermissionStore` (Zustand)
- [ ] 7.2 Refactor `<Sidebar />` component to map over the Zustand store array dynamically
- [ ] 7.3 Wrap restricted UI buttons with `<PermissionGuard require="..." action="...">` checking Zustand store
