import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StaffService } from '../api/staff.service';
import type { AssignTeacherPayload, AssignStaffRolePayload } from '../types/staff.dto';

// ─── Teaching Assignment Queries ──────────────────────────────────────────────

export const useStaffAssignments = (staffId: string | null) => {
  return useQuery({
    queryKey: ['staff', 'assignments', staffId],
    queryFn: () => StaffService.getAssignments(staffId!),
    enabled: !!staffId,
  });
};

// ─── Teaching Assignment Mutations ────────────────────────────────────────────

/**
 * Assigns a teacher to a batch+subject combination.
 * Backend validates designation.category === 'TEACHING' — returns 409 if violated.
 * Also returns 409 for duplicate assignment (same teacher + batch + subject).
 * Error is NOT toasted — caller handles inline.
 */
export const useAssignTeacher = (staffId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignTeacherPayload) => StaffService.assignTeacher(staffId, data),
    onSuccess: () => {
      toast.success('Teacher assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['staff', 'assignments', staffId] });
    },
    // No onError — caller handles 409 inline ("already assigned" or "not a teaching staff")
  });
};

export const useRemoveAssignment = (staffId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => StaffService.removeAssignment(staffId, assignmentId),
    onSuccess: () => {
      toast.success('Assignment removed');
      queryClient.invalidateQueries({ queryKey: ['staff', 'assignments', staffId] });
    },
    onError: () => {
      toast.error('Failed to remove assignment.');
    },
  });
};

// ─── Staff → Roles ────────────────────────────────────────────────────────────

/**
 * Fetches all roles assigned to a specific staff member.
 * Returns StaffRole[] with nested role details.
 */
export const useStaffRoles = (staffId: string | null) => {
  return useQuery({
    queryKey: ['staff', 'roles', staffId],
    queryFn: () => StaffService.getStaffRoles(staffId!),
    enabled: !!staffId,
  });
};

/**
 * Assigns one or more roles to a staff member.
 * Silently succeeds — parent component handles UI feedback.
 */
export const useAssignStaffRole = (staffId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignStaffRolePayload) => StaffService.assignStaffRole(staffId, data),
    onSuccess: () => {
      toast.success('Role(s) assigned');
      queryClient.invalidateQueries({ queryKey: ['staff', 'roles', staffId] });
    },
    onError: () => {
      toast.error('Failed to assign role(s).');
    },
  });
};

/**
 * Removes a single role from a staff member.
 */
export const useRemoveStaffRole = (staffId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => StaffService.removeStaffRole(staffId, roleId),
    onSuccess: () => {
      toast.success('Role removed');
      queryClient.invalidateQueries({ queryKey: ['staff', 'roles', staffId] });
    },
    onError: () => {
      toast.error('Failed to remove role.');
    },
  });
};
