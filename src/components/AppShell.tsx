'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, setUser, setToken } = useAppStore();
  const [ready, setReady] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    if (!token && !isLoginPage) {
      router.replace('/login');
    }
  }, [ready, token, isLoginPage, router]);

  if (!ready) {
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
      <main className="ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
