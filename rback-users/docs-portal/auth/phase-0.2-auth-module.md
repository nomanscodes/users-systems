# Phase 0.2 — Authentication Module

## Overview

After a tenant self-registers (Phase 0.1), the School Admin receives an account but **has no way to log in yet**.  
This phase implements the complete authentication layer:

- Stateless JWT-based authentication
- Access Token + Refresh Token strategy
- Guards for protecting endpoints (Super Admin, School Admin, tenant-scoped)
- Logout (token revocation)

---

## 1. Current State (Post Phase 0.1)

When a school registers via `POST /tenants/register`, the system atomically creates:

```
tenants table   → school record  (status: TRIAL)
users table     → school admin   (userType: SCHOOL_ADMIN, passwordHash: bcrypt)
```

The admin's credentials are an `email` and a plain-text `adminPassword` that was hashed and stored.  
**There is currently no login endpoint.**

---

## 2. User Types & Access Levels

| User Type      | Has `tenant_id`? | Description                           |
| -------------- | ---------------- | ------------------------------------- |
| `SUPER_ADMIN`  | ❌ NULL          | System owner — manages all tenants    |
| `SCHOOL_ADMIN` | ✅ Yes           | One per tenant — manages their school |
| `STAFF`        | ✅ Yes           | Phase 0.4+                            |
| `PARENT`       | ✅ Yes           | Phase 0.4+                            |
| `STUDENT`      | ✅ Yes           | Phase 0.4+                            |

---

## 3. Login Flow (Step-by-Step)

```
Client                          API Server                          Database
  │                                  │                                  │
  │  POST /auth/login                │                                  │
  │  { email, password }             │                                  │
  │─────────────────────────────────>│                                  │
  │                                  │  SELECT * FROM users             │
  │                                  │  WHERE email = ?                 │
  │                                  │─────────────────────────────────>│
  │                                  │<─────────────────────────────────│
  │                                  │  row found                       │
  │                                  │                                  │
  │                                  │  bcrypt.compare(password, hash)  │
  │                                  │  ✅ match                        │
  │                                  │                                  │
  │                                  │  Check user status = ACTIVE      │
  │                                  │                                  │
  │                                  │  Sign Access Token (15 min)      │
  │                                  │  Sign Refresh Token (7 days)     │
  │                                  │                                  │
  │                                  │  INSERT refresh_tokens           │
  │                                  │  (hashed token, userId, expiry)  │
  │                                  │─────────────────────────────────>│
  │                                  │                                  │
  │  200 OK                          │                                  │
  │  { accessToken, refreshToken,    │                                  │
  │    user: { id, email, userType,  │                                  │
  │            tenantId } }          │                                  │
  │<─────────────────────────────────│                                  │
```

### Login rules

- Email lookup is **global** (across all tenants) — one email maps to one user record.
- `bcrypt.compare()` verifies the password against the stored hash.
- If the user's `status` is `INACTIVE` or `SUSPENDED`, login is **rejected** with `403`.
- If the tenant's `status` is `SUSPENDED`, login is **rejected** with `403`.
- On success, two tokens are issued (see Section 4).

---

## 4. Token Strategy

### Access Token (JWT)

