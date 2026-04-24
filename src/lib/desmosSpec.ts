/**
 * Shared types + validation + example specs for the Desmos AI Sliders feature.
 *
 * The DesmosSpec describes a playable, slider-driven graph the AI produces for a
 * concept. The validator is also run on the client when loading built-in examples
 * so a bad hand-written spec fails loudly.
 */

export interface DesmosExpressionSpec {
  id: string;
  latex: string;
  color?: string;
  hidden?: boolean;
}

export interface DesmosSliderSpec {
  id: string;
  /** Identifier used inside LaTeX expressions (e.g. "A", "theta"). */
  name: string;
  min: number;
  max: number;
  step: number;
  initial: number;
}

export interface DesmosKeyframe {
  /** Normalised time in [0, 1]. */
  t: number;
  /** Map of slider `name` -> value at this keyframe. */
  values: Record<string, number>;
}

export interface DesmosAnimationSpec {
  durationMs: number;
  keyframes: DesmosKeyframe[];
}

export interface DesmosViewport {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface DesmosSpec {
  title: string;
  expressions: DesmosExpressionSpec[];
  sliders: DesmosSliderSpec[];
  animation: DesmosAnimationSpec;
  viewport?: DesmosViewport;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Strictly validate a DesmosSpec. Rejects if keyframe value keys don't exactly
 * match the declared slider names. Throws a descriptive Error on any problem.
 */
export function validateDesmosSpec(value: unknown): DesmosSpec {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Spec must be an object');
  }
  const v = value as Record<string, unknown>;

  if (typeof v.title !== 'string' || !v.title.trim()) {
    throw new Error('Spec title is required');
  }

  if (!Array.isArray(v.expressions) || v.expressions.length === 0 || v.expressions.length > 8) {
    throw new Error('Spec must contain 1-8 expressions');
  }
  for (let i = 0; i < v.expressions.length; i++) {
    const e = v.expressions[i] as Record<string, unknown>;
    if (typeof e.id !== 'string' || !e.id.trim()) {
      throw new Error(`Expression ${i} is missing id`);
    }
    if (typeof e.latex !== 'string' || !e.latex.trim()) {
      throw new Error(`Expression ${i} is missing latex`);
    }
    if (e.color !== undefined && typeof e.color !== 'string') {
      throw new Error(`Expression ${i} has invalid color`);
    }
    if (e.hidden !== undefined && typeof e.hidden !== 'boolean') {
      throw new Error(`Expression ${i} has invalid hidden flag`);
    }
  }

  if (!Array.isArray(v.sliders) || v.sliders.length < 1 || v.sliders.length > 3) {
    throw new Error('Spec must contain 1-3 sliders');
  }
  const sliderNames = new Set<string>();
  for (let i = 0; i < v.sliders.length; i++) {
    const s = v.sliders[i] as Record<string, unknown>;
    if (typeof s.id !== 'string' || !s.id.trim()) {
      throw new Error(`Slider ${i} is missing id`);
    }
    if (typeof s.name !== 'string' || !s.name.trim()) {
      throw new Error(`Slider ${i} is missing name`);
    }
    if (!isFiniteNumber(s.min) || !isFiniteNumber(s.max) || !isFiniteNumber(s.step)) {
      throw new Error(`Slider ${i} has invalid numeric bounds`);
    }
    if (!isFiniteNumber(s.initial)) {
      throw new Error(`Slider ${i} has invalid initial value`);
    }
    if (s.max <= s.min) throw new Error(`Slider ${i}: max must be greater than min`);
    if (s.step <= 0) throw new Error(`Slider ${i}: step must be positive`);
    if (s.initial < s.min || s.initial > s.max) {
      throw new Error(`Slider ${i}: initial must be within [min, max]`);
    }
    if (sliderNames.has(s.name)) {
      throw new Error(`Duplicate slider name "${s.name as string}"`);
    }
    sliderNames.add(s.name);
  }

  const anim = v.animation as Record<string, unknown> | undefined;
  if (!anim || typeof anim !== 'object') {
    throw new Error('Spec animation is required');
  }
  if (!isFiniteNumber(anim.durationMs) || anim.durationMs < 500 || anim.durationMs > 60000) {
    throw new Error('animation.durationMs must be a number between 500 and 60000');
  }
  if (!Array.isArray(anim.keyframes) || anim.keyframes.length < 2) {
    throw new Error('animation must contain at least 2 keyframes');
  }
  let lastT = -Infinity;
  for (let i = 0; i < anim.keyframes.length; i++) {
    const k = anim.keyframes[i] as Record<string, unknown>;
    if (!isFiniteNumber(k.t) || k.t < 0 || k.t > 1) {
      throw new Error(`Keyframe ${i}: t must be in [0, 1]`);
    }
    if (k.t < lastT) {
      throw new Error(`Keyframe ${i}: t must be non-decreasing`);
    }
    lastT = k.t;
    const values = k.values as Record<string, unknown> | undefined;
    if (!values || typeof values !== 'object') {
      throw new Error(`Keyframe ${i}: values must be an object`);
    }
    const keyframeKeys = Object.keys(values);
    if (keyframeKeys.length !== sliderNames.size) {
      throw new Error(
        `Keyframe ${i}: value keys (${keyframeKeys.join(', ')}) must match slider names (${Array.from(sliderNames).join(', ')})`,
      );
    }
    for (const name of keyframeKeys) {
      if (!sliderNames.has(name)) {
        throw new Error(
          `Keyframe ${i}: unknown slider name "${name}" — declared sliders: ${Array.from(sliderNames).join(', ')}`,
        );
      }
      if (!isFiniteNumber(values[name])) {
        throw new Error(`Keyframe ${i}: value for "${name}" must be a finite number`);
      }
    }
  }
  if ((anim.keyframes[0] as DesmosKeyframe).t !== 0) {
    throw new Error('First keyframe t must be 0');
  }
  if ((anim.keyframes[anim.keyframes.length - 1] as DesmosKeyframe).t !== 1) {
    throw new Error('Last keyframe t must be 1');
  }

