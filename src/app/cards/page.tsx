'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import CardImage from '@/components/cards/CardImage';
import type { CardWithState, Deck } from '@/types';

export default function CardsPage() {
  const { token, language } = useAppStore();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.getDecks(token, language);
      setDecks(data);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, [token, language]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

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
        <div className="space-y-4">
          {decks.map((deck) => (
            <DeckItem
              key={deck.id}
              deck={deck}
              token={token}
              expanded={expandedDeck === deck.id}
              onToggle={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
              showAddCard={showAddCard === deck.id}
              onToggleAddCard={() => setShowAddCard(showAddCard === deck.id ? null : deck.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeckItem({
  deck, token, expanded, onToggle, showAddCard, onToggleAddCard,
}: {
  deck: Deck; token: string; expanded: boolean; onToggle: () => void;
  showAddCard: boolean; onToggleAddCard: () => void;
}) {
  const [cards, setCards] = useState<CardWithState[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (expanded && !loaded && token) {
      setLoadingCards(true);
      api.getDeckCards(token, deck.id)
        .then((data) => { setCards(data); setLoaded(true); })
        .catch(() => {})
        .finally(() => setLoadingCards(false));
    }
  }, [expanded, loaded, token, deck.id]);

  const refreshCards = useCallback(() => {
    if (!token) return;
    api.getDeckCards(token, deck.id)
      .then((data) => { setCards(data); setLoaded(true); })
      .catch(() => {});
  }, [token, deck.id]);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Deck header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-background/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <div>
            <h3 className="font-medium text-sm">{deck.name}</h3>
            {deck.description && (
              <p className="text-muted text-xs mt-0.5 line-clamp-1">{deck.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-muted">{deck.language.toUpperCase()}</span>
          {loaded && <span className="text-xs text-muted">{cards.length} cards</span>}
          <BatchImageButton token={token} deckId={deck.id} />
          <button
            onClick={onToggleAddCard}
            className="text-xs text-accent hover:underline"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Add card form */}
      {showAddCard && (
        <div className="px-5 pb-4">
          <AddCardForm
            token={token}
            deckId={deck.id}
            onDone={() => { onToggleAddCard(); refreshCards(); }}
          />
        </div>
      )}

      {/* Card list */}
      {expanded && (
        <div className="border-t border-border">
          {loadingCards ? (
            <p className="text-muted text-xs p-5">Loading cards...</p>
          ) : cards.length === 0 ? (
            <p className="text-muted text-xs p-5 text-center">No cards in this deck yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {cards.map((card) => (
                <CardRow key={card.id} card={card} token={token} onDeleted={refreshCards} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardRow({ card, token, onDeleted }: { card: CardWithState; token: string; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const state = card.card_state;
  const statusColor = !state || state.status === 'new'
    ? 'text-accent'
    : state.status === 'learning'
      ? 'text-warning'
      : 'text-success';

  async function handleDelete() {
    if (!confirm('Delete this card?')) return;
    setDeleting(true);
    try {
      await api.deleteCard(token, card.id);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-background/30 transition-colors group">
      {/* Image thumbnail */}
      {card.front.image_url ? (
        <CardImage imageUrl={card.front.image_url} alt={card.front.text} size="sm" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-background border border-border flex-shrink-0" />
      )}

      {/* Front */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium truncate">{card.front.text}</span>
          {card.front.reading && (
            <span className="text-xs text-muted flex-shrink-0">{card.front.reading}</span>
          )}
        </div>
        <p className="text-xs text-muted truncate mt-0.5">{card.back.text}</p>
      </div>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="hidden sm:flex gap-1 flex-shrink-0">
          {card.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] text-muted">
              {tag}
            </span>
          ))}
          {card.tags.length > 2 && (
            <span className="text-[10px] text-muted">+{card.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* SRS status */}
      <div className="flex-shrink-0 text-right">
        <span className={`text-[10px] font-medium ${statusColor}`}>
          {state?.status || 'new'}
        </span>
        {state && state.review_count > 0 && (
          <p className="text-[10px] text-muted">{state.review_count} reviews</p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all flex-shrink-0"
        title="Delete card"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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

  if (status === 'running') return <span className="text-xs text-muted animate-pulse">Assigning...</span>;
  if (status === 'done' && result) {
    return <span className="text-xs text-success">{result.assigned} assigned</span>;
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
    <form onSubmit={handleSubmit} className="pt-4 border-t border-border space-y-3">
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
