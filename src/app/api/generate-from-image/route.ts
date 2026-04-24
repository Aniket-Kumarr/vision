import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Blueprint, Domain, Strategy } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Model used for vision-based blueprint generation. */
const GENERATION_MODEL = 'claude-sonnet-4-5';

/** Hard cap on the image payload (bytes). Matches the client-side cap. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Optional concept hint the user may attach alongside the image. */
const MAX_HINT_LENGTH = 2000;

/** Accepted image MIME types — matches Anthropic SDK vision input. */
const ALLOWED_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

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

/**
 * Sanitise an optional concept hint before it is interpolated into the prompt.
 * SECURITY: strips ASCII control characters to prevent prompt-injection via
 * crafted newlines/escapes.
 */
function sanitizeHint(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.length === 0) return '';
  const capped = trimmed.slice(0, MAX_HINT_LENGTH);
  return capped.replace(/[\x00-\x1F\x7F]/g, '');
}

function isAllowedMediaType(t: string): t is AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(t);
}

async function generateFromImage(
  imageBase64: string,
  mediaType: AllowedMediaType,
  subject: Subject,
  hint: string,
): Promise<Blueprint> {
  const hintText = hint
    ? ` The user also provided this hint about the image: "${hint}".`
    : '';
  const userText =
    'Identify the math or physics concept in this image and produce a visual chalkboard explanation. ' +
    `The current workspace is ${subject}.${hintText} Return only the Blueprint JSON.`;

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
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: userText,
              },
            ],
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
    // Quick content-type guard so we can fail fast before buffering.
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data with an "image" field.' },
        { status: 400 },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
    }

    const file = form.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'image field is required.' }, { status: 400 });
    }

    // Size cap (server-side enforcement — mirrors the client cap).
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large. Maximum size is 10 MB.' },
        { status: 413 },
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'Image file is empty.' }, { status: 400 });
    }

    const mediaType = (file.type || '').toLowerCase();
    if (!isAllowedMediaType(mediaType)) {
      return NextResponse.json(
        { error: 'Unsupported image type. Use PNG, JPEG, WEBP, or GIF.' },
        { status: 415 },
      );
    }

    const subjectRaw = form.get('subject');
    const subject: Subject =
      subjectRaw === 'physics' || subjectRaw === 'math' ? subjectRaw : 'math';

    const hint = sanitizeHint(form.get('concept'));

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local (then restart pnpm dev) to analyze images.',
        },
        { status: 503 },
      );
    }

    // Buffer the file and encode as base64 for the Anthropic SDK.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageBase64 = Buffer.from(bytes).toString('base64');

    const blueprint = await generateFromImage(imageBase64, mediaType, subject, hint);
    return NextResponse.json({ blueprint });
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client; it can contain
    // internal paths, SDK version strings, or partial API responses.
    console.error('[/api/generate-from-image] unexpected error:', err);
    return NextResponse.json(
      { error: 'We could not read the image. Please try a clearer photo.' },
      { status: 500 },
    );
  }
}
