import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicsService } from '../api/academics.service';
import type { CreateSessionPayload, UpdateSessionPayload } from '../types/academics.dto';
import { toast } from 'sonner';

export const useSessions = () => {
  return useQuery({
    queryKey: ['academics', 'sessions'],
    queryFn: AcademicsService.getSessions,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.createSession,
    onSuccess: () => {
      toast.success('Session created successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'sessions'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create session');
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionPayload }) =>
      AcademicsService.updateSession(id, data),
    onSuccess: () => {
      toast.success('Session updated successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'sessions'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update session');
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AcademicsService.deleteSession,
    onSuccess: () => {
      toast.success('Session deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['academics', 'sessions'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete session');
    },
  });
};
