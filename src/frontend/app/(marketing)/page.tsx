import type { Metadata } from 'next';
import Link from 'next/link';
import { ChefHat, Zap, LayoutDashboard, Users, BarChart3, ShieldCheck, Check, ChevronDown } from 'lucide-react';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'DashTab — The Restaurant Operating System',
  description: 'Orders, kitchen display, staff and real-time analytics — everything your restaurant needs in one place.',
  openGraph: {
    title: 'DashTab — The Restaurant Operating System',
    description: 'Run your restaurant smarter. Orders, KDS, menu and staff all in one place.',
  },
};

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold mb-5 sm:mb-6">
          <Zap className="w-3.5 h-3.5" /> Built for modern restaurants
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-5 sm:mb-6">
          Run your restaurant<br />
          <span className="text-orange-400">smarter.</span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          DashTab is the all-in-one operating system for restaurants. Real-time orders, kitchen display, staff management and analytics — no paper, no WhatsApp, no chaos.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login?demo=1"
            className="px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition shadow-lg shadow-orange-500/30 w-full sm:w-auto">
            Explore live demo →
          </Link>
          <Link href="/pricing"
            className="px-7 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-white font-semibold text-base transition w-full sm:w-auto">
            See pricing
          </Link>
        </div>

      </div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Kitchen Display System',
    desc: 'Real-time order board across all kitchen stations. Status changes push instantly — no polling, no delays.',
  },
  {
    icon: Zap,
    title: 'Instant Orders',
    desc: 'Waiters create orders in seconds. The kitchen sees them the moment they\'re placed — no refresh, no delay.',
  },
  {
    icon: Users,
    title: 'Staff & Role Management',
    desc: 'Owner, Manager, Waiter, Kitchen — each role sees exactly what they need and nothing they shouldn\'t.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    desc: 'End-of-day overview, revenue by table, peak-hour patterns. Know your restaurant\'s numbers without a spreadsheet.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    desc: 'Your restaurant\'s data stays private and protected, with a secure, separate login for every member of your team.',
  },
  {
    icon: ChefHat,
    title: 'Menu Management',
    desc: 'Categories, items, images, pricing and availability — all editable in real time from any device.',
  },
] as const;

function Features() {
  return (
    <section id="features" className="py-16 sm:py-24 px-5 sm:px-6 bg-white dark:bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
            Everything your restaurant needs
          </h2>
          <p className="text-neutral-500 dark:text-muted-foreground mt-3 max-w-xl mx-auto">
            One system, every flow. No separate apps, no integrations, no data silos.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card hover:border-orange-200 dark:hover:border-orange-900/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition">
                <Icon className="w-5 h-5 text-orange-500 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-neutral-500 dark:text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing teaser ────────────────────────────────────────────────────────────

function PricingTeaser() {
  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-neutral-50 dark:bg-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-neutral-500 dark:text-muted-foreground mt-3">No hidden fees. Cancel any time.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.key}
              className={`relative p-6 rounded-2xl border transition flex flex-col ${
                plan.highlight
                  ? 'border-orange-400 bg-orange-500 text-white shadow-xl shadow-orange-500/20 scale-105'
                  : 'border-neutral-200 dark:border-border bg-white dark:bg-background'
              }`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-neutral-950 text-orange-400 text-xs font-bold">
                  Most popular
                </div>
              )}
              <p className={`font-bold text-lg ${plan.highlight ? 'text-white' : 'text-neutral-900 dark:text-foreground'}`}>{plan.name}</p>
              <p className={`text-4xl font-extrabold my-3 ${plan.highlight ? 'text-white' : 'text-neutral-900 dark:text-foreground'}`}>
                {plan.price}<span className="text-base font-normal opacity-60">/mo</span>
              </p>
              <p className={`text-sm mb-5 ${plan.highlight ? 'text-orange-100' : 'text-neutral-500 dark:text-muted-foreground'}`}>{plan.staff}</p>
              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-orange-100' : 'text-neutral-600 dark:text-muted-foreground'}`}>
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-white' : 'text-orange-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/register?plan=${plan.key}`}
                className={`mt-6 block text-center px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                  plan.highlight
                    ? 'bg-white text-orange-600 hover:bg-orange-50'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}>
                Get started
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-neutral-500 dark:text-muted-foreground">
          Need more? <Link href="/pricing" className="text-orange-500 hover:underline font-medium">See full plan comparison →</Link>
        </p>
      </div>
    </section>
  );
}

// ── Social proof ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: 'We cut order errors by 90% in the first week. The kitchen board alone was worth it.',
    name: 'Ardit Kelmendi',
    role: 'Owner, Restorant Besa',
    initials: 'AK',
  },
  {
    quote: 'Finally a system that actually works during a busy Saturday night. Fast, reliable, and the team picked it up in minutes.',
    name: 'Mirlinda Hoxha',
    role: 'Manager, Kafja Joni',
    initials: 'MH',
  },
  {
    quote: 'The real-time kitchen display changed how we work. No more shouting across the kitchen.',
    name: 'Blerim Gashi',
    role: 'Head Chef, Restorant Iliria',
    initials: 'BG',
  },
];

function SocialProof() {
  return (
    <section className="py-24 px-6 bg-white dark:bg-background">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight text-center mb-12">
          Trusted by restaurants across the region
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="p-6 rounded-2xl border border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card">
              <p className="text-neutral-700 dark:text-foreground text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-foreground">{t.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Do I need any hardware?',
    a: 'No. DashTab runs in the browser on any device — tablet, phone, or laptop. No proprietary hardware required.',
  },
  {
    q: 'Can staff use their own phones?',
    a: 'Yes. The app is fully responsive. Waiters can take orders from their phone; the kitchen board works great on a wall tablet.',
  },
  {
    q: 'Can I change my plan later?',
    a: 'Yes. You can upgrade or downgrade any time from your account settings. Changes take effect immediately.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Every plan starts with a 14-day free trial — no credit card required.',
  },
];

function FAQ() {
  return (
    <section className="py-24 px-6 bg-neutral-50 dark:bg-card">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-neutral-200 dark:divide-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-4 cursor-pointer">
              <summary className="flex items-center justify-between text-sm font-semibold text-neutral-900 dark:text-foreground list-none">
                {q}
                <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
              </summary>
              <p className="mt-3 text-sm text-neutral-600 dark:text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-neutral-950">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to run your restaurant smarter?
        </h2>
        <p className="text-neutral-400 mb-8 text-lg">
          Join restaurants already using DashTab. Try a live demo or explore our plans.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login?demo=1"
            className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition shadow-lg shadow-orange-500/30 w-full sm:w-auto">
            Explore live demo
          </Link>
          <Link href="/contact"
            className="px-8 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-white font-semibold text-base transition w-full sm:w-auto">
            Request a demo
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <PricingTeaser />
      <SocialProof />
      <FAQ />
      <FinalCTA />
    </>
  );
}
