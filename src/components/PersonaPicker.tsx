'use client';

import { useEffect, useRef, useState } from 'react';
import { Persona, PERSONA_LABELS } from '@/lib/types';

export const VISUA_AI_PERSONA_KEY = 'visua_ai_persona';

interface PersonaPickerProps {
  /** Currently selected persona. */
  value: Persona;
  /** Called when the user picks a different persona. */
  onChange: (persona: Persona) => void;
  /** Render as a compact inline pill (for chat nav) instead of the full row. */
  compact?: boolean;
}

const PERSONAS = Object.keys(PERSONA_LABELS) as Persona[];

export function readStoredPersona(): Persona {
  if (typeof window === 'undefined') return 'default';
  try {
    const raw = localStorage.getItem(VISUA_AI_PERSONA_KEY);
    if (raw && PERSONAS.includes(raw as Persona)) return raw as Persona;
  } catch {
    // ignore
  }
  return 'default';
}

export default function PersonaPicker({ value, onChange, compact = false }: PersonaPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (p: Persona) => {
    try {
      localStorage.setItem(VISUA_AI_PERSONA_KEY, p);
    } catch {
      // ignore
    }
    onChange(p);
    setOpen(false);
  };

  const currentLabel = PERSONA_LABELS[value].label;

  if (compact) {
    return (
      <div ref={wrapRef} className="persona-picker persona-picker--compact">
        <button
          type="button"
          className="persona-pill-btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          title="Change narration voice"
        >
          Voice: {currentLabel}
          <svg
            className="persona-pill-caret"
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M1 1 L5 5 L9 1" />
          </svg>
        </button>
        {open && (
          <div className="persona-popover" role="listbox" aria-label="Narration voice">
            {PERSONAS.map((p) => (
              <button
                key={p}
                type="button"
                role="option"
                aria-selected={value === p}
                className={`persona-option ${value === p ? 'is-selected' : ''}`}
                onClick={() => handleSelect(p)}
              >
                <span className="persona-option-label">{PERSONA_LABELS[p].label}</span>
                <span className="persona-option-oneliner">{PERSONA_LABELS[p].oneLiner}</span>
                {value === p && <span className="persona-option-check" aria-hidden>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full pill-row variant (welcome page)
  return (
    <div ref={wrapRef} className="persona-picker persona-picker--row">
      <p className="persona-row-label">Explain it like…</p>
      <div className="persona-row-pills" role="listbox" aria-label="Narration voice">
        {PERSONAS.map((p) => (
          <button
            key={p}
            type="button"
            role="option"
            aria-selected={value === p}
            className={`persona-row-pill ${value === p ? 'is-active' : ''}`}
            onClick={() => handleSelect(p)}
            title={PERSONA_LABELS[p].oneLiner}
          >
            {PERSONA_LABELS[p].label}
          </button>
        ))}
      </div>
      {value !== 'default' && (
        <p className="persona-row-hint">{PERSONA_LABELS[value].oneLiner}</p>
      )}
    </div>
  );
}
