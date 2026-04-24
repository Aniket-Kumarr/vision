'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { listDue, review, type DeckCard, type ReviewQuality } from '@/lib/quizDeck';

export default function ReviewPage() {
  const router = useRouter();
  const [dueCards, setDueCards] = useState<DeckCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSR-safe mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load due cards on mount and after each review
  const reloadDue = useCallback(() => {
    setDueCards(listDue());
    setCurrentIndex(0);
    setFlipped(false);
  }, []);

  useEffect(() => {
    if (mounted) reloadDue();
  }, [mounted, reloadDue]);

  // Keyboard: space to flip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setFlipped((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRate = useCallback(
    (quality: ReviewQuality) => {
      const card = dueCards[currentIndex];
      if (!card) return;
      review(card.id, quality);
      // Move to next card or reload (picks up any newly-due cards)
      const nextIdx = currentIndex + 1;
      if (nextIdx < dueCards.length) {
        setCurrentIndex(nextIdx);
        setFlipped(false);
      } else {
        reloadDue();
      }
    },
    [dueCards, currentIndex, reloadDue],
  );

  if (!mounted) {
    return null;
  }

  const card = dueCards[currentIndex] ?? null;
  const remaining = dueCards.length - currentIndex;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', sans-serif",
        color: 'rgba(245,240,232,0.85)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.9) 60%, transparent)',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.45)',
          }}
        >
          Visua AI
        </span>
        <button
          onClick={() => router.push('/welcome')}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(245,240,232,0.45)',
            fontSize: 13,
            letterSpacing: '0.04em',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ← Back
        </button>
      </header>

      {/* Due count */}
      {card && (
        <p
          style={{
            fontSize: 13,
            color: 'rgba(245,240,232,0.45)',
            marginBottom: 24,
            letterSpacing: '0.04em',
          }}
        >
          {remaining} card{remaining !== 1 ? 's' : ''} due
        </p>
      )}

      {/* Card or empty state */}
      {!card ? (
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 28,
              color: 'rgba(245,240,232,0.85)',
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            No cards due.
          </p>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(245,240,232,0.45)',
              lineHeight: 1.5,
            }}
          >
            Finish a lesson to build your deck. New flashcards are added automatically when you complete a lesson.
          </p>
          <button
            onClick={() => router.push('/welcome')}
            style={{
              marginTop: 32,
              background: 'rgba(245,240,232,0.08)',
              border: '1px solid rgba(245,240,232,0.18)',
              borderRadius: 10,
              padding: '10px 24px',
              color: 'rgba(245,240,232,0.7)',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.04em',
            }}
          >
            Go to lessons
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 560 }}>
          {/* Source label */}
          <p
            style={{
              fontSize: 11,
              color: 'rgba(245,240,232,0.35)',
              textAlign: 'center',
              marginBottom: 8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {card.sourceConceptTitle}
          </p>

          {/* Flashcard */}
          <div
            onClick={() => setFlipped((v) => !v)}
            style={{
              background: 'rgba(245,240,232,0.05)',
              border: '1px solid rgba(245,240,232,0.14)',
              borderRadius: 16,
              padding: '40px 32px',
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              textAlign: 'center',
              transition: 'background 0.15s',
            }}
          >
            {!flipped ? (
              <>
                <p
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 26,
                    lineHeight: 1.35,
                    color: 'rgba(245,240,232,0.9)',
                    marginBottom: 20,
                  }}
                >
                  {card.front}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(245,240,232,0.3)',
                    letterSpacing: '0.08em',
                  }}
                >
                  tap or press Space to reveal
                </p>
              </>
            ) : (
              <p
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 22,
                  lineHeight: 1.45,
                  color: 'rgba(255,224,102,0.9)',
                }}
              >
                {card.back}
              </p>
            )}
          </div>

          {/* Rating buttons — only visible after flip */}
          {flipped && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 20,
                justifyContent: 'center',
              }}
            >
              {(
                [
                  { label: 'Again', quality: 0, color: 'rgba(255,127,127,0.85)' },
                  { label: 'Hard', quality: 3, color: 'rgba(255,179,71,0.85)' },
                  { label: 'Good', quality: 4, color: 'rgba(127,217,127,0.85)' },
                  { label: 'Easy', quality: 5, color: 'rgba(107,191,255,0.85)' },
                ] as const
              ).map(({ label, quality, color }) => (
                <button
                  key={label}
                  onClick={() => handleRate(quality as ReviewQuality)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: 'rgba(245,240,232,0.06)',
                    border: `1px solid ${color}`,
                    borderRadius: 10,
                    color,
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                    transition: 'background 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
