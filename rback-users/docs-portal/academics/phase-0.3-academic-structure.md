# Phase 0.3: Academic Organization Structure

## 1. Overview

The **Academic Organization Structure** forms the core backbone of a School within our multi-tenant SaaS. Before admitting students, managing fees, or assigning teachers, a newly onboarded School Admin must define their organizational hierarchy.

Based on the requirements, the system supports a highly granular, realistic school structure consisting of **Branches**, **Sessions**, **Classes**, **Groups**, and **Sections**.

---

## 2. Business Requirements

### 2.1 Branches (Campuses)

- A single school (tenant) might operate across multiple physical locations.
- **Branch:** Represents a campus (e.g., "Main Campus", "North Branch").

### 2.2 Academic Sessions (Session Year)

- Schools operate on a yearly basis (e.g., "2026-2027").
- The system must track the start and end dates of a session.
- Only **one** session can be marked as `is_current = true` per tenant.

### 2.3 Classes, Groups, and Sections

- **Class:** Represents the academic level or grade (e.g., "Class 9", "Class 10").
- **Group (Stream):** Represents the track of study. Crucial for higher classes (e.g., "Science", "Commerce", "Arts"). For lower classes, a default "General" group can be used.
- **Section:** A physical classroom subdivision to keep student counts manageable (e.g., "Section A", "Section B", or "Morning Shift").

### 2.4 The "Batch" Concept (Mapping it all together)

Instead of creating dozens of confusing junction tables, modern systems use the concept of a **Batch** (or Classroom Setup).
A "Batch" ties all the dimensions together to represent an actual, physical room of students for a specific year:
_e.g., `Main Campus` -> `2026-2027` -> `Class 10` -> `Science` -> `Section A`_

### 2.5 Subjects

- Represents the curriculum (e.g., "Physics", "Accounting").
- Subjects are assigned to a specific **Class** and **Group** (e.g., "Physics" is assigned to "Class 10 + Science Group").

---

## 3. Database Schema Design (TypeORM)

Every table MUST include a `tenant_id` to strictly enforce data isolation.

### Master Data Tables (Tenant-scoped)

1. **`branches`**: `id`, `tenant_id`, `name`, `address`, `contact_number`
2. **`academic_sessions`**: `id`, `tenant_id`, `name`, `start_date`, `end_date`, `is_current`
3. **`classes`**: `id`, `tenant_id`, `name`, `numeric_value` (for sorting, e.g., 10)
4. **`groups`**: `id`, `tenant_id`, `name` (e.g., "Science", "General")
5. **`sections`**: `id`, `tenant_id`, `name` (e.g., "Section A")
6. **`subjects`**: `id`, `tenant_id`, `name`, `code`, `type` (Mandatory/Optional)

### Mapping Tables

7. **`batches` (The Core Setup Table)**
   This table combines the dimensions to create active classrooms where students will actually be enrolled.
   - `id` (PK)
   - `tenant_id` (FK)
   - `branch_id` (FK)
   - `session_id` (FK)
   - `class_id` (FK)
   - `group_id` (FK)
   - `section_id` (FK)
   - _Index on (branch, session, class, group, section) to ensure uniqueness._

8. **`subject_allocations`**
   - `id` (PK)
   - `tenant_id` (FK)
   - `class_id` (FK)
   - `group_id` (FK)
   - `subject_id` (FK)

---

## 4. API Endpoints Plan

All endpoints belong under the prefix: `/api/v1/academics/`
**Guards applied:** `JwtAuthGuard`, `TenantScopeGuard`

### 4.1 Master Data Endpoints

Standard CRUD endpoints for the building blocks:

- `/academics/branches` (GET, POST, PATCH, DELETE)
- `/academics/sessions` (GET, POST, PATCH, DELETE)
- `/academics/classes` (GET, POST)
- `/academics/groups` (GET, POST)
- `/academics/sections` (GET, POST)
- `/academics/subjects` (GET, POST)

### 4.2 Setup / Allocation Endpoints

Where the building blocks are tied together:

- `POST /academics/batches` — Creates a valid combination (e.g., mapping Section A to Class 10 Science in the Main Branch).
- `POST /academics/subject-allocations` — Maps subjects to a specific Class+Group combination.

---

## 5. Managing Student Historical Data

To preserve a student's history across multiple years, we strictly separate the static **Student Profile** from their **Academic Enrollment**.

1. **`students` table:** Holds static data (e.g., Name, DOB, Blood Group, Parent Info).
2. **`student_enrollments` table:** Links a `student_id` to a specific `batch_id` for a specific session.

**How History is Preserved:**
When John is admitted to Class 10 in 2026, he gets ONE record in `student_enrollments` linked to the 2026 Class 10 Batch. All his exams, attendance, and fee invoices for that year are inherently tied to _that specific enrollment record_.
Next year, when John is promoted to Class 11, a **brand new row** is created in `student_enrollments` linking him to the new Class 11 Batch. The 2026 record remains untouched, preserving his exact history, grades, and class-section assignment for that specific year in perpetuity.

---

## 6. UI/UX & Coordinator Workflow

Managing internal database UUIDs (like `batch-001`) is a usability nightmare for school staff. The backend architecture supports two ways to abstract this complexity in the Frontend UI:

**Method A: Cascading Dropdowns (Recommended for Admissions)**
When admitting a student or taking attendance, the coordinator sees simple dropdowns:

1. **Session:** Auto-selected to the current active session (e.g., `2026-2027`)
2. **Class:** User selects `Class 10`
3. **Group:** User selects `Science`
4. **Section:** User selects `Section A`

Upon form submission, the frontend sends these IDs to the backend. The backend silently looks up the `batches` table to find the exact `batch_id` representing this combination and executes the logic.

<!-- **Method B: Auto-Generated Human-Readable Names**
If a single dropdown list of all active classrooms is required (e.g., when filtering a report), the backend automatically concatenates the relations into a human-readable string.
Instead of showing UUIDs, the coordinator's dropdown options look like this:
* `"Class 10 - Science - Section A (2026-2027)"`
* `"Class 10 - Science - Section B (2026-2027)"`
The coordinator selects the plain-English string, but the frontend sends the `batch_id` UUID to the server behind the scenes. -->
