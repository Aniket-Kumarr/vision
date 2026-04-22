'use client';

import { useEffect, useRef, useState } from 'react';

interface StepControllerProps {
  currentStep: number;
  totalSteps: number;
  narration: string;
  isAnimating: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onBack: () => void;
}

export default function StepController({
  currentStep,
  totalSteps,
  narration,
  isAnimating,
  isLastStep,
  onNext,
  onBack,
}: StepControllerProps) {
  const [displayedNarration, setDisplayedNarration] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevNarrationRef = useRef('');

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

  const canAdvance = !isAnimating && !isTyping;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      {/* Gradient fade up */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,10,0.92) 60%, transparent)',
        }}
      />

      <div className="relative px-6 pb-6 pt-16 flex items-end justify-between gap-4 max-w-[1400px] mx-auto">
        {/* Step counter */}
        <div
          className="flex-shrink-0 pointer-events-auto"
          style={{ fontFamily: "'Caveat', cursive", color: 'rgba(245,240,232,0.5)', fontSize: 18 }}
        >
          Step {currentStep} of {totalSteps}
        </div>

        {/* Narration text */}
        <div className="flex-1 text-center px-4">
          <p
            className={`${isTyping ? 'typewriter-cursor' : ''}`}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 17,
              lineHeight: 1.6,
              color: 'rgba(245,240,232,0.92)',
              maxWidth: 680,
              margin: '0 auto',
              textShadow: '0 1px 8px rgba(0,0,0,0.8)',
              minHeight: 28,
            }}
          >
            {displayedNarration}
          </p>
        </div>

        {/* Next / Start Over button */}
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className={`flex-shrink-0 pointer-events-auto px-6 py-2.5 rounded-lg text-sm tracking-widest uppercase transition-all duration-300 ${
            canAdvance
              ? 'next-ready cursor-pointer'
              : 'opacity-30 cursor-not-allowed'
          }`}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            color: canAdvance ? '#F5F0E8' : 'rgba(245,240,232,0.4)',
            border: `1px solid ${canAdvance ? 'rgba(245,240,232,0.5)' : 'rgba(245,240,232,0.1)'}`,
            background: 'transparent',
            letterSpacing: '0.12em',
          }}
        >
          {isLastStep ? 'Start Over' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
