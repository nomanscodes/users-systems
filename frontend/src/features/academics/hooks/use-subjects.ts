import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateSubjectPayload, UpdateSubjectPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const useSubjects = () => {
  return useQuery({
    queryKey: ['academics', 'subjects'],
    queryFn: AcademicsService.getSubjects,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createSubject,
    onSuccess: () => {
      toast.success('Subject created successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create subject');
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectPayload }) =>
      AcademicsService.updateSubject(id, data),
    onSuccess: () => {
      toast.success('Subject updated successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update subject');
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteSubject,
    onSuccess: () => {
      toast.success('Subject deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete subject');
    },
  });
};
