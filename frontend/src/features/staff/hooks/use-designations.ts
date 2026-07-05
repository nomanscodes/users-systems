import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StaffService } from '../api/staff.service';
import type { CreateDesignationPayload, UpdateDesignationPayload } from '../types/staff.dto';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useDesignations = () => {
  return useQuery({
    queryKey: ['staff', 'designations'],
    queryFn: StaffService.getDesignations,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a designation. Backend returns 409 ConflictException for duplicate title.
 * Error is NOT toasted — caller handles inline error under the title field.
 */
export const useCreateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDesignationPayload) => StaffService.createDesignation(data),
    onSuccess: () => {
      toast.success('Designation created');
      queryClient.invalidateQueries({ queryKey: ['staff', 'designations'] });
    },
    // No onError — component handles 409 ConflictException inline
  });
};

/**
 * Updates a designation. Backend returns 409 ConflictException for duplicate title.
 * Error is NOT toasted — caller handles inline error under the title field.
 */
export const useUpdateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDesignationPayload }) =>
      StaffService.updateDesignation(id, data),
    onSuccess: () => {
      toast.success('Designation updated');
      queryClient.invalidateQueries({ queryKey: ['staff', 'designations'] });
    },
    // No onError — component handles 409 ConflictException inline
  });
};

/**
 * Deletes a designation.
 * Backend returns 403 ForbiddenException if the designation is assigned to staff.
 * Backend returns 404 NotFoundException if not found.
 */
export const useDeleteDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StaffService.deleteDesignation(id),
    onSuccess: () => {
      toast.success('Designation deleted');
      queryClient.invalidateQueries({ queryKey: ['staff', 'designations'] });
    },
    onError: (err: any) => {
      const status = err?.statusCode ?? err?.status;
      if (status === 403) {
        toast.error('Cannot delete — this designation is currently assigned to staff members.');
      } else if (status === 404) {
        toast.error('Designation not found.');
      } else {
        toast.error('Failed to delete designation.');
      }
    },
  });
};
