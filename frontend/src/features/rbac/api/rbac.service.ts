import { apiClient } from '@/lib/api-client';
import type {
  Permission,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  AssignPermissionsPayload,
} from '../types/rbac.dto';

// Unwraps the backend { data: T } ApiResponse envelope
const unwrap = <T>(response: any): T => response.data;

export const RbacService = {
  // ─── Permissions (Read-only — seeded on boot, never mutated) ───────────────
  getAllPermissions: (): Promise<Permission[]> =>
    apiClient.get('/v1/permissions').then(unwrap<Permission[]>),

  // ─── Roles CRUD ────────────────────────────────────────────────────────────
  // NOTE: getRoles returns bare Role[] with NO rolePermissions array.
  //       getRole(id) returns Role WITH rolePermissions[] populated.
  getRoles: (): Promise<Role[]> =>
    apiClient.get('/v1/roles').then(unwrap<Role[]>),

  getRole: (id: string): Promise<Role> =>
    apiClient.get(`/v1/roles/${id}`).then(unwrap<Role>),

  createRole: (data: CreateRolePayload): Promise<Role> =>
    apiClient.post('/v1/roles', data).then(unwrap<Role>),

  updateRole: (id: string, data: UpdateRolePayload): Promise<Role> =>
    apiClient.patch(`/v1/roles/${id}`, data).then(unwrap<Role>),

  deleteRole: (id: string): Promise<void> =>
    apiClient.delete(`/v1/roles/${id}`),

  // ─── Role ↔ Permission assignment ──────────────────────────────────────────
  // NOTE: Assigning permissions to system roles IS allowed by the backend.
  //       Only editing name/description and deleting system roles is blocked.
  assignPermissions: (roleId: string, data: AssignPermissionsPayload): Promise<Role> =>
    apiClient.post(`/v1/roles/${roleId}/permissions`, data).then(unwrap<Role>),

  removePermission: (roleId: string, permissionId: string): Promise<void> =>
    apiClient.delete(`/v1/roles/${roleId}/permissions/${permissionId}`),
};
