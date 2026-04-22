'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChalkParticles from '@/components/ChalkParticles';
import SuggestionChips from '@/components/SuggestionChips';

const STORAGE_KEY = 'vision_concept';

export default function ChatPage() {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const submit = (concept: string) => {
    const trimmed = concept.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    router.push('/canvas');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit(value);
  };

  const handleChipSelect = (chip: string) => {
    setValue(chip);
    submit(chip);
  };

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Floating chalk dust */}
      <ChalkParticles count={35} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full max-w-2xl">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              color: '#F5F0E8',
              letterSpacing: '-0.01em',
              lineHeight: 1,
              textShadow: '0 0 40px rgba(245,240,232,0.15)',
            }}
          >
            vision
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 14,
              color: 'rgba(245,240,232,0.4)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Visual math intuition, one step at a time
          </p>
        </div>

        {/* Input */}
        <div className="w-full relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to understand?"
            aria-label="Enter a math concept to visualize"
            className="w-full outline-none transition-all duration-300"
            style={{
              background: 'rgba(245,240,232,0.04)',
              border: `1px solid ${isFocused ? 'rgba(245,240,232,0.35)' : 'rgba(245,240,232,0.12)'}`,
              borderRadius: 12,
              padding: '18px 24px',
              fontSize: 18,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              color: '#F5F0E8',
              caretColor: '#FFE066',
              boxShadow: isFocused
                ? '0 0 0 1px rgba(245,240,232,0.1), 0 4px 40px rgba(0,0,0,0.4)'
                : '0 4px 24px rgba(0,0,0,0.3)',
            }}
            autoComplete="off"
            spellCheck={false}
          />
          {/* Enter hint */}
          {value.trim().length > 0 && (
            <button
              onClick={() => submit(value)}
              aria-label="Submit concept"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#F5F0E8',
                border: '1px solid rgba(245,240,232,0.3)',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Enter <span aria-hidden="true">↵</span>
            </button>
          )}
        </div>

        {/* Suggestion chips */}
        <div className="w-full">
          <SuggestionChips onSelect={handleChipSelect} />
        </div>

        {/* Footer hint */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 12,
            color: 'rgba(245,240,232,0.2)',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Powered by Claude · Drawn in real time · No videos
        </p>
      </div>

      {/* Subtle vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </main>
  );
}
