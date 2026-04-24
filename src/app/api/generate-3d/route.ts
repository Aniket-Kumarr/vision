import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Scene3D } from '@/lib/types3d';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Model used for 3D scene generation. Matches /api/generate for parity. */
const GENERATION_MODEL = 'claude-sonnet-4-5';

/** Hard cap on the concept string — same semantics as /api/generate. */
const MAX_CONCEPT_LENGTH = 8000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Subject = 'math' | 'physics';

// ---------------------------------------------------------------------------
// Prompt — teaches the model our Scene3D schema and gives concrete examples.
// ---------------------------------------------------------------------------

function buildSystemPrompt(subject: Subject): string {
  const intro =
    subject === 'physics'
      ? `You are a 3D physics visualization engine for an interactive chalkboard app. Your job is to take a physics concept that benefits from spatial intuition (torque, angular momentum, rotating frames, electromagnetic fields, orbital motion) and render it as a 3D scene.`
      : `You are a 3D math visualization engine for an interactive chalkboard app. Your job is to take a math concept that lives naturally in three dimensions (vectors in R^3, surfaces z=f(x,y), solids of revolution, cross products, planes) and render it as a 3D scene.`;

  return `${intro}

Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation. Just the JSON.

Scene coordinates: world-space, unit-less. Keep values roughly in [-axes.range, +axes.range].

JSON Schema (Scene3D):
{
  "title": "string — short human-readable title",
  "axes": { "range": number (2..10), "step": number (0.5..2) },
  "points":   [ { "pos": [x,y,z], "label": "A", "color": "yellow" } ]?,
  "lines":    [ { "from": [x,y,z], "to": [x,y,z], "color": "white" } ]?,
  "vectors":  [ { "origin": [x,y,z], "direction": [dx,dy,dz], "color": "red", "label": "v" } ]?,
  "surfaces": [ { "fn": "x*x + y*y", "xMin": -2, "xMax": 2, "yMin": -2, "yMax": 2, "resolution": 30, "color": "cyan" } ]?
}

Colors: "white" | "yellow" | "green" | "blue" | "red" | "orange" | "cyan".

Critical rules:
- Output MUST match the schema exactly. Omit unused arrays entirely rather than sending [].
- For surfaces, fn MUST be a valid JavaScript expression in x and y using only arithmetic operators and the Math object (e.g. "Math.sin(x)*Math.cos(y)", "x*x - y*y"). No semicolons, no assignments, no function declarations.
- resolution should be 20-50. Higher = smoother but slower.
- Keep all coordinates within [-axes.range, +axes.range].
- Use color to separate meaning (e.g. two input vectors in blue/green, their cross product in red).
- Prefer 1-4 vectors and 0-2 surfaces — dense scenes become visually noisy.

Examples:

"cross product of two vectors" →
{
  "title": "Cross product a × b",
  "axes": { "range": 4, "step": 1 },
  "vectors": [
    { "origin": [0,0,0], "direction": [2,1,0], "color": "blue",  "label": "a" },
    { "origin": [0,0,0], "direction": [1,2,0], "color": "green", "label": "b" },
    { "origin": [0,0,0], "direction": [0,0,3], "color": "red",   "label": "a×b" }
  ]
}

"paraboloid z = x^2 + y^2" →
{
  "title": "Paraboloid z = x² + y²",
  "axes": { "range": 3, "step": 1 },
  "surfaces": [
    { "fn": "x*x + y*y", "xMin": -2, "xMax": 2, "yMin": -2, "yMax": 2, "resolution": 40, "color": "cyan" }
  ]
}

"plane through three points" →
{
  "title": "Plane through A, B, C",
  "axes": { "range": 4, "step": 1 },
  "points": [
    { "pos": [2,0,0], "label": "A", "color": "yellow" },
    { "pos": [0,2,0], "label": "B", "color": "yellow" },
    { "pos": [0,0,2], "label": "C", "color": "yellow" }
  ],
  "surfaces": [
    { "fn": "2 - x - y", "xMin": -1, "xMax": 3, "yMin": -1, "yMax": 3, "resolution": 20, "color": "cyan" }
  ]
}`;
}

// ---------------------------------------------------------------------------
// Input validation & sanitisation — mirrors /api/generate.
// ---------------------------------------------------------------------------

function sanitizeConcept(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CONCEPT_LENGTH) return null;
  // Strip ASCII control characters (0x00–0x1F, 0x7F) that have no place in a
  // concept name and can be used to manipulate multi-line prompts.
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

// ---------------------------------------------------------------------------
// Scene validation — structural checks so a malformed model response becomes
// a 502 instead of crashing the client renderer.
// ---------------------------------------------------------------------------

