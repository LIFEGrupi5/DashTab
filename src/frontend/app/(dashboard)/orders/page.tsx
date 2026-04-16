'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock3, Funnel, Plus } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TextField from '@/components/TextField';

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-600 border border-blue-100',
  preparing: 'bg-amber-50 text-amber-700 border border-amber-100',
  ready: 'bg-green-50 text-green-700 border border-green-100',
  completed: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
};

const orders = [
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
    totalAmount: 20.0,
    items: [
      { menuItemName: 'Pljeskavica', quantity: 3, amount: 15.0 },
      { menuItemName: 'Byrek', quantity: 2, amount: 5.0 },
    ],
  },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('all');
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('owner');
  const isWaiter = role === 'waiter';

  useEffect(() => {
    const storedRole = window.localStorage.getItem('restaurantos:role')?.toLowerCase();
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  if (!isWaiter) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader
          title="Orders"
          subtitle={`${orders.length} total orders`}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4" /> New Order
            </Button>
          }
        />

        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 mb-5 w-full sm:w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === tab.key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-neutral-500">No orders found</div>
          ) : (
            filtered.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-neutral-900">Order #{order.orderNumber}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Table {order.tableNumber} · by {order.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={order.status} toneClassName={STATUS_STYLES[order.status]} />
                    <span className="text-sm font-bold text-neutral-900">€{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {order.items.map(item => (
                    <span key={item.menuItemName} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md">
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
              <p className="text-sm font-medium text-neutral-700 mb-2">Menu Items</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {orders.flatMap(order => order.items).slice(0, 6).map(item => (
                  <button
                    key={`${item.menuItemName}-${item.quantity}`}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition"
                  >
                    <span className="text-sm text-neutral-800">{item.menuItemName}</span>
                    <span className="text-xs font-semibold text-orange-600">Select</span>
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

      <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 shrink-0"
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
                  ? 'bg-neutral-900 text-white'
                  : tab.key === 'new'
                    ? 'bg-blue-50 text-blue-600'
                    : tab.key === 'preparing'
                      ? 'bg-amber-50 text-amber-700'
                      : tab.key === 'ready'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-neutral-100 text-neutral-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-neutral-500 col-span-full">No orders found</div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Table</p>
                  <p className="text-2xl leading-none font-bold tracking-tight text-neutral-900">{order.tableNumber}</p>
                </div>
                <StatusBadge label={order.status} toneClassName={STATUS_STYLES[order.status]} />
              </div>

              <div className="mb-4 border-b border-neutral-100 pb-3">
                <p className="font-semibold text-neutral-900 text-lg">Order #{order.orderNumber}</p>
                <p className="text-xs text-neutral-500 mt-1 inline-flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5" />
                  {order.createdAt} - {order.createdByName}
                </p>
              </div>

              <div className="space-y-1.5 mb-4">
                {order.items.map(item => (
                  <div key={item.menuItemName} className="flex items-center justify-between text-sm text-neutral-700">
                    <span>
                      {item.quantity}x {item.menuItemName}
                    </span>
                    <span className="font-semibold text-neutral-900">€{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-end justify-between">
                <p className="text-xl font-bold text-orange-600">€{order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
