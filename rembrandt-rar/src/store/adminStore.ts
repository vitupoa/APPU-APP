import { create } from 'zustand';

export type AdminRole = 'SUPER_ADMIN' | 'MODERATOR' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  avatarUrl?: string;
}

interface AdminState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  setAdmin: (user: AdminUser, token: string) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  isSuperAdmin: () => boolean;
  setLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setAdmin: (user, token) => {
    localStorage.setItem('rar_token', token);
    localStorage.setItem('rar_user', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('rar_token');
    localStorage.removeItem('rar_user');
    set({ user: null, token: null, isLoading: false });
  },

  hasPermission: (perm) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(perm);
  },

  isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',

  setLoading: (loading) => set({ isLoading: loading }),
}));

export function initAdminFromStorage() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('rar_token');
  const userJson = localStorage.getItem('rar_user');
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      useAdminStore.getState().setAdmin(user, token);
    } catch {
      useAdminStore.getState().logout();
    }
  } else {
    useAdminStore.getState().setLoading(false);
  }
}
