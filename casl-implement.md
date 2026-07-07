# CASL Permission-Based UI & Route Protection — Implementation Guide

> **Project:** SMS SaaS (School Management System)
> **Stack:** NestJS Backend + Next.js Frontend
> **Date:** 2026-07-07

---

## Why This Exists

Currently the system has **backend-only** permission enforcement:

```
User clicks "Create Branch" → API call → PermissionGuard checks DB → 403 Forbidden
```

The user **sees the button**, clicks it, waits for the API, and gets an error. Industry standard is to **hide or disable** UI elements the user cannot access, and **block routes** before the page loads.

---

## What Is CASL?

[CASL](https://casl.js.org/) is a **permissions/authorization library** for JavaScript that works on both frontend and backend.

- **Framework agnostic** — works with React, Vue, Angular, Node.js, NestJS
- **Isomorphic** — same rules run on server and client
- **Type-safe** — full TypeScript support
- **Lightweight** — ~6KB gzipped
- **Actively maintained** — 15K+ GitHub stars

### Core Concepts

| CASL Term | Your System Equivalent | Example |
|-----------|----------------------|---------|
| **Subject** | `resource` in permissions table | `'Academics'`, `'Staff'`, `'Roles'` |
| **Action** | `action` in permissions table | `'read'`, `'write'` |
| **Ability** | Collection of permission rules | `can('read', 'Academics')` |
| **`<Can>`** | Permission-aware React component | Only renders children if allowed |

---

## Your Permission Model → CASL Mapping

```
┌──────────────┬────────┬─────────────────────────────────────┐
│ resource     │ action │ CASL Equivalent                     │
├──────────────┼────────┼─────────────────────────────────────┤
│ academics    │ read   │ can('read', 'Academics')            │
│ academics    │ write  │ can('manage', 'Academics')          │
│ staff        │ read   │ can('read', 'Staff')                │
│ staff        │ write  │ can('manage', 'Staff')              │
│ roles        │ read   │ can('read', 'Roles')                │
│ roles        │ write  │ can('manage', 'Roles')              │
└──────────────┴────────┴─────────────────────────────────────┘
```

---

## Pros and Cons

### ✅ Pros

| # | Benefit | Details |
|---|---------|---------|
| 1 | **Single source of truth** | Permission rules defined once, used on both frontend and backend |
| 2 | **Better UX** | Users never see buttons they can't click. No more "403 after clicking" |
| 3 | **Declarative UI** | `<Can I="write" a="Academics">` is cleaner than `if (permissions.includes(...))` |
| 4 | **Type-safe** | Full TypeScript support — catch permission typos at compile time |
| 5 | **Isomorphic** | Same ability factory logic on backend and frontend — no duplication |
| 6 | **Conditional permissions** | Future: `can('read', 'Staff', { department: 'Science' })` |
| 7 | **Field-level permissions** | Future: hide salary field from non-admins |
| 8 | **Ownership checks** | Future: teachers can only edit their own assignments |
| 9 | **Testable** | Ability rules are pure functions — easy to unit test |
| 10 | **Industry standard** | 15K+ GitHub stars, actively maintained |
| 11 | **Lightweight** | ~6KB gzipped — negligible bundle impact |
| 12 | **Framework agnostic** | Works with any framework if you migrate |
| 13 | **Scalable** | Works cleanly with 50+ resources |
| 14 | **Route protection** | Same ability rules can guard routes in middleware |

### ❌ Cons

| # | Drawback | Details | Mitigation |
|---|----------|---------|------------|
| 1 | **Learning curve** | New concepts: Ability, Subject, `<Can>` | 1-2 days. Good docs available |
| 2 | **Extra dependency** | `@casl/ability` (~3KB) + `@casl/react` (~3KB) | Negligible — you already use 20+ packages |
| 3 | **JWT size increase** | Permissions array adds ~200-400 bytes | Negligible — JWTs are typically <2KB |
| 4 | **Migration effort** | Update existing pages to use `<Can>` | Gradual — page by page |
| 5 | **Permission sync** | User must re-login after permission changes | Acceptable. Can add refresh endpoint later |
| 6 | **Overkill for tiny apps** | Manual checks fine for 2-3 permissions | You have 6+ and growing — justified |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                       │
│                                                               │
│  LoginUseCase → queries permissions → adds to JWT            │
│  PermissionGuard → checks JWT permissions (fast)             │
└───────────────────────────┬──────────────────────────────────┘
                            │
                    Same permission data
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                       FRONTEND (Next.js)                      │
│                                                               │
│  AuthStore → stores permissions[] from JWT                   │
│  usePermission() → creates CASL Ability from permissions     │
│  <Can I="write" a="Academics"> → hides buttons              │
│  Middleware → blocks unauthorized routes                      │
│  Sidebar → filters menu items                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend — Permissions in JWT

#### Step 1.1: Update LoginUseCase

File: `rback-users/src/modules/auth/application/use-cases/login.use-case.ts`

```typescript
// After the existing roleNames query, add:
let permissions: string[] = [];
if (user.userType === UserType.SCHOOL_ADMIN) {
  const allPerms = await this.permissionRepo.find();
  permissions = allPerms.map(p => `${p.resource}.${p.action}`);
} else if (user.userType === UserType.STAFF) {
  const query = `
    SELECT DISTINCT p.resource, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.roleId = rp.roleId
    JOIN permissions p ON rp.permissionId = p.id
    WHERE ur.userId = ?
  `;
  const perms = await this.userRepo.query(query, [user.id]);
  permissions = perms.map((p: any) => `${p.resource}.${p.action}`);
}

// Update JWT sign:
const accessToken = this.jwtService.sign({
  sub: user.id,
  email: user.email,
  userType: user.userType,
  tenantId: user.tenantId ?? null,
  tokenVersion: user.tokenVersion,
  roleNames,
  permissions,  // ← NEW
});
```

#### Step 1.2: Update JwtPayload Interface

File: `rback-users/src/modules/auth/interface/strategies/jwt.strategy.ts`

```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  userType: UserType;
  tenantId: string | null;
  tokenVersion: number;
  roleNames?: string[];
  permissions?: string[];  // ← NEW
  iat: number;
  exp: number;
}
```

#### Step 1.3: Optimize PermissionGuard

File: `rback-users/src/common/guards/permission.guard.ts`

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const requiredPermission = this.reflector.getAllAndOverride<PermissionRequirements>(
    PERMISSION_KEY, [context.getHandler(), context.getClass()]
  );
  if (!requiredPermission) return true;

  const request = context.switchToHttp().getRequest();
  const user = request.user as JwtPayload;
  if (!user) throw new ForbiddenException('No user found');

  if (user.userType === UserType.SCHOOL_ADMIN) return true;

  // Fast check from JWT (no DB query needed)
  const permKey = `${requiredPermission.resource}.${requiredPermission.action}`;
  if (user.permissions?.includes(permKey)) return true;

  // Fallback to DB check
  const hasPermission = await this.checkUserPermission(
    user.sub, user.tenantId,
    requiredPermission.resource, requiredPermission.action,
  );
  if (!hasPermission) throw new ForbiddenException(...);
  return true;
}
```

---

### Phase 2: Frontend — CASL Integration

#### Step 2.1: Install Dependencies

```bash
cd frontend
npm install @casl/ability @casl/react
```

#### Step 2.2: Create Ability Factory

Create: `frontend/src/lib/casl/ability.ts`

```typescript
import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

