import {
  CHALK_COLORS,
  ChalkColor,
  Drawing,
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
} from './types';

// --- Chalk rendering constants ---

/** Minimum opacity for a chalk stroke — chalk never goes fully transparent. */
const CHALK_OPACITY_MIN = 0.82;
/** How much the opacity varies above the minimum per stroke. */
const CHALK_OPACITY_RANGE = 0.16;

/** Minimum stroke width in pixels for a chalk line. */
const CHALK_WIDTH_MIN = 2;
/** Maximum additional width variation in pixels per stroke. */
const CHALK_WIDTH_JITTER = 1;

/**
 * Pixels of line length covered by each jittered micro-segment.
 * Smaller = more granular chalk texture; larger = smoother strokes.
 */
const CHALK_SEGMENT_PX = 4;
/** Minimum number of segments for very short lines so they always render. */
const CHALK_SEGMENT_MIN = 2;

/** Default pixel radius of positional jitter applied to stroke endpoints. */
const CHALK_JITTER_DEFAULT = 1;

/**
 * The handwriting font used by every text-rendering function.
 * Change this one constant to restyle all chalk labels, axis numbers,
 * point labels, and text blocks simultaneously.
 */
const CHALK_FONT_FAMILY = "'Caveat', cursive";

// --- Primitive helpers ---

function getColor(color: ChalkColor): string {
  return CHALK_COLORS[color];
}

function jitter(val: number, amount = CHALK_JITTER_DEFAULT): number {
  return val + (Math.random() - 0.5) * amount * 2;
}

function chalkOpacity(): number {
  return CHALK_OPACITY_MIN + Math.random() * CHALK_OPACITY_RANGE;
}

function chalkWidth(): number {
  return CHALK_WIDTH_MIN + Math.random() * CHALK_WIDTH_JITTER;
}

