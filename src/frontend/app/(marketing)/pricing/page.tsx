import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Pricing — DashTab',
  description: 'Simple, transparent pricing for every restaurant. Start free, upgrade when you grow.',
};

const ALL_FEATURES = [
  { label: 'Orders & kitchen display', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Menu management', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Real-time order updates', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Role-based access (Owner/Manager/Waiter/Kitchen)', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Staff management', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Analytics & reports', tiers: ['pro', 'enterprise'] },
  { label: 'Priority support', tiers: ['pro', 'enterprise'] },
  { label: 'Dedicated support', tiers: ['enterprise'] },
  { label: 'Custom onboarding', tiers: ['enterprise'] },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-neutral-500 dark:text-muted-foreground max-w-xl mx-auto">
          No hidden fees. No long-term contracts. Cancel any time.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
        {PLANS.map(plan => (
          <div key={plan.key}
            className={`relative p-7 rounded-2xl border flex flex-col ${
              plan.highlight
                ? 'border-orange-400 bg-orange-500 text-white shadow-xl shadow-orange-500/20'
                : 'border-neutral-200 dark:border-border bg-white dark:bg-card'
            }`}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-neutral-950 text-orange-400 text-xs font-bold">
                Most popular
              </div>
            )}
            <p className={`font-bold text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-neutral-900 dark:text-foreground'}`}>{plan.name}</p>
            <p className={`text-4xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-neutral-900 dark:text-foreground'}`}>
              {plan.price}<span className="text-base font-normal opacity-60">/mo</span>
            </p>
            <p className={`text-sm mb-6 ${plan.highlight ? 'text-orange-100' : 'text-neutral-500 dark:text-muted-foreground'}`}>{plan.staff}</p>
            <ul className="space-y-2.5 flex-1 mb-7">
              {plan.features.map(f => (
                <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-orange-100' : 'text-neutral-600 dark:text-muted-foreground'}`}>
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-white' : 'text-orange-500'}`} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/register?plan=${plan.key}`}
              className={`block text-center px-4 py-3 rounded-xl font-bold text-sm transition ${
                plan.highlight
                  ? 'bg-white text-orange-600 hover:bg-orange-50'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}>
              Get started
            </Link>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-foreground text-center mb-8">Full feature comparison</h2>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-border">
              <th className="text-left p-4 text-neutral-500 dark:text-muted-foreground font-semibold">Feature</th>
              {PLANS.map(p => (
                <th key={p.key} className={`p-4 font-bold text-center ${p.highlight ? 'text-orange-500' : 'text-neutral-900 dark:text-foreground'}`}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-border">
            {ALL_FEATURES.map(row => (
              <tr key={row.label} className="hover:bg-neutral-50 dark:hover:bg-muted/20 transition">
                <td className="p-4 text-neutral-700 dark:text-foreground">{row.label}</td>
                {PLANS.map(p => (
                  <td key={p.key} className="p-4 text-center">
                    {row.tiers.includes(p.key)
                      ? <Check className="w-4 h-4 text-orange-500 mx-auto" />
                      : <span className="text-neutral-300 dark:text-muted-foreground text-base">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center mt-10 text-sm text-neutral-500 dark:text-muted-foreground">
        Questions? <Link href="/contact" className="text-orange-500 hover:underline font-medium">Talk to us →</Link>
      </p>
    </div>
  );
}
