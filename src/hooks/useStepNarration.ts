'use client';

/**
 * useStepNarration
 *
 * Fetches TTS audio for a step's narration and plays it while chalk draws.
 *
 * Props
 * ─────
 * narration  – text for the current step
 * playing    – flip to true when chalk starts drawing; false to stop
 * voiceId    – ElevenLabs voice ID
 * enabled    – master on/off (user's "🔊 Narrate" toggle)
 *
 * Returns
 * ───────
 * audioState – 'idle' | 'loading' | 'playing' | 'ended' | 'error'
 * stop()     – imperatively cancel playback
 * errorMsg   – set only when audioState === 'error'
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type AudioState = 'idle' | 'loading' | 'playing' | 'ended' | 'error';

interface UseStepNarrationReturn {
  audioState: AudioState;
  stop: () => void;
  errorMsg: string | null;
}

interface CacheEntry {
  blob: Blob;
}

// Module-level cache: survives re-renders, cleared on page unload.
// Key = `${voiceId}::${narration}`
const blobCache = new Map<string, CacheEntry>();

function cacheKey(narration: string, voiceId: string): string {
  return `${voiceId}::${narration}`;
}

export function useStepNarration(
  narration: string,
  playing: boolean,
  voiceId: string,
  enabled: boolean,
): UseStepNarrationReturn {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stable refs so the async closure always sees the latest values.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  /** Tear down current playback completely. */
  const teardown = useCallback(() => {
    cancelledRef.current = true;

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    teardown();
    setAudioState('idle');
    setErrorMsg(null);
  }, [teardown]);

  useEffect(() => {
    // Reset to idle whenever narration or playing flips off or disabled.
    if (!enabled || !playing || !narration) {
      teardown();
      setAudioState('idle');
      setErrorMsg(null);
      return;
    }

    // Start fresh for this narration/voice combination.
    cancelledRef.current = false;

    const key = cacheKey(narration, voiceId);

    const play = (blob: Blob) => {
      if (cancelledRef.current) return;

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        if (!cancelledRef.current) setAudioState('ended');
      };

      audio.onerror = () => {
        if (!cancelledRef.current) {
          setAudioState('error');
          setErrorMsg('Playback failed');
        }
      };

      setAudioState('playing');
      audio.play().catch((err: unknown) => {
        if (!cancelledRef.current) {
          setAudioState('error');
          setErrorMsg(err instanceof Error ? err.message : 'Play error');
        }
      });
    };

    // Cache hit — play immediately.
    const cached = blobCache.get(key);
    if (cached) {
      play(cached.blob);
      return teardown; // cleanup
    }

    // Cache miss — fetch from API.
    setAudioState('loading');
    setErrorMsg(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch('/api/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: narration, voiceId }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `narrate ${res.status}`);
        }

        if (cancelledRef.current) return;

        const blob = await res.blob();
        if (cancelledRef.current) return;

        // Store in cache before playing so a re-visit is instant.
        blobCache.set(key, { blob });

        play(blob);
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;
        if (!cancelledRef.current) {
          console.error('[useStepNarration] TTS failed:', err);
          setAudioState('error');
          setErrorMsg(err instanceof Error ? err.message : 'Voice unavailable');
        }
      }
    })();

    return teardown;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narration, playing, voiceId, enabled]);

  // Pause when tab hides; don't resume (let the whichever-is-later logic handle it).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.hidden && audioRef.current) {
        audioRef.current.pause();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return { audioState, stop, errorMsg };
}
