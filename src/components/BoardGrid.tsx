import type { BoardState, CellState, Coordinate, ShipId, ShipPlacement } from '../game/types';

import broncoBattleshipIcon from '../assets/bronco_battleship_4x1.svg';
import cattleCarrierIcon from '../assets/cattle_carrier_5x1.svg';
import cowboyCruiserIcon from '../assets/cowboy_cruiser_3x1.svg';
import lassoDestroyerIcon from '../assets/lasso_destroyer_2x1.svg';
import stampedeSubIcon from '../assets/stampede_sub_3x1.svg';

export type BoardMode = 'player' | 'enemy';

interface BoardGridProps {
  board: BoardState;
  mode: BoardMode;
  ariaLabel: string;
  onSelectCell?: (coord: Coordinate) => void;
  highlightTargets?: Set<string>;
  disabled?: boolean;
}

const cellKey = ({ x, y }: Coordinate) => `${x},${y}`;

const SHIP_SPRITES: Record<ShipId, string> = {
  carrier: cattleCarrierIcon,
  battleship: broncoBattleshipIcon,
  cruiser: cowboyCruiserIcon,
  submarine: stampedeSubIcon,
  destroyer: lassoDestroyerIcon
};

type ShipState = 'normal' | 'damaged' | 'sunk';

interface ShipOverlay {
  ship: ShipPlacement;
  sprite: string;
  state: ShipState;
}

const getShipState = (ship: ShipPlacement): ShipState => {
  if (ship.sunk) return 'sunk';
  if (ship.hits.length > 0) return 'damaged';
  return 'normal';
};

function getCellClass(cell: CellState, mode: BoardMode): string {
  const base = ['cell'];
  if (mode === 'player' && (cell.status === 'ship' || cell.status === 'hit' || cell.status === 'sunk')) {
    base.push('ship-cell');
  }
  if (cell.status === 'hit') {
    base.push('cell-hit');
  } else if (cell.status === 'miss') {
    base.push('cell-miss');
  } else if (cell.status === 'sunk') {
    base.push('cell-sunk');
  }
  if (mode === 'enemy') {
    base.push('enemy-cell');
  }
  return base.join(' ');
}

function renderCellContent(cell: CellState, mode: BoardMode) {
  if (mode === 'player') {
    if (cell.status === 'hit') return '☒';
    if (cell.status === 'miss') return '○';
    if (cell.status === 'sunk') return '✶';
  } else {
    if (cell.status === 'ship') return '⇔';
    if (cell.status === 'hit') return '☒';
    if (cell.status === 'miss') return '○';
    if (cell.status === 'sunk') return '✶';
  }
  return '';
}

export function BoardGrid({
  board,
  mode,
  ariaLabel,
  onSelectCell,
  highlightTargets,
  disabled
}: BoardGridProps) {
  const size = board.size;
  const isEnemy = mode === 'enemy';
  const highlight = highlightTargets ?? new Set<string>();
  const boardDisabled = Boolean(disabled);
  
  // Get carrier ship info for rendering
  const shipOverlays: ShipOverlay[] =
    mode === 'player'
      ? board.ships
          .map(ship => {
            const sprite = SHIP_SPRITES[ship.shipId];
            if (!sprite) return null;
            return {
              ship,
              sprite,
              state: getShipState(ship)
            } satisfies ShipOverlay;
          })
          .filter((overlay): overlay is ShipOverlay => overlay !== null)
      : [];

  return (
    <div
      className={`board-grid board-grid--${mode}`}
      role="grid"
      aria-label={ariaLabel}
      aria-disabled={boardDisabled}
      style={{ ['--grid-size' as string]: size }}
    >
      {shipOverlays.map(({ ship, sprite, state }) => {
        const widthCells = ship.orientation === 'horizontal' ? ship.length : 1;
        const heightCells = ship.orientation === 'horizontal' ? 1 : ship.length;
        const key = `${ship.shipId}-${ship.origin.x}-${ship.origin.y}`;

        return (
          <div
            key={key}
            className={`ship-overlay ship-overlay--${ship.shipId} ship-overlay--${ship.orientation} ship-overlay--${state}`}
            style={{
              left: `calc(var(--board-padding, 10px) + var(--cell-step) * ${ship.origin.x})`,
              top: `calc(var(--board-padding, 10px) + var(--cell-step) * ${ship.origin.y})`,
              width: `calc(var(--cell-size) * ${widthCells} + var(--cell-gap) * ${widthCells - 1})`,
              height: `calc(var(--cell-size) * ${heightCells} + var(--cell-gap) * ${heightCells - 1})`,
              ['--rotated-width' as string]: `calc(var(--cell-size) * ${widthCells} + var(--cell-gap) * ${widthCells - 1})`,
              ['--rotated-height' as string]: `calc(var(--cell-size) * ${heightCells} + var(--cell-gap) * ${heightCells - 1})`
            }}
          >
            <img 
              src={sprite} 
              alt={`${ship.shipId} ship`} 
              className="ship-overlay__image"
            />
            {(state === 'damaged' || state === 'sunk') && (
              <div className="ship-overlay__marks">
                {ship.hits.map(hit => {
                  const xOffset = ship.orientation === 'horizontal' ? hit.x - ship.origin.x : 0;
                  const yOffset = ship.orientation === 'vertical' ? hit.y - ship.origin.y : 0;
                  return (
                    <span
                      key={`${hit.x}-${hit.y}`}
                      className={`ship-mark ship-mark--${state}`}
                      style={{
                        left:
                          ship.orientation === 'horizontal'
                            ? `calc(var(--cell-size) * 0.5 + var(--cell-step) * ${xOffset})`
                            : '50%',
                        top:
                          ship.orientation === 'vertical'
                            ? `calc(var(--cell-size) * 0.5 + var(--cell-step) * ${yOffset})`
                            : '50%'
                      }}
                    >
                      {state === 'sunk' ? '✶' : '☒'}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Render grid cells as direct children of board-grid */}
      {board.grid.flatMap((row, rowIndex) => 
        row.map((cell, colIndex) => {
          const coord = { x: colIndex, y: rowIndex } as Coordinate;
          const key = cellKey(coord);
          const canInteract = !boardDisabled && (
            (isEnemy && (cell.status === 'empty' || cell.status === 'ship')) ||
            (!isEnemy && Boolean(onSelectCell))
          );
          const ariaDescription = `Column ${colIndex + 1}, Row ${rowIndex + 1}`;
          const isQueued = highlight.has(key);
          
          // Don't render individual ship icons for carrier cells (they're covered by the spanning image)
          const hideShipContent = mode === 'player' && 'shipId' in cell;

          return (
            <button
              type="button"
              key={key}
              role="gridcell"
              aria-label={ariaDescription}
              aria-disabled={!canInteract}
              data-cell={key}
              className={`${getCellClass(cell, mode)}${isQueued ? ' cell-target' : ''}`}
              onClick={() => canInteract && onSelectCell?.(coord)}
              onKeyDown={event => {
                if (event.key === 'Enter' && canInteract) {
                  event.preventDefault();
                  onSelectCell?.(coord);
                }
              }}
              disabled={!canInteract}
            >
              <span className="cell-label" aria-hidden="true">
                {hideShipContent ? '' : renderCellContent(cell, mode)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
