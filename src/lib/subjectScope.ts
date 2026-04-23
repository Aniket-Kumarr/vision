/**
 * Heuristic subject-scope detection. When the user types a topic into the wrong
 * workspace (e.g. "unit circle" in Physics) we'd rather catch it client-side and
 * offer to switch subjects than silently burn an API call on a mismatched lesson.
 *
 * These lists are intentionally narrow — only topics that are unambiguously one
 * subject. When in doubt we accept the input and let the server prompt handle it.
 */

const MATH_KEYWORDS: RegExp[] = [
  /\bunit circle\b/i,
  /\bpythagorean\b/i,
  /\blogarithm/i,
  /\bparabola/i,
  /\bquadratic\b/i,
  /\bderivative\b/i,
  /\bantiderivative\b/i,
  /\bintegral\b/i,
  /\bintegration\b/i,
  /\bdifferentiation\b/i,
  /\bpolynomial\b/i,
  /\bfactor(ing)?\b/i,
  /\btrigonometric identit/i,
  /\bsine wave/i,
  /\btangent line\b/i,
  /\bmatrix\b/i,
  /\bdeterminant\b/i,
  /\beigenvalue/i,
  /\bcomplex number/i,
  /\bprobability distribution/i,
  /\bcombinator/i,
];

const PHYSICS_KEYWORDS: RegExp[] = [
  /\bfree[- ]?body\b/i,
  /\bprojectile\b/i,
  /\bnewton'?s (first|second|third|1st|2nd|3rd)? ?law/i,
  /\bmomentum\b/i,
  /\bimpulse\b/i,
  /\b(kinetic|potential) energy\b/i,
  /\bconservation of energy\b/i,
  /\bcentripetal\b/i,
  /\bcircular motion\b/i,
  /\bharmonic motion\b/i,
  /\bpendulum\b/i,
  /\b(the )?spring[- ]mass\b/i,
  /\bhookes? ?law\b/i,
  /\bfriction\b/i,
  /\b(static|kinetic|rolling) friction\b/i,
  /\bnormal force\b/i,
  /\btorque\b/i,
  /\bangular velocity\b/i,
  /\bangular momentum\b/i,
  /\bgravitation/i,
  /\bfree[- ]?fall\b/i,
  /\belectric (field|charge)/i,
  /\bmagnetic field\b/i,
  /\bvoltage\b/i,
  /\bohm'?s law\b/i,
  /\brefraction\b/i,
  /\blongitudinal wave/i,
];

export type Subject = 'math' | 'physics';

export interface SubjectScopeResult {
  likelySubject: Subject | null;
  mismatch: boolean;
}

/**
 * Given what the user typed and their currently-active subject, return whether
 * the topic likely belongs to a different subject. Returns null `likelySubject`
 * if the topic is ambiguous or could fit either.
 */
export function detectSubjectScope(input: string, current: Subject): SubjectScopeResult {
  const text = input.trim();
  if (!text) return { likelySubject: null, mismatch: false };

  const isMath = MATH_KEYWORDS.some((re) => re.test(text));
  const isPhysics = PHYSICS_KEYWORDS.some((re) => re.test(text));

  // Ambiguous or matches both — don't flag.
  if (isMath === isPhysics) return { likelySubject: null, mismatch: false };

  const likelySubject: Subject = isMath ? 'math' : 'physics';
  return { likelySubject, mismatch: likelySubject !== current };
}