type Actions = 'manage' | 'read' | 'create' | 'update' | 'delete';
type Subjects = 'Academics' | 'Staff' | 'Roles' | 'Designations' | 'all';
export type AppAbility = MongoAbility<[Actions, Subjects]>;

const RESOURCE_TO_SUBJECT: Record<string, Subjects> = {
  academics: 'Academics',
  staff: 'Staff',
  roles: 'Roles',
  designations: 'Designations',
};

const ACTION_MAP: Record<string, Actions> = {
  read: 'read',
  write: 'manage',
};

export function defineAbilitiesFor(permissions: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (permissions.includes('*')) {
    can('manage', 'all');
    return build();
  }

  for (const perm of permissions) {
    const [resource, action] = perm.split('.');
    const subject = RESOURCE_TO_SUBJECT[resource];
    const caslAction = ACTION_MAP[action];
    if (subject && caslAction) can(caslAction, subject);
  }

  return build();
}
```

#### Step 2.3: Create Ability Context Provider

Create: `frontend/src/lib/casl/ability-context.tsx`

```tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { createContextualCan } from '@casl/react';
import type { AppAbility } from './ability';

const AbilityContext = createContext<AppAbility>({} as AppAbility);
export const Can = createContextualCan(AbilityContext.Consumer);

export function AbilityProvider({ ability, children }: { ability: AppAbility; children: ReactNode }) {
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

export function useAbility() {
  return useContext(AbilityContext);
}
```

#### Step 2.4: Update AuthStore

File: `frontend/src/stores/auth.store.ts`

```typescript
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  permissions: string[];   // ← NEW
  roleNames?: string[];    // ← NEW
}
```

#### Step 2.5: Create Permission Hook

Create: `frontend/src/hooks/use-permission.ts`

```typescript
'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { defineAbilitiesFor, type AppAbility } from '@/lib/casl/ability';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  const ability = useMemo<AppAbility>(() => {
    if (!user?.permissions) return defineAbilitiesFor([]);
    if (user.userType === 'SCHOOL_ADMIN') return defineAbilitiesFor(['*']);
    return defineAbilitiesFor(user.permissions);
  }, [user?.permissions, user?.userType]);

  const hasPermission = (permission: string): boolean => {
    const [resource, action] = permission.split('.');
    const subjectMap: Record<string, string> = {
      academics: 'Academics', staff: 'Staff', roles: 'Roles', designations: 'Designations',
    };
    const actionMap: Record<string, string> = { read: 'read', write: 'manage' };
    const subject = subjectMap[resource];
    const caslAction = actionMap[action];
    if (!subject || !caslAction) return false;
    return ability.can(caslAction, subject);
  };

  return { ability, hasPermission };
}
```

#### Step 2.6: Wrap App with AbilityProvider

File: `frontend/src/components/providers/index.tsx`

```tsx
'use client';

