'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useFeatureFlag } from '@/lib/experiment';
import { analytics } from '@/lib/analytics';

export function PricingCards() {
  const variant = useFeatureFlag('pricing-highlight-variant');
  const showHighlight = variant !== 'no-highlight';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-20">
      {PLANS.map(plan => {
        const isHighlighted = showHighlight && !!plan.highlight;
        return (
          <div
            key={plan.key}
            className={`relative p-7 rounded-2xl border flex flex-col ${
              isHighlighted
                ? 'border-white/25 bg-stone-900 ring-1 ring-white/15'
                : 'border-white/10 bg-stone-900/60'
            }`}
          >
            {isHighlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-white text-stone-950 text-xs font-bold">
                Most popular
              </div>
            )}
            <p className="font-bold text-xl mb-1">{plan.name}</p>
            <p className="text-4xl font-extrabold mb-1">
              {plan.price}
              <span className="text-base font-normal text-stone-500">/mo</span>
            </p>
            <p className="text-sm text-stone-400 mb-6">{plan.staff}</p>
            <ul className="space-y-2.5 flex-1 mb-7">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={`/register?plan=${plan.key}`}
              onClick={() => analytics.pricingCtaClicked(plan.key, variant)}
              className={`block text-center px-4 py-3 rounded-xl font-bold text-sm transition ${
                isHighlighted
                  ? 'bg-white text-stone-950 hover:bg-stone-200'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Get started
            </Link>
          </div>
        );
      })}
    </div>
  );
}
