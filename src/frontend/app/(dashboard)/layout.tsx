'use client';

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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/kitchen', label: 'Kitchen', icon: Monitor },
  { href: '/overview', label: 'Overview', icon: BarChart3 },
  { href: '/staff', label: 'Staff', icon: Users },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-neutral-50">
      <aside className="w-20 sm:w-52 lg:w-60 bg-white border-r border-neutral-200 flex flex-col transition-all">
        <div className="flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-5 py-5 border-b border-neutral-100">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline font-bold text-neutral-900 truncate">RestaurantOS</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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

        <div className="p-3 border-t border-neutral-100">
          <Link
            href="/login"
            className="flex items-center justify-center sm:justify-start gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Sign Out</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
