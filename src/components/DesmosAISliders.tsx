'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDesmos, type DesmosCalculator } from '@/lib/desmos';
import { sampleSliderValues, type DesmosSpec } from '@/lib/desmosSpec';

interface DesmosAISlidersProps {
  spec: DesmosSpec;
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Renders a DesmosSpec as a live graph with Play / Pause / Reset controls and a
 * scrub bar. The animation linearly interpolates slider values between
 * keyframes and pushes them to Desmos via setExpression so the plot updates in
 * real time.
 */
export default function DesmosAISliders({ spec }: DesmosAISlidersProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<DesmosCalculator | null>(null);
  const rafRef = useRef<number | null>(null);
  // Epoch + offset model: startTime is the wall-clock time from which the
  // current play segment started; offsetMs is how far into the timeline we
  // were when play started. progress = offsetMs + (now - startTime).
  const startTimeRef = useRef<number | null>(null);
  const offsetMsRef = useRef(0);
  const specRef = useRef(spec);

  const [status, setStatus] = useState<LoadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  // Keep a ref current so the rAF loop can see the latest spec on prop swap
  // without having to be torn down and rebuilt.
  useEffect(() => {
    specRef.current = spec;
  }, [spec]);

  /**
   * Push a { slider-name: value } map to the calculator by reissuing each
   * slider expression as `name=value`. Swallows malformed latex so a single
   * bad slider doesn't kill the whole animation.
   */
  const applyValues = useCallback((values: Record<string, number>) => {
    const calc = calcRef.current;
    if (!calc) return;
    for (const slider of specRef.current.sliders) {
      const v = values[slider.name];
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      try {
        calc.setExpression({
          id: slider.id,
          latex: `${slider.name}=${v.toFixed(4)}`,
          sliderBounds: { min: slider.min, max: slider.max, step: slider.step },
        });
      } catch {
        // ignore
      }
    }
  }, []);

  /**
   * Mount/unmount the calculator and wire up the initial spec. We rebuild on
   * every spec change so expressions / viewport stay in sync.
   */
  useEffect(() => {
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

        // Seed sliders at their initial values first so expressions that
        // reference them have something defined when they parse.
        for (const slider of spec.sliders) {
          try {
            calc.setExpression({
              id: slider.id,
              latex: `${slider.name}=${slider.initial}`,
              sliderBounds: { min: slider.min, max: slider.max, step: slider.step },
            });
          } catch {
            // ignore
          }
        }
        // Then the plot expressions.
        for (const e of spec.expressions) {
          try {
            calc.setExpression({
              id: e.id,
              latex: e.latex,
              color: e.color,
              hidden: e.hidden,
            });
          } catch {
            // ignore
          }
        }
        if (spec.viewport) {
          try {
            calc.setMathBounds({
              left: spec.viewport.xmin,
              right: spec.viewport.xmax,
              bottom: spec.viewport.ymin,
              top: spec.viewport.ymax,
            });
          } catch {
            // ignore
          }
        }
        // Apply t=0 so sliders snap to the first keyframe.
        applyValues(sampleSliderValues(spec.animation, 0));
        setProgress(0);
        offsetMsRef.current = 0;
        startTimeRef.current = null;
        setPlaying(false);
        setStatus('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setErrorMsg(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (calcRef.current) {
        try {
          calcRef.current.destroy();
        } catch {
          // ignore
        }
        calcRef.current = null;
      }
    };
  }, [spec, applyValues]);

  /**
   * rAF tick. Recomputes progress from elapsed wall time and applies sampled
   * slider values. When progress hits 1, the animation loops back to 0.
   */
  const tick = useCallback(() => {
    const duration = specRef.current.animation.durationMs;
    const now = performance.now();
    const start = startTimeRef.current ?? now;
    const elapsed = offsetMsRef.current + (now - start);
    let t = duration > 0 ? elapsed / duration : 1;
    if (t >= 1) {
      // Loop back to the start — keeps the demo feeling alive.
      t = 0;
      offsetMsRef.current = 0;
      startTimeRef.current = now;
    }
    setProgress(t);
    applyValues(sampleSliderValues(specRef.current.animation, t));
    rafRef.current = requestAnimationFrame(tick);
  }, [applyValues]);

  const handlePlay = () => {
    if (playing || status !== 'ready') return;
    startTimeRef.current = performance.now();
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePause = () => {
    if (!playing) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const now = performance.now();
    const start = startTimeRef.current ?? now;
    offsetMsRef.current = offsetMsRef.current + (now - start);
    startTimeRef.current = null;
    setPlaying(false);
  };

  const handleReset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    offsetMsRef.current = 0;
    startTimeRef.current = null;
    setPlaying(false);
    setProgress(0);
    applyValues(sampleSliderValues(specRef.current.animation, 0));
  };

  const handleScrub = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    const duration = specRef.current.animation.durationMs;
    // If we're currently playing, keep playing but re-seed the clock so the
    // animation resumes from the scrub position.
    offsetMsRef.current = t * duration;
    if (playing) {
      startTimeRef.current = performance.now();
    } else {
      startTimeRef.current = null;
    }
    setProgress(t);
    applyValues(sampleSliderValues(specRef.current.animation, t));
  };

  // Clean up rAF if the component unmounts while playing.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const disabled = status !== 'ready';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#111',
        borderRadius: 14,
        border: '1px solid rgba(245,240,232,0.12)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(245,240,232,0.08)',
          fontFamily: "'Caveat', cursive",
          fontSize: 22,
          color: 'rgba(245,240,232,0.92)',
        }}
      >
        {spec.title}
      </div>

      <div
        ref={mountRef}
        style={{ flex: 1, minHeight: 360, background: '#fff', position: 'relative' }}
      />

      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(245,240,232,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#141414',
        }}
      >
        <button
          type="button"
          onClick={playing ? handlePause : handlePlay}
          disabled={disabled}
          style={btnStyle(disabled)}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          style={btnStyle(disabled)}
        >
          Reset
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => handleScrub(Number(e.target.value) / 1000)}
          disabled={disabled}
          aria-label="Scrub animation"
          style={{ flex: 1, accentColor: '#FFB347' }}
        />
        <span
          style={{
            minWidth: 48,
            textAlign: 'right',
            color: 'rgba(245,240,232,0.7)',
            fontFamily: "'Caveat', cursive",
            fontSize: 18,
          }}
        >
          {Math.round(progress * 100)}%
        </span>
      </div>

      {status === 'loading' && (
        <div style={overlayStyle}>loading Desmos…</div>
      )}
      {status === 'error' && (
        <div style={overlayStyle}>
          Couldn&apos;t load the interactive graph.
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>{errorMsg}</div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  background: disabled ? 'rgba(245,240,232,0.05)' : 'rgba(245,240,232,0.12)',
  border: '1px solid rgba(245,240,232,0.2)',
  color: 'rgba(245,240,232,0.9)',
  padding: '6px 14px',
  borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: "'Caveat', cursive",
  fontSize: 18,
  minWidth: 72,
});

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  background: 'rgba(17,17,17,0.88)',
  color: 'rgba(245,240,232,0.9)',
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  textAlign: 'center',
  padding: 20,
};
