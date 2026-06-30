import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateGroupPayload, UpdateGroupPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const useGroups = () => {
  return useQuery({
    queryKey: ['academics', 'groups'],
    queryFn: AcademicsService.getGroups,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createGroup,
    onSuccess: () => {
      toast.success('Group created successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'groups'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create group');
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupPayload }) =>
      AcademicsService.updateGroup(id, data),
    onSuccess: () => {
      toast.success('Group updated successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'groups'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update group');
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteGroup,
    onSuccess: () => {
      toast.success('Group deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'groups'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete group');
    },
  });
};
