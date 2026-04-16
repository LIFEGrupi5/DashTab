import { ShoppingBag, DollarSign, Users, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';

const stats = [
  { label: 'Active Orders', value: 3, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
  { label: "Today's Revenue", value: '€142.00', icon: DollarSign, color: 'bg-green-50 text-green-600' },
  { label: 'New Orders', value: 1, icon: Clock, color: 'bg-orange-50 text-orange-600' },
  { label: 'Active Staff', value: 4, icon: Users, color: 'bg-purple-50 text-purple-600' },
];

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Welcome back, Admin" subtitle="Owner · RestaurantOS" className="mb-8" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
