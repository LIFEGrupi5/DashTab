'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TextField from '@/components/TextField';

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-50 text-purple-700',
  manager: 'bg-blue-50 text-blue-700',
  waiter: 'bg-green-50 text-green-700',
  kitchen: 'bg-orange-50 text-orange-700',
};

const users = [
  { id: '1', name: 'Admin User', email: 'admin@restaurant.com', role: 'owner', active: true },
  { id: '2', name: 'John Manager', email: 'manager@restaurant.com', role: 'manager', active: true },
  { id: '3', name: 'Ana Waiter', email: 'ana@restaurant.com', role: 'waiter', active: true },
  { id: '4', name: 'Petrit Chef', email: 'petrit@restaurant.com', role: 'kitchen', active: true },
] as const;

export default function StaffPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Staff"
        subtitle={`${users.length} members`}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {users.map(user => (
          <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-orange-600">
                {user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 text-sm">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <StatusBadge label={user.role} toneClassName={ROLE_COLORS[user.role]} />
              <Button
                variant={user.active ? 'secondary' : 'success'}
                size="sm"
                className="w-full sm:w-auto"
              >
                {user.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal
          title="Add Staff Member"
          onClose={() => setOpen(false)}
          footer={<Button fullWidth>Add Member</Button>}
        >
          <TextField label="Full Name" className="py-2" />
          <TextField label="Email" type="email" className="py-2" />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
            <select className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="waiter">Waiter</option>
              <option value="kitchen">Kitchen</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}
