'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ChalkCanvasHandle } from '@/components/ChalkCanvas';
import StepController from '@/components/StepController';
import ChalkParticles from '@/components/ChalkParticles';
import { Blueprint, Drawing } from '@/lib/types';

const ChalkCanvas = dynamic(() => import('@/components/ChalkCanvas'), { ssr: false });

type PageState = 'loading' | 'error' | 'playing';

export default function CanvasPage() {
  const router = useRouter();
  const canvasRef = useRef<ChalkCanvasHandle>(null);

  const [concept, setConcept] = useState('');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentNarration, setCurrentNarration] = useState('');

  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load concept from localStorage, then fetch blueprint
  useEffect(() => {
    const saved = localStorage.getItem('vision_concept');
    if (!saved) {
      router.replace('/');
      return;
    }
    setConcept(saved);

    const controller = new AbortController();

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: saved }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const bp = data.blueprint as Blueprint;
        if (!bp || !Array.isArray(bp.steps) || bp.steps.length === 0) {
          throw new Error('Received an empty blueprint. Please try again.');
        }
        setBlueprint(bp);
        setPageState('playing');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error(err);
        setErrorMsg(err.message || 'Something went wrong. Please try again.');
        setPageState('error');
      });

    return () => controller.abort();
  }, [router]);

  // Play a sequence of drawings one after another
  const playDrawings = useCallback(
    (drawings: Drawing[], onAllComplete: () => void) => {
      if (!canvasRef.current || drawings.length === 0) {
        onAllComplete();
        return;
      }

      let idx = 0;

      const playNext = () => {
        if (idx >= drawings.length) {
          onAllComplete();
          return;
        }

        const drawing = drawings[idx];
        idx++;
        canvasRef.current?.playDrawing(drawing, playNext);
      };

      playNext();
    },
    []
  );

  // Play a step by index
  const playStep = useCallback(
    (stepIndex: number, bp: Blueprint) => {
      if (stepIndex >= bp.steps.length) return;
      const step = bp.steps[stepIndex];

      setIsAnimating(true);
      setCurrentNarration('');

      playDrawings(step.drawings, () => {
        // Drawings done — now type narration
        setIsAnimating(false);
        setCurrentNarration(step.narration);
      });
    },
    [playDrawings]
  );

  // Start step 1 as soon as blueprint is ready
  useEffect(() => {
    if (pageState === 'playing' && blueprint) {
      playStep(0, blueprint);
    }
  }, [pageState, blueprint, playStep]);

  const handleRestart = useCallback(() => {
    if (!blueprint) return;
    canvasRef.current?.reset();
    setCurrentStepIndex(0);
    setCurrentNarration('');
    setIsAnimating(false);
    // A single rAF-length delay lets the canvas clear before the first draw frame.
    if (restartTimerRef.current !== null) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      playStep(0, blueprint);
    }, 50);
  }, [blueprint, playStep]);

  const handleNext = useCallback(() => {
    if (!blueprint || isAnimating) return;
    const isLast = currentStepIndex >= blueprint.steps.length - 1;
    if (isLast) { handleRestart(); return; }
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    playStep(nextIdx, blueprint);
  }, [blueprint, currentStepIndex, isAnimating, playStep, handleRestart]);

  const handleBack = useCallback(() => router.push('/'), [router]);

  // Cancel any pending restart timer on unmount
  useEffect(() => {
    return () => {
      if (restartTimerRef.current !== null) clearTimeout(restartTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts — use refs to avoid re-registering on every state change
  const handleNextRef = useRef(handleNext);
  const handleRestartRef = useRef(handleRestart);
  handleNextRef.current = handleNext;
  handleRestartRef.current = handleRestart;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/');
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextRef.current();
      }
      if (e.key === 'r' || e.key === 'R') handleRestartRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  // ---- CANVAS SIZE ----
  // We want 800x600 logical canvas, scaled to fill screen
  const CANVAS_W = 800;
  const CANVAS_H = 600;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ background: '#0a0a0a' }}
    >
      {/* Loading state */}
      {pageState === 'loading' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6">
          <ChalkParticles count={20} />
          <LoadingDots />
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
              color: 'rgba(245,240,232,0.5)',
              letterSpacing: '0.05em',
            }}
          >
            thinking...
          </p>
        </div>
      )}

      {/* Error state */}
      {pageState === 'error' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-6">
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 24,
              color: '#FF7F7F',
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </p>
          <button
            onClick={handleBack}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 14,
              color: 'rgba(245,240,232,0.6)',
              border: '1px solid rgba(245,240,232,0.2)',
              padding: '8px 20px',
              borderRadius: 8,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            ← Try another concept
          </button>
        </div>
      )}

      {/* Chalkboard canvas — fills screen, maintains 800x600 aspect ratio */}
      {pageState === 'playing' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ padding: '64px 16px 108px' }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                width: '100%',
                maxHeight: '100%',
                maxWidth: `calc((100vh - 172px) * ${CANVAS_W} / ${CANVAS_H})`,
              }}
            >
              <ChalkCanvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      {pageState === 'playing' && blueprint && (
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
          {/* Gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 60%, transparent)',
            }}
          />
          <h2
            className="relative"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 24,
              fontWeight: 600,
              color: 'rgba(245,240,232,0.85)',
              letterSpacing: '0.02em',
            }}
          >
            {blueprint.title}
          </h2>
          <button
            onClick={handleBack}
            className="relative hover:opacity-100 transition-opacity"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 13,
              color: 'rgba(245,240,232,0.45)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            ← New concept
          </button>
        </div>
      )}

      {/* Step controller / narration / next button */}
      {pageState === 'playing' && blueprint && (
        <StepController
          currentStep={currentStepIndex + 1}
          totalSteps={blueprint.steps.length}
          narration={currentNarration}
          isAnimating={isAnimating}
          isLastStep={currentStepIndex >= blueprint.steps.length - 1}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {/* Subtle noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(245,240,232,0.5)',
            animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
