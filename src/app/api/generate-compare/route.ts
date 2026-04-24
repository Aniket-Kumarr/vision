import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Blueprint } from '@/lib/types';
import {
  buildSystemPrompt,
  sanitizeConcept,
  validateBlueprint,
  parseModelJson,
  Subject,
} from '@/app/api/generate/route';

const COMPARE_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
] as const;

const MODEL_TIMEOUT_MS = 30_000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ModelResult {
  model: string;
  blueprint: Blueprint | null;
  latencyMs: number;
  error?: string;
}

async function generateWithModel(
  concept: string,
  subject: Subject,
  model: string,
): Promise<ModelResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  const startMs = Date.now();

  try {
    const response = await client.messages.create(
      {
        model,
        max_tokens: 4096,
        system: buildSystemPrompt(subject),
        messages: [
          {
            role: 'user',
            content: `Create a visual chalk explanation (${subject} subject) for: "${concept}"`,
          },
        ],
      },
      { signal: controller.signal },
    );

    const text = response.content
      .filter((part) => part.type === 'text')
      .map((part) => ('text' in part ? part.text : ''))
      .join('\n')
      .trim();

    const parsed = parseModelJson(text);
    const blueprint = validateBlueprint(parsed);
    return { model, blueprint, latencyMs: Date.now() - startMs };
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'timed out after 30 s'
          : err.message
        : 'unknown error';
    return { model, blueprint: null, latencyMs, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

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
        { error: 'concept must be between 1 and 8000 characters' },
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
            'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local to use the compare feature.',
        },
        { status: 503 },
      );
    }

    const settled = await Promise.allSettled(
      COMPARE_MODELS.map((model) => generateWithModel(concept, subject, model)),
    );

    const results: ModelResult[] = settled.map((result, i) => {
      if (result.status === 'fulfilled') return result.value;
      return {
        model: COMPARE_MODELS[i],
        blueprint: null,
        latencyMs: 0,
        error: result.reason instanceof Error ? result.reason.message : 'unknown error',
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[/api/generate-compare] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
