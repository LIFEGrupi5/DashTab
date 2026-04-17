'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, CircleHelp } from 'lucide-react';
import Button from '@/components/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useMenu } from '@/hooks/useMenu';

const categories = ['All Items', 'Main Course', 'Appetizer', 'Salad', 'Dessert', 'Beverage'] as const;

export default function NewOrderPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const role = useAppStore(s => s.user?.role);
  const { data: menuItems = [], isLoading } = useMenu();

  useEffect(() => {
    if (!hydrated) return;
    if (role !== 'waiter') router.replace('/orders');
  }, [hydrated, role, router]);

  if (!hydrated || role !== 'waiter') {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center justify-center min-h-[40vh]">Loading…</div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-foreground hover:text-neutral-950 dark:hover:text-orange-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
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
              placeholder="e.g. T-5 or Table 5"
              className="w-full rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-secondary px-3 py-3 text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </section>

          <section className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-2xl p-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-foreground mb-4">Select Items</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((category, idx) => (
                <button
                  key={category}
                  type="button"
                  className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                    idx === 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-neutral-100 dark:bg-muted/30 text-neutral-700 dark:text-foreground hover:bg-neutral-200 dark:hover:bg-muted/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-sm text-neutral-500 dark:text-muted-foreground">Loading menu…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="text-left border border-neutral-200 dark:border-border rounded-2xl p-4 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-bold text-neutral-900 dark:text-foreground">{item.name}</p>
                        <p className="text-sm text-neutral-500 dark:text-muted-foreground">{item.category}</p>
                      </div>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">€{item.price.toFixed(1)}</p>
                    </div>
                    {item.description ? (
                      <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-3">{item.description}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-2xl">
          <div className="p-4 border-b border-neutral-200 dark:border-border">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-foreground">Order Summary</h2>
          </div>

          <div className="p-5 border-b border-neutral-100 dark:border-border min-h-[170px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-base text-neutral-500 dark:text-muted-foreground">No items added yet</p>
              <p className="text-sm text-neutral-400 dark:text-muted-foreground mt-1">Select items from the menu</p>
            </div>
          </div>

          <div className="p-4 border-b border-neutral-100 dark:border-border">
            <p className="text-sm font-semibold text-neutral-700 dark:text-foreground mb-2">Special Notes (Optional)</p>
            <textarea
              rows={3}
              placeholder="Any special requests or modifications..."
              className="w-full rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-secondary px-3 py-3 text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xl font-bold text-neutral-900 dark:text-foreground">Total</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">€0.00</p>
            </div>
            <Button fullWidth className="rounded-xl py-3 bg-orange-300 hover:bg-orange-400 dark:bg-orange-600 dark:hover:bg-orange-500">
              <Check className="w-4 h-4" />
              Submit Order
            </Button>
          </div>
        </aside>
      </div>

      <button
        type="button"
        className="fixed bottom-4 right-4 w-8 h-8 rounded-full border border-neutral-300 dark:border-border bg-white dark:bg-card text-neutral-500 dark:text-muted-foreground inline-flex items-center justify-center shadow-sm"
      >
        <CircleHelp className="w-4 h-4" />
      </button>
    </div>
  );
}
