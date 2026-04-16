const COLUMNS = [
  { status: 'new', label: 'New Orders', color: 'text-blue-600', bg: 'bg-blue-50', dotColor: 'bg-blue-400', nextLabel: 'Start Preparing' },
  { status: 'preparing', label: 'Preparing', color: 'text-amber-600', bg: 'bg-amber-50', dotColor: 'bg-amber-400', nextLabel: 'Mark Ready' },
  { status: 'ready', label: 'Ready', color: 'text-green-600', bg: 'bg-green-50', dotColor: 'bg-green-400', nextLabel: null as string | null },
] as const;

const orders = [
  {
    id: 'order-1',
    orderNumber: '001',
    tableNumber: 'T-5',
    status: 'new',
    items: [
      { menuItemName: 'Qebapa', quantity: 2, notes: '' },
      { menuItemName: 'Turkish Coffee', quantity: 2, notes: '' },
    ],
  },
  {
    id: 'order-2',
    orderNumber: '002',
    tableNumber: 'T-3',
    status: 'preparing',
    items: [
      { menuItemName: 'Tave Kosi', quantity: 1, notes: '' },
      { menuItemName: 'Shopska Salad', quantity: 1, notes: '' },
    ],
  },
  {
    id: 'order-3',
    orderNumber: '003',
    tableNumber: 'T-7',
    status: 'ready',
    items: [
      { menuItemName: 'Pljeskavica', quantity: 3, notes: '' },
      { menuItemName: 'Byrek', quantity: 2, notes: '' },
    ],
  },
] as const;

export default function KitchenPage() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kitchen Board</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Live order queue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 h-auto 2xl:h-[calc(100vh-10rem)]">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.status);
          return (
            <div
              key={col.status}
              className="flex flex-col bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden min-h-[20rem] 2xl:min-h-0"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h2 className={`text-sm font-semibold ${col.color}`}>{col.label}</h2>
                <span className="ml-auto text-xs font-bold text-neutral-500 bg-white border border-neutral-200 w-6 h-6 rounded-full flex items-center justify-center">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-6">No orders</p>
                ) : (
                  colOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg border border-neutral-200 p-3 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-neutral-900 text-sm">#{order.orderNumber}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                          Table {order.tableNumber}
                        </span>
                      </div>
                      <ul className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="text-xs text-neutral-700">
                            <span className="font-semibold">{item.quantity}x</span> {item.menuItemName}
                            {item.notes && <span className="text-neutral-400"> - {item.notes}</span>}
                          </li>
                        ))}
                      </ul>
                      {col.nextLabel && (
                        <button className="w-full text-xs font-semibold py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition">
                          {col.nextLabel}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

