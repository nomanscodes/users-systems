# Implementation Plan — Phase 0.4A & Phase 0.4B Frontend

> **Read this before writing any code:** [frontend-requirements.md](./frontend-requirements.md)
> **Pattern reference:** Study `src/features/academics/` before starting — all new code follows the same structure.
> **Stack:** Next.js App Router, React Query (`@tanstack/react-query`), Sonner toasts, Lucide icons, Shadcn/ui components, Tailwind CSS.
> **Last cross-checked against backend source:** 2026-07-05

> [!CAUTION]
> **`GET/POST/DELETE /staff/:id/roles` endpoints are NOT yet implemented in the backend.**
> These are explicitly marked `[ ]` (pending) in `phase-0.4a-implementation-plan.md` lines 126-128.
> The Roles tab in the Staff Detail Drawer must be built as a **placeholder** that shows a "Coming soon" notice until the backend ships these endpoints.

---

## Complete File Tree (Everything to Create)

```
src/
├── features/
│   ├── rbac/                              ← Phase 0.4A (NEW)
│   │   ├── types/
│   │   │   └── rbac.dto.ts
│   │   ├── api/
│   │   │   └── rbac.service.ts
│   │   └── hooks/
│   │       ├── use-roles.ts
│   │       └── use-permissions.ts
│   │
│   └── staff/                             ← Phase 0.4B (NEW)
│       ├── types/
│       │   └── staff.dto.ts
│       ├── api/
│       │   └── staff.service.ts
│       └── hooks/
│           ├── use-designations.ts
│           ├── use-staff.ts
│           └── use-staff-roles-assignments.ts
│
├── app/(main)/dashboard/
│   ├── roles/                             ← Phase 0.4A (NEW)
│   │   ├── page.tsx
│   │   └── _components/
│   │       ├── roles-page.tsx             ← "use client" shell
│   │       ├── role-list-panel.tsx
│   │       ├── role-detail-panel.tsx
│   │       ├── permission-matrix.tsx
│   │       ├── create-role-dialog.tsx
│   │       └── edit-role-form.tsx
│   │
│   └── staff/                             ← Phase 0.4B (NEW)
│       ├── page.tsx
│       ├── designations/
│       │   ├── page.tsx
│       │   └── _components/
│       │       ├── designations-page.tsx  ← "use client" shell
│       │       └── designation-form.tsx
│       └── _components/
│           ├── staff-page.tsx             ← "use client" shell
│           ├── staff-table.tsx
│           ├── invite-staff-drawer.tsx
│           ├── temp-password-dialog.tsx
│           ├── staff-detail-drawer.tsx
│           ├── profile-tab.tsx
│           ├── roles-tab.tsx
│           └── teaching-assignments-tab.tsx
│
└── navigation/sidebar/
    └── sidebar-items.ts                   ← MODIFY (add new nav groups)
```

---

## Phase 0.4A — Step-by-Step Implementation

---

### Step 1 — Types (`src/features/rbac/types/rbac.dto.ts`)

Create this file. Follow the same format as `academics.dto.ts` — plain interfaces and payload types together in one file.

**Interfaces to define:**

```
Permission          { id, resource, action, description }
RolePermission      { roleId, permissionId, permission: Permission }
Role                { id, name, description, isSystemRole, createdAt, updatedAt, rolePermissions? }
```

**Payload types to define:**

```
CreateRolePayload       { name: string; description?: string }
UpdateRolePayload       Partial<CreateRolePayload>
AssignPermissionsPayload { permissionIds: string[] }
```

**Key rule:** Use `isSystemRole: boolean` — NOT `isSystem`. Match exact backend field name.

---

### Step 2 — API Service (`src/features/rbac/api/rbac.service.ts`)

Follow the same pattern as `AcademicsService` in `academics.service.ts`:

- Import `apiClient` from `@/lib/api-client`
- Use the same `unwrap` helper: `const unwrap = <T>(response: any): T => response.data`
- Export a single `RbacService` object with all methods

**Methods to implement:**

