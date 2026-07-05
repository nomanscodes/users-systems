import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StaffService } from '../api/staff.service';
import type { AssignTeacherPayload } from '../types/staff.dto';

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
// ⚠️ THESE HOOKS ARE NOT TO BE USED — Backend endpoints do not exist yet.
// GET/POST/DELETE /staff/:id/roles are pending backend implementation.
// Build the Roles tab as a placeholder until these ship.
// Hooks defined here for future activation only — do NOT import them into components.

export const _useStaffRoles_BLOCKED = (staffId: string | null) => {
  return useQuery({
    queryKey: ['staff', 'roles', staffId],
    queryFn: () => StaffService.getStaffRoles(staffId!),
    enabled: false, // ALWAYS disabled until backend ships
  });
};
