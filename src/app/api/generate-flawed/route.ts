import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Blueprint, Domain, Strategy } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENERATION_MODEL = 'claude-sonnet-4-5';
const MAX_CONCEPT_LENGTH = 8000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Subject = 'math' | 'physics';

const MATH_INTRO = `You are a mathematical visualization engine for an interactive chalkboard animation app. Your job is to take any math concept and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.`;

const PHYSICS_INTRO = `You are a physics visualization engine for an interactive chalkboard animation app. Your job is to take any physics concept — forces, motion, energy, waves, momentum, circular motion — and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.

IMPORTANT: Only create physics lessons. If the topic is clearly a pure math topic with no physical interpretation (like "unit circle proof", "integration by parts", "derivative rules"), reframe it with a physical application — e.g. "unit circle" → circular motion; "derivative" → velocity as derivative of position; "integral" → work as integral of force. Every lesson must show a physical scenario, quantity, or phenomenon, not abstract math.`;

function buildSystemPrompt(subject: Subject): string {
  const intro = subject === 'physics' ? PHYSICS_INTRO : MATH_INTRO;
  return `${intro}

Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation. Just the JSON.

The canvas is 800x600 pixels. Center is (400, 300).
Left edge is x=0, right edge is x=800.
Top edge is y=0, bottom edge is y=600.

JSON Schema:
{
  "blueprint": {
    "title": "string",
    "domain": "algebra|geometry|trigonometry|calculus|statistics|linear_algebra",
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
  },
  "flawedStepId": 3,
  "correctNarration": "The corrected version of the flawed step's narration",
  "explanation": "1-2 sentences explaining what the flaw is and why it is wrong."
}

Critical rules for the blueprint:
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

Critical rules for the flaw:
- Insert EXACTLY one subtle, plausible error in the narration or a drawing parameter of ONE chosen step.
- The flaw must be catchable by a careful reader, but not immediately obvious — a wrong sign, off-by-one, swapped variable names, or a small numerical mistake.
- Do NOT insert the flaw in step 1 (too easy to spot as the entry point).
- The flaw should be in the narration text of the chosen step (preferred) or a numeric parameter.
- The flawedStepId must be the step id (1-based) of the step that contains the flaw.
- correctNarration must be the fully corrected narration for that step (no flaw).
- explanation must be 1-2 sentences describing what the flaw is and why it is wrong.`;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function sanitizeConcept(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CONCEPT_LENGTH) return null;
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

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

interface FlawedResponse {
  blueprint: Blueprint;
  flawedStepId: number;
  correctNarration: string;
  explanation: string;
}

async function generateFlawedWithClaude(concept: string, subject: Subject): Promise<FlawedResponse> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: GENERATION_MODEL,
        max_tokens: 4096,
        system: buildSystemPrompt(subject),
        messages: [
          {
            role: 'user',
            content: `Create a visual chalk explanation (${subject} subject) for: "${concept}". Remember to insert exactly one subtle flaw in one step (not step 1), and return the full JSON with blueprint, flawedStepId, correctNarration, and explanation.`,
          },
        ],
      });
      const text = response.content
        .filter((part) => part.type === 'text')
        .map((part) => ('text' in part ? part.text : ''))
        .join('\n')
        .trim();
      const parsed = parseModelJson(text) as Record<string, unknown>;

      // Validate the outer shape
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Response must be an object');
      }
      if (!('blueprint' in parsed)) throw new Error('Response missing blueprint');
      if (typeof parsed.flawedStepId !== 'number') throw new Error('Response missing flawedStepId');
      if (typeof parsed.correctNarration !== 'string' || !parsed.correctNarration.trim()) {
        throw new Error('Response missing correctNarration');
      }
      if (typeof parsed.explanation !== 'string' || !parsed.explanation.trim()) {
        throw new Error('Response missing explanation');
      }

      const blueprint = validateBlueprint(parsed.blueprint);

      return {
        blueprint,
        flawedStepId: parsed.flawedStepId as number,
        correctNarration: parsed.correctNarration as string,
        explanation: parsed.explanation as string,
      };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('Failed to generate a valid flawed blueprint');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

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
      subjectRaw === 'physics' || subjectRaw === 'math' ? subjectRaw : 'math';

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local (then restart pnpm dev) to use challenge mode.',
        },
        { status: 503 },
      );
    }

    const result = await generateFlawedWithClaude(concept, subject);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/generate-flawed] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
