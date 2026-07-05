# Frontend Requirements — Phase 0.4A & Phase 0.4B

> **Source:** Deep audit of backend controllers, service layer (staff.service.ts, roles.service.ts), DTOs, TypeORM entities, and business docs.
> **No code written here** — this is a requirements document only.
> **Last audited:** 2026-07-05
> **Target directories:** `src/features/rbac/` and `src/features/staff/`

---

## Prerequisites & Key Concepts to Understand First

Before building any UI, the developer must understand these backend rules:

1. **User Types:** The backend has `SCHOOL_ADMIN` and `STAFF`. `SCHOOL_ADMIN` bypasses ALL permission checks — they are superusers inside their tenant.
2. **Permissions are immutable:** There are exactly 20 system permissions (seeded on boot). The frontend can NEVER create or delete them. Only read and display.
3. **Roles are tenant-scoped:** Every school builds their own roles. Role names are unique per school (unique index on `tenantId + name`).
4. **A staff member with no role has zero access.** `roleIds` in the invite form is a required array — but the backend allows an empty array (no server-side minimum). The frontend MUST enforce at least one role selection.
5. **Designations are different from Roles.** Designation = job title label (e.g., "Senior Science Teacher"). Role = permission set (e.g., "Teacher"). These are completely independent.
6. **Deactivation, not deletion:** Staff members are never hard-deleted — `deactivate()` sets `users.status = INACTIVE`. The UI must reflect this with an "Inactive" badge.
7. **Temporary password flow:** After inviting a staff member, the API response contains a plain-text `temporaryPassword`. The admin must hand this to the staff member manually (no email automation yet).
8. **`isSystemRole` is the correct field name** (not `isSystem`). The entity column is `isSystemRole: boolean`. All frontend type definitions and conditional logic must use this exact name.
9. **Permissions on system roles CAN be modified.** The backend service intentionally allows adding/removing permissions on system roles (comment in `roles.service.ts`). Only `name` and `description` edits are blocked for system roles.
10. **`GET /roles` list does NOT return `permissions[]`.** The list endpoint returns bare role objects. Only `GET /roles/:id` (detail) returns the full `rolePermissions` array. Plan your data fetching accordingly.
11. **Teaching assignments require `TEACHING` designation — enforced on the backend.** If the frontend accidentally allows a non-TEACHING staff member to reach the assignment form, the backend will return a `ConflictException`. Always filter the UI.
12. **⚠️ Staff roles endpoints are NOT yet implemented.** `GET/POST/DELETE /staff/:id/roles` are explicitly marked as pending tasks in `phase-0.4a-implementation-plan.md`. The Roles tab in Staff Detail Drawer must be a placeholder.
13. **`UserStatus` has 3 values:** `ACTIVE`, `INACTIVE`, `SUSPENDED`. Not just 2. The frontend filter and status badge must handle all three.

---

## Part 1 — Phase 0.4A: RBAC Management

### 1.1 Where it lives (Route & Nav)

| Route | Page |
|---|---|
| `/dashboard/roles` | Roles & Permissions page |

- The sidebar nav should have a section "Access Control" with a "Roles & Permissions" link.
- Only visible to `SCHOOL_ADMIN`. If a `STAFF` user navigates directly to this URL, the backend will return `403`. The frontend should redirect to `/unauthorized`.

---

### 1.2 System Permissions Reference (Read-Only)

These 20 permissions exist in the backend. The frontend displays them as a checklist — never as a form input. There are no IDs to memorize; the frontend fetches them from `GET /api/v1/permissions`.

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

**Display rule:** Group permissions by `resource`. Within each resource, show each `action` as a toggleable checkbox. Use human-readable labels: `students:read` → "View Students", `students:write` → "Create/Edit Students", etc.

---

### 1.3 The `/dashboard/roles` Page — Full Specification

#### Page Layout (Two-Panel Design)

