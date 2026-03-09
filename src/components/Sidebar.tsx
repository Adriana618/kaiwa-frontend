'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

const LANGUAGES = [
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
];

const navItems = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/review', label: 'Review', icon: ReviewIcon },
  { href: '/immersion', label: 'Immersion', icon: ImmersionIcon },
  { href: '/cards', label: 'Cards', icon: CardsIcon },
];

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M12 4v16" />
    </svg>
  );
}

function ImmersionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function CardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="16" height="14" rx="2" />
      <path d="M6 2h12a2 2 0 012 2v2" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, user, logout } = useAppStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-surface border-r border-border flex flex-col z-10">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight">
          <span className="text-accent">Kaiwa</span>
        </h1>
        <p className="text-xs text-muted mt-1 tracking-wide">Language Mastery</p>
      </div>

      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted truncate">{user?.email || 'User'}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
