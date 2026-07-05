import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StaffService } from '../api/staff.service';
import type { InviteStaffPayload, UpdateStaffPayload } from '../types/staff.dto';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all staff members (staffProfile + user + designation).
 * NOTE: Roles are NOT in this response — staff roles backend endpoints not yet built.
 */
export const useStaff = () => {
  return useQuery({
    queryKey: ['staff', 'list'],
    queryFn: StaffService.getAllStaff,
  });
};

/**
 * Fetches a single staff member with full detail (includes assignments).
 * NOTE: Roles are still NOT in this response.
 */
export const useStaffMember = (id: string | null) => {
  return useQuery({
    queryKey: ['staff', 'detail', id],
    queryFn: () => StaffService.getStaffMember(id!),
    enabled: !!id,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Invites a new staff member (creates user + profile + role assignments atomically).
 * On success: does NOT show a toast — the parent component opens TempPasswordDialog instead.
 * The full response (including temporaryPassword) is returned via mutateAsync.
 * On error: 409 for duplicate email (inline), 404 for invalid designationId/roleIds (toast).
 */
export const useInviteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteStaffPayload) => StaffService.inviteStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
      // No toast — parent shows TempPasswordDialog with the temporaryPassword
    },
    // No onError — caller handles:
    //   409 → inline email field error "A user with this email already exists"
    //   404 → toast "One or more roles/designations no longer exist"
  });
};

/**
 * Updates staff profile fields (not the users table).
 * PATCH /staff/:id only accepts: designationId, department, joiningDate, qualification, subjectSpecialty.
 * salary and employeeId are NOT updatable via this endpoint currently.
 */
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffPayload }) =>
      StaffService.updateStaff(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['staff', 'detail', id] });
    },
    onError: () => {
      toast.error('Failed to update profile.');
    },
  });
};

/**
 * Deactivates a staff member — sets user.status = INACTIVE (NOT a hard delete).
 * The staff member remains visible in the table with an "Inactive" badge.
 */
export const useDeactivateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StaffService.deactivateStaff(id),
    onSuccess: () => {
      toast.success('Staff member deactivated');
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    },
    onError: () => {
      toast.error('Failed to deactivate staff member.');
    },
  });
};
