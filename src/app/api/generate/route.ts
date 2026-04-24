import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FIXTURES, MATH_FIXTURES, BIO_FIXTURES, CS_FIXTURES } from '@/lib/fixtures';
import { Blueprint, Domain, Persona, Strategy, DifficultyLevel } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Model used for blueprint generation. */
const GENERATION_MODEL = 'claude-sonnet-4-5';

/**
 * Hard cap on the concept string accepted from the client (includes rich chip prompts).
 * Prevents runaway prompt-injection payloads and oversized API requests.
 */
const MAX_CONCEPT_LENGTH = 8000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type Subject = 'math' | 'physics' | 'biology' | 'cs';

const MATH_INTRO = `You are a mathematical visualization engine for an interactive chalkboard animation app. Your job is to take any math concept and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.`;

const PHYSICS_INTRO = `You are a physics visualization engine for an interactive chalkboard animation app. Your job is to take any physics concept — forces, motion, energy, waves, momentum, circular motion — and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.

IMPORTANT: Only create physics lessons. If the topic is clearly a pure math topic with no physical interpretation (like "unit circle proof", "integration by parts", "derivative rules"), reframe it with a physical application — e.g. "unit circle" → circular motion; "derivative" → velocity as derivative of position; "integral" → work as integral of force. Every lesson must show a physical scenario, quantity, or phenomenon, not abstract math.`;

const BIOLOGY_INTRO = `You are a biology visualization engine for an interactive chalkboard animation app. Your job is to take any biology concept — cellular processes, organelles, metabolic cycles (Krebs, Calvin), genetics (Punnett squares, DNA), action potentials, ecology — and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.

Use the drawing primitives (line, circle, arc, text, arrow, shade, etc.) to render process diagrams, labeled organelles, cycle arrows, membrane cross-sections, and population charts. Focus on the story: WHY the process works the way it does, what each step accomplishes biologically — not rote memorization.`;

const CS_INTRO = `You are a computer science visualization engine for an interactive chalkboard animation app. Your job is to take any CS concept — sorting algorithms, graph traversal, recursion, data structures, hashing — and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.

DRAWING CONVENTIONS:
- Arrays: draw labeled rectangles in a row, one cell per element. Index labels below each cell.
- Linked lists: draw circles connected left-to-right with arrow primitives. Each circle holds a value.
- Trees: draw circles connected by lines, level by level top-to-bottom. Root at top center.
- Graphs: draw circles (nodes) as points spread across the canvas, connect them with line primitives. Edge weights as small text labels near the midpoint.
- Pointers / indices (low, high, mid, pivot): draw arrow primitives pointing at the relevant cell or node, with a text label beside the arrowhead.
- Recursion / call stack: draw indented layered rectangles, each labeled with the function call and its arguments.

COLOR ENCODING (strict — always follow):
- white: base structures, outlines, unvisited nodes, unprocessed array cells
- yellow: currently active element (the item being compared, the node being dequeued)
- green: confirmed sorted / visited / finalized element
- red: pivot element, swap arrows, the element causing a violation
- blue: secondary pointers (low pointer, left child, queue items waiting)
- orange: variables, unknowns, index labels
- cyan: queue contents, auxiliary structures

Each step narration must explain the algorithmic intuition — WHY the algorithm makes this choice, not just WHAT it does. Think like a brilliant CS professor: connect the local action to the global invariant the algorithm maintains.`;

