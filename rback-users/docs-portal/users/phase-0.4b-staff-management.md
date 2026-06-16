# Phase 0.4B — Staff Management

> **Depends on:** Phase 0.4A (RBAC) — roles must exist before staff can be assigned roles.
> **Depends on:** Phase 0.3 (batches must exist for teacher assignments)

---

## What We Are Building (Plain English)

The School Admin needs to add their employees to the system. Thanks to the architecture from Phase 0.4A, there are two paths:

**Path 1: Adding a Teacher**
The admin selects "Teacher". The system creates a `TEACHER` user account. No complex roles are needed. The admin then assigns them to a classroom. The teacher automatically gets the powers to run that classroom.

**Path 2: Adding Other Staff**
The admin selects "Staff". The system creates a `STAFF` user account. The admin MUST select custom roles (like "Accountant" or "Librarian") so the system knows what this person is allowed to do.

Each employee (Teacher or Staff) gets:
1. A **login account** (userType = `TEACHER` or `STAFF`)
2. A **staff profile** (job details — designation, department, joining date)
3. **Role assignments** (optional for teachers, mandatory for staff)
4. **Teaching assignments** (only for teachers — which subject in which batch)

After this phase, the system knows:
> "Ahmed Khan is a TEACHER. He teaches Physics in Class 10 Science Section A."
> "Rina Begum is STAFF. Her role is Accountant."

---

## Database Schema

### `staff_profiles` table
```sql
CREATE TABLE staff_profiles (
  id               VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
  userId           VARCHAR(36)    NOT NULL UNIQUE,
  tenantId         VARCHAR(36)    NOT NULL,
  employeeId       VARCHAR(50),
  designation      VARCHAR(100),
  department       VARCHAR(100),
  joiningDate      DATE,
  qualification    VARCHAR(255),
  subjectSpecialty VARCHAR(255),
  salary           DECIMAL(10,2),
  createdAt        DATETIME       DEFAULT NOW(),
  updatedAt        DATETIME       DEFAULT NOW() ON UPDATE NOW(),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
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
    designation, department,
    userType: "TEACHER",             ← Can be "TEACHER" or "STAFF"
    roleIds: []                      ← Optional if TEACHER. Required if STAFF.
  }

Step 2 — System creates users record:
  { email, firstName, lastName,
    userType: from payload,
    tenantId: admin's tenantId,
    password: temp-password (hashed) }

Step 3 — System creates staff_profiles record:
  { userId: new user's id,
    tenantId,
    designation,
    department }

Step 4 — System assigns roles from roleIds (if any):
  INSERT INTO user_roles (userId, roleId, tenantId)

Step 5 — Staff member receives credentials
  (for now: return temp password in response)
  (future: send email with login link)
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

- [ ] Create `StaffProfileTypeOrmEntity`
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
Students are admitted into batches — batches and staff must already exist.
