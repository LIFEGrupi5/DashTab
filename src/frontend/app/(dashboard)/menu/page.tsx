'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TextField from '@/components/TextField';
import { useMenu } from '@/hooks/useMenu';

const categories = ['All', 'Appetizer', 'Main Course', 'Salad', 'Dessert', 'Beverage'] as const;

const fields = ['name', 'category', 'price', 'description'] as const;

export default function MenuPage() {
  const { data: menuItems = [], isLoading } = useMenu();
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => (activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory)),
    [menuItems, activeCategory]
  );

  return (
    <div className="p-6 w-[95%] mx-auto">
      <PageHeader
        title="Menu"
        subtitle={isLoading ? 'Loading menu…' : `${menuItems.length} items`}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        }
      />

      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-card border border-neutral-200 dark:border-border text-neutral-600 dark:text-muted-foreground hover:bg-neutral-50 dark:hover:bg-muted/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-4 flex flex-col"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 dark:text-foreground">{item.name}</p>
                <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">{item.category}</p>
              </div>
              <StatusBadge
                label={item.available ? 'Available' : 'Unavailable'}
                toneClassName={
                  item.available
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-muted/40 dark:text-muted-foreground'
                }
                className="font-medium normal-case"
              />
            </div>
            {item.description ? (
              <p className="text-sm text-neutral-500 dark:text-muted-foreground flex-1">{item.description}</p>
            ) : null}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-border">
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">€{item.price.toFixed(2)}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-700 dark:hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Add Item" onClose={() => setOpen(false)} footer={<Button fullWidth>Add to Menu</Button>}>
          {fields.map(field => (
            <TextField
              key={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              type={field === 'price' ? 'number' : 'text'}
              className="py-2"
            />
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-neutral-700 dark:text-muted-foreground">Available</span>
          </label>
        </Modal>
      )}
    </div>
  );
}
