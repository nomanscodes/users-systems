# Phase 0.4: Admissions & User Management (RBAC)

**Depends on:** Phase 0.3 (Academic Structure) — all batches must exist before students can be enrolled.  
**Build order within this phase:** 0.4A → 0.4B → 0.4C

---

## 1. Overview

Phase 0.3 built the **skeleton** of the school — branches, sessions, classes, and batches.  
Phase 0.4 **populates that skeleton with people**:

- Staff who run the school
- Students who attend
- Parents who monitor their children
- A permission system that controls who can do what

There are three distinct sub-problems, which must be built in order:

```
Phase 0.4A — RBAC            (Who can do what inside a tenant)
Phase 0.4B — Staff Mgmt      (Employees, their profiles, teacher assignments)
Phase 0.4C — Student Mgmt    (Student profiles, enrollments, parent portal)
```

---

## 2. Phase 0.4A — Role-Based Access Control (RBAC)

### 2.1 The Two-Layer Identity System

The system already has a **coarse-grained identity** via `UserType`:

| UserType | Meaning |
|---|---|
| `SUPER_ADMIN` | Platform owner. No tenant. |
| `SCHOOL_ADMIN` | Principal/Owner of a specific school. |
| `STAFF` | Employee of a school (teacher, accountant, librarian). |
| `STUDENT` | Enrolled student. |
| `PARENT` | Guardian of a student. |

This is **WHO you are** — system-level, hardcoded, never customizable.

Phase 0.4 adds **fine-grained control** via Roles and Permissions:

- **Role** — a label the School Admin creates for their school (e.g., `"Accountant"`, `"Librarian"`)
- **Permission** — a specific action on a specific resource (e.g., `"fees:write"`, `"reports:read"`)
- **Rule:** `UserType` = system decides. `Role` = school admin decides.

### 2.2 Database Schema

```
roles
  id          (PK, UUID)
  tenantId    (FK, tenant-scoped)
  name        varchar(100)     e.g., "Accountant", "Librarian", "Exam Controller"
  description text
  isSystem    boolean DEFAULT false   ← true = system-seeded, cannot delete
  createdAt, updatedAt

permissions
  id          (PK, UUID)
  resource    varchar(50)      e.g., "fees", "attendance", "students"
  action      varchar(50)      e.g., "read", "write", "delete", "export"
  description text
  ← Seeded by the system on startup. NOT user-creatable.
  ← Example: { resource: "fees", action: "write" } = "fees:write"

role_permissions          (junction)
  roleId       (FK → roles.id)
  permissionId (FK → permissions.id)
  PRIMARY KEY (roleId, permissionId)

user_roles                (junction)
  userId     (FK → users.id)
  roleId     (FK → roles.id)
  tenantId   (denormalized for fast tenant-scoped queries)
  assignedAt datetime
  PRIMARY KEY (userId, roleId)
```

### 2.3 System Permissions (Code-Defined, Not User-Creatable)

Permissions are seeded once and never modified by users. This prevents privilege escalation.

```
students:read       students:write      students:delete
staff:read          staff:write
fees:read           fees:write          fees:delete
attendance:read     attendance:write
exams:read          exams:write         exams:publish
reports:read        reports:export
academics:read      academics:write     academics:delete
roles:read          roles:write
```

School Admins can:
- CREATE custom roles (e.g., "Accountant")
- ASSIGN permissions from the fixed list to their roles
- ASSIGN roles to their staff members

School Admins CANNOT:
- Create new permissions
- Grant themselves `SUPER_ADMIN` access

### 2.4 The PermissionGuard

After Phase 0.4A is built, protected endpoints use a `@RequirePermission()` decorator:

```typescript
// Example: only users with "fees:write" can create fee invoices
@Post('fees/invoices')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
@RequirePermission('fees', 'write')
async createInvoice() { ... }
```

The `PermissionGuard` loads the user's roles from DB, then checks if any role has the required permission. `SCHOOL_ADMIN` bypasses permission checks (they have all permissions by default).

### 2.5 JWT Token Strategy

- `userType` already embedded in JWT ✅
- ADD `roleNames: string[]` to JWT payload (e.g., `["Accountant", "Librarian"]`)
- Do NOT embed all permissions (too large, goes stale)
- `PermissionGuard` queries DB for permissions: `user → roles → permissions`
- Permission set is cached per request (lightweight, no Redis needed yet)

### 2.6 API Endpoints

