'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addMockOrder, type Order, type OrderLineItem } from '@/lib/api/mock';
import { queryKeys } from '@/lib/queryKeys';
import { useAppStore } from '@/stores/useAppStore';

let _nextNum = 11;

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const userName = useAppStore(s => s.user?.name ?? 'Staff');

  return (tableNumber: string, items: OrderLineItem[]) => {
    const now = new Date();
    const orderNumber = String(_nextNum++).padStart(3, '0');
    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      tableNumber,
      createdAt: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      createdByName: userName,
      status: 'new',
      totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
      items,
      placedAtIso: now.toISOString(),
      stageEnteredAtIso: now.toISOString(),
    };
    addMockOrder(order);
    queryClient.setQueryData<Order[]>(queryKeys.orders.all, prev =>
      prev ? [order, ...prev] : [order]
    );
    toast.success(`Order #${orderNumber} sent to kitchen`);
    return order;
  };
}
