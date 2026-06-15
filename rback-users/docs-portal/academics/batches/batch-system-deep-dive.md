# 📚 Batch System — Complete Guide

> **Who should read this?** Any developer or product person working on the academic module.
> **What you'll learn:** What a Batch is, why it exists, all the real-world patterns schools use, how to create one, and what needs to be fixed.

---

## 🧠 Start Here — What is a Batch?

Imagine you are a school coordinator. You want to take attendance for today.

You don't say _"take attendance for all students."_
You say:

> _"Take attendance for **Class 10, Science group, Section A** — at the **Main Campus** — for the year **2026–2027**."_

That specific combination — **Campus + Year + Class + Stream + Division** — is exactly what a **Batch** is.

```
🏫 Main Campus  +  📅 2026–2027  +  🎓 Class 10  +  🔬 Science  +  🪑 Section A
                                                                          │
                                                                          ▼
                                                                    BATCH ID: abc-123
```

The **Batch ID** is a single UUID that represents all of that context. Every downstream piece of data — attendance records, exam marks, fee invoices, teacher assignments — stores this `batch_id`. It's the most important foreign key in the entire system.

---

## 📦 What a Batch IS and IS NOT

| ✅ A Batch IS...                      | ❌ A Batch IS NOT...          |
| ------------------------------------- | ----------------------------- |
| A unique coordinate for one classroom | A list of students            |
| A permanent historical record         | Something deleted at year end |
| The anchor for all downstream data    | A timetable or schedule       |
| Created once, referenced forever      | Recreated every year          |

---

## 🧩 The 5 Dimensions of a Batch

A batch is built from up to 5 building blocks. Some are always required. Some are optional depending on how the school is structured.

| Dimension   | Answers                       | Required?   | Example                   |
| ----------- | ----------------------------- | ----------- | ------------------------- |
| **Branch**  | _Where?_ (which campus)       | ✅ Always   | Main Campus, North Branch |
| **Session** | _When?_ (which academic year) | ✅ Always   | 2026–2027                 |
| **Class**   | _What level?_                 | ✅ Always   | Class 5, Class 10         |
| **Group**   | _Which stream/subject track?_ | ⚪ Optional | Science, Commerce, Arts   |
| **Section** | _Which room division?_        | ⚪ Optional | Section A, Morning Shift  |

> **Key rule:** Group and Section are both optional. Many schools don't use them at all.

---

## 🏫 Real-World School Patterns (The Problem)

This is a **SaaS platform serving many schools.** Every school organizes itself differently. The system must support all of them without forcing schools into an unnatural structure.

Here are the 4 real patterns seen across schools in Bangladesh and South Asia:

---

### Pattern 1 — Class Only

_Small schools, single classroom per grade, no divisions_

```
Branch + Session + Class
```

**Example:** `Main Campus → 2026–2027 → Class 5`

**Who uses this?** Small rural schools, madrashas, single-section per grade

```json
{
  "branchId": "uuid-main-campus",
  "sessionId": "uuid-2026-2027",
  "classId": "uuid-class-5"
}
```

---

### Pattern 2 — Class + Section (No Group)

_Primary/secondary schools with multiple rooms per grade, but no subject streams_

```
Branch + Session + Class + Section
```

**Example:** `Main Campus → 2026–2027 → Class 7 → Section B`

**Who uses this?** Government schools (Class 1–8), large primary schools

```json
{
  "branchId": "uuid-main-campus",
  "sessionId": "uuid-2026-2027",
  "classId": "uuid-class-7",
  "sectionId": "uuid-section-b"
}
```

---

### Pattern 3 — Class + Group (No Section)

_Higher secondary where each stream is one classroom — no further divisions_

```
Branch + Session + Class + Group
```

**Example:** `Main Campus → 2026–2027 → Class 11 → Science`

**Who uses this?** HSC-level (Class 11–12) where Science/Commerce/Arts are separate classrooms

```json
{
  "branchId": "uuid-main-campus",
  "sessionId": "uuid-2026-2027",
  "classId": "uuid-class-11",
  "groupId": "uuid-science"
}
```

---

### Pattern 4 — Class + Group + Section (Full)

_Large secondary schools with multiple sections per stream_

```
Branch + Session + Class + Group + Section
```

**Example:** `Main Campus → 2026–2027 → Class 10 → Science → Section A`

**Who uses this?** Big city schools, cadet colleges, large secondary schools

```json
{
  "branchId": "uuid-main-campus",
  "sessionId": "uuid-2026-2027",
  "classId": "uuid-class-10",
  "groupId": "uuid-science",
  "sectionId": "uuid-section-a"
}
```

