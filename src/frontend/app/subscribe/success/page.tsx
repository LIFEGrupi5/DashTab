'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Button from '@/components/Button';
import { confirmCheckout } from '@/lib/api/subscriptions';

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [state, setState] = useState<'verifying' | 'done' | 'error'>('verifying');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-invoke in dev strict mode
    ran.current = true;

    if (!sessionId) {
      setState('error');
      return;
    }
    confirmCheckout(sessionId)
      .then(() => {
        setState('done');
        setTimeout(() => router.replace('/dashboard'), 1500);
      })
      .catch(() => setState('error'));
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {state === 'verifying' && (
          <>
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
            <p className="text-neutral-600 dark:text-muted-foreground">Confirming your payment…</p>
          </>
        )}

        {state === 'done' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-foreground">You&apos;re all set!</h2>
              <p className="text-neutral-500 dark:text-muted-foreground">Your restaurant is now active. Taking you to the dashboard…</p>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-foreground">Payment not confirmed</h2>
              <p className="text-neutral-500 dark:text-muted-foreground">We couldn&apos;t verify the payment. Please try choosing a plan again.</p>
            </div>
            <Button className="rounded-xl py-3" onClick={() => router.replace('/subscribe')}>
              Back to plans
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    }>
      <SuccessInner />
    </Suspense>
  );
}