```
// Permissions (read-only)
getAllPermissions()                   GET  /v1/permissions

// Roles CRUD
getRoles()                            GET  /v1/roles
getRole(id)                           GET  /v1/roles/:id       ← returns rolePermissions[]
createRole(data)                      POST /v1/roles
updateRole(id, data)                  PATCH /v1/roles/:id
deleteRole(id)                        DELETE /v1/roles/:id

// Role → Permission assignment
assignPermissions(roleId, data)       POST /v1/roles/:id/permissions
removePermission(roleId, permId)      DELETE /v1/roles/:id/permissions/:permId
```

**Critical:** `getRole` and `getRoles` are different return shapes. `getRoles` returns `Role[]` (no `rolePermissions`). `getRole` returns `Role` with `rolePermissions[]` populated.

---

### Step 3 — Hooks (`src/features/rbac/hooks/`)

**File 1: `use-permissions.ts`**

Single hook:

```
usePermissions()    → useQuery, queryKey: ['rbac', 'permissions']
```

No mutations — permissions are read-only.

---

**File 2: `use-roles.ts`**

Hooks to implement (follow `use-branches.ts` pattern exactly):

```
useRoles()                queryKey: ['rbac', 'roles']
useRole(id)               queryKey: ['rbac', 'roles', id], enabled: !!id
useCreateRole()           invalidates ['rbac', 'roles'] on success
useUpdateRole()           invalidates ['rbac', 'roles'] and ['rbac', 'roles', id] on success
useDeleteRole()           invalidates ['rbac', 'roles'] on success
useAssignPermissions()    invalidates ['rbac', 'roles', roleId] on success
useRemovePermission()     invalidates ['rbac', 'roles', roleId] on success
```

**Toast messages:**

- Create: `"Role created successfully"`
- Update: `"Role updated"`
- Delete: `"Role deleted"`
- Assign permission: no toast (silent, immediate toggle)
- Remove permission: no toast (silent, immediate toggle)

**Error handling:** On `useCreateRole` and `useUpdateRole` error, do NOT show a generic toast. The calling component must handle the error inline (400 for duplicate name). Pass error down via `mutation.error`.

---

### Step 4 — Route Page (`src/app/(main)/dashboard/roles/page.tsx`)

**This is a Server Component.** Keep it minimal — just metadata + Suspense wrapper.

```
export const metadata = {
  title: 'Roles & Permissions',
  description: 'Manage system roles and assign permissions for your school staff.'
}

export default function RolesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RolesPageClient />
    </Suspense>
  )
}
```

---

### Step 5 — Roles Page Client Shell (`_components/roles-page.tsx`)

**`"use client"` component.** Owns the state for which role is selected.

**State:**

```
selectedRoleId: string | null   ← which role is open in right panel
```

**Layout:** Side-by-side two panels.

```
<div className="flex gap-6 h-full">
  <RoleListPanel
    selectedRoleId={selectedRoleId}
    onSelect={setSelectedRoleId}
  />
  {selectedRoleId
    ? <RoleDetailPanel roleId={selectedRoleId} />
    : <EmptyState message="Select a role to view permissions" />
  }
</div>
```

---

### Step 6 — Role List Panel (`_components/role-list-panel.tsx`)

Uses `useRoles()` hook.

**Render each role item as a button with:**

- Role name (bold)
- `rolePermissions` count — NOTE: `getRoles()` does NOT return `rolePermissions`. Show `—` or fetch count separately, OR simply omit the count from the list view. Recommended: omit count from list, show full count only in detail panel.
- `isSystemRole === true` → show a "System" badge (secondary/muted style — not alarming)
- Active/selected state: highlighted background

**"+ Create Role" button** at the top → opens `CreateRoleDialog`.

**Empty state:** "No roles created yet. Create your first role to get started."

**Loading state:** 3–4 skeleton rows.

---

### Step 7 — Create Role Dialog (`_components/create-role-dialog.tsx`)

A Shadcn `<Dialog>` opened from the List Panel.

**Form fields:**

- `name` — text input, required
- `description` — textarea, optional