```
POST   /api/v1/roles              ← Create custom role (SCHOOL_ADMIN only)
GET    /api/v1/roles              ← List tenant's roles
PATCH  /api/v1/roles/:id         ← Update role name/description
DELETE /api/v1/roles/:id         ← Delete role (if not assigned to any user)

GET    /api/v1/permissions       ← List all system permissions (read-only)

POST   /api/v1/roles/:id/permissions     ← Assign permissions to a role
DELETE /api/v1/roles/:id/permissions/:permId ← Remove permission from role

POST   /api/v1/staff/:userId/roles  ← Assign roles to a staff member
DELETE /api/v1/staff/:userId/roles/:roleId ← Remove role from staff
```

---

## 3. Phase 0.4B — Staff Management

### 3.1 How Staff Are Added

Staff are added by the SCHOOL_ADMIN through an invite flow:

```
1. SCHOOL_ADMIN calls: POST /api/v1/staff/invite
   Body: { email, firstName, lastName, phone, roleIds[] }

2. System creates a users record with userType = STAFF
   + temporary password (or sends email invite — future feature)

3. System creates staff_profile linked to that user

4. System assigns the provided roleIds to the new staff member

5. Staff member logs in with temporary credentials, resets password
```

### 3.2 Database Schema

```
staff_profiles
  id              (PK, UUID)
  userId          (FK → users.id, UNIQUE) ← one profile per user
  tenantId        (FK)
  employeeId      varchar(50)   ← "EMP-001" (school-assigned)
  designation     varchar(100)  ← "Senior Teacher", "Lab Assistant"
  department      varchar(100)  ← "Science Dept", "Administration"
  joiningDate     date
  qualification   varchar(255)  ← "MSc Physics", "MBA"
  subjectSpecialty varchar(255) ← "Physics, Math" (for teachers)
  salary          decimal(10,2) ← optional, sensitive
  createdAt, updatedAt
```

### 3.3 Teacher Assignments

A teacher is a STAFF member assigned to teach a specific subject in a specific batch:

```
teacher_assignments
  id              (PK, UUID)
  tenantId
  staffProfileId  (FK → staff_profiles.id)
  batchId         (FK → batches.id)        ← which classroom
  subjectId       (FK → subjects.id)       ← which subject
  sessionId       (FK → academic_sessions.id)  ← denormalized for fast queries
  assignedAt      datetime
  ← UNIQUE (staffProfileId, batchId, subjectId)
```

This answers: *"Who teaches Physics in Class 10 Science Section A in 2026?"*

### 3.4 API Endpoints

```
POST   /api/v1/staff/invite             ← Invite + create staff account
GET    /api/v1/staff                    ← List all staff (tenant-scoped)
GET    /api/v1/staff/:id               ← Get single staff profile
PATCH  /api/v1/staff/:id               ← Update staff profile
DELETE /api/v1/staff/:id               ← Deactivate staff account

POST   /api/v1/staff/:id/assignments   ← Assign teacher to batch+subject
GET    /api/v1/staff/:id/assignments   ← List teacher's assignments
DELETE /api/v1/staff/:id/assignments/:assignmentId ← Remove assignment
```

---

## 4. Phase 0.4C — Student Admissions

### 4.1 Core Design Principle: Profile vs Enrollment

The student data is split into two tables deliberately:

| Table | What it holds | Changes? |
|---|---|---|
| `students` | Static identity — DOB, blood group, name | Almost never |
| `student_enrollments` | Academic placement — which batch, which year | Every year (new row) |

When a student is promoted, you create a NEW row in `student_enrollments`. The old row stays forever — preserving their complete academic history.

### 4.2 Database Schema

```
students (static profile)
  id                (PK, UUID)
  tenantId          (FK)
  studentIdNumber   varchar(50)   ← "STU-2026-001" (school-assigned)
  firstName         varchar(100)
  lastName          varchar(100)
  dateOfBirth       date
  gender            ENUM(MALE, FEMALE, OTHER)
  bloodGroup        varchar(5)    ← "A+", "B-", "O+"
  photo             varchar(512)  ← image URL
  nationality       varchar(100)  DEFAULT "Bangladeshi"
  religion          varchar(50)
  presentAddress    text
  permanentAddress  text
  emergencyContact  varchar(100)
  emergencyPhone    varchar(20)
  createdBy         varchar(36)   ← userId of coordinator who admitted
  createdAt, updatedAt

student_enrollments (transactional — one row per year per student)
  id                (PK, UUID)
  tenantId
  studentId         (FK → students.id)
  batchId           (FK → batches.id)      ← The most important FK
  sessionId         (FK → academic_sessions.id)  ← denormalized
  rollNumber        varchar(20)            ← "Roll 01"
  admissionDate     date
  status            ENUM(ACTIVE, TRANSFERRED, GRADUATED, DROPPED)
  transferNote      text                   ← if transferred, where
  ← UNIQUE (studentId, sessionId) ← one enrollment per student per year
  createdAt, updatedAt
```

