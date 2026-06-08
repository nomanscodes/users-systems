# Phase 0.1 — Tenant Module: Implementation Plan

> **Scope**: Tenant entity, database table, and all tenant registration + management APIs.
> **Depends on**: NestJS project initialized, MySQL connected via Docker.
> **Next Phase**: User module (Phase 0.2) builds on top of the `users` table created here.

---

## 1. What Is a Tenant?

In this SaaS system, a **Tenant = one School**. The tenant is the root of the entire multi-tenancy model — every piece of data (users, classes, feedback, etc.) belongs to a tenant via `tenant_id`.

> [!IMPORTANT]
> **A Tenant is not just a school record — it is also its own super user (School Admin).**
> When a tenant is registered (by any path), two records are created atomically in a single transaction:
>
> 1. A `tenants` row — the school identity.
> 2. A `users` row with `user_type = SCHOOL_ADMIN` — the owner of that school.
>
> **One tenant has exactly one School Admin.** This is a hard rule enforced at both the database and service level. A second `SCHOOL_ADMIN` for the same tenant can never be created.

---

## 2. Two Tenant Registration Paths

| Path                    | Who                                 | Auth Required      | Endpoint                 | Status on Creation                  |
| ----------------------- | ----------------------------------- | ------------------ | ------------------------ | ----------------------------------- |
| **Self-Registration**   | School registers themselves         | ❌ None — public   | `POST /tenants/register` | `TRIAL`                             |
| **Super Admin Creates** | System Super Admin creates a school | ✅ Super Admin JWT | `POST /tenants`          | `TRIAL` (default) or set explicitly |

### Path A — Self Registration (Public)

- Anyone can call this endpoint — no token, no permission check.
- The school fills in their details + the School Admin's credentials.
- Status is always set to `TRIAL` — the school cannot use paid features until a Super Admin activates them.
- This is the primary onboarding flow for the SaaS launch.

### Path B — Super Admin Creates Tenant

- Only callable with a valid Super Admin JWT.
- Used by the system owner to manually onboard a school (e.g. enterprise deals, bulk imports).
- Super Admin can optionally set the initial status directly (e.g. create as `ACTIVE` immediately).

---

## 3. Database Tables

> [!NOTE]
> Phase 0.1 creates **both** the `tenants` and `users` tables because they are inseparable — a School Admin user is always created alongside the tenant in one transaction.

### 3.1 `tenants` Table

```sql
tenants (
  id          VARCHAR(36)  PRIMARY KEY,              -- UUID v4
  name        VARCHAR(255) NOT NULL,                 -- School full name, e.g. "Sunrise Academy"
  slug        VARCHAR(100) NOT NULL UNIQUE,          -- URL-safe key, e.g. "sunrise-academy"
  email       VARCHAR(255) NOT NULL UNIQUE,          -- School's official contact email
  phone       VARCHAR(20)  NULL,                     -- School phone (optional)
  address     TEXT         NULL,                     -- Physical address (optional)
  status      ENUM('TRIAL','ACTIVE','SUSPENDED')
              NOT NULL DEFAULT 'TRIAL',
  created_by  VARCHAR(36)  NULL,                     -- NULL = self-registration, Super Admin's user_id if they created it
  created_at  DATETIME     NOT NULL DEFAULT NOW(),
  updated_at  DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW()
)
```

### 3.2 `users` Table (created in Phase 0.1 — School Admin only for now)

```sql
users (
  id            VARCHAR(36)  PRIMARY KEY,             -- UUID v4
  tenant_id     VARCHAR(36)  NOT NULL,                -- FK → tenants.id
  email         VARCHAR(255) NOT NULL UNIQUE,         -- Login email (globally unique)
  password_hash VARCHAR(255) NOT NULL,                -- bcrypt hashed
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NULL,
  user_type     ENUM('SUPER_ADMIN','SCHOOL_ADMIN','STAFF','PARENT','STUDENT') NOT NULL,
  --            ↑ NO DEFAULT — must always be explicitly set by the system
  status        ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_by    VARCHAR(36)  NULL,                    -- NULL = self-registration or system-created
  created_at    DATETIME     NOT NULL DEFAULT NOW(),
  updated_at    DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW(),

  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
)
```

> [!IMPORTANT]
> **No default on `user_type`.**
> `user_type` has **no database default** and is never accepted from user input. It is always set explicitly by the system:
>
> - During tenant registration → system sets `SCHOOL_ADMIN` internally.
> - When School Admin creates a user → School Admin specifies the type (`STAFF`, `PARENT`, `STUDENT`) but the system validates it — they **cannot set `SCHOOL_ADMIN`** for any user they create.

> [!IMPORTANT]
> **One School Admin per Tenant — Hard Enforcement.**
> Enforced at two levels:
>
> 1. **Service level**: Before inserting any `SCHOOL_ADMIN` user, check if one already exists for that `tenant_id`. If yes → throw `409 Conflict`.
> 2. **DB level**: A unique composite constraint `UNIQUE(tenant_id, user_type)` combined with a service guard ensures only one row per tenant can have `user_type = SCHOOL_ADMIN`.

