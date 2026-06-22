# Phase 0.4B — Staff Management

> **Depends on:** Phase 0.4A (RBAC) — roles must exist before staff can be assigned roles.
> **Depends on:** Phase 0.3 (batches must exist for teacher assignments)

---

## What We Are Building (Plain English)

The School Admin needs to add their employees to the system. Thanks to the architecture from Phase 0.4A, all employees are treated strictly as `STAFF`. There is no separate `TEACHER` user type.

**Adding Staff (Including Teachers)**
The admin invites an employee to the system.

1. **Designation (Job Title & Category):** The admin selects an official Designation (e.g., "Senior Science Teacher", which is categorized as `TEACHING`). This ensures the user appears correctly in UI filters (like the "Assign Teacher" dropdown).
2. **Roles (Permissions):** The admin MUST select custom roles (like "Teacher", "Accountant") so the system knows what this person is allowed to do.

Each employee gets:

1. A **login account** (userType = `STAFF`)
2. A **staff profile** (linked to an official `designationId` instead of a free-text string)
3. **Role assignments** (mandatory for all staff to have permissions)
4. **Teaching assignments** (only for staff with a `TEACHING` designation — which subject in which batch)

After this phase, the system knows:

> "Ahmed Khan is STAFF with the 'Senior Science Teacher' designation and 'Teacher' role."
> "Rina Begum is STAFF with the 'Chief Accountant' designation and 'Accountant' role."

---

## Database Schema

### `designations` table (Lookup Table)

```sql
CREATE TABLE designations (
  id              VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
  tenantId        VARCHAR(36)    NOT NULL,
  title           VARCHAR(100)   NOT NULL,
  category        ENUM('TEACHING', 'NON_TEACHING', 'ADMIN') DEFAULT 'NON_TEACHING',
  createdAt       DATETIME       DEFAULT NOW(),
  updatedAt       DATETIME       DEFAULT NOW() ON UPDATE NOW(),

  INDEX idx_tenant_designation (tenantId)
);
```

### `staff_profiles` table

```sql
CREATE TABLE staff_profiles (
  id               VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
  userId           VARCHAR(36)    NOT NULL UNIQUE,
  tenantId         VARCHAR(36)    NOT NULL,
  designationId    VARCHAR(36)    NOT NULL,
  employeeId       VARCHAR(50),
  department       VARCHAR(100),
  joiningDate      DATE,
  qualification    VARCHAR(255),
  subjectSpecialty VARCHAR(255),
  salary           DECIMAL(10,2),
  createdAt        DATETIME       DEFAULT NOW(),
  updatedAt        DATETIME       DEFAULT NOW() ON UPDATE NOW(),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (designationId) REFERENCES designations(id),
  INDEX idx_tenant_staff (tenantId)
);
```

### `teacher_assignments` table

```sql
CREATE TABLE teacher_assignments (
  id             VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  tenantId       VARCHAR(36)  NOT NULL,
  staffProfileId VARCHAR(36)  NOT NULL,
  batchId        VARCHAR(36)  NOT NULL,
  subjectId      VARCHAR(36)  NOT NULL,
  sessionId      VARCHAR(36)  NOT NULL,
  assignedAt     DATETIME     DEFAULT NOW(),

  UNIQUE KEY uq_teacher_batch_subject (staffProfileId, batchId, subjectId),
  FOREIGN KEY (staffProfileId) REFERENCES staff_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (batchId)        REFERENCES batches(id),
  FOREIGN KEY (subjectId)      REFERENCES subjects(id),
  INDEX idx_batch_subject (batchId, subjectId)
);
```

