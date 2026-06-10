# Refactor Report — `rback-users` Application

**Date:** 2026-06-10  
**Scope:** All identified architectural, security, and functional gaps  
**Priority:** P0 = Blocking | P1 = High | P2 = Medium | P3 = Low

---

## GAP-01 — `SUPER_ADMIN` Can Corrupt the Academics Module

**Priority:** P0 — Blocking  
**Affected Files:** `src/modules/academics/interface/http/academics.controller.ts`

### Issue

Every academic endpoint extracts `tenantId` from the JWT and passes it directly to the service:

```typescript
// academics.controller.ts
@Post('branches')
async createBranch(@CurrentUser() user: JwtPayload, @Body() dto: CreateBranchDto) {
  return this.academicsService.createBranch(user.tenantId, dto);
  //                                         ^^^^^^^^^^^^^^
  //                                         NULL for SUPER_ADMIN
}
```

The service stores whatever it receives:

```typescript
// academics.service.ts
async createBranch(tenantId: string, dto: CreateBranchDto) {
  const entity = this.branchRepo.create({ ...dto, tenantId }); // tenantId = null
  return await this.branchRepo.save(entity); // Inserts row with tenantId = NULL
}
```

**What actually happens:**

| Actor | `tenantId` in JWT | SQL on POST | SQL on GET |
|---|---|---|---|
| SCHOOL_ADMIN | `"abc-uuid"` | `INSERT ... tenantId = 'abc-uuid'` ✅ | `WHERE tenantId = 'abc-uuid'` ✅ |
| SUPER_ADMIN | `null` | `INSERT ... tenantId = NULL` 🔴 | `WHERE tenantId = NULL` → 0 rows ⚠️ |

- POST endpoints create orphaned rows with `tenantId = NULL` — permanently polluting the DB.
- GET endpoints silently return empty arrays — no error, no warning.
- There is no guard preventing this.

### Root Cause

The `AcademicsController` has only `JwtAuthGuard`. It does not have any guard that checks whether the logged-in user actually belongs to a tenant.

### Solution

**Step 1 — Create `TenantScopeGuard`:**

```typescript
// src/common/guards/tenant-scope.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/interface/strategies/jwt.strategy';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    if (!user?.tenantId) {
      throw new ForbiddenException(
        'This endpoint requires a tenant-scoped account. SUPER_ADMIN cannot call this endpoint.',
      );
    }
    return true;
  }
}
```

**Step 2 — Apply it to `AcademicsController`:**

```typescript
// academics.controller.ts
@Controller('academics')
@UseGuards(JwtAuthGuard, TenantScopeGuard) // ← add TenantScopeGuard
export class AcademicsController { ... }
```

**Step 3 — Fix the TypeScript signature** (service should not accept `null`):

```typescript
// academics.service.ts — change all method signatures
async createBranch(tenantId: string, dto: CreateBranchDto) { ... }
// tenantId is already `string`, but the controller was passing `string | null`
// The guard now guarantees it will never be null when the service is called
```

---

## GAP-02 — No Update or Delete Operations on Academics

**Priority:** P0 — Blocking (system is not usable without this)  
**Affected Files:** `academics.controller.ts`, `academics.service.ts`

### Issue

The academics controller only supports `POST` (create) and `GET` (read). There are no `PATCH` or `DELETE` endpoints for any academic entity.

```typescript
// What exists:
@Post('branches')   // CREATE
@Get('branches')    // READ LIST

// What is MISSING:
// PATCH /academics/branches/:id   — UPDATE
// DELETE /academics/branches/:id  — DELETE
// GET /academics/branches/:id     — READ SINGLE
```

**Real-world impact:**

- A School Admin creates a branch with a typo → **cannot fix it**
- A session is created with wrong dates → **cannot correct them**
- A duplicate class was created → **cannot remove it**
- No way to deactivate a branch or archive a session

### Solution

**Step 1 — Add `PATCH` and `DELETE` to the service for all entities:**

```typescript
// academics.service.ts

// --- BRANCHES ---
async updateBranch(id: string, tenantId: string, dto: Partial<CreateBranchDto>) {
  const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
  if (!branch) throw new NotFoundException('Branch not found or does not belong to your tenant.');
  await this.branchRepo.update({ id, tenantId }, dto);
  return this.branchRepo.findOneBy({ id });
}

async deleteBranch(id: string, tenantId: string) {
  const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
  if (!branch) throw new NotFoundException('Branch not found or does not belong to your tenant.');
  await this.branchRepo.delete({ id, tenantId });
}
```

**Step 2 — Add `PATCH` and `DELETE` to the controller:**

