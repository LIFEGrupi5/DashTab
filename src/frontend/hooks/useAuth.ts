'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/lib/api/auth';
import { queryKeys } from '@/lib/queryKeys';
import { useAppStore } from '@/stores/useAppStore';

export function useAuth() {
  const token = useAppStore(s => s.token);
  return useQuery({
    queryKey: queryKeys.auth.me(token),
    queryFn: fetchMe,
    enabled: !!token,
  });
}
