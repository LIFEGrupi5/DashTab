export type PagedResult<T> = { items: T[]; total: number; skip: number; take: number };

export type Role = 'owner' | 'manager' | 'waiter' | 'kitchen';

export type AuthUser = { id: string; email: string; name: string; role: Role };

export type AuthSession = { accessToken: string; refreshToken: string; expiresIn: number };

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderLineItem = { menuItemName: string; quantity: number; amount: number };

export type Order = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  createdAt: string;
  createdByName: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderLineItem[];
  delayed?: boolean;
  placedAtIso?: string;
  stageEnteredAtIso?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  displayOrder: number;
};

export type StaffUser = { id: string; name: string; email: string; role: Role; active: boolean };

export type CreateOrderItemRequest = { menuItemId: string; quantity: number };

export type CreateOrderRequest = {
  tableNumber: string;
  notes?: string;
  items: CreateOrderItemRequest[];
};
