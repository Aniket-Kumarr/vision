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

export type DrawingType =
  | 'axes'
  | 'line'
  | 'dashed_line'
  | 'circle'
  | 'arc'
  | 'rect'
  | 'triangle'
  | 'point'
  | 'arrow'
  | 'text'
  | 'curve'
  | 'shade'
  | 'angle_mark'
  | 'bracket';

export type Domain = 'algebra' | 'geometry' | 'trigonometry' | 'calculus' | 'statistics' | 'linear_algebra';
export type Strategy = 'decomposition' | 'transformation' | 'accumulation' | 'relationship';

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
  fontSize: number;
}

export interface CurveParams {
  fn: string;
  xMin: number;
  xMax: number;
  yScale: number;
  yOffset: number;
}

export interface ShadeParams {
  points: [number, number][];
  opacity: number;
}

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

export type DrawingParams =
  | AxesParams
  | LineParams
  | DashedLineParams
  | CircleParams
  | ArcParams
  | RectParams
  | TriangleParams
  | PointParams
  | ArrowParams
  | TextParams
  | CurveParams
  | ShadeParams
  | AngleMarkParams
  | BracketParams;

export interface Drawing {
  type: DrawingType;
  color: ChalkColor;
  params: DrawingParams;
  duration: number;
}

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
}
