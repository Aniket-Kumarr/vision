'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Blueprint } from '@/lib/types';
import {
  VISUA_AI_CONCEPT_KEY,
  VISUA_AI_SUBJECT_KEY,
  VISUA_AI_TOPIC_KEY,
} from '@/lib/auth';
import { setReplay } from '@/lib/lessonHistory';
import LatexInputCard from '@/components/LatexInputCard';

type Subject = 'math' | 'physics';

export default function LatexPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (latex: string, subject: Subject) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-from-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex, subject }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { blueprint?: Blueprint; error?: string };
      if (data.error) throw new Error(data.error);
      if (!data.blueprint || !Array.isArray(data.blueprint.steps) || data.blueprint.steps.length === 0) {
        throw new Error('Received an empty blueprint. Please try again.');
      }

      // Stash the blueprint for /canvas to pick up instantly (no extra API call).
      setReplay(data.blueprint);

      // Set concept/topic/subject so the canvas loading UI and history look right.
      try {
        localStorage.setItem(VISUA_AI_CONCEPT_KEY, latex);
        localStorage.setItem(VISUA_AI_TOPIC_KEY, data.blueprint.title);
        localStorage.setItem(VISUA_AI_SUBJECT_KEY, subject);
      } catch {
        // ignore storage errors
      }

      router.push('/canvas');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="chat-session-page">
      <header className="chat-session-nav">
        <span className="chat-session-logo">Visua AI</span>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => router.push('/welcome')}
        >
          ← Back
        </button>
      </header>

      <div className="latex-page-inner">
        <div className="latex-page-hero">
          <p className="chat-eyebrow">Equation mode</p>
          <h1 className="latex-page-title">Paste a LaTeX equation</h1>
          <p className="latex-page-lede">
            Drop any LaTeX expression from your textbook and we&apos;ll build a visual
            chalkboard lesson explaining it step by step.
          </p>
        </div>

        <LatexInputCard onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <p className="latex-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
