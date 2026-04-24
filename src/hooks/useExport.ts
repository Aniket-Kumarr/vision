'use client';

import { useRef, useCallback, useState } from 'react';
import type { Blueprint } from '@/lib/types';
import type { ChalkCanvasHandle } from '@/components/ChalkCanvas';

export type ExportFormat = 'webm' | 'gif';
export type ExportStatus = 'idle' | 'recording' | 'encoding' | 'done' | 'error';

/** Slugify a title to safe filename chars: [a-z0-9-] */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'lesson';
}

/**
 * Returns the total animation duration for a Blueprint in milliseconds.
 * Each step: sum of drawing durations + a 1.5s narration pause.
 */
function totalDurationMs(blueprint: Blueprint): number {
  return blueprint.steps.reduce((sum, step) => {
    const drawingMs = step.drawings.reduce((d, dr) => d + (dr.duration || 800), 0);
    return sum + drawingMs + 1500;
  }, 0);
}

interface UseExportOptions {
  canvasRef: React.RefObject<ChalkCanvasHandle | null>;
  /** The raw HTMLCanvasElement ref — needed for captureStream / pixel reads. */
  getHTMLCanvas: () => HTMLCanvasElement | null;
  blueprint: Blueprint | null;
  /** Call to reset + replay the lesson from step 0. */
  onStartReplay: () => void;
}

interface UseExportReturn {
  status: ExportStatus;
  format: ExportFormat | null;
  progress: number; // 0-1
  startExport: (fmt: ExportFormat) => void;
  cancel: () => void;
}

export function useExport({
  getHTMLCanvas,
  blueprint,
  onStartReplay,
}: UseExportOptions): UseExportReturn {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [format, setFormat] = useState<ExportFormat | null>(null);
  const [progress, setProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const gifRef = useRef<InstanceType<typeof import('gif.js')> | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    mediaRecorderRef.current = null;
    gifRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    cleanup();
    setStatus('idle');
    setFormat(null);
    setProgress(0);
  }, [cleanup]);

  const startExport = useCallback(
    async (fmt: ExportFormat) => {
      if (!blueprint) {
        alert('No lesson loaded yet — please wait for the blueprint to finish loading.');
        return;
      }
      const canvas = getHTMLCanvas();
      if (!canvas) {
        alert('Canvas not available. Please wait for the lesson to appear.');
        return;
      }

      cancelledRef.current = false;
      setFormat(fmt);
      setStatus('recording');
      setProgress(0);

      const slug = slugify(blueprint.title);
      const totalMs = totalDurationMs(blueprint) + 1000; // +1s padding

      // Reset the lesson to step 0 before we start capturing.
      onStartReplay();

      // Give the canvas a brief moment to clear before capturing starts.
      await new Promise<void>((r) => setTimeout(r, 80));

      if (fmt === 'webm') {
        // ---- WebM via MediaRecorder ----
        let stream: MediaStream;
        try {
          stream = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);
        } catch {
          setStatus('error');
          return;
        }

        const chunks: Blob[] = [];
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, { mimeType: mime });
        } catch {
          setStatus('error');
          return;
        }

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          if (cancelledRef.current) return;
          const blob = new Blob(chunks, { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `visua-ai-${slug}.webm`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          setStatus('done');
          setTimeout(() => {
            setStatus('idle');
            setFormat(null);
            setProgress(0);
          }, 2000);
        };

        recorder.start();

        // Animate progress bar
        const startedAt = Date.now();
        frameTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          setProgress(Math.min(elapsed / totalMs, 0.99));
        }, 200);

        stopTimerRef.current = setTimeout(() => {
          if (frameTimerRef.current) {
            clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
          }
          setProgress(1);
          setStatus('encoding');
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }, totalMs);
      } else {
        // ---- GIF via gif.js ----
        const GIF = (await import('gif.js')).default;
        if (cancelledRef.current) return;

        const gif = new GIF({
          workers: 2,
          quality: 10,
          width: canvas.width,
          height: canvas.height,
          workerScript: '/gif.worker.js',
        });
        gifRef.current = gif;

        const FRAME_INTERVAL = 100; // ms between frames
        const startedAt = Date.now();

        frameTimerRef.current = setInterval(() => {
          if (cancelledRef.current) return;
          gif.addFrame(canvas, { copy: true, delay: FRAME_INTERVAL });
          const elapsed = Date.now() - startedAt;
          setProgress(Math.min(elapsed / totalMs, 0.85));
        }, FRAME_INTERVAL);

        stopTimerRef.current = setTimeout(() => {
          if (frameTimerRef.current) {
            clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
          }
          if (cancelledRef.current) return;
          setProgress(0.9);
          setStatus('encoding');

          gif.on('finished', (blob: Blob) => {
            if (cancelledRef.current) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `visua-ai-${slug}.gif`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setStatus('done');
            setTimeout(() => {
              setStatus('idle');
              setFormat(null);
              setProgress(0);
            }, 2000);
          });

          gif.on('progress', (p: number) => {
            setProgress(0.9 + p * 0.1);
          });

          gif.render();
        }, totalMs);
      }
    },
    [blueprint, getHTMLCanvas, onStartReplay],
  );

  return { status, format, progress, startExport, cancel };
}
