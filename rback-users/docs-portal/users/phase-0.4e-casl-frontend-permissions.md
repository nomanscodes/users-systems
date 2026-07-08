# Phase 0.4E — CASL Frontend Permission Control

> **Approach:** Static permission constants (mirrors backend table) + JWT permissions
> **Stack:** @casl/ability + @casl/react (frontend only)

---

## Goal

Hide/disable UI elements (buttons, sidebar items, routes) based on user permissions. Currently the backend guards work but the frontend shows everything to everyone.

---

## How It Works (2 Steps)

```
1. Login → Backend puts user's permissions in JWT: ["academics.read", "staff.write"]
2. Frontend → Creates CASL ability from JWT permissions → UI uses <CanPermission>
```

No API call needed. Permission vocabulary is defined in `shared/types/permissions.ts` (static constant mirroring backend table). User's actual permissions come from JWT.

---

## New Files

```
shared/types/
 ┗ permissions.ts              # Permission vocabulary (mirrors backend permissions table)

frontend/src/
 ┣ lib/casl/
 ┃ ┣ ability.ts               # Ability factory
 ┃ ┗ ability-context.tsx       # Provider + <Can> + <CanPermission>
 ┣ hooks/
 ┃ ┗ use-permission.ts         # usePermission() — checks single permission
 ┣ config/
 ┃ ┗ route-permissions.ts      # Route → permission mapping (uses PermissionString type)
 ┗ components/auth/
    ┗ require-permission.tsx   # Page-level guard component
```

## Modified Files

```
frontend/src/
 ┣ stores/auth.store.ts        # Add permissions to AuthUser
 ┗ components/providers/        # Wrap with AbilityProvider

rback-users/src/
 ┣ modules/auth/application/use-cases/login.use-case.ts  # Add permissions to JWT
 ┗ modules/auth/interface/strategies/jwt.strategy.ts     # Update JwtPayload type
```

---

## Permission Vocabulary (Shared Types)

The permission table exists in the backend database. We mirror it as a static constant in the frontend so developers know exactly what's available — no need to query the API.

```typescript
// shared/types/permissions.ts — Mirrors backend permissions table

// ── Valid Actions ─────────────────────────────────────────────
export const PERMISSION_ACTIONS = ['read', 'write'] as const;
export type PermissionAction = typeof PERMISSION_ACTIONS[number];

// ── Valid Resources ───────────────────────────────────────────
export const PERMISSION_RESOURCES = ['academics', 'staff', 'roles'] as const;
export type PermissionResource = typeof PERMISSION_RESOURCES[number];

// ── Type-safe permission string ───────────────────────────────
export type PermissionString = `${PermissionResource}.${PermissionAction}`;

// ── All permissions (mirrors backend permissions table) ───────
// Keep this in sync with permissions-seeder.service.ts
export const PERMISSIONS: Record<string, { resource: string; action: string; description: string }> = {
  ACADEMICS_READ:  { resource: 'academics', action: 'read',  description: 'Can view academic structure' },
  ACADEMICS_WRITE: { resource: 'academics', action: 'write', description: 'Can create/update/delete academics' },
  STAFF_READ:      { resource: 'staff',     action: 'read',  description: 'Can view staff profiles' },
  STAFF_WRITE:     { resource: 'staff',     action: 'write', description: 'Can invite/update/manage staff' },
  ROLES_READ:      { resource: 'roles',     action: 'read',  description: 'Can view roles and permissions' },
  ROLES_WRITE:     { resource: 'roles',     action: 'write', description: 'Can create/update/delete roles' },
} as const;

// ── Helper: get permission string from key ────────────────────
export function perm(key: keyof typeof PERMISSIONS): PermissionString {
  const p = PERMISSIONS[key];
  return `${p.resource}.${p.action}`;
}
```

**How developers use it:**

```typescript
import { perm, type PermissionString } from '@/shared/types/permissions';

// Option 1: Using perm() helper — autocomplete shows all keys
<CanPermission permission={perm('STAFF_READ')}>
<CanPermission permission={perm('ACADEMICS_WRITE')}>

// Option 2: Using string directly — TypeScript validates
<CanPermission permission="staff.read">
<CanPermission permission="academics.write">

// ❌ Both catch errors at compile time:
<CanPermission permission="academics.view">    // Error: "view" not in vocabulary
<CanPermission permission="student.read">      // Error: "student" not in vocabulary
<CanPermission permission={perm('STAFF_VIEW')}> // Error: "STAFF_VIEW" not a key
```

