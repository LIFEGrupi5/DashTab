'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChefHat,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Monitor,
  BarChart3,
  Users,
  LogOut,
} from 'lucide-react';

const waiterNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState('owner');
  const isWaiter = role === 'waiter';

  useEffect(() => {
    const storedRole = window.localStorage.getItem('restaurantos:role')?.toLowerCase();
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const navItems = useMemo(() => {
    if (isWaiter) {
      return waiterNavItems;
    }
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
      { href: '/kitchen', label: 'Kitchen', icon: Monitor },
      { href: '/overview', label: 'Overview', icon: BarChart3 },
      { href: '/staff', label: 'Staff', icon: Users },
    ] as const;
  }, [isWaiter]);

  return (
    <div className="flex h-screen bg-neutral-50">
      <aside className="w-20 sm:w-52 lg:w-60 bg-white border-r border-neutral-200 flex flex-col transition-all">
        <div className="flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-5 py-5 border-b border-neutral-100">
          <div className={`w-9 h-9 bg-orange-500 ${isWaiter ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center shrink-0`}>
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          {isWaiter ? (
            <div className="hidden sm:block leading-tight">
              <p className="font-bold text-neutral-900 truncate">RestaurantOS</p>
              <p className="text-[11px] text-neutral-500">Operations System</p>
            </div>
          ) : (
            <span className="hidden sm:inline font-bold text-neutral-900 truncate">RestaurantOS</span>
          )}
        </div>

        <nav className={`flex-1 p-3 ${isWaiter ? 'space-y-2' : 'space-y-1'}`}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/orders' && pathname.startsWith('/orders'));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-3 border-t border-neutral-100 ${isWaiter ? 'space-y-3' : ''}`}>
          {isWaiter ? (
            <div className="hidden sm:flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold">
                AW
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 leading-tight">Ana Waiter</p>
                <p className="text-xs text-neutral-500">Waiter</p>
              </div>
            </div>
          ) : null}
          <Link
            href="/login"
            onClick={() => {
              window.localStorage.removeItem('restaurantos:role');
              window.localStorage.removeItem('restaurantos:email');
            }}
            className="flex items-center justify-center sm:justify-start gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{isWaiter ? 'Log Out' : 'Sign Out'}</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