### 4.3 The Admission Workflow

```
Coordinator opens admission form:

Step 1 — Select Batch (via cascade dropdowns):
  Session  → auto-selected to isCurrent = true
  Branch   → dropdown
  Class    → dropdown
  Group    → dropdown (hidden if school has no groups)
  Section  → dropdown (hidden if school has no sections)
  
  → Frontend calls: POST /batches/resolve → gets batchId

Step 2 — Fill Student Profile:
  First Name, Last Name, DOB, Gender, Blood Group, etc.

Step 3 — Assign Roll Number

Step 4 — Submit → POST /api/v1/students/admit
  Body: {
    batchId: "uuid",
    rollNumber: "01",
    student: { firstName, lastName, dob, ... }
  }
  
  → System creates student record + enrollment record atomically
```

### 4.4 Promotion Flow (Year End)

When a school year ends and students move up:

```
POST /api/v1/students/promote
Body: {
  sourceBatchId: "uuid-class9-science-A-2025",
  targetBatchId: "uuid-class10-science-A-2026",
  studentEnrollmentIds: ["uuid1", "uuid2", ...]
}

→ For each enrollment:
  → Create NEW student_enrollment with targetBatchId + new sessionId
  → Set old enrollment status = GRADUATED (or keep ACTIVE)
  → Old enrollment row is NEVER deleted
```

### 4.5 API Endpoints

```
POST   /api/v1/students/admit          ← Create student + enrollment (atomic)
GET    /api/v1/students                ← List students (tenant-scoped, filterable by batch)
GET    /api/v1/students/:id           ← Get student with all enrollment history
PATCH  /api/v1/students/:id           ← Update static profile
GET    /api/v1/students/:id/enrollments ← Full enrollment history

POST   /api/v1/students/promote        ← Promote batch of students
POST   /api/v1/students/:id/transfer   ← Transfer student to another batch

POST   /api/v1/batches/resolve         ← Resolve cascade dropdown to batchId
GET    /api/v1/batches/:id/students    ← List all enrolled students in a batch
```

---

## 5. Phase 0.4D — Parent Portal

### 5.1 Design

Parents are a special `UserType = PARENT`. Their account is linked to one or more students.

```
guardians (contact info — exists even without a system account)
  id              (PK, UUID)
  tenantId
  studentId       (FK → students.id)
  userId          (FK → users.id, nullable)  ← NULL until portal activated
  relation        ENUM(FATHER, MOTHER, GUARDIAN, SIBLING)
  name            varchar(100)
  phone           varchar(20)
  email           varchar(255)
  occupation      varchar(100)
  isPrimaryContact boolean DEFAULT false
  portalActivated  boolean DEFAULT false
  createdAt, updatedAt
```

### 5.2 Parent Portal Activation Flow

```
1. Coordinator adds guardian info when admitting student (no account yet)
2. Later, coordinator sends "Activate Portal" for a guardian
3. System creates users record with userType = PARENT
4. Links users.id → guardians.userId
5. Parent can now log in and see:
   - Their child's enrolled batch
   - Attendance (Phase 0.5)
   - Exam results (Phase 0.5)
   - Fee invoices (Phase 0.6)
```

---

## 6. Build Order Summary

```
0.4A-1  → seed permissions table on app bootstrap
0.4A-2  → roles, role_permissions tables + CRUD API
0.4A-3  → user_roles table + assign/remove role API
0.4A-4  → PermissionGuard + @RequirePermission() decorator

0.4B-1  → staff_profiles table + invite flow API
0.4B-2  → teacher_assignments table + assignment API

0.4C-1  → students table + student_enrollments table
0.4C-2  → POST /students/admit (atomic: create student + enrollment)
0.4C-3  → GET /batches/resolve endpoint
0.4C-4  → Promotion + transfer flows

0.4D-1  → guardians table + add guardian on admission
0.4D-2  → Parent portal activation flow
```

---

## 7. Phase 0.4 Completion Criteria

The phase is complete when:

- [ ] A SCHOOL_ADMIN can invite staff and assign them custom roles
- [ ] A staff member with `academics:write` can create batches (not just SCHOOL_ADMIN)
- [ ] A coordinator can admit a student into a batch in a single form submission
- [ ] A student's enrollment history is preserved across years after promotion
- [ ] A parent can log in and see their child's enrolled class
- [ ] All new endpoints are protected by `JwtAuthGuard + TenantScopeGuard + PermissionGuard`
