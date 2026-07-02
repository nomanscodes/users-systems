# Subject Allocation — Design & Architecture Notes

**Module:** Academic Configuration → Curriculum Matrix  
**Status:** Under Implementation  
**Last Updated:** 2026-07-02

---

## 1. What is Subject Allocation?

Subject Allocation is the process of defining which subjects a student must study based on their **Class** and **Group**.

> **Key Rule:** Subjects differ ONLY by **Class + Group** combination. Section has no effect on subject assignment.

Example:
- Class 9 — Science → Physics, Chemistry, Biology, Math, English
- Class 9 — Commerce → Accounting, Business Studies, Economics, English
- Class 6 — Common (no group) → English, Bengali, Math, Science, History

---

## 2. Data Model (Backend)

The backend stores each allocation as a separate row in `subject_allocations`:

```
subject_allocations
├── id          (UUID)
├── tenantId    (string)
├── classId     (FK → classes)
├── groupId     (FK → groups, NULLABLE)
└── subjectId   (FK → subjects)
```

**Unique constraint:** `(tenantId, classId, groupId, subjectId)` — prevents duplicate assignments.

A class with **no group** stores `groupId = null` (Common/General students).

---

## 3. The Curriculum Matrix UI

The UI is a **Kanban-style board** where:
- Each **column** = one unique `Class + Group` combination
- Each **card inside a column** = one allocated subject
- You can **drag subjects** from the left panel into columns
- You can **add subjects** via the "+ Add Subject" dialog (multi-select)
- You can **remove subjects** by hovering a card and clicking the trash icon
- Every action **auto-saves** immediately to the backend — no manual Save button

---

## 4. The Column Source Problem (Key Design Decision)

### ❌ Wrong Approach 1: Classes Only
Build one column per class → completely misses group-based differentiation.

### ❌ Wrong Approach 2: Classes × Groups (Cartesian Product)
Multiply every class by every group → creates invalid combinations.  
Example: "Class 6 — Science" would appear, but Class 6 has no groups!

### ❌ Wrong Approach 3: One column per Batch
A Batch = `Branch + Session + Class + Group + Section`.  
Class 6 with Section A and Section B would create **two separate columns**, but they share the same subjects because Section does NOT affect curriculum.

### ✅ Correct Approach: Unique Class + Group from Batches (Deduplicated)

**Algorithm:**
1. Fetch all Batches from the backend (Batches are admin-configured, valid combinations)
2. Extract only `classId + groupId` from each Batch
3. **Deduplicate** by `classId + groupId` — ignore `sectionId` entirely
4. Each unique `(classId, groupId)` pair = one column in the matrix

**Why this is correct:**
- Batches are admin-confirmed valid programs — no invalid class+group combos possible
- Section is completely ignored — two sections in the same class+group share one column
- New group-specific columns appear automatically as soon as a Batch is created for that combo

### Result Example

| Batches in DB | Columns in Matrix |
|---|---|
| Class 6 - None - Sec A | Class 6 — Common |
| Class 6 - None - Sec B | *(deduplicated, same column)* |
| Class 9 - Science - Sec A | Class 9 — Science |
| Class 9 - Science - Sec B | *(deduplicated, same column)* |
| Class 9 - Commerce - Sec A | Class 9 — Commerce |
| Class 10 - Science - Sec A | Class 10 — Science |

---

## 5. Implementation Status

| Task | Status |
|---|---|
| Backend API: `GET /v1/academics/subject-allocations` | ✅ Done |
| Backend API: `POST /v1/academics/subject-allocations` | ✅ Done |
| Backend API: `DELETE /v1/academics/subject-allocations/:id` | ✅ Done |
| Frontend: Kanban Matrix UI | ✅ Done |
| Frontend: Drag-and-drop from subject panel | ✅ Done |
| Frontend: Auto-save on add/remove | ✅ Done |
| Frontend: Column source — use deduplicated Batches | ⚠️ Pending Fix |

---

