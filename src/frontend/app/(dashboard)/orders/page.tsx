'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock3, Funnel, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TextField from '@/components/TextField';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useOrders } from '@/hooks/useOrders';
import { useMenu } from '@/hooks/useMenu';
import { useSetOrderStatus } from '@/hooks/useSetOrderStatus';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import type { OrderLineItem } from '@/lib/api/mock';

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50',
  preparing:
    'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/45',
  ready:
    'bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900/50',
  completed:
    'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-muted/40 dark:text-muted-foreground dark:border-border',
};

function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-muted rounded w-28" />
          <div className="h-3 bg-neutral-100 dark:bg-muted/60 rounded w-40" />
        </div>
        <div className="h-5 bg-neutral-200 dark:bg-muted rounded w-16" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-6 bg-neutral-100 dark:bg-muted/60 rounded w-20" />
        <div className="h-6 bg-neutral-100 dark:bg-muted/60 rounded w-24" />
      </div>
      <div className="h-7 bg-neutral-100 dark:bg-muted/60 rounded w-28" />
    </div>
  );
}

export default function OrdersPage() {
  const hydrated = useStoreHydrated();
  const user = useAppStore(s => s.user);
  const { data: orders = [], isLoading, isError } = useOrders();
  const { data: menuItems = [] } = useMenu();
  const setOrderStatus = useSetOrderStatus();
  const createOrder = useCreateOrder();

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('all');
  const [open, setOpen] = useState(false);
  const [modalTable, setModalTable] = useState('');
  const [modalCart, setModalCart] = useState<Record<string, number>>({});

  const isWaiter = user?.role === 'waiter';

  const filtered = useMemo(
    () => (activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab)),
    [orders, activeTab]
  );

  const counts = useMemo(
    () => ({
      all: orders.length,
      new: orders.filter(o => o.status === 'new').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
    }),
    [orders]
  );

  const modalTotal = Object.entries(modalCart)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [id, qty]) => {
      const item = menuItems.find(i => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);

  const addModalItem = (id: string) => setModalCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const removeModalItem = (id: string) =>
    setModalCart(prev => {
      const next = { ...prev, [id]: (prev[id] ?? 0) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const handleModalCreate = () => {
    const items = Object.entries(modalCart).filter(([, qty]) => qty > 0);
    if (!modalTable.trim() || items.length === 0) {
      toast.error('Add a table number and at least one item');
      return;
    }
    const lineItems: OrderLineItem[] = items.map(([id, qty]) => {
      const item = menuItems.find(i => i.id === id)!;
      return { menuItemName: item.name, quantity: qty, amount: item.price * qty };
    });
    createOrder(modalTable.trim(), lineItems);
    setOpen(false);
    setModalTable('');
    setModalCart({});
  };

  const handleStatusChange = (orderId: string, label: string, next: 'preparing' | 'ready' | 'completed') => {
    setOrderStatus(orderId, next);
    toast.success(`Order marked as ${next}`);
  };

  if (!hydrated) {
    return (
      <div className="p-6 w-[95%] mx-auto">
        <div className="h-8 bg-neutral-200 dark:bg-muted rounded w-32 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <p className="text-sm text-neutral-500 dark:text-muted-foreground">Failed to load orders.</p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!isWaiter) {
    return (
      <div className="p-6 w-[95%] mx-auto">
        <PageHeader
          title="Orders"
          subtitle={isLoading ? 'Loading orders…' : `${orders.length} total orders`}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4" /> New Order
            </Button>
          }
        />

        <div className="flex gap-1 bg-neutral-100 dark:bg-muted/30 rounded-lg p-1 mb-5 w-full sm:w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-card text-neutral-900 dark:text-foreground shadow-sm'
                  : 'text-neutral-500 dark:text-muted-foreground hover:text-neutral-700 dark:hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <OrderCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-sm text-neutral-500 dark:text-muted-foreground">
              No orders found
            </div>
          ) : (
            filtered.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-foreground">Order #{order.orderNumber}</p>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">
                      Table {order.tableNumber} · by {order.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={order.status} toneClassName={STATUS_STYLES[order.status]} />
                    <span className="text-sm font-bold text-neutral-900 dark:text-foreground">
                      €{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {order.items.map(item => (
                    <span
                      key={`${order.id}-${item.menuItemName}-${item.quantity}`}
                      className="text-xs bg-neutral-100 dark:bg-muted/40 text-neutral-700 dark:text-foreground px-2 py-1 rounded-md"
                    >
                      {item.quantity}x {item.menuItemName}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {order.status === 'new' && (
                    <Button variant="warning" size="sm" onClick={() => handleStatusChange(order.id, order.orderNumber, 'preparing')}>
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button variant="success" size="sm" onClick={() => handleStatusChange(order.id, order.orderNumber, 'ready')}>
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button variant="secondary" size="sm" onClick={() => handleStatusChange(order.id, order.orderNumber, 'completed')}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {open && (
          <Modal
            title="New Order"
            onClose={() => { setOpen(false); setModalTable(''); setModalCart({}); }}
            maxWidthClassName="max-w-md max-h-[90vh] overflow-y-auto"
            bodyClassName="space-y-4"
            footer={
              <div className="space-y-2">
                {modalTotal > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-neutral-900 dark:text-foreground px-1">
                    <span>Total</span>
                    <span className="text-orange-600 dark:text-orange-400">€{modalTotal.toFixed(2)}</span>
                  </div>
                )}
                <Button fullWidth onClick={handleModalCreate}>Create Order</Button>
              </div>
            }
          >
            <TextField
              label="Table Number"
              type="text"
              placeholder="e.g. T-5"
              className="py-2"
              value={modalTable}
              onChange={e => setModalTable(e.target.value)}
            />
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-2">Menu Items</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {menuItems.map(item => {
                  const qty = modalCart[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-transparent hover:bg-neutral-50 dark:hover:bg-muted/25 hover:border-neutral-200 dark:hover:border-border transition"
                    >
                      <div className="min-w-0">
                        <span className="text-sm text-neutral-800 dark:text-foreground block truncate">{item.name}</span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">€{item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {qty > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => removeModalItem(item.id)}
                              className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-muted/40 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-muted/60 transition"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center text-sm font-bold text-neutral-900 dark:text-foreground">{qty}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => addModalItem(item.id)}
                          className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition"
                          aria-label={`Add ${item.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Orders"
        subtitle="Track and manage all orders"
        action={
          <Link href="/orders/new">
            <Button className="rounded-xl px-5 py-2.5">+ Create Order</Button>
          </Link>
        }
      />

      <div className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-border flex items-center justify-center text-neutral-500 dark:text-muted-foreground shrink-0"
          aria-label="Filters"
        >
          <Funnel className="w-4 h-4" />
        </button>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.key
                ? tab.key === 'all'
                  ? 'bg-neutral-900 dark:bg-foreground text-white dark:text-background'
                  : tab.key === 'new'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-200'
                    : tab.key === 'preparing'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
                      : tab.key === 'ready'
                        ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-muted/40 dark:text-muted-foreground'
                : 'bg-neutral-100 text-neutral-600 dark:bg-muted/30 dark:text-muted-foreground hover:bg-neutral-200 dark:hover:bg-muted/50'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <OrderCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-neutral-500 dark:text-muted-foreground col-span-full">
            No orders found
          </div>
        ) : (
          filtered.map(order => (
            <div
              key={order.id}
              className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-muted-foreground mb-1">Table</p>
                  <p className="text-2xl leading-none font-bold tracking-tight text-neutral-900 dark:text-foreground">
                    {order.tableNumber}
                  </p>
                </div>
                <StatusBadge label={order.status} toneClassName={STATUS_STYLES[order.status]} />
              </div>

              <div className="mb-4 border-b border-neutral-100 dark:border-border pb-3">
                <p className="font-semibold text-neutral-900 dark:text-foreground text-lg">Order #{order.orderNumber}</p>
                <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5" />
                  {order.createdAt} - {order.createdByName}
                </p>
              </div>

              <div className="space-y-1.5 mb-4">
                {order.items.map(item => (
                  <div
                    key={`${order.id}-${item.menuItemName}`}
                    className="flex items-center justify-between text-sm text-neutral-700 dark:text-foreground"
                  >
                    <span>
                      {item.quantity}x {item.menuItemName}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-foreground">€{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-border flex items-end justify-between">
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">€{order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