```typescript
// academics.controller.ts

@Patch('branches/:id')
async updateBranch(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
  @Body() dto: UpdateBranchDto, // partial DTO
) {
  const data = await this.academicsService.updateBranch(id, user.tenantId, dto);
  return success(data, 'Branch updated successfully.');
}

@Delete('branches/:id')
@HttpCode(HttpStatus.NO_CONTENT)
async deleteBranch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  await this.academicsService.deleteBranch(id, user.tenantId);
}
```

**Step 3 — Add partial update DTOs:**

```typescript
// create-branch.dto.ts — add UpdateBranchDto
import { PartialType } from '@nestjs/mapped-types';
export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
```

> Apply this same pattern to: `sessions`, `classes`, `groups`, `sections`, `subjects`, `batches`, `subject_allocations`.

**Important for sessions** — when PATCHing a session to `isCurrent: true`, the same singleton logic must run:

```typescript
async updateSession(id: string, tenantId: string, dto: Partial<CreateAcademicSessionDto>) {
  const session = await this.sessionRepo.findOne({ where: { id, tenantId } });
  if (!session) throw new NotFoundException('Session not found.');

  if (dto.isCurrent === true) {
    // Unset all others first
    await this.sessionRepo.update({ tenantId, isCurrent: true }, { isCurrent: false });
  }
  await this.sessionRepo.update({ id, tenantId }, dto);
  return this.sessionRepo.findOneBy({ id });
}
```

---

## GAP-03 — No Global Error Filter (Inconsistent Error Responses)

**Priority:** P1 — High  
**Affected Files:** `src/main.ts`, `academics.controller.ts`

### Issue

Error response shapes are inconsistent across modules.

**Tenant module** (has `DomainErrorFilter`):
```json
{ "success": false, "statusCode": 409, "code": "TENANT_SLUG_EXISTS", "message": "..." }
```

**Academics module** (no filter → raw NestJS default):
```json
{ "statusCode": 409, "message": "Branch 'Main' already exists.", "error": "Conflict" }
```

**Unhandled DB errors anywhere**:
```json
{ "statusCode": 500, "message": "Internal server error" }
```

Three different shapes for errors. The frontend must handle all three separately.

### Root Cause

`DomainErrorFilter` is applied per-controller with `@UseFilters()`. The `AcademicsController` never gets it. There is no global exception filter in `main.ts`.

### Solution

**Step 1 — Create a global all-catch HTTP exception filter:**

```typescript
// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any).message ?? message;
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
```

**Step 2 — Register globally in `main.ts`:**

```typescript
// main.ts
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter()); // ← add this

  app.useGlobalPipes(new ValidationPipe({ ... }));
  app.setGlobalPrefix('api/v1');
  // ...
}
```

**Step 3 — Remove per-controller `@UseFilters` decorators** (or keep `DomainErrorFilter` alongside global — both work; the most specific filter runs first).

> The global filter becomes the safety net. Domain-specific filters on individual controllers still run first and take priority.

---

## GAP-04 — Batch Creation Makes 5 Separate DB Round-Trips

**Priority:** P2 — Medium  
**Affected Files:** `src/modules/academics/application/services/academics.service.ts`

### Issue

`createBatch()` fires 5 sequential SELECT queries before one INSERT — each is a separate DB round-trip:

```typescript
async createBatch(tenantId: string, dto: CreateBatchDto) {
  // Round-trip 1
  const branch = await this.branchRepo.findOne({ where: { id: dto.branchId, tenantId } });
  if (!branch) throw new NotFoundException('Branch not found');

  // Round-trip 2
  const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId, tenantId } });
  if (!session) throw new NotFoundException('Session not found');

  // Round-trip 3
  const cls = await this.classRepo.findOne({ where: { id: dto.classId, tenantId } });
  if (!cls) throw new NotFoundException('Class not found');

  // Round-trip 4
  const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId, tenantId } });
  if (!section) throw new NotFoundException('Section not found');

  // Round-trip 5 (conditional)
  if (dto.groupId) {
    const group = await this.groupRepo.findOne({ where: { id: dto.groupId, tenantId } });
    if (!group) throw new NotFoundException('Group not found');
  }

  // Round-trip 6 — INSERT
  const batch = this.batchRepo.create({ ...dto, tenantId });
  return await this.batchRepo.save(batch);
}
```

At scale, under concurrent requests, this creates a verification gap — an entity could be deleted between read #2 and read #4, or between any read and the final INSERT.

### Solution

**Replace with a single parallel existence check:**

