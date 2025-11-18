import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_SHIPS, SHIP_DEFS } from '../game/constants';
import { placeShip, removeShip } from '../game/engine';
import type { Coordinate, Orientation, ShipId } from '../game/types';
import { useGame } from '../context/GameContext';
import { useTranslation } from '../hooks/useTranslation';
import { BoardGrid } from './BoardGrid';

export function FleetSetup() {
  const {
    state: { boardPlayer, placementOrder },
    dispatch
  } = useGame();
  const { t } = useTranslation();

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
    if (!activeShip) return;
    const placement = boardPlayer.ships.find(ship => ship.shipId === activeShip);
    if (placement) {
      setOrientation(prev => (prev === placement.orientation ? prev : placement.orientation));
    }
  }, [activeShip, boardPlayer.ships]);

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

  const rotatePlacedShip = useCallback(
    (shipId: ShipId, nextOrientation: Orientation): boolean => {
      const placement = boardPlayer.ships.find(ship => ship.shipId === shipId);
      if (!placement) return false;

      const ship = SHIP_DEFS[shipId];
      const clearedBoard = removeShip(boardPlayer, shipId);
      try {
        const updatedBoard = placeShip(clearedBoard, ship, placement.origin, nextOrientation);
        dispatch({ type: 'SET_PLAYER_BOARD', payload: { board: updatedBoard } });
        return true;
      } catch (error) {
        console.warn('Unable to rotate ship', error);
        return false;
      }
    },
    [boardPlayer, dispatch]
  );

  const handleRotate = useCallback(() => {
    const nextOrientation: Orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
    const targetShip = activeShip ?? shipToPlace;
    if (targetShip) {
      const isPlaced = boardPlayer.ships.some(ship => ship.shipId === targetShip);
      if (isPlaced) {
        const rotated = rotatePlacedShip(targetShip, nextOrientation);
        if (!rotated) {
          return;
        }
      }
    }
    setOrientation(nextOrientation);
  }, [orientation, activeShip, shipToPlace, boardPlayer.ships, rotatePlacedShip]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleRotate]);

  const handlePlaceShip = (coord: Coordinate) => {
    // Check if clicking on an existing ship to select it
    const cell = boardPlayer.grid[coord.y][coord.x];
    if (cell.status === 'ship') {
      setActiveShip(cell.shipId);
      return;
    }

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
    <div id="fleet" className="panel" aria-label={t('fleet.fleetPlacement')} role="region">
      <header>
        <h2>{t('fleet.heading')}</h2>
        <p className="header-subtitle">
          {t('fleet.instructions')} <kbd>R</kbd>.
        </p>
      </header>

      <div className="control-bar" role="group" aria-label={t('fleet.placementControls')}>
        <button className="belt-buckle" onClick={handleRandomize} type="button">
          {t('fleet.randomizeHerd')}
        </button>
        <button className="belt-buckle" onClick={handleRotate} type="button">
          {t('fleet.rotate')} ({orientation === 'horizontal' ? '↔' : '↕'})
        </button>
        <button
          className="belt-buckle"
          type="button"
          onClick={handleStart}
          disabled={!isReady}
        >
          {t('fleet.startShowdown')}
        </button>
      </div>

      <div className="board-layout">
        <div>
          <BoardGrid
            board={boardPlayer}
            mode="player"
            ariaLabel={t('fleet.playerRanch')}
            onSelectCell={handlePlaceShip}
          />
        </div>

        <aside>
          <h3>{t('fleet.remainingHerd')}</h3>
          <ul className="fleet-list">
            {DEFAULT_SHIPS.map(ship => {
              const placed = boardPlayer.ships.some(s => s.shipId === ship.id);
              const isSelected = activeShip === ship.id || (!activeShip && shipToPlace === ship.id);
              const shipName = t(`ship.${ship.id}` as any);
              return (
                <li key={ship.id}>
                  <button
                    className={`belt-buckle${isSelected ? ' belt-buckle--active' : ''}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveShip(ship.id)}
                  >
                    {shipName} ({ship.length}) {placed ? '✓' : ''}
                  </button>
                  {placed && (
                    <button
                      className="belt-buckle belt-buckle--ghost"
                      type="button"
                      onClick={() => handleClear(ship.id)}
                    >
                      {t('fleet.remove')}
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
