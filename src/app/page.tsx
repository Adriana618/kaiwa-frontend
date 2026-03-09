'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { ReviewStats } from '@/types';

export default function Dashboard() {
  const { token, language, user } = useAppStore();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [immersionMinutes, setImmersionMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    async function loadData() {
      try {
        const [reviewStats, dashboard] = await Promise.allSettled([
          api.getReviewStats(token, language),
          api.getImmersionDashboard(token, language),
        ]);
        if (reviewStats.status === 'fulfilled') setStats(reviewStats.value);
        if (dashboard.status === 'fulfilled') {
          setImmersionMinutes(dashboard.value?.today_minutes ?? 0);
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, language]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user?.display_name ? `, ${user.display_name}` : ''}
        </h1>
        <p className="text-muted text-sm mt-1">
          Here&apos;s your study overview for today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cards Due"
          value={loading ? '...' : String(stats?.cards_due ?? 0)}
          sub="reviews pending"
        />
        <StatCard
          label="Reviewed Today"
          value={loading ? '...' : String(stats?.cards_reviewed_today ?? 0)}
          sub="cards completed"
        />
        <StatCard
          label="Retention"
          value={loading ? '...' : `${Math.round((stats?.retention_rate ?? 0) * 100)}%`}
          sub="success rate"
        />
        <StatCard
          label="Immersion"
          value={loading ? '...' : `${immersionMinutes}`}
          sub="minutes today"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/review"
          className="group bg-surface border border-border rounded-xl p-6 hover:border-accent/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Start Review</h3>
              <p className="text-muted text-xs mt-1">
                Practice your due cards with spaced repetition
              </p>
            </div>
            <span className="text-muted group-hover:text-accent transition-colors text-lg">&rarr;</span>
          </div>
        </Link>

        <Link
          href="/immersion"
          className="group bg-surface border border-border rounded-xl p-6 hover:border-accent/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Log Immersion</h3>
              <p className="text-muted text-xs mt-1">
                Record your listening, reading, and watching time
              </p>
            </div>
            <span className="text-muted group-hover:text-accent transition-colors text-lg">&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      <p className="text-xs text-muted mt-1">{sub}</p>
    </div>
  );
}
