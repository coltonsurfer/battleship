import type { Difficulty } from '../game/types';
import { useTranslation } from '../hooks/useTranslation';

interface DifficultyToggleProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

export function DifficultyToggle({ difficulty, onChange, disabled }: DifficultyToggleProps) {
  const { t } = useTranslation();
  
  const options: { label: string; value: Difficulty; description: string }[] = [
    { label: t('difficulty.easy'), value: 'easy', description: t('difficulty.easy.description') },
    { label: t('difficulty.medium'), value: 'medium', description: t('difficulty.medium.description') },
    { label: t('difficulty.hard'), value: 'hard', description: t('difficulty.hard.description') }
  ];
  
  return (
    <div className="difficulty-toggle" role="group" aria-label={t('difficulty.label')}>
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
