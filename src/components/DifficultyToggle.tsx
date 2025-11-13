import type { Difficulty } from '../game/types';

interface DifficultyToggleProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

const options: { label: string; value: Difficulty; description: string }[] = [
  { label: 'Easy', value: 'easy', description: 'Spray & pray shots — purely random.' },
  { label: 'Medium', value: 'medium', description: 'Hunt & target after a hit.' },
  { label: 'Hard', value: 'hard', description: 'Probability-driven sharpshooter.' }
];

export function DifficultyToggle({ difficulty, onChange, disabled }: DifficultyToggleProps) {
  return (
    <div className="difficulty-toggle" role="group" aria-label="AI difficulty">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className="difficulty-toggle__option"
          aria-pressed={difficulty === option.value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          <span className="difficulty-toggle__label">{option.label}</span>
          <span className="difficulty-toggle__hint" aria-hidden="true">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}
