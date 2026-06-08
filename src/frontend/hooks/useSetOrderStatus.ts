'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateOrderStatus } from '@/lib/api/orders';
import { queryKeys } from '@/lib/queryKeys';
import { analytics } from '@/lib/analytics';

export function useSetOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: (order, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success(`Order marked as ${order.status}`);
      analytics.orderStatusChanged({ orderId: variables.id, toStatus: variables.status });
      if (variables.status === 'completed') {
        analytics.nsmOrderCompleted({
          orderId: variables.id,
          totalAmount: order.totalAmount,
          itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
        });
      }
    },
    onError: () => {
      toast.error('Failed to update order status.');
    },
  });
}
