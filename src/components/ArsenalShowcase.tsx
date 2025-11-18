import { useGame } from '../context/GameContext';
import { useTranslation } from '../hooks/useTranslation';
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

const SHIP_METRIC_VALUES: Record<ShipId, Array<{ metricKey: string; value: string }>> = {
  carrier: [
    { metricKey: 'armor', value: '★★☆' }
  ],
  battleship: [
    { metricKey: 'power', value: '★★★' }
  ],
  cruiser: [
    { metricKey: 'speed', value: '★★★' }
  ],
  submarine: [
    { metricKey: 'stealth', value: '★★★' }
  ],
  destroyer: [
    { metricKey: 'agility', value: '★★★' }
  ]
};

export function ArsenalShowcase() {
  const { state } = useGame();
  const { boardPlayer } = state;
  const { t } = useTranslation();
  
  // Get ships that are actually placed on the board
  const placedShips = boardPlayer.ships.map(shipPlacement => {
    const shipDef = SHIP_DEFS[shipPlacement.shipId];
    const metricValues = SHIP_METRIC_VALUES[shipPlacement.shipId];
    const sprite = SHIP_SPRITES[shipPlacement.shipId];
    
    const metrics = [
      { label: t('ship.metric.size'), value: String(shipDef.length) },
      ...metricValues.map(m => ({ 
        label: t(`ship.metric.${m.metricKey}` as any), 
        value: m.value 
      }))
    ];
    
    return {
      id: shipPlacement.shipId,
      title: t(`ship.${shipPlacement.shipId}` as any),
      icon: sprite,
      description: t(`ship.${shipPlacement.shipId}.description` as any),
      metrics,
      state: shipPlacement.sunk ? 'sunk' : shipPlacement.hits.length > 0 ? 'damaged' : 'normal',
      hits: shipPlacement.hits.length,
      totalHits: shipPlacement.length
    };
  });

  const handleViewFull = () => {
    const target = document.getElementById('fleet');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shipsReadyText = placedShips.length === 1 
    ? t('arsenal.shipsReady', { count: '' })
    : t('arsenal.shipsReady', { count: 's' });
  
  return (
    <section className="arsenal-section" aria-labelledby="arsenal-heading" data-node-id="1:4">
      <div className="arsenal-section__header">
        <p className="arsenal-eyebrow">{t('arsenal.eyebrow')}</p>
        <h2 id="arsenal-heading">{t('arsenal.heading')}</h2>
        <p>
          {placedShips.length === 0 
            ? t('arsenal.noShips')
            : `${placedShips.length} ${shipsReadyText}`
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
                  {ship.state === 'sunk' ? t('arsenal.status.sunk') : 
                   ship.state === 'damaged' ? `${t('arsenal.status.damaged')} (${ship.hits}/${ship.totalHits})` : 
                   t('arsenal.status.ready')}
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
                  <dt>{t('arsenal.damage')}</dt>
                  <dd>{ship.hits}/{ship.totalHits}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <div className="arsenal-empty">
          <p>{t('arsenal.awaitingDeployment')}</p>
        </div>
      )}

      <button type="button" className="arsenal-cta" onClick={handleViewFull}>
        {placedShips.length > 0 ? t('arsenal.viewFleetStatus') : t('arsenal.startDeployment')}
      </button>
    </section>
  );
}
