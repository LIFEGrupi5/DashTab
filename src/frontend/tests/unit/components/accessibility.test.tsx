import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ShoppingBag } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import TextField from '@/components/TextField';
import StatCard from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('Button has no violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Modal has no violations', async () => {
    const { container } = render(
      <Modal title="Test Modal" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TextField has no violations', async () => {
    const { container } = render(<TextField label="Email address" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('StatCard has no violations', async () => {
    const { container } = render(
      <StatCard label="Total Orders" value={12} icon={ShoppingBag} color="bg-orange-100 text-orange-600" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('PageHeader has no violations', async () => {
    const { container } = render(<PageHeader title="Dashboard" subtitle="Welcome back" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
