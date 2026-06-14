import { apiGet, apiPatch, apiPost } from './client';
import type { CreateOrderRequest, Order, PagedResult } from './types';

export const fetchOrders = (status?: string) =>
  apiGet<PagedResult<Order>>(status ? `/orders?status=${status}` : '/orders').then(r => r.items);

export const fetchOrder = (id: string) => apiGet<Order>(`/orders/${id}`);

export const createOrder = (req: CreateOrderRequest) => apiPost<Order>('/orders', req);

export const updateOrderStatus = (id: string, status: string) =>
  apiPatch<Order>(`/orders/${id}/status`, { status });

export const cancelOrder = (id: string) => apiPost<Order>(`/orders/${id}/cancel`, {});
