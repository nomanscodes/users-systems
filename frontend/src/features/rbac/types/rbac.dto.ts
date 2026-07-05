// ─── Permission ──────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

// ─── Role Permission (join table, returned in GET /roles/:id) ─────────────────

export interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

// ─── Role ─────────────────────────────────────────────────────────────────────
// NOTE: GET /roles (list) does NOT return rolePermissions[].
//       GET /roles/:id (detail) returns the full rolePermissions[] array.

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystemRole: boolean; // ⚠️ Correct field name — NOT `isSystem`
  createdAt: string;
  updatedAt: string;
  rolePermissions?: RolePermission[]; // Only in GET /roles/:id detail response
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

export interface AssignPermissionsPayload {
  permissionIds: string[];
}