> [!NOTE]
> The full `users` module (STAFF, PARENT, STUDENT management) is built in Phase 0.2. Phase 0.1 only creates the `users` table and inserts the initial `SCHOOL_ADMIN` row as part of tenant registration.

### Field Notes

| Field                | Rule / Why                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `tenants.id`         | UUID — avoids sequential ID enumeration attacks                                             |
| `tenants.slug`       | Unique URL-safe key, used for subdomain routing in future (`sunrise-academy.sms.com`)       |
| `tenants.status`     | `TRIAL` on creation → `ACTIVE` after Super Admin approval → `SUSPENDED` to block all access |
| `tenants.created_by` | `NULL` when school self-registers. Super Admin's `user_id` when they create it manually.    |
| `users.user_type`    | **No default. Set by system only.** Never from raw user input.                              |
| `users.created_by`   | `NULL` for self-registration. Super Admin's `user_id` when they provision the tenant.       |

---

## 4. API Endpoints

### 4.1 Public — No Auth Required

| Method | Endpoint            | Description                                           |
| ------ | ------------------- | ----------------------------------------------------- |
| `POST` | `/tenants/register` | School self-registers (creates tenant + School Admin) |

### 4.2 Super Admin Only — Requires Super Admin JWT

| Method  | Endpoint              | Description                                              |
| ------- | --------------------- | -------------------------------------------------------- |
| `POST`  | `/tenants`            | Super Admin manually creates a tenant + School Admin     |
| `GET`   | `/tenants`            | List all tenants (with optional filters: status, search) |
| `GET`   | `/tenants/:id`        | Get a single tenant by ID                                |
| `PATCH` | `/tenants/:id`        | Update tenant details (name, email, phone, address)      |
| `PATCH` | `/tenants/:id/status` | Change tenant status (ACTIVE / SUSPENDED / TRIAL)        |

> **Phase 0.1 Focus**: `POST /tenants/register` and `POST /tenants` are the primary build targets. The Super Admin management endpoints (GET, PATCH) are also built in this phase but the Super Admin guard is a placeholder until Phase 0.3 (Auth module).

---

## 5. Request & Response Contracts

### `POST /tenants/register` — Self Registration

**Request Body**:

```json
{
  "schoolName": "Sunrise Academy",
  "slug": "sunrise-academy",
  "schoolEmail": "contact@sunriseacademy.edu",
  "schoolPhone": "+8801700000000",
  "address": "123 School Road, Dhaka",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "adminEmail": "john.doe@sunriseacademy.edu",
  "adminPassword": "SecurePass@123",
  "adminPhone": "+8801800000000"
}
```

**Validation Rules**:

- `schoolName` → required, 2–255 chars
- `slug` → required, lowercase, alphanumeric + hyphens only (`^[a-z0-9-]+$`), 2–100 chars, unique
- `schoolEmail` → required, valid email, unique in `tenants`
- `schoolPhone` → optional, max 20 chars
- `address` → optional, max 1000 chars
- `adminFirstName`, `adminLastName` → required, 1–100 chars
- `adminEmail` → required, valid email, unique in `users`
- `adminPassword` → required, min 8 chars, must contain uppercase + number + special char
- `adminPhone` → optional, max 20 chars

**Success Response `201 Created`**:

```json
{
  "success": true,
  "message": "School registered successfully. Your account is in TRIAL status. Please contact support to activate.",
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "Sunrise Academy",
      "slug": "sunrise-academy",
      "email": "contact@sunriseacademy.edu",
      "status": "TRIAL",
      "createdAt": "2026-06-07T10:00:00.000Z"
    },
    "admin": {
      "id": "uuid",
      "email": "john.doe@sunriseacademy.edu",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "SCHOOL_ADMIN"
    }
  }
}
```

> [!NOTE]
> Password is **never** returned in the response. Only a confirmation that the admin account was created.

---

### `POST /tenants` — Super Admin Creates Tenant

**Request Body**:

```json
{
  "schoolName": "Crescent High School",
  "slug": "crescent-high",
  "schoolEmail": "admin@crescenthigh.edu",
  "schoolPhone": "+8801900000000",
  "address": "456 Main St, Chittagong",
  "adminFirstName": "Jane",
  "adminLastName": "Smith",
  "adminEmail": "jane.smith@crescenthigh.edu",
  "adminPassword": "TempPass@456",
  "adminPhone": "+8801600000000",
  "status": "ACTIVE"
}
```

**Differences from self-registration**:

- `status` field is **optional** — Super Admin can create the tenant as `ACTIVE` immediately (default: `TRIAL`).
- Requires a valid Super Admin JWT in the `Authorization` header.

**Success Response**: Same shape as self-registration response, reflecting the provided status.

