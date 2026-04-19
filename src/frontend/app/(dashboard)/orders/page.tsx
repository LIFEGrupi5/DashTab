'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock3, Funnel, Plus } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TextField from '@/components/TextField';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useOrders } from '@/hooks/useOrders';
import { useMenu } from '@/hooks/useMenu';

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

export default function OrdersPage() {
  const hydrated = useStoreHydrated();
  const user = useAppStore(s => s.user);
  const { data: orders = [], isLoading } = useOrders();
  const { data: menuItems = [] } = useMenu();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('all');
  const [open, setOpen] = useState(false);

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

  if (!hydrated) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center justify-center min-h-[40vh]">Loading…</div>
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
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-neutral-500 dark:text-muted-foreground">No orders found</div>
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
                    <Button variant="warning" size="sm">
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button variant="success" size="sm">
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button variant="secondary" size="sm">
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
            onClose={() => setOpen(false)}
            maxWidthClassName="max-w-md max-h-[90vh] overflow-y-auto"
            bodyClassName="space-y-4"
            footer={<Button fullWidth>Create Order</Button>}
          >
            <TextField label="Table Number" type="text" placeholder="e.g. T-5" className="py-2" />
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-2">Menu Items</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {menuItems.slice(0, 12).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-muted/25 border border-transparent hover:border-neutral-200 dark:hover:border-border transition"
                  >
                    <span className="text-sm text-neutral-800 dark:text-foreground">{item.name}</span>
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-300">Select</span>
                  </button>
                ))}
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
        {filtered.length === 0 ? (
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
