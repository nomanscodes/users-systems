# Phase 0.3: Academics Module - Frontend Implementation Guide

## Overview

The Academics module is the core domain of the Educational ERP. Before a school can create a physical classroom (Batch) or assign teachers (Subject Allocation), they must define their basic academic building blocks.

This guide outlines the Phase 1 implementation of the **Academic Configuration Data**, focusing exclusively on the 6 independent foundational entities:

1. **Branches**
2. **Sessions** (Academic Years)
3. **Classes** (Grade Levels)
4. **Groups** (Streams/Tracks)
5. **Sections** (Room divisions)
6. **Subjects**

---

## 1. Data Contracts (DTOs)

**Location:** `src/features/academics/types/academics.dto.ts`

We will create strict TypeScript interfaces mirroring the backend payload requirements for all 6 entities.

### Exact Backend Payload Definitions

```typescript
// 1. Branch
export interface CreateBranchPayload {
  name: string; // Max 255
  address?: string;
  contactNumber?: string; // Max 50
}

// 2. Session
export interface CreateSessionPayload {
  name: string; // e.g., "2026-2027"
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  isCurrent?: boolean;
}

// 3. Class
export interface CreateClassPayload {
  name: string; // e.g., "Class 10"
  numericValue: number; // e.g., 10 (Minimum 1)
}

// 4. Group
export interface CreateGroupPayload {
  name: string; // e.g., "Science"
}

// 5. Section
export interface CreateSectionPayload {
  name: string; // e.g., "Section A"
}

// 6. Subject
export enum SubjectType {
  MANDATORY = "MANDATORY",
  OPTIONAL = "OPTIONAL",
}

export interface CreateSubjectPayload {
  name: string; // Max 255
  code?: string; // Max 50
  type?: SubjectType;
}
```

---

## 2. API Service Layer

**Location:** `src/features/academics/api/academics.service.ts`

We will implement a unified `AcademicsService` class using our existing `api-client.ts`. It will contain standard CRUD operations for each of the 6 entities.

### Endpoint Mapping

- **Branches:** `/v1/academics/branches`
- **Sessions:** `/v1/academics/sessions`
- **Classes:** `/v1/academics/classes`
- **Groups:** `/v1/academics/groups`
- **Sections:** `/v1/academics/sections`
- **Subjects:** `/v1/academics/subjects`

Each entity will have 5 methods: `getAll()`, `getById()`, `create()`, `update()`, and `delete()`.

---

## 3. React Query Hooks

**Location:** `src/features/academics/hooks/`

To ensure the UI remains fast and updates instantly upon modification, we will build isolated React Query hooks for each entity.

- **Queries:** `useBranches()`, `useClasses()`, etc.
- **Mutations:** `useCreateBranch()`, `useUpdateClass()`, `useDeleteSubject()`, etc.

**Note:** Mutations must call `queryClient.invalidateQueries({ queryKey: ['entityName'] })` on success to trigger automatic UI refreshes.

---

## 4. UI Implementation: The Setup Dashboard

**Location:** `src/app/(main)/dashboard/academic-setup/`

Instead of creating 6 separate pages in the sidebar, we will build a single, cohesive **"Academic Configuration"** page utilizing Tabs.

### Layout Structure

- **Tabs Navigation:** `[Branches] | [Sessions] | [Classes] | [Groups] | [Sections] | [Subjects]`
- **Data Table (Per Tab):** Displays a clean list of existing records with "Edit" and "Delete" actions.
- **Add/Edit Modal:** A reusable dialog component containing a `react-hook-form` connected to `zod` validation schemas based exactly on the payloads defined above.

---

## 🚀 Next Phase: Batches & Subject Allocation

**IMPORTANT:** The implementation of **Batches** (Classrooms) and **Subject Allocations** is strictly deferred to the _next phase_.

**Why?**
A `Batch` in the backend is a complex composite entity requiring the resolution of `Branch + Session + Class + Group + Section`.
We cannot build the "Create Batch" UI until the foundational configuration data (implemented in this guide) exists, as the Batch UI will require dynamic, cascading dropdown menus populated directly from these 6 entities.

Once the Academic Setup tabs are complete, we will proceed to building the Cascading Dropdown Wizard for Batches.
