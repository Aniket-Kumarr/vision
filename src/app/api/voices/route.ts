import { NextResponse } from 'next/server';

const ELEVENLABS_VOICES_URL = 'https://api.elevenlabs.io/v1/voices';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

let voicesCache: { at: number; payload: { voices: PublicVoice[] } } | null = null;
const VOICES_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PublicVoice {
  id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
}

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured.' }, { status: 500 });
  }

  if (voicesCache && Date.now() - voicesCache.at < VOICES_TTL_MS) {
    return NextResponse.json(voicesCache.payload, {
      headers: { 'X-Visua-Cache': 'hit' },
    });
  }

  const upstream = await fetch(ELEVENLABS_VOICES_URL, {
    headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: `ElevenLabs ${upstream.status}: ${text.slice(0, 200)}` },
      { status: upstream.status },
    );
  }

  const data = (await upstream.json()) as ElevenLabsVoicesResponse;
  const voices: PublicVoice[] = (data.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    category: v.category,
    description: v.labels ? Object.values(v.labels).join(' · ') : undefined,
    preview_url: v.preview_url,
  }));

  const payload = { voices };
  voicesCache = { at: Date.now(), payload };

  return NextResponse.json(payload, {
    headers: { 'X-Visua-Cache': 'miss' },
  });
}