**Submit:** calls `useCreateRole()` mutation.

**Inline error handling:**

- If `mutation.error` contains "already exists" (HTTP 400) → show red text under the name field: `"A role with this name already exists."`
- Do NOT close the dialog on error.

**On success:** close dialog, clear form.

---

### Step 8 — Role Detail Panel (`_components/role-detail-panel.tsx`)

Uses `useRole(id)` hook (returns full `rolePermissions[]`).
Uses `usePermissions()` hook (returns all 20 system permissions).

**Renders:**

1. **Header section:** role name + description
   - If `isSystemRole === false`: show pencil (edit) icon → inline edit form using `useUpdateRole()`
   - If `isSystemRole === true`: name and description are read-only, no edit icon
2. **Delete button:** Only rendered if `isSystemRole === false`. Calls `useDeleteRole()` with a `<AlertDialog>` confirmation.
3. **Info banner (system roles only):** `"This is a system role. Name and deletion are locked, but you can still adjust its permissions."`
4. **`<PermissionMatrix />`** component (see below)

**Loading state:** Show skeleton for the header + matrix.

---

### Step 9 — Permission Matrix (`_components/permission-matrix.tsx`)

Props: `role: Role`, `allPermissions: Permission[]`

**Logic:**

- Group `allPermissions` by `resource` field.
- For each group, render a section header (`students`, `fees`, etc.) and a row of checkboxes per action.
- A checkbox is `checked` if the `role.rolePermissions` array contains that permission's `id`.
- On **check** → call `useAssignPermissions()` with `{ permissionIds: [permission.id] }`.
- On **uncheck** → call `useRemovePermission(roleId, permissionId)`.
- Each toggle is independent. No "Save All" button.

**Human-readable labels map:**

```
read    → "View"
write   → "Create & Edit"
delete  → "Delete"
publish → "Publish"
export  → "Export"
```

Display as: resource name (title case) as section header, then `action → human label` as checkbox label.

Example row: `[ ✓ ] View Students`

**Loading state per checkbox:** When a mutation is in-flight for a specific permission, show that checkbox as disabled + spinner. Other checkboxes remain interactive.

---

## Phase 0.4B — Step-by-Step Implementation

---

### Step 10 — Types (`src/features/staff/types/staff.dto.ts`)

**Interfaces to define:**

```
DesignationCategory     'TEACHING' | 'NON_TEACHING' | 'ADMIN'
Designation             { id, title, category, createdAt, updatedAt }
StaffProfile            { id, userId, designationId, designation, employeeId, department,
                          joiningDate, qualification, subjectSpecialty, salary, createdAt, updatedAt,
                          assignments? }
StaffUser               { id, email, firstName, lastName,
                          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',  ← UserStatus enum has 3 values
                          phone }
StaffMember             { id (=staffProfileId), userId, user: StaffUser, staffProfile: StaffProfile }
StaffRole               { userId, roleId, tenantId, assignedAt, role: Role }
                        ⚠️ This type is for a FUTURE endpoint — not yet implemented in backend
TeacherAssignment       { id, staffProfileId, batchId, subjectId, sessionId, assignedAt,
                          batch: { id, classEntity?, group?, section?, session? },
                          subject: { id, name: string, code: string | null } }  ← code is nullable
```

**Payload types:**

```
InviteStaffPayload      { email, firstName, lastName, phone?, designationId, department?, roleIds[] }
UpdateStaffPayload      { designationId?, department?, joiningDate?, qualification?, subjectSpecialty? }
AssignTeacherPayload    { batchId: string; subjectId: string }
AssignStaffRolePayload  { roleIds: string[] }
CreateDesignationPayload { title, category }
UpdateDesignationPayload Partial<CreateDesignationPayload>
```

**Important:** `salary` and `employeeId` are NOT in the update payload (backend DTO does not include them). They display only.

---

### Step 11 — API Service (`src/features/staff/api/staff.service.ts`)

Follow `AcademicsService` pattern. Export a single `StaffService` object.

**Methods:**