The page uses a **two-panel layout**:
- **Left panel (narrower):** List of all roles (like an inbox list). Each item shows: role name, # of permissions assigned.
- **Right panel (wider):** Role detail view — shows the full permission matrix for the selected role.

#### Left Panel — Role List

- Fetch from: `GET /api/v1/roles`
- Each list item shows:
  - Role name
  - Number of permissions assigned (e.g., "6 permissions")
  - A badge if `isSystem = true` → "System Role" (cannot be edited or deleted)
- A **"+ Create Role"** button at the top of the list.
- Clicking a role opens the right panel.

**Create Role Form (inline modal or drawer):**

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | yes | max 100 chars, unique per tenant |
| Description | textarea | no | |

- On submit: `POST /api/v1/roles` with `{ name, description }`
- On success: toast "Role created", refresh list, auto-select the new role.
- On duplicate name (**400 BadRequest** from backend — NOT 409): show inline error "A role with this name already exists."

#### Right Panel — Role Detail & Permission Editor

When a role is selected:

1. **Role header:** Shows role name + description. Edit (pencil) icon opens an inline edit form. Save calls `PATCH /api/v1/roles/:id` with `{ name?, description? }`.
2. **Delete button:** Shown only if `isSystem = false`. Calls `DELETE /api/v1/roles/:id`. If the backend returns an error (role has staff assigned), show: "Cannot delete — this role is currently assigned to staff members."
3. **Permission matrix:** A visual checklist grouped by resource.
   - Fetch current permissions from the role detail: `GET /api/v1/roles/:id`
   - Fetch all available permissions from: `GET /api/v1/permissions`
   - Each permission row shows a toggle/checkbox.
   - **Assign a permission:** On checkbox check → `POST /api/v1/roles/:id/permissions` with `{ permissionIds: [id] }`.
   - **Remove a permission:** On checkbox uncheck → `DELETE /api/v1/roles/:id/permissions/:permissionId`.
   - No "Save" button — changes apply immediately per-toggle (same UX pattern as Subject Allocation matrix).

**Edge case — System Roles (`isSystemRole: true`):**
If `isSystemRole = true`:
- The **name** and **description** edit fields must be locked (greyed out, non-interactive) — backend throws `ForbiddenException` if attempted.
- The **delete button** must be hidden entirely — backend throws `ForbiddenException`.
- **Permission checkboxes CAN be toggled** — the backend intentionally allows this for system roles. Do NOT lock checkboxes for system roles. Only lock name/delete.
- Show an informational note: "This is a system role. Name and deletion are locked, but you can still adjust permissions."

---

### 1.4 API Hooks Needed (Phase 0.4A)

Create in `src/features/rbac/hooks/`:

| Hook | API Call | Notes |
|---|---|---|
| `useRoles` | `GET /api/v1/roles` | Returns bare role list (no permissions array) |
| `useRole(id)` | `GET /api/v1/roles/:id` | Returns role WITH `rolePermissions[]` array |
| `useCreateRole` | `POST /api/v1/roles` | |
| `useUpdateRole` | `PATCH /api/v1/roles/:id` | |
| `useDeleteRole` | `DELETE /api/v1/roles/:id` | |
| `usePermissions` | `GET /api/v1/permissions` | Returns all 20 system permissions |
| `useAssignPermissions` | `POST /api/v1/roles/:id/permissions` | Body: `{ permissionIds: string[] }` |
| `useRemovePermission` | `DELETE /api/v1/roles/:id/permissions/:permId` | |

---

### 1.5 Types Needed (Phase 0.4A)

Create in `src/features/rbac/types/`:

```ts
interface Permission {
  id: string
  resource: string
  action: string
  description: string | null
}

interface RolePermission {
  roleId: string
  permissionId: string
  permission: Permission
}

interface Role {
  id: string
  name: string
  description: string | null
  isSystemRole: boolean      // ⚠️ Correct field name — NOT `isSystem`
  createdAt: string
  updatedAt: string
  rolePermissions?: RolePermission[]  // Only present in GET /roles/:id detail response
}
```

