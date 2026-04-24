export type Role = 'owner' | 'manager' | 'waiter' | 'kitchen';

export type AuthUser = { id: string; email: string; name: string; role: Role };

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed';

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
  /** When the customer order was placed (ISO). */
  placedAtIso?: string;
  /** When the ticket entered its current kitchen column (ISO). */
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

export type StaffUser = { id: string; name: string; email: string; role: Role; active: boolean };

const MOCK_DELAY_MS = 280;
const delay = (ms: number = MOCK_DELAY_MS) => new Promise<void>(r => setTimeout(r, ms));

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-5',
    orderNumber: '005',
    tableNumber: 'T-2',
    createdAt: '11:10',
    createdByName: 'Ana Waiter',
    status: 'completed',
    totalAmount: 10.5,
    items: [
      { menuItemName: 'Qebapa', quantity: 2, amount: 9.0 },
      { menuItemName: 'Turkish Coffee', quantity: 1, amount: 1.5 },
    ],
  },
  {
    id: 'order-6',
    orderNumber: '006',
    tableNumber: 'T-4',
    createdAt: '12:05',
    createdByName: 'Ana Waiter',
    status: 'completed',
    totalAmount: 7.0,
    items: [
      { menuItemName: 'Tave Kosi', quantity: 1, amount: 6.5 },
      { menuItemName: 'Ayran', quantity: 1, amount: 0.5 },
    ],
  },
  {
    id: 'order-7',
    orderNumber: '007',
    tableNumber: 'T-6',
    createdAt: '13:20',
    createdByName: 'Ana Waiter',
    status: 'completed',
    totalAmount: 8.5,
    items: [
      { menuItemName: 'Pljeskavica', quantity: 1, amount: 5.0 },
      { menuItemName: 'Shopska Salad', quantity: 1, amount: 3.5 },
    ],
  },
  {
    id: 'order-8',
    orderNumber: '008',
    tableNumber: 'T-9',
    createdAt: '14:45',
    createdByName: 'Ana Waiter',
    status: 'completed',
    totalAmount: 19.5,
    items: [
      { menuItemName: 'Qebapa', quantity: 3, amount: 13.5 },
      { menuItemName: 'Raki', quantity: 2, amount: 6.0 },
    ],
  },
  {
    id: 'order-9',
    orderNumber: '009',
    tableNumber: 'T-1',
    createdAt: '16:30',
    createdByName: 'Ana Waiter',
    status: 'completed',
    totalAmount: 6.4,
    items: [
      { menuItemName: 'Byrek', quantity: 2, amount: 2.4 },
      { menuItemName: 'Baklava', quantity: 2, amount: 4.0 },
    ],
  },
  {
    id: 'order-10',
    orderNumber: '010',
    tableNumber: 'T-8',
    createdAt: '17:55',
    createdByName: 'Ana Waiter',
    status: 'completed',
    totalAmount: 14.0,
    items: [
      { menuItemName: 'Fergese', quantity: 2, amount: 11.0 },
      { menuItemName: 'Turkish Coffee', quantity: 2, amount: 3.0 },
    ],
  },
  {
    id: 'order-4',
    orderNumber: '004',
    tableNumber: '1',
    createdAt: '22:49',
    createdByName: 'Ana Waiter',
    status: 'new',
    totalAmount: 16.0,
    items: [
      { menuItemName: 'Pljeskavica', quantity: 1, amount: 5.0 },
      { menuItemName: 'Fergese', quantity: 2, amount: 11.0 },
    ],
  },
  {
    id: 'order-1',
    orderNumber: '001',
    tableNumber: 'T-5',
    createdAt: '19:03',
    createdByName: 'Ana Waiter',
    status: 'new',
    totalAmount: 12.0,
    items: [
      { menuItemName: 'Qebapa', quantity: 2, amount: 9.0 },
      { menuItemName: 'Turkish Coffee', quantity: 2, amount: 3.0 },
    ],
  },
  {
    id: 'order-2',
    orderNumber: '002',
    tableNumber: 'T-3',
    createdAt: '18:53',
    createdByName: 'Ana Waiter',
    status: 'preparing',
    delayed: true,
    totalAmount: 10.0,
    items: [
      { menuItemName: 'Tave Kosi', quantity: 1, amount: 6.5 },
      { menuItemName: 'Shopska Salad', quantity: 1, amount: 3.5 },
    ],
  },
  {
    id: 'order-3',
    orderNumber: '003',
    tableNumber: 'T-7',
    createdAt: '18:43',
    createdByName: 'Ana Waiter',
    status: 'ready',
    totalAmount: 17.4,
    items: [
      { menuItemName: 'Pljeskavica', quantity: 3, amount: 15.0 },
      { menuItemName: 'Byrek', quantity: 2, amount: 2.4 },
    ],
  },
];

