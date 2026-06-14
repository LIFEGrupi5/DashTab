import { render, screen } from '@testing-library/react';
import PageHeader from '@/components/PageHeader';

describe('PageHeader', () => {
  it('renders title as h1', () => {
    render(<PageHeader title="Orders" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Orders' })).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Orders" subtitle="24 total" />);
    expect(screen.getByText('24 total')).toBeInTheDocument();
  });

  it('does not render subtitle element when not provided', () => {
    const { container } = render(<PageHeader title="Orders" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(<PageHeader title="Orders" action={<button>New Order</button>} />);
    expect(screen.getByRole('button', { name: 'New Order' })).toBeInTheDocument();
  });

  it('does not render action slot when not provided', () => {
    render(<PageHeader title="Orders" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
