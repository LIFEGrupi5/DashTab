'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, CircleHelp } from 'lucide-react';
import Button from '@/components/Button';

const categories = ['All Items', 'Main Course', 'Appetizer', 'Salad', 'Dessert', 'Beverage'] as const;

const menuItems = [
  { id: '1', name: 'Qebapa', category: 'Main Course', description: 'Traditional grilled meat', price: 4.5 },
  { id: '2', name: 'Pljeskavica', category: 'Main Course', description: 'Grilled patty', price: 5.0 },
  { id: '3', name: 'Tave Kosi', category: 'Main Course', description: 'Lamb with yogurt', price: 6.5 },
  { id: '4', name: 'Fergese', category: 'Main Course', description: 'Peppers with cheese', price: 5.5 },
  { id: '5', name: 'Byrek', category: 'Appetizer', description: 'Baked pastry', price: 2.5 },
  { id: '6', name: 'Shopska Salad', category: 'Salad', description: 'Fresh tomato and feta', price: 3.5 },
] as const;

export default function NewOrderPage() {
  const router = useRouter();
  const [checkedRole, setCheckedRole] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem('restaurantos:role')?.toLowerCase();
    if (role !== 'waiter') {
      router.replace('/orders');
      return;
    }
    setCheckedRole(true);
  }, [router]);

  if (!checkedRole) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-neutral-950">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-4">Create New Order</h1>
        <p className="text-base text-neutral-500 mt-1">Add items and submit to kitchen</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-4">
          <section className="bg-white border border-neutral-200 rounded-2xl p-4">
            <label htmlFor="table-number" className="block text-sm font-semibold text-neutral-800 mb-2">
              Table Number *
            </label>
            <input
              id="table-number"
              placeholder="e.g. T-5 or Table 5"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </section>

          <section className="bg-white border border-neutral-200 rounded-2xl p-4">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Select Items</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((category, idx) => (
                <button
                  key={category}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                    idx === 0 ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  className="text-left border border-neutral-200 rounded-2xl p-4 hover:border-orange-300 hover:bg-orange-50/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-bold text-neutral-900">{item.name}</p>
                      <p className="text-sm text-neutral-500">{item.category}</p>
                    </div>
                    <p className="text-xl font-bold text-orange-600">€{item.price.toFixed(1)}</p>
                  </div>
                  <p className="text-sm text-neutral-600 mt-3">{item.description}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="bg-white border border-neutral-200 rounded-2xl">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-neutral-900">Order Summary</h2>
          </div>

          <div className="p-5 border-b border-neutral-100 min-h-[170px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-base text-neutral-500">No items added yet</p>
              <p className="text-sm text-neutral-400 mt-1">Select items from the menu</p>
            </div>
          </div>

          <div className="p-4 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-700 mb-2">Special Notes (Optional)</p>
            <textarea
              rows={3}
              placeholder="Any special requests or modifications..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xl font-bold text-neutral-900">Total</p>
              <p className="text-2xl font-bold text-orange-600">€0.00</p>
            </div>
            <Button fullWidth className="rounded-xl py-3 bg-orange-300 hover:bg-orange-400">
              <Check className="w-4 h-4" />
              Submit Order
            </Button>
          </div>
        </aside>
      </div>

      <button className="fixed bottom-4 right-4 w-8 h-8 rounded-full border border-neutral-300 bg-white text-neutral-500 inline-flex items-center justify-center shadow-sm">
        <CircleHelp className="w-4 h-4" />
      </button>
    </div>
  );
}