---

### Error Responses (Both Endpoints)

| Code  | Scenario                                                                             |
| ----- | ------------------------------------------------------------------------------------ |
| `400` | Validation failed (missing fields, weak password, invalid slug format)               |
| `409` | `slug` already exists OR `schoolEmail` already exists OR `adminEmail` already exists |
| `401` | Missing/invalid JWT (Super Admin endpoint only)                                      |
| `403` | Valid JWT but not Super Admin (Super Admin endpoint only)                            |

---

## 6. File & Folder Structure

```
src/
├── modules/
│   └── tenants/
│       ├── tenants.module.ts
│       ├── tenants.controller.ts
│       ├── tenants.service.ts
│       ├── entities/
│       │   └── tenant.entity.ts
│       └── dto/
│           ├── self-register-tenant.dto.ts    ← Public self-registration
│           ├── create-tenant.dto.ts           ← Super Admin creates tenant
│           └── update-tenant-status.dto.ts
├── modules/
│   └── users/
│       └── entities/
│           └── user.entity.ts                ← Created in Phase 0.1 (table only)
├── common/
│   ├── enums/
│   │   ├── tenant-status.enum.ts
│   │   └── user-type.enum.ts
│   └── response/
│       └── api-response.ts                   ← Standard { success, message, data } wrapper
└── app.module.ts
```

---

## 7. Service Logic — Create Tenant Transaction

Both registration flows call the same core service logic, wrapped in a **TypeORM transaction**:

```
BEGIN TRANSACTION
  1. Check slug uniqueness in tenants          → 409 if exists
  2. Check schoolEmail uniqueness in tenants   → 409 if exists
  3. Check adminEmail uniqueness in users      → 409 if exists
  4. [Super Admin path only] Check no SCHOOL_ADMIN already exists for this tenant → 409
     (For self-registration this is always a new tenant so this check is implicit)
  5. Hash adminPassword with bcrypt (12 rounds)
  6. INSERT into tenants (created_by = NULL for self-reg, superAdminId for admin path)
     → get tenant.id
  7. System sets user_type = 'SCHOOL_ADMIN' internally — NOT from request body
  8. INSERT into users (user_type = 'SCHOOL_ADMIN', tenant_id = tenant.id,
                        created_by = NULL for self-reg, superAdminId for admin path)
COMMIT
  → Return { tenant, admin } (no password field)

ON ERROR → ROLLBACK → throw appropriate exception
```

> [!CAUTION]
> The `user_type = 'SCHOOL_ADMIN'` value is **hardcoded in the service layer**, never read from the request body. Even if someone passes `"userType": "SCHOOL_ADMIN"` in the request, the DTO must strip it (use `@Exclude()` or simply not include it in the DTO).

---

## 8. Implementation Checklist

### One-time App Setup

- [ ] `app.module.ts` — `ConfigModule.forRoot()` + `TypeOrmModule.forRootAsync()`
- [ ] `main.ts` — enable `ValidationPipe` globally with `whitelist: true`, `forbidNonWhitelisted: true`
- [ ] `src/common/enums/tenant-status.enum.ts`
- [ ] `src/common/enums/user-type.enum.ts`
- [ ] `src/common/response/api-response.ts`

### Tenant Module

- [ ] `tenant.entity.ts`
- [ ] `user.entity.ts` (table creation only — full module in Phase 0.2)
- [ ] `self-register-tenant.dto.ts` (with class-validator decorators)
- [ ] `create-tenant.dto.ts` (extends self-register + adds optional `status`)
- [ ] `update-tenant-status.dto.ts`
- [ ] `tenants.service.ts` — transactional create logic + findAll + findOne
- [ ] `tenants.controller.ts` — all 5 endpoints (guard placeholder on Super Admin routes)
- [ ] `tenants.module.ts` — register entity + service + controller
- [ ] Register `TenantsModule` in `app.module.ts`

### Testing

- [ ] `POST /tenants/register` — happy path → `201`
- [ ] `POST /tenants/register` — duplicate slug → `409`
- [ ] `POST /tenants/register` — duplicate adminEmail → `409`
- [ ] `POST /tenants/register` — weak password → `400`
- [ ] `POST /tenants/register` — missing required fields → `400`
- [ ] `POST /tenants` — Super Admin creates with `status: ACTIVE` → `201`
- [ ] `GET /tenants` → list of tenants
- [ ] `GET /tenants/:id` → single tenant
- [ ] `PATCH /tenants/:id/status` → status updated

---

## 9. What This Phase Does NOT Include

- ❌ JWT auth guard on Super Admin routes (implemented in Phase 0.3 — Auth module)
- ❌ Full User management API (Phase 0.2)
- ❌ Pagination on `GET /tenants` (added when needed)
- ❌ Email notification to school admin after registration (future)
- ❌ Slug auto-generation from school name (manual input for now)

---

_Phase: 0.1 | Status: Ready to implement_
