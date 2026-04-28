import { render, screen } from '@testing-library/react';
import { ShoppingBag } from 'lucide-react';
import StatCard from '@/components/StatCard';

describe('StatCard', () => {
  it('renders numeric value and label', () => {
    render(<StatCard label="Total Orders" value={42} icon={ShoppingBag} color="bg-orange-100 text-orange-600" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard label="Revenue" value="€1,234" icon={ShoppingBag} color="bg-green-100 text-green-600" />);
    expect(screen.getByText('€1,234')).toBeInTheDocument();
  });

  it('renders zero value', () => {
    render(<StatCard label="Pending" value={0} icon={ShoppingBag} color="bg-neutral-100" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
