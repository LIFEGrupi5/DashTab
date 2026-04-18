'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';

export function useSetOrderStatus() {
  const queryClient = useQueryClient();

  return (orderId: string, status: OrderStatus) => {
    const entered = new Date().toISOString();
    queryClient.setQueryData<Order[]>(queryKeys.orders.all, prev => {
      if (!prev) return prev;
      return prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status,
              stageEnteredAtIso: entered,
              placedAtIso: o.placedAtIso ?? entered,
            }
          : o
      );
    });
  };
}
