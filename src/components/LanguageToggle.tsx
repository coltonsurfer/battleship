import { useGame } from '../context/GameContext';
import { useTranslation } from '../hooks/useTranslation';
import type { Language } from '../utils/translations';

export function LanguageToggle() {
  const { state, dispatch } = useGame();
  const { t } = useTranslation();
  const { language } = state;

  const handleLanguageChange = (newLanguage: Language) => {
    dispatch({ type: 'SET_LANGUAGE', language: newLanguage });
  };

  return (
    <div className="language-toggle" role="group" aria-label={t('language.label')}>
      <button
        type="button"
        className="belt-buckle"
        aria-pressed={language === 'en'}
        onClick={() => handleLanguageChange('en')}
      >
        English
      </button>
      <button
        type="button"
        className="belt-buckle"
        aria-pressed={language === 'es'}
        onClick={() => handleLanguageChange('es')}
      >
        Español
      </button>
    </div>
  );
}
