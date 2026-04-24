'use client';

import { useState } from 'react';
import Link from 'next/link';
import DesmosAISliders from '@/components/DesmosAISliders';
import {
  EXAMPLE_SPECS,
  validateDesmosSpec,
  type DesmosSpec,
} from '@/lib/desmosSpec';

type Subject = 'math' | 'physics';

/**
 * Desmos Lab: a minimal workspace for the AI-driven animated-slider feature.
 * Users type a concept, hit Generate, and get a playable interactive graph.
 * Hardcoded examples let the page work even if the API is unreachable.
 */
export default function DesmosLabPage() {
  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState<Subject>('math');
  const [spec, setSpec] = useState<DesmosSpec | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const generate = async () => {
    const trimmed = concept.trim();
    if (!trimmed) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/desmos-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: trimmed, subject }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { spec: unknown };
      // Second line of defense: never trust the server payload untouched.
      const validated = validateDesmosSpec(data.spec);
      setSpec(validated);
      setStatus('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const loadExample = (key: string) => {
    const example = EXAMPLE_SPECS[key];
    if (!example) return;
    setSpec(example);
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0c0c0c',
        color: '#F5F0E8',
        padding: '24px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <header
        style={{
          width: '100%',
          maxWidth: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            margin: 0,
            color: '#F5F0E8',
          }}
        >
          Desmos Lab
        </h1>
        <Link
          href="/welcome"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            color: 'rgba(245,240,232,0.7)',
            textDecoration: 'none',
            border: '1px solid rgba(245,240,232,0.2)',
            borderRadius: 8,
            padding: '6px 14px',
          }}
        >
          ← back to welcome
        </Link>
      </header>

      <p
        style={{
          maxWidth: 1100,
          width: '100%',
          margin: '0 0 16px',
          color: 'rgba(245,240,232,0.65)',
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        Type a math or physics concept. The AI designs an interactive Desmos graph with 1-3 meaningful
        sliders and an animation plan. Hit Play to watch the sliders move, or scrub the timeline
        manually.
      </p>

      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <input
          type="text"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="e.g. sine wave, projectile, pendulum, exponential decay…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') generate();
          }}
          style={{
            flex: '1 1 280px',
            minWidth: 240,
            background: '#1a1a1a',
            border: '1px solid rgba(245,240,232,0.18)',
            color: '#F5F0E8',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 16,
          }}
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as Subject)}
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(245,240,232,0.18)',
            color: '#F5F0E8',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 15,
          }}
        >
          <option value="math">Math</option>
          <option value="physics">Physics</option>
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={status === 'loading' || !concept.trim()}
          style={{
            background: '#FFB347',
            border: 'none',
            color: '#111',
            fontWeight: 600,
            padding: '10px 22px',
            borderRadius: 8,
            cursor: status === 'loading' || !concept.trim() ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' || !concept.trim() ? 0.6 : 1,
            fontSize: 15,
          }}
        >
          {status === 'loading' ? 'Generating…' : 'Generate'}
        </button>
        <select
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              loadExample(v);
              e.currentTarget.value = '';
            }
          }}
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(245,240,232,0.18)',
            color: '#F5F0E8',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 15,
          }}
        >
          <option value="">Try an example…</option>
          <option value="sine-wave">Sine wave</option>
          <option value="projectile">Projectile motion</option>
          <option value="pendulum">Pendulum</option>
        </select>
      </div>

      {status === 'error' && (
        <div
          role="alert"
          style={{
            width: '100%',
            maxWidth: 1100,
            background: 'rgba(255,127,127,0.12)',
            border: '1px solid rgba(255,127,127,0.4)',
            color: '#ffb4b4',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          {errorMsg || 'Something went wrong. Try an example from the dropdown.'}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 1100, height: 560 }}>
        {spec ? (
          <DesmosAISliders spec={spec} />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed rgba(245,240,232,0.2)',
              borderRadius: 14,
              color: 'rgba(245,240,232,0.5)',
              fontFamily: "'Caveat', cursive",
              fontSize: 24,
              textAlign: 'center',
              padding: 20,
            }}
          >
            Generate a concept or pick an example to see the interactive graph.
          </div>
        )}
      </div>
    </main>
  );
}
