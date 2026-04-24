'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ChalkCanvasHandle } from '@/components/ChalkCanvas';
import StepController from '@/components/StepController';
import { Blueprint, Drawing } from '@/lib/types';
import { decodeBlueprint } from '@/lib/shareLink';

const ChalkCanvas = dynamic(() => import('@/components/ChalkCanvas'), { ssr: false });

const CANVAS_W = 800;
const CANVAS_H = 600;

export default function SharedLessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const canvasRef = useRef<ChalkCanvasHandle>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [status, setStatus] = useState<'decoding' | 'error' | 'playing'>('decoding');
  const [errorMsg, setErrorMsg] = useState('');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentNarration, setCurrentNarration] = useState('');

  // Decode blueprint from slug
  useEffect(() => {
    if (!slug) {
      setErrorMsg('No lesson data found in this URL.');
      setStatus('error');
      return;
    }

    let cancelled = false;
    decodeBlueprint(slug).then((bp) => {
      if (cancelled) return;
      if (!bp) {
        setErrorMsg('This link appears to be invalid or corrupted. Please ask the sender for a new link.');
        setStatus('error');
        return;
      }
      setBlueprint(bp);
      setStatus('playing');
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Play a sequence of drawings one after another
  const playDrawings = useCallback(
    (drawings: Drawing[], onAllComplete: () => void) => {
      if (!canvasRef.current || drawings.length === 0) {
        onAllComplete();
        return;
      }

      let idx = 0;
      let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
      let finished = false;

      const playNext = () => {
        if (finished) return;
        if (idx >= drawings.length) {
          finished = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          onAllComplete();
          return;
        }

        const drawing = drawings[idx];
        idx++;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(
          () => {
            playNext();
          },
          Math.max(1200, (drawing.duration || 1200) + 1400),
        );
        canvasRef.current?.playDrawing(drawing, () => {
          if (fallbackTimer) clearTimeout(fallbackTimer);
          playNext();
        });
      };

      playNext();
    },
    [],
  );

  const playStep = useCallback(
    (stepIndex: number, bp: Blueprint) => {
      if (stepIndex >= bp.steps.length) return;
      const step = bp.steps[stepIndex];

      setIsAnimating(true);
      setCurrentNarration('');

      playDrawings(step.drawings, () => {
        setIsAnimating(false);
        setCurrentNarration(step.narration);
      });
    },
    [playDrawings],
  );

  // Start step 0 when blueprint is ready
  useEffect(() => {
    if (status === 'playing' && blueprint) {
      playStep(0, blueprint);
    }
  }, [status, blueprint, playStep]);

  const handleRestart = useCallback(() => {
    if (!blueprint) return;
    canvasRef.current?.reset();
    setCurrentStepIndex(0);
    setCurrentNarration('');
    setIsAnimating(false);
    if (restartTimerRef.current !== null) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      playStep(0, blueprint);
    }, 50);
  }, [blueprint, playStep]);

  const handleNext = useCallback(() => {
    if (!blueprint || isAnimating) return;
    const isLast = currentStepIndex >= blueprint.steps.length - 1;
    if (isLast) return;
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    playStep(nextIdx, blueprint);
  }, [blueprint, currentStepIndex, isAnimating, playStep]);

  const handlePrevStep = useCallback(() => {
    if (!blueprint || isAnimating || currentStepIndex <= 0) return;
    const prevIdx = currentStepIndex - 1;
    canvasRef.current?.reset();
    setCurrentStepIndex(prevIdx);
    setCurrentNarration('');
    playStep(prevIdx, blueprint);
  }, [blueprint, isAnimating, currentStepIndex, playStep]);

  // Keyboard shortcuts
  const handleNextRef = useRef(handleNext);
  const handleRestartRef = useRef(handleRestart);
  handleNextRef.current = handleNext;
  handleRestartRef.current = handleRestart;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true;
      if (isTyping) return;

      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextRef.current();
      }
      if (e.key === 'r' || e.key === 'R') handleRestartRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current !== null) clearTimeout(restartTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ background: '#0a0a0a' }}
    >
      {/* Decoding state */}
      {status === 'decoding' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-6">
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 26,
              color: 'rgba(245,240,232,0.8)',
              letterSpacing: '0.02em',
            }}
          >
            Loading shared lesson…
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 px-6">
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 24,
              color: 'rgba(255, 200, 200, 0.95)',
              textAlign: 'center',
              maxWidth: 420,
              lineHeight: 1.35,
            }}
          >
            {errorMsg}
          </p>
          <button
            onClick={() => router.push('/welcome')}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(245,240,232,0.85)',
              background: 'rgba(245,240,232,0.08)',
              border: '1px solid rgba(245,240,232,0.18)',
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            ← Back to Home
          </button>
        </div>
      )}

      {/* Chalkboard canvas */}
      {status === 'playing' && (
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
      {status === 'playing' && blueprint && (
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
          {/* Gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 60%, transparent)',
            }}
          />
          {/* Title area */}
          <div className="relative flex items-center gap-3">
            <div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: 'rgba(245,240,232,0.45)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                Visua AI · Shared lesson
              </p>
              <h2
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
            </div>
          </div>
          {/* Banner: Shared lesson — title · Open in Visua AI */}
          <div className="relative flex items-center gap-3">
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: 'rgba(245,240,232,0.5)',
                letterSpacing: '0.02em',
              }}
            >
              Shared lesson —{' '}
              <span style={{ color: 'rgba(245,240,232,0.75)' }}>{blueprint.title}</span>
              {' · '}
            </span>
            <a
              href="/welcome"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: 'rgba(245,240,232,0.85)',
                background: 'rgba(245,240,232,0.08)',
                border: '1px solid rgba(245,240,232,0.18)',
                borderRadius: 8,
                padding: '5px 12px',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              Open in Visua AI
            </a>
          </div>
        </div>
      )}

      {/* Step controller */}
      {status === 'playing' && blueprint && (
        <StepController
          currentStep={currentStepIndex + 1}
          totalSteps={blueprint.steps.length}
          narration={currentNarration}
          isAnimating={isAnimating}
          isLastStep={currentStepIndex >= blueprint.steps.length - 1}
          finalLabel="Done"
          onNext={handleNext}
          onBack={handlePrevStep}
          onAskFollowUp={async () => {}}
          isFollowUpPending={false}
          followUpError={null}
        />
      )}

      {/* Noise overlay */}
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