/**
 * Converts a 6-digit hex color string and an alpha value to an rgba() string.
 * Returns a fully-transparent fallback if the hex string is malformed so that
 * callers receive a valid CSS color rather than `rgba(NaN, NaN, NaN, alpha)`.
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(0, 0, 0, 0)`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawLineChalk(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const segments = Math.max(Math.floor(length / CHALK_SEGMENT_PX), CHALK_SEGMENT_MIN);
  const drawSegments = Math.floor(segments * progress);

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < drawSegments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const sx = jitter(x1 + dx * t0);
    const sy = jitter(y1 + dy * t0);
    const ex = jitter(x1 + dx * t1);
    const ey = jitter(y1 + dy * t1);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = hexToRgba(hex, chalkOpacity());
    ctx.lineWidth = chalkWidth();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawDashedLineChalk(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLength: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const gap = dashLength * 0.6;

  ctx.save();
  ctx.lineCap = 'round';

  // Draw individual dashes manually so we can apply chalk jitter per dash
  let accumulated = 0;
  let inDash = true;
  let segStart = { x: x1, y: y1 };

  while (accumulated < length * progress) {
    const segLen = inDash ? dashLength : gap;
    const end = Math.min(accumulated + segLen, length * progress);
    const tEnd = end / length;
    const segEnd = { x: x1 + dx * tEnd, y: y1 + dy * tEnd };

    if (inDash) {
      ctx.beginPath();
      ctx.moveTo(jitter(segStart.x), jitter(segStart.y));
      ctx.lineTo(jitter(segEnd.x), jitter(segEnd.y));
      ctx.strokeStyle = hexToRgba(hex, chalkOpacity() * 0.8);
      ctx.lineWidth = chalkWidth() * 0.85;
      ctx.stroke();
    }

    segStart = segEnd;
    accumulated += segLen;
    inDash = !inDash;
  }

  ctx.restore();
}

export function drawCircleChalk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const segments = Math.max(Math.floor(r * 0.8), 20);
  // drawSegments alone gates progress. The previous totalAngle guard caused
  // the circle to render only ~progress² of its circumference instead of
  // exactly `progress` of it, because both the loop bound and the angle check
  // were independently scaled by progress.
  const drawSegments = Math.floor(segments * progress);

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < drawSegments; i++) {
    const startA = -Math.PI / 2 + (i / segments) * Math.PI * 2;
    const endA = -Math.PI / 2 + ((i + 1) / segments) * Math.PI * 2;

    const sx = jitter(cx + Math.cos(startA) * r);
    const sy = jitter(cy + Math.sin(startA) * r);
    const ex = jitter(cx + Math.cos(endA) * r);
    const ey = jitter(cy + Math.sin(endA) * r);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = hexToRgba(hex, chalkOpacity());
    ctx.lineWidth = chalkWidth();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawArcChalk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const fullAngle = endAngle - startAngle;
  const segments = Math.max(Math.floor(r * 0.5), 8);
  // Drive progress purely through drawSegments. Previously totalAngle was
  // computed as fullAngle * progress and then used inside the loop, which
  // meant each segment's angular size shrank as progress changed — the arc
  // never actually swept the full [startAngle, endAngle] range at progress=1.
  const drawSegments = Math.floor(segments * progress);

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < drawSegments; i++) {
    const a0 = startAngle + (i / segments) * fullAngle;
    const a1 = startAngle + ((i + 1) / segments) * fullAngle;

    const sx = jitter(cx + Math.cos(a0) * r);
    const sy = jitter(cy + Math.sin(a0) * r);
    const ex = jitter(cx + Math.cos(a1) * r);
    const ey = jitter(cy + Math.sin(a1) * r);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = hexToRgba(hex, chalkOpacity());
    ctx.lineWidth = chalkWidth();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRectChalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ChalkColor,
  fill: boolean,
  progress: number
): void {
  const hex = getColor(color);
  const perimeter = 2 * (width + height);
  const drawLength = perimeter * progress;

  const sides = [
    { x1: x, y1: y, x2: x + width, y2: y },
    { x1: x + width, y1: y, x2: x + width, y2: y + height },
    { x1: x + width, y1: y + height, x2: x, y2: y + height },
    { x1: x, y1: y + height, x2: x, y2: y },
  ];

  let remaining = drawLength;

  for (const side of sides) {
    if (remaining <= 0) break;
    const len = Math.sqrt(
      (side.x2 - side.x1) ** 2 + (side.y2 - side.y1) ** 2
    );
    const sideProgress = Math.min(remaining / len, 1);
    drawLineChalk(ctx, side.x1, side.y1, side.x2, side.y2, color, sideProgress);
    remaining -= len;
  }

  // drawLineChalk manages its own save/restore so no outer save is needed for
  // the outline loop. We only need a save for the fill operation.
  if (fill && progress === 1) {
    ctx.save();
    ctx.fillStyle = hexToRgba(hex, 0.12);
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }
}

export function drawTriangleChalk(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  color: ChalkColor,
  fill: boolean,
  progress: number
): void {
  const hex = getColor(color);
  const sides = [
    { x1, y1, x2, y2 },
    { x1: x2, y1: y2, x2: x3, y2: y3 },
    { x1: x3, y1: y3, x2: x1, y2: y1 },
  ];

  const perimeter = sides.reduce(
    (s, side) =>
      s + Math.sqrt((side.x2 - side.x1) ** 2 + (side.y2 - side.y1) ** 2),
    0
  );

  let remaining = perimeter * progress;

  for (const side of sides) {
    if (remaining <= 0) break;
    const len = Math.sqrt((side.x2 - side.x1) ** 2 + (side.y2 - side.y1) ** 2);
    const p = Math.min(remaining / len, 1);
    drawLineChalk(ctx, side.x1, side.y1, side.x2, side.y2, color, p);
    remaining -= len;
  }

  if (fill && progress === 1) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(hex, 0.12);
    ctx.fill();
    ctx.restore();
  }
}

export function drawPointChalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string | undefined,
  labelPosition: 'top' | 'bottom' | 'left' | 'right' | undefined,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  // Sample opacity once so the dot and its label share the same value.
  // Two independent chalkOpacity() calls caused them to flicker at different
  // opacities on every render frame.
  const opacity = chalkOpacity();
  const r = 4 * progress;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(hex, opacity);
  ctx.fill();

  if (label && progress > 0.7) {
    ctx.font = `500 14px ${CHALK_FONT_FAMILY}`;
    ctx.fillStyle = hexToRgba(hex, opacity);

    const offset = 16;
    let tx = x;
    let ty = y;
    let textAlign: CanvasTextAlign = 'center';

    switch (labelPosition) {
      case 'top': ty = y - offset; break;
      case 'bottom': ty = y + offset; break;
      case 'left': tx = x - offset; textAlign = 'right'; ty = y + 4; break;
      case 'right': tx = x + offset; textAlign = 'left'; ty = y + 4; break;
      default: ty = y - offset;
    }

    ctx.textAlign = textAlign;
    ctx.fillText(label, tx, ty);
  }

  ctx.restore();
}

export function drawArrowChalk(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const headProgress = Math.max(0, (progress - 0.7) / 0.3);
  drawLineChalk(ctx, x1, y1, x2, y2, color, Math.min(progress / 0.7, 1));

  if (headProgress > 0) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 12 * headProgress;
    const headAngle = 0.4;

    ctx.save();
    ctx.lineCap = 'round';

    const ax1 = x2 - headLen * Math.cos(angle - headAngle);
    const ay1 = y2 - headLen * Math.sin(angle - headAngle);
    const ax2 = x2 - headLen * Math.cos(angle + headAngle);
    const ay2 = y2 - headLen * Math.sin(angle + headAngle);

    ctx.beginPath();
    ctx.moveTo(jitter(ax1), jitter(ay1));
    ctx.lineTo(jitter(x2), jitter(y2));
    ctx.lineTo(jitter(ax2), jitter(ay2));
    ctx.strokeStyle = hexToRgba(hex, chalkOpacity());
    ctx.lineWidth = chalkWidth();
    ctx.stroke();
    ctx.restore();
  }
}

export function drawTextChalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  content: string,
  fontSize: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const chars = Math.floor(content.length * progress);
  const text = content.slice(0, chars);

  ctx.save();
  ctx.font = `500 ${fontSize}px ${CHALK_FONT_FAMILY}`;
  ctx.fillStyle = hexToRgba(hex, chalkOpacity());
  ctx.textBaseline = 'middle';

  // Slight jitter per character for chalk feel
  let cx = x;
  for (let i = 0; i < text.length; i++) {
    const charWidth = ctx.measureText(text[i]).width;
    ctx.fillText(text[i], jitter(cx, 0.5), jitter(y, 0.4));
    cx += charWidth;
  }

  ctx.restore();
}

export function drawCurveChalk(
  ctx: CanvasRenderingContext2D,
  fn: string,
  xMin: number,
  xMax: number,
  yScale: number,
  yOffset: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  // eslint-disable-next-line no-new-func
  let evalFn: (x: number) => number;
  try {
    evalFn = new Function('x', `with(Math) { return ${fn}; }`) as (x: number) => number;
  } catch {
    return;
  }

  const steps = 200;
  const drawSteps = Math.floor(steps * progress);
  const range = xMax - xMin;

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < drawSteps - 1; i++) {
    const x0 = xMin + (i / steps) * range;
    const x1 = xMin + ((i + 1) / steps) * range;

    let y0: number, y1: number;
    try {
      y0 = evalFn(x0);
      y1 = evalFn(x1);
    } catch {
      continue;
    }

    if (!isFinite(y0) || !isFinite(y1)) continue;
    if (Math.abs(y0) > 1000 || Math.abs(y1) > 1000) continue;

    const px0 = jitter(x0);
    const py0 = jitter(yOffset - y0 * yScale);
    const px1 = jitter(x1);
    const py1 = jitter(yOffset - y1 * yScale);

    ctx.beginPath();
    ctx.moveTo(px0, py0);
    ctx.lineTo(px1, py1);
    ctx.strokeStyle = hexToRgba(hex, chalkOpacity());
    ctx.lineWidth = chalkWidth();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawShadeChalk(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  opacity: number,
  color: ChalkColor,
  progress: number
): void {
  if (points.length < 3) return;
  const hex = getColor(color);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = hexToRgba(hex, opacity * progress);
  ctx.fill();
  ctx.restore();
}

export function drawAngleMarkChalk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  color: ChalkColor,
  progress: number
): void {
  // Normalise the sweep so the arc always travels the short way from
  // startAngle to endAngle, regardless of how the caller orders them.
  // Without normalisation, passing (start=1.5, end=0.5) sweeps a reflex arc
  // (nearly a full circle) instead of the intended ~57 degree angle mark.
  let sweep = endAngle - startAngle;
  // Bring sweep into (-2π, 2π]
  sweep = sweep - Math.floor(sweep / (Math.PI * 2)) * (Math.PI * 2);
  // If the normalised sweep exceeds π, take the short arc in the opposite
  // direction so we draw the interior angle, not the exterior.
  if (sweep > Math.PI) {
    sweep -= Math.PI * 2;
  }
  const normalisedEnd = startAngle + sweep;

  drawArcChalk(ctx, cx, cy, r, startAngle, normalisedEnd, color, progress);
}

export function drawBracketChalk(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: 'square' | 'curly',
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const span = Math.abs(y2 - y1);
  // Arm length scales with the bracket span so it remains proportional at any
  // size. Clamped to [6, 20] to stay readable on both tiny and large brackets.
  const armLen = Math.min(Math.max(span * 0.12, 6), 20);
  const midY = (y1 + y2) / 2;

  ctx.save();
  ctx.strokeStyle = hexToRgba(hex, chalkOpacity());
  ctx.lineWidth = chalkWidth();
  ctx.lineCap = 'round';

  if (type === 'square') {
    drawLineChalk(ctx, x1 + armLen, y1, x1, y1, color, progress);
    drawLineChalk(ctx, x1, y1, x1, y2, color, progress);
    drawLineChalk(ctx, x1, y2, x1 + armLen, y2, color, progress);
  } else {
    // Curly brace drawn with quadratic bezier curves.
    // The old implementation used straight drawLineChalk calls which produced
    // a Z-shape approximation; quadratic curves give the proper brace silhouette.
    drawLineChalk(ctx, x1 + armLen, y1, x1, y1, color, progress);
    if (progress > 0) {
      const lobeX = x1 - armLen * 0.8;
      ctx.save();
      ctx.globalAlpha = Math.min(progress * 2, 1) * chalkOpacity();
      // Upper lobe: spine curves outward to the midpoint tip
      ctx.beginPath();
      ctx.moveTo(jitter(x1), jitter(y1));
      ctx.quadraticCurveTo(
        jitter(lobeX), jitter(y1 + (midY - y1) * 0.5),
        jitter(lobeX), jitter(midY)
      );
      ctx.stroke();
      // Lower lobe: tip curves back inward to the bottom
      ctx.beginPath();
      ctx.moveTo(jitter(lobeX), jitter(midY));
      ctx.quadraticCurveTo(
        jitter(lobeX), jitter(midY + (y2 - midY) * 0.5),
        jitter(x1), jitter(y2)
      );
      ctx.stroke();
      ctx.restore();
    }
    drawLineChalk(ctx, x1, y2, x1 + armLen, y2, color, progress);
  }

  ctx.restore();
}

// Pixel metrics for axis tick marks and labels expressed as functions of
// `step`. This keeps ticks and labels proportional when step changes
// (e.g. step=50 vs step=200) rather than being frozen at arbitrary pixel
// values that only look right for one particular scale.
const axisTickHalf = (step: number): number => Math.min(Math.max(step * 0.06, 3), 8);
const axisLabelOffset = (step: number): number => Math.min(Math.max(step * 0.24, 10), 20);
// Arrow overshoot past the stated range, also step-proportional.
const axisArrowOvershoot = (step: number): number => Math.min(Math.max(step * 0.4, 14), 28);

export function drawAxesChalk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  xRange: number,
  yRange: number,
  step: number,
  color: ChalkColor,
  progress: number
): void {
  const hex = getColor(color);
  const lineProgress = Math.min(progress * 2, 1);
  const labelsProgress = Math.max(0, (progress - 0.5) * 2);

  const overshoot = axisArrowOvershoot(step);
  // X axis
  drawArrowChalk(ctx, cx - xRange, cy, cx + xRange + overshoot, cy, color, lineProgress);
  // Y axis
  drawArrowChalk(ctx, cx, cy + yRange, cx, cy - yRange - overshoot, color, lineProgress);

  if (labelsProgress > 0) {
    const tick = axisTickHalf(step);
    const labelGap = axisLabelOffset(step);

    ctx.save();
    ctx.font = `400 12px ${CHALK_FONT_FAMILY}`;
    ctx.fillStyle = hexToRgba(hex, 0.7 * labelsProgress);
    ctx.textAlign = 'center';

    // X tick marks and labels
    for (let i = -Math.floor(xRange / step); i <= Math.floor(xRange / step); i++) {
      if (i === 0) continue;
      const x = cx + i * step;
      ctx.beginPath();
      ctx.moveTo(x, cy - tick);
      ctx.lineTo(x, cy + tick);
      ctx.strokeStyle = hexToRgba(hex, 0.5 * labelsProgress);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(String(i), x, cy + labelGap);
    }

    // Y tick marks and labels
    ctx.textAlign = 'right';
    for (let i = -Math.floor(yRange / step); i <= Math.floor(yRange / step); i++) {
      if (i === 0) continue;
      const y = cy - i * step;
      ctx.beginPath();
      ctx.moveTo(cx - tick, y);
      ctx.lineTo(cx + tick, y);
      ctx.strokeStyle = hexToRgba(hex, 0.5 * labelsProgress);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(String(i), cx - labelGap * 0.5, y + 4);
    }

    // Origin label
    ctx.textAlign = 'right';
    ctx.fillText('0', cx - labelGap * 0.5, cy + labelGap);

    ctx.restore();
  }
}

// --- Top-level dispatch ---

/**
 * Renders a single `Drawing` descriptor onto `ctx` at the given animation
 * progress (0–1).  All drawing functions are reached through a lookup map
 * rather than a switch statement, so adding a new DrawingType only requires
 * one new entry here rather than a new case in every consumer.
 */
