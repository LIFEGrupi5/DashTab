'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createStaffMember, fetchStaff } from '@/lib/api/staff';
import type { StaffFormData } from '@/lib/schemas';
import { queryKeys } from '@/lib/queryKeys';

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users.all, queryFn: fetchStaff });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffFormData) => createStaffMember(data),
    onSuccess: user => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success(`${user.name} added to the team`);
    },
    onError: () => {
      toast.error('Failed to add member. Please try again.');
    },
  });
}
