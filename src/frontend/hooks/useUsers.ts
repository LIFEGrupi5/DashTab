'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStaff } from '@/lib/api/staff';
import { queryKeys } from '@/lib/queryKeys';

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users.all, queryFn: fetchStaff });
}