export function renderDrawing(
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
  progress: number
): void {
  const { type, color, params } = drawing;

  type Handler = (ctx: CanvasRenderingContext2D, p: typeof params, color: ChalkColor, progress: number) => void;

  const handlers: Record<string, Handler> = {
    axes: (ctx, p, color, progress) => {
      const { cx, cy, xRange, yRange, step } = p as AxesParams;
      drawAxesChalk(ctx, cx, cy, xRange, yRange, step, color, progress);
    },
    line: (ctx, p, color, progress) => {
      const { x1, y1, x2, y2 } = p as LineParams;
      drawLineChalk(ctx, x1, y1, x2, y2, color, progress);
    },
    dashed_line: (ctx, p, color, progress) => {
      const { x1, y1, x2, y2, dashLength } = p as DashedLineParams;
      drawDashedLineChalk(ctx, x1, y1, x2, y2, dashLength, color, progress);
    },
    circle: (ctx, p, color, progress) => {
      const { cx, cy, r } = p as CircleParams;
      drawCircleChalk(ctx, cx, cy, r, color, progress);
    },
    arc: (ctx, p, color, progress) => {
      const { cx, cy, r, startAngle, endAngle } = p as ArcParams;
      drawArcChalk(ctx, cx, cy, r, startAngle, endAngle, color, progress);
    },
    rect: (ctx, p, color, progress) => {
      const { x, y, width, height, fill } = p as RectParams;
      drawRectChalk(ctx, x, y, width, height, color, fill, progress);
    },
    triangle: (ctx, p, color, progress) => {
      const { x1, y1, x2, y2, x3, y3, fill } = p as TriangleParams;
      drawTriangleChalk(ctx, x1, y1, x2, y2, x3, y3, color, fill, progress);
    },
    point: (ctx, p, color, progress) => {
      const { x, y, label, labelPosition } = p as PointParams;
      drawPointChalk(ctx, x, y, label, labelPosition, color, progress);
    },
    arrow: (ctx, p, color, progress) => {
      const { x1, y1, x2, y2 } = p as ArrowParams;
      drawArrowChalk(ctx, x1, y1, x2, y2, color, progress);
    },
    text: (ctx, p, color, progress) => {
      const { x, y, content, fontSize } = p as TextParams;
      drawTextChalk(ctx, x, y, content, fontSize, color, progress);
    },
    curve: (ctx, p, color, progress) => {
      const { fn, xMin, xMax, yScale, yOffset } = p as CurveParams;
      drawCurveChalk(ctx, fn, xMin, xMax, yScale, yOffset, color, progress);
    },
    shade: (ctx, p, color, progress) => {
      const { points, opacity } = p as ShadeParams;
      drawShadeChalk(ctx, points, opacity, color, progress);
    },
    angle_mark: (ctx, p, color, progress) => {
      const { cx, cy, r, startAngle, endAngle } = p as AngleMarkParams;
      drawAngleMarkChalk(ctx, cx, cy, r, startAngle, endAngle, color, progress);
    },
    bracket: (ctx, p, color, progress) => {
      const { x1, y1, x2, y2, type } = p as BracketParams;
      drawBracketChalk(ctx, x1, y1, x2, y2, type, color, progress);
    },
  };

  const handler = handlers[type];
  if (handler) {
    handler(ctx, params, color, progress);
  }
}
