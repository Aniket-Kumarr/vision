'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ChalkCanvasHandle } from '@/components/ChalkCanvas';
import StepController from '@/components/StepController';
import ChalkParticles from '@/components/ChalkParticles';
import { Blueprint, Drawing } from '@/lib/types';
import { VISUA_AI_CONCEPT_KEY, VISUA_AI_TOPIC_KEY } from '@/lib/auth';
import { addLesson, takeReplay } from '@/lib/lessonHistory';

const ChalkCanvas = dynamic(() => import('@/components/ChalkCanvas'), { ssr: false });

type PageState = 'loading' | 'error' | 'playing';

/** Client wait budget: blueprint generation can take well over 15s. */
const GENERATE_TIMEOUT_MS = 180_000;

const VOICE_PREF_KEY = 'visua_ai_voice_on';
const VOICE_ID_KEY = 'visua_ai_voice_id';
const DEFAULT_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice — "Clear, Engaging Educator"

interface ElevenVoice {
  id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
}

/**
 * Fetch ElevenLabs MP3 narration via our /api/narrate proxy and play it.
 * - Aborts the previous request and stops playback on text change, mute, or unmount.
 * - Pauses when the tab is hidden, resumes on return.
 */
function useNarration(text: string, enabled: boolean, voiceId: string) {
  useEffect(() => {
    if (!enabled || !text) return;
    if (typeof window === 'undefined') return;

    const ctrl = new AbortController();
    const audio = new Audio();
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `narrate ${res.status}`);
        }
        if (cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;
        await audio.play();
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.error('[Visua AI] narrate failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
      audio.pause();
      audio.src = '';
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [text, enabled, voiceId]);

  // Pause when tab hidden, resume on return.
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const audios = () => Array.from(document.querySelectorAll('audio'));
    const onVisibility = () => {
      if (document.hidden) audios().forEach((a) => a.pause());
      // Don't auto-resume — playback may have ended; let the next narration trigger naturally.
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled]);
}

interface VoiceControlProps {
  enabled: boolean;
  onToggle: () => void;
  voices: ElevenVoice[];
  voicesLoading: boolean;
  voicesError: string | null;
  selectedVoiceId: string;
  onSelectVoiceId: (id: string) => void;
}

