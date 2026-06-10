# Batch System — In-Depth Analysis

**Document:** Deep dive into the Batch concept, all real-world combinations, and how the system handles them  
**Phase:** 0.3 (Academic Structure)  
**Author note:** Written after real-world analysis of how schools actually work in Bangladesh and South Asia

---

## 1. What is a Batch? (Plain English)

A **Batch** is the system's answer to the question:

> *"Which specific classroom does a student sit in, for this specific year?"*

It is NOT:
- A group of students (that's an enrollment)
- A subject or curriculum
- A timetable

It IS:
- A **unique combination of dimensions** that represents one physical or logical classroom in one academic year.

Think of it as a **coordinate system** for a classroom:

```
Branch      →  WHERE  (which campus)
Session     →  WHEN   (which academic year)
Class       →  WHAT LEVEL  (Class 5, Class 10)
Group       →  WHICH STREAM  (Science, Commerce) — OPTIONAL
Section     →  WHICH DIVISION  (A, B, Morning) — OPTIONAL
```

All 5 dimensions together point to exactly ONE classroom. That classroom has a `batch_id`. Everything downstream — attendance, exams, fee invoices, teacher assignments — will link to this `batch_id`.

---

## 2. The Real Problem: Schools Are Not Uniform

This is a **SaaS serving many schools**. Every school organizes itself differently.

### Real-world school patterns across Bangladesh:

| School Type | Uses Groups? | Uses Sections? | Example Batch |
|---|---|---|---|
| Primary school (Class 1–5) | ❌ No | ✅ Yes (A, B) | Class 3, Section A |
| Secondary (Class 6–8) | ❌ No | ✅ Yes | Class 7, Section B |
| SSC level (Class 9–10) | ✅ Yes (Science/Commerce/Arts) | ✅ Yes | Class 10, Science, Section A |
| HSC level (Class 11–12) | ✅ Yes | ❌ No (one class per group) | Class 11, Science |
| Madrasha / Religious | ❌ No | ❌ No (single classroom per level) | Class 5 (no divisions) |
| Large city school | ✅ Yes | ✅ Yes (Morning/Day/Evening) | Class 9, Commerce, Morning |
| Small rural school | ❌ No | ❌ No | Class 8 |

### The 4 real batch patterns:

```
Pattern 1: Class only
  Branch + Session + Class
  → "Main Campus → 2026 → Class 5"
  Used by: small schools, single-classroom-per-grade

Pattern 2: Class + Section (no Group)
  Branch + Session + Class + Section
  → "Main Campus → 2026 → Class 3 → Section A"
  Used by: primary/secondary schools with multiple divisions per class

Pattern 3: Class + Group (no Section)
  Branch + Session + Class + Group
  → "Main Campus → 2026 → Class 11 → Science"
  Used by: HSC level where each stream = one classroom

Pattern 4: Class + Group + Section
  Branch + Session + Class + Group + Section
  → "Main Campus → 2026 → Class 10 → Science → Section A"
  Used by: large secondary schools with multiple sections per stream
```

---

## 3. Current Schema Problem (Critical Gap)

The current `batches` table has this design:

```typescript
groupId:   string | null   // OPTIONAL ✅
sectionId: string          // MANDATORY ❌ — This is WRONG
```

**`sectionId` being mandatory breaks Pattern 1, 2, and 3.** A school using Pattern 1 (class only) would need to create a fake "default section" just to satisfy the constraint. That's not how real schools work.

### Correct design — both optional:

```typescript
groupId:   string | null   // OPTIONAL — null when no group system
sectionId: string | null   // OPTIONAL — null when no section division
```

### The unique constraint must handle NULLs correctly:

The current index:
```
UNIQUE (tenantId, branchId, sessionId, classId, groupId, sectionId)
```

In SQL, `NULL != NULL`. So two rows with `sectionId = NULL` are considered different by the unique constraint — they can both be inserted. This is a bug.

**Solution — use a computed/functional unique index:**

```sql
-- MySQL 8.0+ approach: use a sentinel value instead of NULL
-- Replace NULL with empty string '' for uniqueness purposes
-- OR handle this in application logic by checking for duplicates before insert

-- Recommended application-level approach:
-- Before inserting, check:
SELECT id FROM batches 
WHERE tenantId = ?
  AND branchId = ?
  AND sessionId = ?
  AND classId = ?
  AND (groupId = ? OR (groupId IS NULL AND ? IS NULL))
  AND (sectionId = ? OR (sectionId IS NULL AND ? IS NULL))
```

---

## 4. WHO Creates Batches?

### The Person: SCHOOL_ADMIN (Phase 0.3) → Later: authorized STAFF (Phase 0.4)

Only users with the `SCHOOL_ADMIN` userType can create batches today. After Phase 0.4 RBAC, a staff member with `academics:write` permission will also be able to.

### The Role in the School:
In real Bangladeshi schools, batch setup is done by the **Academic Coordinator** or the **Principal's Office** — not classroom teachers.

---

## 5. WHEN Are Batches Created?

Batches follow a strict **seasonal lifecycle**:

```
Timeline:
  December / January   → New session is created (e.g., "2027")
  January / February   → Batches are created for the new session
  February onwards     → Students are enrolled into batches (Phase 0.4)
  Throughout year      → Attendance, exams, fees reference batch_id
  November / December  → Session ends, students promoted to next class
  → Repeat
```

### Important: Batches Are NOT Deleted Between Years

Old batches from "2025" are **kept forever**. They are historical records. A student who was in "Class 9, Science, Section A, 2025" has that batch forever linked to their enrollment, exam results, and attendance.

The admin simply creates NEW batches for the NEW session. The old ones stay.

### Yearly Clone Pattern (Recommended Feature):

Instead of manually recreating all batches every year, the system should support a "clone session batches" operation:

```
POST /academics/sessions/:newSessionId/clone-batches
Body: { sourceSessionId: "old-session-uuid" }

→ Takes all batches from sourceSession
→ Replaces sessionId with newSessionId
→ Inserts them all for the new year
→ Returns count of cloned batches
```

This saves the admin from re-entering 20+ batch combinations every January.

---

## 6. HOW Batches Are Created — Step by Step

### Prerequisites (must exist before creating batches):

```
Step 1: Branch exists      (e.g., "Main Campus")
Step 2: Session exists     (e.g., "2026-2027" with isCurrent = true)
Step 3: Class exists       (e.g., "Class 10")
Step 4: Group exists       (e.g., "Science") — IF the school uses groups
Step 5: Section exists     (e.g., "Section A") — IF the school uses sections
```

### API Call:

```http
POST /api/v1/academics/batches
Authorization: Bearer <SCHOOL_ADMIN_JWT>
Content-Type: application/json

{
  "branchId":  "uuid-of-main-campus",
  "sessionId": "uuid-of-2026-2027",
  "classId":   "uuid-of-class-10",
  "groupId":   "uuid-of-science",    ← omit if school has no groups
  "sectionId": "uuid-of-section-a"  ← omit if school has no sections
}
```

### What the system does internally:

```
1. Extract tenantId from JWT (never from body)
2. Run parallel existence checks:
   - Does branchId belong to this tenantId?
   - Does sessionId belong to this tenantId?
   - Does classId belong to this tenantId?
   - Does groupId belong to this tenantId? (if provided)
   - Does sectionId belong to this tenantId? (if provided)
3. Check for duplicate combination (handle NULL = NULL correctly)
4. INSERT into batches
5. Return created batch with all relations
```

---

## 7. The 4 Patterns — API Examples

### Pattern 1: Class Only (No Group, No Section)
```json
{
  "branchId": "uuid-branch",
  "sessionId": "uuid-session",
  "classId": "uuid-class-5"
}
```
Result: Represents "Main Campus → 2026 → Class 5 (entire class)"

### Pattern 2: Class + Section (No Group)
```json
{
  "branchId": "uuid-branch",
  "sessionId": "uuid-session",
  "classId": "uuid-class-7",
  "sectionId": "uuid-section-a"
}
```
Result: "Main Campus → 2026 → Class 7 → Section A"

### Pattern 3: Class + Group (No Section)
```json
{
  "branchId": "uuid-branch",
  "sessionId": "uuid-session",
  "classId": "uuid-class-11",
  "groupId": "uuid-science"
}
```
Result: "Main Campus → 2026 → Class 11 → Science (whole stream)"

### Pattern 4: Class + Group + Section (Full)
```json
{
  "branchId": "uuid-branch",
  "sessionId": "uuid-session",
  "classId": "uuid-class-10",
  "groupId": "uuid-science",
  "sectionId": "uuid-section-a"
}
```
Result: "Main Campus → 2026 → Class 10 → Science → Section A"

---

## 8. How the Frontend Uses Batches (Cascade Dropdown Pattern)

When a coordinator admits a student, they should NOT see UUIDs. They should see cascading dropdowns:

```
Session:  [2026-2027 ▼]   ← Auto-selected (isCurrent = true)
Branch:   [Main Campus ▼]
Class:    [Class 10 ▼]
Group:    [Science ▼]      ← Hidden/disabled if school has no groups
Section:  [Section A ▼]    ← Hidden/disabled if school has no sections

→ Frontend sends all selected IDs to:
  POST /api/v1/academics/batches/resolve

→ Backend returns: { batchId: "uuid-of-the-exact-batch" }
→ Frontend uses batchId for the enrollment
```

### The Resolve Endpoint (needs to be built):

```http
POST /api/v1/academics/batches/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "branchId":  "uuid",
  "sessionId": "uuid",
  "classId":   "uuid",
  "groupId":   "uuid-or-null",
  "sectionId": "uuid-or-null"
}

Response:
{
  "success": true,
  "data": {
    "batchId": "uuid-of-resolved-batch",
    "label": "Class 10 – Science – Section A (2026-2027)"
  }
}
```

This endpoint is critical for Phase 0.4 student admissions.

---

## 9. What Must Be Fixed in the Current Implementation

### Fix 1: Make `sectionId` nullable in the entity

```typescript
// batch.typeorm.entity.ts — CHANGE:
@Column({ type: 'varchar', length: 36 })
sectionId: string;

// TO:
@Column({ type: 'varchar', length: 36, nullable: true })
sectionId: string | null;

@ManyToOne(() => SectionTypeOrmEntity, { nullable: true })
@JoinColumn({ name: 'sectionId' })
section: SectionTypeOrmEntity | null;
```

### Fix 2: Make `sectionId` optional in the DTO

```typescript
// create-batch.dto.ts — CHANGE:
@IsUUID()
@IsNotEmpty()
sectionId: string;

// TO:
@IsUUID()
@IsOptional()
sectionId?: string;
```

### Fix 3: Fix duplicate-check in service to handle NULL equality

```typescript
// academics.service.ts — createBatch()
// Add explicit duplicate check before INSERT:
const existing = await this.batchRepo.findOne({
  where: {
    tenantId,
    branchId: dto.branchId,
    sessionId: dto.sessionId,
    classId: dto.classId,
    groupId: dto.groupId ?? IsNull(),     // TypeORM IsNull() for WHERE groupId IS NULL
    sectionId: dto.sectionId ?? IsNull(), // TypeORM IsNull() for WHERE sectionId IS NULL
  },
});
if (existing) {
  throw new ConflictException('This classroom batch already exists.');
}
```

### Fix 4: Add the Resolve endpoint

```typescript
// academics.controller.ts — add:
@Post('batches/resolve')
async resolveBatch(@CurrentUser() user: JwtPayload, @Body() dto: ResolveBatchDto) {
  const data = await this.academicsService.resolveBatch(user.tenantId, dto);
  return success(data, 'Batch resolved.');
}
```

---

## 10. Batch Naming / Label Generation

For display purposes, the backend should be able to generate a human-readable label for any batch. This is needed for:
- Attendance sheets ("Class 10 – Science – Section A (2026-2027)")
- Report headers
- Parent portal display

```typescript
// academics.service.ts
generateBatchLabel(batch: BatchTypeOrmEntity): string {
  const parts: string[] = [batch.classEntity.name];

  if (batch.group) parts.push(batch.group.name);
  if (batch.section) parts.push(batch.section.name);

  parts.push(`(${batch.session.name})`);

  return parts.join(' – ');
  // → "Class 10 – Science – Section A (2026-2027)"
  // → "Class 7 – Section B (2026-2027)"
  // → "Class 5 (2026-2027)"
}
```

---

## 11. Summary: What a Batch Is and Isn't

| ✅ IS | ❌ IS NOT |
|---|---|
| A unique classroom coordinate | A list of students |
| A permanent historical record | Something deleted at year end |
| The anchor FK for all downstream data | A timetable or schedule |
| Configurable per school's structure | Forced to have all 5 dimensions |
| Created once, referenced forever | Recreated every year |

**The batch_id is the most important FK in the entire system.** Once Phase 0.4 is built, every piece of student data — attendance, exams, fees, results — will trace back to a batch_id, which gives it the full context of: who, where, when, what level, and which classroom.
