# 🏫 Bulk Classroom Generator — Feature Documentation

> **Feature:** Generate multiple classroom batches in one operation
> **Endpoint:** `POST /api/v1/academics/batches/bulk-generate`
> **Who uses it:** School Admin (setup phase, once per academic year)

---

## 1. Why This Feature Exists

Without bulk generate, the admin must create each batch one by one:

```
Create: Class 9 – Science – Section A   ← 1 API call
Create: Class 9 – Science – Section B   ← 1 API call
Create: Class 9 – Commerce – Section A  ← 1 API call
Create: Class 9 – Commerce – Section B  ← 1 API call
... repeat for every class
```

For a school with 10 classes, 3 groups, 2 sections → **60 separate API calls.**
With bulk generate → **1 API call. Done.**

---

## 2. The UI Flow (4 Steps)

The admin uses a single page called **"Classroom Bulk Generator"**.

---

### Step 1 — Select Branch & Session

Admin clicks radio buttons to choose:
- Which campus (Branch): `Main Campus` or `North Branch`
- Which academic year (Session): `2026–2027` or `2025–2026`

The session is usually auto-selected to the current active session.

```
BRANCH              SESSION
● Main Campus       ● 2026–2027
○ North Branch      ○ 2025–2026
```

---

### Step 2 — Select Classes

Admin ticks which classes they want to set up classrooms for.
These are checkbox pills loaded from `GET /academics/classes`.

```
☑ Class 1   ☐ Class 2   ☐ Class 3   ☐ Class 4
☐ Class 5   ☐ Class 6   ☑ Class 9   ☑ Class 10
```

Admin selected: **Class 1, Class 9, Class 10**

---

### Step 3 — Configure Each Class Separately

This is the most important step. **Each class gets its own independent configuration.**

The system renders one sub-card per selected class:

```
┌─────────────────────────────────────────── 1 batch ─┐
│ Class 1                                              │
│                                                      │
│ GROUPS / STREAMS          [○ This class has groups]  │
│ No groups — 1 classroom per section                  │
│                                                      │
│ SECTIONS                  [○ This class has sections]│
│ No sections — 1 classroom per group                  │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────── 6 batches┐
│ Class 9                                              │
│                                                      │
│ GROUPS / STREAMS          [● This class has groups]  │
│ [✓ Science] [✓ Commerce] [✓ Arts] [ General]         │
│                                                      │
│ SECTIONS                  [● This class has sections]│
│ [✓ Section A] [✓ Section B] [ Morning] [ Day]        │
└──────────────────────────────────────────────────────┘
```

#### How the batch count badge works per class:

| Groups toggle | Groups selected | Sections toggle | Sections selected | Batches |
|---|---|---|---|---|
| OFF | — | OFF | — | **1** |
| OFF | — | ON | A, B | **2** |
| ON | Science, Commerce | OFF | — | **2** |
| ON | Science, Commerce | ON | A, B | **4** |
| ON | Science, Commerce, Arts | ON | A, B | **6** |

> **Key rule:** Each class is fully independent. Class 1 can have zero groups/sections
> while Class 9 has 3 groups and 2 sections — all in the same single API call.

---

### Step 4 — Preview & Generate

Before clicking generate, the admin sees a live preview of every classroom
that will be created. The count updates instantly as they change any toggle or checkbox.

```
Preview                             [ 7 classrooms will be generated ]

[ Class 1 ]
[ Class 9 – Science – Section A ]   [ Class 9 – Science – Section B ]
[ Class 9 – Commerce – Section A ]  [ Class 9 – Commerce – Section B ]
[ Class 9 – Arts – Section A ]      [ Class 9 – Arts – Section B ]

               [ ✓ Generate 7 Classrooms ]
```

On success:
```
               [ ✅ 7 classrooms created successfully! ]
```

---

## 3. The API Payload

### Endpoint

```http
POST /api/v1/academics/batches/bulk-generate
Authorization: Bearer <SCHOOL_ADMIN_TOKEN>
Content-Type: application/json
```

### Request Body Structure

The payload uses a **per-class array** — NOT a flat group/section list.
This is critical because different classes have different configurations.

