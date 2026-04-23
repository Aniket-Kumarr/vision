'use client';

import { useEffect, useRef, useState } from 'react';
import { loadDesmos, type DesmosCalculator } from '@/lib/desmos';

interface DesmosPanelProps {
  expressions: string[];
  open: boolean;
  onClose: () => void;
}

export default function DesmosPanel({ expressions, open, onClose }: DesmosPanelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<DesmosCalculator | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    if (!mountRef.current) return;

    let cancelled = false;
    setStatus('loading');

    loadDesmos()
      .then((Desmos) => {
        if (cancelled || !mountRef.current) return;
        const calc = Desmos.GraphingCalculator(mountRef.current, {
          expressions: true,
          keypad: false,
          settingsMenu: false,
          zoomButtons: true,
          border: false,
          lockViewport: false,
        });
        calcRef.current = calc;
        expressions.forEach((latex, i) => {
          try {
            calc.setExpression({ id: `e${i}`, latex });
          } catch {
            // swallow malformed expressions; better to show a clean calc than an error toast
          }
        });
        setStatus('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setErrorMsg(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (calcRef.current) {
        try {
          calcRef.current.destroy();
        } catch {
          // ignore
        }
        calcRef.current = null;
      }
    };
  }, [open, expressions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: 'min(92vw, 1100px)',
          height: 'min(88vh, 720px)',
          background: '#111',
          borderRadius: 14,
          border: '1px solid rgba(245,240,232,0.12)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(245,240,232,0.08)' }}
        >
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
              color: 'rgba(245,240,232,0.9)',
              letterSpacing: '0.02em',
            }}
          >
            Play with it — {expressions.length} expression{expressions.length === 1 ? '' : 's'}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: '1px solid rgba(245,240,232,0.18)',
              color: 'rgba(245,240,232,0.8)',
              borderRadius: 8,
              padding: '4px 10px',
              cursor: 'pointer',
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
            }}
          >
            close
          </button>
        </div>

        <div ref={mountRef} style={{ flex: 1, background: '#fff' }} />

        {status === 'loading' && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'rgba(17,17,17,0.85)',
              color: 'rgba(245,240,232,0.8)',
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
            }}
          >
            loading Desmos…
          </div>
        )}
        {status === 'error' && (
          <div
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
            style={{
              background: 'rgba(17,17,17,0.92)',
              color: 'rgba(245,240,232,0.85)',
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
              lineHeight: 1.4,
            }}
          >
            Couldn&apos;t load the interactive graph.
            <br />
            <span style={{ fontSize: 16, opacity: 0.7 }}>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
