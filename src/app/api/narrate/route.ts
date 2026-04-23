import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice — "Clear, Engaging Educator"
const MODEL_ID = 'eleven_turbo_v2_5'; // fast + good quality
const MAX_TEXT_LENGTH = 4000;

/**
 * In-process LRU cache: key = `${voiceId}:${sha256(text)}`, value = MP3 bytes.
 * Caps memory at ~50 entries (each ~30-200KB). Lessons reuse identical narration
 * across replays, so cache hits are common.
 */
const CACHE_MAX = 50;
const cache = new Map<string, ArrayBuffer>();

function cacheGet(key: string): ArrayBuffer | undefined {
  const value = cache.get(key);
  if (value) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

function cacheSet(key: string, value: ArrayBuffer): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured.' }, { status: 500 });
  }

  let body: { text?: unknown; voiceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Missing text.' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Text exceeds ${MAX_TEXT_LENGTH} chars.` }, { status: 400 });
  }

  const voiceId = typeof body.voiceId === 'string' && body.voiceId.trim() ? body.voiceId.trim() : DEFAULT_VOICE_ID;

  const cacheKey = `${voiceId}:${createHash('sha256').update(text).digest('hex')}`;
  const hit = cacheGet(cacheKey);
  if (hit) {
    return new Response(hit, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'X-Visua-Cache': 'hit',
      },
    });
  }

  const upstream = await fetch(`${ELEVENLABS_TTS_URL}/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    let msg = `ElevenLabs ${upstream.status}`;
    try {
      const j = JSON.parse(errText) as { detail?: { message?: string } | string };
      if (typeof j.detail === 'string') msg = j.detail;
      else if (j.detail && typeof j.detail === 'object' && j.detail.message) msg = j.detail.message;
    } catch {
      if (errText.trim()) msg = errText.trim().slice(0, 240);
    }
    return NextResponse.json({ error: msg }, { status: upstream.status });
  }

  const audio = await upstream.arrayBuffer();
  cacheSet(cacheKey, audio);

  return new Response(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=3600',
      'X-Visua-Cache': 'miss',
    },
  });
}