---

### Quick Reference Table

| School Type                      | Group?                       | Section?                   | Pattern   |
| -------------------------------- | ---------------------------- | -------------------------- | --------- |
| Small rural school (all grades)  | ❌                           | ❌                         | Pattern 1 |
| Primary school (Class 1–5)       | ❌                           | ✅ A, B                    | Pattern 2 |
| Government secondary (Class 6–8) | ❌                           | ✅ A, B, C                 | Pattern 2 |
| HSC level (Class 11–12)          | ✅ Science / Commerce / Arts | ❌                         | Pattern 3 |
| Large secondary (Class 9–10)     | ✅ Science / Commerce / Arts | ✅ A, B                    | Pattern 4 |
| Large school with shift system   | ❌                           | ✅ Morning / Day / Evening | Pattern 2 |

---

## 👤 Who Creates Batches?

**Right now (Phase 0.3):** Only `SCHOOL_ADMIN` can create batches.

**After Phase 0.4 (RBAC):** Any staff member with the `academics:write` permission can also create batches. The School Admin assigns this permission to roles like "Academic Coordinator."

In a real school, the person who sets up batches is typically:

- The **Principal** or **Vice Principal**
- The **Academic Coordinator**
- The **Admissions Officer**

---

## 📅 When Are Batches Created?

Batches are created **once per academic year**, usually in January/February before the new session begins.

```
📆 Yearly Timeline:

Dec / Jan ──► Create new Session (e.g., "2027")
Jan / Feb ──► Create all Batches for the new Session
Feb onwards ► Admit students into Batches (Phase 0.4)
All year ────► Attendance, exams, fees all reference batch_id
Nov / Dec ──► Session ends → promote students → new enrollments next year
```

### ⚠️ Important: Old Batches Are NEVER Deleted

When the 2026 session ends, the `batches` rows for 2026 stay in the database forever. They are historical records. A student who attended `Class 10 – Science – Section A` in 2026 will always have that exact record linked to their exam results and attendance.

The admin simply creates **new batches** for the new session. The old ones remain.

---

## ♻️ The Yearly Clone Feature (Recommended)

Creating 20+ batches manually every January is painful. The system should support cloning batches from one session to another:

```http
POST /api/v1/academics/sessions/{newSessionId}/clone-batches
Body: { "sourceSessionId": "old-session-uuid" }
```

**What it does:**

1. Fetches all batches from `sourceSessionId`
2. Creates identical batches for `newSessionId` (same branch, class, group, section)
3. Returns how many batches were created

This turns a 20-minute task into a single click.

---

## 🔧 How to Create a Batch — Step by Step

### Step 1: Make sure prerequisites exist

Before creating a batch, these records must already exist in the database:

```
✅ Branch   (e.g., "Main Campus")
✅ Session  (e.g., "2026–2027" — should be marked isCurrent = true)
✅ Class    (e.g., "Class 10")
✅ Group    (e.g., "Science") ← only if your school uses groups
✅ Section  (e.g., "Section A") ← only if your school uses sections
```

### Step 2: Call the API

```http
POST /api/v1/academics/batches
Authorization: Bearer <SCHOOL_ADMIN_TOKEN>
Content-Type: application/json
```

Use the appropriate pattern for your school (see patterns 1–4 above).

### Step 3: What the system does internally

```
1. 🔐 Extract tenantId from JWT (never accepted from request body)
2. ✅ Run parallel checks — do all provided IDs belong to this tenant?
3. 🔍 Check for duplicate combination
4. 💾 INSERT into batches table
5. 📤 Return the created batch with all relation details
```

---

## 🖥️ How the Admin Thinks About Batches (The Mental Model)

This is the most critical thing to understand. Read this carefully.

### ❓ The Question You Are Asking

> _"How does the admin know which batch to assign a student to? Do they need to remember batch IDs?"_

**Answer: No. Never. Not even once.**

The admin never sees a Batch ID (UUID). They never memorize anything. The system makes this completely invisible.

Here is how the admin thinks:

> _"Ahmed is a new student. He will be in **Class 10, Science group, Section A** at the **Main Campus** for **2026–2027**."_

That's it. That's the complete thought. The admin selects those 5 human-readable values from dropdowns — and the system automatically finds the matching Batch ID behind the scenes.

---

### 🎯 How Student Assignment Actually Works (Step by Step)

Let's walk through the **exact real-world experience** of a school coordinator admitting a student.

---

**Scenario:** Ahmed just enrolled. He belongs in Class 10 Science, Section A.