```
// Designations
getDesignations()                     GET  /v1/designations
createDesignation(data)               POST /v1/designations         ← 409 if duplicate title
updateDesignation(id, data)           PATCH /v1/designations/:id    ← 409 if duplicate title
deleteDesignation(id)                 DELETE /v1/designations/:id   ← 403 ForbiddenException if in use

// Staff
getAllStaff()                          GET  /v1/staff
getStaffMember(id)                    GET  /v1/staff/:id
inviteStaff(data)                     POST /v1/staff/invite      ← returns { userId, staffProfileId, email, temporaryPassword }
updateStaff(id, data)                 PATCH /v1/staff/:id
deactivateStaff(id)                   DELETE /v1/staff/:id

// Staff → Roles  ⚠️ NOT YET IMPLEMENTED IN BACKEND — build placeholder UI only
// getStaffRoles(staffId)               GET  /v1/staff/:id/roles
// assignStaffRole(staffId, data)       POST /v1/staff/:id/roles
// removeStaffRole(staffId, roleId)     DELETE /v1/staff/:id/roles/:roleId

// Teaching Assignments
getAssignments(staffId)              GET  /v1/staff/:id/assignments
assignTeacher(staffId, data)         POST /v1/staff/:id/assignments
removeAssignment(staffId, asnId)     DELETE /v1/staff/:id/assignments/:assignmentId

// Batch Teachers (routed under Staff controller, NOT academics)
getTeachersByBatch(batchId)          GET  /v1/staff/batches/:batchId/teachers
```

---

### Step 12 — Hooks (`src/features/staff/hooks/`)

**File 1: `use-designations.ts`**

```
useDesignations()         queryKey: ['staff', 'designations']
useCreateDesignation()    invalidates ['staff', 'designations']
                          On 409 ConflictException (duplicate title) → pass error to component for inline display
useUpdateDesignation()    invalidates ['staff', 'designations']
                          On 409 ConflictException (duplicate title) → pass error to component for inline display
useDeleteDesignation()    invalidates ['staff', 'designations']
                          On 403 ForbiddenException (in use) → toast: "Cannot delete — designation is assigned to staff"
                          On 404 NotFoundException → toast: "Designation not found"
```

---

**File 2: `use-staff.ts`**

```
useStaff()                queryKey: ['staff', 'list']
useStaffMember(id)        queryKey: ['staff', 'detail', id], enabled: !!id
useInviteStaff()          invalidates ['staff', 'list'] on success
                          NOTE: do NOT show toast on success — parent shows password dialog instead
                          Pass back full response data (including temporaryPassword)
useUpdateStaff()          invalidates ['staff', 'list'] and ['staff', 'detail', id] on success
                          toast on success: "Profile updated"
useDeactivateStaff()      invalidates ['staff', 'list'] on success, toast: "Staff member deactivated"
```

---

**File 3: `use-staff-assignments.ts`** *(rename from use-staff-roles-assignments.ts — roles endpoints are not built yet)*

```
// ⚠️ Staff Roles hooks — DO NOT IMPLEMENT until backend ships the endpoints
// useStaffRoles, useAssignStaffRole, useRemoveStaffRole are BLOCKED

useStaffAssignments(staffId)   queryKey: ['staff', 'assignments', staffId]
useAssignTeacher(staffId)      invalidates ['staff', 'assignments', staffId] on success
                               toast: "Teacher assigned successfully"
useRemoveAssignment(staffId)   invalidates ['staff', 'assignments', staffId] on success
                               toast: "Assignment removed"
```

---

### Step 13 — Designations Page

**Route file** (`/dashboard/staff/designations/page.tsx`):

- Server component
- Metadata: `title: 'Designations'`
- Wrap `<DesignationsPageClient />` in `<Suspense>`

**Client shell** (`_components/designations-page.tsx`):

- Page header with title "Designations" + description
- Uses `useDesignations()` to fetch list
- "+ Add Designation" button → opens inline dialog or inline form row

**Designation list:** Simple table or card list with columns:

```
Title | Category badge | Edit (pencil) | Delete (trash)
```

Category badge colors:

