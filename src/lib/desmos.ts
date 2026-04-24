import type { Blueprint } from '@/lib/types';

/**
 * Minimal typings for the Desmos Graphing Calculator global. We only surface
 * the bits we actually call — the real API is larger.
 */
export interface DesmosCalculator {
  setExpression: (opts: {
    id: string;
    latex: string;
    color?: string;
    hidden?: boolean;
    sliderBounds?: { min?: string | number; max?: string | number; step?: string | number };
  }) => void;
  setExpressions?: (exprs: Array<{ id: string; latex: string }>) => void;
  setMathBounds: (bounds: { left: number; right: number; bottom: number; top: number }) => void;
  removeExpression?: (opts: { id: string }) => void;
  destroy: () => void;
}

export interface DesmosGlobal {
  GraphingCalculator: (
    el: HTMLElement,
    opts?: Record<string, unknown>,
  ) => DesmosCalculator;
}

declare global {
  interface Window {
    Desmos?: DesmosGlobal;
    __visuaAiDesmosLoading?: Promise<DesmosGlobal>;
  }
}

/**
 * Lazily inject the Desmos calculator.js script. Resolves with the global once
 * ready; rejects if no key is configured or the script fails to load.
 *
 * We dedupe in-flight loads via a window-scoped promise so multiple mounts of
 * the panel share the same script tag.
 */
