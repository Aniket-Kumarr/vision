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
      // Floats at bottom-left regardless of where the parent mounts it — the
      // old inline placement in the top nav was cramped. Keep it subtle and
      // out of the main reading flow.
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
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(20,22,28,0.9)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(20,22,28,0.72)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.22)';
      }}
    >
      <span style={{ fontSize: '18px' }}>🔥</span>
      <span>{streak}</span>
    </button>
  );
}
