'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockMenu } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';

export function useMenu() {
  return useQuery({ queryKey: queryKeys.menu.all, queryFn: fetchMockMenu });
}