export function loadDesmos(): Promise<DesmosGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Desmos can only load in the browser'));
  }
  if (window.Desmos) return Promise.resolve(window.Desmos);
  if (window.__visuaAiDesmosLoading) return window.__visuaAiDesmosLoading;

  const key = (process.env.NEXT_PUBLIC_DESMOS_API_KEY || '').trim();
  if (!key) {
    return Promise.reject(new Error('Missing NEXT_PUBLIC_DESMOS_API_KEY'));
  }

  const p = new Promise<DesmosGlobal>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.desmos.com/api/v1.10/calculator.js?apiKey=${encodeURIComponent(key)}`;
    s.async = true;
    s.onload = () => {
      if (window.Desmos) resolve(window.Desmos);
      else reject(new Error('Desmos script loaded but global missing'));
    };
    s.onerror = () => reject(new Error('Failed to load Desmos script'));
    document.head.appendChild(s);
  });
  window.__visuaAiDesmosLoading = p;
  return p;
}

/**
 * Canonical expressions for common concepts. If the user's topic/concept mentions
 * any of these keywords, we seed the Desmos panel with these so the button always
 * has something useful to show — even when the blueprint text doesn't spell the
 * equation out in a form our regex can parse.
 */
const TOPIC_SEEDS: Array<{ keywords: string[]; expressions: string[] }> = [
  { keywords: ['unit circle', 'unit-circle'], expressions: ['x^{2}+y^{2}=1', 'y=\\sin(x)', 'y=\\cos(x)'] },
  { keywords: ['sine', 'sin wave', 'sine wave'], expressions: ['y=\\sin(x)', 'y=A\\sin(Bx+C)'] },
  { keywords: ['cosine', 'cos '], expressions: ['y=\\cos(x)'] },
  { keywords: ['tangent', 'tan '], expressions: ['y=\\tan(x)'] },
  { keywords: ['trig', 'trigonometry'], expressions: ['y=\\sin(x)', 'y=\\cos(x)', 'y=\\tan(x)'] },
  { keywords: ['pythagor'], expressions: ['a^{2}+b^{2}=c^{2}'] },
  { keywords: ['parabola', 'quadratic'], expressions: ['y=ax^{2}+bx+c', 'y=x^{2}'] },
  { keywords: ['derivative'], expressions: ['y=x^{2}', "f'(x)=2x"] },
  { keywords: ['integral', 'integration'], expressions: ['y=x^{2}'] },
  { keywords: ['logarithm', 'log '], expressions: ['y=\\log(x)', 'y=\\ln(x)'] },
  { keywords: ['exponential'], expressions: ['y=e^{x}', 'y=2^{x}'] },
  { keywords: ['linear'], expressions: ['y=mx+b'] },
  { keywords: ['circle'], expressions: ['x^{2}+y^{2}=r^{2}'] },
  { keywords: ['ellipse'], expressions: ['\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1'] },
  { keywords: ['hyperbola'], expressions: ['\\frac{x^{2}}{a^{2}}-\\frac{y^{2}}{b^{2}}=1'] },
];

function seedsForTopic(topic: string): string[] {
  const t = topic.toLowerCase();
  const found = new Set<string>();
  for (const { keywords, expressions } of TOPIC_SEEDS) {
    if (keywords.some((k) => t.includes(k))) {
      for (const e of expressions) found.add(e);
    }
  }
  return Array.from(found);
}

/**
 * Heuristic pass over a blueprint to pull out equation-like strings we can feed
 * to Desmos. Scans `text` drawings, step narration, and the blueprint title for
 * anything that looks like `<lhs> = <rhs>` with recognizable math on both sides.
 *
 * Also seeds from the topic label so concepts that rarely spell out their
 * equations inline (unit circle, trig identities) still get a useful panel.
 */
export function extractExpressionsFromBlueprint(
  bp: Blueprint | null,
  topicHint?: string,
): string[] {
  if (!bp) return topicHint ? seedsForTopic(topicHint) : [];
  const found = new Set<string>();

  // 1. Topic-based seeds — broadest coverage, near-zero false positives.
  for (const s of seedsForTopic(topicHint || bp.title || '')) found.add(s);

  const candidates: string[] = [];
  if (bp.title) candidates.push(bp.title);
  for (const step of bp.steps) {
    if (step.narration) candidates.push(step.narration);
    for (const d of step.drawings) {
      if (d.type === 'text') {
        const p = d.params as { text?: string };
        if (p?.text) candidates.push(p.text);
      }
    }
  }

  // 2. Explicit `y = ...`, `f(x) = ...` style equations.
  const namedRe = /(?:^|[\s,(])((?:y|f\(x\)|g\(x\)|h\(x\))\s*=\s*[^.,\n;)]+)/gi;
  // 3. Generic `<lhs> = <rhs>` where both sides look like math (letters/digits/operators).
  const genericRe = /(?:^|[\s,(])([A-Za-z0-9^_+\-*/()\s]{1,20}=\s*[A-Za-z0-9^_+\-*/()\s.]{1,40})(?=[.,;)\n]|$)/g;

  for (const raw of candidates) {
    const text = raw.replace(/\s+/g, ' ').trim();
    let m: RegExpExecArray | null;
    while ((m = namedRe.exec(text)) !== null) {
      const expr = sanitizeToLatex(m[1]);
      if (expr) found.add(expr);
    }
    while ((m = genericRe.exec(text)) !== null) {
      const expr = sanitizeToLatex(m[1]);
      if (expr && looksLikeRealEquation(expr)) found.add(expr);
    }
  }

  return Array.from(found).slice(0, 6);
}

/**
 * Extra guard for the generic `lhs = rhs` matcher. Kills obvious false positives
 * like "step 1 = 2 things" or "angle = 30 degrees".
 */
function looksLikeRealEquation(s: string): boolean {
  if (!/=/.test(s)) return false;
  // Must contain at least one math-y character beyond the equals sign.
  if (!/[+\-*/^]|x|y|\\/.test(s)) return false;
  // Reject sentences: too many spaces means it's probably prose.
  if ((s.match(/\s/g) || []).length > 6) return false;
  return true;
}

/**
 * Convert a plain-text math expression into something Desmos's latex parser
 * will happily chew on. Handles the common cases we see from Claude output:
 *   x^2           -> x^{2}
 *   sqrt(x)       -> \sqrt{x}
 *   pi            -> \pi
 *   unicode super -> x^{2}
 * Returns empty string for expressions we can't confidently translate.
 */
function sanitizeToLatex(input: string): string {
  let s = input.trim();
  if (!s) return '';

  const superMap: Record<string, string> = {
    '²': '^{2}', '³': '^{3}', '⁴': '^{4}', '⁵': '^{5}',
    '⁶': '^{6}', '⁷': '^{7}', '⁸': '^{8}', '⁹': '^{9}', '⁰': '^{0}', '¹': '^{1}',
  };
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => superMap[c] ?? c);

  s = s.replace(/\bsqrt\(([^()]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/\bpi\b/gi, '\\pi');
  s = s.replace(/\btheta\b/gi, '\\theta');
  s = s.replace(/\^(-?\d+(?:\.\d+)?)/g, '^{$1}');

  // Reject anything with stray characters that will just render as an error.
  if (/[{}\\]/.test(s) === false && /[=+\-*/^]/.test(s) === false) return '';
  return s;
}