- **Library:** `@nestjs/jwt` + `passport-jwt`
- **Algorithm:** HS256 (symmetric, secret from env)
- **Expiry:** `15 minutes` (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Payload:**

```json
{
  "sub": "user-uuid",
  "email": "admin@school.edu",
  "userType": "SCHOOL_ADMIN",
  "tenantId": "tenant-uuid",
  "tokenVersion": 1,
  "iat": 1000000,
  "exp": 1000900
}
```

> For `SUPER_ADMIN`, `tenantId` will be `null`.

**Why each field is needed:**

| Field          | Used by                                      | Purpose                                              |
| -------------- | -------------------------------------------- | ---------------------------------------------------- |
| `sub`          | All use-cases, audit trail, logout           | Identifies the user — stored as `createdBy` on records |
| `email`        | `/auth/me` response, logging                 | Human-readable identity                              |
| `userType`     | `SuperAdminGuard`, `SchoolAdminGuard`        | Role-based access control                            |
| `tenantId`     | `TenantScopeGuard`, all tenant-scoped queries| Prevents cross-tenant data access                    |
| `tokenVersion` | `JwtAuthGuard` (DB check)                   | Immediate invalidation on password change / suspension |

**`tokenVersion` explained:**  
Stored as an integer in the `users` table (default `1`). When a user changes their password or is suspended, the server increments their `token_version`. `JwtAuthGuard` compares the token's `tokenVersion` against the DB value — any token with a stale version is immediately rejected, without waiting for the 15-minute expiry.

### Refresh Token

- **Expiry:** `7 days` (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Storage:** Hashed (bcrypt, 10 rounds) and stored in `refresh_tokens` table.
- **Purpose:** Issue new access tokens without re-entering credentials.
- **Rotation:** Each `/auth/refresh` call **invalidates** the old refresh token and issues a new one (one-time use).

---

## 5. New Database Table — `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id           VARCHAR(36)  PRIMARY KEY,               -- UUID
  user_id      VARCHAR(36)  NOT NULL,                  -- FK → users.id
  token_hash   VARCHAR(255) NOT NULL,                  -- bcrypt hash of raw token
  expires_at   DATETIME     NOT NULL,
  is_revoked   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rt_user_id (user_id),
  INDEX idx_rt_token_hash (token_hash)
);
```

---

## 6. API Endpoints

| Method | Endpoint        | Auth   | Description                       |
| ------ | --------------- | ------ | --------------------------------- |
| `POST` | `/auth/login`   | Public | Login with email + password       |
| `POST` | `/auth/refresh` | Public | Swap refresh token for new tokens |
| `POST` | `/auth/logout`  | JWT    | Revoke current refresh token      |
| `GET`  | `/auth/me`      | JWT    | Get logged-in user profile        |

### POST /auth/login — Request body

```json
{
  "email": "admin@greenvalley.edu",
  "password": "Admin@1234"
}
```

### POST /auth/login — Success response `200`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "user-uuid",
      "email": "admin@greenvalley.edu",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "SCHOOL_ADMIN",
      "tenantId": "tenant-uuid",
      "tenantStatus": "TRIAL"
    }
  }
}
```

### POST /auth/login — Error responses

| Status | Code                  | When                                 |
| ------ | --------------------- | ------------------------------------ |
| `401`  | `INVALID_CREDENTIALS` | Email not found or wrong password    |
| `403`  | `USER_SUSPENDED`      | User status is SUSPENDED or INACTIVE |
| `403`  | `TENANT_SUSPENDED`    | The user's tenant is SUSPENDED       |

### POST /auth/refresh — Request body

```json
{
  "refreshToken": "eyJhbGci..."
}
```

### POST /auth/logout — Request body

```json
{
  "refreshToken": "eyJhbGci..."
}
```

> Access Token is included in the `Authorization: Bearer <token>` header.

---

## 7. Guards Architecture

Three guards will be built, applied progressively to endpoints:

### JwtAuthGuard

- Validates the `Authorization: Bearer <token>` header.
- Decodes and verifies the JWT signature and expiry.
- Attaches the decoded payload to `request.user`.
- **Used by every protected endpoint across all modules.**

### `src/common/guards/super-admin.guard.ts`

- Runs after `JwtAuthGuard` (composition via `canActivate`).
- Checks that `request.user.userType === 'SUPER_ADMIN'`.
- Returns `403 Forbidden` if not a super admin.
- Applied to all tenant management endpoints (Phase 0.1 TODOs).

### `src/common/guards/tenant-scope.guard.ts` _(Phase 0.3+)_

- Ensures a user can only access resources belonging to their own `tenantId`.
- Cross-tenant access returns `403`.
- Will be used by all school-specific resource endpoints.

---

## 8. New Environment Variables Required

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-me
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 9. Module Structure (following established pattern)

```
# Auth module — login logic, token management, JWT strategy
src/modules/auth/
├── auth.module.ts
├── application/
│   ├── di-tokens.ts
│   └── use-cases/
│       ├── login.use-case.ts
│       ├── refresh-token.use-case.ts
│       └── logout.use-case.ts
├── domain/
│   ├── entities/
│   │   └── refresh-token.entity.ts
│   └── errors/
│       ├── invalid-credentials.error.ts
│       ├── user-suspended.error.ts
│       └── tenant-suspended.error.ts
├── infrastructure/
│   └── typeorm/
│       ├── refresh-token.typeorm.entity.ts
│       └── refresh-token.typeorm.repository.ts
└── interface/
    ├── dto/
    │   ├── login.dto.ts
    │   └── refresh-token.dto.ts
    ├── filters/
    │   └── auth-error.filter.ts
    ├── strategies/
    │   └── jwt.strategy.ts        ← stays here: needs JwtModule secrets
    └── http/
        └── auth.controller.ts

# Shared guards — usable by ALL modules across the application
src/common/guards/
├── jwt-auth.guard.ts              ← protects any endpoint
├── super-admin.guard.ts           ← restricts to SUPER_ADMIN userType
└── tenant-scope.guard.ts          ← Phase 0.3: restricts to own tenantId
```

### Usage example in any controller:

```typescript
// tenants/interface/http/tenant.controller.ts
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../../common/guards/super-admin.guard';

@UseGuards(JwtAuthGuard, SuperAdminGuard)  // ← from common, not from auth module
@Get()
async findAll() { ... }
```

---

## 10. Dependencies to Install

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

---

## 11. Implementation Order

1. **Install dependencies**
2. **Add env vars** to `.env` and `.env.example`
3. **Domain layer** — `RefreshTokenEntity`, domain errors
4. **Infrastructure layer** — `RefreshTokenTypeOrmEntity`, repository
5. **Use-cases** — `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`
6. **Interface layer** — DTOs, `JwtStrategy`, `JwtAuthGuard`, `SuperAdminGuard`, controller
7. **Wire up** — `auth.module.ts`, import in `app.module.ts`
8. **Retrofit Phase 0.1** — Add `@UseGuards(JwtAuthGuard, SuperAdminGuard)` to the 4 tenant management endpoints
9. **Update Postman** — Add login, refresh, logout, and bearer token support

---

## 12. Security Decisions

| Decision                            | Rationale                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Short-lived access token (15 min)   | Limits exposure if a token is leaked                                                                              |
| Refresh token stored as bcrypt hash | Raw refresh token is never stored — DB breach can't replay tokens                                                 |
| Refresh token rotation              | Each use invalidates old token — detects replay attacks                                                           |
| No email enumeration                | Login always returns `INVALID_CREDENTIALS` for both wrong email and password — never reveals which field is wrong |
| Tenant status check at login        | Suspended tenants are blocked at login, not just at resource access                                               |

---

_Next: Phase 0.3 — Role-Based Access Control (RBAC) and Tenant-Scoped Guards_
