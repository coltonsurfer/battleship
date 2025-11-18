import { useTranslation } from '../hooks/useTranslation';

interface CowboyNavProps {
  onQuickDraw?: () => void;
}

export function CowboyNav({ onQuickDraw }: CowboyNavProps) {
  const { t } = useTranslation();
  
  const navLinks = [
    { label: t('nav.settings'), href: '#controls' }
  ];
  
  return (
    <nav className="cowboy-nav" aria-label="Primary navigation" data-node-id="1:608">
      <div className="cowboy-nav__brand" aria-label="Cowboy Clash">
        <span className="cowboy-nav__brand-icon" aria-hidden="true">
          ⚔
        </span>
        <div>
          <p className="cowboy-nav__eyebrow">{t('nav.brand.company')}</p>
          <p className="cowboy-nav__title">{t('nav.brand.title')}</p>
        </div>
      </div>

      <ul className="cowboy-nav__links">
        {navLinks.map(link => (
          <li key={link.href}>
            <a className="nav-link" href={link.href}>
              <span className="nav-link__dot" aria-hidden="true" />
              <span className="nav-link__label">{link.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <button type="button" className="nav-cta" onClick={onQuickDraw}>
        {t('nav.quickDraw')}
      </button>
    </nav>
  );
}