---

## Part 2 — Phase 0.4B: Staff Management

### 2.1 Where it lives (Routes & Nav)

| Route | Page |
|---|---|
| `/dashboard/staff` | Staff Directory (list all staff) |
| `/dashboard/staff/designations` | Designations Setup |

- Sidebar nav section "People": "Staff Directory" and "Designations" links.
- Both pages require `staff:read` permission (or `SCHOOL_ADMIN`).

**Build order:** Designations page MUST be built first — the Staff Invite form requires a `designationId` from the designations list.

---

### 2.2 Page: `/dashboard/staff/designations`

A simple CRUD setup page for job title categories (identical in style to the Branches/Sections tabs in Academic Setup).

#### Designation Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | e.g., "Senior Science Teacher", "Chief Accountant" |
| `category` | enum select | yes | `TEACHING`, `NON_TEACHING`, `ADMIN` |

**Why `category` matters:** The `TEACHING` value is used by the frontend to filter which staff members appear in the "Assign Teacher" dropdown. Non-teaching staff should NOT appear there.

#### Page Layout

- Card/table list of existing designations with: title, category badge, edit (pencil) and delete (trash) icons.
- **"+ Add Designation"** button opens a small inline form or dialog.
- On save: `POST /api/v1/designations` with `{ title, category }`
- Edit: `PATCH /api/v1/designations/:id`
- Delete: `DELETE /api/v1/designations/:id`
  - If backend returns error (designation in use): toast "Cannot delete — this designation is assigned to staff."

#### API Hooks (Designations)

Create in `src/features/staff/hooks/`:

| Hook | API Call |
|---|---|
| `useDesignations` | `GET /api/v1/designations` |
| `useCreateDesignation` | `POST /api/v1/designations` |
| `useUpdateDesignation` | `PATCH /api/v1/designations/:id` |
| `useDeleteDesignation` | `DELETE /api/v1/designations/:id` |

---

### 2.3 Page: `/dashboard/staff` — Staff Directory

Three major sub-sections:
1. Staff listing table
2. Staff Invite multi-step form
3. Staff Detail Drawer (edit profile + manage roles + teaching assignments)

---

#### 2.3.1 Staff Table

- Fetch from: `GET /api/v1/staff`
- Columns: Name, Email, Designation, Category badge, Roles (chips), Status badge, Actions
- Active/Inactive filter tab toggle at the top.
- Client-side search by name or email.
- Row click or "View" button opens the Staff Detail Drawer.

**Deactivate action:**
- Calls `DELETE /api/v1/staff/:id` (sets `isActive = false` — NOT a hard delete)
- Confirmation dialog: "This will revoke their login access. Continue?"
- Deactivated staff remain in the table with a grey "Inactive" badge.
- No re-activate endpoint exists yet — show a tooltip on inactive rows: "Contact support to reactivate."

---

#### 2.3.2 Staff Invite Form — Multi-Step

Triggered by "+ Invite Staff Member". Opens as a drawer (full-height right panel).

**Step 1 — Personal Details**

> ⚠️ **Critical:** The `InviteStaffDto` (source of truth in the backend DTO file) only accepts these fields. `joiningDate`, `qualification`, and `subjectSpecialty` are NOT in the invite DTO — they must be added separately after invite via `PATCH /api/v1/staff/:id`.

| Field | Type | Required | Validation (from DTO) |
|---|---|---|---|
| First Name | text | yes | min 1, max 100 chars |
| Last Name | text | yes | min 1, max 100 chars |
| Email | email | yes | valid email, max 255 chars |
| Phone | text | no | max 20 chars |
| Department | text | no | max 100 chars |

**Step 2 — Designation**

| Field | Type | Required | Notes |
|---|---|---|---|
| Designation | dropdown | yes | From `GET /api/v1/designations`. Display as `title (category)` |

**Step 3 — Role Assignment (Permissions)**