- `TEACHING` → green/emerald
- `NON_TEACHING` → blue/indigo
- `ADMIN` → amber/orange

**`designation-form.tsx`** — form for both Create and Edit:

- `title`: text input, required
- `category`: `<Select>` with three options

**Delete handling:** Inline confirm popover (not a full dialog).
- On `403 ForbiddenException` from backend: toast `"Cannot delete — this designation is currently assigned to staff members."`
- On `404 NotFoundException`: toast `"Designation not found."`

**Create/Update duplicate title handling:** Designation create/update returns `409 ConflictException` if a title already exists within the tenant. Show inline error under the title field: `"A designation with this title already exists."`

**Empty state:** "No designations yet. Add your first designation to start inviting staff."

---

### Step 14 — Staff Directory Page

**Route file** (`/dashboard/staff/page.tsx`):

- Server component, metadata: `title: 'Staff Directory'`
- Wrap `<StaffPageClient />` in `<Suspense>`

**Client shell** (`_components/staff-page.tsx`):

- State: `activeFilter: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'`  ← UserStatus has 3 values
- State: `searchQuery: string`
- State: `selectedStaffId: string | null` (controls drawer)
- State: `inviteDrawerOpen: boolean`
- Renders: filter tabs + search bar + `<StaffTable>` + `<InviteStaffDrawer>` + `<StaffDetailDrawer>`

---

### Step 15 — Staff Table (`_components/staff-table.tsx`)

Props: `staff: StaffMember[]`, `filter: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'`, `searchQuery: string`, `onSelect: (id) => void`, `onDeactivate: (id) => void`

**Client-side filtering logic:**

1. Filter by `staffMember.user.status === filter`
2. Filter by `searchQuery` matching `firstName + lastName` or `email` (case-insensitive)

**Table columns:**

```
Name           → user.firstName + ' ' + user.lastName
Email          → user.email
Designation    → staffProfile.designation.title
Category       → staffProfile.designation.category (badge)
Status         → 'ACTIVE' = green badge | 'INACTIVE' = grey badge | 'SUSPENDED' = red badge
Actions        → "View" button, "Deactivate" button (only shown when status === 'ACTIVE')
```

**Row click:** calls `onSelect(staffMember.id)` to open drawer.

**Deactivate button:** opens `<AlertDialog>` confirmation → `useDeactivateStaff()`.

**Loading state:** 5 skeleton rows.

**Empty state:** "No staff members found."

---

### Step 16 — Invite Staff Drawer (`_components/invite-staff-drawer.tsx`)

Uses Shadcn `<Sheet>` (right-side drawer, full height).

**Pre-requisite data to load before rendering the form:**

- `useDesignations()` — for designation dropdown
- `useRoles()` — for role multi-select

**Empty state guard:** If `designations.length === 0`, show an alert inside the drawer:

```
"You have no designations configured yet.
 Go to Designations settings first."
 [Link to /dashboard/staff/designations]
```

And disable the submit button.

**Multi-step form with 3 steps:**

---

**Step 1 header:** "Personal Details"

Fields (all map to `InviteStaffPayload`):

- `firstName` — text, required, max 100
- `lastName` — text, required, max 100
- `email` — email input, required, max 255
- `phone` — text, optional, max 20
- `department` — text, optional, max 100

Note under the form: `"Additional details (joining date, qualifications) can be added after the staff member is created."`

---

**Step 2 header:** "Designation"

- Single `<Select>` for `designationId`, required
- Display options as: `"[title] · [category]"` (e.g. `"Senior Science Teacher · Teaching"`)
- If no designations: show disabled select + warning

---

**Step 3 header:** "Roles & Permissions"

- Show all roles from `useRoles()` as a list of checkboxes
- `roleIds` array must contain at least 1 item — show validation error if empty: `"Select at least one role"`
- Show a hint box: `"Roles control what this staff member can access in the system."`

---

**Footer (all steps):** "Back" / "Next" / "Invite Staff Member" (final step).

**On submit:** call `useInviteStaff()` mutation.

