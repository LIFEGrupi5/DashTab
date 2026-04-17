import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/Modal';

describe('Modal', () => {
  const onClose = jest.fn();

  beforeEach(() => onClose.mockClear());

  it('renders title and children', () => {
    render(<Modal title="Confirm" onClose={onClose}>Body content</Modal>);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    render(<Modal title="Confirm" onClose={onClose}>Body</Modal>);
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal title="Confirm" onClose={onClose} footer={<button>Save</button>}>
        Body
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders no footer when not provided', () => {
    render(<Modal title="Confirm" onClose={onClose}>Body</Modal>);
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