export const MOCK_MENU: MenuItem[] = [
  { id: '1', name: 'Qebapa', category: 'Main Course', price: 4.5, available: true, description: 'Traditional grilled meat' },
  { id: '2', name: 'Pljeskavica', category: 'Main Course', price: 5, available: true, description: 'Grilled patty' },
  { id: '3', name: 'Tave Kosi', category: 'Main Course', price: 6.5, available: true, description: 'Lamb with yogurt' },
  { id: '4', name: 'Fergese', category: 'Main Course', price: 5.5, available: true, description: 'Peppers with cheese' },
  { id: '5', name: 'Byrek', category: 'Appetizer', price: 1.2, available: true, description: 'Cheese or meat pie' },
  { id: '6', name: 'Shopska Salad', category: 'Salad', price: 3.5, available: true, description: 'Fresh vegetable salad' },
  { id: '7', name: 'Baklava', category: 'Dessert', price: 2, available: true, description: 'Sweet pastry' },
  { id: '8', name: 'Turkish Coffee', category: 'Beverage', price: 1.5, available: true, description: '' },
  { id: '9', name: 'Raki', category: 'Beverage', price: 3, available: true, description: '' },
  { id: '10', name: 'Ayran', category: 'Beverage', price: 0.5, available: true, description: '' },
];

export const MOCK_USERS: StaffUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@restaurant.com', role: 'owner', active: true },
  { id: '2', name: 'John Manager', email: 'manager@restaurant.com', role: 'manager', active: true },
  { id: '3', name: 'Ana Waiter', email: 'ana@restaurant.com', role: 'waiter', active: true },
  { id: '4', name: 'Petrit Chef', email: 'petrit@restaurant.com', role: 'kitchen', active: true },
];

const EMAIL_TO_AUTH: Record<string, AuthUser> = Object.fromEntries(
  MOCK_USERS.map(u => [u.email, { id: u.id, email: u.email, name: u.name, role: u.role }])
);

/** Demo offsets from “now” so wait / stage timers always make sense on first load. */
export function enrichOrderKitchenTimes(o: Order, nowMs: number): Order {
  const spec: Record<string, { placedMinAgo: number; stageMinAgo: number }> = {
    'order-1': { placedMinAgo: 10, stageMinAgo: 10 },
    'order-2': { placedMinAgo: 32, stageMinAgo: 11 },
    'order-3': { placedMinAgo: 48, stageMinAgo: 6 },
    'order-4': { placedMinAgo: 180, stageMinAgo: 45 },
    'order-5': { placedMinAgo: 540, stageMinAgo: 540 },
    'order-6': { placedMinAgo: 480, stageMinAgo: 480 },
    'order-7': { placedMinAgo: 420, stageMinAgo: 420 },
    'order-8': { placedMinAgo: 330, stageMinAgo: 330 },
    'order-9': { placedMinAgo: 240, stageMinAgo: 240 },
    'order-10': { placedMinAgo: 150, stageMinAgo: 150 },
  };
  const s = spec[o.id] ?? { placedMinAgo: 5, stageMinAgo: 5 };
  return {
    ...o,
    placedAtIso: new Date(nowMs - s.placedMinAgo * 60_000).toISOString(),
    stageEnteredAtIso: new Date(nowMs - s.stageMinAgo * 60_000).toISOString(),
  };
}

/** Ensures kitchen timers always have ISO fields (e.g. stale query cache or partial merges). */
export function ensureOrderKitchenTimes(o: Order, nowMs: number = Date.now()): Order {
  if (o.placedAtIso && o.stageEnteredAtIso) return o;
  if (!o.placedAtIso) return enrichOrderKitchenTimes(o, nowMs);
  return { ...o, stageEnteredAtIso: o.stageEnteredAtIso ?? o.placedAtIso };
}

let _ordersStore: Order[] | null = null;

function getOrdersStore(): Order[] {
  if (!_ordersStore) _ordersStore = [...MOCK_ORDERS];
  return _ordersStore;
}

export function addMockOrder(order: Order): void {
  getOrdersStore().unshift(order);
}

export async function fetchMockOrders(): Promise<Order[]> {
  await delay();
  const now = Date.now();
  return getOrdersStore().map(o => ensureOrderKitchenTimes(o, now));
}

export async function fetchMockMenu(): Promise<MenuItem[]> {
  await delay();
  return [...MOCK_MENU];
}

export async function fetchMockUsers(): Promise<StaffUser[]> {
  await delay();
  return [...MOCK_USERS];
}

export async function fetchMockMe(token: string | null): Promise<AuthUser | null> {
  await delay(120);
  if (!token) return null;
  const m = /^mock_token_(.+)$/.exec(token);
  if (!m) return null;
  const row = MOCK_USERS.find(u => u.id === m[1]);
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function mockTokenForUserId(userId: string) {
  return `mock_token_${userId}`;
}

export function authUserFromEmail(email: string): AuthUser | null {
  return EMAIL_TO_AUTH[email] ?? null;
}
