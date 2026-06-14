import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextField from '@/components/TextField';

describe('TextField', () => {
  it('renders label and associated input', () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const onChange = jest.fn();
    render(<TextField label="Name" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows placeholder text', () => {
    render(<TextField label="Search" placeholder="Search items..." />);
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is passed', () => {
    render(<TextField label="Disabled" disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });

  it('uses provided id', () => {
    render(<TextField label="Custom" id="my-input" />);
    expect(screen.getByLabelText('Custom')).toHaveAttribute('id', 'my-input');
  });
});
