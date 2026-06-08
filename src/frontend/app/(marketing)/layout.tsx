'use client';

import Link from 'next/link';
import { ChefHat, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';

// Public navigation links shown on every marketing page.
const NAV_LINKS = [
  { label: 'Features',  href: '/#features' },
  { label: 'Pricing',   href: '/pricing' },
  { label: 'About',     href: '/about' },
  { label: 'Contact',   href: '/contact' },
];

function MarketingNav() {
  const user = useAppStore(s => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-neutral-100 dark:border-border bg-white/90 dark:bg-background/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-neutral-900 dark:text-foreground">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow shadow-orange-500/30">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          DashTab
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="text-sm text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground transition">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link href="/dashboard"
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shadow shadow-orange-500/30">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="text-sm text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground transition">
                Log in
              </Link>
              <Link href="/register"
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shadow shadow-orange-500/30">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-neutral-600 dark:text-muted-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 dark:border-border bg-white dark:bg-background px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="text-sm text-neutral-700 dark:text-foreground">
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-neutral-100 dark:border-border flex flex-col gap-2">
            {user ? (
              <Link href="/dashboard" className="text-center px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-neutral-600 dark:text-muted-foreground text-center">Log in</Link>
                <Link href="/register" className="text-center px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-foreground">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            DashTab
          </div>
          <p className="text-xs text-neutral-500 dark:text-muted-foreground leading-relaxed">
            The operating system for modern restaurants. Orders, kitchen display, staff and analytics — all in one place.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-400 dark:text-muted-foreground uppercase tracking-wider mb-3">Product</p>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-muted-foreground">
            {NAV_LINKS.map(l => <li key={l.href}><Link href={l.href} className="hover:text-orange-500 transition">{l.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-400 dark:text-muted-foreground uppercase tracking-wider mb-3">Get started</p>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-muted-foreground">
            <li><Link href="/register" className="hover:text-orange-500 transition">Create account</Link></li>
            <li><Link href="/login" className="hover:text-orange-500 transition">Sign in</Link></li>
            <li><Link href="/pricing" className="hover:text-orange-500 transition">Pricing</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-100 dark:border-border px-6 py-4 text-center text-xs text-neutral-400 dark:text-muted-foreground max-w-6xl mx-auto">
        © {new Date().getFullYear()} DashTab · Built with Next.js 15 · .NET 10 · Kubernetes
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <MarketingNav />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}
