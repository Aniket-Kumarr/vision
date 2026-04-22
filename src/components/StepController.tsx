'use client';

import { useEffect, useRef, useState } from 'react';

interface StepControllerProps {
  /** 1-based index of the currently visible step. */
  currentStep: number;
  /** Total number of steps; must be >= 1. */
  totalSteps: number;
  narration: string;
  isAnimating: boolean;
  isLastStep: boolean;
  finalLabel?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function StepController({
  currentStep,
  totalSteps,
  narration,
  isAnimating,
  isLastStep,
  finalLabel = 'Start Over',
  onNext,
  onBack,
}: StepControllerProps) {
  const [displayedNarration, setDisplayedNarration] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevNarrationRef = useRef('');

  // Guard: totalSteps must be a positive integer; currentStep must stay in [1, totalSteps].
  const safeTotal = Math.max(1, Math.floor(totalSteps));
  const safeStep = Math.min(Math.max(1, Math.floor(currentStep)), safeTotal);

  useEffect(() => {
    if (narration === prevNarrationRef.current) return;
    prevNarrationRef.current = narration;

    if (typeRef.current) {
      clearInterval(typeRef.current);
    }

    setDisplayedNarration('');
    setIsTyping(true);

    let i = 0;
    typeRef.current = setInterval(() => {
      i++;
      setDisplayedNarration(narration.slice(0, i));
      if (i >= narration.length) {
        clearInterval(typeRef.current!);
        setIsTyping(false);
        typeRef.current = null;
      }
    }, 28);

    return () => {
      if (typeRef.current) clearInterval(typeRef.current);
    };
  }, [narration]);

  // Keyboard navigation: ArrowRight / ArrowLeft advance / go back when idle.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is inside a text input so we don't hijack typing.
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' && canAdvance) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' && canBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, isTyping, safeStep, safeTotal]);

  const canAdvance = !isAnimating && !isTyping;
  // Back is disabled on the first step or while something is in-flight.
  const canBack = !isAnimating && !isTyping && safeStep > 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      {/* Gradient fade up */}
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(10,10,10,0.92)_60%,transparent)]"
      />

      <div className="relative px-6 pb-6 pt-16 flex items-end justify-between gap-4 max-w-[1400px] mx-auto">
        {/* Step counter */}
        <div
          className="flex-shrink-0 pointer-events-auto font-['Caveat',cursive] text-[rgba(245,240,232,0.5)] text-[18px]"
          aria-label={`Step ${safeStep} of ${safeTotal}`}
        >
          Step {safeStep} of {safeTotal}
        </div>

        {/* Narration text: aria-live so screen readers announce each update */}
        <div className="flex-1 text-center px-4">
          <p
            aria-live="polite"
            aria-atomic="true"
            className={`font-['Inter',sans-serif] font-light text-[17px] leading-relaxed text-[rgba(245,240,232,0.92)] max-w-[680px] mx-auto [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] min-h-[28px]${isTyping ? ' typewriter-cursor' : ''}`}
          >
            {displayedNarration}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex-shrink-0 flex items-center gap-3 pointer-events-auto">
          {/* Back button: hidden on step 1 to avoid a dead affordance */}
          {safeStep > 1 && (
            <button
              onClick={onBack}
              disabled={!canBack}
              aria-label="Go to previous step"
              aria-disabled={!canBack}
              className={`px-5 py-2.5 rounded-lg text-sm font-['Inter',sans-serif] tracking-[0.12em] uppercase transition-all duration-300 border ${
                canBack
                  ? 'cursor-pointer text-[rgba(245,240,232,0.7)] border-[rgba(245,240,232,0.25)] hover:border-[rgba(245,240,232,0.45)]'
                  : 'opacity-30 cursor-not-allowed text-[rgba(245,240,232,0.4)] border-[rgba(245,240,232,0.1)]'
              } bg-transparent`}
            >
              ← Back
            </button>
          )}

          {/* Next / Start Over button */}
          <button
            onClick={onNext}
            disabled={!canAdvance}
            aria-label={isLastStep ? 'Start over from step 1' : `Go to step ${safeStep + 1}`}
            aria-disabled={!canAdvance}
            className={`px-6 py-2.5 rounded-lg text-sm font-['Inter',sans-serif] tracking-[0.12em] uppercase transition-all duration-300 border ${
              canAdvance
                ? 'next-ready cursor-pointer text-[#F5F0E8] border-[rgba(245,240,232,0.5)]'
                : 'opacity-30 cursor-not-allowed text-[rgba(245,240,232,0.4)] border-[rgba(245,240,232,0.1)]'
            } bg-transparent`}
          >
            {isLastStep ? finalLabel : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
