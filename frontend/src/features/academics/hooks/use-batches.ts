import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import { toast } from 'sonner';

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