## 6. Pending Fix — Column Building Logic

**File:** `frontend/src/app/(main)/dashboard/subject-allocations/page.tsx`

**Current (incorrect) behavior:**
```typescript
// Adds all classes as "Common" columns
// Only adds group columns if an allocation ALREADY exists for that group
```

**Required fix:**
```typescript
// 1. Fetch batches via useQueryBatches()
// 2. Deduplicate by classId + groupId
// 3. Build columns from unique (classId, groupId) pairs
// 4. Sections are completely ignored in this logic
```

> ⚠️ This fix is blocked until any additional loopholes in the design are identified and resolved first.

---

## 7. The Big Loophole — Batch Configuration (Class Configure Page)

### The Problem

The current `ClassConfig` data model applies **sections uniformly across ALL groups** of a class:

```typescript
// Current ClassConfig type
{
  groupsOn: boolean,
  groupIds: string[],     // e.g. [Science, Commerce, Arts]
  sectionsOn: boolean,
  sectionIds: string[]   // e.g. [Section A, Section B]
}
```

The `payloadsFor()` utility then generates batches using a **Cartesian product** of groupIds × sectionIds:

```
Class 10 × [Science, Commerce, Arts] × [Section A, Section B]
  → Class 10 - Science  - Section A
  → Class 10 - Science  - Section B  ← INVALID: Science has only 1 section!
  → Class 10 - Commerce - Section A
  → Class 10 - Commerce - Section B  ← INVALID: Commerce has no sections!
  → Class 10 - Arts     - Section A  ✅
  → Class 10 - Arts     - Section B  ✅
```

This forces every group to have the same set of sections — which is **not real-world accurate**.

### Real-World Requirement

Different groups within the same class can have **different numbers of sections** (or no sections at all):

```
Class 10
├── Science  → no sections (one big class)
├── Commerce → Section A only
└── Arts     → Section A + Section B
```

### Root Cause (Code)

File: `class-configure/_components/utils.ts` — `payloadsFor()` function:

```typescript
// WRONG: flat Cartesian product — sections applied to ALL groups
for (const g of groupIds) {
  for (const s of sectionIds) {   // ← same sections for every group!
    out.push({ branchId, sessionId, classId, groupId: g, sectionId: s });
  }
}
```

File: `class-configure/_components/types.ts` — `ClassConfig` type:
```typescript
// WRONG: sectionIds is shared across all groups
type ClassConfig = {
  groupsOn: boolean;
  groupIds: string[];
  sectionsOn: boolean;
  sectionIds: string[];  // ← applies to ALL groups uniformly
};
```

### Required Fix

Sections must be configurable **per-group**, not per-class.

The `ClassConfig` needs to change to:
```typescript
// CORRECT: each group has its own section list
type GroupConfig = {
  groupId: string;
  sectionIds: string[];  // empty = no sections for this group
};

type ClassConfig = {
  groupsOn: boolean;
  groups: GroupConfig[];  // replaces flat groupIds + sectionIds
  // For no-group case:
  noGroupSectionIds: string[];  // sections when groupsOn = false
};
```

The UI for the class config card would then show:
- Enable Groups toggle
- If groups enabled: for each selected group → its own section picker
- If groups disabled: one shared section picker for the class

### Impact on Subject Allocation

This loophole also affects the **Curriculum Matrix** because:
- If phantom batches exist (e.g., `Class 10 - Science - Section B` which shouldn't exist), the subject allocation column builder could potentially create incorrect columns
- However, since the column builder deduplicates by `classId + groupId` only (ignoring sectionId), phantom batches do NOT cause wrong columns — they just create extra unused batches in the DB

### Priority

| Area | Impact | Priority |
|---|---|---|
| Batch Config UI (class-configure) | High — creates phantom batches | 🔴 Must Fix |
| Subject Allocation columns | Low — deduplicated, not affected | 🟡 Acceptable for now |

---

*Document maintained by the development team. Update this file as architectural decisions are made.*
