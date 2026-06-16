# Phase 0.4A — Role-Based Access Control (RBAC)

> **Build this first.** Everything in 0.4B, 0.4C, 0.4D depends on roles existing.
> **Depends on:** Phase 0.3 complete (JwtAuthGuard + TenantScopeGuard already working)

---

## What We Are Building (Plain English)

Right now the system knows a few types of users (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `STAFF`). 
But inside a school, employees do different things. A teacher and an accountant are both employees, but they need completely different access.

Phase 0.4A implements a **"Smart Default + Flexible Roles"** architecture.

**1. The Smart Default (Teachers):**
Because 90% of a school's employees are teachers, the admin shouldn't have to build complex permissions for them. The system now has a dedicated `TEACHER` userType. When the admin adds a Teacher, they automatically get the basic powers they need (like taking attendance for their assigned class) — zero configuration required.

**2. Flexible Roles (Other Staff):**
For everyone else (Accountants, Librarians, etc.), they are generic `STAFF`. The admin creates **custom job roles** (like "Accountant") and assigns **specific permissions** (like `fees:write`) to those roles. 

After this phase, the system can answer:
> "Can Ahmed submit exam results?" → Yes, because he is a `TEACHER` and this is his assigned class.
> "Can Rina view fee invoices?" → Yes, because she is `STAFF` with the "Accountant" role that has the `fees:read` permission.

---

## The Two Core Concepts

### 1. Permission — The Padlock (System-Defined)

A permission is a specific action on a specific resource.
**The system defines all permissions. Users cannot create or delete them.**

- Format: `resource:action`
- Examples: `fees:write`, `attendance:read`, `students:delete`
- Think of each permission as a **padlock** on a door.

### 2. Role — The Job Title (Admin-Created)

A custom label the School Admin creates for their school.

- Examples: `"Class Teacher"`, `"Exam Controller"`, `"Accountant"`, `"Librarian"`
- The admin creates roles with any name they want
- Each school's roles are completely independent (tenant-scoped)
- Think of a role as a **job title that holds a set of keys**

The admin assigns permissions (keys) to roles (job titles), then assigns job titles to staff.

---

## The 4 Tables and What Each One Does

### Table 1: `permissions` (System Seeds This — Immutable)

```sql
CREATE TABLE permissions (
  id          VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  resource    VARCHAR(50)   NOT NULL,
  action      VARCHAR(50)   NOT NULL,
  description TEXT,
  UNIQUE KEY uq_permission (resource, action)
);
```

Seeded once on app startup via `onApplicationBootstrap`. Never touched by any user.

**All 16 system permissions:**

| Resource     | Actions                    |
| ------------ | -------------------------- |
| `students`   | `read`, `write`, `delete`  |
| `staff`      | `read`, `write`            |
| `fees`       | `read`, `write`, `delete`  |
| `attendance` | `read`, `write`            |
| `exams`      | `read`, `write`, `publish` |
| `reports`    | `read`, `export`           |
| `academics`  | `read`, `write`, `delete`  |
| `roles`      | `read`, `write`            |

---

### Table 2: `roles` (Admin Creates These — Tenant-Scoped)

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

- `isSystem = true` → seeded by the platform, cannot be deleted
- Each school has its own roles — School A's "Accountant" and School B's "Accountant" are different rows

---

### Table 3: `role_permissions` (Which Job Title Gets Which Keys)

```sql
CREATE TABLE role_permissions (
  roleId        VARCHAR(36)  NOT NULL,
  permissionId  VARCHAR(36)  NOT NULL,
  PRIMARY KEY (roleId, permissionId),
  FOREIGN KEY (roleId)       REFERENCES roles(id)       ON DELETE CASCADE,
  FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
);
```

**Example data:**

```
Accountant      → fees:read
Accountant      → fees:write
Class Teacher   → students:read
Class Teacher   → attendance:write
Exam Controller → exams:read
Exam Controller → exams:write
Exam Controller → exams:publish
```

---

### Table 4: `user_roles` (Which Person Has Which Job Title)

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

