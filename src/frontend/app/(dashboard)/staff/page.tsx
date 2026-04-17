'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/Button';
import MultiStepForm from '@/components/MultiStepForm';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useUsers } from '@/hooks/useUsers';

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200',
  manager: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
  waiter: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200',
  kitchen: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
};

export default function StaffPage() {
  const { data: users = [], isLoading } = useUsers();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Staff"
        subtitle={isLoading ? 'Loading team…' : `${users.length} members`}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        }
      />

      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border divide-y divide-neutral-100 dark:divide-border">
        {users.map(user => (
          <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/45 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-orange-600 dark:text-orange-200">
                {user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 dark:text-foreground text-sm">{user.name}</p>
              <p className="text-xs text-neutral-500 dark:text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <StatusBadge label={user.role} toneClassName={ROLE_COLORS[user.role]} />
              <Button variant={user.active ? 'secondary' : 'success'} size="sm" className="w-full sm:w-auto">
                {user.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <MultiStepForm
          onClose={() => setOpen(false)}
          onSubmit={data => {
            console.log('New staff:', data);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
