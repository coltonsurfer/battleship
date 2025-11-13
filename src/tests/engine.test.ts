import { describe, it, expect } from 'vitest';

import { BOARD_SIZE, SHIP_DEFS } from '../game/constants';
import {
  createEmptyBoard,
  placeShip,
  canPlaceShip,
  fireAt,
  isFleetComplete,
  isVictory,
  randomizeFleet
} from '../game/engine';

const destroyer = SHIP_DEFS.destroyer;

describe('game engine', () => {
  it('creates an empty board with correct dimensions', () => {
    const board = createEmptyBoard();
    expect(board.size).toBe(BOARD_SIZE);
    expect(board.grid).toHaveLength(BOARD_SIZE);
    expect(board.grid.every(row => row.length === BOARD_SIZE)).toBe(true);
  });

  it('validates placement bounds and prevents overlap', () => {
    const board = createEmptyBoard();
    expect(canPlaceShip(board, destroyer, { x: 0, y: 0 }, 'horizontal')).toBe(true);
    expect(canPlaceShip(board, destroyer, { x: 9, y: 9 }, 'horizontal')).toBe(false);
  });

  it('marks hits, misses, and sinking correctly', () => {
    let board = createEmptyBoard();
    board = placeShip(board, destroyer, { x: 0, y: 0 }, 'horizontal');
    board.remainingShips = [destroyer.id];

    // Miss
    let result = fireAt(board, { x: 5, y: 5 });
    expect(result[1]).toEqual({ result: 'miss' });

    // Hit but not sunk
    result = fireAt(result[0], { x: 0, y: 0 });
    expect(result[1]).toMatchObject({ result: 'hit', sunk: false, shipId: destroyer.id });

    // Final hit sinks destroyer and declares victory
    result = fireAt(result[0], { x: 1, y: 0 });
    expect(result[1]).toMatchObject({ result: 'hit', sunk: true, shipId: destroyer.id });
    const finalBoard = result[0];
    expect(finalBoard.remainingShips).toHaveLength(0);
    expect(isVictory(finalBoard)).toBe(true);
  });

  it('randomizes fleet ensuring all ships are placed without overlap', () => {
    const board = randomizeFleet(1234);
    expect(board.ships).toHaveLength(Object.keys(SHIP_DEFS).length);
    expect(isFleetComplete(board)).toBe(true);

    const occupiedCells = new Set<string>();
    board.ships.forEach(ship => {
      ship.hits = []; // ensure no stray data
      const cells = Array.from({ length: ship.length }).map((_, i) =>
        ship.orientation === 'horizontal'
          ? `${ship.origin.x + i},${ship.origin.y}`
          : `${ship.origin.x},${ship.origin.y + i}`
      );
      cells.forEach(cell => {
        expect(occupiedCells.has(cell)).toBe(false);
        occupiedCells.add(cell);
      });
    });
  });
});
