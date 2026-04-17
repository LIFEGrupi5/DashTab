'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockUsers } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users.all, queryFn: fetchMockUsers });
}
