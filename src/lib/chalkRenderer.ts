import { CHALK_COLORS, ChalkColor } from './types';

function getColor(color: ChalkColor): string {
  return CHALK_COLORS[color];
}

function jitter(val: number, amount = 1): number {
  return val + (Math.random() - 0.5) * amount * 2;
}

function chalkOpacity(): number {
  return 0.82 + Math.random() * 0.16;
}

function chalkWidth(): number {
  return 2 + Math.random();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
  const segments = Math.max(Math.floor(length / 4), 2);
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
  const drawLength = length * progress;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.setLineDash([dashLength, dashLength * 0.6]);
  ctx.beginPath();

  let accumulated = 0;
  const segLen = 3;
  let drawing = true;

  let cx = x1;
  let cy = y1;

  while (accumulated < drawLength) {
    const remaining = drawLength - accumulated;
    const step = Math.min(segLen, remaining);
    const frac = accumulated / length;
    const nx = x1 + dx * (frac + step / length);
    const ny = y1 + dy * (frac + step / length);

    if (drawing) {
      ctx.moveTo(jitter(cx), jitter(cy));
      ctx.lineTo(jitter(nx), jitter(ny));
    }

    cx = nx;
    cy = ny;
    accumulated += step;
    drawing = !drawing;
  }

  ctx.strokeStyle = hexToRgba(hex, chalkOpacity() * 0.8);
  ctx.lineWidth = chalkWidth() * 0.85;
  ctx.stroke();
  ctx.setLineDash([]);
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
  const totalAngle = Math.PI * 2 * progress;
  const segments = Math.max(Math.floor(r * 0.8), 20);
  const drawSegments = Math.floor(segments * progress);

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < drawSegments; i++) {
    const startA = -Math.PI / 2 + (i / segments) * Math.PI * 2;
    const endA = -Math.PI / 2 + ((i + 1) / segments) * Math.PI * 2;

    if (endA > -Math.PI / 2 + totalAngle) break;

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
  const totalAngle = (endAngle - startAngle) * progress;
  const segments = Math.max(Math.floor(r * 0.5), 8);
  const drawSegments = Math.floor(segments * progress);

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < drawSegments; i++) {
    const a0 = startAngle + (i / segments) * totalAngle;
    const a1 = startAngle + ((i + 1) / segments) * totalAngle;

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

  ctx.save();
  ctx.lineCap = 'round';

  for (const side of sides) {
    if (remaining <= 0) break;
    const len = Math.sqrt(
      (side.x2 - side.x1) ** 2 + (side.y2 - side.y1) ** 2
    );
    const sideProgress = Math.min(remaining / len, 1);
    drawLineChalk(ctx, side.x1, side.y1, side.x2, side.y2, color, sideProgress);
    remaining -= len;
  }

  if (fill && progress === 1) {
    ctx.fillStyle = hexToRgba(hex, 0.12);
    ctx.fillRect(x, y, width, height);
  }

  ctx.restore();
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
  const r = 4 * progress;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(hex, chalkOpacity());
  ctx.fill();

  if (label && progress > 0.7) {
    ctx.font = `500 14px 'Caveat', cursive`;
    ctx.fillStyle = hexToRgba(hex, chalkOpacity());

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
  ctx.font = `500 ${fontSize}px 'Caveat', cursive`;
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
  drawArcChalk(ctx, cx, cy, r, startAngle, endAngle, color, progress);
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
  const midY = (y1 + y2) / 2;
  const armLen = 10;

  if (type === 'square') {
    drawLineChalk(ctx, x1 + armLen, y1, x1, y1, color, progress);
    drawLineChalk(ctx, x1, y1, x1, y2, color, progress);
    drawLineChalk(ctx, x1, y2, x1 + armLen, y2, color, progress);
  } else {
    // Simple curly — top arm, bulge out, middle, bulge in, bottom arm
    drawLineChalk(ctx, x1 + armLen, y1, x1, y1, color, progress);
    drawLineChalk(ctx, x1, y1, x1 - armLen / 2, midY, color, progress);
    drawLineChalk(ctx, x1 - armLen / 2, midY, x1, y2, color, progress);
    drawLineChalk(ctx, x1, y2, x1 + armLen, y2, color, progress);
  }
}

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

  // X axis
  drawArrowChalk(ctx, cx - xRange, cy, cx + xRange + 20, cy, color, lineProgress);
  // Y axis
  drawArrowChalk(ctx, cx, cy + yRange, cx, cy - yRange - 20, color, lineProgress);

  if (labelsProgress > 0) {
    ctx.save();
    ctx.font = `400 12px 'Caveat', cursive`;
    ctx.fillStyle = hexToRgba(hex, 0.7 * labelsProgress);
    ctx.textAlign = 'center';

    // X tick marks and labels
    for (let i = -Math.floor(xRange / step); i <= Math.floor(xRange / step); i++) {
      if (i === 0) continue;
      const x = cx + i * step;
      ctx.beginPath();
      ctx.moveTo(x, cy - 4);
      ctx.lineTo(x, cy + 4);
      ctx.strokeStyle = hexToRgba(hex, 0.5 * labelsProgress);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(String(i), x, cy + 16);
    }

    // Y tick marks and labels
    ctx.textAlign = 'right';
    for (let i = -Math.floor(yRange / step); i <= Math.floor(yRange / step); i++) {
      if (i === 0) continue;
      const y = cy - i * step;
      ctx.beginPath();
      ctx.moveTo(cx - 4, y);
      ctx.lineTo(cx + 4, y);
      ctx.strokeStyle = hexToRgba(hex, 0.5 * labelsProgress);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(String(i), cx - 8, y + 4);
    }

    // Origin label
    ctx.textAlign = 'right';
    ctx.fillText('0', cx - 8, cy + 16);

    ctx.restore();
  }
}