import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { defineAbilitiesFor } from '@/lib/casl/ability';
import { AbilityProvider } from '@/lib/casl/ability-context';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  const ability = useMemo(() => {
    if (!user?.permissions) return defineAbilitiesFor([]);
    if (user.userType === 'SCHOOL_ADMIN') return defineAbilitiesFor(['*']);
    return defineAbilitiesFor(user.permissions);
  }, [user?.permissions, user?.userType]);

  return (
    <QueryClientProvider client={queryClient}>
      <AbilityProvider ability={ability}>{children}</AbilityProvider>
    </QueryClientProvider>
  );
}
```

---

### Phase 3: Sidebar Filtering

File: `frontend/src/navigation/sidebar/sidebar-items.ts`

```typescript
export interface NavMainItem {
  id: string;
  title: string;
  url: string;
  permission?: string;  // ← NEW
  icon?: LucideIcon;
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1, label: "Main",
    items: [
      { id: "dashboard", title: "Dashboard", url: "/dashboard/default", icon: LayoutDashboard },
    ],
  },
  {
    id: 2, label: "Configuration",
    items: [
      { id: "class-configure", title: "Class Configure", url: "/dashboard/class-configure", icon: Settings2, permission: "academics.read" },
      { id: "academic-setup", title: "Academic Setup", url: "/dashboard/academic-setup", icon: GraduationCap, permission: "academics.read" },
      { id: "subject-allocations", title: "Subject Allocations", url: "/dashboard/subject-allocations", icon: BookMarked, permission: "academics.read" },
    ],
  },
  {
    id: 3, label: "People",
    items: [
      { id: "staff-directory", title: "Staff Directory", url: "/dashboard/staff", icon: Users, permission: "staff.read" },
      { id: "designations", title: "Designations", url: "/dashboard/staff/designations", icon: Briefcase, permission: "staff.read" },
    ],
  },
  {
    id: 4, label: "Access Control",
    items: [
      { id: "roles", title: "Roles & Permissions", url: "/dashboard/roles", icon: ShieldCheck, permission: "roles.read" },
    ],
  },
];
```

Filter in sidebar component:

```tsx
const { hasPermission } = usePermission();
const visibleGroups = sidebarItems
  .map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || hasPermission(item.permission)),
  }))
  .filter(group => group.items.length > 0);
```

---

### Phase 4: Route & Component Guards

Create: `frontend/src/config/route-permissions.ts`

```typescript
export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard/academic-setup':      'academics.read',
  '/dashboard/class-configure':     'academics.read',
  '/dashboard/subject-allocations': 'academics.read',
  '/dashboard/staff':               'staff.read',
  '/dashboard/staff/designations':  'staff.read',
  '/dashboard/roles':               'roles.read',
};
```

Create: `frontend/src/components/auth/require-permission.tsx`

```tsx
'use client';

import { ShieldX } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

export function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <ShieldX className="w-12 h-12 text-muted-foreground/30" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

Usage:

```tsx
// Page-level guard
<RequirePermission permission="academics.read">
  <AcademicConfiguration />
</RequirePermission>

// Button-level — hide
<Can I="manage" a="Academics">
  <Button onClick={createBranch}>Create Branch</Button>
</Can>

// Button-level — disable
<Can I="manage" a="Academics" passThrough>
  {(allowed) => (
    <Button disabled={!allowed} title={!allowed ? 'No permission' : undefined}>
      Create Branch
    </Button>
  )}
</Can>
```

---

### Phase 5: Middleware Route Protection

