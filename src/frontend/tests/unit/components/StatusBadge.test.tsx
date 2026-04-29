import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders label text', () => {
    render(<StatusBadge label="preparing" toneClassName="bg-amber-50 text-amber-700" />);
    expect(screen.getByText('preparing')).toBeInTheDocument();
  });

  it('applies toneClassName to the element', () => {
    render(<StatusBadge label="ready" toneClassName="bg-green-50 text-green-700" />);
    const badge = screen.getByText('ready');
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('applies additional className when provided', () => {
    render(<StatusBadge label="new" toneClassName="bg-blue-50" className="extra-class" />);
    expect(screen.getByText('new')).toHaveClass('extra-class');
  });

  it('always has capitalize class', () => {
    render(<StatusBadge label="completed" toneClassName="" />);
    expect(screen.getByText('completed')).toHaveClass('capitalize');
  });
});
