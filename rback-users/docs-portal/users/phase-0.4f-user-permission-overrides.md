# Phase 0.4F — User Permission Overrides

> **Depends on:** Phase 0.4A (RBAC) + Phase 0.4E (CASL)
> **Purpose:** Allow admins to grant or deny specific permissions to individual users beyond their role

---

## Problem

Currently permissions only come from roles:

```
Shafik → Teacher role → academics.read ✅
Admin wants to also give Shafik → staff.read ❌ (not possible without changing Teacher role)
```

**Solution:** Add a `user_permissions` table for per-user overrides (grant or deny).

---

## How It Works

```
PERMISSION RESOLUTION (3 sources, priority order):

1. SCHOOL_ADMIN → bypass all checks (existing)
2. DENY overrides → user_permissions where isDeny=true → REJECT
3. GRANT from roles OR user_permissions where isDeny=false → ALLOW

Rule: DENY always wins over GRANT
```

```
┌─────────────────────────────────────────────────────────────────┐
│  Shafik (Teacher role)                                           │
│                                                                   │
│  From role:      academics.read ✅                               │
│  User GRANT:     staff.read ✅    (admin gave extra access)      │
│  User DENY:      roles.write ❌   (admin blocked this)           │
│                                                                   │
│  Final result:   academics.read ✅, staff.read ✅                │
│  Denied:         roles.write ❌                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

| Scenario | Solution |
|----------|----------|
| "Give Shafik temporary staff access" | GRANT: `staff.read` on `user_permissions` |
| "Block Shafik from deleting records" | DENY: `academics.write` on `user_permissions` |
| "All teachers should view staff" | Add `staff.read` to Teacher role (NOT a user override) |
| "One teacher exception" | Use `user_permissions` |
| "Remove override after trial period" | Delete row from `user_permissions` |

**Rule of thumb:** If 2+ users need the same override, create a new role instead.

---

## Database Schema

### New Table: `user_permissions`

```sql
CREATE TABLE user_permissions (
  userId       VARCHAR(36) NOT NULL,
  permissionId VARCHAR(36) NOT NULL,
  tenantId     VARCHAR(36) NOT NULL,
  isDeny       BOOLEAN DEFAULT FALSE,   -- FALSE=grant, TRUE=deny
  grantedBy    VARCHAR(36) NOT NULL,     -- admin who created this override
  grantedAt    DATETIME DEFAULT NOW(),
  reason       TEXT,                      -- why this override exists (audit)

  PRIMARY KEY (userId, permissionId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (grantedBy) REFERENCES users(id),
  INDEX idx_tenant_user (tenantId, userId)
);
```

**Key design decisions:**
- Composite PK `(userId, permissionId)` — one entry per user per permission
- `isDeny` flag — FALSE=grant, TRUE=deny (deny wins over role grants)
- `grantedBy` + `reason` — audit trail for compliance
- CASCADE on delete — if user or permission deleted, override is cleaned up

---

## New Files

```
rback-users/src/modules/permissions/
 ┣ infrastructure/typeorm/entities/
 ┃ ┗ user-permission.typeorm.entity.ts     # New entity
 ┣ interface/
 ┃ ┣ dto/
 ┃ ┃ ┗ user-permission.dto.ts              # Create/Update DTOs
 ┃ ┗ http/
 ┃    ┗ user-permissions.controller.ts      # CRUD endpoints
 ┗ application/services/
    ┗ user-permissions.service.ts           # Business logic

rback-users/src/modules/auth/application/use-cases/
 ┗ login.use-case.ts                        # Updated: merge role + user permissions

rback-users/src/common/guards/
 ┗ permission.guard.ts                       # Updated: check deny first, then grant
```

## Modified Files

```
rback-users/src/
 ┣ modules/permissions/permissions.module.ts    # Register new entity + service + controller
 ┣ modules/auth/application/use-cases/login.use-case.ts  # Merge permissions for JWT
 ┗ common/guards/permission.guard.ts            # Updated permission check logic
```

---

## Implementation

### 1. Entity

File: `rback-users/src/modules/permissions/infrastructure/typeorm/entities/user-permission.typeorm.entity.ts`

```typescript
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from '../../../../users/infrastructure/typeorm/user.typeorm.entity';
import { PermissionTypeOrmEntity } from './permission.typeorm.entity';

@Entity('user_permissions')
export class UserPermissionTypeOrmEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  permissionId: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId: string;

  @Column({ type: 'boolean', default: false })
  isDeny: boolean;

  @Column({ type: 'varchar', length: 36 })
  grantedBy: string;

  @CreateDateColumn()
  grantedAt: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @ManyToOne(() => UserTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserTypeOrmEntity;

  @ManyToOne(() => PermissionTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: PermissionTypeOrmEntity;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'grantedBy' })
  granter: UserTypeOrmEntity;
}
```

### 2. DTOs

File: `rback-users/src/modules/permissions/interface/dto/user-permission.dto.ts`

```typescript
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserPermissionDto {
  @IsNotEmpty()
  @IsUUID()
  permissionId: string;

  @IsNotEmpty()
  @IsBoolean()
  isDeny: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserPermissionDto {
  @IsOptional()
  @IsBoolean()
  isDeny?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
```

### 3. Service

File: `rback-users/src/modules/permissions/application/services/user-permissions.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermissionTypeOrmEntity } from '../../infrastructure/typeorm/entities/user-permission.typeorm.entity';
import { PermissionTypeOrmEntity } from '../../infrastructure/typeorm/entities/permission.typeorm.entity';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(UserPermissionTypeOrmEntity)
    private readonly userPermRepo: Repository<UserPermissionTypeOrmEntity>,
    @InjectRepository(PermissionTypeOrmEntity)
    private readonly permRepo: Repository<PermissionTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
  ) {}

  // Get all overrides for a user
  async findByUser(tenantId: string, userId: string) {
    return this.userPermRepo.find({
      where: { tenantId, userId },
      relations: { permission: true, granter: true },
    });
  }

  // Create or update an override
  async upsert(
    tenantId: string,
    targetUserId: string,
    permissionId: string,
    isDeny: boolean,
    grantedBy: string,
    reason?: string,
  ) {
    // Validate user exists
    const user = await this.userRepo.findOneBy({ id: targetUserId, tenantId });
    if (!user) throw new NotFoundException('User not found');

    // Validate permission exists
    const perm = await this.permRepo.findOneBy({ id: permissionId });
    if (!perm) throw new NotFoundException('Permission not found');

    // Upsert (insert or update)
    const existing = await this.userPermRepo.findOneBy({
      userId: targetUserId,
      permissionId,
    });

    if (existing) {
      existing.isDeny = isDeny;
      existing.reason = reason ?? existing.reason;
      return this.userPermRepo.save(existing);
    }

    return this.userPermRepo.save(
      this.userPermRepo.create({
        userId: targetUserId,
        permissionId,
        tenantId,
        isDeny,
        grantedBy,
        reason,
      }),
    );
  }

  // Remove an override
  async remove(tenantId: string, userId: string, permissionId: string) {
    const existing = await this.userPermRepo.findOneBy({
      userId,
      permissionId,
      tenantId,
    });
    if (!existing) throw new NotFoundException('User permission override not found');
    await this.userPermRepo.remove(existing);
    return true;
  }

  // Get merged permissions for a user (role permissions + user overrides)
  async getEffectivePermissions(tenantId: string, userId: string): Promise<string[]> {
    // 1. Get permissions from roles
    const rolePerms = await this.userPermRepo.query(`
      SELECT DISTINCT p.resource, p.action
      FROM user_roles ur
      JOIN role_permissions rp ON ur.roleId = rp.roleId
      JOIN permissions p ON rp.permissionId = p.id
      WHERE ur.userId = ? AND ur.tenantId = ?
    `, [userId, tenantId]);

    // 2. Get user overrides
    const userPerms = await this.userPermRepo.find({
      where: { tenantId, userId },
      relations: { permission: true },
    });

    // 3. Build granted + denied sets
    const denied = new Set(
      userPerms
        .filter(p => p.isDeny)
        .map(p => `${p.permission.resource}.${p.permission.action}`)
    );

    const directGrants = userPerms
      .filter(p => !p.isDeny)
      .map(p => `${p.permission.resource}.${p.permission.action}`);

    // 4. Merge: role permissions + direct grants - denied
    const rolePermStrings = rolePerms.map((p: any) => `${p.resource}.${p.action}`);
    const merged = [...new Set([...rolePermStrings, ...directGrants])];

    // 5. Remove denied permissions
    return merged.filter(p => !denied.has(p));
  }
}
```

### 4. Controller

File: `rback-users/src/modules/permissions/interface/http/user-permissions.controller.ts`

```typescript
import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, Res, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { UserPermissionsService } from '../../application/services/user-permissions.service';
import { CreateUserPermissionDto } from '../dto/user-permission.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';
import { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { success } from '../../../../common/response/api-response';

@Controller('users/:userId/permissions')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class UserPermissionsController {
  constructor(private readonly service: UserPermissionsService) {}

  // List user's permission overrides
  @Get()
  @RequirePermission('roles', 'read')
  async findByUser(
    @CurrentUser() admin: JwtPayload,
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const data = await this.service.findByUser(admin.tenantId, userId);
    return res.status(HttpStatus.OK).json(success(data));
  }

  // Grant or deny a permission to a user
  @Post()
  @RequirePermission('roles', 'write')
  async upsert(
    @CurrentUser() admin: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: CreateUserPermissionDto,
    @Res() res: Response,
  ) {
    const data = await this.service.upsert(
      admin.tenantId,
      userId,
      dto.permissionId,
      dto.isDeny,
      admin.sub,  // grantedBy = current admin
      dto.reason,
    );
    return res.status(HttpStatus.OK).json(success(data, 'Permission override saved'));
  }

  // Remove a permission override
  @Delete(':permissionId')
  @RequirePermission('roles', 'write')
  async remove(
    @CurrentUser() admin: JwtPayload,
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @Res() res: Response,
  ) {
    await this.service.remove(admin.tenantId, userId, permissionId);
    return res.status(HttpStatus.OK).json(success(null, 'Permission override removed'));
  }
}
```

### 5. Update LoginUseCase — Merge Permissions for JWT

File: `rback-users/src/modules/auth/application/use-cases/login.use-case.ts`

```typescript
// Replace the existing permissions query with:

let permissions: string[] = [];
if (user.userType === UserType.SCHOOL_ADMIN) {
  const allPerms = await this.permissionRepo.find();
  permissions = allPerms.map(p => `${p.resource}.${p.action}`);
} else {
  // Use the service to get merged permissions
  permissions = await this.userPermissionsService.getEffectivePermissions(
    user.tenantId,
    user.id,
  );
}
```

### 6. Update PermissionGuard — Check Deny First

File: `rback-users/src/common/guards/permission.guard.ts`

```typescript
private async checkUserPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  // 1. Check if explicitly DENIED
  const denied = await this.dataSource.query(`
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON up.permissionId = p.id
    WHERE up.userId = ? AND up.tenantId = ? AND up.isDeny = TRUE
      AND p.resource = ? AND p.action = ?
    LIMIT 1
  `, [userId, tenantId, resource, action]);

  if (denied.length > 0) return false; // Explicit deny wins

  // 2. Check if granted via roles OR direct grant
  const granted = await this.dataSource.query(`
    SELECT 1 FROM (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON ur.roleId = rp.roleId
      JOIN permissions p ON rp.permissionId = p.id
      WHERE ur.userId = ? AND ur.tenantId = ? AND p.resource = ? AND p.action = ?

      UNION

      SELECT 1 FROM user_permissions up
      JOIN permissions p ON up.permissionId = p.id
      WHERE up.userId = ? AND up.tenantId = ? AND up.isDeny = FALSE
        AND p.resource = ? AND p.action = ?
    ) AS combined LIMIT 1
  `, [userId, tenantId, resource, action, userId, tenantId, resource, action]);

  return granted.length > 0;
}
```

### 7. Register in Module

File: `rback-users/src/modules/permissions/permissions.module.ts`

```typescript
import { UserPermissionTypeOrmEntity } from './infrastructure/typeorm/entities/user-permission.typeorm.entity';
import { UserPermissionsService } from './application/services/user-permissions.service';
import { UserPermissionsController } from './interface/http/user-permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // ... existing entities
      UserPermissionTypeOrmEntity,
    ]),
  ],
  controllers: [
    // ... existing controllers
    UserPermissionsController,
  ],
  providers: [
    // ... existing providers
    UserPermissionsService,
  ],
  exports: [UserPermissionsService],
})
export class PermissionsModule {}
```

---

## API Endpoints

```
GET    /v1/users/:userId/permissions              List user's permission overrides
POST   /v1/users/:userId/permissions              Grant or deny a permission
DELETE /v1/users/:userId/permissions/:permissionId Remove an override
```

### POST Body

```json
{
  "permissionId": "uuid-of-permission",
  "isDeny": false,
  "reason": "Temporary access for project X"
}
```

- `isDeny: false` → GRANT (add permission beyond role)
- `isDeny: true` → DENY (block permission even if role grants it)

---

## JWT Impact

CASL frontend **does not change**. The JWT still contains merged permissions:

```typescript
// JWT payload (unchanged format)
{
  sub: "shafik-id",
  permissions: ["academics.read", "staff.read"]
  // ↑ already merged: role permissions + user overrides - denied
}
```

Frontend CASL reads from JWT as before. No frontend changes needed.

---

## Checklist

- [ ] Create `user_permissions` table (migration)
- [ ] Create `UserPermissionTypeOrmEntity`
- [ ] Create DTOs (`CreateUserPermissionDto`, `UpdateUserPermissionDto`)
- [ ] Create `UserPermissionsService` with `getEffectivePermissions()`
- [ ] Create `UserPermissionsController` (GET/POST/DELETE)
- [ ] Register in `PermissionsModule`
- [ ] Update `LoginUseCase` to use merged permissions
- [ ] Update `PermissionGuard` to check deny first
- [ ] Test: Grant extra permission to user
- [ ] Test: Deny permission from user
- [ ] Test: Deny overrides role grant
- [ ] Test: Remove override restores original
- [ ] Test: SCHOOL_ADMIN bypasses all checks
- [ ] Test: CASL frontend shows/hides correctly (no changes needed)
