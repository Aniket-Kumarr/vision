'use client';

import { useEffect, useState } from 'react';
import { DifficultyLevel, DIFFICULTY_LABELS } from '@/lib/types';

interface DifficultySliderProps {
  onChangeLevel?: (level: DifficultyLevel) => void;
  initialLevel?: DifficultyLevel;
}

const LEVELS: DifficultyLevel[] = ['kid', 'student', 'college', 'grad', 'researcher'];

export default function DifficultySlider({ onChangeLevel, initialLevel = 'college' }: DifficultySliderProps) {
  const [level, setLevel] = useState<DifficultyLevel>(initialLevel);

  useEffect(() => {
    setLevel(initialLevel);
  }, [initialLevel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    const newLevel = LEVELS[index];
    setLevel(newLevel);
    onChangeLevel?.(newLevel);
  };

  const currentIndex = LEVELS.indexOf(level);

  return (
    <div className="difficulty-slider-container">
      <label htmlFor="difficulty-slider" className="difficulty-slider-label">
        Explanation depth
      </label>
      <div className="difficulty-slider-track">
        <input
          id="difficulty-slider"
          type="range"
          min="0"
          max={LEVELS.length - 1}
          value={currentIndex}
          onChange={handleChange}
          className="difficulty-slider-input"
          aria-label="Select explanation difficulty level"
        />
      </div>
      <div className="difficulty-slider-label-below">
        {DIFFICULTY_LABELS[level]}
      </div>
    </div>
  );
}