```json
{
  "branchId":  "uuid-main-campus",
  "sessionId": "uuid-2026-2027",
  "classes": [
    {
      "classId":    "uuid-class-1",
      "groupIds":   [],
      "sectionIds": []
    },
    {
      "classId":    "uuid-class-9",
      "groupIds":   ["uuid-science", "uuid-commerce", "uuid-arts"],
      "sectionIds": ["uuid-section-a", "uuid-section-b"]
    },
    {
      "classId":    "uuid-class-10",
      "groupIds":   ["uuid-science", "uuid-commerce"],
      "sectionIds": ["uuid-section-a", "uuid-section-b"]
    }
  ]
}
```

### Empty arrays = "no group" or "no section"

```json
"groupIds":   []   ← Class has no streams — use null in batch record
"sectionIds": []   ← Class has no sections — use null in batch record
```

---

## 4. Backend Logic

### Combination Formula Per Class

```
if groupIds is empty AND sectionIds is empty:
  → create 1 batch:  { classId, groupId: null, sectionId: null }

if groupIds is empty AND sectionIds has items:
  → for each sectionId:
       create batch: { classId, groupId: null, sectionId }

if groupIds has items AND sectionIds is empty:
  → for each groupId:
       create batch: { classId, groupId, sectionId: null }

if groupIds has items AND sectionIds has items:
  → for each groupId × each sectionId:
       create batch: { classId, groupId, sectionId }
```

### Duplicate Handling (Safe to Call Multiple Times)

Before inserting each batch, the system checks if it already exists
using the same `IsNull()` duplicate check from `createBatch()`.

- If batch already exists → **skip silently** (do not throw error)
- If batch is new → **insert**

This makes bulk-generate **idempotent** — safe to call again if the admin
accidentally clicks Generate twice or adds more classes later.

### Parallel Processing

All batches are inserted concurrently using `Promise.all()` for performance.
A school with 60 batches should complete in under 500ms.

---

## 5. The Response

```json
{
  "success": true,
  "data": {
    "created": 7,
    "skipped": 0,
    "batches": [
      {
        "id":    "uuid-batch-1",
        "label": "Class 1 (2026–2027)"
      },
      {
        "id":    "uuid-batch-2",
        "label": "Class 9 – Science – Section A (2026–2027)"
      },
      {
        "id":    "uuid-batch-3",
        "label": "Class 9 – Science – Section B (2026–2027)"
      },
      {
        "id":    "uuid-batch-4",
        "label": "Class 9 – Commerce – Section A (2026–2027)"
      },
      {
        "id":    "uuid-batch-5",
        "label": "Class 9 – Commerce – Section B (2026–2027)"
      },
      {
        "id":    "uuid-batch-6",
        "label": "Class 9 – Arts – Section A (2026–2027)"
      },
      {
        "id":    "uuid-batch-7",
        "label": "Class 9 – Arts – Section B (2026–2027)"
      }
    ]
  }
}
```

| Field | Meaning |
|---|---|
| `created` | Number of new batches inserted |
| `skipped` | Number of batches that already existed (not duplicated) |
| `batches` | Full list of all batches that now exist for this operation |

---

## 6. TypeScript DTO

```typescript
// create-batch.dto.ts — add these classes

export class BulkGenerateClassDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  groupIds: string[]; // empty array = class has no groups

  @IsArray()
  @IsUUID('4', { each: true })
  sectionIds: string[]; // empty array = class has no sections
}

export class BulkGenerateBatchDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkGenerateClassDto)
  classes: BulkGenerateClassDto[];
}
```

---

## 7. Implementation Status

| Task | Status |
|---|---|
| `BulkGenerateBatchDto` + `BulkGenerateClassDto` | ❌ Not done |
| `bulkGenerateBatches()` in `AcademicsService` | ❌ Not done |
| `POST /batches/bulk-generate` in `AcademicsController` | ❌ Not done |
| Frontend UI (Lovable prototype exists) | ⏳ Prototype done, integration pending |

---

## 8. Related Documents

- [`batch-system-deep-dive.md`](./batch-system-deep-dive.md) — What a batch is, all 4 patterns, bugs fixed
- [`../users/phase-0.4-admissions-rbac.md`](../users/phase-0.4-admissions-rbac.md) — Phase 0.4: students get enrolled into these batches