File: `frontend/src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { ROUTE_PERMISSIONS } from '@/config/route-permissions';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth_status');
  const isAuthenticated = authCookie?.value === 'true';
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/v1/login', request.url));
    }

    const requiredPermission = ROUTE_PERMISSIONS[pathname];
    if (requiredPermission) {
      try {
        const token = request.cookies.get('access_token')?.value;
        if (token) {
          const payload = jwtDecode<{ permissions?: string[]; userType?: string }>(token);
          if (payload.userType !== 'SCHOOL_ADMIN') {
            if (!payload.permissions?.includes(requiredPermission)) {
              return NextResponse.redirect(new URL('/dashboard/default', request.url));
            }
          }
        }
      } catch {
        return NextResponse.redirect(new URL('/auth/v1/login', request.url));
      }
    }
  }

  if (pathname.startsWith('/auth') && isAuthenticated) {
    if (pathname === '/auth/v1/logout') return NextResponse.next();
    return NextResponse.redirect(new URL('/dashboard/default', request.url));
  }

  return NextResponse.next();
}
```

---

## Hide vs Disable

| Strategy | When To Use | Example |
|----------|-------------|---------|
| **Hide** (`<Can>`) | User should never know the feature exists | Delete button for read-only users |
| **Disable** (`passThrough`) | User should see the feature but can't use it | "Create" button for users who might get access later |
| **Route redirect** | User should never access the page | Admin-only pages |

---

## File Structure After Implementation

```
frontend/src/
 ┣ lib/casl/
 ┃ ┣ ability.ts              # Ability factory
 ┃ ┗ ability-context.tsx      # AbilityProvider + <Can>
 ┣ hooks/
 ┃ ┗ use-permission.ts        # usePermission() hook
 ┣ config/
 ┃ ┗ route-permissions.ts     # Route → permission mapping
 ┣ components/auth/
 ┃ ┗ require-permission.tsx   # Page-level guard
 ┣ stores/
 ┃ ┗ auth.store.ts            # Updated with permissions
 ┗ navigation/sidebar/
    ┗ sidebar-items.ts        # Updated with permission field

rback-users/src/
 ┣ modules/auth/
 ┃ ┣ application/use-cases/login.use-case.ts
 ┃ ┗ interface/strategies/jwt.strategy.ts
 ┗ common/guards/
    ┗ permission.guard.ts
```

---

## Migration Strategy (4 Weeks)

### Week 1: Foundation
- [ ] Backend: Add permissions to JWT in LoginUseCase
- [ ] Backend: Update JwtPayload interface
- [ ] Backend: Optimize PermissionGuard to check JWT first
- [ ] Frontend: Install `@casl/ability` + `@casl/react`
- [ ] Frontend: Create `lib/casl/ability.ts` and `ability-context.tsx`
- [ ] Frontend: Update AuthStore with `permissions` field
- [ ] Frontend: Create `usePermission()` hook
- [ ] Frontend: Wrap app with `AbilityProvider`

### Week 2: Sidebar & Routes
- [ ] Add `permission` field to sidebar items
- [ ] Filter sidebar based on user permissions
- [ ] Create `route-permissions.ts` config
- [ ] Update middleware with permission-based route protection

### Week 3: Component Guards
- [ ] Create `<RequirePermission>` page guard component
- [ ] Apply `<Can>` to all action buttons across pages
- [ ] Apply to Academics pages
- [ ] Apply to Staff pages
- [ ] Apply to Roles pages

### Week 4: Testing & Refinement
- [ ] Test SCHOOL_ADMIN sees everything
- [ ] Test Staff with `academics.read` only can view, not create
- [ ] Test Staff with `academics.write` can see create/edit buttons
- [ ] Test Staff with NO permissions sees only Dashboard
- [ ] Test sidebar hides unauthorized items
- [ ] Test direct URL access to unauthorized route redirects
- [ ] Test permission changes take effect after re-login
- [ ] Test `<Can>` hides and disables correctly

---

## Future Enhancements

| Feature | How CASL Helps |
|---------|----------------|
| **Department-scoped access** | `can('read', 'Staff', { department: 'Science' })` |
| **Own-data-only** | `can('manage', 'Assignment', { staffProfileId: user.id })` |
| **Field-level hiding** | `<Can I="read" a="Staff" field="salary">` |
| **Audit logging** | Log `ability.relevantRuleFor(action, subject)` |
| **Dynamic permissions** | Fetch from API instead of JWT for real-time updates |

---

## References

- [CASL Documentation](https://casl.js.org/v6/guide/intro)
- [CASL React Integration](https://casl.js.org/v6/guide/intro)
- [RBAC Spec](docs-portal/users/phase-0.4a-rbac.md)
- [Staff Management Spec](docs-portal/users/phase-0.4b-staff-management.md)