**On success:** close the invite drawer + immediately open `<TempPasswordDialog>` with the response data.

**On error (409 duplicate email):** go back to Step 1 and show inline error under the email field.

---

### Step 17 — Temp Password Dialog (`_components/temp-password-dialog.tsx`)

Props: `open: boolean`, `data: { firstName, lastName, email, temporaryPassword } | null`, `onClose: () => void`

This is NOT a dismissable overlay — user must click "Done" to close.

**Content:**

1. Success icon (green checkmark)
2. Headline: `"Staff member invited!"`
3. Sub-text: `"[firstName] [lastName] has been added to your school."`
4. Section header: `"Temporary Password"`
5. Code block displaying `temporaryPassword` in a monospace font with a "Copy" button (copies to clipboard, shows `"Copied!"` flash)
6. Warning text (amber/yellow): `"⚠ This password is shown only once. Please share it with [firstName] securely before closing."`
7. "Done" button → calls `onClose()`

---

### Step 18 — Staff Detail Drawer (`_components/staff-detail-drawer.tsx`)

Props: `staffId: string | null`, `onClose: () => void`

Uses Shadcn `<Sheet>`.

**Loads:**

- `useStaffMember(staffId)` — profile + user + designation + assignments

**Header:** Staff name + designation title + status badge.

**Three Tabs using Shadcn `<Tabs>`:**

```
Profile  |  Roles (placeholder)  |  Teaching Assignments (only if TEACHING category)
```

The "Teaching Assignments" tab must be conditionally rendered:

```tsx
{
  staffMember.staffProfile.designation.category === "TEACHING" && (
    <TabsTrigger value="assignments">Teaching Assignments</TabsTrigger>
  );
}
```

> [!IMPORTANT]
> The **Roles tab** renders as a placeholder notice for now:
> `"Role management for individual staff members is coming soon."`
> The backend endpoints for `GET/POST/DELETE /staff/:id/roles` are not yet implemented.
> Do not build hooks or UI that calls these endpoints.

---

### Step 19 — Profile Tab (`_components/profile-tab.tsx`)

**View mode (default):**
Display all fields in a clean key-value grid.

**Edit mode** (toggle with "Edit" button):
Renders form with `UpdateStaffPayload` fields only:

- `designationId` — dropdown
- `department` — text
- `joiningDate` — date input
- `qualification` — text
- `subjectSpecialty` — text

**Read-only fields (always):**

- `firstName`, `lastName`, `email` — shown as plain text with a note "(Managed via user account)"
- `employeeId` — shown as plain text (not in update DTO)
- `salary` — shown as plain text for SCHOOL_ADMIN, **completely hidden** for STAFF users

**How to detect SCHOOL_ADMIN:** Read from auth store `useAuthStore(state => state.user.userType)`.

**Save:** calls `useUpdateStaff()`.

---

### Step 20 — Roles Tab (`_components/roles-tab.tsx`) ⚠️ PLACEHOLDER ONLY

> **Backend endpoints NOT yet implemented.**
> `GET/POST/DELETE /staff/:id/roles` are marked as pending.
> Build this tab as a simple placeholder notice.

**What to render:**
```tsx
<div className="flex flex-col items-center gap-4 py-12 text-center">
  <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
  <p className="font-medium text-muted-foreground">Role Management Coming Soon</p>
  <p className="text-sm text-muted-foreground/70">
    Individual staff role assignment will be available in a future update.
    Roles are currently assigned during the staff invite process.
  </p>
</div>
```

**No hooks, no API calls.**

---

### Step 21 — Teaching Assignments Tab (`_components/teaching-assignments-tab.tsx`)

> Only rendered if `staffProfile.designation.category === 'TEACHING'`.

Uses `useStaffAssignments(staffId)`.

**Assignment list:** Table with columns:

```
Subject  |  Class  |  Group  |  Section  |  Session  |  Remove
```

**"+ Assign to Class" button** opens an inline form (not a dialog — inline below the list):

Form fields (cascading):