**When to update:** When backend seeder adds a new permission, add it to BOTH:
1. `permissions-seeder.service.ts` (backend)
2. `shared/types/permissions.ts` (frontend)

---

## Implementation

### 1. Backend — Add Permissions to JWT

File: `login.use-case.ts`

```typescript
// After existing roleNames query, add:
let permissions: string[] = [];
if (user.userType === UserType.SCHOOL_ADMIN) {
  const allPerms = await this.permissionRepo.find();
  permissions = allPerms.map(p => `${p.resource}.${p.action}`);
} else {
  const perms = await this.userRepo.query(`
    SELECT DISTINCT p.resource, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.roleId = rp.roleId
    JOIN permissions p ON rp.permissionId = p.id
    WHERE ur.userId = ?
  `, [user.id]);
  permissions = perms.map((p: any) => `${p.resource}.${p.action}`);
}

// Add to JWT sign payload:
accessToken = this.jwtService.sign({
  ...existing,
  permissions, // ← NEW
});
```

File: `jwt.strategy.ts` — Add to JwtPayload:

```typescript
permissions?: string[];  // ← NEW
```

---

### 2. Ability Factory

File: `frontend/src/lib/casl/ability.ts`

```typescript
import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

type Actions = 'manage' | 'read' | 'create' | 'update' | 'delete';
type Subjects = string | 'all';
export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilitiesFor(permissions: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (permissions.includes('*')) {
    can('manage', 'all');
    return build();
  }

  for (const perm of permissions) {
    const [resource, action] = perm.split('.');
    if (action === 'read') can('read', resource);
    if (action === 'write') {
      can('manage', resource);  // manage = all CRUD
      can('read', resource);    // write implies read
    }
  }

  return build();
}
```

---

### 3. Ability Context + CanPermission

File: `frontend/src/lib/casl/ability-context.tsx`

```tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { createContextualCan } from '@casl/react';
import type { AppAbility } from './ability';

const AbilityContext = createContext<AppAbility>({} as AppAbility);
const BaseCan = createContextualCan(AbilityContext.Consumer);

export { BaseCan as Can };

export function AbilityProvider({ ability, children }: { ability: AppAbility; children: ReactNode }) {
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

export function useAbility() {
  return useContext(AbilityContext);
}

// Helper: converts "academics.read" → CASL check
interface CanPermissionProps {
  permission: string;       // "academics.read" — from database
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CanPermission({ permission, children, fallback }: CanPermissionProps) {
  const [resource, action] = permission.split('.');
  const caslAction = action === 'write' ? 'manage' : action;

  return (
    <BaseCan I={caslAction} a={resource} passThrough>
      {(allowed) => allowed ? <>{children}</> : <>{fallback ?? null}</>}
    </BaseCan>
  );
}
```

---

### 4. Hooks

File: `frontend/src/hooks/use-permission.ts`

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

  // Check: does user have "academics.read"?
  const hasPermission = (permission: string): boolean => {
    const [resource, action] = permission.split('.');
    const caslAction = action === 'write' ? 'manage' : action;
    return ability.can(caslAction, resource);
  };

  return { ability, hasPermission };
}
```

---

### 5. AuthStore Update

File: `frontend/src/stores/auth.store.ts`

```typescript
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  permissions: string[];   // ← NEW: ["academics.read", "staff.write"]
}
```

---

### 6. Wrap App with AbilityProvider

File: `frontend/src/components/providers/index.tsx`

```tsx
'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { defineAbilitiesFor } from '@/lib/casl/ability';
import { AbilityProvider } from '@/lib/casl/ability-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  const ability = useMemo(() => {
    if (!user?.permissions) return defineAbilitiesFor([]);
    if (user.userType === 'SCHOOL_ADMIN') return defineAbilitiesFor(['*']);
    return defineAbilitiesFor(user.permissions);
  }, [user?.permissions, user?.userType]);

  return <AbilityProvider ability={ability}>{children}</AbilityProvider>;
}
```

---

### 7. Page-Level Guard

File: `frontend/src/components/auth/require-permission.tsx`

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

---

### 8. Sidebar Filtering

File: `frontend/src/navigation/sidebar/sidebar-items.ts`

```typescript
import { perm, type PermissionString } from '../../../../shared/types/permissions';

export interface NavMainItem {
  id: string;
  title: string;
  url: string;
  permission?: PermissionString;  // Type-safe: only valid permission strings
  icon?: LucideIcon;
}

