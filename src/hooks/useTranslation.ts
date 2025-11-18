import { useGame } from '../context/GameContext';
import { translate, type TranslationKey } from '../utils/translations';

export function useTranslation() {
  const { state } = useGame();
  const { language } = state;
  
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    return translate(key, language, params);
  };
  
  return { t, language };
}
