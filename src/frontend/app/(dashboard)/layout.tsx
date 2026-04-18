'use client';

import { useMemo } from 'react';
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
  PanelLeft,
  Moon,
  Sun,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';

const waiterNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
] as const;

const kitchenNavItems = [{ href: '/kitchen', label: 'Kitchen', icon: Monitor }] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function roleShowsSidebarProfile(role: string | undefined) {
  return role === 'waiter' || role === 'kitchen' || role === 'owner' || role === 'manager';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useStoreHydrated();
  const user = useAppStore(s => s.user);
  const clearAuth = useAppStore(s => s.clearAuth);
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const darkMode = useAppStore(s => s.darkMode);
  const setDarkMode = useAppStore(s => s.setDarkMode);

  const isWaiter = user?.role === 'waiter';
  const isKitchenStaff = user?.role === 'kitchen';
  const hideShellSidebar = isKitchenStaff;
  const showSidebarProfile = Boolean(user && sidebarOpen && roleShowsSidebarProfile(user.role));

  const navItems = useMemo(() => {
    if (isWaiter) return waiterNavItems;
    if (isKitchenStaff) return kitchenNavItems;
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
      { href: '/kitchen', label: 'Kitchen', icon: Monitor },
      { href: '/overview', label: 'Overview', icon: BarChart3 },
      { href: '/staff', label: 'Staff', icon: Users },
    ] as const;
  }, [isWaiter, isKitchenStaff]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 w-full max-w-[100vw] overflow-x-hidden bg-neutral-50 dark:bg-background">
      {!hideShellSidebar ? (
      <aside
        className={`shrink-0 bg-white dark:bg-card border-r border-neutral-200 dark:border-border flex flex-col transition-[width] duration-200 ease-out w-14 ${
          sidebarOpen ? 'sm:w-52 lg:w-60' : 'sm:w-20'
        }`}
      >
        <div className="border-b border-neutral-100 dark:border-border">
          <div className="flex flex-col items-center gap-2 px-1 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-4 sm:min-h-[56px]">
            <div
              className={`w-9 h-9 bg-orange-500 ${isWaiter || isKitchenStaff ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center shrink-0`}
            >
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen ? (
              <div className="hidden sm:block min-w-0 leading-tight text-center sm:text-left">
                <p className="font-bold text-neutral-900 dark:text-foreground truncate">RestaurantOS</p>
                <p className="text-[11px] text-neutral-500 dark:text-muted-foreground">
                  {isWaiter ? 'Operations System' : isKitchenStaff ? 'Kitchen Display' : 'Operations'}
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-center gap-1 px-1 pb-2 sm:flex-row sm:justify-end sm:gap-1 sm:px-2">
            <button
              type="button"
              onClick={() => toggleSidebar()}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-secondary text-neutral-600 dark:text-muted-foreground hover:bg-neutral-50 dark:hover:bg-muted/30 transition"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <PanelLeft className={`w-4 h-4 transition ${sidebarOpen ? '' : 'text-orange-600'}`} />
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-secondary text-neutral-600 dark:text-muted-foreground hover:bg-neutral-50 dark:hover:bg-muted/30 transition"
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1 py-2 sm:p-3 ${isWaiter || isKitchenStaff ? 'space-y-2' : 'space-y-1'}`}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/orders' && pathname.startsWith('/orders')) ||
              (item.href === '/kitchen' && pathname.startsWith('/kitchen'));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={`flex items-center justify-center sm:justify-start gap-0 sm:gap-3 px-0 py-2.5 sm:px-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/35 text-orange-600 dark:text-orange-300 border border-orange-100/80 dark:border-orange-900/50'
                    : 'text-neutral-600 dark:text-muted-foreground hover:bg-neutral-50 dark:hover:bg-muted/25 hover:text-neutral-900 dark:hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen ? <span className="hidden sm:inline truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`px-1 py-2 sm:p-3 border-t border-neutral-100 dark:border-border ${showSidebarProfile ? 'space-y-3' : ''}`}>
          {showSidebarProfile && user ? (
            <div className="hidden sm:flex items-center gap-2 px-1">
              <div
                className="w-9 h-9 shrink-0 rounded-full bg-orange-50 dark:bg-orange-950/45 text-orange-900 dark:text-orange-200 flex items-center justify-center text-xs font-semibold tracking-tight border border-orange-100/90 dark:border-orange-900/40"
                aria-hidden
              >
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-foreground leading-tight truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          ) : null}
          <Link
            href="/login"
            onClick={() => clearAuth()}
            className="flex items-center justify-center sm:justify-start gap-0 sm:gap-3 w-full px-0 sm:px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 dark:text-muted-foreground hover:bg-neutral-50 dark:hover:bg-muted/25 hover:text-neutral-900 dark:hover:text-foreground transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen ? (
              <span className="hidden sm:inline">{roleShowsSidebarProfile(user?.role) ? 'Log Out' : 'Sign Out'}</span>
            ) : null}
          </Link>
        </div>
      </aside>
      ) : null}

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
