const navLinks = [
  { label: 'Arena', href: '#arena' },
  { label: 'Leaderboard', href: '#log' },
  { label: 'Posse', href: '#fleet' },
  { label: 'Settings', href: '#controls' }
];

interface CowboyNavProps {
  onQuickDraw?: () => void;
}

export function CowboyNav({ onQuickDraw }: CowboyNavProps) {
  return (
    <nav className="cowboy-nav" aria-label="Primary navigation" data-node-id="1:608">
      <div className="cowboy-nav__brand" aria-label="Cowboy Clash">
        <span className="cowboy-nav__brand-icon" aria-hidden="true">
          ⚔
        </span>
        <div>
          <p className="cowboy-nav__eyebrow">Cattle Clash Co.</p>
          <p className="cowboy-nav__title">Cowboy Clash</p>
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
        Quick Draw
      </button>
    </nav>
  );
}
