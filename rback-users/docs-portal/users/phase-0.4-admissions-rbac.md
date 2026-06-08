# Phase 0.4: Admissions & User Management (RBAC)

## 1. Overview
After completing the structural foundation of the school in **Phase 0.3**, Phase 0.4 focuses on populating that structure with actual people. This phase introduces Role-Based Access Control (RBAC), Staff Management, and Student Admissions.

## 2. Goals
- Invite teachers and staff to the tenant workspace.
- Define custom roles and permissions.
- Admit students and enroll them into the specific `batches` (classrooms) created in Phase 0.3.
- Link parents/guardians to student profiles.

## 3. Core Entities to be Implemented
1. **`roles` & `permissions`**: To allow the School Admin to create custom roles (e.g., "Accountant", "Librarian") alongside the hardcoded `UserType`.
2. **`staff_profiles`**: Additional data for staff members (e.g., Employee ID, Joining Date, Department) linked to their core `users` record.
3. **`students`**: The static profile of a student (Name, DOB, Parent Info, Blood Group).
4. **`student_enrollments`**: The transactional table that links a `student_id` to a specific `batch_id` for a specific session year.

## 4. Workflows Enabled by this Phase
- **Teacher Assignment:** Assigning a staff member to teach a specific Subject in a specific Batch.
- **Student Admissions:** A frontend UI where a coordinator selects a Batch (e.g., "Class 10 - Science - Sec A (2026)") and registers a new student into it.
- **Parent Portal Access:** Creating credentials for parents to view the performance of their enrolled children.
