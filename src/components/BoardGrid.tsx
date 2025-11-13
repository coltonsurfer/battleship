import type { BoardState, CellState, Coordinate } from '../game/types';

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
    if (cell.status === 'ship') return '⇔';
    if (cell.status === 'hit') return '☒';
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

  return (
    <div
      className={`board-grid board-grid--${mode}`}
      role="grid"
      aria-label={ariaLabel}
      aria-disabled={boardDisabled}
      style={{ ['--grid-size' as string]: size }}
    >
      {board.grid.map((row, rowIndex) => (
        <div key={rowIndex} role="row" className="board-grid__row">
          {row.map((cell, colIndex) => {
            const coord = { x: colIndex, y: rowIndex } as Coordinate;
            const key = cellKey(coord);
            const canInteract = !boardDisabled && (
              (isEnemy && (cell.status === 'empty' || cell.status === 'ship')) ||
              (!isEnemy && Boolean(onSelectCell))
            );
            const ariaDescription = `Column ${colIndex + 1}, Row ${rowIndex + 1}`;
            const isQueued = highlight.has(key);

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
                  {renderCellContent(cell, mode)}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