| Field | Type | Required | Notes |
|---|---|---|---|
| Roles | multi-select checkboxes | yes (min 1) | From `GET /api/v1/roles`. At least one role is mandatory. |

Show a hint: "Roles define what this staff member can access in the system."

**Submission:** `POST /api/v1/staff/invite`

Request body:
```json
{
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "phone": "...",
  "designationId": "uuid",
  "department": "...",
  "joiningDate": "YYYY-MM-DD",
  "qualification": "...",
  "subjectSpecialty": "...",
  "roleIds": ["uuid1", "uuid2"]
}
```

**Critical post-submit UX — Temporary Password Dialog:**

After a successful invite, the API returns a `temporaryPassword` in plain text. The frontend MUST show a special one-time dialog (NOT a regular toast) containing:
- Staff member's name and email
- Temporary password in a styled, copyable code block
- A "Copy Password" button
- Warning text: "This password is shown only once. Share it securely with the staff member."
- A "Done" button to close

**Error handling:**
- Email already exists: Backend returns **409 ConflictException** — show inline error on email field: "A user with this email already exists."
- Invalid designationId: Backend returns 404 — should not happen if UI built correctly, but guard with a disabled submit state if no designations exist yet.
- Invalid roleIds: Backend returns 404 if any roleId is not found in the tenant. This can happen if roles were deleted mid-flow. Show toast: "One or more selected roles no longer exist. Please refresh and try again."

> **UX note for empty state:** If no designations have been created yet, show a prompt inside the invite form: "You have no designations configured. Create one in Designations settings first." and disable the Submit button.

---

#### 2.3.3 Staff Detail Drawer (Three Tabs)

Clicking a staff member opens a right-side drawer with these tabs:

---

**Tab 1: Profile**

Display all profile fields in read-only mode. "Edit" button switches to edit mode.

Editable via `PATCH /api/v1/staff/:id` with `UpdateStaffProfileDto`:

| Field | Editable | Source | Notes |
|---|---|---|---|
| First Name | No (read-only) | `users` table | |
| Last Name | No (read-only) | `users` table | |
| Email | No (read-only) | `users` table | |
| Designation | Yes | `staff_profiles` | Dropdown from designations |
| Employee ID | Yes | `staff_profiles` | Text, max 50 chars (entity has this field, update it via PATCH) |
| Department | Yes | `staff_profiles` | Text, max 100 chars |
| Joining Date | Yes | `staff_profiles` | Date picker |
| Qualification | Yes | `staff_profiles` | Text, max 255 chars |
| Subject Specialty | Yes | `staff_profiles` | Text, max 255 chars |
| Salary | **Read-only display** (SCHOOL_ADMIN only) | `staff_profiles` | ⚠️ `salary` is NOT in `UpdateStaffProfileDto` — it cannot be edited via this endpoint in current backend. Display it as read-only. Hide completely for STAFF viewers. |

> **Note:** `UpdateStaffProfileDto` accepts: `designationId?`, `department?`, `joiningDate?`, `qualification?`, `subjectSpecialty?`. It does NOT include `employeeId` or `salary`. To update `employeeId` a future endpoint or backend DTO update is needed.

--- **Tab 2: Roles** ⚠️ **PLACEHOLDER — Backend Not Implemented Yet**
  - `GET /api/v1/staff/:id/roles`, `POST /api/v1/staff/:id/roles`, `DELETE /api/v1/staff/:id/roles/:roleId` **do not exist** in the current backend. These are pending tasks.
  - Render the Roles tab as a read-only notice: "Individual role management is coming soon. Roles are currently set during staff invite."
  - Do NOT call any API from this tab yet.

---

**Tab 3: Teaching Assignments**

> This tab is only rendered if `staffProfile.designation.category === 'TEACHING'`.  
> For non-teaching staff, this tab is hidden entirely.

- Fetch assignments from: `GET /api/v1/staff/:id/assignments`
- Display each as a row: Subject | Class | Group | Section | Session Year | Remove button
- Remove: `DELETE /api/v1/staff/:id/assignments/:assignmentId` with confirmation.

