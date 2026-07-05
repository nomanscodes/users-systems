import { apiClient } from '@/lib/api-client';
import type {
  Permission,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  AssignPermissionsPayload,
} from '../types/rbac.dto';

// NOTE: The Roles & Permissions controller uses plain `return` (no success() wrapper).
// So apiClient already delivers the raw data — NO unwrap needed here.
// Compare: Staff controller uses `res.json(success(data))` → { success, message, data }
//          Roles controller uses `return this.service.method()` → raw array/object

export const RbacService = {
  // ─── Permissions (Read-only — seeded on boot, never mutated) ───────────────
  getAllPermissions: (): Promise<Permission[]> =>
    apiClient.get('/v1/permissions'),

  // ─── Roles CRUD ────────────────────────────────────────────────────────────
  // NOTE: getRoles returns bare Role[] with NO rolePermissions array.
  //       getRole(id) returns Role WITH rolePermissions[] populated.
  getRoles: (): Promise<Role[]> =>
    apiClient.get('/v1/roles'),

  getRole: (id: string): Promise<Role> =>
    apiClient.get(`/v1/roles/${id}`),

  createRole: (data: CreateRolePayload): Promise<Role> =>
    apiClient.post('/v1/roles', data),

  updateRole: (id: string, data: UpdateRolePayload): Promise<Role> =>
    apiClient.patch(`/v1/roles/${id}`, data),

  deleteRole: (id: string): Promise<void> =>
    apiClient.delete(`/v1/roles/${id}`),

  // ─── Role ↔ Permission assignment ──────────────────────────────────────────
  assignPermissions: (roleId: string, data: AssignPermissionsPayload): Promise<Role> =>
    apiClient.post(`/v1/roles/${roleId}/permissions`, data),

  removePermission: (roleId: string, permissionId: string): Promise<void> =>
    apiClient.delete(`/v1/roles/${roleId}/permissions/${permissionId}`),
};
