'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAppStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nativeLang, setNativeLang] = useState('es');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let tokens;
      if (isRegister) {
        tokens = await api.register({
          email,
          password,
          display_name: displayName || undefined,
          native_language: nativeLang,
        });
      } else {
        tokens = await api.login(email, password);
      }

      setToken(tokens.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaiwa_refresh_token', tokens.refresh_token);
      }

      const user = await api.getMe(tokens.access_token);
      setUser(user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-accent">Kaiwa</span>
          </h1>
          <p className="text-muted text-sm mt-2">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
              <select
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
              >
                <option value="es">Spanish</option>
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
            </>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          />

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-accent hover:underline"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