  if (v.viewport !== undefined) {
    const vp = v.viewport as Record<string, unknown>;
    if (
      !isFiniteNumber(vp.xmin) ||
      !isFiniteNumber(vp.xmax) ||
      !isFiniteNumber(vp.ymin) ||
      !isFiniteNumber(vp.ymax)
    ) {
      throw new Error('viewport must have finite xmin/xmax/ymin/ymax');
    }
    if (vp.xmax <= vp.xmin || vp.ymax <= vp.ymin) {
      throw new Error('viewport max must exceed min');
    }
  }

  return value as DesmosSpec;
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

/**
 * Sample every slider's value at normalised time `t` (in [0, 1]) using linear
 * interpolation between the two surrounding keyframes.
 */
export function sampleSliderValues(
  animation: DesmosAnimationSpec,
  t: number,
): Record<string, number> {
  const clamped = Math.max(0, Math.min(1, t));
  const frames = animation.keyframes;
  if (frames.length === 0) return {};
  if (clamped <= frames[0].t) return { ...frames[0].values };
  if (clamped >= frames[frames.length - 1].t) return { ...frames[frames.length - 1].values };

  let lo = 0;
  for (let i = 0; i < frames.length - 1; i++) {
    if (clamped >= frames[i].t && clamped <= frames[i + 1].t) {
      lo = i;
      break;
    }
  }
  const a = frames[lo];
  const b = frames[lo + 1];
  const span = b.t - a.t;
  const local = span > 0 ? (clamped - a.t) / span : 0;
  const out: Record<string, number> = {};
  for (const key of Object.keys(a.values)) {
    const av = a.values[key];
    const bv = b.values[key] ?? av;
    out[key] = av + (bv - av) * local;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Built-in example specs (offline fallbacks)
// ---------------------------------------------------------------------------

export const EXAMPLE_SPECS: Record<string, DesmosSpec> = {
  'sine-wave': {
    title: 'Sine wave: amplitude and frequency',
    expressions: [{ id: 'e1', latex: 'y=A\\sin(Bx)', color: '#6BBFFF' }],
    sliders: [
      { id: 's1', name: 'A', min: 0.2, max: 3, step: 0.1, initial: 1 },
      { id: 's2', name: 'B', min: 0.2, max: 4, step: 0.1, initial: 1 },
    ],
    animation: {
      durationMs: 6000,
      keyframes: [
        { t: 0, values: { A: 1, B: 1 } },
        { t: 0.33, values: { A: 3, B: 1 } },
        { t: 0.66, values: { A: 3, B: 3 } },
        { t: 1, values: { A: 1, B: 1 } },
      ],
    },
    viewport: { xmin: -10, xmax: 10, ymin: -4, ymax: 4 },
  },
  projectile: {
    title: 'Projectile motion: launch angle',
    expressions: [
      {
        id: 'e1',
        latex: 'y=x\\tan(t)-\\frac{9.8x^{2}}{2v^{2}\\cos^{2}(t)}',
        color: '#FFB347',
      },
    ],
    sliders: [
      { id: 's1', name: 't', min: 0.1, max: 1.5, step: 0.05, initial: 0.8 },
      { id: 's2', name: 'v', min: 5, max: 20, step: 0.5, initial: 12 },
    ],
    animation: {
      durationMs: 6000,
      keyframes: [
        { t: 0, values: { t: 0.2, v: 12 } },
        { t: 0.5, values: { t: 0.8, v: 12 } },
        { t: 1, values: { t: 1.4, v: 12 } },
      ],
    },
    viewport: { xmin: 0, xmax: 30, ymin: 0, ymax: 15 },
  },
  pendulum: {
    title: 'Pendulum: length vs period',
    expressions: [
      { id: 'e1', latex: 'y=0.3\\cos\\left(\\sqrt{\\frac{9.8}{L}}x\\right)', color: '#7FD97F' },
    ],
    sliders: [{ id: 's1', name: 'L', min: 0.2, max: 4, step: 0.05, initial: 1 }],
    animation: {
      durationMs: 6000,
      keyframes: [
        { t: 0, values: { L: 0.3 } },
        { t: 0.5, values: { L: 2 } },
        { t: 1, values: { L: 0.3 } },
      ],
    },
    viewport: { xmin: 0, xmax: 10, ymin: -0.5, ymax: 0.5 },
  },
};
