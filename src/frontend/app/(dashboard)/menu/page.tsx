'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, X, UtensilsCrossed, SlidersHorizontal, FolderPlus } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TextField from '@/components/TextField';
import EmptyState from '@/components/EmptyState';
import { useCategories, useCreateCategory, useCreateMenuItem, useMenu } from '@/hooks/useMenu';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_FORM = { name: '', categoryId: '', price: '', description: '', available: true };

export default function MenuPage() {
  const { user } = useAuth();
  // Only Owner/Manager may create categories — mirrors the backend
  // [Authorize(Roles = "Owner,Manager")] on POST /menu-categories.
  const canManageCategories = user?.role === 'owner' || user?.role === 'manager';

  const { data: menuItems = [], isLoading } = useMenu();
  const { data: categoryOptions = [] } = useCategories();
  const createItem = useCreateMenuItem();
  const createCategory = useCreateCategory();

  // Filter chips are derived from the real categories the restaurant created
  // (no hard-coded list), with "All" prepended.
  const filterChips = useMemo(
    () => ['All', ...categoryOptions.map(c => c.name)],
    [categoryOptions],
  );

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const canCreateCategory = categoryName.trim() !== '';

  const handleCreateCategory = () => {
    if (!canCreateCategory) return;
    createCategory.mutate(categoryName.trim(), {
      onSuccess: () => {
        setCategoryName('');
        setCategoryOpen(false);
      },
    });
  };

  const canCreate = form.name.trim() !== '' && form.categoryId !== '' && form.price !== '';

  const handleCreate = () => {
    if (!canCreate) return;
    createItem.mutate(
      {
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        description: form.description.trim(),
        available: form.available,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          setOpen(false);
        },
      },
    );
  };

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

      <div className="flex gap-2 flex-wrap mb-5 items-center">
        {filterChips.map(cat => (
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
        {canManageCategories && (
          <button
            onClick={() => setCategoryOpen(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition border border-dashed border-neutral-300 dark:border-border text-neutral-500 dark:text-muted-foreground hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1"
          >
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!isLoading && menuItems.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon={UtensilsCrossed} title="Your menu is empty" description="Add your first item so staff can start taking orders." action={{ label: 'Add item', onClick: () => setOpen(true) }} />
          </div>
        ) : !isLoading && filtered.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon={SlidersHorizontal} title="No items in this category" description="Try a different category or add a new item." action={{ label: 'Add item', onClick: () => setOpen(true) }} />
          </div>
        ) : null}
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
        <Modal
          title="Add Item"
          onClose={() => setOpen(false)}
          footer={
            <Button fullWidth onClick={handleCreate} disabled={!canCreate || createItem.isPending}>
              {createItem.isPending ? 'Adding…' : 'Add to Menu'}
            </Button>
          }
        >
          <TextField
            label="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="py-2"
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-card text-sm text-neutral-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a category…</option>
              {categoryOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categoryOptions.length === 0 && (
              <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-1">
                No categories yet — create one before adding items.
              </p>
            )}
          </div>
          <TextField
            label="Price"
            type="number"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className="py-2"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="py-2"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.available}
              onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-neutral-700 dark:text-muted-foreground">Available</span>
          </label>
        </Modal>
      )}

      {categoryOpen && canManageCategories && (
        <Modal
          title="Add Category"
          onClose={() => setCategoryOpen(false)}
          footer={
            <Button
              fullWidth
              onClick={handleCreateCategory}
              disabled={!canCreateCategory || createCategory.isPending}
            >
              {createCategory.isPending ? 'Adding…' : 'Add Category'}
            </Button>
          }
        >
          <TextField
            label="Category name"
            value={categoryName}
            onChange={e => setCategoryName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateCategory();
            }}
            placeholder="e.g. Appetizers"
            className="py-2"
          />
        </Modal>
      )}
    </div>
  );
}
