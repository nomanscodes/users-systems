# Enterprise Frontend Architecture Plan (Next.js)

This document outlines the strict, enterprise-grade architecture for the Frontend of the User System. It is designed for massive scalability, particularly focusing on how to manage large feature sets and complex Role-Based Access Control (RBAC).

## 1. Feature-Driven Architecture (Domain-Driven)

Instead of grouping files by their technical type (e.g., putting all services in one folder, all components in another), we group them by **Feature** (Domain). This prevents the codebase from becoming an unmanageable monolith when you have hundreds of APIs and components.

### Feature Module Structure

Every major domain (Auth, Tenants, Users, Billing) gets its own isolated folder inside `src/features/`. A feature folder should be entirely self-contained:

```text
src/features/auth/
 ┣ api/                  # The API Caller (auth.service.ts)
 ┣ types/                # DTOs and Interfaces (auth.dto.ts)
 ┣ hooks/                # React Query hooks (useLogin.ts)
 ┣ components/           # Feature-specific UI (LoginForm.tsx)
 ┗ store/                # Feature-specific Zustand store (if needed)
```

**Rule:** Features can import from shared global folders (like `src/components/ui`), but a feature should NEVER import directly from the internal files of another feature. They must communicate through public APIs or global stores.

---

## 2. The 5-Layer Data Flow (Inside a Feature)

Within each feature, data flows through 5 strict layers to ensure separation of concerns:

1. **The Contract (`types/`):** Zod schemas and TypeScript interfaces that perfectly match the NestJS backend payloads.
2. **The Core Network Engine (`src/lib/api-client.ts`):** A globally shared Axios/Fetch wrapper that injects tokens and handles 401 Unauthorized errors for the whole app.
3. **The Service Layer (`api/`):** Functions that map URLs to endpoints (e.g., `apiClient.post('/v1/auth/login')`).
4. **The Hooks (`hooks/`):** React Query (`useMutation`, `useQuery`) that wraps the Service layer to handle loading states and caching.
5. **The Presentation Layer (`components/`):** "Dumb" React components that capture clicks and render data.

---

## 3. Managing RBAC & Permissions

When dealing with a complex SaaS that has Super Admins, Tenant Admins, and Staff, permission logic can quickly leak everywhere and cause chaos. We manage RBAC using a **Centralized Authorization Engine**.

### A. Global Auth State

- **Location:** `src/stores/auth.store.ts` (using Zustand)
- **Responsibility:** Holds the current user object, their `role` (e.g., `SUPER_ADMIN`), and their `tenantId`.

### B. The Permission Gate (UI Layer)

Instead of writing `if (user.role === 'SUPER_ADMIN')` inside 50 different buttons, we create a reusable `<PermissionGuard>` component.

```tsx
// Example Usage:
<PermissionGuard requiredRole="SUPER_ADMIN">
  <DeleteTenantButton />
</PermissionGuard>
```

### C. Route-Level RBAC (Middleware)

- **Location:** `src/middleware.ts`
- **Responsibility:** Next.js middleware intercepts the request _before_ the page renders. If a user tries to visit `/dashboard/super-admin` but their token says they are a `SCHOOL_ADMIN`, the middleware instantly redirects them to `/unauthorized`.

---

## 4. Directory Structure Map

```text
src/
 ┣ app/                  # Next.js App Router (Pages, Layouts, Routing)
 ┣ components/           # GLOBAL Reusable UI (Shadcn, Buttons, Inputs, Layouts)
 ┣ features/             # FEATURE-DRIVEN MODULES (The core of the app)
 ┃ ┣ auth/               # Auth domain (login, register logic)
 ┃ ┣ tenants/            # Tenant domain (school management)
 ┃ ┗ users/              # RBAC user management (staff, admins)
 ┣ lib/                  # GLOBAL UTILITIES
 ┃ ┣ api-client.ts       # Core network engine & interceptors
 ┃ ┣ rbac/               # Permission logic, constants, role definitions
 ┃ ┗ utils.ts            # Tailwind merges, formatters
 ┣ stores/               # GLOBAL STATE
 ┃ ┗ auth.store.ts       # Zustand store for user session
 ┗ middleware.ts         # Route-level RBAC & Auth protection
```

---

## 5. Implementation Roadmap

### Phase 1: Global Foundation

1. Install `@tanstack/react-query` and `axios`.
2. Build `src/lib/api-client.ts` with auth interceptors.
3. Set up the `auth.store.ts` using Zustand to hold the user's role and token.

### Phase 2: Feature Migration (Auth & Tenants)

1. Create `src/features/auth/` and `src/features/tenants/`.
2. Move the `RegisterPage` logic into `src/features/tenants/hooks/useRegisterTenant.ts`.
3. Create the `<PermissionGuard>` component in the global components folder.

### Phase 3: Route Protection

1. Implement `src/middleware.ts` to strictly enforce route access based on the JWT role.
