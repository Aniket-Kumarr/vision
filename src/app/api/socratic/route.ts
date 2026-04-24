import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Blueprint } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL = 'claude-sonnet-4-5';

/** Max length for user-supplied answer text. */
const MAX_ANSWER_LENGTH = 2000;
/** Max length for the question/expectedIntuition strings echoed back by the client. */
const MAX_ROUND_TRIP_LENGTH = 1000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------------------------------------
// Input sanitisation helpers (mirrors /api/generate pattern)
// ---------------------------------------------------------------------------

/** Strip ASCII control characters (0x00–0x1F, 0x7F) and trim. Returns null if empty or too long. */
function sanitizeText(raw: unknown, maxLen: number): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return null;
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

// ---------------------------------------------------------------------------
// Blueprint validation (lightweight — we only need steps/narrations)
// ---------------------------------------------------------------------------

function isValidBlueprint(value: unknown): value is Blueprint {
  if (!value || typeof value !== 'object') return false;
  const bp = value as Record<string, unknown>;
  return (
    typeof bp.title === 'string' &&
    Array.isArray(bp.steps) &&
    bp.steps.length >= 1 &&
    bp.steps.length <= 6
  );
}

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

const ASK_SYSTEM = `You are a warm, Socratic math and physics tutor. Your job is to ask ONE short prediction question that probes a learner's intuition just before they see the next step in an animated chalkboard lesson.

Rules:
- Ask only about intuition and prediction — NOT symbol manipulation or calculation.
- The question should be answerable in 1–3 sentences by someone who has watched the previous steps.
- Keep the question under 120 characters when possible.
- Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation.

JSON Schema:
{
  "question": "string — the prediction question",
  "expectedIntuition": "string — 1-2 sentences describing the key insight a correct answer should capture"
}`;

const EVALUATE_SYSTEM = `You are a warm, encouraging Socratic tutor evaluating a learner's prediction in a chalkboard lesson. Be kind and specific.

Rules:
- verdict must be exactly one of: "correct", "partial", "wrong"
- feedback must be 1–3 sentences: affirm what's right, gently correct what's off, and give the key insight.
- suggestProceed: true if verdict is "correct" or "partial"; false only if verdict is "wrong" and a short hint would help before moving on.
- Do NOT be harsh. Frame wrong answers as "not quite — here's the key idea".
- Output ONLY a raw valid JSON object. No markdown. No backticks. No explanation.

JSON Schema:
{
  "verdict": "correct" | "partial" | "wrong",
  "feedback": "string",
  "suggestProceed": boolean
}`;

// ---------------------------------------------------------------------------
// Mode: ask
// ---------------------------------------------------------------------------

interface AskBody {
  blueprint: unknown;
  stepIndex: unknown;
}

interface AskResponse {
  question: string;
  expectedIntuition: string;
}

async function handleAsk(body: AskBody): Promise<NextResponse> {
  if (!isValidBlueprint(body.blueprint)) {
    return NextResponse.json({ error: 'Missing or invalid blueprint.' }, { status: 400 });
  }
  const blueprint = body.blueprint;

  const stepIndex =
    typeof body.stepIndex === 'number' ? body.stepIndex : parseInt(String(body.stepIndex), 10);
  if (!Number.isFinite(stepIndex) || stepIndex < 0 || stepIndex >= blueprint.steps.length) {
    return NextResponse.json(
      { error: `stepIndex must be 0–${blueprint.steps.length - 1}.` },
      { status: 400 },
    );
  }

  // Build a compact lesson context from narrations only (cheap tokens).
  const stepSummary = blueprint.steps
    .slice(0, stepIndex + 1)
    .map((s, i) => `Step ${i + 1}: ${s.narration}`)
    .join('\n');

  const nextStep = blueprint.steps[stepIndex + 1] ?? null;
  const nextHint = nextStep
    ? `\nThe next (hidden) step will cover: "${nextStep.narration}"`
    : '\nThis is the last step.';

  const userPrompt = [
    `Lesson: "${blueprint.title}" (domain: ${blueprint.domain})`,
    ``,
    `Steps the learner has already watched:`,
    stepSummary,
    nextHint,
    ``,
    `Generate ONE prediction question to ask the learner BEFORE they see the next step.`,
  ].join('\n');

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: ASK_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = msg.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Could not parse ask response.' }, { status: 502 });
  }

  const p = parsed as Record<string, unknown>;
  if (typeof p.question !== 'string' || typeof p.expectedIntuition !== 'string') {
    return NextResponse.json({ error: 'Ask response had unexpected shape.' }, { status: 502 });
  }

  return NextResponse.json({
    question: p.question,
    expectedIntuition: p.expectedIntuition,
  } satisfies AskResponse);
}

// ---------------------------------------------------------------------------
// Mode: evaluate
// ---------------------------------------------------------------------------

interface EvaluateBody {
  question: unknown;
  expectedIntuition: unknown;
  answer: unknown;
}

type Verdict = 'correct' | 'partial' | 'wrong';

interface EvaluateResponse {
  verdict: Verdict;
  feedback: string;
  suggestProceed: boolean;
}

async function handleEvaluate(body: EvaluateBody): Promise<NextResponse> {
  const question = sanitizeText(body.question, MAX_ROUND_TRIP_LENGTH);
  if (!question) {
    return NextResponse.json(
      { error: `question must be 1–${MAX_ROUND_TRIP_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const expectedIntuition = sanitizeText(body.expectedIntuition, MAX_ROUND_TRIP_LENGTH);
  if (!expectedIntuition) {
    return NextResponse.json(
      { error: `expectedIntuition must be 1–${MAX_ROUND_TRIP_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const answer = sanitizeText(body.answer, MAX_ANSWER_LENGTH);
  if (!answer) {
    return NextResponse.json(
      { error: `answer must be 1–${MAX_ANSWER_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const userPrompt = [
    `Question posed to learner: "${question}"`,
    ``,
    `Key insight a correct answer should capture: "${expectedIntuition}"`,
    ``,
    `Learner's answer: "${answer}"`,
    ``,
    `Evaluate the learner's answer now.`,
  ].join('\n');

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: EVALUATE_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = msg.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Could not parse evaluate response.' }, { status: 502 });
  }

  const p = parsed as Record<string, unknown>;
  const validVerdicts: Verdict[] = ['correct', 'partial', 'wrong'];
  if (
    !validVerdicts.includes(p.verdict as Verdict) ||
    typeof p.feedback !== 'string' ||
    typeof p.suggestProceed !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Evaluate response had unexpected shape.' }, { status: 502 });
  }

  return NextResponse.json({
    verdict: p.verdict as Verdict,
    feedback: p.feedback,
    suggestProceed: p.suggestProceed,
  } satisfies EvaluateResponse);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const mode = body.mode;
  if (mode !== 'ask' && mode !== 'evaluate') {
    return NextResponse.json(
      { error: "body.mode must be 'ask' or 'evaluate'." },
      { status: 400 },
    );
  }

  try {
    if (mode === 'ask') {
      return await handleAsk(body as unknown as AskBody);
    }
    return await handleEvaluate(body as unknown as EvaluateBody);
  } catch (err) {
    // SECURITY: never reflect raw Error.message to the client.
    console.error('[/api/socratic] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
