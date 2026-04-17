'use client';

import { ChefHat, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';
import TextField from '@/components/TextField';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-foreground">RestaurantOS</h1>
          <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-2">Operations Management System</p>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border shadow-sm p-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-card-foreground mb-6">Create your account</h2>
          <form className="space-y-5">
            <TextField label="Full Name" type="text" placeholder="Jane Doe" leftIcon={<User className="w-5 h-5" />} />
            <TextField
              label="Email Address"
              type="email"
              placeholder="you@restaurant.com"
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <TextField label="Password" type="password" placeholder="••••••••" leftIcon={<Lock className="w-5 h-5" />} />
            <TextField
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
            />

            <Button type="submit" fullWidth className="rounded-xl py-3">
              Create Account
            </Button>

            <p className="text-sm text-neutral-600 dark:text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
