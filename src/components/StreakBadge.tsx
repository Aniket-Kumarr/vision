'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStreak } from '@/lib/lessonHistory';

interface StreakBadgeProps {
  className?: string;
}

export default function StreakBadge({ className = '' }: StreakBadgeProps) {
  const router = useRouter();
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

  return (
    <button
      type="button"
      onClick={() => router.push('/history')}
      className={className}
      title="View your lesson history and streak"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: 'rgba(245,240,232,0.08)',
        border: '1px solid rgba(245,240,232,0.18)',
        color: 'rgba(245,240,232,0.85)',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.15)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.08)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.18)';
      }}
    >
      <span style={{ fontSize: '18px' }}>🔥</span>
      <span>{streak}</span>
    </button>
  );
}
