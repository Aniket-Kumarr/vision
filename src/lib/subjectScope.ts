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

const MUSIC_KEYWORDS: RegExp[] = [
  /\bcircle of fifths?\b/i,
  /\bpentatonic\b/i,
  /\bchord\b/i,
  /\btriad\b/i,
  /\binterval\b/i,
  /\bsemitone\b/i,
  /\bmajor scale\b/i,
  /\bminor scale\b/i,
  /\bkey signature\b/i,
  /\btime signature\b/i,
  /\benharmonic\b/i,
  /\bmode(s)?\b/i,
  /\boctave\b/i,
  /\bnote (value|duration)\b/i,
  /\bstaff notation\b/i,
  /\bmelody\b/i,
  /\bharmony\b/i,
  /\bcounterpoint\b/i,
  /\barpeggio\b/i,
  /\bchord inversion\b/i,
  /\bperfect fifth\b/i,
  /\bmusic theory\b/i,
  /\bdorian\b/i,
  /\bphrygian\b/i,
  /\blydian\b/i,
  /\bmixolydian\b/i,
  /\baeolian\b/i,
  /\blocrian\b/i,
];

const CS_KEYWORDS: RegExp[] = [
  /\bsorting algorithm/i,
  /\bbubble sort\b/i,
  /\bquicksort\b/i,
  /\bmerge sort\b/i,
  /\binsertion sort\b/i,
  /\bselection sort\b/i,
  /\bheap sort\b/i,
  /\bbinary search\b/i,
  /\blinked list\b/i,
  /\bbinary tree\b/i,
  /\bBFS\b/,
  /\bDFS\b/,
  /\bbreadth.first\b/i,
  /\bdepth.first\b/i,
  /\bgraph traversal\b/i,
  /\bhash (table|map|collision)\b/i,
  /\brecursion tree\b/i,
  /\bdynamic programming\b/i,
  /\bbig.?O notation\b/i,
  /\btime complexity\b/i,
  /\bspace complexity\b/i,
  /\bstack (overflow|data structure)\b/i,
  /\bqueue data structure\b/i,
  /\bred.black tree\b/i,
  /\bavl tree\b/i,
  /\btrie\b/i,
  /\bheap data structure\b/i,
  /\bdijkstra\b/i,
  /\btopological sort\b/i,
  /\bpointer (arithmetic|chasing)\b/i,
  /\bmemoization\b/i,
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

export type Subject = 'math' | 'physics' | 'chemistry' | 'biology' | 'music' | 'cs';

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
  const isMusic = MUSIC_KEYWORDS.some((re) => re.test(text));
  const isCs = CS_KEYWORDS.some((re) => re.test(text));

  const matches = [isMath, isPhysics, isChemistry, isBiology, isMusic, isCs].filter(Boolean).length;
  // Ambiguous (matches multiple) or none — don't flag.
  if (matches !== 1) return { likelySubject: null, mismatch: false };

  const likelySubject: Subject = isMath
    ? 'math'
    : isPhysics
      ? 'physics'
      : isChemistry
        ? 'chemistry'
        : isBiology
          ? 'biology'
          : isMusic
            ? 'music'
            : 'cs';
  return { likelySubject, mismatch: likelySubject !== current };
}