function VoiceControl({
  enabled,
  onToggle,
  voices,
  voicesLoading,
  voicesError,
  selectedVoiceId,
  onSelectVoiceId,
}: VoiceControlProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const sorted = useMemo(() => {
    return [...voices].sort((a, b) => a.name.localeCompare(b.name));
  }, [voices]);

  const toggleLabel = enabled ? 'Mute narration' : 'Unmute narration';

  return (
    <div ref={wrapRef} className="voice-control">
      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleLabel}
        aria-pressed={enabled}
        title={toggleLabel}
        className={`voice-toggle ${enabled ? 'is-on' : 'is-off'}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M11 5 L6 9 H2 V15 H6 L11 19 Z" />
          {enabled ? (
            <>
              <path d="M15.5 8.5 Q18 12 15.5 15.5" />
              <path d="M18.5 6 Q22.5 12 18.5 18" />
            </>
          ) : (
            <>
              <path d="M16 9 L22 15" />
              <path d="M22 9 L16 15" />
            </>
          )}
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose narration voice"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Choose voice"
        className={`voice-picker-btn ${open ? 'is-open' : ''}`}
      >
        <svg
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M2 2 L6 6 L10 2" />
        </svg>
      </button>
      {open && (
        <div className="voice-popover" role="listbox" aria-label="Narration voice">
          <p className="voice-popover-header">
            ElevenLabs voice
            <span className="voice-popover-sub">Pick one — your choice persists.</span>
          </p>
          <div className="voice-popover-list">
            {voicesLoading ? (
              <p className="voice-popover-empty">Loading voices…</p>
            ) : voicesError ? (
              <p className="voice-popover-empty voice-popover-error">{voicesError}</p>
            ) : sorted.length === 0 ? (
              <p className="voice-popover-empty">No voices found in your ElevenLabs account.</p>
            ) : (
              sorted.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  aria-selected={selectedVoiceId === v.id}
                  className={`voice-option ${selectedVoiceId === v.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSelectVoiceId(v.id);
                    setOpen(false);
                  }}
                >
                  <span className="voice-option-name">{v.name}</span>
                  <span className="voice-option-meta">
                    {v.category ? <span className="voice-option-badge">{v.category}</span> : null}
                    {selectedVoiceId === v.id ? (
                      <span className="voice-option-check" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CanvasPage() {
  const router = useRouter();
  const canvasRef = useRef<ChalkCanvasHandle>(null);

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentNarration, setCurrentNarration] = useState('');
  const [concept, setConcept] = useState('');
  const [topicLabel, setTopicLabel] = useState('');
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_VOICE_ID);
  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const voicesFetchedRef = useRef(false);

  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate persisted voice preferences from localStorage after mount (SSR-safe).
  useEffect(() => {
    try {
      setVoiceOn(localStorage.getItem(VOICE_PREF_KEY) === '1');
      const savedId = localStorage.getItem(VOICE_ID_KEY);
      if (savedId) setVoiceId(savedId);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(VOICE_PREF_KEY, next ? '1' : '0');
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const handleSelectVoiceId = useCallback((id: string) => {
    setVoiceId(id);
    try {
      localStorage.setItem(VOICE_ID_KEY, id);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Lazy-load the ElevenLabs voice list once — when the user enables narration
  // OR opens the picker for the first time. Avoids a wasteful API call for users
  // who never turn voice on.
  const ensureVoicesLoaded = useCallback(() => {
    if (voicesFetchedRef.current) return;
    voicesFetchedRef.current = true;
    setVoicesLoading(true);
    setVoicesError(null);
    fetch('/api/voices')
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `voices ${r.status}`);
        }
        return (await r.json()) as { voices: ElevenVoice[] };
      })
      .then(({ voices: vs }) => setVoices(vs))
      .catch((err: Error) => {
        console.error('[Visua AI] voices fetch failed:', err);
        setVoicesError(err.message || 'Could not load voices.');
        voicesFetchedRef.current = false; // allow retry next open
      })
      .finally(() => setVoicesLoading(false));
  }, []);

  useEffect(() => {
    if (voiceOn) ensureVoicesLoaded();
  }, [voiceOn, ensureVoicesLoaded]);

  const onToggleVoice = useCallback(() => {
    ensureVoicesLoaded();
    toggleVoice();
  }, [ensureVoicesLoaded, toggleVoice]);

  // Stream each step's narration through ElevenLabs when voice is enabled.
  useNarration(currentNarration, voiceOn, voiceId);

  // Load concept from localStorage, then fetch blueprint
  useEffect(() => {
    const saved =
      localStorage.getItem(VISUA_AI_CONCEPT_KEY) ??
      localStorage.getItem('mathcanvas_concept') ??
      localStorage.getItem('vision_concept');
    if (!saved) {
      router.replace('/chat');
      return;
    }
    const topic =
      localStorage.getItem(VISUA_AI_TOPIC_KEY) ??
      localStorage.getItem('mathcanvas_topic') ??
      (saved.length > 56 ? `${saved.slice(0, 54)}…` : saved);
    setConcept(saved);
    setTopicLabel(topic);
    setPageState('loading');
    setErrorMsg('');

    // If the user re-opened a past lesson from history, /chat will have
    // stashed the cached blueprint here — replay it instantly with no API call.
    const cached = takeReplay();
    if (cached && Array.isArray(cached.steps) && cached.steps.length > 0) {
      setBlueprint(cached);
      setPageState('playing');
      return;
    }

    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: saved }),
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          let msg = `Request failed (${r.status})`;
          try {
            const j = JSON.parse(text) as { error?: string };
            if (typeof j?.error === 'string' && j.error.trim()) msg = j.error.trim();
          } catch {
            if (text.trim()) msg = text.trim().slice(0, 240);
          }
          throw new Error(msg);
        }

        // Read the body as a stream so we receive chunks as they arrive from
        // the Anthropic API, rather than waiting for the full response.
        const reader = r.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }
        // Flush any remaining bytes in the decoder.
        accumulated += decoder.decode();

        // Strip any accidental markdown fences Claude may have emitted.
        const cleaned = accumulated
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        // The fixture/fallback paths return { blueprint: ... } JSON directly;
        // the streaming path returns raw blueprint JSON.  Handle both.
        let data: unknown;
        try {
          data = JSON.parse(cleaned);
        } catch {
          throw new Error('Could not read the lesson from the server. Please go back and start again.');
        }

        // If the server wrapped the blueprint (fixture/fallback path), unwrap it.
        if (
          data !== null &&
          typeof data === 'object' &&
          'blueprint' in (data as Record<string, unknown>)
        ) {
          return data as { blueprint: Blueprint; error?: string };
        }

        // Streaming path: the raw JSON IS the blueprint.
        return { blueprint: data as Blueprint };
      })
      .then((data) => {
        if (!data) return;
        if ('error' in data && data.error) throw new Error(data.error as string);
        const bp = data.blueprint as Blueprint;
        if (!bp || !Array.isArray(bp.steps) || bp.steps.length === 0) {
          throw new Error('Received an empty blueprint. Please try again.');
        }
        setBlueprint(bp);
        setPageState('playing');
        // Persist the freshly-generated lesson so it appears in /chat history
        // and can be replayed later without another Anthropic call.
        addLesson({ topic, concept: saved, blueprint: bp });
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setErrorMsg(
            'Hang tight. Your visualization is still generating. This can take a few minutes, so stay on this screen.',
          );
          setPageState('error');
          return;
        }
        console.error(err);
        setErrorMsg(err.message || 'Something went wrong while loading your lesson.');
        setPageState('error');
      })
      .finally(() => {
        clearTimeout(requestTimeout);
      });

    return () => {
      clearTimeout(requestTimeout);
      controller.abort();
    };
  }, [router]);

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
            console.warn('Drawing timeout fallback hit, moving to next drawing.');
            playNext();
          },
          Math.max(1200, (drawing.duration || 1200) + 1400)
        );
        canvasRef.current?.playDrawing(drawing, () => {
          if (fallbackTimer) clearTimeout(fallbackTimer);
          playNext();
        });
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
        // Drawings done; now type narration
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
    if (isLast) {
      router.push('/chat');
      return;
    }
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    playStep(nextIdx, blueprint);
  }, [blueprint, currentStepIndex, isAnimating, playStep, router]);

  const handleHome = useCallback(() => router.push('/chat'), [router]);

  const handlePrevStep = useCallback(() => {
    if (!blueprint || isAnimating || currentStepIndex <= 0) return;
    const prevIdx = currentStepIndex - 1;
    canvasRef.current?.reset();
    setCurrentStepIndex(prevIdx);
    setCurrentNarration('');
    playStep(prevIdx, blueprint);
  }, [blueprint, isAnimating, currentStepIndex, playStep]);

  const [isFollowUpPending, setIsFollowUpPending] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const handleAskFollowUp = useCallback(
    async (question: string) => {
      if (!blueprint || isFollowUpPending || isAnimating) return;
      setIsFollowUpPending(true);
      setFollowUpError(null);
      try {
        const r = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint, question }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `follow-up ${r.status}`);
        }
        const data = (await r.json()) as { drawings: Drawing[]; narration: string };
        if (!Array.isArray(data.drawings) || typeof data.narration !== 'string') {
          throw new Error('Invalid follow-up response shape.');
        }
        // Play new drawings on top of the existing canvas (no reset), then
        // surface the narration so it types out and ElevenLabs speaks it.
        setIsAnimating(true);
        setCurrentNarration('');
        playDrawings(data.drawings, () => {
          setIsAnimating(false);
          setCurrentNarration(data.narration);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Follow-up failed.';
        console.error('[Visua AI] follow-up failed:', err);
        setFollowUpError(message);
      } finally {
        setIsFollowUpPending(false);
      }
    },
    [blueprint, isAnimating, isFollowUpPending, playDrawings],
  );

  // Cancel any pending restart timer on unmount
  useEffect(() => {
    return () => {
      if (restartTimerRef.current !== null) clearTimeout(restartTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts: use refs to avoid re-registering on every state change
  const handleNextRef = useRef(handleNext);
  const handleRestartRef = useRef(handleRestart);
  handleNextRef.current = handleNext;
  handleRestartRef.current = handleRestart;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/chat');
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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 px-6">
          <ChalkParticles count={20} />
          <LoadingDots />
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <p
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 28,
                color: 'rgba(245,240,232,0.92)',
                letterSpacing: '0.02em',
                lineHeight: 1.35,
                marginBottom: 10,
              }}
            >
              Hang tight. Your visualization is generating.
            </p>
            <p
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 22,
                color: 'rgba(245,240,232,0.55)',
                letterSpacing: '0.03em',
              }}
            >
              {topicLabel || concept || 'your topic'}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {pageState === 'error' && (
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
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: 'rgba(245,240,232,0.38)',
              letterSpacing: '0.06em',
            }}
          >
            Press Escape to return to your topic.
          </p>
        </div>
      )}

      {/* Chalkboard canvas: fills screen, maintains 800x600 aspect ratio */}
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
          <div className="relative flex items-center gap-3">
            <VoiceControl
              enabled={voiceOn}
              onToggle={onToggleVoice}
              voices={voices}
              voicesLoading={voicesLoading}
              voicesError={voicesError}
              selectedVoiceId={voiceId}
              onSelectVoiceId={handleSelectVoiceId}
            />
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
                Visua AI
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
          <button
            onClick={handleHome}
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
            ← Ask something else
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
          finalLabel="Try Another"
          onNext={handleNext}
          onBack={handlePrevStep}
          onAskFollowUp={handleAskFollowUp}
          isFollowUpPending={isFollowUpPending}
          followUpError={followUpError}
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
