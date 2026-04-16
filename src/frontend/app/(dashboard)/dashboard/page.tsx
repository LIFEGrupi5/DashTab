'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChefHat, Clock3, ShoppingBag, DollarSign, Users, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Button from '@/components/Button';

const ownerStats = [
  { label: 'Active Orders', value: 3, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
  { label: "Today's Revenue", value: '€142.00', icon: DollarSign, color: 'bg-green-50 text-green-600' },
  { label: 'New Orders', value: 1, icon: Clock, color: 'bg-orange-50 text-orange-600' },
  { label: 'Active Staff', value: 4, icon: Users, color: 'bg-purple-50 text-purple-600' },
] as const;

const waiterRecentOrders = [
  { table: '1', orderNumber: '004', itemCount: 2, total: 16.0, status: 'new' as const },
  { table: 'T-5', orderNumber: '001', itemCount: 2, total: 12.0, status: 'preparing' as const },
  { table: 'T-3', orderNumber: '002', itemCount: 2, total: 10.0, status: 'preparing' as const },
  { table: 'T-7', orderNumber: '003', itemCount: 2, total: 20.0, status: 'ready' as const },
];

const statusBadge: Record<(typeof waiterRecentOrders)[number]['status'], { label: string; className: string; icon: typeof Clock3 }> = {
  new: {
    label: 'New Order',
    className: 'bg-blue-50 text-blue-700 border border-blue-100',
    icon: Clock3,
  },
  preparing: {
    label: 'Preparing',
    className: 'bg-amber-50 text-amber-800 border border-amber-100',
    icon: ChefHat,
  },
  ready: {
    label: 'Ready',
    className: 'bg-green-50 text-green-700 border border-green-100',
    icon: CheckCircle2,
  },
};

export default function DashboardPage() {
  const [role, setRole] = useState('owner');
  const isWaiter = role === 'waiter';

  useEffect(() => {
    const stored = window.localStorage.getItem('restaurantos:role')?.toLowerCase();
    if (stored) setRole(stored);
  }, []);

  if (!isWaiter) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <PageHeader title="Welcome back, Admin" subtitle="Owner · RestaurantOS" className="mb-8" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ownerStats.map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Manage orders and serve customers"
        className="mb-6"
        action={
          <Link href="/orders/new">
            <Button className="rounded-xl px-4 py-2 text-sm">+ Create Order</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-700/90">New Orders</p>
            <p className="text-2xl font-bold text-blue-900 mt-0.5">1</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Clock3 className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-800/90">Preparing</p>
            <p className="text-2xl font-bold text-amber-950 mt-0.5">2</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-800/90">Ready to Serve</p>
            <p className="text-2xl font-bold text-green-950 mt-0.5">1</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Recent Orders</h2>
        </div>
        <ul className="divide-y divide-neutral-100">
          {waiterRecentOrders.map(row => {
            const cfg = statusBadge[row.status];
            const Icon = cfg.icon;
            return (
              <li key={row.orderNumber} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Table</p>
                  <p className="text-sm font-bold text-neutral-900">{row.table}</p>
                  <p className="text-xs font-semibold text-neutral-800 mt-1">Order #{row.orderNumber}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {row.itemCount} items · €{row.total.toFixed(2)}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
