'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockOrders } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';

export function useOrders() {
  return useQuery({ queryKey: queryKeys.orders.all, queryFn: fetchMockOrders });
}
