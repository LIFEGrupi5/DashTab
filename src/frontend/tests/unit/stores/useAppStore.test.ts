import { useAppStore } from '@/stores/useAppStore';
import type { AuthUser } from '@/lib/api/types';

const user: AuthUser = { id: 'u1', email: 'o@x.com', name: 'Olivia', role: 'owner' };

beforeEach(() => {
  localStorage.clear();
  // Reset to defaults between tests (the store is a module-level singleton).
  useAppStore.setState({ user: null, sidebarOpen: true, darkMode: true });
});

describe('useAppStore', () => {
  it('starts with no user and sane UI defaults', () => {
    const s = useAppStore.getState();
    expect(s.user).toBeNull();
    expect(s.sidebarOpen).toBe(true);
    expect(s.darkMode).toBe(true);
  });

  it('setAuth and setUser both set the current user', () => {
    useAppStore.getState().setAuth(user);
    expect(useAppStore.getState().user).toEqual(user);

    useAppStore.setState({ user: null });
    useAppStore.getState().setUser(user);
    expect(useAppStore.getState().user).toEqual(user);
  });

  it('clearAuth resets the user to null', () => {
    useAppStore.getState().setAuth(user);
    useAppStore.getState().clearAuth();
    expect(useAppStore.getState().user).toBeNull();
  });

  it('toggleSidebar flips the sidebar open state', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(true);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });
});
