import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Blueprint, Domain, Strategy } from '@/lib/types';
import { pruneOverlappingText } from '@/lib/blueprintPruning';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENERATION_MODEL = 'claude-sonnet-4-5';

/**
 * Hard cap on the LaTeX string accepted from the client.
 * Prevents runaway prompt-injection payloads and oversized API requests.
 */
const MAX_LATEX_LENGTH = 4000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Subject = 'math' | 'physics';

const MATH_INTRO = `You are a mathematical visualization engine for an interactive chalkboard animation app. The user has pasted a LaTeX equation. Your job is to identify what it represents, explain its meaning, and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.`;

const PHYSICS_INTRO = `You are a physics visualization engine for an interactive chalkboard animation app. The user has pasted a LaTeX equation. Your job is to identify what physical law or principle it represents, explain its physical meaning, and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.

IMPORTANT: Only create physics lessons. If the equation is clearly a pure math topic with no physical interpretation, reframe it with a physical application — e.g. a differential equation → wave equation; an integral → work as integral of force. Every lesson must show a physical scenario, quantity, or phenomenon, not abstract math.`;

function buildSystemPrompt(subject: Subject): string {
  const intro = subject === 'physics' ? PHYSICS_INTRO : MATH_INTRO;
  return `${intro}

Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation. Just the JSON.

The canvas is 800x600 pixels. Center is (400, 300).
Left edge is x=0, right edge is x=800.
Top edge is y=0, bottom edge is y=600.

JSON Schema:
{
  "title": "string",
  "domain": "algebra|geometry|trigonometry|calculus|statistics|linear_algebra|mechanics|waves|electromagnetism|thermodynamics|cell_biology|genetics|physiology|biochemistry|ecology|algorithms|data_structures|graph_theory|complexity|general",
  "strategy": "decomposition|transformation|accumulation|relationship",
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
            "COMMENT_text": "x, y, content (string), fontSize (number), anchor (optional: 'start' | 'middle' | 'end' — default 'start' places x at LEFT edge of text; use 'middle' to center at x)",
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
- For axes: place them so content fits on screen (cx/cy is the origin, xRange/yRange is how far each direction)`;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/**
 * Sanitise a user-supplied LaTeX string before it is interpolated into a prompt.
 * Removes ASCII control characters and trims whitespace. Returns null when the
 * value should be rejected outright.
 */
function sanitizeLatex(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LATEX_LENGTH) return null;
  // Strip ASCII control characters (0x00–0x1F, 0x7F) that have no place in a
  // LaTeX expression and can be used to manipulate multi-line prompts.
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

const VALID_DOMAINS_EXTRA = [
  'mechanics', 'waves', 'electromagnetism', 'thermodynamics',
  'cell_biology', 'genetics', 'physiology', 'biochemistry', 'ecology',
  'algorithms', 'data_structures', 'graph_theory', 'complexity',
  'general',
] as const;

const VALID_DOMAINS = new Set<Domain>([
  'algebra', 'geometry', 'trigonometry', 'calculus', 'statistics', 'linear_algebra',
  ...VALID_DOMAINS_EXTRA,
]);

const VALID_STRATEGIES = new Set<Strategy>([
  'decomposition',
  'transformation',
  'accumulation',
  'relationship',
]);

function validateBlueprint(value: unknown): Blueprint {
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
  pruneOverlappingText(value as Blueprint);
  return value as Blueprint;
}

function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function generateFromLatexWithClaude(latex: string, subject: Subject): Promise<Blueprint> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: GENERATION_MODEL,
        max_tokens: 8192,
        system: buildSystemPrompt(subject),
        messages: [
          {
            role: 'user',
            content: `Explain this LaTeX equation visually with a chalkboard lesson. Return ONLY the Blueprint JSON. Equation: $$${latex}$$`,
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
    const raw = body?.latex;
    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'latex is required and must be a string' }, { status: 400 });
    }
    const latex = sanitizeLatex(raw);
    if (!latex) {
      return NextResponse.json(
        { error: `latex must be between 1 and ${MAX_LATEX_LENGTH} characters` },
        { status: 400 },
      );
    }

    const subjectRaw = body?.subject;
    const subject: Subject =
      subjectRaw === 'physics' || subjectRaw === 'math' ? subjectRaw : 'math';

    // Custom topics need Claude; without a key we cannot serve anything.
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local (then restart pnpm dev) to generate a unique visualization.',
        },
        { status: 503 },
      );
    }

    const blueprint = await generateFromLatexWithClaude(latex, subject);
    return NextResponse.json({ blueprint });
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client.
    console.error('[/api/generate-from-latex] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
