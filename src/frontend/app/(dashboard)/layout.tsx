'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
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

const MODULE_COLORS: Record<string, string> = {
  '/dashboard':  '#8a7f6f',
  '/orders':     '#e8a23a',
  '/menu':       '#2f78c4',
  '/kitchen':    '#269271',
  '/overview':   '#c74a2d',
  '/staff':      '#c14b7b',
};

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
  const router = useRouter();
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
    <div className="flex h-screen min-h-0 w-full max-w-[100vw] overflow-x-hidden bg-background" onDoubleClick={() => router.push('/dashboard')}>
      {!hideShellSidebar ? (
      <aside
        className={`shrink-0 bg-card dark:bg-card border-r border-border flex flex-col transition-[width] duration-200 ease-out w-14 ${
          sidebarOpen ? 'sm:w-52 lg:w-60' : 'sm:w-20'
        }`}
      >
        <div className="border-b border-border">
          <div className={`flex flex-col items-center gap-2 px-1 py-3 sm:flex-row sm:items-center sm:gap-3 sm:py-4 sm:min-h-[56px] ${sidebarOpen ? 'sm:px-3' : 'sm:justify-center sm:px-2'}`}>
            {/* Layered brand mark */}
            <div className="relative w-9 h-9 shrink-0" style={{ borderRadius: 9, background: 'linear-gradient(135deg, #e8a23a, #c14b7b)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.15)' }}>
              <span className="absolute" style={{ inset: 4, borderRadius: 5, background: 'hsl(var(--background))' }} />
              <span className="absolute" style={{ inset: 8, borderRadius: 2, background: 'linear-gradient(135deg, #2f78c4, #269271)' }} />
            </div>
            {sidebarOpen ? (
              <div className="hidden sm:block min-w-0 leading-tight text-center sm:text-left">
                <p className="font-bold text-neutral-900 dark:text-foreground truncate tracking-tight">DashTab</p>
                <p className="text-[10px] text-neutral-500 dark:text-muted-foreground font-mono uppercase tracking-widest">
                  {isWaiter ? 'Waiter' : isKitchenStaff ? 'Kitchen' : 'OS · v0.9'}
                </p>
              </div>
            ) : null}
          </div>
          <div className={`flex flex-col items-center gap-1 px-1 pb-2 sm:flex-row sm:gap-1 sm:px-2 ${sidebarOpen ? 'sm:justify-end' : 'sm:justify-center'}`}>
            <button
              type="button"
              onClick={() => toggleSidebar()}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <PanelLeft className="w-4 h-4 transition" />
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition"
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
            const dotColor = MODULE_COLORS[item.href] ?? '#8a7f6f';
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={`flex items-center justify-center sm:justify-start gap-0 sm:gap-3 px-0 py-2.5 sm:px-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/70 dark:bg-card text-foreground border border-border shadow-[0_1px_0_rgba(0,0,0,.02)]'
                    : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-muted/25 hover:text-foreground border border-transparent'
                }`}
              >
                <span
                  className="hidden sm:block w-2 h-2 rounded-[3px] shrink-0 opacity-90"
                  style={{ background: dotColor }}
                />
                <Icon className="sm:hidden w-5 h-5 shrink-0" />
                {sidebarOpen ? <span className="hidden sm:inline truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`px-1 py-2 sm:p-3 border-t border-border ${showSidebarProfile ? 'space-y-3' : ''}`}>
          {showSidebarProfile && user ? (
            <div className="hidden sm:flex items-center gap-2 px-1">
              <div
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold tracking-tight border border-border"
                style={{ background: 'linear-gradient(135deg, #e8a23a33, #c14b7b33)', color: 'hsl(var(--foreground))' }}
                aria-hidden
              >
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize font-mono tracking-wide">{user.role}</p>
              </div>
            </div>
          ) : null}
          <Link
            href="/login"
            onClick={() => clearAuth()}
            className="flex items-center justify-center sm:justify-start gap-0 sm:gap-3 w-full px-0 sm:px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition border border-transparent"
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
