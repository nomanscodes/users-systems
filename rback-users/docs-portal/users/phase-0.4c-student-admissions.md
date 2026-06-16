# Phase 0.4C — Student Admissions

> **Depends on:** Phase 0.3 (batches must exist — students enroll INTO batches)
> **Depends on:** Phase 0.4A (RBAC — for permission-guarded endpoints)

---

## What We Are Building (Plain English)

The coordinator admits a new student by selecting their classroom (batch) and filling in their profile. The system stores two things separately:

- **Student profile** (`students` table) — name, DOB, blood group. Created once, almost never changes.
- **Enrollment** (`student_enrollments` table) — which batch, which year, roll number. A new row is added every year when promoted.

When a student moves from Class 9 to Class 10, a **new enrollment row** is created. The Class 9 row stays forever as history. Nothing is ever deleted.

---

## Database Schema

### `students` table
```sql
CREATE TABLE students (
  id               VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  tenantId         VARCHAR(36)   NOT NULL,
  studentIdNumber  VARCHAR(50),
  firstName        VARCHAR(100)  NOT NULL,
  lastName         VARCHAR(100)  NOT NULL,
  dateOfBirth      DATE,
  gender           ENUM('MALE', 'FEMALE', 'OTHER'),
  bloodGroup       VARCHAR(5),
  photo            VARCHAR(512),
  nationality      VARCHAR(100)  DEFAULT 'Bangladeshi',
  religion         VARCHAR(50),
  presentAddress   TEXT,
  permanentAddress TEXT,
  emergencyContact VARCHAR(100),
  emergencyPhone   VARCHAR(20),
  createdBy        VARCHAR(36),
  createdAt        DATETIME      DEFAULT NOW(),
  updatedAt        DATETIME      DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_tenant_student (tenantId)
);
```

### `student_enrollments` table
```sql
CREATE TABLE student_enrollments (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  tenantId      VARCHAR(36)  NOT NULL,
  studentId     VARCHAR(36)  NOT NULL,
  batchId       VARCHAR(36)  NOT NULL,
  sessionId     VARCHAR(36)  NOT NULL,
  rollNumber    VARCHAR(20),
  admissionDate DATE,
  status        ENUM('ACTIVE','TRANSFERRED','GRADUATED','DROPPED') DEFAULT 'ACTIVE',
  transferNote  TEXT,
  createdAt     DATETIME     DEFAULT NOW(),
  updatedAt     DATETIME     DEFAULT NOW() ON UPDATE NOW(),

  UNIQUE KEY uq_student_session (studentId, sessionId),
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (batchId)   REFERENCES batches(id),
  FOREIGN KEY (sessionId) REFERENCES academic_sessions(id),
  INDEX idx_batch_students (batchId),
  INDEX idx_tenant_enrollment (tenantId)
);
```

`UNIQUE (studentId, sessionId)` — one enrollment per student per year. Prevents double admission.

---

## Admission Workflow

```
Step 1 — Frontend cascade dropdowns load from existing GET endpoints
  Session → Branch → Class → Group? → Section?
  Frontend calls POST /academics/batches/resolve → gets batchId

Step 2 — Fill student details (name, DOB, gender, blood group, roll number)

Step 3 — POST /api/v1/students/admit
{
  "batchId": "uuid",
  "rollNumber": "15",
  "student": { "firstName", "lastName", "dateOfBirth", "gender", "bloodGroup" }
}

Backend (atomic transaction):
  1. Extract tenantId + sessionId from JWT + batch
  2. INSERT into students
  3. INSERT into student_enrollments
  4. COMMIT or ROLLBACK both
```

---

## Year-End Promotion

```http
POST /api/v1/students/promote
{
  "sourceBatchId": "uuid-class9-2025",
  "targetBatchId": "uuid-class10-2026",
  "studentEnrollmentIds": ["uuid1", "uuid2"]
}
```

For each enrollment: create new row for target batch, mark old row as `GRADUATED`. Old row is never deleted.

---

## API Endpoints

```
POST   /api/v1/students/admit            ← Create student + enrollment (atomic)
GET    /api/v1/students                  ← List (filter by batchId, sessionId, status)
GET    /api/v1/students/:id             ← Get student + current enrollment
GET    /api/v1/students/:id/enrollments ← Full history (all years)
PATCH  /api/v1/students/:id            ← Update static profile
POST   /api/v1/students/promote         ← Promote batch to next class
POST   /api/v1/students/:id/transfer    ← Transfer to different batch
GET    /api/v1/batches/:id/students     ← All ACTIVE students in a batch
```

---

## Important Rules

1. Never delete a student — only set enrollment `status = DROPPED`
2. One enrollment per student per session — UNIQUE constraint enforces this
3. `sessionId` is copied from the batch at admission time (denormalized for query speed)
4. Photos are URLs — not file uploads

---

## Implementation Checklist

- [ ] Create `StudentTypeOrmEntity`
- [ ] Create `StudentEnrollmentTypeOrmEntity`
- [ ] Create `StudentsModule` (entities, service, controller)
- [ ] `POST /students/admit` with DB transaction
- [ ] `GET /students` with filters (batchId, sessionId, status, search)
- [ ] `GET /students/:id` with current enrollment
- [ ] `GET /students/:id/enrollments` full history
- [ ] `POST /students/promote`
- [ ] `POST /students/:id/transfer`
- [ ] `GET /batches/:id/students`
- [ ] Apply guards: `JwtAuthGuard + TenantScopeGuard` on all, `PermissionGuard(students:write)` on writes

---

## Next Step

Once done → **Phase 0.4D (Parent Portal)**