**Example data:**

```
Ahmed Khan → Class Teacher
Ahmed Khan → Exam Controller   ← one person can have multiple roles
Rina Begum → Accountant
```

`tenantId` is denormalized here for fast tenant-scoped queries without extra joins.

---

## The Full Permission Chain (How It All Connects)

```
Ahmed tries: POST /exams/results  (requires exams:write)

Ahmed (userId)
  ↓ user_roles
  Has: "Class Teacher", "Exam Controller"
  ↓ role_permissions
  Exam Controller has: exams:read, exams:write, exams:publish
  ↓ check
  "exams:write" found → ✅ ALLOW

Rina tries: POST /exams/results  (requires exams:write)

Rina (userId)
  ↓ user_roles
  Has: "Accountant"
  ↓ role_permissions
  Accountant has: fees:read, fees:write
  ↓ check
  "exams:write" NOT found → ❌ ForbiddenException
```

---

## Special Cases: SCHOOL_ADMIN and TEACHER

The PermissionGuard handles two special cases before it even checks the database:

### 1. The SCHOOL_ADMIN (Full Access)
`SCHOOL_ADMIN` skips all permission checks. They have everything automatically. The admin can never lock themselves out by misconfiguring a role.

### 2. The TEACHER (Smart Defaults)
If `userType === 'TEACHER'`, the guard automatically grants the basic permissions needed to run a classroom (e.g., `attendance:write`, `students:read`). 
**CRITICAL:** For teachers, passing the PermissionGuard is only Step 1. Step 2 happens in the Service Layer, which verifies that the teacher is actually assigned to the classroom they are trying to modify (via `teacher_assignments`).

```typescript
// Inside PermissionGuard — fast exits
if (user.userType === 'SCHOOL_ADMIN') {
  return true; // Admin gets everything
}

if (user.userType === 'TEACHER') {
  const teacherAutoPerms = ['attendance:write', 'students:read']; // expand as needed
  if (teacherAutoPerms.includes(`${resource}:${action}`)) {
    return true; // Auto-granted basic teacher powers
  }
}
// Everyone else (and TEACHERS asking for non-default powers) goes through the DB query
```

---

## The PermissionGuard — Complete Request Flow

```
Request: POST /fees/invoices
         ↓
JwtAuthGuard       → Valid JWT? → Extract userId, userType, tenantId
         ↓
TenantScopeGuard   → Has tenantId? → (blocks SUPER_ADMIN)
         ↓
PermissionGuard    → What is required? → "fees:write" (from @RequirePermission)
         ↓
         → Is userType === SCHOOL_ADMIN?
           YES → ✅ Allow immediately
         ↓
         → Is userType === TEACHER AND permission in auto-granted list?
           YES → ✅ Allow immediately
         ↓
           NO  → Run this single DB query (for STAFF, or TEACHERS doing extra duties):

SELECT p.resource, p.action
FROM user_roles ur
JOIN role_permissions rp ON rp.roleId = ur.roleId
JOIN permissions p ON p.id = rp.permissionId
WHERE ur.userId = :userId AND ur.tenantId = :tenantId

         ↓
         → Does result contain { resource: 'fees', action: 'write' }?
           YES → ✅ Allow
           NO  → ❌ ForbiddenException: "You don't have permission for this action"
```

**One DB query. No Redis. No caching needed at this scale.**

---

## The `@RequirePermission()` Decorator (Usage)

```typescript
// Write — only staff with fees:write can call this
@Post('fees/invoices')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
@RequirePermission('fees', 'write')
async createInvoice() { ... }

// Read — only staff with fees:read can call this
@Get('fees/invoices')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
@RequirePermission('fees', 'read')
async listInvoices() { ... }

// Delete — only staff with fees:delete can call this
@Delete('fees/invoices/:id')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
@RequirePermission('fees', 'delete')
async deleteInvoice() { ... }
```

The decorator stores `{ resource, action }` as route metadata. The `PermissionGuard` reads this metadata at runtime.

---

## JWT Token Change

