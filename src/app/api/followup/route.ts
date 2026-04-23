import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Blueprint, Drawing } from '@/lib/types';

const MODEL = 'claude-sonnet-4-5';
const MAX_QUESTION = 500;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are extending an existing chalkboard math lesson with a short follow-up answer.

The chalkboard is 800x600. Center is (400, 300). The user has just watched a multi-step lesson and EVERY previous drawing is still visible on the board — you must NOT restart, clear, or repeat existing content.

Your task: produce 1-3 new drawings that build on what's already there to answer the user's question, plus a 1-2 sentence narration. Place new elements in relatively empty regions of the canvas when possible. Pick chalk colors that contrast with likely-used palette. Keep it tight — this is an addition, not a new lesson.

Output ONLY a raw valid JSON object. No markdown. No backticks. No prose.

JSON Schema:
{
  "narration": "1-2 sentences, conversational, visual, 3Blue1Brown-style",
  "drawings": [
    {
      "type": "axes|line|dashed_line|circle|arc|rect|triangle|point|arrow|text|curve|shade|angle_mark|bracket",
      "color": "white|yellow|green|blue|red|orange|pink|cyan",
      "params": { /* same shape as the original lesson */ },
      "duration": 600
    }
  ]
}

Rules:
- 1-3 drawings maximum (this is a follow-up, not a new lesson)
- duration between 600 and 2500 ms
- Keep drawings inside 20-780 x and 20-580 y
- For curve type: fn is a JavaScript math expression using x (e.g. "Math.sin(x)")
- Narration must directly answer the question — no preamble ("Great question!" etc.), no summary, just the answer`;

interface FollowUpResponse {
  narration: string;
  drawings: Drawing[];
}

function isValidResponse(x: unknown): x is FollowUpResponse {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.narration === 'string' && Array.isArray(o.drawings);
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });
  }

  let body: { blueprint?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const blueprint = body.blueprint as Blueprint | undefined;
  const question = typeof body.question === 'string' ? body.question.trim() : '';

  if (!blueprint || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid blueprint.' }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: 'Missing question.' }, { status: 400 });
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `Question exceeds ${MAX_QUESTION} characters.` },
      { status: 400 },
    );
  }

  // Strip control chars from the user-supplied question before interpolation.
  const safeQuestion = question.replace(/[\x00-\x1F\x7F]/g, '');

  // Compact lesson context: titles, domain, what each step explained. We send
  // the narrations (cheap tokens) rather than the full drawing JSON (expensive
  // and noisy). The model can infer the visual state from the narrations.
  const stepSummary = blueprint.steps
    .map((s, i) => `Step ${i + 1}: ${s.narration}`)
    .join('\n');

  const userPrompt = [
    `Lesson title: "${blueprint.title}"`,
    `Domain: ${blueprint.domain}`,
    `Strategy: ${blueprint.strategy}`,
    ``,
    `Steps the user already watched (all drawings still visible on the board):`,
    stepSummary,
    ``,
    `Follow-up question from the user:`,
    `"${safeQuestion}"`,
    ``,
    `Produce the JSON response now.`,
  ].join('\n');

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('')
      .trim();

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Follow-up response was not valid JSON.' },
        { status: 502 },
      );
    }

    if (!isValidResponse(parsed)) {
      return NextResponse.json(
        { error: 'Follow-up response was missing drawings or narration.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      narration: parsed.narration,
      drawings: parsed.drawings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Anthropic call failed.';
    console.error('[/api/followup] error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
