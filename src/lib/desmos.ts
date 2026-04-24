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
  // Every return path funnels through applyDesmosGuardrails so the panel
  // NEVER receives expressions that violate Desmos's parser or leave
  // variables unbound. See applyDesmosGuardrails below for the full ruleset.

  if (!bp) {
    return applyDesmosGuardrails(topicHint ? seedsForTopic(topicHint) : []);
  }

  // 0. Claude emitted pre-cleaned Desmos expressions. These have already
  //    passed the server-side version of the same guardrail, but we re-run
  //    client-side defence in depth — a dev running the older server build
  //    or a fixture/cached blueprint might still carry noisy entries.
  if (bp.desmosExpressions && bp.desmosExpressions.length > 0) {
    const guarded = applyDesmosGuardrails(bp.desmosExpressions);
    if (guarded.length > 0) return guarded.slice(0, 6);
    // If Claude's emissions don't pass the guard, fall through to mining.
  }

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

  return applyDesmosGuardrails(Array.from(found)).slice(0, 6);
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

// ---------------------------------------------------------------------------
// Shared guardrails — "Play with it" panel runs every expression it is about
// to send into Desmos through these checks, no matter where the expression
// came from (Claude's desmosExpressions, regex-mined from narration, or a
// TOPIC_SEEDS fallback). Mirrors the server-side validator in the generate
// route but lives client-side so the panel itself is the final gate.
// ---------------------------------------------------------------------------

/** Desmos axis variables that don't need a numeric binding. */
const DESMOS_FREE_AXES = new Set(['x', 'y', 't', 'r', '\\theta']);

/**
 * Reject strings Desmos's LaTeX parser will silently refuse. Same ruleset as
 * the server validator so behavior is symmetric.
 */
export function isDesmosCompatibleLatex(s: string): boolean {
  if (!s || s.length > 200) return false;
  if (/\\text\s*\{/.test(s)) return false;
  if (/\\begin\s*\{/.test(s) || /\\end\s*\{/.test(s)) return false;
  if (/[∑∫√π≤≥≠÷×·∞∂∇]/.test(s)) return false;
  const hasRelation = /[=<>]|\\leq\b|\\geq\b/.test(s);
  const looksLikePoint = /^\s*\(.+,.+\)\s*$/.test(s);
  const looksLikeList = /^\s*\[.+\]\s*$/.test(s);
  if (!hasRelation && !looksLikePoint && !looksLikeList) return false;
  return true;
}

function extractIdentifiers(latex: string): Set<string> {
  const ids = new Set<string>();
  let stripped = latex;
  // Subscripted: T_{total}, v_{0}, etc.
  const subRe = /([A-Za-z]|\\[a-zA-Z]+)_\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = subRe.exec(latex)) !== null) ids.add(`${m[1]}_{${m[2]}}`);
  stripped = stripped.replace(subRe, '');
  // Greek.
  const greekRe = /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b/g;
  while ((m = greekRe.exec(stripped)) !== null) ids.add(`\\${m[1]}`);
  stripped = stripped.replace(greekRe, '');
  // LaTeX command names (functions): \sin, \cos, \frac, \sqrt, \ln, \log.
  stripped = stripped.replace(/\\[a-zA-Z]+/g, '');
  // Remaining single letters.
  const letterRe = /[A-Za-z]/g;
  while ((m = letterRe.exec(stripped)) !== null) ids.add(m[0]);
  return ids;
}

/**
 * Run the final array of expressions through the same "every free variable
 * is bound" check the server uses for Claude's desmosExpressions. Returns a
 * filtered array — the whole batch is dropped if any variable is unbound,
 * because a partial set of expressions with orange triangles is worse than
 * an empty panel.
 */
export function applyDesmosGuardrails(exprs: string[]): string[] {
  // 1. Per-entry syntax check.
  const perEntryOk = exprs.filter((e) => isDesmosCompatibleLatex(e));
  if (perEntryOk.length === 0) return [];

  // 2. Collect bindings: entries of the form `identifier = <numeric literal>`.
  const bindings = new Set<string>();
  const bindingRe = /^\s*(\\?[A-Za-z]+(?:_\{[^}]+\})?)\s*=\s*(-?\d|\\frac|\\pi|\\sqrt)/;
  for (const e of perEntryOk) {
    const m = bindingRe.exec(e);
    if (m) bindings.add(m[1]);
  }

  // 3. Every identifier used must be a free axis, a bound variable, or a
  //    function-definition LHS (e.g. `f(x)=...`).
  for (const e of perEntryOk) {
    for (const id of extractIdentifiers(e)) {
      if (DESMOS_FREE_AXES.has(id)) continue;
      if (bindings.has(id)) continue;
      const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isFunctionName = new RegExp(`\\b${esc}\\s*\\(`).test(e);
      if (isFunctionName) continue;
      // Unbound identifier somewhere — scrap the whole batch.
      return [];
    }
  }
  return perEntryOk;
}
