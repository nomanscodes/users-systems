import { apiClient } from '@/lib/api-client';
import type {
  Designation,
  CreateDesignationPayload,
  UpdateDesignationPayload,
  StaffMember,
  InviteStaffPayload,
  InviteStaffResponse,
  UpdateStaffPayload,
  TeacherAssignment,
  AssignTeacherPayload,
  AssignStaffRolePayload,
  StaffRole,
} from '../types/staff.dto';

// Unwraps the backend { data: T } ApiResponse envelope
const unwrap = <T>(response: any): T => response.data;

export const StaffService = {
  // ─── Designations ─────────────────────────────────────────────────────────
  // Delete returns 403 ForbiddenException if designation is in use
  // Create/Update return 409 ConflictException for duplicate titles
  getDesignations: (): Promise<Designation[]> =>
    apiClient.get('/v1/designations').then(unwrap<Designation[]>),

  createDesignation: (data: CreateDesignationPayload): Promise<Designation> =>
    apiClient.post('/v1/designations', data).then(unwrap<Designation>),

  updateDesignation: (id: string, data: UpdateDesignationPayload): Promise<Designation> =>
    apiClient.patch(`/v1/designations/${id}`, data).then(unwrap<Designation>),

  deleteDesignation: (id: string): Promise<void> =>
    apiClient.delete(`/v1/designations/${id}`),

  // ─── Staff ────────────────────────────────────────────────────────────────
  // NOTE: getAllStaff returns staffProfile + user + designation only.
  //       Roles are NOT in the response — staff roles endpoints not yet built.
  getAllStaff: (): Promise<StaffMember[]> =>
    apiClient.get('/v1/staff').then(unwrap<StaffMember[]>),

  // NOTE: getStaffMember returns staffProfile + user + designation + assignments.
  //       Roles are still NOT included — fetch separately when backend is ready.
  getStaffMember: (id: string): Promise<StaffMember> =>
    apiClient.get(`/v1/staff/${id}`).then(unwrap<StaffMember>),

  // Returns { userId, staffProfileId, email, temporaryPassword }
  // temporaryPassword is plain text — shown once to admin, then lost
  inviteStaff: (data: InviteStaffPayload): Promise<InviteStaffResponse> =>
    apiClient.post('/v1/staff/invite', data).then(unwrap<InviteStaffResponse>),

  // Only updates staff_profiles fields (not users table)
  updateStaff: (id: string, data: UpdateStaffPayload): Promise<StaffMember> =>
    apiClient.patch(`/v1/staff/${id}`, data).then(unwrap<StaffMember>),

  // Sets user.status = INACTIVE — NOT a hard delete
  deactivateStaff: (id: string): Promise<void> =>
    apiClient.delete(`/v1/staff/${id}`),

  // ─── Staff → Roles ────────────────────────────────────────────────────────
  // ⚠️ NOT YET IMPLEMENTED IN BACKEND — these methods will 404
  // Keeping them here for when backend ships the endpoints
  getStaffRoles: (staffId: string): Promise<StaffRole[]> =>
    apiClient.get(`/v1/staff/${staffId}/roles`).then(unwrap<StaffRole[]>),

  assignStaffRole: (staffId: string, data: AssignStaffRolePayload): Promise<void> =>
    apiClient.post(`/v1/staff/${staffId}/roles`, data),

  removeStaffRole: (staffId: string, roleId: string): Promise<void> =>
    apiClient.delete(`/v1/staff/${staffId}/roles/${roleId}`),

  // ─── Teaching Assignments ─────────────────────────────────────────────────
  // Backend validates designation.category === 'TEACHING' before allowing assignment
  getAssignments: (staffId: string): Promise<TeacherAssignment[]> =>
    apiClient.get(`/v1/staff/${staffId}/assignments`).then(unwrap<TeacherAssignment[]>),

  assignTeacher: (staffId: string, data: AssignTeacherPayload): Promise<TeacherAssignment> =>
    apiClient.post(`/v1/staff/${staffId}/assignments`, data).then(unwrap<TeacherAssignment>),

  removeAssignment: (staffId: string, assignmentId: string): Promise<void> =>
    apiClient.delete(`/v1/staff/${staffId}/assignments/${assignmentId}`),

  // ─── Batch Teachers lookup ────────────────────────────────────────────────
  // Routed under Staff controller: GET /staff/batches/:batchId/teachers
  getTeachersByBatch: (batchId: string): Promise<TeacherAssignment[]> =>
    apiClient.get(`/v1/staff/batches/${batchId}/teachers`).then(unwrap<TeacherAssignment[]>),
};
