import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateSectionPayload, UpdateSectionPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const useSections = () => {
  return useQuery({
    queryKey: ['academics', 'sections'],
    queryFn: AcademicsService.getSections,
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createSection,
    onSuccess: () => {
      toast.success('Section created successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'sections'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create section');
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionPayload }) =>
      AcademicsService.updateSection(id, data),
    onSuccess: () => {
      toast.success('Section updated successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'sections'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update section');
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteSection,
    onSuccess: () => {
      toast.success('Section deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'sections'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete section');
    },
  });
};
