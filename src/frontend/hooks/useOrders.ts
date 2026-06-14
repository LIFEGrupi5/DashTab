'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/lib/api/orders';
import { ensureOrderKitchenTimes } from '@/lib/orders/kitchenTimes';
import { queryKeys } from '@/lib/queryKeys';

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => fetchOrders(),
    staleTime: 10_000,
    refetchInterval: 30_000,
    select: data => {
      if (!data.some(o => !o.placedAtIso || !o.stageEnteredAtIso)) return data;
      const now = Date.now();
      return data.map(o => ensureOrderKitchenTimes(o, now));
    },
  });
}