**"Assign to Class" form (inline in the tab):**

| Field | Type | Required | Notes |
|---|---|---|---|
| Subject | dropdown | yes | From `GET /api/v1/academics/subjects` |
| Class | dropdown (cascading) | yes | Extracted from batches list (`useBatches()`), unique by `classId` |
| Group | dropdown (cascading) | conditional | Filter batches by classId. **`groupId` is nullable** — skip dropdown if all matching batches have no group |
| Section | dropdown (cascading) | conditional | Filter batches by classId + groupId. **`sectionId` is nullable** — skip if no section |

The Class/Group/Section cascade is done client-side by fetching `GET /api/v1/academics/batches`. The final resolved `batchId` is the batch matching the full combination.

Note: `batches/:batchId/teachers` route is at `GET /api/v1/staff/batches/:batchId/teachers` (Staff controller, NOT academics controller).

Submit: `POST /api/v1/staff/:id/assignments` with `{ batchId, subjectId }`

**Duplicate assignment handling:** Backend returns `409 ConflictException`. Show toast: `"This teacher is already assigned to this subject in this batch."`

---

### 2.4 API Hooks Needed (Phase 0.4B)

Create in `src/features/staff/hooks/`:

| Hook | API Call | Notes |
|---|---|---|
| `useStaff` | `GET /api/v1/staff` | Returns staffProfile + user + designation. Does NOT include roles[] |
| `useStaffMember(id)` | `GET /api/v1/staff/:id` | Returns staffProfile + user + designation + assignments |
| `useInviteStaff` | `POST /api/v1/staff/invite` | Atomic: creates user + profile + role assignments |
| `useUpdateStaff` | `PATCH /api/v1/staff/:id` | Only updates staff_profiles fields |
| `useDeactivateStaff` | `DELETE /api/v1/staff/:id` | Sets user.status = INACTIVE |
| `useStaffRoles(id)` | `GET /api/v1/staff/:id/roles` | Must be called separately — not in list/detail response |
| `useAssignStaffRole` | `POST /api/v1/staff/:id/roles` | Body: `{ roleIds: string[] }` |
| `useRemoveStaffRole` | `DELETE /api/v1/staff/:id/roles/:roleId` | |
| `useStaffAssignments(id)` | `GET /api/v1/staff/:id/assignments` | Returns assignments with batch + subject relations |
| `useAssignTeacher` | `POST /api/v1/staff/:id/assignments` | Body: `{ batchId, subjectId }`. Backend validates TEACHING category |
| `useRemoveAssignment` | `DELETE /api/v1/staff/:id/assignments/:assignmentId` | |

---

### 2.5 Types Needed (Phase 0.4B)

Create in `src/features/staff/types/`:

```ts
type DesignationCategory = 'TEACHING' | 'NON_TEACHING' | 'ADMIN'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'  // ← 3 values, not 2

interface Designation {
  id: string
  title: string
  category: DesignationCategory
  createdAt: string
  updatedAt: string
}

interface StaffProfile {
  id: string
  userId: string
  designationId: string
  designation: Designation
  employeeId: string | null
  department: string | null
  joiningDate: string | null      // date string 'YYYY-MM-DD'
  qualification: string | null
  subjectSpecialty: string | null
  salary: number | null           // present in response but NOT editable via PATCH currently
  createdAt: string
  updatedAt: string
  assignments?: TeacherAssignment[]  // present in GET /staff/:id detail only
}

interface StaffMember {
  id: string                // ⚠️ This is staffProfile.id — NOT user.id
  userId: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    status: UserStatus    // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    phone: string | null
  }
  staffProfile: StaffProfile
  // Note: roles[] is NOT in GET /staff or GET /staff/:id.
  // Staff roles endpoints are NOT YET IMPLEMENTED in the backend.
}

// Returned by GET /staff/:id/roles
interface StaffRole {
  userId: string
  roleId: string
  tenantId: string
  assignedAt: string
  role: Role            // includes name, isSystemRole, etc.
}

interface TeacherAssignment {
  id: string
  staffProfileId: string
  batchId: string
  subjectId: string
  sessionId: string     // denormalized from batch at assignment time
  assignedAt: string
  batch: {
    id: string
    classEntity?: { name: string }
    group?: { name: string } | null
    section?: { name: string } | null
    session?: { name: string }
  }
  subject: {
    id: string
    name: string
    code: string | null  // ← nullable in SubjectTypeOrmEntity
  }
}
```

