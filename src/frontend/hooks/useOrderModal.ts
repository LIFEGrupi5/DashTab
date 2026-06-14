'use client';

import { useReducer, useCallback } from 'react';

type ModalState = {
  open: boolean;
  table: string;
  cart: Record<string, number>;
};

type ModalAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_TABLE'; table: string }
  | { type: 'ADD_ITEM'; id: string }
  | { type: 'REMOVE_ITEM'; id: string };

const initialState: ModalState = { open: false, table: '', cart: {} };

function reducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, open: true };
    case 'CLOSE':
      return initialState;
    case 'SET_TABLE':
      return { ...state, table: action.table };
    case 'ADD_ITEM':
      return { ...state, cart: { ...state.cart, [action.id]: (state.cart[action.id] ?? 0) + 1 } };
    case 'REMOVE_ITEM': {
      const next = { ...state.cart };
      const qty = (next[action.id] ?? 0) - 1;
      if (qty <= 0) delete next[action.id];
      else next[action.id] = qty;
      return { ...state, cart: next };
    }
  }
}

export function useOrderModal() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const open = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const close = useCallback(() => dispatch({ type: 'CLOSE' }), []);
  const setTable = useCallback((table: string) => dispatch({ type: 'SET_TABLE', table }), []);
  const addItem = useCallback((id: string) => dispatch({ type: 'ADD_ITEM', id }), []);
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  return { state, open, close, setTable, addItem, removeItem };
}
