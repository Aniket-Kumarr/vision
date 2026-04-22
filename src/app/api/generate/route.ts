import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FIXTURES } from '@/lib/fixtures';
import { Blueprint, Domain, Strategy } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Model used for blueprint generation. Change here to update everywhere. */
const GENERATION_MODEL = 'claude-sonnet-4-5';

/**
 * Hard cap on the concept string accepted from the client.
 * Prevents runaway prompt-injection payloads and oversized API requests.
 */
const MAX_CONCEPT_LENGTH = 200;

/**
 * Milliseconds before we abort the Anthropic API call.
 * The Anthropic SDK respects an AbortSignal passed via `signal`.
 */
const API_TIMEOUT_MS = 30_000;

// NOTE — Rate limiting: this route has no per-IP or per-user rate limiting.
// In production, add a middleware layer (e.g. Upstash Ratelimit + Redis) before
// this handler to cap requests per minute per user/IP.

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a mathematical visualization engine for an interactive chalkboard animation app. Your job is to take any math concept and break it down into a step-by-step visual explanation that draws on a black chalkboard with colorful chalk.

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
- Make narration sound like 3Blue1Brown — intuitive, visual, elegant
- Focus on WHY it works visually, not symbolic manipulation
- Think like the Visual Math TikTok account — color-coded geometric decomposition
- Every step should have an 'aha moment' feeling
- duration must be between 600 and 2500 (milliseconds)
- For curve type: fn must be a valid JavaScript math expression using x (e.g. "Math.sin(x)", "x*x")
- Keep all drawings within canvas bounds (0-800 x, 0-600 y) with 20px margin
- For text: fontSize should be between 14 and 36
- For axes: place them so content fits on screen (cx/cy is the origin, xRange/yRange is how far each direction)`;

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const VALID_DOMAINS = new Set<Domain>([
  'algebra', 'geometry', 'trigonometry', 'calculus', 'statistics', 'linear_algebra',
]);

const VALID_STRATEGIES = new Set<Strategy>([
  'decomposition', 'transformation', 'accumulation', 'relationship',
]);

/**
 * Sanitise a user-supplied concept string before it is interpolated into a
 * prompt.  Removes ASCII control characters and trims whitespace.  Returns
 * null when the value should be rejected outright.
 */
function sanitizeConcept(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CONCEPT_LENGTH) return null;
  // Strip ASCII control characters (0x00–0x1F, 0x7F) that have no place in a
  // math concept name and can be used to manipulate multi-line prompts.
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate that a parsed Blueprint from the AI matches the TypeScript types
 * defined in types.ts at a structural level.  Throws a descriptive Error if
 * the object is malformed so the caller can decide how to handle the failure.
 */
function validateBlueprint(obj: unknown): Blueprint {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Blueprint is not an object');
  }
  const b = obj as Record<string, unknown>;

  if (typeof b.title !== 'string' || b.title.trim() === '') {
    throw new Error('Blueprint.title must be a non-empty string');
  }
  if (!VALID_DOMAINS.has(b.domain as Domain)) {
    throw new Error(`Blueprint.domain "${b.domain}" is not a valid Domain`);
  }
  if (!VALID_STRATEGIES.has(b.strategy as Strategy)) {
    throw new Error(`Blueprint.strategy "${b.strategy}" is not a valid Strategy`);
  }
  if (!Array.isArray(b.steps) || b.steps.length === 0 || b.steps.length > 6) {
    throw new Error('Blueprint.steps must be an array of 1–6 items');
  }
  for (let i = 0; i < b.steps.length; i++) {
    const step = b.steps[i] as Record<string, unknown>;
    if (typeof step.id !== 'number') throw new Error(`Step[${i}].id must be a number`);
    if (typeof step.narration !== 'string' || step.narration.trim() === '') {
      throw new Error(`Step[${i}].narration must be a non-empty string`);
    }
    if (!Array.isArray(step.drawings)) {
      throw new Error(`Step[${i}].drawings must be an array`);
    }
  }

  return obj as Blueprint;
}

function normalizeConceptKey(concept: string): string {
  return concept.toLowerCase().trim();
}

function findFixture(concept: string): Blueprint | null {
  const key = normalizeConceptKey(concept);
  if (FIXTURES[key]) return FIXTURES[key];

  // Fuzzy match
  for (const fixtureKey of Object.keys(FIXTURES)) {
    if (key.includes(fixtureKey) || fixtureKey.includes(key)) {
      return FIXTURES[fixtureKey];
    }
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
function streamingBlueprintResponse(concept: string): Response {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(streamController) {
      try {
        const anthropicStream = client.messages.stream(
          {
            model: GENERATION_MODEL,
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                // concept has already been sanitised by the POST handler.
                content: `Create a visual chalk explanation for: "${concept}"`,
              },
            ],
          },
          { signal: controller.signal },
        );

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            streamController.enqueue(encoder.encode(event.delta.text));
          }
        }

        streamController.close();
      } catch (err) {
        streamController.error(err);
      } finally {
        clearTimeout(timeoutId);
      }
    },
    cancel() {
      clearTimeout(timeoutId);
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      // Prevent buffering by proxies/CDNs during development.
      'X-Accel-Buffering': 'no',
    },
  });
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

    // In development, always use fixtures to avoid burning API credits.
    if (process.env.NODE_ENV === 'development') {
      const devFixture = findFixture(concept) ?? Object.values(FIXTURES)[0];
      return NextResponse.json({ blueprint: devFixture });
    }

    // Check fixtures first (avoids API call for well-known concepts).
    const fixture = findFixture(concept);
    if (fixture) {
      return NextResponse.json({ blueprint: fixture });
    }

    // No ANTHROPIC_API_KEY in env → fall back to nearest fixture or error.
    if (!process.env.ANTHROPIC_API_KEY) {
      const fallback = Object.values(FIXTURES)[0];
      return NextResponse.json({ blueprint: fallback });
    }

    // Happy path: stream the raw JSON text from Claude to the client.
    // The client concatenates all chunks, then parses the complete JSON.
    return streamingBlueprintResponse(concept);
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client — it can contain
    // internal paths, SDK version strings, or partial API responses.
    console.error('[/api/generate] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
