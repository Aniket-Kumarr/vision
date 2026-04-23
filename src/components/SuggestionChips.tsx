'use client';

import { SUGGESTION_CHIPS } from '@/lib/conceptPrompts';

interface SuggestionChipsProps {
  onSelect: (chip: string) => void;
  disabled?: boolean;
}

export default function SuggestionChips({ onSelect, disabled = false }: SuggestionChipsProps) {
  return (
    <nav
      aria-label="Topic suggestions"
      className="flex gap-2 overflow-x-auto pb-1 max-w-2xl"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {SUGGESTION_CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="suggestion-chip px-3 py-1.5 text-sm font-light tracking-wide flex-shrink-0"
        >
          {chip}
        </button>
      ))}
    </nav>
  );
}
