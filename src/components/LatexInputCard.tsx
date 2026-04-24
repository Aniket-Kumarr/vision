'use client';

import { useState } from 'react';

type Subject = 'math' | 'physics';

const EXAMPLE_EQUATIONS = [
  {
    label: "Euler's identity",
    latex: 'e^{i\\pi} + 1 = 0',
  },
  {
    label: 'Schrödinger equation',
    latex: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi',
  },
  {
    label: 'Fundamental theorem of calculus',
    latex: '\\int_a^b f\'(x)\\,dx = f(b) - f(a)',
  },
];

interface LatexInputCardProps {
  onSubmit: (latex: string, subject: Subject) => void;
  isLoading: boolean;
}

export default function LatexInputCard({ onSubmit, isLoading }: LatexInputCardProps) {
  const [latex, setLatex] = useState('');
  const [subject, setSubject] = useState<Subject>('math');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = latex.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed, subject);
  };

  return (
    <div className="latex-card">
      <form onSubmit={handleSubmit} className="latex-form">
        <label className="latex-label" htmlFor="latex-input">
          Paste a LaTeX equation
        </label>

        <textarea
          id="latex-input"
          className="latex-textarea"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder={'Paste LaTeX, e.g.  \\int_0^1 x^2 \\, dx'}
          rows={4}
          disabled={isLoading}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />

        {/* Subject toggle */}
        <div className="latex-subject-toggle" role="group" aria-label="Subject">
          {(['math', 'physics'] as Subject[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`latex-subject-btn ${subject === s ? 'is-active' : ''}`}
              onClick={() => setSubject(s)}
              disabled={isLoading}
              aria-pressed={subject === s}
            >
              {s === 'math' ? 'Math' : 'Physics'}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="latex-submit-btn"
          disabled={isLoading || !latex.trim()}
        >
          {isLoading ? 'Generating…' : 'Visualize'}
        </button>
      </form>

      {/* Example equations */}
      <div className="latex-examples">
        <p className="latex-examples-label">Try an example:</p>
        <div className="latex-examples-list">
          {EXAMPLE_EQUATIONS.map((eq) => (
            <button
              key={eq.label}
              type="button"
              className="latex-example-btn"
              onClick={() => setLatex(eq.latex)}
              disabled={isLoading}
            >
              <span className="latex-example-name">{eq.label}</span>
              <code className="latex-example-code">{eq.latex}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
