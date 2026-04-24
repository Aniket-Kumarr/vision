'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Scene3D } from '@/lib/types3d';
import { VISUA_AI_CONCEPT_KEY, VISUA_AI_SUBJECT_KEY, VISUA_AI_TOPIC_KEY } from '@/lib/auth';

// SSR safety: three.js touches `window` at import time; we MUST load the
// renderer only on the client.
const ChalkBoard3D = dynamic(() => import('@/components/ChalkBoard3D'), {
  ssr: false,
  loading: () => null,
});

/** Client wait budget: 3D scene generation is small, but Anthropic can be slow. */
const GENERATE_TIMEOUT_MS = 120_000;

type PageState = 'loading' | 'error' | 'ready';

export default function Canvas3DPage() {
  return (
    <Suspense fallback={<LoadingFrame topic="" />}>
      <Canvas3DInner />
    </Suspense>
  );
}

function Canvas3DInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [scene, setScene] = useState<Scene3D | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [concept, setConcept] = useState('');

  useEffect(() => {
    // Concept resolution order: ?c=... query string > localStorage fallback.
    const queryConcept = searchParams.get('c');
    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem(VISUA_AI_CONCEPT_KEY) ?? localStorage.getItem('vision_concept')
        : null;
    const resolved = (queryConcept ?? stored ?? '').trim();

    if (!resolved) {
      router.replace('/welcome');
      return;
    }
    setConcept(resolved);

    const subject = (() => {
      try {
        const s = localStorage.getItem(VISUA_AI_SUBJECT_KEY);
        return s === 'math' || s === 'physics' ? s : 'math';
      } catch {
        return 'math';
      }
    })();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    fetch('/api/generate-3d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: resolved, subject }),
      signal: controller.signal,
    })
      .then(async (r) => {
        const text = await r.text();
        let parsed: { scene?: Scene3D; error?: string } = {};
        try {
          parsed = JSON.parse(text) as typeof parsed;
        } catch {
          throw new Error('Could not read the 3D scene from the server. Please try again.');
        }
        if (!r.ok || parsed.error) {
          throw new Error(parsed.error || `Request failed (${r.status})`);
        }
        if (!parsed.scene) throw new Error('Empty scene from server.');
        return parsed.scene;
      })
      .then((s) => {
        setScene(s);
        setPageState('ready');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') {
          setErrorMsg('The 3D scene is still generating. Please try again in a moment.');
        } else {
          setErrorMsg(err.message || 'Something went wrong generating the 3D scene.');
        }
        setPageState('error');
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchParams, router]);

  const handleHome = useCallback(() => {
    router.push('/welcome');
  }, [router]);

  const topic = (() => {
    try {
      return localStorage.getItem(VISUA_AI_TOPIC_KEY) ?? concept;
    } catch {
      return concept;
    }
  })();

  if (pageState === 'loading') return <LoadingFrame topic={topic} />;

  if (pageState === 'error') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#F5F0E8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '2rem',
          fontFamily: "'Caveat', cursive",
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 22, color: 'rgba(255,200,200,0.9)', maxWidth: 460, lineHeight: 1.35 }}>
          {errorMsg}
        </p>
        <button
          type="button"
          onClick={handleHome}
          style={{
            background: 'rgba(245,240,232,0.08)',
            border: '1px solid rgba(245,240,232,0.22)',
            color: '#F5F0E8',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            letterSpacing: '0.04em',
          }}
        >
          ← Back to welcome
        </button>
      </main>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      {scene ? <ChalkBoard3D scene={scene} /> : null}

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.82) 60%, transparent)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
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
            Visua AI · 3D
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
            {scene?.title ?? 'Untitled scene'}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleHome}
          style={{
            pointerEvents: 'auto',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 13,
            color: 'rgba(245,240,232,0.55)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          ← Ask something else
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: 'rgba(245,240,232,0.35)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Drag to orbit · Scroll to zoom
        </p>
      </div>
    </div>
  );
}

function LoadingFrame({ topic }: { topic: string }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '2rem',
        fontFamily: "'Caveat', cursive",
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 28, color: 'rgba(245,240,232,0.9)', letterSpacing: '0.02em' }}>
        Building your 3D scene…
      </p>
      {topic ? (
        <p style={{ fontSize: 20, color: 'rgba(245,240,232,0.5)', letterSpacing: '0.03em' }}>
          {topic}
        </p>
      ) : null}
    </main>
  );
}
