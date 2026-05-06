'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateOrderStatus } from '@/lib/api/orders';
import { queryKeys } from '@/lib/queryKeys';

export function useSetOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: order => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success(`Order marked as ${order.status}`);
    },
    onError: () => {
      toast.error('Failed to update order status.');
    },
  });
}
