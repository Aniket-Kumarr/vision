'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Drawing, DrawingType } from '@/lib/types';
import {
  drawAxesChalk,
  drawLineChalk,
  drawDashedLineChalk,
  drawCircleChalk,
  drawArcChalk,
  drawRectChalk,
  drawTriangleChalk,
  drawPointChalk,
  drawArrowChalk,
  drawTextChalk,
  drawCurveChalk,
  drawShadeChalk,
  drawAngleMarkChalk,
  drawBracketChalk,
} from '@/lib/chalkRenderer';
import {
  AxesParams,
  LineParams,
  DashedLineParams,
  CircleParams,
  ArcParams,
  RectParams,
  TriangleParams,
  PointParams,
  ArrowParams,
  TextParams,
  CurveParams,
  ShadeParams,
  AngleMarkParams,
  BracketParams,
} from '@/lib/types';

export interface ChalkCanvasHandle {
  playDrawing: (drawing: Drawing, onComplete: () => void) => void;
  reset: () => void;
  saveState: () => ImageData | null;
}

interface ChalkCanvasProps {
  width?: number;
  height?: number;
}

type AnimFrame = {
  cancel: () => void;
};

const ChalkCanvas = forwardRef<ChalkCanvasHandle, ChalkCanvasProps>(
  ({ width = 800, height = 600 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<AnimFrame | null>(null);
    const savedStateRef = useRef<ImageData | null>(null);

    // ---------------------------------------------------------------------------
    // DPR helpers
    // ---------------------------------------------------------------------------
    // Returns the current physical (DPR-scaled) dimensions of the backing buffer.
    const physicalSize = useCallback((): { pw: number; ph: number } => {
      const dpr = window.devicePixelRatio ?? 1;
      return { pw: Math.round(width * dpr), ph: Math.round(height * dpr) };
    }, [width, height]);

    // Returns a 2D context.  We do NOT request willReadFrequently here because
    // the chalk renderer does not read pixels; only playDrawing/saveState do,
    // and they are infrequent.  Keeping the default lets the browser keep the
    // canvas GPU-accelerated for the draw calls.
    const getCtx = useCallback((): CanvasRenderingContext2D | null => {
      return canvasRef.current?.getContext('2d') ?? null;
    }, []);

    // ---------------------------------------------------------------------------
    // DPR setup + ResizeObserver
    // ---------------------------------------------------------------------------
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Apply DPR scaling so the canvas bitmap is sharp on hi-DPI screens.
      const applyDpr = () => {
        const dpr = window.devicePixelRatio ?? 1;
        const pw = Math.round(width * dpr);
        const ph = Math.round(height * dpr);

        // Only resize (and lose the bitmap) when the physical size actually changes.
        if (canvas.width !== pw || canvas.height !== ph) {
          canvas.width = pw;
          canvas.height = ph;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Re-apply the scale transform after every resize; the bitmap is cleared
        // by the size assignment above so a fresh transform is always needed.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      applyDpr();

      // Re-apply when the OS display scale changes (e.g. dragging to a different
      // monitor, or the user changes system DPR settings in the browser).
      const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const onDprChange = () => applyDpr();
      mq.addEventListener('change', onDprChange);

      // Observe container resize so the logical-pixel transform stays accurate
      // when the parent element is resized (the canvas CSS size is 100%/100%).
      const ro = new ResizeObserver(() => applyDpr());
      ro.observe(canvas);

      return () => {
        mq.removeEventListener('change', onDprChange);
        ro.disconnect();
        // Cancel any in-flight animation so the RAF callback cannot fire after
        // the component has unmounted and the canvas element is gone.
        if (animRef.current) {
          animRef.current.cancel();
          animRef.current = null;
        }
      };
    }, [width, height]);

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------
    const reset = useCallback(() => {
      const ctx = getCtx();
      if (!ctx) return;
      const { pw, ph } = physicalSize();
      // Clear the full physical buffer, then re-establish the DPR transform so
      // subsequent draw calls still use logical coordinates.
      const dpr = window.devicePixelRatio ?? 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      savedStateRef.current = null;
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
    }, [getCtx, physicalSize]);

    const playDrawing = useCallback(
      (drawing: Drawing, onComplete: () => void) => {
        const ctx = getCtx();
        if (!ctx) { onComplete(); return; }

        if (animRef.current) {
          animRef.current.cancel();
        }

        const duration = drawing.duration;
        let startTime: number | null = null;
        let rafId: number;
        let cancelled = false;

        // Snapshot everything drawn so far so we can repaint on each frame.
        // getImageData operates on the physical buffer, so we must pass physical
        // pixel dimensions (not the logical width/height props).
        const { pw, ph } = physicalSize();
        const snapshot = ctx.getImageData(0, 0, pw, ph);

        const animate = (timestamp: number) => {
          if (cancelled) return;
          if (!startTime) startTime = timestamp;

          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Restore snapshot, then paint current drawing at current progress.
          // putImageData ignores the current transform, so we must temporarily
          // reset to identity so it lands at (0,0) of the physical buffer.
          const dpr = window.devicePixelRatio ?? 1;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.putImageData(snapshot, 0, 0);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          try {
            renderDrawing(ctx, drawing, progress);
          } catch (err) {
            console.error('renderDrawing failed:', err);
            animRef.current = null;
            onComplete();
            return;
          }

          if (progress < 1) {
            rafId = requestAnimationFrame(animate);
          } else {
            animRef.current = null;
            onComplete();
          }
        };

        rafId = requestAnimationFrame(animate);
        animRef.current = {
          cancel: () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
          },
        };
      },
      [getCtx, physicalSize]
    );

    useImperativeHandle(
      ref,
      () => ({
        playDrawing,
        reset,
        saveState: () => {
          const ctx = getCtx();
          if (!ctx) return null;
          // Return a snapshot of the physical buffer in device pixels.
          const { pw, ph } = physicalSize();
          return ctx.getImageData(0, 0, pw, ph);
        },
      }),
      [playDrawing, reset, getCtx, physicalSize]
    );

    return (
      <canvas
        ref={canvasRef}
        // Initial logical dimensions; the DPR useEffect will immediately
        // replace these with the correct physical pixel values.
        width={width}
        height={height}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    );
  }
);

