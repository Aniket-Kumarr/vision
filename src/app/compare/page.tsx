'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ChalkCanvasHandle } from '@/components/ChalkCanvas';
import { Blueprint, Drawing } from '@/lib/types';

const ChalkCanvas = dynamic(() => import('@/components/ChalkCanvas'), { ssr: false });

// Mini canvas logical dimensions
const MINI_W = 320;
const MINI_H = 240;

interface ModelResult {
  model: string;
  blueprint: Blueprint | null;
  latencyMs: number;
  error?: string;
}

type CompareState = 'idle' | 'loading' | 'done';

/** Human-readable display name for a model ID. */
function modelLabel(model: string): string {
  if (model.includes('opus')) return 'Claude Opus';
  if (model.includes('sonnet')) return 'Claude Sonnet';
  if (model.includes('haiku')) return 'Claude Haiku';
  return model;
}

/** Auto-playing mini chalkboard: plays through all drawings sequentially on mount. */
function MiniChalkboard({ blueprint }: { blueprint: Blueprint }) {
  const canvasRef = useRef<ChalkCanvasHandle>(null);
  // Track whether the animation loop has been started so we don't double-start.
  const startedRef = useRef(false);

  const playAll = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.reset();

    const allDrawings: Drawing[] = blueprint.steps.flatMap((s) => s.drawings);
    if (allDrawings.length === 0) return;

    let idx = 0;
    let cancelled = false;

    const playNext = () => {
      if (cancelled || idx >= allDrawings.length) return;
      const drawing = allDrawings[idx];
      idx++;
      canvasRef.current?.playDrawing(drawing, () => {
        if (!cancelled) playNext();
      });
    };

    playNext();

    return () => {
      cancelled = true;
    };
  }, [blueprint]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Small delay so the canvas is fully mounted and sized before first draw.
    const t = setTimeout(() => {
      playAll();
    }, 120);
    return () => clearTimeout(t);
  }, [playAll]);

  return (
    <div
      style={{
        width: MINI_W,
        height: MINI_H,
        background: '#1a1a1a',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ChalkCanvas ref={canvasRef} width={MINI_W} height={MINI_H} />
    </div>
  );
}

interface PanelProps {
  result: ModelResult;
  onPick: (result: ModelResult) => void;
}

function ModelPanel({ result, onPick }: PanelProps) {
  const label = modelLabel(result.model);
  const latSec = (result.latencyMs / 1000).toFixed(1);

  return (
    <div
      style={{
        background: 'rgba(245,240,232,0.04)',
        border: '1px solid rgba(245,240,232,0.1)',
        borderRadius: 12,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            color: 'rgba(245,240,232,0.9)',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: 'rgba(245,240,232,0.4)',
            letterSpacing: '0.04em',
          }}
        >
          {result.latencyMs > 0 ? `${latSec}s` : '—'}
        </span>
      </div>

      {/* Canvas or error */}
      {result.blueprint ? (
        <MiniChalkboard blueprint={result.blueprint} />
      ) : (
        <div
          style={{
            width: MINI_W,
            height: MINI_H,
            background: 'rgba(255,100,100,0.06)',
            border: '1px dashed rgba(255,100,100,0.3)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: 'rgba(255,180,180,0.8)',
              lineHeight: 1.5,
            }}
          >
            couldn&apos;t generate
            {result.error ? ` — ${result.error}` : ''}
          </p>
        </div>
      )}

      {/* Blueprint title */}
      {result.blueprint && (
        <p
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 15,
            color: 'rgba(245,240,232,0.55)',
            textAlign: 'center',
            maxWidth: MINI_W,
          }}
        >
          {result.blueprint.title}
        </p>
      )}

      {/* Pick button */}
      <button
        type="button"
        disabled={!result.blueprint}
        onClick={() => result.blueprint && onPick(result)}
        style={{
          marginTop: 4,
          padding: '8px 20px',
          background: result.blueprint ? 'rgba(127,217,127,0.15)' : 'rgba(245,240,232,0.04)',
          border: `1px solid ${result.blueprint ? 'rgba(127,217,127,0.4)' : 'rgba(245,240,232,0.1)'}`,
          borderRadius: 8,
          color: result.blueprint ? 'rgba(127,217,127,0.9)' : 'rgba(245,240,232,0.25)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          letterSpacing: '0.04em',
          cursor: result.blueprint ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        Pick this one
      </button>
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();

  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState<'math' | 'physics'>('math');
  const [state, setState] = useState<CompareState>('idle');
  const [results, setResults] = useState<ModelResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCompare = async () => {
    const trimmed = concept.trim();
    if (!trimmed) return;
    setState('loading');
    setResults([]);
    setErrorMsg('');

    try {
      const res = await fetch('/api/generate-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: trimmed, subject }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Server error ${res.status}`);
      }

      const data = (await res.json()) as { results: ModelResult[] };
      setResults(data.results);
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg);
      setState('idle');
    }
  };

  const handlePick = (result: ModelResult) => {
    if (!result.blueprint) return;
    try {
      localStorage.setItem(
        'visua_ai_favorite_lesson',
        JSON.stringify({ model: result.model, blueprint: result.blueprint }),
      );
      // Stash blueprint for canvas replay (same pattern as chat → canvas).
      // Keyed by concept so /canvas reads it only for this lesson.
      const storedConcept = concept.trim();
      import('@/lib/lessonHistory').then(({ setReplay }) => {
        setReplay(storedConcept, result.blueprint!);
        // Also set the concept key so canvas page doesn't redirect away
        try {
          localStorage.setItem('visua_ai_concept', storedConcept);
          localStorage.setItem('visua_ai_subject', subject);
        } catch {
          // ignore
        }
        router.push('/canvas');
      });
    } catch {
      // fallback: navigate anyway
      router.push('/canvas');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'rgba(245,240,232,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px 80px',
        gap: 40,
      }}
    >
      {/* Nav */}
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.45)',
          }}
        >
          Visua AI
        </span>
        <button
          type="button"
          onClick={() => router.push('/welcome')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(245,240,232,0.4)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          ← Back
        </button>
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', maxWidth: 600 }}>
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 42,
            fontWeight: 700,
            color: 'rgba(245,240,232,0.95)',
            marginBottom: 10,
          }}
        >
          Compare Models
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            color: 'rgba(245,240,232,0.45)',
            lineHeight: 1.6,
          }}
        >
          Generate the same concept with Opus, Sonnet, and Haiku in parallel — then pick your
          favorite lesson.
        </p>
      </div>

      {/* Input form */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Subject toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['math', 'physics'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                border: `1px solid ${subject === s ? 'rgba(245,240,232,0.45)' : 'rgba(245,240,232,0.12)'}`,
                background: subject === s ? 'rgba(245,240,232,0.08)' : 'transparent',
                color:
                  subject === s ? 'rgba(245,240,232,0.9)' : 'rgba(245,240,232,0.4)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Concept input */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && concept.trim() && state !== 'loading') handleCompare();
            }}
            placeholder="e.g. Pythagorean theorem"
            disabled={state === 'loading'}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(245,240,232,0.18)',
              background: 'rgba(245,240,232,0.05)',
              color: 'rgba(245,240,232,0.9)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleCompare}
            disabled={!concept.trim() || state === 'loading'}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid rgba(245,240,232,0.25)',
              background:
                !concept.trim() || state === 'loading'
                  ? 'rgba(245,240,232,0.04)'
                  : 'rgba(245,240,232,0.1)',
              color:
                !concept.trim() || state === 'loading'
                  ? 'rgba(245,240,232,0.25)'
                  : 'rgba(245,240,232,0.9)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              cursor:
                !concept.trim() || state === 'loading' ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {state === 'loading' ? 'Generating…' : 'Compare'}
          </button>
        </div>

        {errorMsg && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: 'rgba(255,180,180,0.85)',
            }}
          >
            {errorMsg}
          </p>
        )}
      </div>

      {/* Loading indicator */}
      {state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
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
          </div>
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 20,
              color: 'rgba(245,240,232,0.55)',
            }}
          >
            Running 3 models in parallel…
          </p>
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
              40% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Results grid */}
      {state === 'done' && results.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 1100,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 24,
          }}
        >
          {results.map((result) => (
            <ModelPanel key={result.model} result={result} onPick={handlePick} />
          ))}
        </div>
      )}
    </div>
  );
}
