import { useGame } from '../context/GameContext';
import { SHIP_DEFS } from '../game/constants';
import type { ShipId } from '../game/types';

import broncoBattleshipIcon from '../assets/bronco_battleship_4x1.svg';
import cattleCarrierIcon from '../assets/cattle_carrier_5x1.svg';
import cowboyCruiserIcon from '../assets/cowboy_cruiser_3x1.svg';
import lassoDestroyerIcon from '../assets/lasso_destroyer_2x1.svg';
import stampedeSubIcon from '../assets/stampede_sub_3x1.svg';

const SHIP_SPRITES: Record<ShipId, string> = {
  carrier: cattleCarrierIcon,
  battleship: broncoBattleshipIcon,
  cruiser: cowboyCruiserIcon,
  submarine: stampedeSubIcon,
  destroyer: lassoDestroyerIcon
};

const SHIP_DESCRIPTIONS: Record<ShipId, { description: string; metrics: Array<{ label: string; value: string }> }> = {
  carrier: {
    description: 'A massive vessel that dominates the waterways. The largest ship in your fleet.',
    metrics: [
      { label: 'Size', value: '5' },
      { label: 'Armor', value: '★★☆' }
    ]
  },
  battleship: {
    description: 'A powerful warship with heavy firepower. The backbone of any naval fleet.',
    metrics: [
      { label: 'Size', value: '4' },
      { label: 'Power', value: '★★★' }
    ]
  },
  cruiser: {
    description: 'Fast and versatile vessel perfect for quick strikes and reconnaissance.',
    metrics: [
      { label: 'Size', value: '3' },
      { label: 'Speed', value: '★★★' }
    ]
  },
  submarine: {
    description: 'Stealthy underwater predator. Can strike from unexpected angles.',
    metrics: [
      { label: 'Size', value: '3' },
      { label: 'Stealth', value: '★★★' }
    ]
  },
  destroyer: {
    description: 'Small but deadly craft. Excellent for hit-and-run tactics.',
    metrics: [
      { label: 'Size', value: '2' },
      { label: 'Agility', value: '★★★' }
    ]
  }
};

export function ArsenalShowcase() {
  const { state } = useGame();
  const { boardPlayer } = state;
  
  // Get ships that are actually placed on the board
  const placedShips = boardPlayer.ships.map(shipPlacement => {
    const shipDef = SHIP_DEFS[shipPlacement.shipId];
    const shipInfo = SHIP_DESCRIPTIONS[shipPlacement.shipId];
    const sprite = SHIP_SPRITES[shipPlacement.shipId];
    
    return {
      id: shipPlacement.shipId,
      title: shipDef.displayName,
      icon: sprite,
      description: shipInfo.description,
      metrics: shipInfo.metrics,
      state: shipPlacement.sunk ? 'sunk' : shipPlacement.hits.length > 0 ? 'damaged' : 'normal',
      hits: shipPlacement.hits.length,
      totalHits: shipPlacement.length
    };
  });

  const handleViewFull = () => {
    const target = document.getElementById('fleet');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="arsenal-section" aria-labelledby="arsenal-heading" data-node-id="1:4">
      <div className="arsenal-section__header">
        <p className="arsenal-eyebrow">Your Fleet</p>
        <h2 id="arsenal-heading">Deployed Ships</h2>
        <p>
          {placedShips.length === 0 
            ? "No ships deployed yet. Place your fleet to begin battle."
            : `${placedShips.length} ship${placedShips.length !== 1 ? 's' : ''} ready for combat`
          }
        </p>
      </div>

      <div className="arsenal-divider" aria-hidden="true">
        <span />
        <i />
        <span />
      </div>

      {placedShips.length > 0 ? (
        <ul className="arsenal-grid">
          {placedShips.map(ship => (
            <li 
              key={ship.id} 
              className={`arsenal-card arsenal-card--${ship.state}`}
            >
              <div className="arsenal-card__icon" aria-hidden="true">
                <img 
                  src={ship.icon} 
                  alt={ship.title}
                  className="arsenal-card__ship-icon"
                />
              </div>
              <div className="arsenal-card__title">
                <h3>{ship.title}</h3>
                <span className="arsenal-card__status">
                  {ship.state === 'sunk' ? '☒ Sunk' : 
                   ship.state === 'damaged' ? `⚠️ Damaged (${ship.hits}/${ship.totalHits})` : 
                   '✓ Ready'}
                </span>
              </div>
              <p className="arsenal-card__body">{ship.description}</p>
              <div className="arsenal-card__divider" aria-hidden="true" />
              <dl className="arsenal-card__metrics">
                {ship.metrics.map(metric => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Damage</dt>
                  <dd>{ship.hits}/{ship.totalHits}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <div className="arsenal-empty">
          <p>Your fleet awaits deployment. Start placing ships to see them here.</p>
        </div>
      )}

      <button type="button" className="arsenal-cta" onClick={handleViewFull}>
        {placedShips.length > 0 ? 'View Fleet Status' : 'Start Deployment'}
      </button>
    </section>
  );
}