```typescript
async createBatch(tenantId: string, dto: CreateBatchDto) {
  // All existence checks fire simultaneously
  const checks = await Promise.all([
    this.branchRepo.existsBy({ id: dto.branchId, tenantId }),
    this.sessionRepo.existsBy({ id: dto.sessionId, tenantId }),
    this.classRepo.existsBy({ id: dto.classId, tenantId }),
    this.sectionRepo.existsBy({ id: dto.sectionId, tenantId }),
    dto.groupId
      ? this.groupRepo.existsBy({ id: dto.groupId, tenantId })
      : Promise.resolve(true),
  ]);

  const [branchOk, sessionOk, classOk, sectionOk, groupOk] = checks;

  if (!branchOk)  throw new NotFoundException('Branch not found or does not belong to your tenant.');
  if (!sessionOk) throw new NotFoundException('Session not found or does not belong to your tenant.');
  if (!classOk)   throw new NotFoundException('Class not found or does not belong to your tenant.');
  if (!sectionOk) throw new NotFoundException('Section not found or does not belong to your tenant.');
  if (!groupOk)   throw new NotFoundException('Group not found or does not belong to your tenant.');

  try {
    const batch = this.batchRepo.create({ ...dto, tenantId });
    return await this.batchRepo.save(batch);
  } catch (error) {
    if ((error as any).code === 'ER_DUP_ENTRY') {
      throw new ConflictException('This exact classroom batch already exists.');
    }
    throw error;
  }
}
```

> `existsBy()` is available in TypeORM ≥ 0.3.x. It runs a `SELECT EXISTS(...)` — lighter than `findOne()`.

This reduces 5–6 sequential round-trips to 1 parallel batch + 1 INSERT.

---

## GAP-05 — Academics Module Bypasses Domain Layer

**Priority:** P2 — Medium  
**Affected Files:** Entire `src/modules/academics/` application layer

### Issue

The `tenants` module follows Clean Architecture:
```
Controller → UseCase → RepositoryPort (interface) → TypeORM Impl → DB
```

The `academics` module collapses this entirely:
```
Controller → AcademicsService → TypeORM Repo directly → DB
```

`AcademicsService` directly injects 8 TypeORM repositories and mixes query logic with business rules. Consequences:

- **No domain entities** — no place to put business rules like "a session's `endDate` must be after `startDate`"
- **No repository ports** — cannot swap the data layer without rewriting the service
- **Untestable in unit tests** — every test needs a real TypeORM repo or complex mocking
- **Business rules scattered** — the "isCurrent singleton" logic lives in the service, not enforced by a domain rule

### Solution (Incremental — Phase 0.4 refactor)

> This is not a day-one fix. Do it as Phase 0.4 begins to avoid disruption.

**Step 1 — Add validation logic at the DTO / service level immediately** (no architecture change needed):

```typescript
// create-academic-session.dto.ts
import { IsDateString, Validate } from 'class-validator';
import { IsAfterConstraint } from '../../../common/validators/is-after.validator';

export class CreateAcademicSessionDto {
  @IsString() name: string;

  @IsDateString() startDate: string;

  @IsDateString()
  @IsAfter('startDate', { message: 'endDate must be after startDate' })
  endDate: string;

  @IsBoolean() @IsOptional() isCurrent?: boolean;
}
```

**Step 2 — Long-term: Extract domain entities** (Phase 0.4):

```typescript
// domain/entities/academic-session.entity.ts
export class AcademicSession {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly isCurrent: boolean,
  ) {
    if (endDate <= startDate) {
      throw new Error('Session endDate must be after startDate.');
    }
  }
}
```

**Step 3 — Extract repository ports** (Phase 0.4):

```typescript
// domain/repositories/branch.repository.port.ts
export interface BranchRepositoryPort {
  findById(id: string, tenantId: string): Promise<Branch | null>;
  findAll(tenantId: string): Promise<Branch[]>;
  save(entity: Branch): Promise<Branch>;
  update(id: string, tenantId: string, data: Partial<Branch>): Promise<Branch>;
  delete(id: string, tenantId: string): Promise<void>;
}
```

---

## GAP-06 — Refresh Token Parsing Logic is Fragile and Misleading

**Priority:** P3 — Low  
**Affected Files:**  
- `src/modules/auth/application/use-cases/refresh-token.use-case.ts`  
- `src/modules/auth/application/use-cases/logout.use-case.ts`

### Issue

The raw refresh token is formatted as:

```typescript
// login.use-case.ts
const rawRefreshToken = uuidv4() + '.' + uuidv4();
// Example: "550e8400-e29b-41d4-a716-446655440000.f47ac10b-58cc-4372-a567-0e02b2c3d479"
//           └─── DB record ID ───────────────────┘ └─── random entropy ────────────────┘
```

