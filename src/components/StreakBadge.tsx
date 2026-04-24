'use client';

import { useEffect, useState } from 'react';
import { getCurrentStreak } from '@/lib/lessonHistory';

interface StreakBadgeProps {
  className?: string;
}

export default function StreakBadge({ className = '' }: StreakBadgeProps) {
  const [streak, setStreak] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const currentStreak = getCurrentStreak();
      setStreak(currentStreak);
    } catch {
      setStreak(0);
    }
    setHydrated(true);
  }, []);

  if (!hydrated || streak === 0) return null;

  // Purely a notification indicator — no click, no navigation. Renders as a
  // non-interactive div so it can't steal focus or pointer events from the
  // page underneath.
  return (
    <div
      className={className}
      role="status"
      aria-label={`Current streak: ${streak} day${streak === 1 ? '' : 's'}`}
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 50,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: 'rgba(20,22,28,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(245,240,232,0.22)',
        color: 'rgba(245,240,232,0.92)',
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: 600,
        pointerEvents: 'none',
        userSelect: 'none',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
      }}
    >
      <span style={{ fontSize: '18px' }}>🔥</span>
      <span>{streak}</span>
    </div>
  );
}
