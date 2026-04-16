import { useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import TextField from '../../components/TextField';

const menuItems = [
  { id: '1', name: 'Qebapa', category: 'Main Course', price: 4.5, available: true, description: 'Traditional grilled meat' },
  { id: '2', name: 'Pljeskavica', category: 'Main Course', price: 5, available: true, description: 'Grilled patty' },
  { id: '3', name: 'Tave Kosi', category: 'Main Course', price: 6.5, available: true, description: 'Lamb with yogurt' },
  { id: '4', name: 'Fergese', category: 'Main Course', price: 5.5, available: true, description: 'Peppers with cheese' },
  { id: '5', name: 'Byrek', category: 'Appetizer', price: 2.5, available: true, description: 'Cheese or meat pie' },
  { id: '6', name: 'Shopska Salad', category: 'Salad', price: 3.5, available: true, description: 'Fresh vegetable salad' },
  { id: '7', name: 'Baklava', category: 'Dessert', price: 2, available: true, description: 'Sweet pastry' },
  { id: '8', name: 'Turkish Coffee', category: 'Beverage', price: 1.5, available: true, description: '' },
  { id: '9', name: 'Raki', category: 'Beverage', price: 3, available: true, description: '' },
  { id: '10', name: 'Ayran', category: 'Beverage', price: 1.5, available: true, description: '' },
];

const categories = ['All', 'Appetizer', 'Main Course', 'Salad', 'Dessert', 'Beverage'] as const;

const fields = ['name', 'category', 'price', 'description'] as const;

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [open, setOpen] = useState(false);

  const filtered =
    activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Menu"
        subtitle={`${menuItems.length} items`}
        action={
          <Button
          onClick={() => setOpen(true)}
          >
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
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-neutral-900">{item.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{item.category}</p>
              </div>
              <StatusBadge
                label={item.available ? 'Available' : 'Unavailable'}
                toneClassName={item.available ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}
                className="font-medium normal-case"
              />
            </div>
            {item.description && <p className="text-sm text-neutral-500 flex-1">{item.description}</p>}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
              <span className="text-lg font-bold text-orange-600">€{item.price.toFixed(2)}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-700">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600 hover:bg-red-50">
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
          footer={<Button fullWidth>Add to Menu</Button>}
        >
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
            <span className="text-sm text-neutral-700">Available</span>
          </label>
        </Modal>
      )}
    </div>
  );
}

