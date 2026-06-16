# Phase 0.4A — Role-Based Access Control (RBAC)

> **Build this first.** Everything in 0.4B, 0.4C, 0.4D depends on roles existing.
> **Depends on:** Phase 0.3 complete (JwtAuthGuard + TenantScopeGuard already working)

---

## What We Are Building (Plain English)

Right now the system only knows one thing about a school user:
> "You are a SCHOOL_ADMIN" or "You are a STAFF member."

That's it. A teacher and an accountant are both just "STAFF." The system cannot tell them apart.

Phase 0.4A fixes this. The admin creates **custom job roles** (like "Accountant", "Class Teacher", "Librarian") and assigns **specific permissions** to each role. Then they assign roles to staff members.

After this phase, the system can answer:
> "Can this person access the fees module?" → Check their role → Check role permissions → Yes/No.

---

## The Two Concepts

### 1. Role
A custom label the School Admin creates for their school.
- Examples: `"Class Teacher"`, `"Exam Controller"`, `"Accountant"`, `"Librarian"`
- Each school creates its own roles — they are tenant-scoped
- The admin can create any role name they want

### 2. Permission
A fixed action on a fixed resource. **The system defines these — users cannot create new ones.**
- Format: `resource:action`
- Examples: `fees:write`, `attendance:read`, `students:delete`

The admin assigns permissions to roles. They cannot invent new permissions.

---

## Database Schema

### `roles` table
```sql
CREATE TABLE roles (
  id          VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  tenantId    VARCHAR(36)   NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  isSystem    BOOLEAN       DEFAULT FALSE,
  createdAt   DATETIME      DEFAULT NOW(),
  updatedAt   DATETIME      DEFAULT NOW() ON UPDATE NOW(),

  UNIQUE KEY uq_tenant_role_name (tenantId, name)
);
```

`isSystem = true` means this role was seeded by the platform (e.g., "School Admin") and cannot be deleted.

### `permissions` table
```sql
CREATE TABLE permissions (
  id          VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  resource    VARCHAR(50)   NOT NULL,
  action      VARCHAR(50)   NOT NULL,
  description TEXT,

  UNIQUE KEY uq_permission (resource, action)
);
```

Seeded on app startup. Never touched by users.

### `role_permissions` table (junction)
```sql
CREATE TABLE role_permissions (
  roleId        VARCHAR(36)  NOT NULL,
  permissionId  VARCHAR(36)  NOT NULL,

  PRIMARY KEY (roleId, permissionId),
  FOREIGN KEY (roleId)       REFERENCES roles(id)       ON DELETE CASCADE,
  FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
);
```

### `user_roles` table (junction)
```sql
CREATE TABLE user_roles (
  userId      VARCHAR(36)  NOT NULL,
  roleId      VARCHAR(36)  NOT NULL,
  tenantId    VARCHAR(36)  NOT NULL,
  assignedAt  DATETIME     DEFAULT NOW(),

  PRIMARY KEY (userId, roleId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
);
```

`tenantId` is denormalized here for fast tenant-scoped queries without joins.

---

## System Permissions (Seeded on Startup)

These are all the permissions the system knows about. They are inserted once into the `permissions` table when the app first boots. They never change.

| Resource | Actions |
|---|---|
| `students` | `read`, `write`, `delete` |
| `staff` | `read`, `write` |
| `fees` | `read`, `write`, `delete` |
| `attendance` | `read`, `write` |
| `exams` | `read`, `write`, `publish` |
| `reports` | `read`, `export` |
| `academics` | `read`, `write`, `delete` |
| `roles` | `read`, `write` |

**Rule:** `SCHOOL_ADMIN` automatically has ALL permissions. No check needed for them.

---

## API Endpoints

### Roles
```
POST   /api/v1/roles              ← Create a new role (name + description)
GET    /api/v1/roles              ← List all roles for this tenant
PATCH  /api/v1/roles/:id         ← Update role name or description
DELETE /api/v1/roles/:id         ← Delete role (fails if assigned to any user)
```

### Permissions (read-only for users)
```
GET    /api/v1/permissions       ← List all system permissions (no create/delete)
```

### Assign Permissions to a Role
```
POST   /api/v1/roles/:id/permissions              ← Assign permission(s) to role
DELETE /api/v1/roles/:id/permissions/:permissionId ← Remove permission from role
```

### Assign Roles to a Staff Member
```
POST   /api/v1/staff/:userId/roles              ← Assign role(s) to staff
DELETE /api/v1/staff/:userId/roles/:roleId      ← Remove role from staff
GET    /api/v1/staff/:userId/roles              ← List staff member's roles
```

---

## The PermissionGuard (How It Works)

After this phase, write endpoints will use a third guard:

```typescript
@Post('fees/invoices')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
@RequirePermission('fees', 'write')
async createInvoice() { ... }
```

**Flow inside PermissionGuard:**
```
1. Extract userId from JWT
2. If userType === SCHOOL_ADMIN → allow immediately (admin has everything)
3. Query: user_roles → role_permissions → permissions
4. Check if any permission matches resource:action
5. If yes → allow. If no → throw ForbiddenException.
```

The permission check is cached **per request** — one DB query per endpoint call. No Redis needed at this stage.

---

## JWT Token Change

Currently the JWT payload has:
```json
{ "userId": "uuid", "tenantId": "uuid", "userType": "STAFF" }
```

After 0.4A, add role names for display purposes:
```json
{ "userId": "uuid", "tenantId": "uuid", "userType": "STAFF", "roleNames": ["Class Teacher", "Exam Controller"] }
```

**Do NOT embed permissions in JWT** — they change when admin updates role permissions. The guard always queries live.

---

## Implementation Checklist

- [ ] Create `permissions` TypeORM entity
- [ ] Create `roles` TypeORM entity
- [ ] Create `role_permissions` junction entity
- [ ] Create `user_roles` junction entity
- [ ] Seed permissions on app bootstrap (use `onApplicationBootstrap`)
- [ ] Create `RolesModule` with CRUD service + controller
- [ ] Build `PermissionGuard` + `@RequirePermission()` decorator
- [ ] Update JWT payload to include `roleNames[]`
- [ ] Apply `PermissionGuard` to all write endpoints across the app

---

## Next Step

Once this is done → **Phase 0.4B (Staff Management)**
Staff invites use `roleIds[]` — roles must exist before staff can be assigned.
