'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ChalkCanvasHandle } from '@/components/ChalkCanvas';
import { Blueprint, Drawing } from '@/lib/types';

const ChalkCanvas = dynamic(() => import('@/components/ChalkCanvas'), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeResult {
  blueprint: Blueprint;
  flawedStepId: number;
  correctNarration: string;
  explanation: string;
}

type PagePhase =
  | 'idle'         // form visible, no challenge loaded
  | 'loading'      // fetching from API
  | 'playing'      // lesson is animating step by step
  | 'guessing'     // all steps done, awaiting user pick
  | 'revealed';    // answer shown

type Subject = 'math' | 'physics';

const STREAK_KEY = 'visua_ai_challenge_streak';

// ---------------------------------------------------------------------------
// Confetti burst (pure SVG, no external lib)
// ---------------------------------------------------------------------------

function ConfettiBurst() {
  const colors = ['#FFE066', '#7FD97F', '#6BBFFF', '#FF9ECD', '#FFB347', '#7FFFEF', '#FF7F7F'];
  const dots: { cx: number; cy: number; r: number; color: string; tx: number; ty: number }[] = [];
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * 2 * Math.PI;
    const dist = 40 + Math.random() * 50;
    dots.push({
      cx: 50,
      cy: 50,
      r: 3 + Math.random() * 4,
      color: colors[i % colors.length],
      tx: Math.round(Math.cos(angle) * dist),
      ty: Math.round(Math.sin(angle) * dist),
    });
  }
  return (
    <svg
      viewBox="0 0 100 100"
      width={120}
      height={120}
      aria-hidden
      style={{ display: 'block', margin: '0 auto' }}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.color}>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to={`${d.tx} ${d.ty}`}
            dur="0.5s"
            fill="freeze"
            begin="0s"
          />
          <animate
            attributeName="opacity"
            from="1"
            to="0"
            dur="0.9s"
            begin="0.2s"
            fill="freeze"
          />
        </circle>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ChallengePage() {
  const router = useRouter();

  // Form state
  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState<Subject>('math');

  // Challenge data (hidden from user until reveal)
  const [challengeData, setChallengeData] = useState<ChallengeResult | null>(null);

  // Playback state
  const [phase, setPhase] = useState<PagePhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentNarration, setCurrentNarration] = useState('');

  // Guessing state
  const [wrongGuesses, setWrongGuesses] = useState<number[]>([]);
  const [guessedCorrect, setGuessedCorrect] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);

  // Score
  const [streak, setStreak] = useState(0);

  // Canvas ref
  const canvasRef = useRef<ChalkCanvasHandle>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load streak from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STREAK_KEY);
      if (saved) setStreak(parseInt(saved, 10) || 0);
    } catch {
      // ignore
    }
  }, []);

  const saveStreak = useCallback((val: number) => {
    setStreak(val);
    try {
      localStorage.setItem(STREAK_KEY, String(val));
    } catch {
      // ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Drawing playback helpers (mirrors canvas/page.tsx)
  // ---------------------------------------------------------------------------

  const playDrawings = useCallback((drawings: Drawing[], onAllComplete: () => void) => {
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
  }, []);

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

  // When a blueprint is ready and phase transitions to 'playing', start step 0
  useEffect(() => {
    if (phase === 'playing' && challengeData) {
      setCurrentStepIndex(0);
      playStep(0, challengeData.blueprint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, challengeData]);

  // Cleanup on unmount
  useEffect(() => {
    const timerRef = restartTimerRef;
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Generate a flawed lesson
  // ---------------------------------------------------------------------------

  const handleGenerate = useCallback(async () => {
    const trimmed = concept.trim();
    if (!trimmed || phase === 'loading') return;

    setPhase('loading');
    setErrorMsg('');
    setChallengeData(null);
    setWrongGuesses([]);
    setGuessedCorrect(false);
    setAutoRevealed(false);
    setCurrentStepIndex(0);
    setCurrentNarration('');
    canvasRef.current?.reset();

    try {
      const res = await fetch('/api/generate-flawed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: trimmed, subject }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as ChallengeResult;
      if (!data.blueprint || typeof data.flawedStepId !== 'number') {
        throw new Error('Invalid response from server.');
      }
      setChallengeData(data);
      setPhase('playing');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg);
      setPhase('idle');
    }
  }, [concept, subject, phase]);

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const handleNext = useCallback(() => {
    if (!challengeData || isAnimating) return;
    const bp = challengeData.blueprint;
    const isLast = currentStepIndex >= bp.steps.length - 1;
    if (isLast) {
      // All steps done — switch to guessing phase
      setPhase('guessing');
      return;
    }
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    playStep(nextIdx, bp);
  }, [challengeData, currentStepIndex, isAnimating, playStep]);

  // ---------------------------------------------------------------------------
  // Guessing
  // ---------------------------------------------------------------------------

  const handleGuess = useCallback(
    (stepId: number) => {
      if (!challengeData || phase !== 'guessing') return;
      if (wrongGuesses.includes(stepId)) return; // already tried

      if (stepId === challengeData.flawedStepId) {
        setGuessedCorrect(true);
        setPhase('revealed');
        saveStreak(streak + 1);
      } else {
        const newWrong = [...wrongGuesses, stepId];
        setWrongGuesses(newWrong);
        if (newWrong.length >= 2) {
          // Auto-reveal after 2 wrong guesses
          setAutoRevealed(true);
          setPhase('revealed');
          saveStreak(0);
        }
      }
    },
    [challengeData, phase, wrongGuesses, streak, saveStreak],
  );

  // ---------------------------------------------------------------------------
  // Reset / play again
  // ---------------------------------------------------------------------------

  const handlePlayAgain = useCallback(() => {
    setChallengeData(null);
    setPhase('idle');
    setErrorMsg('');
    setWrongGuesses([]);
    setGuessedCorrect(false);
    setAutoRevealed(false);
    setCurrentStepIndex(0);
    setCurrentNarration('');
    canvasRef.current?.reset();
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const CANVAS_W = 800;
  const CANVAS_H = 600;

  const steps = challengeData?.blueprint.steps ?? [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'rgba(245,240,232,0.92)',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top nav */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(245,240,232,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => router.push('/welcome')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(245,240,232,0.45)',
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: '0.04em',
            }}
          >
            ← Home
          </button>
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
              fontWeight: 600,
              color: 'rgba(245,240,232,0.85)',
            }}
          >
            Find the Flaw
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 18,
            color: streak > 0 ? '#FFE066' : 'rgba(245,240,232,0.38)',
          }}
          aria-label={`Current streak: ${streak}`}
        >
          {streak > 0 ? `🔥 ${streak} in a row` : 'No streak yet'}
        </div>
      </header>

      {/* Idle / form phase */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            gap: 32,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 540 }}>
            <p
              style={{
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(245,240,232,0.4)',
                marginBottom: 12,
              }}
            >
              Challenge mode
            </p>
            <h1
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: 14,
              }}
            >
              Can you spot the mistake?
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'rgba(245,240,232,0.6)',
              }}
            >
              AI will generate a lesson with one subtle error hidden inside. Watch it all the way
              through, then click the step you think contains the flaw.
            </p>
          </div>

          {errorMsg && (
            <p
              role="alert"
              style={{
                color: '#FF7F7F',
                fontSize: 14,
                textAlign: 'center',
                maxWidth: 440,
              }}
            >
              {errorMsg}
            </p>
          )}

          <div
            style={{
              width: '100%',
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Subject toggle */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['math', 'physics'] as Subject[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: `1px solid ${subject === s ? 'rgba(245,240,232,0.5)' : 'rgba(245,240,232,0.12)'}`,
                    background: subject === s ? 'rgba(245,240,232,0.06)' : 'transparent',
                    color: subject === s ? 'rgba(245,240,232,0.92)' : 'rgba(245,240,232,0.38)',
                    cursor: 'pointer',
                    fontSize: 14,
                    letterSpacing: '0.06em',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Concept input */}
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              disabled={phase === 'loading'}
              placeholder={
                subject === 'physics'
                  ? "e.g. Newton's second law"
                  : 'e.g. Pythagorean theorem'
              }
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid rgba(245,240,232,0.2)',
                background: 'rgba(245,240,232,0.04)',
                color: 'rgba(245,240,232,0.92)',
                fontSize: 16,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-label="Concept to challenge"
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={phase === 'loading' || !concept.trim()}
              style={{
                padding: '14px 0',
                borderRadius: 10,
                border: '1px solid rgba(245,240,232,0.35)',
                background:
                  phase === 'loading' || !concept.trim()
                    ? 'rgba(245,240,232,0.04)'
                    : 'rgba(245,240,232,0.08)',
                color:
                  phase === 'loading' || !concept.trim()
                    ? 'rgba(245,240,232,0.3)'
                    : 'rgba(245,240,232,0.92)',
                cursor: phase === 'loading' || !concept.trim() ? 'not-allowed' : 'pointer',
                fontSize: 15,
                letterSpacing: '0.08em',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {phase === 'loading' ? 'Generating challenge…' : 'Generate challenge →'}
            </button>
          </div>
        </div>
      )}

      {/* Playing / guessing / revealed phase — show the canvas */}
      {(phase === 'playing' || phase === 'guessing' || phase === 'revealed') && challengeData && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Canvas area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px 8px',
            }}
          >
            <div
              style={{
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                width: '100%',
                maxHeight: 'calc(100vh - 320px)',
                maxWidth: `calc((100vh - 320px) * ${CANVAS_W} / ${CANVAS_H})`,
              }}
            >
              <ChalkCanvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
            </div>
          </div>

          {/* Bottom panel */}
          <div
            style={{
              background: 'linear-gradient(to top, rgba(10,10,10,0.97) 70%, transparent)',
              padding: '16px 24px 32px',
            }}
          >
            {/* Playing phase: narration + next button */}
            {phase === 'playing' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  maxWidth: 700,
                  margin: '0 auto',
                }}
              >
                <p
                  aria-live="polite"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 16,
                    lineHeight: 1.55,
                    color: 'rgba(245,240,232,0.88)',
                    textAlign: 'center',
                    minHeight: 28,
                  }}
                >
                  {currentNarration}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: 16,
                      color: 'rgba(245,240,232,0.4)',
                    }}
                  >
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isAnimating}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: '1px solid rgba(245,240,232,0.35)',
                      background: 'transparent',
                      color: isAnimating ? 'rgba(245,240,232,0.3)' : 'rgba(245,240,232,0.88)',
                      cursor: isAnimating ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {currentStepIndex >= steps.length - 1 ? 'Done — Pick the flaw →' : 'Next →'}
                  </button>
                </div>
              </div>
            )}

            {/* Guessing phase */}
            {phase === 'guessing' && (
              <div
                style={{
                  maxWidth: 700,
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 22,
                    textAlign: 'center',
                    color: '#FFE066',
                  }}
                >
                  Which step had the flaw? Click a step to guess.
                </p>
                {wrongGuesses.length > 0 && (
                  <p
                    role="alert"
                    style={{
                      textAlign: 'center',
                      color: '#FF7F7F',
                      fontSize: 14,
                    }}
                  >
                    Not quite — try another.{' '}
                    {wrongGuesses.length === 1 ? '1 guess remaining.' : ''}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    justifyContent: 'center',
                  }}
                >
                  {steps.map((step) => {
                    const alreadyWrong = wrongGuesses.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => handleGuess(step.id)}
                        disabled={alreadyWrong}
                        style={{
                          padding: '12px 20px',
                          borderRadius: 10,
                          border: `1px solid ${alreadyWrong ? 'rgba(255,127,127,0.3)' : 'rgba(245,240,232,0.25)'}`,
                          background: alreadyWrong ? 'rgba(255,127,127,0.06)' : 'rgba(245,240,232,0.04)',
                          color: alreadyWrong ? 'rgba(255,127,127,0.5)' : 'rgba(245,240,232,0.88)',
                          cursor: alreadyWrong ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontFamily: "'Inter', sans-serif",
                          textDecoration: alreadyWrong ? 'line-through' : 'none',
                          transition: 'all 0.15s',
                          maxWidth: 280,
                          textAlign: 'left',
                        }}
                        aria-label={`Step ${step.id}: ${step.narration.slice(0, 60)}`}
                      >
                        <span
                          style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: 16,
                            display: 'block',
                            marginBottom: 4,
                            color: alreadyWrong ? 'rgba(255,127,127,0.5)' : '#FFE066',
                          }}
                        >
                          Step {step.id}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: alreadyWrong
                              ? 'rgba(255,127,127,0.4)'
                              : 'rgba(245,240,232,0.55)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {step.narration.slice(0, 80)}
                          {step.narration.length > 80 ? '…' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Revealed phase */}
            {phase === 'revealed' && (
              <div
                style={{
                  maxWidth: 700,
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  alignItems: 'center',
                }}
              >
                {guessedCorrect ? (
                  <>
                    <ConfettiBurst />
                    <p
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: 30,
                        color: '#7FD97F',
                        textAlign: 'center',
                      }}
                    >
                      Nailed it! 🎉
                    </p>
                    <p
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: 20,
                        color: '#FFE066',
                        textAlign: 'center',
                      }}
                    >
                      Streak: {streak}
                    </p>
                  </>
                ) : autoRevealed ? (
                  <p
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: 26,
                      color: '#FF7F7F',
                      textAlign: 'center',
                    }}
                  >
                    The flaw was in Step {challengeData.flawedStepId}
                  </p>
                ) : null}

                <div
                  style={{
                    background: 'rgba(245,240,232,0.04)',
                    border: '1px solid rgba(245,240,232,0.12)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    width: '100%',
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(245,240,232,0.38)',
                      marginBottom: 10,
                    }}
                  >
                    The flaw — Step {challengeData.flawedStepId}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#FF7F7F',
                      lineHeight: 1.55,
                      marginBottom: 12,
                      fontStyle: 'italic',
                    }}
                  >
                    {challengeData.explanation}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(245,240,232,0.38)',
                      marginBottom: 8,
                    }}
                  >
                    Corrected narration
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#7FD97F',
                      lineHeight: 1.55,
                    }}
                  >
                    {challengeData.correctNarration}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlayAgain}
                  style={{
                    padding: '12px 32px',
                    borderRadius: 10,
                    border: '1px solid rgba(245,240,232,0.3)',
                    background: 'rgba(245,240,232,0.06)',
                    color: 'rgba(245,240,232,0.88)',
                    cursor: 'pointer',
                    fontSize: 14,
                    letterSpacing: '0.08em',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Try another challenge →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