function isVec3(v: unknown): v is [number, number, number] {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

function validateScene(value: unknown): Scene3D {
  if (typeof value !== 'object' || value === null) throw new Error('Scene must be an object');
  const s = value as Record<string, unknown>;

  if (typeof s.title !== 'string' || !s.title.trim()) throw new Error('Scene title is required');

  const axes = s.axes as Record<string, unknown> | undefined;
  if (
    !axes ||
    typeof axes.range !== 'number' ||
    !Number.isFinite(axes.range) ||
    axes.range <= 0 ||
    axes.range > 50 ||
    typeof axes.step !== 'number' ||
    !Number.isFinite(axes.step) ||
    axes.step <= 0
  ) {
    throw new Error('Scene axes.range and axes.step must be positive numbers');
  }

  const validate = <T>(arr: unknown, label: string, check: (item: unknown) => T): T[] | undefined => {
    if (arr === undefined || arr === null) return undefined;
    if (!Array.isArray(arr)) throw new Error(`${label} must be an array`);
    return arr.map((item, i) => {
      try {
        return check(item);
      } catch (err) {
        throw new Error(
          `${label}[${i}] invalid: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    });
  };

  const points = validate(s.points, 'points', (item) => {
    const p = item as Record<string, unknown>;
    if (!isVec3(p.pos)) throw new Error('pos must be [x,y,z] numbers');
    return {
      pos: p.pos,
      label: typeof p.label === 'string' ? p.label : undefined,
      color: typeof p.color === 'string' ? p.color : undefined,
    };
  });

  const lines = validate(s.lines, 'lines', (item) => {
    const l = item as Record<string, unknown>;
    if (!isVec3(l.from)) throw new Error('from must be [x,y,z] numbers');
    if (!isVec3(l.to)) throw new Error('to must be [x,y,z] numbers');
    return {
      from: l.from,
      to: l.to,
      color: typeof l.color === 'string' ? l.color : undefined,
    };
  });

  const vectors = validate(s.vectors, 'vectors', (item) => {
    const v = item as Record<string, unknown>;
    if (!isVec3(v.origin)) throw new Error('origin must be [x,y,z] numbers');
    if (!isVec3(v.direction)) throw new Error('direction must be [x,y,z] numbers');
    return {
      origin: v.origin,
      direction: v.direction,
      color: typeof v.color === 'string' ? v.color : undefined,
      label: typeof v.label === 'string' ? v.label : undefined,
    };
  });

  const surfaces = validate(s.surfaces, 'surfaces', (item) => {
    const sf = item as Record<string, unknown>;
    if (typeof sf.fn !== 'string' || !sf.fn.trim()) throw new Error('fn must be a non-empty string');
    for (const key of ['xMin', 'xMax', 'yMin', 'yMax', 'resolution'] as const) {
      if (typeof sf[key] !== 'number' || !Number.isFinite(sf[key] as number)) {
        throw new Error(`${key} must be a finite number`);
      }
    }
    // Reject obvious JS escape attempts. This is a belt + suspenders check —
    // the client only evaluates fn in a browser sandbox, but stripping known
    // bad tokens keeps the surface area small.
    if (/[;{}`]|=>/.test(sf.fn as string)) {
      throw new Error('fn must be a pure expression (no ; { } ` or arrow functions)');
    }
    return {
      fn: sf.fn as string,
      xMin: sf.xMin as number,
      xMax: sf.xMax as number,
      yMin: sf.yMin as number,
      yMax: sf.yMax as number,
      resolution: sf.resolution as number,
      color: typeof sf.color === 'string' ? sf.color : undefined,
    };
  });

  const scene: Scene3D = {
    title: s.title,
    axes: { range: axes.range, step: axes.step },
    ...(points ? { points } : {}),
    ...(lines ? { lines } : {}),
    ...(vectors ? { vectors } : {}),
    ...(surfaces ? { surfaces } : {}),
  };

  // At least one piece of geometry is required — otherwise the scene is empty.
  if (!points && !lines && !vectors && !surfaces) {
    throw new Error('Scene must contain at least one of points, lines, vectors, or surfaces');
  }

  return scene;
}

async function generateWithClaude(concept: string, subject: Subject): Promise<Scene3D> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: GENERATION_MODEL,
        max_tokens: 2048,
        system: buildSystemPrompt(subject),
        messages: [
          {
            role: 'user',
            content: `Create a 3D chalkboard scene (${subject} subject) for: "${concept}"`,
          },
        ],
      });
      const text = response.content
        .filter((part) => part.type === 'text')
        .map((part) => ('text' in part ? part.text : ''))
        .join('\n')
        .trim();
      const parsed = parseModelJson(text);
      return validateScene(parsed);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('Failed to generate a valid scene');
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
      subjectRaw === 'physics' || subjectRaw === 'math' ? subjectRaw : 'math';

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            '3D generation is not configured. Add ANTHROPIC_API_KEY to .env.local (then restart pnpm dev) to generate a 3D scene for any topic you type.',
        },
        { status: 503 },
      );
    }

    const scene = await generateWithClaude(concept, subject);
    return NextResponse.json({ scene });
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client; it can contain
    // internal paths, SDK version strings, or partial API responses.
    console.error('[/api/generate-3d] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
