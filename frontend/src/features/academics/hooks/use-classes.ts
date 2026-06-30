import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateClassPayload, UpdateClassPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const useClasses = () => {
  return useQuery({
    queryKey: ['academics', 'classes'],
    queryFn: AcademicsService.getClasses,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createClass,
    onSuccess: () => {
      toast.success('Class created successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create class');
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassPayload }) =>
      AcademicsService.updateClass(id, data),
    onSuccess: () => {
      toast.success('Class updated successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update class');
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteClass,
    onSuccess: () => {
      toast.success('Class deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete class');
    },
  });
};
