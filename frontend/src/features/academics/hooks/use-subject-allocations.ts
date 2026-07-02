import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateSubjectAllocationPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const ALLOCATION_QUERY_KEY = ['academics', 'subject-allocations'] as const;

export const useSubjectAllocations = () => {
  return useQuery({
    queryKey: ALLOCATION_QUERY_KEY,
    queryFn: AcademicsService.getSubjectAllocations,
  });
};

export const useCreateSubjectAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectAllocationPayload) =>
      AcademicsService.createSubjectAllocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATION_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to allocate subject');
    },
  });
};

export const useDeleteSubjectAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AcademicsService.deleteSubjectAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATION_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove subject allocation');
    },
  });
};