**Currently:**

```json
{ "userId": "uuid", "tenantId": "uuid", "userType": "STAFF" }
```

**After 0.4A:**

```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "userType": "TEACHER", // or "STAFF"
  "roleNames": ["Exam Controller"] // Optional extra roles
}
```

**Why role names but NOT permissions in the JWT?**

Permissions change when the admin edits a role. The JWT is already issued and cannot be recalled. If permissions were embedded, a staff member who gets a permission revoked would still have it until their token expires (hours or days later).

Role names are included only for display purposes (e.g., show "You are logged in as Class Teacher"). The guard always queries **live** permissions from the database.

---

## API Endpoints

### Roles CRUD (SCHOOL_ADMIN only)

```
POST   /api/v1/roles                            ← Create role (name + description)
GET    /api/v1/roles                            ← List all roles for this tenant
PATCH  /api/v1/roles/:id                        ← Update role name/description
DELETE /api/v1/roles/:id                        ← Delete (fails if any user has this role)
```

### Permissions (Read-Only)

```
GET    /api/v1/permissions                      ← List all 16 system permissions
```

### Assign Permissions to a Role

```
POST   /api/v1/roles/:id/permissions            ← Assign permission(s) to role
DELETE /api/v1/roles/:id/permissions/:permId    ← Remove permission from role
GET    /api/v1/roles/:id/permissions            ← List role's current permissions
```

### Assign Roles to a Staff Member

```
POST   /api/v1/staff/:userId/roles              ← Assign role(s) to staff
DELETE /api/v1/staff/:userId/roles/:roleId      ← Remove role from staff
GET    /api/v1/staff/:userId/roles              ← List staff member's roles
```

---

## Real-World Example: First Day After 0.4A

```
Principal (SCHOOL_ADMIN) logs in and:

1. Creates role: "Accountant"
2. Assigns permissions to it: fees:read, fees:write

3. Invites Ahmed Khan as `TEACHER`. (Zero setup required!)
4. Invites Rina Begum as `STAFF`, assigns role "Accountant".

Ahmed logs in:
  → Can view his assigned students ✅ (Auto-granted to TEACHER)
  → Can take attendance for his class ✅ (Auto-granted to TEACHER)
  → Cannot view fees ❌
  → Cannot view other teachers' classes ❌ (Service layer blocks it)

Rina logs in:
  → Can view fees ✅ (Role permission)
  → Can create fee invoices ✅ (Role permission)
  → Cannot view students ❌
  → Cannot take attendance ❌
```

---

## Build Order Inside This Phase

```
Step 1 → permissions entity + seed 16 rows on app boot
Step 2 → roles entity + CRUD API (POST, GET, PATCH, DELETE /roles)
Step 3 → role_permissions entity + assign/remove permission API
Step 4 → user_roles entity + assign/remove role to staff API
Step 5 → Build PermissionGuard + @RequirePermission() decorator
Step 6 → Apply PermissionGuard to all write endpoints across the system
```

Each step depends on the previous. Do not skip ahead.

---

## Implementation Checklist

- [ ] Create `PermissionTypeOrmEntity` (`permissions` table)
- [ ] Create `RoleTypeOrmEntity` (`roles` table)
- [ ] Create `RolePermissionTypeOrmEntity` (`role_permissions` junction)
- [ ] Create `UserRoleTypeOrmEntity` (`user_roles` junction)
- [ ] Seed 16 permissions on app bootstrap (`onApplicationBootstrap`)
- [ ] Create `RolesModule` with service + controller
- [ ] Implement roles CRUD + permission assignment endpoints
- [ ] Build `PermissionGuard` class
- [ ] Build `@RequirePermission(resource, action)` decorator
- [ ] Update JWT strategy to include `roleNames[]` in token payload
- [ ] Apply `PermissionGuard` to all existing + new write endpoints

---

## Next Step

Once this is done → **[Phase 0.4B — Staff Management](./phase-0.4b-staff-management.md)**
Staff invites use `roleIds[]` — roles must exist before staff can be assigned roles.
