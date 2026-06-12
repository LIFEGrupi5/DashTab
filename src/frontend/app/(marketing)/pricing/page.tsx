import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Pricing — DashTab',
  description: 'Simple, transparent pricing for every restaurant. Start free, upgrade when you grow.',
};

const GRAD_TEXT = 'bg-gradient-to-b from-white to-stone-500 bg-clip-text text-transparent';

const ALL_FEATURES = [
  { label: 'Orders & kitchen display', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Menu management', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Real-time updates', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Role-based access (Owner/Manager/Waiter/Kitchen)', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Staff management', tiers: ['basic', 'pro', 'enterprise'] },
  { label: 'Analytics & reports', tiers: ['pro', 'enterprise'] },
  { label: 'Priority support', tiers: ['pro', 'enterprise'] },
  { label: 'Dedicated support', tiers: ['enterprise'] },
  { label: 'Custom onboarding', tiers: ['enterprise'] },
];

export default function PricingPage() {
  return (
    <div className="bg-stone-950 text-white">
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Simple, <span className={GRAD_TEXT}>transparent</span> pricing
          </h1>
          <p className="text-stone-400 max-w-xl mx-auto">No hidden fees. No long-term contracts. Cancel any time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-20">
          {PLANS.map(plan => (
            <div key={plan.key}
              className={`relative p-7 rounded-2xl border flex flex-col ${
                plan.highlight
                  ? 'border-white/25 bg-stone-900 ring-1 ring-white/15'
                  : 'border-white/10 bg-stone-900/60'
              }`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-white text-stone-950 text-xs font-bold">
                  Most popular
                </div>
              )}
              <p className="font-bold text-xl mb-1">{plan.name}</p>
              <p className="text-4xl font-extrabold mb-1">{plan.price}<span className="text-base font-normal text-stone-500">/mo</span></p>
              <p className="text-sm text-stone-400 mb-6">{plan.staff}</p>
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={`/register?plan=${plan.key}`}
                className={`block text-center px-4 py-3 rounded-xl font-bold text-sm transition ${
                  plan.highlight ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}>
                Get started
              </Link>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-extrabold text-center mb-8">Full feature comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-stone-400 font-semibold">Feature</th>
                {PLANS.map(p => (
                  <th key={p.key} className="p-4 font-bold text-center text-white">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ALL_FEATURES.map(row => (
                <tr key={row.label} className="hover:bg-white/5 transition">
                  <td className="p-4 text-stone-300">{row.label}</td>
                  {PLANS.map(p => (
                    <td key={p.key} className="p-4 text-center">
                      {row.tiers.includes(p.key)
                        ? <Check className="w-4 h-4 text-orange-400 mx-auto" />
                        : <span className="text-stone-700 text-base">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center mt-10 text-sm text-stone-400">
          Questions? <Link href="/contact" className="text-orange-400 hover:text-orange-300 font-medium">Talk to us →</Link>
        </p>
      </div>
    </div>
  );
}
