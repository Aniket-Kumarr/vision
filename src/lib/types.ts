export type ChalkColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange' | 'pink' | 'cyan';

export const CHALK_COLORS: Record<ChalkColor, string> = {
  white: '#F5F0E8',
  yellow: '#FFE066',
  green: '#7FD97F',
  blue: '#6BBFFF',
  red: '#FF7F7F',
  orange: '#FFB347',
  pink: '#FF9ECD',
  cyan: '#7FFFEF',
};

export type Domain = 'algebra' | 'geometry' | 'trigonometry' | 'calculus' | 'statistics' | 'linear_algebra';
export type Strategy = 'decomposition' | 'transformation' | 'accumulation' | 'relationship';

export type DifficultyLevel = 'kid' | 'student' | 'college' | 'grad' | 'researcher';

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  kid: 'Kid (age 8)',
  student: 'Student (high school)',
  college: 'College (undergrad)',
  grad: 'Grad (master\'s)',
  researcher: 'Researcher',
};

// ---------------------------------------------------------------------------
// Per-drawing-type parameter shapes
// ---------------------------------------------------------------------------

export interface AxesParams {
  cx: number;
  cy: number;
  xRange: number;
  yRange: number;
  step: number;
}

export interface LineParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DashedLineParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Length of each dash in pixels. */
  dashLength: number;
}

export interface CircleParams {
  cx: number;
  cy: number;
  r: number;
}

export interface ArcParams {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
}

export interface RectParams {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: boolean;
}

export interface TriangleParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  fill: boolean;
}

export interface PointParams {
  x: number;
  y: number;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export interface ArrowParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextParams {
  x: number;
  y: number;
  content: string;
  /** Font size in pixels. Must be a positive integer. */
  fontSize: number;
}

export interface CurveParams {
  /** A JavaScript expression in `x` evaluated via `new Function`. E.g. `"x * x"`. */
  fn: string;
  xMin: number;
  xMax: number;
  yScale: number;
  yOffset: number;
}

export interface ShadeParams {
  /** At least 3 vertices forming a closed polygon. */
  points: [number, number][];
  /** Fill opacity between 0 and 1. */
  opacity: number;
}

/**
 * Draws a small arc to mark an angle at a vertex.
 * Structurally identical to ArcParams but kept separate so the discriminated
 * union on `Drawing` can route to the correct renderer function.
 */
export interface AngleMarkParams {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
}

export interface BracketParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'square' | 'curly';
}

// ---------------------------------------------------------------------------
// Discriminated union: `type` narrows `params` unambiguously
// ---------------------------------------------------------------------------

export type Drawing =
  | { type: 'axes';        color: ChalkColor; params: AxesParams;       duration: number }
  | { type: 'line';        color: ChalkColor; params: LineParams;        duration: number }
  | { type: 'dashed_line'; color: ChalkColor; params: DashedLineParams;  duration: number }
  | { type: 'circle';      color: ChalkColor; params: CircleParams;      duration: number }
  | { type: 'arc';         color: ChalkColor; params: ArcParams;         duration: number }
  | { type: 'rect';        color: ChalkColor; params: RectParams;        duration: number }
  | { type: 'triangle';    color: ChalkColor; params: TriangleParams;    duration: number }
  | { type: 'point';       color: ChalkColor; params: PointParams;       duration: number }
  | { type: 'arrow';       color: ChalkColor; params: ArrowParams;       duration: number }
  | { type: 'text';        color: ChalkColor; params: TextParams;        duration: number }
  | { type: 'curve';       color: ChalkColor; params: CurveParams;       duration: number }
  | { type: 'shade';       color: ChalkColor; params: ShadeParams;       duration: number }
  | { type: 'angle_mark';  color: ChalkColor; params: AngleMarkParams;   duration: number }
  | { type: 'bracket';     color: ChalkColor; params: BracketParams;     duration: number };

/** The discriminant: all valid drawing type strings. */
export type DrawingType = Drawing['type'];

/** Utility: extract the params type for a given DrawingType. */
export type ParamsFor<T extends DrawingType> = Extract<Drawing, { type: T }>['params'];

export interface Step {
  id: number;
  narration: string;
  drawings: Drawing[];
}

export interface Blueprint {
  title: string;
  domain: Domain;
  strategy: Strategy;
  steps: Step[];
  /**
   * Optional pre-cleaned Desmos-compatible LaTeX expressions for the
   * interactive panel. When present, /canvas prefers these over mining
   * equations from narration. Each string must be a single expression
   * parseable by Desmos's `setExpression({ latex })`. No \text, no
   * \begin{cases}, no prose.
   */
  desmosExpressions?: string[];
}

// ---------------------------------------------------------------------------
// Persona — "Explain it like…" narration voice
// ---------------------------------------------------------------------------

export type Persona = 'default' | 'feynman' | 'coach' | 'poet' | 'rapper' | 'grandma';

export const PERSONA_LABELS: Record<Persona, { label: string; oneLiner: string; icon: string }> = {
  default: { label: 'Default',  oneLiner: 'clear, visual, 3Blue1Brown-style',        icon: '✦' },
  feynman: { label: 'Feynman',  oneLiner: 'like Feynman — intuitive, story-first',   icon: '🧪' },
  coach:   { label: 'Coach',    oneLiner: 'like a coach — direct, punchy, hype',     icon: '📣' },
  poet:    { label: 'Poet',     oneLiner: 'like a poet — metaphors, cadence',        icon: '🪶' },
  rapper:  { label: 'Rapper',   oneLiner: 'like a rapper — rhythm + rhymes',         icon: '🎤' },
  grandma: { label: 'Grandma',  oneLiner: 'like grandma — gentle, warm, analogies',  icon: '🧶' },
};