`sessionId` is denormalized (copied from the batch's session) so you can query "all assignments this year" without joining batches.

---

## Staff Invite Flow (Step by Step)

The admin does NOT create a username/password manually. The system handles it.

```
Step 1 — Admin fills invite form:
  { email, firstName, lastName, phone,
    designationId: "uuid-from-designations-table",
    department,
    userType: "STAFF",               ← Always "STAFF" for employees
    roleIds: ["uuid-for-role"]       ← Mandatory so the user has permissions
  }

Step 2 — System creates users record:
  { email, firstName, lastName,
    userType: "STAFF",
    tenantId: admin's tenantId,
    password: temp-password (hashed) }

Step 3 — System creates staff_profiles record:
  { userId: new user's id,
    tenantId,
    designationId,
    department }

Step 4 — System assigns roles from roleIds (if any):
  INSERT INTO user_roles (userId, roleId, tenantId)

Step 5 — Credentials & Login Lifecycle
  1. The API returns the plain-text temporary password in the JSON response to the Admin.
  2. The Admin securely hands this temporary password to the new staff member.
  3. The staff member logs in using their email and the temporary password.
  4. (Best Practice) The frontend detects the use of a temporary password and immediately forces the staff member to set their own private password before accessing the dashboard.
  (future: The system skips the Admin and automatically emails the staff member a secure "Set Your Password" link).
```

Everything in Steps 2–4 happens in a **single database transaction**. If any step fails, everything rolls back.

---

## Teacher Assignment Flow

After a staff member exists, the admin assigns them to teach a subject in a batch:

```
Admin selects:
  Staff:   Ahmed Khan
  Subject: Physics
  Batch:   Class 10 – Science – Section A (resolved via batch resolve endpoint)

POST /api/v1/staff/:staffId/assignments
Body: { batchId, subjectId }
```

The system checks:

1. Does the staff member belong to this tenant?
2. Does the batch belong to this tenant?
3. Does the subject belong to this tenant?
4. Is this assignment already made? (UNIQUE constraint)

---

## API Endpoints

### Designation Management

```
POST   /api/v1/designations    ← Create new official job title & category
GET    /api/v1/designations    ← List all designations for tenant
PATCH  /api/v1/designations/:id ← Update title or category
DELETE /api/v1/designations/:id ← Delete (fails if assigned to staff)
```

### Staff Account Management

```
POST   /api/v1/staff/invite    ← Create user + profile + assign roles (atomic)
GET    /api/v1/staff           ← List all staff (tenant-scoped)
GET    /api/v1/staff/:id       ← Get one staff member with profile
PATCH  /api/v1/staff/:id       ← Update profile fields
DELETE /api/v1/staff/:id       ← Deactivate (set isActive = false on users record)
```

### Role Assignment (uses Phase 0.4A)

```
POST   /api/v1/staff/:id/roles           ← Assign role(s) to staff
DELETE /api/v1/staff/:id/roles/:roleId   ← Remove role from staff
GET    /api/v1/staff/:id/roles           ← List staff's current roles
```

### Teaching Assignments

```
POST   /api/v1/staff/:id/assignments                    ← Assign to batch + subject
GET    /api/v1/staff/:id/assignments                    ← List all assignments
DELETE /api/v1/staff/:id/assignments/:assignmentId      ← Remove assignment
GET    /api/v1/batches/:batchId/teachers               ← Who teaches in this batch?
```

---

## What Staff Members Can See After Login

When a STAFF user logs in, they see their own profile and their assigned batches/subjects.

The system can answer:

- "What classes does Ahmed Khan teach?" → `GET /staff/:id/assignments`
- "Who teaches Physics in Class 10 Science?" → `GET /batches/:id/teachers?subjectId=uuid`

---

## Important Rules

1. **One staff profile per user.** The `userId` column has a UNIQUE constraint.
2. **Deactivation, not deletion.** When a staff member leaves, set `users.isActive = false`. Never delete — historical assignments must remain.
3. **Teacher assignments are session-aware.** A teacher teaches Physics in Class 10 in 2026. Next year, a new assignment is created for 2027. Old assignments stay for history.
4. **Salary is sensitive.** Only expose it to SCHOOL_ADMIN and users with `staff:read` permission. Never include in student-facing or parent-facing responses.

---

## Implementation Checklist

- [ ] Create `DesignationTypeOrmEntity`
- [ ] Create `DesignationsModule` (entity, service, controller)
- [ ] Create `StaffProfileTypeOrmEntity` (linking to Designation)
- [ ] Create `TeacherAssignmentTypeOrmEntity`
- [ ] Create `StaffModule` (entity, service, controller)
- [ ] Implement `POST /staff/invite` with transaction (user + profile + roles)
- [ ] Implement staff CRUD endpoints
- [ ] Implement `POST /staff/:id/assignments`
- [ ] Implement `GET /batches/:batchId/teachers`
- [ ] Apply `PermissionGuard` with `staff:write` on write endpoints

---

## Next Step

Once this is done → **Phase 0.4C (Student Admissions)**
Students are admitted into batches — batches, staff, and designations must already exist.
