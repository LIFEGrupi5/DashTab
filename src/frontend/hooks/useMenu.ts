'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMenuItems } from '@/lib/api/menu';
import { queryKeys } from '@/lib/queryKeys';

export function useMenu() {
  return useQuery({ queryKey: queryKeys.menu.all, queryFn: () => fetchMenuItems() });
}
