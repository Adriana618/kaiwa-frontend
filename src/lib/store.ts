import { create } from 'zustand';

interface AppState {
  token: string;
  language: string;
  user: { id: string; email: string; display_name: string | null } | null;
  setToken: (token: string) => void;
  setLanguage: (lang: string) => void;
  setUser: (user: AppState['user']) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('kaiwa_token') || '' : '',
  language: typeof window !== 'undefined' ? localStorage.getItem('kaiwa_language') || 'ja' : 'ja',
  user: null,
  setToken: (token) => {
    if (typeof window !== 'undefined') localStorage.setItem('kaiwa_token', token);
    set({ token });
  },
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('kaiwa_language', lang);
    set({ language: lang });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaiwa_token');
      localStorage.removeItem('kaiwa_refresh_token');
    }
    set({ token: '', user: null });
  },
}));