---

## Part 3 — Sidebar Navigation Changes

The current sidebar shows only Academic module links. Add the following:

### New Section: "Access Control"
- **Roles & Permissions** → `/dashboard/roles`
  - Visible only to `SCHOOL_ADMIN` (hide for STAFF users entirely)

### New Section: "People"
- **Staff Directory** → `/dashboard/staff`
  - Visible to `staff:read` permission or `SCHOOL_ADMIN`
- **Designations** → `/dashboard/staff/designations`
  - Visible to `staff:write` permission or `SCHOOL_ADMIN`

Reference the existing `layout.tsx` in `/dashboard` for the nav item pattern.

---

## Part 4 — Strict Build Order

```
1. rbac/types          ← Types for Permission, Role
2. rbac/hooks          ← useRoles, usePermissions, etc.
3. /dashboard/roles    ← Two-panel roles page

4. staff/types         ← Types for Designation, StaffMember, etc.
5. staff/hooks (designations) ← useDesignations, CRUD hooks
6. /dashboard/staff/designations ← Designations CRUD page

7. staff/hooks (staff) ← useStaff, useInviteStaff, etc.
8. /dashboard/staff    ← Staff table + invite form
9. Staff Detail Drawer ← Profile tab + Roles tab + Teaching Assignments tab

10. Update sidebar navigation
```

> The Staff Invite form (step 8) depends on designations (step 6) and roles (step 3) being loaded.
> Do not build steps out of order.

---

## Part 5 — Edge Cases & Rules Summary

| Scenario | Expected Behavior |
|---|---|
| System Role — name/description edit | Lock name/description fields and hide delete button. Use `isSystemRole` field (not `isSystem`) |
| System Role — permission toggles | **Allowed** — checkboxes remain fully interactive for system roles |
| Delete role | Backend uses ON DELETE CASCADE — role_permissions and user_roles are auto-cleaned. Show simple confirmation dialog |
| Duplicate role name (create or update) | Backend returns **400** (not 409). Show inline error |
| Staff invite — duplicate email | Backend returns 409 ConflictException. Show inline error on email field |
| Staff invite — invalid roleIds | Backend returns 404. Show toast to refresh and retry |
| Staff invite — no designations configured | Disable submit, show prompt to create designations first |
| Staff invite — success | Show one-time password dialog with copy button. NOT just a toast |
| Roles tab — loading | Roles are NOT in GET /staff list or detail. Always fetch separately via GET /staff/:id/roles |
| Remove last role from staff | Show confirmation warning about full access loss |
| Deactivate staff | Backend sets `status = INACTIVE` (not a boolean `isActive`). Row shows as Inactive with grey badge |
| Teaching Assignments tab | Only shown when `staffProfile.designation.category === 'TEACHING'`. Backend enforces this too (ConflictException if violated) |
| Salary field display | Show as read-only for SCHOOL_ADMIN. Hidden completely for STAFF userType. Not editable in current backend |
| STAFF visits `/dashboard/roles` | Redirect to `/unauthorized` — backend returns 403 |
| Duplicate teaching assignment | Backend returns 409 ConflictException. Show toast: "This teacher is already assigned to this subject in this batch" |
| Staff list response shape | `GET /staff` returns `{ id (staffProfileId), userId, user, designation, ...profileFields }` — map accordingly |
