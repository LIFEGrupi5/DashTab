'use client'

const COLUMNS = [
  {
    status: 'new',
    label: 'New Orders',
    color: 'text-blue-600 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/45',
    headerBg: 'bg-white dark:bg-muted/35',
    dotColor: 'bg-blue-400 dark:bg-blue-500',
    nextLabel: 'Start Preparing',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    color: 'text-amber-600 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    headerBg: 'bg-white dark:bg-muted/35',
    dotColor: 'bg-amber-400 dark:bg-amber-500',
    nextLabel: 'Mark Ready',
  },
  {
    status: 'ready',
    label: 'Ready',
    color: 'text-green-600 dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-950/40',
    headerBg: 'bg-white dark:bg-muted/35',
    dotColor: 'bg-green-400 dark:bg-green-500',
    nextLabel: 'Mark Ready',
  },
] as const

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
] as const

export default function KitchenBoard() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 h-auto 2xl:h-[calc(100vh-10rem)]">
      {COLUMNS.map(col => {
        const colOrders = orders.filter(o => o.status === col.status)
        return (
          <div
            key={col.status}
            className="flex flex-col bg-neutral-50 dark:bg-card rounded-xl border border-neutral-200 dark:border-border overflow-hidden min-h-[20rem] 2xl:min-h-0"
          >
            <div
              className={`flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-border ${col.headerBg}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
              <h2 className={`text-sm font-semibold ${col.color}`}>{col.label}</h2>
              <span className="ml-auto text-xs font-bold text-neutral-500 dark:text-muted-foreground bg-white dark:bg-secondary border border-neutral-200 dark:border-border w-6 h-6 rounded-full flex items-center justify-center">
                {colOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-neutral-50/80 dark:bg-background/40">
              {colOrders.length === 0 ? (
                <p className="text-xs text-neutral-400 dark:text-muted-foreground text-center py-6">No orders</p>
              ) : (
                colOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-secondary/60 rounded-lg border border-neutral-200 dark:border-border p-3 w-full shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-neutral-900 dark:text-foreground text-sm">#{order.orderNumber}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border border-transparent dark:border-white/10 ${col.bg} ${col.color}`}>
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {order.items.map((item, i) => (
                        <li key={i} className="text-xs text-neutral-700 dark:text-foreground/90">
                          <span className="font-semibold">{item.quantity}x</span> {item.menuItemName}
                          {item.notes ? <span className="text-neutral-400 dark:text-muted-foreground"> - {item.notes}</span> : null}
                        </li>
                      ))}
                    </ul>
                    {col.nextLabel ? (
                      <button
                        type="button"
                        className="w-full text-xs font-semibold py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 transition"
                      >
                        {col.nextLabel}
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
