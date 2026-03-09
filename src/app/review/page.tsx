'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { CardWithState, ReviewResult } from '@/types';

const RATINGS = [
  { value: 1, label: 'Again', key: '1', color: 'bg-danger' },
  { value: 2, label: 'Hard', key: '2', color: 'bg-warning' },
  { value: 3, label: 'Good', key: '3', color: 'bg-success' },
  { value: 4, label: 'Easy', key: '4', color: 'bg-accent' },
];

export default function ReviewPage() {
  const { token, language } = useAppStore();
  const [cards, setCards] = useState<CardWithState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewStartTime, setReviewStartTime] = useState<number>(Date.now());
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [lastResult, setLastResult] = useState<ReviewResult | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function loadCards() {
      try {
        const data = await api.getNextCards(token, language);
        setCards(data);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, [token, language]);

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const handleRate = useCallback(
    async (rating: number) => {
      if (!currentCard || !token) return;

      const durationMs = Date.now() - reviewStartTime;
      try {
        const result = await api.submitAnswer(token, {
          card_id: currentCard.id,
          rating,
          review_duration_ms: durationMs,
        });
        setLastResult(result);
        setSessionStats((prev) => ({
          reviewed: prev.reviewed + 1,
          correct: rating >= 3 ? prev.correct + 1 : prev.correct,
        }));
      } catch {
        // API error - continue anyway
      }

      setFlipped(false);
      setCurrentIndex((i) => i + 1);
      setReviewStartTime(Date.now());
    },
    [currentCard, token, reviewStartTime],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) {
          handleFlip();
        }
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleRate(parseInt(e.key));
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, handleFlip, handleRate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted text-sm">Loading cards...</p>
      </div>
    );
  }

  // Session complete
  if (!currentCard && cards.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-xl font-semibold">Session Complete</h2>
        <p className="text-muted text-sm">
          Reviewed {sessionStats.reviewed} cards &middot;{' '}
          {sessionStats.reviewed > 0
            ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
            : 0}
          % correct
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          New Session
        </button>
      </div>
    );
  }

  // No cards
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-2">
        <h2 className="text-xl font-semibold">No cards due</h2>
        <p className="text-muted text-sm">All caught up! Come back later or log some immersion time.</p>
      </div>
    );
  }

  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;
  const cemAdjustment = lastResult?.cem_adjustment;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted">
          <span>{currentIndex} / {cards.length}</span>
          <span>
            {sessionStats.reviewed > 0
              ? `${Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}%`
              : '--'}
          </span>
        </div>
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* CEM Insight */}
      {cemAdjustment !== undefined && cemAdjustment !== null && cemAdjustment !== 0 && (
        <div className="bg-surface border border-border rounded-lg px-4 py-2 text-xs text-muted flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          CEM adjustment: {cemAdjustment > 0 ? '+' : ''}{(cemAdjustment * 100).toFixed(1)}% stability
          {cemAdjustment > 0 ? ' (immersion boost)' : ' (needs more exposure)'}
        </div>
      )}

      {/* Card */}
      <div
        className="perspective cursor-pointer"
        onClick={!flipped ? handleFlip : undefined}
      >
        <div className="bg-surface border border-border rounded-2xl min-h-[320px] flex flex-col items-center justify-center p-8 transition-all">
          {!flipped ? (
            <div className="text-center space-y-4">
              <p className="text-3xl font-semibold">{currentCard.front.text}</p>
              {currentCard.front.reading && (
                <p className="text-lg text-muted">{currentCard.front.reading}</p>
              )}
              <p className="text-xs text-muted mt-8">Press Space to reveal</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-lg text-muted">{currentCard.front.text}</p>
              <div className="border-t border-border w-16 mx-auto" />
              <p className="text-2xl font-semibold">{currentCard.back.text}</p>
              {currentCard.back.reading && (
                <p className="text-base text-muted">{currentCard.back.reading}</p>
              )}
              {currentCard.back.examples && currentCard.back.examples.length > 0 && (
                <div className="mt-4 space-y-1">
                  {currentCard.back.examples.map((ex, i) => (
                    <p key={i} className="text-sm text-muted/70">{ex}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating Buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-3">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRate(r.value)}
              className={`py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${r.color} text-background`}
            >
              <span className="block">{r.label}</span>
              <span className="block text-xs opacity-70 mt-0.5">{r.key}</span>
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted/50">
        Space/Enter to flip &middot; 1-4 to rate
      </p>
    </div>
  );
}
