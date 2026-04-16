import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import TextField from '../../components/TextField';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  preparing: 'bg-amber-50 text-amber-700',
  ready: 'bg-green-50 text-green-700',
  completed: 'bg-neutral-100 text-neutral-600',
};

const orders = [
  {
    id: 'order-1',
    orderNumber: '001',
    tableNumber: 'T-5',
    createdByName: 'Ana Waiter',
    status: 'new',
    totalAmount: 12.0,
    items: [
      { menuItemName: 'Qebapa', quantity: 2 },
      { menuItemName: 'Turkish Coffee', quantity: 2 },
    ],
  },
  {
    id: 'order-2',
    orderNumber: '002',
    tableNumber: 'T-3',
    createdByName: 'Ana Waiter',
    status: 'preparing',
    totalAmount: 10.0,
    items: [
      { menuItemName: 'Tave Kosi', quantity: 1 },
      { menuItemName: 'Shopska Salad', quantity: 1 },
    ],
  },
  {
    id: 'order-3',
    orderNumber: '003',
    tableNumber: 'T-7',
    createdByName: 'Ana Waiter',
    status: 'ready',
    totalAmount: 20.0,
    items: [
      { menuItemName: 'Pljeskavica', quantity: 3 },
      { menuItemName: 'Byrek', quantity: 2 },
    ],
  },
] as const;

const availableItems = [
  { id: '1', name: 'Qebapa', price: 4.5 },
  { id: '2', name: 'Pljeskavica', price: 5.0 },
  { id: '3', name: 'Tave Kosi', price: 6.5 },
  { id: '5', name: 'Byrek', price: 2.5 },
  { id: '7', name: 'Baklava', price: 2.0 },
] as const;

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('all');
  const [open, setOpen] = useState(false);

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total orders`}
        action={
          <Button
          onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" /> New Order
          </Button>
        }
      />

      <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 mb-5 w-fit">
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

      <div className="space-y-3">
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
                {order.items.map((item, i) => (
                  <span key={i} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md">
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
          footer={
            <Button fullWidth>
              Create Order
            </Button>
          }
        >
          <TextField label="Table Number" type="text" placeholder="e.g. T-5" className="py-2" />
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">Menu Items</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {availableItems.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition"
                >
                  <span className="text-sm text-neutral-800">{item.name}</span>
                  <span className="text-xs font-semibold text-orange-600">€{item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

