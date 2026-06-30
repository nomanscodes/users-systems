import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateBranchPayload, UpdateBranchPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const useBranches = () => {
  return useQuery({
    queryKey: ['academics', 'branches'],
    queryFn: AcademicsService.getBranches,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createBranch,
    onSuccess: () => {
      toast.success('Branch created successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'branches'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create branch');
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchPayload }) =>
      AcademicsService.updateBranch(id, data),
    onSuccess: () => {
      toast.success('Branch updated successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'branches'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update branch');
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteBranch,
    onSuccess: () => {
      toast.success('Branch deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'branches'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete branch');
    },
  });
};
