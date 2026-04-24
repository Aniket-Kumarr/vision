import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Blueprint } from '@/lib/types';

const QUIZ_MODEL = 'claude-sonnet-4-5';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Given the blueprint of a visual math/physics lesson, produce 3-5 flashcards that test intuition (not memorization). Each front is a short question. Each back is a 1-2 sentence answer. Return ONLY valid JSON in the shape { "cards": [ { "front": "...", "back": "..." } ] }. No markdown, no backticks, no explanation — just JSON.`;

export interface RawCard {
  front: string;
  back: string;
}

export interface GeneratedCard extends RawCard {
  id: string;
}

function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function validateCards(value: unknown): RawCard[] {
  if (typeof value !== 'object' || value === null) throw new Error('Response must be an object');
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.cards)) throw new Error('Response must have a "cards" array');
  const cards = obj.cards;
  if (cards.length < 1 || cards.length > 8) {
    throw new Error(`Expected 1-8 cards, got ${cards.length}`);
  }
  return cards.map((c: unknown, i: number) => {
    if (typeof c !== 'object' || c === null) throw new Error(`Card ${i + 1} is not an object`);
    const card = c as Record<string, unknown>;
    if (typeof card.front !== 'string' || !card.front.trim()) {
      throw new Error(`Card ${i + 1} missing front`);
    }
    if (typeof card.back !== 'string' || !card.back.trim()) {
      throw new Error(`Card ${i + 1} missing back`);
    }
    return {
      front: card.front.trim().slice(0, 200),
      back: card.back.trim().slice(0, 200),
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const blueprint = body?.blueprint as Blueprint | undefined;

    if (!blueprint || typeof blueprint !== 'object') {
      return NextResponse.json({ error: 'blueprint is required' }, { status: 400 });
    }
    if (!blueprint.title || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
      return NextResponse.json({ error: 'blueprint must have a title and at least one step' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'AI generation is not configured.' }, { status: 503 });
    }

    // Build a concise summary of the lesson for the model
    const lessonSummary = JSON.stringify({
      title: blueprint.title,
      domain: blueprint.domain,
      strategy: blueprint.strategy,
      narrations: blueprint.steps.map((s) => s.narration),
    });

    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.messages.create({
          model: QUIZ_MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Generate flashcards for this lesson:\n${lessonSummary}`,
            },
          ],
        });

        const text = response.content
          .filter((part) => part.type === 'text')
          .map((part) => ('text' in part ? part.text : ''))
          .join('\n')
          .trim();

        const parsed = parseModelJson(text);
        const rawCards = validateCards(parsed);

        const cards: GeneratedCard[] = rawCards.map((c) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          front: c.front,
          back: c.back,
        }));

        return NextResponse.json({ cards });
      } catch (err) {
        lastErr = err;
      }
    }

    console.error('[/api/quiz-cards] generation failed:', lastErr);
    return NextResponse.json({ error: 'Failed to generate quiz cards.' }, { status: 500 });
  } catch (err) {
    console.error('[/api/quiz-cards] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