ChalkCanvas.displayName = 'ChalkCanvas';

export default ChalkCanvas;

function renderDrawing(
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
  progress: number
): void {
  const { type, color, params } = drawing;

  switch (type as DrawingType) {
    case 'axes': {
      const p = params as AxesParams;
      drawAxesChalk(ctx, p.cx, p.cy, p.xRange, p.yRange, p.step, color, progress);
      break;
    }
    case 'line': {
      const p = params as LineParams;
      drawLineChalk(ctx, p.x1, p.y1, p.x2, p.y2, color, progress);
      break;
    }
    case 'dashed_line': {
      const p = params as DashedLineParams;
      drawDashedLineChalk(ctx, p.x1, p.y1, p.x2, p.y2, p.dashLength, color, progress);
      break;
    }
    case 'circle': {
      const p = params as CircleParams;
      drawCircleChalk(ctx, p.cx, p.cy, p.r, color, progress);
      break;
    }
    case 'arc': {
      const p = params as ArcParams;
      drawArcChalk(ctx, p.cx, p.cy, p.r, p.startAngle, p.endAngle, color, progress);
      break;
    }
    case 'rect': {
      const p = params as RectParams;
      drawRectChalk(ctx, p.x, p.y, p.width, p.height, color, p.fill, progress);
      break;
    }
    case 'triangle': {
      const p = params as TriangleParams;
      drawTriangleChalk(ctx, p.x1, p.y1, p.x2, p.y2, p.x3, p.y3, color, p.fill, progress);
      break;
    }
    case 'point': {
      const p = params as PointParams;
      drawPointChalk(ctx, p.x, p.y, p.label, p.labelPosition, color, progress);
      break;
    }
    case 'arrow': {
      const p = params as ArrowParams;
      drawArrowChalk(ctx, p.x1, p.y1, p.x2, p.y2, color, progress);
      break;
    }
    case 'text': {
      const p = params as TextParams;
      drawTextChalk(ctx, p.x, p.y, p.content, p.fontSize, color, progress);
      break;
    }
    case 'curve': {
      const p = params as CurveParams;
      drawCurveChalk(ctx, p.fn, p.xMin, p.xMax, p.yScale, p.yOffset, color, progress);
      break;
    }
    case 'shade': {
      const p = params as ShadeParams;
      drawShadeChalk(ctx, p.points, p.opacity, color, progress);
      break;
    }
    case 'angle_mark': {
      const p = params as AngleMarkParams;
      drawAngleMarkChalk(ctx, p.cx, p.cy, p.r, p.startAngle, p.endAngle, color, progress);
      break;
    }
    case 'bracket': {
      const p = params as BracketParams;
      drawBracketChalk(ctx, p.x1, p.y1, p.x2, p.y2, p.type, color, progress);
      break;
    }
  }
}
