import { create } from 'zustand';
import { useEffect, useState } from 'react';

interface AppState {
  token: string;
  language: string;
  user: { id: string; email: string; display_name: string | null } | null;
  setToken: (token: string) => void;
  setLanguage: (lang: string) => void;
  setUser: (user: AppState['user']) => void;
  logout: () => void;
  _hydrated: boolean;
  _hydrate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: '',
  language: 'ja',
  user: null,
  _hydrated: false,
  _hydrate: () => {
    if (typeof window === 'undefined') return;
    set({
      token: localStorage.getItem('kaiwa_token') || '',
      language: localStorage.getItem('kaiwa_language') || 'ja',
      _hydrated: true,
    });
  },
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

/** Hook that ensures the store is hydrated from localStorage on the client. */
export function useHydration() {
  const hydrate = useAppStore((s) => s._hydrate);
  const hydrated = useAppStore((s) => s._hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}
