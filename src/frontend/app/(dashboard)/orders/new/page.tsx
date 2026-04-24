'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import Button from '@/components/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useMenu } from '@/hooks/useMenu';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import type { OrderLineItem } from '@/lib/api/mock';

const CATEGORIES = ['All Items', 'Main Course', 'Appetizer', 'Salad', 'Dessert', 'Beverage'] as const;

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-neutral-200 dark:border-border rounded-2xl p-4 animate-pulse">
          <div className="h-5 bg-neutral-200 dark:bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-neutral-100 dark:bg-muted/60 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const role = useAppStore(s => s.user?.role);
  const { data: menuItems = [], isLoading } = useMenu();
  const createOrder = useCreateOrder();

  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('All Items');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!hydrated) return;
    if (role !== 'waiter') router.replace('/orders');
  }, [hydrated, role, router]);

  if (!hydrated || role !== 'waiter') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const filteredItems = menuItems.filter(
    item => item.available && (selectedCategory === 'All Items' || item.category === selectedCategory)
  );

  const cartEntries = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = menuItems.find(i => i.id === id)!;
      return { ...item, quantity: qty, lineTotal: item.price * qty };
    });

  const total = cartEntries.reduce((sum, e) => sum + e.lineTotal, 0);

  const addItem = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const removeItem = (id: string) =>
    setCart(prev => {
      const next = { ...prev, [id]: (prev[id] ?? 0) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const canSubmit = tableNumber.trim().length > 0 && cartEntries.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const lineItems: OrderLineItem[] = cartEntries.map(e => ({
      menuItemName: e.name,
      quantity: e.quantity,
      amount: e.lineTotal,
    }));
    createOrder(tableNumber.trim(), lineItems);
    router.push('/orders');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-foreground hover:text-neutral-950 dark:hover:text-orange-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-foreground mt-4">Create New Order</h1>
        <p className="text-base text-neutral-500 dark:text-muted-foreground mt-1">Add items and submit to kitchen</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-4">
          <section className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-2xl p-4">
            <label htmlFor="table-number" className="block text-sm font-semibold text-neutral-800 dark:text-foreground mb-2">
              Table Number *
            </label>
            <input
              id="table-number"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="e.g. T-5 or Table 5"
              className="w-full rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-secondary px-3 py-3 text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </section>

          <section className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-2xl p-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-foreground mb-4">Select Items</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-neutral-100 dark:bg-muted/30 text-neutral-700 dark:text-foreground hover:bg-neutral-200 dark:hover:bg-muted/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {isLoading ? (
              <MenuSkeleton />
            ) : filteredItems.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-muted-foreground py-8 text-center">
                No items in this category
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map(item => {
                  const qty = cart[item.id] ?? 0;
                  const selected = qty > 0;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-2xl p-4 transition ${
                        selected
                          ? 'border-orange-400 dark:border-orange-600 bg-orange-50/60 dark:bg-orange-950/20'
                          : 'border-neutral-200 dark:border-border hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-neutral-900 dark:text-foreground truncate">{item.name}</p>
                          <p className="text-sm text-neutral-500 dark:text-muted-foreground">{item.category}</p>
                          {item.description ? (
                            <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                          ) : null}
                        </div>
                        <p className="text-base font-bold text-orange-600 dark:text-orange-400 shrink-0">
                          €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-muted/40 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-muted/60 transition"
                              aria-label={`Remove one ${item.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-neutral-900 dark:text-foreground">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => addItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition"
                              aria-label={`Add another ${item.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addItem(item.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-2xl sticky top-4">
          <div className="p-4 border-b border-neutral-200 dark:border-border">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-foreground">Order Summary</h2>
          </div>

          <div className="p-4 border-b border-neutral-100 dark:border-border min-h-[120px]">
            {cartEntries.length === 0 ? (
              <div className="flex items-center justify-center min-h-[90px]">
                <div className="text-center">
                  <p className="text-sm text-neutral-500 dark:text-muted-foreground">No items added yet</p>
                  <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-1">Select items from the menu</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {cartEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700 dark:text-foreground">
                      {entry.quantity}× {entry.name}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-foreground">
                      €{entry.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-b border-neutral-100 dark:border-border">
            <p className="text-sm font-semibold text-neutral-700 dark:text-foreground mb-2">Special Notes (Optional)</p>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests or modifications..."
              className="w-full rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-secondary px-3 py-3 text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xl font-bold text-neutral-900 dark:text-foreground">Total</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">€{total.toFixed(2)}</p>
            </div>
            <Button
              fullWidth
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl py-3"
            >
              <Check className="w-4 h-4" />
              Submit Order
            </Button>
            {!canSubmit && (
              <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-2 text-center">
                {!tableNumber.trim() ? 'Enter a table number to continue' : 'Add at least one item'}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
