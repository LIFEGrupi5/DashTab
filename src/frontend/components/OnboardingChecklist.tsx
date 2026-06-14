'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react';
import { useCategories, useMenu } from '@/hooks/useMenu';
import { useUsers } from '@/hooks/useUsers';

const DISMISS_KEY = 'dashtab:onboarding:dismissed';

export default function OnboardingChecklist() {
  const router = useRouter();
  const { data: categories = [], isLoading: lc } = useCategories();
  const { data: menu = [], isLoading: lm } = useMenu();
  const { data: users = [], isLoading: lu } = useUsers();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const steps = [
    { label: 'Add a menu category', done: categories.length > 0, href: '/menu' },
    { label: 'Add your first menu item', done: menu.length > 0, href: '/menu' },
    { label: 'Invite a staff member', done: users.length > 1, href: '/staff' },
  ];

  const loading = lc || lm || lu;
  const allDone = steps.every(s => s.done);
  const completedCount = steps.filter(s => s.done).length;

  if (dismissed || loading || allDone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-neutral-200 dark:border-border bg-white dark:bg-card shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-border">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-neutral-900 dark:text-foreground">Get started</span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-muted/40 overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 dark:text-muted-foreground tabular-nums">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      <ul className="px-2 pb-3">
        {steps.map(step => (
          <li key={step.label}>
            <button
              type="button"
              onClick={() => router.push(step.href)}
              disabled={step.done}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left text-sm transition ${
                step.done
                  ? 'text-neutral-400 dark:text-muted-foreground'
                  : 'text-neutral-700 dark:text-foreground hover:bg-neutral-50 dark:hover:bg-muted/25'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-300 dark:text-muted-foreground shrink-0" />
              )}
              <span className={step.done ? 'line-through' : ''}>{step.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