---

**Step 1 — Coordinator opens the "Admit Student" form**

The form shows cascading dropdowns. Nothing about UUIDs:

```
┌─────────────────────────────────────────┐
│  📋 New Student Admission               │
├─────────────────────────────────────────┤
│                                         │
│  WHERE & WHEN:                          │
│  Session:  [ 2026–2027 ▼ ] ← auto      │  ← auto-filled (isCurrent = true)
│  Branch:   [ Main Campus ▼ ]           │
│                                         │
│  WHICH CLASS:                           │
│  Class:    [ Class 10 ▼ ]              │
│  Group:    [ Science ▼ ]               │  ← only shown if school uses groups
│  Section:  [ Section A ▼ ]             │  ← only shown if school uses sections
│                                         │
└─────────────────────────────────────────┘
```

The coordinator selects: **Main Campus → 2026–2027 → Class 10 → Science → Section A**

---

**Step 2 — The system silently finds the Batch ID**

As soon as the coordinator finishes the dropdown selections, the frontend calls:

```http
POST /api/v1/academics/batches/resolve
{
  "branchId":  "uuid-main-campus",
  "sessionId": "uuid-2026-2027",
  "classId":   "uuid-class-10",
  "groupId":   "uuid-science",
  "sectionId": "uuid-section-a"
}
```

The system finds the matching batch and returns:

```json
{
  "success": true,
  "data": {
    "batchId": "abc-123-xyz",
    "label": "Class 10 – Science – Section A (2026–2027)"
  }
}
```

The `batchId` is now **stored silently in the frontend state**. The coordinator never sees it.

---

**Step 3 — Coordinator fills in student details**

```
┌─────────────────────────────────────────┐
│  STUDENT DETAILS                        │
├─────────────────────────────────────────┤
│  First Name:   [ Ahmed        ]         │
│  Last Name:    [ Rahman       ]         │
│  Date of Birth:[ 2010-05-12   ]         │
│  Gender:       [ Male ▼       ]         │
│  Blood Group:  [ B+ ▼         ]         │
│  Roll Number:  [ 15           ]         │
└─────────────────────────────────────────┘

        [ Submit Admission ]
```

---

**Step 4 — Coordinator clicks Submit**

The frontend sends ONE request to the backend:

```http
POST /api/v1/students/admit
{
  "batchId": "abc-123-xyz",        ← the silent batch ID
  "rollNumber": "15",
  "student": {
    "firstName": "Ahmed",
    "lastName": "Rahman",
    "dateOfBirth": "2010-05-12",
    "gender": "MALE",
    "bloodGroup": "B+"
  }
}
```

The backend atomically:

1. Creates the student profile in `students` table
2. Creates the enrollment in `student_enrollments` linking student → batch

Done. Ahmed is now enrolled in Class 10 Science Section A for 2026–2027.

---

### 🔑 The Key Insight

The coordinator's mental model is always in **plain human language**:

```
"Class 10 → Science → Section A"
```

The system's internal model is always a **Batch ID**:

```
"abc-123-xyz"
```

The `resolve` endpoint is the **translation bridge** between these two worlds.
The admin never crosses into the system's world. They always stay in their own language.

---

### 📋 What Happens When the Admin Lists Students?

When the coordinator opens a class roster, they don't search by batch ID.
They say: _"Show me all students in Class 10 Science Section A."_

The frontend sends those dropdown values to the resolve endpoint first → gets `batchId` → then calls:

```http
GET /api/v1/batches/{batchId}/students
```

The response shows a clean student list:

```
📋 Class 10 – Science – Section A (2026–2027)
   Main Campus

   Roll │ Name           │ Status
   ─────┼────────────────┼────────
   01   │ Ahmed Rahman   │ Active
   02   │ Fatima Akter   │ Active
   03   │ Karim Hossain  │ Active
```

Again — no UUIDs visible to the admin anywhere.

---

### 🔄 What Happens Each New Year?

The coordinator does NOT need to re-assign students to new batches manually one by one.

**Year-end promotion flow:**

```
Coordinator clicks: "Promote Class 10 Science Section A → Class 11 Science"

System:
  → Takes all ACTIVE students from the 2026 batch
  → Creates NEW student_enrollment rows for the 2027 batch
  → Old 2026 enrollment rows stay forever (history preserved)
  → Students now appear in Class 11 Science for 2027
```

One click. All students promoted. History never lost.

---

### 💡 Summary: The Admin Never Needs to Remember Batch IDs

