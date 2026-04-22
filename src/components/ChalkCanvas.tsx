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

    const getCtx = useCallback((): CanvasRenderingContext2D | null => {
      return canvasRef.current?.getContext('2d') ?? null;
    }, []);

    const reset = useCallback(() => {
      const ctx = getCtx();
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      savedStateRef.current = null;
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
    }, [getCtx, width, height]);

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

        // Snapshot everything drawn so far so we can repaint on each frame
        const snapshot = ctx.getImageData(0, 0, width, height);

        const animate = (timestamp: number) => {
          if (cancelled) return;
          if (!startTime) startTime = timestamp;

          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Restore snapshot, then paint current drawing at current progress
          ctx.putImageData(snapshot, 0, 0);
          renderDrawing(ctx, drawing, progress);

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
      [getCtx, width, height]
    );

    useImperativeHandle(ref, () => ({
      playDrawing,
      reset,
      saveState: () => {
        const ctx = getCtx();
        if (!ctx) return null;
        return ctx.getImageData(0, 0, width, height);
      },
    }));

    useEffect(() => {
      return () => {
        if (animRef.current) animRef.current.cancel();
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
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
