import { ChefHat } from 'lucide-react';
import Button from '../../components/Button';
import TextField from '../../components/TextField';

const demoAccounts = [
  { email: 'admin@restaurant.com', role: 'Owner' },
  { email: 'manager@restaurant.com', role: 'Manager' },
  { email: 'ana@restaurant.com', role: 'Waiter' },
  { email: 'petrit@restaurant.com', role: 'Kitchen' },
] as const;

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">RestaurantOS</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <form className="space-y-4">
            <TextField label="Email" type="email" placeholder="you@restaurant.com" />
            <TextField label="Password" type="password" placeholder="Any password works" />
            <Button type="submit" fullWidth>
              Sign In
            </Button>
          </form>
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-neutral-200 p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Demo accounts</p>
          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 transition"
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

