'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import ImageSearch from '@/components/cards/ImageSearch';
import type { Deck } from '@/types';

export default function CardsPage() {
  const { token, language } = useAppStore();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [showAddCard, setShowAddCard] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    loadDecks();
  }, [token, language]);

  async function loadDecks() {
    try {
      const data = await api.getDecks(token, language);
      setDecks(data);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cards</h1>
          <p className="text-muted text-sm mt-1">Browse and manage your card decks</p>
        </div>
        <button
          onClick={() => setShowNewDeck(true)}
          className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          New Deck
        </button>
      </div>

      {showNewDeck && (
        <NewDeckForm
          token={token}
          language={language}
          onCreated={() => { setShowNewDeck(false); loadDecks(); }}
          onCancel={() => setShowNewDeck(false)}
        />
      )}

      {loading ? (
        <p className="text-muted text-sm">Loading decks...</p>
      ) : decks.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-background mx-auto flex items-center justify-center">
            <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="16" height="14" rx="2" />
              <path d="M6 2h12a2 2 0 012 2v2" />
            </svg>
          </div>
          <h2 className="text-sm font-medium">No decks yet</h2>
          <p className="text-muted text-xs max-w-sm mx-auto">
            Create your first deck to start adding flashcards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-medium text-sm">{deck.name}</h3>
              {deck.description && (
                <p className="text-muted text-xs mt-1 line-clamp-2">{deck.description}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted">{deck.language.toUpperCase()}</span>
                <div className="flex gap-3">
                  <BatchImageButton token={token} deckId={deck.id} />
                  <button
                    onClick={() => setShowAddCard(showAddCard === deck.id ? null : deck.id)}
                    className="text-xs text-accent hover:underline"
                  >
                    + Add Card
                  </button>
                </div>
              </div>
              {showAddCard === deck.id && (
                <AddCardForm
                  token={token}
                  deckId={deck.id}
                  onDone={() => setShowAddCard(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewDeckForm({
  token, language, onCreated, onCancel,
}: {
  token: string; language: string; onCreated: () => void; onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createDeck(token, { name: name.trim(), language, description: description.trim() || undefined });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-medium">Create New Deck</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Deck name"
        required
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Deck'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function BatchImageButton({ token, deckId }: { token: string; deckId: string }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<{ assigned: number; skipped: number } | null>(null);

  async function handleBatch() {
    setStatus('running');
    try {
      const res = await api.batchAssignImages(token, { deck_id: deckId });
      setResult(res);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('idle');
    }
  }

  if (status === 'running') return <span className="text-xs text-muted animate-pulse">Assigning images...</span>;
  if (status === 'done' && result) {
    return <span className="text-xs text-success">{result.assigned} images assigned</span>;
  }
  return (
    <button onClick={handleBatch} className="text-xs text-muted hover:text-accent transition-colors">
      Auto-images
    </button>
  );
}

function AddCardForm({
  token, deckId, onDone,
}: {
  token: string; deckId: string; onDone: () => void;
}) {
  const [front, setFront] = useState('');
  const [reading, setReading] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createCard(token, {
        deck_id: deckId,
        front: { text: front.trim(), ...(reading.trim() ? { reading: reading.trim() } : {}) },
        back: { text: back.trim() },
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      setFront('');
      setReading('');
      setBack('');
      setTags('');
      setAdded((n) => n + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-3">
      <input
        type="text"
        value={front}
        onChange={(e) => setFront(e.target.value)}
        placeholder="Front (word/phrase)"
        required
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={reading}
        onChange={(e) => setReading(e.target.value)}
        placeholder="Reading (optional)"
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={back}
        onChange={(e) => setBack(e.target.value)}
        placeholder="Back (meaning)"
        required
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma-separated)"
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 bg-accent text-background rounded-lg text-xs font-medium hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? '...' : 'Add Card'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-xs text-muted hover:text-foreground"
        >
          Done
        </button>
        {added > 0 && <span className="text-xs text-success">{added} added</span>}
      </div>
    </form>
  );
}
