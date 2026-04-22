/** Suggestion chip labels (order = UI left-to-right). */
export const SUGGESTION_CHIPS = [
  'Unit Circle',
  'Pythagorean Theorem',
  'Derivatives',
  'Integrals',
  'Logarithms',
  'Parabolas',
  'Sine Waves',
  'Area Problems',
] as const;

/**
 * Rich prompts for suggestion chips so the model builds a visualization for that
 * exact topic (not a fuzzy fixture match).
 */
export const SUGGESTION_TO_PROMPT: Record<(typeof SUGGESTION_CHIPS)[number], string> = {
  'Unit Circle':
    'Visual chalkboard lesson on the unit circle: radius 1, angles in radians, coordinates (cos θ, sin θ), why the circle wraps sine/cosine, and one diagram showing a few angles and their (x,y) points on the circle.',
  'Pythagorean Theorem':
    'Visual chalkboard proof of the Pythagorean theorem a² + b² = c² for a right triangle: draw the triangle, squares on each side, and an area-based or dissection intuition (not just the formula).',
  Derivatives:
    'Visual lesson on derivatives as instantaneous slope: curve, secant lines approaching a tangent, small Δx and rise/run intuition, then one concrete example like y = x² with tangent at a point.',
  Integrals:
    'Visual lesson on integrals as signed area under a curve: graph a simple function, show rectangles (Riemann intuition), shaded region under the curve, and relate area to the antiderivative idea at a high level.',
  Logarithms:
    'Visual lesson on logarithms: log as the inverse of exponentiation, graph of y = ln(x) or y = log₂(x), how logs compress large numbers, and a simple number-line or area intuition for log rules (e.g. log(ab) = log a + log b) with pictures.',
  Parabolas:
    'Visual lesson on parabolas: standard y = ax² + bx + c shape, focus and directrix intuition (even if approximate), vertex, axis of symmetry, and how changing coefficients stretches/opens the curve.',
  'Sine Waves':
    'Visual lesson on sine waves: graph y = sin(x), period 2π, amplitude, phase shift sketch, and connect the wave to motion on the unit circle (height vs angle).',
  'Area Problems':
    'Visual lesson on area: break an irregular or composite shape into rectangles/triangles, show additivity of area, and solve one concrete “shaded region” problem with clear labeled dimensions.',
};

export function promptForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return t;
  if (t in SUGGESTION_TO_PROMPT) return SUGGESTION_TO_PROMPT[t as keyof typeof SUGGESTION_TO_PROMPT];
  return `Create a step-by-step visual chalkboard explanation (800×600 canvas) for: ${t}. Use labeled drawings, light graphs or geometry, and intuition, not long symbolic manipulation.`;
}

export function displayTopicForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return '';
  if (t in SUGGESTION_TO_PROMPT) return t;
  return t.length > 64 ? `${t.slice(0, 62)}…` : t;
}
