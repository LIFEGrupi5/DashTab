'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockMe } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';
import { useAppStore } from '@/stores/useAppStore';

export function useAuth() {
  const token = useAppStore(s => s.token);
  return useQuery({
    queryKey: queryKeys.auth.me(token),
    queryFn: () => fetchMockMe(token),
    enabled: !!token,
  });
}
