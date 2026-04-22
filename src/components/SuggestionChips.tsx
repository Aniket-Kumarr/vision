'use client';

interface SuggestionChipsProps {
  onSelect: (chip: string) => void;
}

const CHIPS = [
  'Unit Circle',
  'Pythagorean Theorem',
  'Derivatives',
  'Integrals',
  'Logarithms',
  'Parabolas',
  'Sine Waves',
  'Area Problems',
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 max-w-2xl"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="suggestion-chip px-3 py-1.5 rounded-full text-sm font-light tracking-wide flex-shrink-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
