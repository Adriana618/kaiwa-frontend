'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore, useHydration } from '@/lib/store';
import { api } from '@/lib/api';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydration();
  const { token, setUser, setToken } = useAppStore();
  const [ready, setReady] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!hydrated) return;

    async function init() {
      if (token) {
        try {
          const user = await api.getMe(token);
          setUser(user);
        } catch {
          // Token expired or invalid
          setToken('');
        }
      }
      setReady(true);
    }
    init();
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for token refresh events from the API layer
  useEffect(() => {
    function onTokenRefreshed(e: Event) {
      const newToken = (e as CustomEvent).detail;
      if (newToken) setToken(newToken);
    }
    window.addEventListener('kaiwa:token-refreshed', onTokenRefreshed);
    return () => window.removeEventListener('kaiwa:token-refreshed', onTokenRefreshed);
  }, [setToken]);

  useEffect(() => {
    if (!ready) return;
    if (!token && !isLoginPage) {
      router.replace('/login');
    }
  }, [ready, token, isLoginPage, router]);

  if (!hydrated || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!token) return null;

  return (
    <>
      <Sidebar />
      <main className="md:ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-14 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </>
  );
}
