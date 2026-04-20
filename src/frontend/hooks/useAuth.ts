'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockMe } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';
import { useAppStore } from '@/stores/useAppStore';

export function useAuth() {
  const token = useAppStore(s => s.token);
  return useQuery({
    queryKey: queryKeys.auth.me(token),
    // TODO(api): replace fetchMockMe with → GET /api/auth/me
    queryFn: () => fetchMockMe(token),
    enabled: !!token,
  });
}
