import { renderHook, act } from '@testing-library/react';
import { useOrderModal } from '@/hooks/useOrderModal';

describe('useOrderModal', () => {
  it('starts with modal closed and empty state', () => {
    const { result } = renderHook(() => useOrderModal());
    expect(result.current.state).toEqual({ open: false, table: '', cart: {} });
  });

  it('opens the modal', () => {
    const { result } = renderHook(() => useOrderModal());
    act(() => result.current.open());
    expect(result.current.state.open).toBe(true);
  });

  it('closes and resets all state', () => {
    const { result } = renderHook(() => useOrderModal());
    act(() => {
      result.current.open();
      result.current.setTable('T-5');
      result.current.addItem('item-1');
    });
    act(() => result.current.close());
    expect(result.current.state).toEqual({ open: false, table: '', cart: {} });
  });

  it('sets table number', () => {
    const { result } = renderHook(() => useOrderModal());
    act(() => result.current.setTable('T-12'));
    expect(result.current.state.table).toBe('T-12');
  });

  it('adds items to cart', () => {
    const { result } = renderHook(() => useOrderModal());
    act(() => result.current.addItem('item-1'));
    expect(result.current.state.cart['item-1']).toBe(1);
    act(() => result.current.addItem('item-1'));
    expect(result.current.state.cart['item-1']).toBe(2);
  });

  it('removes items from cart and deletes key at zero', () => {
    const { result } = renderHook(() => useOrderModal());
    act(() => {
      result.current.addItem('item-1');
      result.current.addItem('item-1');
    });
    act(() => result.current.removeItem('item-1'));
    expect(result.current.state.cart['item-1']).toBe(1);
    act(() => result.current.removeItem('item-1'));
    expect(result.current.state.cart['item-1']).toBeUndefined();
  });

  it('tracks multiple items independently', () => {
    const { result } = renderHook(() => useOrderModal());
    act(() => {
      result.current.addItem('item-1');
      result.current.addItem('item-2');
      result.current.addItem('item-2');
    });
    expect(result.current.state.cart['item-1']).toBe(1);
    expect(result.current.state.cart['item-2']).toBe(2);
  });
});
