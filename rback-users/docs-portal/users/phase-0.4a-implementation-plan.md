# Phase 0.4A — Implementation Plan (Execution Guide)

> **Goal:** Build the pure RBAC engine based on the "System Roles" architecture, where all employees are `STAFF` and permissions are handled via auto-seeded roles like "Teacher" and "Accountant".

This document serves as the step-by-step checklist and technical spec for the developer implementing Phase 0.4A.

---

## 1. Database Entities

The four core RBAC tables must be created first. 

- **`PermissionTypeOrmEntity`** (`permissions` table): 
  - Fields: `id`, `resource`, `action`, `description`. 
  - Unique: `(resource, action)`.
  - Location: `src/modules/permissions/infrastructure/typeorm/entities/`
- **`RoleTypeOrmEntity`** (`roles` table): 
  - Fields: `id`, `tenantId`, `name`, `description`, `isSystemRole` (boolean, default false).
  - Unique: `(tenantId, name)`.
  - Location: `src/modules/roles/infrastructure/typeorm/entities/`
- **`RolePermissionTypeOrmEntity`** (`role_permissions` junction):
  - Fields: `roleId`, `permissionId`.
- **`UserRoleTypeOrmEntity`** (`user_roles` junction):
  - Fields: `userId`, `roleId`, `tenantId`, `assignedAt`.

---

## 2. Core Seeder (System Startup)

Create `PermissionsSeederService` implementing `OnApplicationBootstrap`.
When the NestJS application boots, it must ensure these 16 permissions exist in the `permissions` table:

```typescript
const systemPermissions = [
  { resource: 'students', action: 'read' },
  { resource: 'students', action: 'write' },
  { resource: 'students', action: 'delete' },
  { resource: 'staff', action: 'read' },
  { resource: 'staff', action: 'write' },
  { resource: 'fees', action: 'read' },
  { resource: 'fees', action: 'write' },
  { resource: 'fees', action: 'delete' },
  { resource: 'attendance', action: 'read' },
  { resource: 'attendance', action: 'write' },
  { resource: 'exams', action: 'read' },
  { resource: 'exams', action: 'write' },
  { resource: 'exams', action: 'publish' },
  { resource: 'reports', action: 'read' },
  { resource: 'reports', action: 'export' },
  { resource: 'academics', action: 'read' },
  { resource: 'academics', action: 'write' },
  { resource: 'academics', action: 'delete' },
  { resource: 'roles', action: 'read' },
  { resource: 'roles', action: 'write' },
];
```

---

## 3. Tenant Registration (Auto-Roles)

When a new school registers (in `RegisterTenantUseCase`), the system must automatically create the default System Roles for them.

**Role 1: "Teacher" (`isSystemRole: true`)**
- Receives permissions: `students:read`, `attendance:write`, `exams:write`.

**Role 2: "Accountant" (`isSystemRole: true`)**
- Receives permissions: `fees:read`, `fees:write`.

*(These roles are tenant-scoped, meaning they are inserted into the `roles` table with the new school's `tenantId`).*

---

## 4. The Security Guards

### `@RequirePermission()` Decorator
Create a custom decorator `RequirePermission(resource: string, action: string)` that attaches metadata to the route handlers.

### `PermissionGuard`
Create the Guard that executes this logic:
1. Extract `userId`, `tenantId`, and `userType` from the JWT.
2. If `userType === 'SCHOOL_ADMIN'`, return `true` immediately.
3. Retrieve required `resource` and `action` from route metadata.
4. Execute SQL to check if the user has the required permission:
   ```sql
   SELECT 1 FROM user_roles ur
   JOIN role_permissions rp ON ur.roleId = rp.roleId
   JOIN permissions p ON rp.permissionId = p.id
   WHERE ur.userId = ? AND ur.tenantId = ? 
     AND p.resource = ? AND p.action = ?
   ```
5. If found, return `true`. Else, throw `ForbiddenException`.

---

## 5. Roles Module API Endpoints

Create `RolesModule`, `RolesController`, and `RolesService`:

- `POST /roles`: Create custom role.
- `GET /roles`: List all roles for the tenant.
- `PATCH /roles/:id`: Update role. Cannot update if `isSystemRole = true`.
- `DELETE /roles/:id`: Delete role. Cannot delete if `isSystemRole = true`.
- `POST /roles/:id/permissions`: Assign permissions to role.
- `DELETE /roles/:id/permissions/:permissionId`: Remove permission from role.

---

## 6. JWT Update

Update `JwtStrategy` and `LoginUseCase` to query the user's role names and attach them to the JWT payload:
```typescript
export interface JwtPayload {
  userId: string;
  tenantId: string;
  userType: UserType;
  roleNames: string[]; // <-- NEW
}
```

---

## Execution Checklist

- [ ] Create 4 TypeORM Entities
- [ ] Implement `PermissionsSeederService`
- [ ] Update `RegisterTenantUseCase` to auto-create Teacher/Accountant roles
- [ ] Create `@RequirePermission` and `PermissionGuard`
- [ ] Create `RolesModule` CRUD endpoints
- [ ] Update JWT Payload to include `roleNames`
- [ ] Apply `PermissionGuard` to Phase 0.3 Academics endpoints (`academics:write`)