| What the admin sees                                   | What happens in the system                              |
| ----------------------------------------------------- | ------------------------------------------------------- |
| Selects "Class 10, Science, Section A" from dropdowns | Frontend resolves → `batchId: "abc-123"`                |
| Clicks "Admit Student"                                | Backend stores `student_enrollment.batchId = "abc-123"` |
| Opens "Class 10 Science" roster                       | Frontend resolves → `GET /batches/abc-123/students`     |
| Promotes class to next year                           | Backend creates new enrollments with new `batchId`      |

**The Batch ID lives entirely inside the database and API layer. The admin lives entirely inside plain English labels.**

> **Note:** The `POST /batches/resolve` endpoint and `GET /batches/:id/students` endpoint both need to be built before Phase 0.4 admissions work begins.

---

## 🏷️ Batch Labels (Human-Readable Names)

The system should be able to generate a clean, human-readable name for any batch. This is used in:

- Attendance sheets
- Report headers
- Parent portal display
- Dropdown lists

**Label format:** `Class → Group (if exists) → Section (if exists) → (Session)`

| Pattern                 | Generated Label                              |
| ----------------------- | -------------------------------------------- |
| Class only              | `Class 5 (2026–2027)`                        |
| Class + Section         | `Class 7 – Section B (2026–2027)`            |
| Class + Group           | `Class 11 – Science (2026–2027)`             |
| Class + Group + Section | `Class 10 – Science – Section A (2026–2027)` |

---

## 🐛 Current Bugs That Must Be Fixed

### Bug 1 — `sectionId` is Wrongly Mandatory

**The problem:** The current `batches` entity makes `sectionId` required (`NOT NULL`). This means a school using Pattern 1 or Pattern 3 (no section) **cannot create a batch at all** without inventing a fake "default section."

```typescript
// ❌ CURRENT (Wrong)
@Column({ type: 'varchar', length: 36 })
sectionId: string;  // NOT NULL — breaks all schools without sections

// ✅ FIX
@Column({ type: 'varchar', length: 36, nullable: true })
sectionId: string | null;
```

The DTO also needs to change:

```typescript
// ❌ CURRENT
@IsUUID()
@IsNotEmpty()
sectionId: string;  // Required field

// ✅ FIX
@IsUUID()
@IsOptional()
sectionId?: string;  // Optional field
```

**Requires:** a database migration to change the column from `NOT NULL` to `NULL`.

---

### Bug 2 — NULL Values Break the Unique Constraint

**The problem:** The database unique index includes `groupId` and `sectionId`. In SQL, `NULL ≠ NULL`. This means two rows with `sectionId = NULL` are treated as different rows — the uniqueness check fails silently.

**Example of what goes wrong:**

```sql
-- These two rows would BOTH be inserted even though they are identical
INSERT INTO batches (tenantId, branchId, sessionId, classId, groupId, sectionId)
VALUES ('t1', 'b1', 's1', 'c1', NULL, NULL);

INSERT INTO batches (tenantId, branchId, sessionId, classId, groupId, sectionId)
VALUES ('t1', 'b1', 's1', 'c1', NULL, NULL); -- ← No error! Duplicate created.
```

**The fix** — check for duplicates in application code before inserting, using `IS NULL` for null fields:

```typescript
// In academics.service.ts — createBatch()
import { IsNull } from 'typeorm';

const existing = await this.batchRepo.findOne({
  where: {
    tenantId,
    branchId: dto.branchId,
    sessionId: dto.sessionId,
    classId: dto.classId,
    groupId: dto.groupId ?? IsNull(),
    sectionId: dto.sectionId ?? IsNull(),
  },
});

if (existing) {
  throw new ConflictException('This classroom batch already exists.');
}
```

---

### Bug 3 — Missing `resolve` Endpoint

**The problem:** The frontend needs to convert cascade dropdown selections into a `batch_id`. No endpoint exists for this yet.

**The fix:** Add `POST /academics/batches/resolve` before Phase 0.4 admissions work begins.

---

## ✅ Summary Checklist (Before Phase 0.4)

| Task                                      | Status                     |
| ----------------------------------------- | -------------------------- |
| Make `sectionId` nullable in entity       | ❌ Not done                |
| Make `sectionId` optional in DTO          | ❌ Not done                |
| Write DB migration for nullable sectionId | ❌ Not done                |
| Fix duplicate check to handle NULL fields | ❌ Not done                |
| Build `POST /batches/resolve` endpoint    | ❌ Not done                |
| Build session clone endpoint              | ❌ Not done (nice to have) |

All items marked ❌ must be completed before student admissions (Phase 0.4C) can be built.
