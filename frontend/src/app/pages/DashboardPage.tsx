import { ShoppingBag, DollarSign, Users, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const stats = [
  { label: 'Active Orders', value: 3, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
  { label: "Today's Revenue", value: '€142.00', icon: DollarSign, color: 'bg-green-50 text-green-600' },
  { label: 'New Orders', value: 1, icon: Clock, color: 'bg-orange-50 text-orange-600' },
  { label: 'Active Staff', value: 4, icon: Users, color: 'bg-purple-50 text-purple-600' },
];

const deliverables = [
  {
    id: 'm2.1',
    indexLabel: 'M2.1',
    deliverable: 'Next.js project scaffolded',
    owner: 'Frontend Lead',
    description: 'App Router, TypeScript strict mode, Tailwind configured, ESLint + Prettier',
  },
  {
    id: 'm2.2',
    indexLabel: 'M2.2',
    deliverable: 'Core UI components',
    owner: 'Frontend Lead',
    description: 'Design system: buttons, inputs, modals, cards, navbars, data tables - all responsive, dark mode',
  },
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

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-800">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-800">Deliverable</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-800">Owner</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {deliverables.map(row => (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3.5 text-sm font-semibold text-neutral-900 border-r border-neutral-200 whitespace-nowrap">
                    {row.indexLabel}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-neutral-900 border-r border-neutral-200 whitespace-normal">
                    {row.deliverable}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-900 border-r border-neutral-200 whitespace-normal">
                    {row.owner}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-900 whitespace-normal">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

