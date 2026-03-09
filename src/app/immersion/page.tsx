'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { ImmersionLog } from '@/types';

const MODALITIES = [
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'watching', label: 'Watching' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'conversation', label: 'Conversation' },
];

const SOURCE_TYPES = [
  'anime', 'drama', 'podcast', 'audiobook', 'manga', 'novel',
  'news', 'youtube', 'music', 'game', 'conversation', 'other',
];

export default function ImmersionPage() {
  const { token, language } = useAppStore();
  const [history, setHistory] = useState<ImmersionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [modality, setModality] = useState('listening');
  const [duration, setDuration] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [comprehension, setComprehension] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data = await api.getImmersionHistory(token, language);
        setHistory(data);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, language]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !duration) return;

    setSubmitting(true);
    try {
      await api.logImmersion(token, {
        language,
        modality,
        duration_minutes: parseInt(duration),
        source_name: sourceName || null,
        source_type: sourceType || null,
        comprehension: comprehension ? parseInt(comprehension) / 100 : null,
      });
      setSuccess(true);
      setDuration('');
      setSourceName('');
      setSourceType('');
      setComprehension('');
      setTimeout(() => setSuccess(false), 2000);

      // Refresh history
      const data = await api.getImmersionHistory(token, language);
      setHistory(data);
    } catch {
      // API error
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Immersion</h1>
        <p className="text-muted text-sm mt-1">Log your language exposure activities</p>
      </div>

      {/* Quick Entry Form */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium">Log Activity</h2>

        {/* Modality Picker */}
        <div className="space-y-2">
          <label className="text-xs text-muted uppercase tracking-wider">Modality</label>
          <div className="flex flex-wrap gap-2">
            {MODALITIES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setModality(m.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  modality === m.value
                    ? 'bg-accent text-background'
                    : 'bg-background border border-border text-muted hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration & Source Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase tracking-wider">Duration (min)</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase tracking-wider">Source Name</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g., Spy x Family"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase tracking-wider">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Select...</option>
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comprehension */}
        <div className="space-y-2">
          <label className="text-xs text-muted uppercase tracking-wider">
            Comprehension (optional): {comprehension ? `${comprehension}%` : '--'}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={comprehension || 0}
            onChange={(e) => setComprehension(e.target.value === '0' ? '' : e.target.value)}
            className="w-full accent-accent"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !duration}
          className="px-5 py-2.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging...' : success ? 'Logged!' : 'Log Activity'}
        </button>
      </form>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Recent Activity</h2>
        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : history.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-muted text-sm">No immersion logged yet. Start tracking your exposure above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 20).map((log) => (
              <div
                key={log.id}
                className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                    <ModalityIcon modality={log.modality} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {log.source_name || log.modality.charAt(0).toUpperCase() + log.modality.slice(1)}
                    </p>
                    <p className="text-xs text-muted">
                      {log.source_type && `${log.source_type} · `}
                      {log.activity_date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{log.duration_minutes} min</p>
                  {log.comprehension !== null && (
                    <p className="text-xs text-muted">{Math.round(log.comprehension * 100)}% comp</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalityIcon({ modality }: { modality: string }) {
  const iconMap: Record<string, string> = {
    listening: 'L',
    reading: 'R',
    watching: 'W',
    speaking: 'S',
    conversation: 'C',
  };
  return (
    <span className="text-xs font-medium text-accent">
      {iconMap[modality] || modality.charAt(0).toUpperCase()}
    </span>
  );
}
