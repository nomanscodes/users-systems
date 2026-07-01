import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import { toast } from 'sonner';

export const useBatches = () => {
  return useQuery({
    queryKey: ['academics', 'batches'],
    queryFn: AcademicsService.getBatches,
  });
};

export const useCreateBatches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createBatches,
    onSuccess: () => {
      // Invalidate if there is a getBatches query
      queryClient.invalidateQueries({ queryKey: ['academics', 'batches'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create classroom');
    },
  });
};

export const useSyncBatches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.syncBatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'batches'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to sync classrooms');
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'batches'] });
      toast.success('Classroom deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete classroom');
    },
  });
};