1. `subjectId` — dropdown from `useSubjects()` (academic hook already exists)
2. `classId` — dropdown from batches data (use existing `useBatches()` hook)
3. `groupId` — dropdown filtered by selected classId from batches (handle nullable)
4. `sectionId` — dropdown filtered by classId + groupId from batches (handle nullable)

The combination of class + group + section resolves to a `batchId` from the batches list. Resolve client-side.

**Submit:** `useAssignTeacher(staffId)` with `{ batchId, subjectId }`.

**Error (409 duplicate):** show inline error: `"This teacher is already assigned to this subject in this class."`

**Remove assignment:** trash icon → `<AlertDialog>` confirmation → `useRemoveAssignment()`.

---

### Step 22 — Sidebar Navigation Update

**File to modify:** `src/navigation/sidebar/sidebar-items.ts`

**Add two new `NavGroup` entries** to the `sidebarItems` array:

```typescript
// Group id: 3
{
  id: 3,
  label: "People",
  items: [
    {
      id: "staff-directory",
      title: "Staff Directory",
      url: "/dashboard/staff",
      icon: Users,          // from lucide-react
    },
    {
      id: "designations",
      title: "Designations",
      url: "/dashboard/staff/designations",
      icon: Briefcase,      // from lucide-react
    },
  ],
},

// Group id: 4
{
  id: 4,
  label: "Access Control",
  items: [
    {
      id: "roles",
      title: "Roles & Permissions",
      url: "/dashboard/roles",
      icon: ShieldCheck,    // from lucide-react
    },
  ],
},
```

**Add to imports:**

```typescript
import { Users, Briefcase, ShieldCheck, ... } from "lucide-react";
```

**Permission-based visibility:** The sidebar currently does not filter by permission. For now, add all items to the sidebar. A future task is to conditionally hide items based on `userType` from `useAuthStore`. This is not blocking.

---

## Common Gotchas — Read Before Coding

| Gotcha                           | Detail                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Staff roles endpoints NOT BUILT** | `GET/POST/DELETE /staff/:id/roles` do not exist yet. Build Roles tab as a placeholder. No hooks needed. |
| `isSystemRole` not `isSystem`    | Wrong field name will cause all system-role logic to silently fail                                                                                     |
| `GET /roles` vs `GET /roles/:id` | List has NO`rolePermissions`. Always call `getRole(id)` for the detail panel                                                                           |
| Staff`id` is `staffProfileId`    | `staffMember.id` is the profile ID. `staffMember.user.id` is the user account ID. Use `staffMember.id` for all staff API calls                         |
| Staff`status` has 3 values       | `'ACTIVE' \| 'INACTIVE' \| 'SUSPENDED'` — not a boolean, not just 2 options                                                                            |
| Invite DTO fields                | `joiningDate`, `qualification`, `subjectSpecialty` are NOT in the invite DTO. Do not include them in Step 1 form. Inform user they can add these later |
| Salary read-only                 | `salary` is NOT in `UpdateStaffProfileDto`. Show as display-only. Never render an input for it                                                         |
| Roles not in staff list          | `GET /staff` response does NOT contain `roles[]`. Always load them separately via `GET /staff/:id/roles`                                               |
| Designation create/update        | Returns `409 ConflictException` on duplicate title (not 400).                                                                                          |
| Designation delete               | Returns `403 ForbiddenException` if in use (not 409).                                                                                                  |
| Batch groupId/sectionId nullable | `group` and `section` on batch entity are nullable — teaching assignment cascade dropdowns must handle null gracefully.                                |
| Subject `code` is nullable       | `subject.code: string \| null` — never assume it exists in the teaching assignment table.                                                              |
| `batches/:batchId/teachers` route| Lives under `/staff/batches/:batchId/teachers`, NOT under `/academics/batches`.                                                                       |
| Teaching assignments tab         | Only shown for`designation.category === 'TEACHING'`. Backend will throw ConflictException if violated                                                  |
| Invite submit email error        | `409 ConflictException` — show inline error on email field.                                                                                            |
| Permission toggle errors         | Do not show a generic error toast for permission toggles — show inline state on the checkbox itself                                                    |
