'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChefHat, Mail, Lock, User, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { registerRestaurant } from '@/lib/api/auth';
import { toast } from 'sonner';

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Persist the ?plan= from marketing pricing so /subscribe can pre-select it.
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) sessionStorage.setItem('selectedPlan', plan);
  }, [searchParams]);

  const [isLoading, setIsLoading]   = useState(false);
  const [done, setDone]             = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerFullName, setOwnerFullName]   = useState('');
  const [ownerEmail, setOwnerEmail]         = useState('');
  const [ownerPassword, setOwnerPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (ownerPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (ownerPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await registerRestaurant({ restaurantName, ownerFullName, ownerEmail, ownerPassword });
      setDone(true);
    } catch (err: unknown) {
      const body = (err as { body?: { title?: string; errors?: Record<string, string[]> } })?.body;
      if (body?.errors) {
        const first = Object.values(body.errors).flat()[0];
        toast.error(first ?? 'Registration failed.');
      } else {
        toast.error(body?.title ?? 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-foreground">
              Restaurant registered!
            </h2>
            <p className="text-neutral-500 dark:text-muted-foreground">
              Your account is ready. Sign in with your email and password to get started.
            </p>
          </div>
          <Button fullWidth className="rounded-xl py-3" onClick={() => router.push('/login')}>
            Go to sign in <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-neutral-950 p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">DashTab</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Get your restaurant<br />
              <span className="text-orange-400">online today.</span>
            </h1>
            <p className="text-neutral-400 text-base leading-relaxed max-w-xs">
              Set up takes under two minutes. Your team can start taking orders immediately.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              'Real-time kitchen display',
              'Order & menu management',
              'Staff role management',
              'Analytics & reporting',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-neutral-700 text-xs relative z-10">
          © {new Date().getFullYear()} DashTab · Restaurant Operating System
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 py-12 bg-white dark:bg-background overflow-y-auto">
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-neutral-900 dark:text-foreground">DashTab</span>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
              Register restaurant
            </h2>
            <p className="text-sm text-neutral-500 dark:text-muted-foreground">
              Create your account and start managing your restaurant
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField
              label="Restaurant name"
              type="text"
              placeholder="e.g. Mario's Kitchen"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              leftIcon={<Store className="w-4 h-4" />}
              required
              autoComplete="organization"
            />

            <div className="border-t border-neutral-100 dark:border-border pt-4">
              <p className="text-xs font-semibold text-neutral-400 dark:text-muted-foreground uppercase tracking-widest mb-4">
                Owner account
              </p>
              <div className="space-y-4">
                <TextField
                  label="Full name"
                  type="text"
                  placeholder="John Smith"
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  autoComplete="name"
                />
                <TextField
                  label="Email address"
                  type="email"
                  placeholder="you@restaurant.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  autoComplete="email"
                />
                <TextField
                  label="Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  autoComplete="new-password"
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              className="rounded-xl py-3"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account…' : (
                <>Create restaurant <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 dark:text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-orange-500 hover:text-orange-600 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary during prerender.
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
