import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_SHIPS, SHIP_DEFS } from '../game/constants';
import { placeShip, removeShip } from '../game/engine';
import type { Coordinate, Orientation, ShipId } from '../game/types';
import { useGame } from '../context/GameContext';
import { BoardGrid } from './BoardGrid';

export function FleetSetup() {
  const {
    state: { boardPlayer, placementOrder },
    dispatch
  } = useGame();

  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [activeShip, setActiveShip] = useState<ShipId | null>(null);

  const remainingShips = useMemo(
    () => DEFAULT_SHIPS.filter(ship => !boardPlayer.ships.some(s => s.shipId === ship.id)),
    [boardPlayer.ships]
  );

  const shipToPlace = placementOrder.length
    ? placementOrder[0]
    : remainingShips[0]?.id ?? null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleRandomize = () => {
    dispatch({ type: 'RANDOMIZE_PLAYER_FLEET' });
    setActiveShip(null);
    setOrientation('horizontal');
  };

  const handleClear = (shipId: ShipId) => {
    const updated = removeShip(boardPlayer, shipId);
    dispatch({ type: 'SET_PLAYER_BOARD', payload: { board: updated } });
    setActiveShip(shipId);
  };

  const handleRotate = () => {
    setOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  const handlePlaceShip = (coord: Coordinate) => {
    const targetShipId = activeShip ?? shipToPlace;
    if (!targetShipId) return;
    const ship = SHIP_DEFS[targetShipId];
    try {
      const board = placeShip(boardPlayer, ship, coord, orientation);
      dispatch({ type: 'SET_PLAYER_BOARD', payload: { board } });
      setActiveShip(null);
    } catch (error) {
      console.warn('Failed to place ship', error);
    }
  };

  const handleStart = () => {
    dispatch({ type: 'START_GAME' });
  };

  const isReady = boardPlayer.ships.length === DEFAULT_SHIPS.length;

  return (
    <div className="panel" aria-label="Fleet placement" role="region">
      <header>
        <h2>Ranch Setup</h2>
        <p className="header-subtitle">
          Select a ship, then click the grid to place it. Tap the rotate button or press <kbd>R</kbd>.
        </p>
      </header>

      <div className="control-bar" role="group" aria-label="Placement controls">
        <button className="belt-buckle" onClick={handleRandomize} type="button">
          Randomize herd
        </button>
        <button className="belt-buckle" onClick={handleRotate} type="button">
          Rotate ({orientation === 'horizontal' ? '↔' : '↕'})
        </button>
        <button
          className="belt-buckle"
          type="button"
          onClick={handleStart}
          disabled={!isReady}
        >
          Start showdown
        </button>
      </div>

      <div className="board-layout">
        <div>
          <BoardGrid
            board={boardPlayer}
            mode="player"
            ariaLabel="Player ranch"
            onSelectCell={handlePlaceShip}
          />
        </div>

        <aside>
          <h3>Remaining herd</h3>
          <ul className="fleet-list">
            {DEFAULT_SHIPS.map(ship => {
              const placed = boardPlayer.ships.some(s => s.shipId === ship.id);
              const isSelected = activeShip === ship.id || (!activeShip && shipToPlace === ship.id);
              return (
                <li key={ship.id}>
                  <button
                    className={`belt-buckle${isSelected ? ' belt-buckle--active' : ''}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveShip(ship.id)}
                  >
                    {ship.displayName} {placed ? '✓' : ''}
                  </button>
                  {placed && (
                    <button
                      className="belt-buckle belt-buckle--ghost"
                      type="button"
                      onClick={() => handleClear(ship.id)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
