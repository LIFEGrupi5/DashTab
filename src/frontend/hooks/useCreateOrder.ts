'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOrder } from '@/lib/api/orders';
import type { CreateOrderRequest } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateOrderRequest) => createOrder(req),
    onSuccess: order => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success(`Order #${order.orderNumber} sent to kitchen`);
    },
    onError: () => {
      toast.error('Failed to create order. Please try again.');
    },
  });
}
