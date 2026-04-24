import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { DesmosSpec } from '@/lib/desmosSpec';
import { validateDesmosSpec } from '@/lib/desmosSpec';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENERATION_MODEL = 'claude-sonnet-4-5';
const MAX_CONCEPT_LENGTH = 8000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Subject = 'math' | 'physics';

const SYSTEM_PROMPT = `You are a Desmos graph designer that creates interactive animated visualizations for math and physics concepts.

Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation. Just the JSON.

Each concept you receive should be rendered as:
- A small set of Desmos expressions (LaTeX)
- 1 to 3 sliders that control meaningful parameters (e.g., amplitude, frequency, angle, mass, length, gravity)
- A keyframe-based animation plan that drives those sliders over time so a learner can press Play and watch the concept evolve.

JSON Schema (strict):
{
  "title": "string — short concept title",
  "expressions": [
    { "id": "e1", "latex": "string — Desmos LaTeX", "color": "#6BBFFF" (optional), "hidden": false (optional) }
  ],
  "sliders": [
    { "id": "s1", "name": "a", "min": 0, "max": 5, "step": 0.1, "initial": 1 }
  ],
  "animation": {
    "durationMs": 6000,
    "keyframes": [
      { "t": 0,   "values": { "a": 1, "b": 1 } },
      { "t": 0.5, "values": { "a": 3, "b": 2 } },
      { "t": 1,   "values": { "a": 1, "b": 1 } }
    ]
  },
  "viewport": { "xmin": -10, "xmax": 10, "ymin": -5, "ymax": 5 }
}

Rules:
- Slider "name" must be a single lowercase letter or short identifier usable in LaTeX (e.g. a, b, k, w, theta).
- Expression LaTeX must reference slider names by their identifier so moving a slider visibly changes the plot.
- Keyframe "values" keys MUST exactly match the slider "name" fields. Include every slider in every keyframe.
- Keyframes must start at t=0 and end at t=1. Use 2-5 keyframes total; they should tell a story (sweep one parameter, then the other).
- Slider initial must sit between min and max.
- durationMs should be between 3000 and 12000.
- Pick a viewport that frames the interesting region of the graph.
- Prefer 1-4 expressions total. Keep LaTeX valid for Desmos (use \\sin, \\cos, \\frac, \\sqrt, ^{...}).

Ground-truth examples you should be able to produce variants of:

1) Sine wave with amplitude A and frequency B:
{
  "title": "Sine wave: amplitude and frequency",
  "expressions": [{ "id": "e1", "latex": "y=A\\\\sin(Bx)", "color": "#6BBFFF" }],
  "sliders": [
    { "id": "s1", "name": "A", "min": 0.2, "max": 3, "step": 0.1, "initial": 1 },
    { "id": "s2", "name": "B", "min": 0.2, "max": 4, "step": 0.1, "initial": 1 }
  ],
  "animation": {
    "durationMs": 6000,
    "keyframes": [
      { "t": 0,    "values": { "A": 1, "B": 1 } },
      { "t": 0.33, "values": { "A": 3, "B": 1 } },
      { "t": 0.66, "values": { "A": 3, "B": 3 } },
      { "t": 1,    "values": { "A": 1, "B": 1 } }
    ]
  },
  "viewport": { "xmin": -10, "xmax": 10, "ymin": -4, "ymax": 4 }
}

2) Projectile launched at angle theta with speed v:
{
  "title": "Projectile motion: launch angle",
  "expressions": [{ "id": "e1", "latex": "y=x\\\\tan(\\\\theta)-\\\\frac{9.8x^{2}}{2v^{2}\\\\cos^{2}(\\\\theta)}", "color": "#FFB347" }],
  "sliders": [
    { "id": "s1", "name": "theta", "min": 0.1, "max": 1.5, "step": 0.05, "initial": 0.8 },
    { "id": "s2", "name": "v", "min": 5, "max": 20, "step": 0.5, "initial": 12 }
  ],
  "animation": {
    "durationMs": 6000,
    "keyframes": [
      { "t": 0,   "values": { "theta": 0.2, "v": 12 } },
      { "t": 0.5, "values": { "theta": 0.8, "v": 12 } },
      { "t": 1,   "values": { "theta": 1.4, "v": 12 } }
    ]
  },
  "viewport": { "xmin": 0, "xmax": 30, "ymin": 0, "ymax": 15 }
}

3) Pendulum angle over time with length L:
{
  "title": "Pendulum: length vs period",
  "expressions": [{ "id": "e1", "latex": "y=0.3\\\\cos\\\\left(\\\\sqrt{\\\\frac{9.8}{L}}x\\\\right)", "color": "#7FD97F" }],
  "sliders": [
    { "id": "s1", "name": "L", "min": 0.2, "max": 4, "step": 0.05, "initial": 1 }
  ],
  "animation": {
    "durationMs": 6000,
    "keyframes": [
      { "t": 0,   "values": { "L": 0.3 } },
      { "t": 0.5, "values": { "L": 2 } },
      { "t": 1,   "values": { "L": 0.3 } }
    ]
  },
  "viewport": { "xmin": 0, "xmax": 10, "ymin": -0.5, "ymax": 0.5 }
}

Now produce a DesmosSpec JSON object for the user's concept.`;

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/**
 * Sanitise a user-supplied concept string. Strips ASCII control characters and
 * enforces length bounds. Mirrors the approach in /api/generate.
 */
function sanitizeConcept(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CONCEPT_LENGTH) return null;
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function generateWithClaude(concept: string, subject: Subject): Promise<DesmosSpec> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: GENERATION_MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Create a Desmos animated-slider spec (${subject} subject) for: "${concept}"`,
          },
        ],
      });
      const text = response.content
        .filter((part) => part.type === 'text')
        .map((part) => ('text' in part ? part.text : ''))
        .join('\n')
        .trim();
      const parsed = parseModelJson(text);
      return validateDesmosSpec(parsed);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('Failed to generate a valid Desmos spec');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // --- Input validation & sanitisation ---
    const raw = body?.concept;
    if (!raw || typeof raw !== 'string') {
      return NextResponse.json(
        { error: 'concept is required and must be a string' },
        { status: 400 },
      );
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
            'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local (then restart pnpm dev).',
        },
        { status: 503 },
      );
    }

    const spec = await generateWithClaude(concept, subject);
    return NextResponse.json({ spec });
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client.
    console.error('[/api/desmos-spec] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
