'use client';

import { useQuery } from '@tanstack/react-query';
import { ensureOrderKitchenTimes, fetchMockOrders } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    // TODO(api): replace fetchMockOrders with → GET /api/orders
    queryFn: fetchMockOrders,
    staleTime: 1000 * 60 * 60 * 24,
    select: data => {
      if (!data.some(o => !o.placedAtIso || !o.stageEnteredAtIso)) return data;
      const now = Date.now();
      return data.map(o => ensureOrderKitchenTimes(o, now));
    },
  });
}
