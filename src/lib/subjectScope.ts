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

export type Subject = 'math' | 'physics' | 'chemistry' | 'biology';

export interface SubjectScopeResult {
  likelySubject: Subject | null;
  mismatch: boolean;
}

const CHEMISTRY_KEYWORDS: RegExp[] = [
  /\borbit(al)?s?\b/i,
  /\bhybridiz/i,
  /\bsp[123] ?\b/i,
  /\btitrat/i,
  /\breaction mechanism/i,
  /\bnucleophil/i,
  /\belectrophil/i,
  /\bvalence\b/i,
  /\bperiodic table\b/i,
  /\bmolecular\b/i,
  /\bchemical bond/i,
  /\bstoichiometr/i,
  /\bacid.?base\b/i,
  /\bpH\b/,
  /\bbuffer solution/i,
  /\bequilibrium constant/i,
];

const BIOLOGY_KEYWORDS: RegExp[] = [
  /\baction potential\b/i,
  /\bkrebs cycle\b/i,
  /\bcitric acid cycle\b/i,
  /\bpunnett\b/i,
  /\bgenotype\b/i,
  /\bphenotype\b/i,
  /\bDNA replication\b/i,
  /\bcell membrane\b/i,
  /\borganell/i,
  /\bphotosynthesis\b/i,
  /\bosmosis\b/i,
  /\bnatural selection\b/i,
  /\bevolution\b/i,
  /\bneuron\b/i,
  /\bmitosis\b/i,
  /\bmeiosis\b/i,
];

/**
 * Given what the user typed and their currently-active subject, return whether
 * the topic likely belongs to a different subject. Returns null `likelySubject`
 * if the topic is ambiguous or could fit multiple subjects.
 */
export function detectSubjectScope(input: string, current: Subject): SubjectScopeResult {
  const text = input.trim();
  if (!text) return { likelySubject: null, mismatch: false };

  const isMath = MATH_KEYWORDS.some((re) => re.test(text));
  const isPhysics = PHYSICS_KEYWORDS.some((re) => re.test(text));
  const isChemistry = CHEMISTRY_KEYWORDS.some((re) => re.test(text));
  const isBiology = BIOLOGY_KEYWORDS.some((re) => re.test(text));

  const matches = [isMath, isPhysics, isChemistry, isBiology].filter(Boolean).length;
  // Ambiguous (matches multiple) or none — don't flag.
  if (matches !== 1) return { likelySubject: null, mismatch: false };

  const likelySubject: Subject = isMath
    ? 'math'
    : isPhysics
      ? 'physics'
      : isChemistry
        ? 'chemistry'
        : 'biology';
  return { likelySubject, mismatch: likelySubject !== current };
}
