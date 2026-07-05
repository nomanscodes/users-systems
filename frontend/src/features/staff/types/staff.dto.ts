import type { Role } from '@/features/rbac/types/rbac.dto';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type DesignationCategory = 'TEACHING' | 'NON_TEACHING' | 'ADMIN';

// UserStatus has 3 values — NOT just ACTIVE/INACTIVE
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// ─── Designation ─────────────────────────────────────────────────────────────

export interface Designation {
  id: string;
  title: string;
  category: DesignationCategory;
  createdAt: string;
  updatedAt: string;
}

// ─── Staff Profile ────────────────────────────────────────────────────────────

export interface StaffProfile {
  id: string;
  userId: string;
  designationId: string;
  designation: Designation;
  employeeId: string | null;
  department: string | null;
  joiningDate: string | null; // 'YYYY-MM-DD'
  qualification: string | null;
  subjectSpecialty: string | null;
  salary: number | null; // Present in response but NOT editable via PATCH — display only
  createdAt: string;
  updatedAt: string;
  assignments?: TeacherAssignment[]; // Only in GET /staff/:id detail
}

// ─── Staff User (embedded in StaffMember) ────────────────────────────────────

export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus; // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  phone: string | null;
}

// ─── Staff Member ─────────────────────────────────────────────────────────────
// IMPORTANT: id is staffProfile.id — NOT user.id
// Roles are NOT included in GET /staff or GET /staff/:id responses.
// Staff roles endpoints are NOT YET IMPLEMENTED in the backend.

export interface StaffMember {
  id: string; // staffProfile.id
  userId: string;
  user: StaffUser;
  staffProfile: StaffProfile;
}

// ─── Staff Role (for future GET /staff/:id/roles — NOT YET IMPLEMENTED) ──────

export interface StaffRole {
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt: string;
  role: Role;
}

// ─── Teacher Assignment ───────────────────────────────────────────────────────

export interface TeacherAssignment {
  id: string;
  staffProfileId: string;
  batchId: string;
  subjectId: string;
  sessionId: string; // Denormalized from batch at assignment time
  assignedAt: string;
  batch: {
    id: string;
    classEntity?: { name: string };
    group?: { name: string } | null;   // nullable in BatchTypeOrmEntity
    section?: { name: string } | null; // nullable in BatchTypeOrmEntity
    session?: { name: string };
  };
  subject: {
    id: string;
    name: string;
    code: string | null; // nullable in SubjectTypeOrmEntity
  };
}

// ─── Invite Response ──────────────────────────────────────────────────────────

export interface InviteStaffResponse {
  userId: string;
  staffProfileId: string;
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string; // Plain text — shown once, must be handed to staff manually
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

/**
 * InviteStaffPayload — maps exactly to InviteStaffDto on the backend.
 * IMPORTANT: joiningDate, qualification, subjectSpecialty are NOT in this DTO.
 * Those must be updated separately via PATCH /staff/:id after creation.
 */
export interface InviteStaffPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  designationId: string;
  department?: string;
  roleIds: string[];
}

/**
 * UpdateStaffPayload — maps exactly to UpdateStaffProfileDto on the backend.
 * NOTE: salary and employeeId are NOT in this DTO. They cannot be edited currently.
 */
export interface UpdateStaffPayload {
  designationId?: string;
  department?: string;
  joiningDate?: string;
  qualification?: string;
  subjectSpecialty?: string;
}

export interface AssignTeacherPayload {
  batchId: string;
  subjectId: string;
}

export interface AssignStaffRolePayload {
  roleIds: string[];
}

export interface CreateDesignationPayload {
  title: string;
  category: DesignationCategory;
}

export type UpdateDesignationPayload = Partial<CreateDesignationPayload>;