The parsing logic in `refresh-token.use-case.ts`:

```typescript
const parts = rawRefreshToken.split('.');
// parts = ["550e8400-e29b-41d4-a716-446655440000", "f47ac10b-58cc-4372-a567-0e02b2c3d479"]

const recordId = parts.slice(0, 5).join('-'); // slice(0,5) → only ["550e8400-..."] → join('-') → same string
```

The comment says *"reconstruct UUID (5 parts with dashes)"* — this is wrong. UUIDs use hyphens internally, not dots. The split is by `.`, so `parts[0]` is already the complete UUID `"550e8400-e29b-41d4-a716-446655440000"`. `slice(0, 5)` gets only the first element. `join('-')` on a single-element array returns that element unchanged.

**The code works by coincidence.** The comment describes a completely different format that was never implemented.

**Risk:** If any future developer reads the comment and "fixes" the format to match the comment (splitting by `-` instead of `.`), the entire auth system breaks silently.

There are also **no unit tests** on this logic.

### Solution

**Step 1 — Simplify and document the parsing correctly:**

```typescript
// refresh-token.use-case.ts
async execute(rawRefreshToken: string): Promise<...> {
  // Raw token format: "<recordId>.<randomSecret>"
  // recordId = UUID v4 (the DB primary key of the refresh_tokens row)
  // randomSecret = UUID v4 (additional entropy for bcrypt hashing)
  const dotIndex = rawRefreshToken.indexOf('.');
  if (dotIndex === -1) throw new InvalidRefreshTokenError();

  const recordId = rawRefreshToken.substring(0, dotIndex);
  // Validate it looks like a UUID before hitting the DB
  if (!/^[0-9a-f-]{36}$/.test(recordId)) throw new InvalidRefreshTokenError();

  const tokenRecord = await this.refreshTokenRepo.findById(recordId);
  // ... rest of the logic unchanged
}
```

**Step 2 — Write a unit test for the token parsing:**

```typescript
// test/auth/refresh-token.use-case.spec.ts
it('should correctly extract recordId from raw refresh token', () => {
  const recordId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const secret   = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const raw = `${recordId}.${secret}`;

  const extracted = raw.substring(0, raw.indexOf('.'));
  expect(extracted).toBe(recordId);
});
```

---

## GAP-07 — Password Validation Only on Self-Registration

**Priority:** P2 — Medium  
**Affected Files:** `src/modules/tenants/interface/dto/tenant-request.dto.ts`

### Issue

The strong password regex is applied to `SelfRegisterTenantDto`:

```typescript
@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=...]).+$/, {
  message: 'password must contain at least one uppercase letter, one number, and one special character',
})
adminPassword: string;
```

`CreateTenantByAdminDto extends SelfRegisterTenantDto` — so it inherits this rule ✅.

But the password validation has **no minimum length enforcement on the regex** itself — only on a separate `@MinLength(8)` decorator. If someone removes `@MinLength(8)`, the regex alone does not enforce length. Also, there is no maximum length, meaning theoretically a 10,000-character password could cause bcrypt to hang (bcrypt silently truncates at 72 bytes).

### Solution

**Consolidate into a single regex with length:**

```typescript
@IsNotEmpty()
@IsString()
@Matches(
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/,
  {
    message:
      'Password must be 8–72 characters and contain at least one uppercase letter, one number, and one special character.',
  },
)
adminPassword: string;
```

> The `{8,72}` in the regex makes length validation intrinsic — not dependent on a separate decorator.

---

## Summary & Priority Order

| # | Gap | Priority | Effort | Files Affected |
|---|---|---|---|---|
| 01 | SUPER_ADMIN nulls academics data | **P0 Blocking** | 1–2 hrs | 1 new file + 1 edit |
| 02 | No PATCH/DELETE on academics | **P0 Blocking** | 1–2 days | controller + service + DTOs |
| 03 | No global error filter | **P1 High** | 2 hrs | 1 new file + `main.ts` |
| 04 | 5 sequential DB calls in `createBatch` | **P2 Medium** | 1 hr | `academics.service.ts` |
| 05 | Academics bypasses domain layer | **P2 Medium** | Phase 0.4 refactor | full module |
| 06 | Refresh token parsing fragile | **P3 Low** | 30 min + tests | 2 use-case files |
| 07 | Password validation not length-bound | **P2 Medium** | 30 min | `tenant-request.dto.ts` |

### Recommended Fix Order

```
GAP-01  →  GAP-03  →  GAP-02  →  GAP-07  →  GAP-04  →  GAP-06  →  GAP-05
 (auth)     (infra)   (feature)   (security)  (perf)     (tests)    (arch)
```
