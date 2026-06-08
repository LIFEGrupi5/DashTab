'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChefHat, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { useAppStore } from '@/stores/useAppStore';
import { login } from '@/lib/api/auth';
import { toast } from 'sonner';

const demoAccounts = [
  { email: 'owner@dashtab.dev',   password: 'Owner1!',   role: 'Owner' },
  { email: 'manager@dashtab.dev', password: 'Manager1!', role: 'Manager' },
  { email: 'waiter@dashtab.dev',  password: 'Waiter1!',  role: 'Waiter' },
  { email: 'kitchen@dashtab.dev', password: 'Kitchen1!', role: 'Kitchen' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAppStore((s) => s.setAuth);
  const [email, setEmail]       = useState<string>(demoAccounts[0].email);
  const [password, setPassword] = useState<string>(demoAccounts[0].password);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // login() now returns the user object (server decoded the JWT).
      // Tokens are set as httpOnly cookies by the server — never touch JS.
      const user = await login(email, password);
      setAuth(user);
      void queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push(user.role === 'kitchen' ? '/kitchen' : '/dashboard');
    } catch {
      toast.error('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (acc: typeof demoAccounts[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-neutral-950 p-12 relative overflow-hidden">
        {/* background gradient orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">DashTab</span>
        </div>

        {/* hero */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Run your restaurant<br />
              <span className="text-orange-400">smarter.</span>
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-sm">
              Orders, kitchen display, menu and staff — all in one place.
            </p>
          </div>

          {/* demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Quick demo access</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-sm transition"
                >
                  <span className="text-neutral-300 hover:text-orange-300">{acc.email}</span>
                  <span className="text-xs font-semibold text-orange-400/80 ml-3">{acc.role}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-600">Click a role to fill in the credentials.</p>
          </div>
        </div>

        {/* footer */}
        <p className="text-neutral-700 text-xs relative z-10">
          © {new Date().getFullYear()} DashTab · Restaurant Operating System
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-8 sm:py-12 bg-white dark:bg-background">
        {/* mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-neutral-900 dark:text-foreground">DashTab</span>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-6 sm:space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-neutral-500 dark:text-muted-foreground">
              Sign in to your restaurant account
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            <TextField
              label="Email address"
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              className="rounded-xl py-3 mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 dark:text-muted-foreground">
            New restaurant?{' '}
            <Link
              href="/register"
              className="font-semibold text-orange-500 hover:text-orange-600 transition"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