export function buildSystemPrompt(subject: Subject): string {
  let intro: string;
  if (subject === 'physics') intro = PHYSICS_INTRO;
  else if (subject === 'biology') intro = BIOLOGY_INTRO;
  else if (subject === 'cs') intro = CS_INTRO;
  else intro = MATH_INTRO;
  return `${intro}

Adapt the narration style to the target audience. Use different language complexity and intuitive depth based on the specified difficulty level.

Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation. Just the JSON.

The canvas is 800x600 pixels. Center is (400, 300).
Left edge is x=0, right edge is x=800.
Top edge is y=0, bottom edge is y=600.

JSON Schema:
{
  "title": "string",
  "domain": "algebra|geometry|trigonometry|calculus|statistics|linear_algebra",
  "strategy": "decomposition|transformation|accumulation|relationship",
  "desmosExpressions": ["string (optional array of Desmos-compatible LaTeX — see rules below)"],
  "steps": [
    {
      "id": 1,
      "narration": "1-2 sentences, intuitive explanation like a brilliant teacher",
      "drawings": [
        {
          "type": "axes|line|dashed_line|circle|arc|rect|triangle|point|arrow|text|curve|shade|angle_mark|bracket",
          "color": "white|yellow|green|blue|red|orange|pink|cyan",
          "params": {
            "COMMENT_axes": "cx, cy, xRange, yRange, step",
            "COMMENT_line": "x1, y1, x2, y2",
            "COMMENT_dashed_line": "x1, y1, x2, y2, dashLength",
            "COMMENT_circle": "cx, cy, r",
            "COMMENT_arc": "cx, cy, r, startAngle, endAngle (radians)",
            "COMMENT_rect": "x, y, width, height, fill (boolean)",
            "COMMENT_triangle": "x1, y1, x2, y2, x3, y3, fill (boolean)",
            "COMMENT_point": "x, y, label (string), labelPosition (top|bottom|left|right)",
            "COMMENT_arrow": "x1, y1, x2, y2",
            "COMMENT_text": "x, y, content (string), fontSize (number)",
            "COMMENT_curve": "fn (js math expr using x), xMin, xMax, yScale, yOffset",
            "COMMENT_shade": "points ([[x,y],...]), opacity (0-1)",
            "COMMENT_angle_mark": "cx, cy, r, startAngle, endAngle (radians)",
            "COMMENT_bracket": "x1, y1, x2, y2, type (square|curly)"
          },
          "duration": 600
        }
      ]
    }
  ]
}

Critical rules:
- Maximum 6 steps per concept
- Each step ADDS to the canvas, previous drawings stay visible
- Use white for base structures and outlines
- Use yellow for key formulas and the most important insight
- Use green for final results and answers
- Use blue for secondary supporting elements
- Use red for critical highlights
- Use orange for variables and unknowns
- Make narration sound like 3Blue1Brown: intuitive, visual, elegant
- Focus on WHY it works visually, not symbolic manipulation
- Think like the Visual Math TikTok account: color-coded geometric decomposition
- Every step should have an 'aha moment' feeling
- duration must be between 600 and 2500 (milliseconds)
- For curve type: fn must be a valid JavaScript math expression using x (e.g. "Math.sin(x)", "x*x")
- Keep all drawings within canvas bounds (0-800 x, 0-600 y) with 20px margin
- For text: fontSize should be between 14 and 36
- For axes: place them so content fits on screen (cx/cy is the origin, xRange/yRange is how far each direction)

DESMOS LATEX RULES (for the desmosExpressions array — optional, up to 6 items):

DEFAULT IS OMIT. Only emit \`desmosExpressions\` when the concept produces a literal picture
when plotted on a 2D Cartesian graph — a curve, a conic, a point cloud, a parametric motion.
If the concept is a proof, an algorithm, a scaling relationship, a process diagram, a cycle,
a data structure, a molecule, a circuit, a biological pathway, or any symbolic formula where
the variables are *labels* rather than *coordinates*, OMIT THE FIELD ENTIRELY. A blank Desmos
panel is infinitely better than 6 undefined-variable warnings.

EXAMPLES OF WHEN TO OMIT (do not emit desmosExpressions for these):
- Parallel computing: T=S/R, S=W·H·B — these are rate formulas, not plottable curves
- Binary search, BFS, quicksort — algorithms, not graphs
- Krebs cycle, DNA replication — biology processes, not curves
- "Derivative rules", "limit definition" — the IDEAS are not graphs, though specific curves are
- Any formula with \`≈\`, "proportional to", or abstract symbols like entropy \`H\`, complexity \`O(n)\`

WHEN YOU DO EMIT, EVERY FREE VARIABLE EXCEPT x, y, t MUST HAVE A CONCRETE NUMERIC VALUE.
Desmos shows an orange triangle warning for every variable it doesn't have a value for. So if
your equation is \`y=A\\sin(Bx+C)+D\`, you MUST also emit \`A=1\`, \`B=1\`, \`C=0\`, \`D=0\` on
separate array entries. Never leave \`a\`, \`b\`, \`c\`, \`v_{0}\`, \`g\`, \`\\omega\`, \`\\theta\`,
or any other symbolic letter hanging — Desmos will flag all of them and the panel will be
six orange warning triangles (this happens constantly and must stop).

The FIRST entry should be the main curve (y=..., f(x)=..., or a conic like x^2+y^2=r^2).
Subsequent entries fill in concrete values for every variable used in the first entry.

ALLOWED in Desmos LaTeX:
- Variables: single letters \`x y t a b c n\`; multi-char names must be wrapped in a subscript (\`a_{0}\`).
- Operators: \`+ - * / = < > \\leq \\geq\`. Use \`*\` or juxtaposition for multiplication, never \`·\` or \`×\`.
- Superscripts / subscripts with braces: \`x^{2}\`, not \`x^2\`. \`a_{1}\`, not \`a1\`.
- Fractions: \`\\frac{num}{den}\`.
- Roots: \`\\sqrt{x}\`, \`\\sqrt[3]{x}\`.
- Trig: \`\\sin(x)\`, \`\\cos(x)\`, \`\\tan(x)\`, inverse as \`\\sin^{-1}(x)\`.
- Exponentials/logs: \`e^{x}\`, \`\\log(x)\`, \`\\ln(x)\`, \`\\log_{base}(x)\`.
- Greek letters: \`\\pi \\theta \\alpha \\beta \\omega\` etc.
- Sum/product: \`\\sum_{n=1}^{10}n^{2}\`, \`\\prod_{i=1}^{N}a_{i}\`.
- Integrals: \`\\int_{0}^{1}x^{2}dx\`.
- Absolute value: \`\\left|x\\right|\`.
- Piecewise: \`\\left\\{0 < x < 1: x, x\\right\\}\` (Desmos uses COLONS and COMMAS inside \\left\\{...\\right\\} — NEVER use \`\\begin{cases}\`).
- Points: \`(1, 2)\`. Lists: \`[1, 2, 3]\`.

FORBIDDEN (Desmos will silently refuse):
- \`\\text{...}\` — no text labels inside expressions
- \`\\begin{...}...\\end{...}\` — no LaTeX environments (no cases, align, matrix, etc.)
- Mixed identifiers like \`xy\` meaning "product" — Desmos reads that as a single 2-letter variable name and errors. Use \`x \\cdot y\` or \`x*y\`.
- Unicode math symbols (∑ ∫ √ π ≤ ≥ ≠) — always use the LaTeX command form.
- Units or prose inside expressions (no "m/s", no "meters").
- Multiple relations in one string: \`a = b = c\` — split into separate entries.
- Bare numbers with no equation — every entry must contain \`=\`, \`<\`, \`>\`, \`\\leq\`, or \`\\geq\`, OR be a function definition like \`f(x)=...\`, OR a point, OR a list.

EXAMPLES (math):
Unit circle → ["x^{2}+y^{2}=1", "y=\\sin(\\theta)", "y=\\cos(\\theta)"]
Quadratic → ["y=ax^{2}+bx+c", "y=x^{2}"]
Derivative of x² → ["y=x^{2}", "f'(x)=2x"]
Sine wave → ["y=A\\sin(Bx+C)+D", "A=1", "B=1", "C=0", "D=0"]

EXAMPLES (physics):
Projectile → ["y=v_{0}\\sin(\\theta)t-\\frac{1}{2}gt^{2}", "x=v_{0}\\cos(\\theta)t", "g=9.8", "\\theta=\\frac{\\pi}{4}", "v_{0}=20"]
SHM → ["x=A\\cos(\\omega t+\\phi)", "A=1", "\\omega=2\\pi", "\\phi=0"]

Validate each string mentally before emitting: if you are unsure it parses, OMIT it.`;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/**
 * Sanitise a user-supplied concept string before it is interpolated into a
 * prompt.  Removes ASCII control characters and trims whitespace.  Returns
 * null when the value should be rejected outright.
 */
export function sanitizeConcept(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CONCEPT_LENGTH) return null;
  // Strip ASCII control characters (0x00–0x1F, 0x7F) that have no place in a
  // math concept name and can be used to manipulate multi-line prompts.
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Sanitise an optional alternative hint hint for regeneration.
 * Max 500 chars; strips control characters.
 */
function sanitizeHint(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return null;
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

function normalizeConceptKey(concept: string): string {
  return concept.toLowerCase().trim();
}

/** Skip fuzzy fixture matching for long prompts (e.g. chip briefs) to avoid false positives like "antiderivative" matching "derivative". */
const MAX_FIXTURE_FUZZY_LEN = 140;

/** Per-subject fixture banks so a chemistry concept never accidentally matches a math fixture. */
const SUBJECT_FIXTURE_BANKS: Record<Subject, Record<string, Blueprint>> = {
  math: MATH_FIXTURES,
  physics: {},
  biology: BIO_FIXTURES,
  cs: CS_FIXTURES,
};

function findFixtureForSubject(concept: string, subject: Subject): Blueprint | null {
  const bank = SUBJECT_FIXTURE_BANKS[subject];
  const key = normalizeConceptKey(concept);
  if (bank[key]) return bank[key];

  if (key.length > MAX_FIXTURE_FUZZY_LEN) return null;

  const minLen = 6;
  for (const fixtureKey of Object.keys(bank)) {
    if (key.includes(fixtureKey) && fixtureKey.length >= minLen) return bank[fixtureKey];
    if (fixtureKey.includes(key) && key.length >= minLen) return bank[fixtureKey];
  }
  return null;
}

/**
 * Build a streaming Response that pipes Anthropic text-delta events directly
 * to the client as UTF-8 bytes.  The client concatenates the chunks and parses
 * the final JSON once the stream closes.
 *
 * A hard timeout is enforced via AbortController so a slow/hung API call does
 * not block a serverless function indefinitely.
 */
// ---------------------------------------------------------------------------
// Persona support
// ---------------------------------------------------------------------------

const VALID_PERSONAS = new Set<Persona>([
  'default',
  'feynman',
  'coach',
  'poet',
  'rapper',
  'grandma',
]);

/** Suffix appended to the USER turn only (keeps system-prompt cache hits). */
const PERSONA_SUFFIX: Record<Persona, string> = {
  default: '',
  feynman:
    'Narrate in Richard Feynman\'s voice: intuitive, story-like, analogies before symbols.',
  coach:
    'Narrate like an enthusiastic coach: direct, punchy, celebrate each step.',
  poet:
    'Narrate in a poetic voice: metaphors, cadence, short lines.',
  rapper:
    'Narrate with rhythm and internal rhyme — tasteful, not cringe. 1–2 bars per step.',
  grandma:
    'Narrate like a loving grandparent: patient, warm, everyday analogies, no jargon.',
};

const VALID_DOMAINS = new Set<Domain>([
  'algebra',
  'geometry',
  'trigonometry',
  'calculus',
  'statistics',
  'linear_algebra',
]);

const VALID_STRATEGIES = new Set<Strategy>([
  'decomposition',
  'transformation',
  'accumulation',
  'relationship',
]);

export function validateBlueprint(value: unknown): Blueprint {
  if (typeof value !== 'object' || value === null) throw new Error('Blueprint must be an object');
  const bp = value as Record<string, unknown>;
  if (typeof bp.title !== 'string' || !bp.title.trim()) throw new Error('Blueprint title is required');
  if (!VALID_DOMAINS.has(bp.domain as Domain)) throw new Error('Invalid blueprint domain');
  if (!VALID_STRATEGIES.has(bp.strategy as Strategy)) throw new Error('Invalid blueprint strategy');
  if (!Array.isArray(bp.steps) || bp.steps.length < 1 || bp.steps.length > 6) {
    throw new Error('Blueprint steps must contain 1-6 items');
  }
  for (let i = 0; i < bp.steps.length; i++) {
    const step = bp.steps[i] as Record<string, unknown>;
    if (typeof step.id !== 'number') throw new Error(`Step ${i + 1} has invalid id`);
    if (typeof step.narration !== 'string' || !step.narration.trim()) {
      throw new Error(`Step ${i + 1} has invalid narration`);
    }
    if (!Array.isArray(step.drawings)) throw new Error(`Step ${i + 1} drawings must be an array`);
  }
  // desmosExpressions is optional. If present, filter out any entries that
  // violate Desmos's known-unsupported features so the panel never receives
  // strings it will silently reject.
  if (bp.desmosExpressions !== undefined) {
    if (!Array.isArray(bp.desmosExpressions)) {
      // Wrong shape — drop the field rather than fail the whole blueprint.
      bp.desmosExpressions = [];
    } else {
      const perEntryValid = (bp.desmosExpressions as unknown[])
        .filter((e): e is string => typeof e === 'string')
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.length < 200 && isDesmosCompatibleLatex(e))
        .slice(0, 6);
      // Batch-level check: if any free variable in the set has no numeric
      // binding elsewhere in the array, drop the whole batch. Desmos flags
      // every undefined variable with an orange triangle and the panel
      // becomes useless. Better to show topic seeds than a wall of warnings.
      bp.desmosExpressions = haveAllFreeVariablesBound(perEntryValid) ? perEntryValid : [];
    }
  }
  return value as Blueprint;
}

/**
 * Conservative Desmos-LaTeX compatibility check. Rejects strings known to
 * silently fail in `calc.setExpression({ latex })`:
 *  - \\text{...} / \\begin{...} / unicode math / bare prose.
 * Accepts strings whose body contains at least one math relation or function
 * definition, matching the rules in the generation system prompt.
 */
function isDesmosCompatibleLatex(s: string): boolean {
  if (/\\text\s*\{/.test(s)) return false;
  if (/\\begin\s*\{/.test(s) || /\\end\s*\{/.test(s)) return false;
  // Unicode math operators — Desmos wants the LaTeX command form.
  if (/[∑∫√π≤≥≠÷×·∞∂∇]/.test(s)) return false;
  // Must contain a relation, a function definition, a point, or a list.
  const hasRelation = /[=<>]|\\leq\b|\\geq\b/.test(s);
  const looksLikePoint = /^\s*\(.+,.+\)\s*$/.test(s);
  const looksLikeList = /^\s*\[.+\]\s*$/.test(s);
  if (!hasRelation && !looksLikePoint && !looksLikeList) return false;
  return true;
}

/**
 * Variables Desmos treats as free plot axes — don't require bindings for these.
 * Everything else used in an expression must appear as the LHS of a `var = <literal>`
 * binding somewhere in the same array, or the whole array is scrapped.
 */
const DESMOS_FREE_AXES = new Set(['x', 'y', 't', 'r', '\\theta']);

function extractIdentifiers(latex: string): Set<string> {
  const ids = new Set<string>();
  // Subscripted identifiers: T_{total}, v_{0}, a_{i}, etc.
  const subRe = /([A-Za-z]|\\[a-zA-Z]+)_\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  let stripped = latex;
  while ((m = subRe.exec(latex)) !== null) {
    ids.add(`${m[1]}_{${m[2]}}`);
  }
  stripped = stripped.replace(subRe, ''); // remove to avoid double-counting the leading letter
  // Greek-letter macros.
  const greekRe = /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b/g;
  while ((m = greekRe.exec(stripped)) !== null) ids.add(`\\${m[1]}`);
  stripped = stripped.replace(greekRe, '');
  // Strip LaTeX command names (e.g. \sin, \cos, \frac) — they're functions, not variables.
  stripped = stripped.replace(/\\[a-zA-Z]+/g, '');
  // Remaining single letters are identifiers.
  const letterRe = /[A-Za-z]/g;
  while ((m = letterRe.exec(stripped)) !== null) ids.add(m[0]);
  return ids;
}

/**
 * Returns true when every free variable used anywhere in the expressions is
 * either a free axis (x, y, t, r, theta) or has a `var = <literal>` binding
 * elsewhere in the array. Conservative — false positives rarely matter since
 * Desmos falls back to the topic-seed mining path.
 */
function haveAllFreeVariablesBound(exprs: string[]): boolean {
  if (exprs.length === 0) return true;
  // Collect bindings: entries of the form `identifier = <numeric or simple literal>`.
  const bindings = new Set<string>();
  const bindingRe = /^\s*(\\?[A-Za-z]+(?:_\{[^}]+\})?)\s*=\s*(-?\d|\\frac|\\pi|\\sqrt)/;
  for (const e of exprs) {
    const m = bindingRe.exec(e);
    if (m) bindings.add(m[1]);
  }
  // Every other identifier must be either a free axis or bound.
  for (const e of exprs) {
    for (const id of extractIdentifiers(e)) {
      if (DESMOS_FREE_AXES.has(id)) continue;
      if (bindings.has(id)) continue;
      // Function-definition LHS like `f(x)` — single-letter function names
      // followed by `(` should not be treated as unbound variables.
      const isFunctionName = new RegExp(`\\b${id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\(`).test(e);
      if (isFunctionName) continue;
      return false;
    }
  }
  return true;
}

export function getDifficultyLevelSuffix(level: DifficultyLevel): string {
  const suffixes: Record<DifficultyLevel, string> = {
    kid: 'Target audience: 8-year-old child — use simple words, everyday analogies, and lots of visual excitement. No formulas. Focus on wonder and intuition.',
    student: 'Target audience: high school student — use accessible language with some technical terms, basic formulas, and clear step-by-step logic.',
    college: 'Target audience: college undergraduate — use precise mathematical/scientific terms, explain the why and how with rigor, include key formulas.',
    grad: 'Target audience: graduate student — assume strong background, use advanced terminology, emphasize conceptual depth, proofs and derivations welcome.',
    researcher: 'Target audience: research mathematician/physicist — use rigorous notation, assume full technical fluency, focus on deep insights and generalizations.',
  };
  return suffixes[level];
}

export function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function generateWithClaude(
  concept: string,
  subject: Subject,
  level: DifficultyLevel = 'college',
  persona: Persona = 'default',
  alternativeHint?: string,
): Promise<Blueprint> {
  let lastErr: unknown = null;
  const suffix = PERSONA_SUFFIX[persona];
  const difficultyPrompt = getDifficultyLevelSuffix(level);
  const baseContent = alternativeHint
    ? `Create a visual chalk explanation (${subject} subject) for: "${concept}". ${alternativeHint}`
    : `Create a visual chalk explanation (${subject} subject) for: "${concept}"`;
  const userContent = suffix
    ? `${baseContent}\n\n${difficultyPrompt}\n\n${suffix}`
    : `${baseContent}\n\n${difficultyPrompt}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: GENERATION_MODEL,
        // 8192 was 4096 — the added Desmos-LaTeX prompt section plus the
        // optional desmosExpressions array occasionally pushed Sonnet past
        // the old cap, truncating JSON mid-string and causing a 500.
        max_tokens: 8192,
        system: buildSystemPrompt(subject),
        messages: [
          {
            role: 'user',
            content: userContent,
          },
        ],
      });
      const text = response.content
        .filter((part) => part.type === 'text')
        .map((part) => ('text' in part ? part.text : ''))
        .join('\n')
        .trim();
      const parsed = parseModelJson(text);
      return validateBlueprint(parsed);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('Failed to generate a valid blueprint');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // --- Input validation & sanitisation ---
    // SECURITY: sanitizeConcept strips control characters and enforces a length
    // cap, preventing prompt-injection via crafted newlines/escapes and
    // oversized payloads that could inflate API costs.
    const raw = body?.concept;
    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'concept is required and must be a string' }, { status: 400 });
    }
    const concept = sanitizeConcept(raw);
    if (!concept) {
      return NextResponse.json(
        { error: `concept must be between 1 and ${MAX_CONCEPT_LENGTH} characters` },
        { status: 400 },
      );
    }

    const subjectRaw = body?.subject;
    const subject: Subject =
      subjectRaw === 'physics'
        ? 'physics'
        : subjectRaw === 'biology'
          ? 'biology'
          : subjectRaw === 'cs'
            ? 'cs'
            : 'math';

    const levelRaw = body?.level;
    const validLevels = new Set<DifficultyLevel>(['kid', 'student', 'college', 'grad', 'researcher']);
    const level: DifficultyLevel = validLevels.has(levelRaw as DifficultyLevel) ? (levelRaw as DifficultyLevel) : 'college';

    // Persona: optional, defaults to 'default', validated against the literal union.
    const personaRaw = body?.persona;
    const persona: Persona =
      typeof personaRaw === 'string' && VALID_PERSONAS.has(personaRaw as Persona)
        ? (personaRaw as Persona)
        : 'default';

    // Optional: force fixtures only (no API), useful for offline demos.
    // Set VISUA_AI_USE_FIXTURES_ONLY=1 in .env.local
    if (process.env.VISUA_AI_USE_FIXTURES_ONLY === '1') {
      const onlyFixture = findFixtureForSubject(concept, subject) ?? Object.values(FIXTURES)[0];
      return NextResponse.json({ blueprint: onlyFixture });
    }

    const alternativeHintEarly = sanitizeHint(body?.alternativeHint);
    // Check subject-scoped fixtures first (avoids API call for well-known concepts).
    // Physics has no fixtures — always go to the API for physics.
    // When a non-default persona is requested or alternativeHint present,
    // skip fixtures so the narration is actually regenerated.
    if (subject !== 'physics' && persona === 'default' && !alternativeHintEarly) {
      const fixture = findFixtureForSubject(concept, subject);
      if (fixture) {
        return NextResponse.json({ blueprint: fixture });
      }
    }

    // Custom topics need Claude; without a key we only serve pre-built fixtures above.
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local (then restart pnpm dev) to generate a unique visualization for any topic you type.',
        },
        { status: 503 },
      );
    }

    const blueprint = await generateWithClaude(concept, subject, level, persona, alternativeHintEarly ?? undefined);
    return NextResponse.json({ blueprint });
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client; it can contain
    // internal paths, SDK version strings, or partial API responses.
    console.error('[/api/generate] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