export const sidebarItems: NavGroup[] = [
  { id: 1, label: "Main", items: [
    { id: "dashboard", title: "Dashboard", url: "/dashboard/default", icon: LayoutDashboard },
  ]},
  { id: 2, label: "Configuration", items: [
    { id: "class-configure", title: "Class Configure", url: "/dashboard/class-configure", icon: Settings2, permission: perm('ACADEMICS_READ') },
    { id: "academic-setup", title: "Academic Setup", url: "/dashboard/academic-setup", icon: GraduationCap, permission: perm('ACADEMICS_READ') },
  ]},
  { id: 3, label: "People", items: [
    { id: "staff-directory", title: "Staff Directory", url: "/dashboard/staff", icon: Users, permission: perm('STAFF_READ') },
  ]},
  { id: 4, label: "Access Control", items: [
    { id: "roles", title: "Roles & Permissions", url: "/dashboard/roles", icon: ShieldCheck, permission: perm('ROLES_READ') },
  ]},
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

### 9. Route Protection (Middleware)

File: `frontend/src/config/route-permissions.ts`

```typescript
import { perm, type PermissionString } from '../../../shared/types/permissions';

export const ROUTE_PERMISSIONS: Record<string, PermissionString> = {
  '/dashboard/academic-setup':      perm('ACADEMICS_READ'),
  '/dashboard/class-configure':     perm('ACADEMICS_READ'),
  '/dashboard/subject-allocations': perm('ACADEMICS_READ'),
  '/dashboard/staff':               perm('STAFF_READ'),
  '/dashboard/staff/designations':  perm('STAFF_READ'),
  '/dashboard/roles':               perm('ROLES_READ'),
};
```

File: `frontend/src/middleware.ts` — add permission check after auth check:

```typescript
const requiredPermission = ROUTE_PERMISSIONS[pathname];
if (requiredPermission) {
  const payload = jwtDecode<{ permissions?: string[]; userType?: string }>(token);
  if (payload.userType !== 'SCHOOL_ADMIN' && !payload.permissions?.includes(requiredPermission)) {
    return NextResponse.redirect(new URL('/dashboard/default', request.url));
  }
}
```

---

## Usage Examples

```tsx
import { perm } from '@/shared/types/permissions';

// Page guard — using perm() helper (recommended, autocomplete)
<RequirePermission permission={perm('ACADEMICS_READ')}>
  <AcademicSetupPage />
</RequirePermission>

// Page guard — using string directly (also valid, TypeScript validates)
<RequirePermission permission="academics.read">
  <AcademicSetupPage />
</RequirePermission>

// Button — hide if no permission
<CanPermission permission={perm('STAFF_WRITE')}>
  <Button>Invite Staff</Button>
</CanPermission>

// Button — disable with fallback
<CanPermission permission={perm('STAFF_WRITE')} fallback={<Button disabled>No Permission</Button>}>
  <Button>Invite Staff</Button>
</CanPermission>

// In code
const { hasPermission } = usePermission();
if (hasPermission(perm('ACADEMICS_WRITE'))) { ... }

// ❌ These all cause TypeScript errors:
<CanPermission permission="academics.view">       // "view" not in vocabulary
<CanPermission permission="student.read">         // "student" not in vocabulary
<CanPermission permission={perm('STAFF_VIEW')}>   // "STAFF_VIEW" not a key
```

---

## Install Command

```bash
cd frontend
npm install @casl/ability @casl/react
```

---

## Checklist

- [ ] Create shared/types/permissions.ts (mirrors backend permissions table)
- [ ] Backend: Add permissions to JWT in LoginUseCase
- [ ] Backend: Update JwtPayload type
- [ ] Frontend: Install @casl/ability + @casl/react
- [ ] Frontend: Create lib/casl/ability.ts
- [ ] Frontend: Create lib/casl/ability-context.tsx
- [ ] Frontend: Create hooks/use-permission.ts
- [ ] Frontend: Update stores/auth.store.ts (add permissions field)
- [ ] Frontend: Update components/providers/ (add AbilityProvider)
- [ ] Frontend: Create components/auth/require-permission.tsx
- [ ] Frontend: Update sidebar-items.ts (add permission field)
- [ ] Frontend: Create config/route-permissions.ts
- [ ] Frontend: Update middleware.ts (add permission check)
- [ ] Test: SCHOOL_ADMIN sees everything
- [ ] Test: Teacher sees only allowed pages/buttons
- [ ] Test: Sidebar filters correctly
- [ ] Test: Unauthorized route redirects
