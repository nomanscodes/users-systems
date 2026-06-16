# Phase 0.4D — Parent Portal

> **Depends on:** Phase 0.4C (students must exist — parents are linked to students)
> **This is the last step of Phase 0.4**

---

## What We Are Building (Plain English)

When a student is admitted, the coordinator also records the parent's contact information. At this point, the parent has **no login account** — they are just contact info in the system.

Later, the coordinator can activate a **Parent Portal** for a guardian. The system creates a login account for the parent, and they can log in to see their child's class, attendance, results, and fee invoices.

---

## Two Stages for Parents

**Stage 1 — Contact Info Only (at admission)**
The parent's name, phone, and relation are stored. No login. No password. Just information.

**Stage 2 — Portal Activated (later, on request)**
The admin activates the portal. The system creates a `users` record with `userType = PARENT`. The parent receives credentials and can log in.

---

## Database Schema

### `guardians` table
```sql
CREATE TABLE guardians (
  id               VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  tenantId         VARCHAR(36)   NOT NULL,
  studentId        VARCHAR(36)   NOT NULL,
  userId           VARCHAR(36)   NULL,
  relation         ENUM('FATHER','MOTHER','GUARDIAN','SIBLING') NOT NULL,
  name             VARCHAR(100)  NOT NULL,
  phone            VARCHAR(20),
  email            VARCHAR(255),
  occupation       VARCHAR(100),
  isPrimaryContact BOOLEAN       DEFAULT FALSE,
  portalActivated  BOOLEAN       DEFAULT FALSE,
  createdAt        DATETIME      DEFAULT NOW(),
  updatedAt        DATETIME      DEFAULT NOW() ON UPDATE NOW(),

  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)    REFERENCES users(id)    ON DELETE SET NULL,
  INDEX idx_student_guardians (studentId),
  INDEX idx_tenant_guardians (tenantId)
);
```

`userId` is `NULL` until portal is activated. Once activated, it points to the parent's login account in the `users` table.

---

## Portal Activation Flow

```
Step 1 — Coordinator clicks "Activate Portal" for a guardian

Step 2 — POST /api/v1/guardians/:id/activate-portal

Step 3 — System (atomic transaction):
  a. Create users record:
     { email: guardian.email, userType: PARENT,
       tenantId, password: temp-password (hashed) }
  b. Set guardians.userId = new users.id
  c. Set guardians.portalActivated = true

Step 4 — Return temp password to coordinator
  (Future: send email to parent directly)

Step 5 — Parent logs in, sees their child's info
```

---

## What Parents Can See After Login

The parent's JWT contains their `userId`. The system finds all students they are linked to via the `guardians` table.

**Phase 0.4D (now):**
- Their child's name and current enrolled class (batch label)
- Guardian profile (their own contact info)

**Phase 0.5 (future):**
- Attendance records
- Exam results

**Phase 0.6 (future):**
- Fee invoices and payment status

---

## API Endpoints

### Guardian Management (added to student admission)
```
POST   /api/v1/students/:studentId/guardians     ← Add guardian to student
GET    /api/v1/students/:studentId/guardians     ← List all guardians for student
PATCH  /api/v1/guardians/:id                    ← Update guardian contact info
DELETE /api/v1/guardians/:id                    ← Remove guardian
```

### Portal Activation
```
POST   /api/v1/guardians/:id/activate-portal    ← Create login account for parent
POST   /api/v1/guardians/:id/deactivate-portal  ← Disable parent login (isActive = false)
```

### Parent Self-Service (after login)
```
GET    /api/v1/parent/my-children               ← List children linked to this parent
GET    /api/v1/parent/my-children/:studentId    ← Get one child's profile + current enrollment
```

---

## Important Rules

1. **A student can have multiple guardians** (Father + Mother + Emergency contact). No limit.
2. **Only one should be `isPrimaryContact = true`** — this is used for SMS/notification.
3. **Portal deactivation does not delete the users record** — sets `users.isActive = false`.
4. **Parent can only see their own linked children.** The system filters by `guardians.userId = loggedInUserId`.
5. **Parents are tenant-scoped** — a parent account in School A cannot access School B data.

---

## Update to Admission Workflow

The admission form (Phase 0.4C) should be extended to optionally add guardian info at the same time:

```http
POST /api/v1/students/admit
{
  "batchId": "uuid",
  "rollNumber": "15",
  "student": { "firstName", "lastName", "dateOfBirth", "gender", "bloodGroup" },
  "guardians": [
    {
      "relation": "FATHER",
      "name": "Rahman Ali",
      "phone": "01711000000",
      "email": "rahman@email.com",
      "isPrimaryContact": true
    }
  ]
}
```

Backend atomically creates: student + enrollment + all guardian records.

---

## Implementation Checklist

- [ ] Create `GuardianTypeOrmEntity`
- [ ] Add guardian creation to `POST /students/admit` (extend atomic transaction)
- [ ] `POST /students/:studentId/guardians` — add guardian separately
- [ ] `GET /students/:studentId/guardians`
- [ ] `PATCH /guardians/:id`
- [ ] `DELETE /guardians/:id`
- [ ] `POST /guardians/:id/activate-portal` — atomic: create user + link guardian
- [ ] `POST /guardians/:id/deactivate-portal`
- [ ] `GET /parent/my-children` — parent self-service endpoint
- [ ] `GET /parent/my-children/:studentId`
- [ ] Apply guards: `JwtAuthGuard + TenantScopeGuard` on all endpoints

---

## Phase 0.4 Complete

When this phase is done, the system supports:

| Who | Can do what |
|---|---|
| SCHOOL_ADMIN | Full control of their school |
| STAFF (with roles) | Scoped access based on assigned permissions |
| Coordinator (STAFF) | Admit students, manage enrollments |
| PARENT | Login and view their child's class |

The `batch_id` from Phase 0.3 now connects to students, teachers, and parents — ready for Phase 0.5 (Attendance & Exams).
