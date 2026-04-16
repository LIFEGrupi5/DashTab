'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';
import TextField from '@/components/TextField';

const demoAccounts = [
  { email: 'admin@restaurant.com', role: 'Owner' },
  { email: 'manager@restaurant.com', role: 'Manager' },
  { email: 'ana@restaurant.com', role: 'Waiter' },
  { email: 'petrit@restaurant.com', role: 'Kitchen' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState(demoAccounts[0].email);

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedAccount = demoAccounts.find(account => account.email === selectedEmail) ?? demoAccounts[0];
    window.localStorage.setItem('restaurantos:role', selectedAccount.role.toLowerCase());
    window.localStorage.setItem('restaurantos:email', selectedAccount.email);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">RestaurantOS</h1>
          <p className="text-sm text-neutral-500 mt-2">Operations Management System</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Sign in to your account</h2>
          <form className="space-y-5" onSubmit={handleSignIn}>
            <TextField
              label="Email Address"
              type="email"
              placeholder="you@restaurant.com"
              value={selectedEmail}
              onChange={event => setSelectedEmail(event.target.value)}
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
            />

            <Button type="submit" fullWidth className="rounded-xl py-3">
              Sign In
            </Button>

            <p className="text-sm text-neutral-600 text-center">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-700">
                Sign up
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-neutral-200 p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Demo accounts</p>
          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => setSelectedEmail(acc.email)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  selectedEmail === acc.email ? 'bg-orange-50' : 'hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm text-neutral-700">{acc.email}</span>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
