import { describe, it, expect } from 'vitest';

import { ensureAIContext, pickEasyShot, pickHardShot, pickMediumShot } from '../game/ai';
import { createEmptyBoard } from '../game/engine';
import { SHIP_DEFS } from '../game/constants';

const serialize = ({ x, y }: { x: number; y: number }) => `${x},${y}`;

describe('AI strategies', () => {
  it('easy mode does not repeat shots', () => {
    const board = createEmptyBoard();
    const context = ensureAIContext();

    const first = pickEasyShot(board, context).coordinate;
    const second = pickEasyShot(board, context).coordinate;

    expect(serialize(first)).not.toEqual(serialize(second));
  });

  it('medium mode prioritises queued targets after a hit', () => {
    const board = createEmptyBoard();
    const context = ensureAIContext({
      targetQueue: [{ x: 4, y: 4 }]
    });

    const { coordinate } = pickMediumShot(board, context);
    expect(coordinate).toEqual({ x: 4, y: 4 });
  });

  it('hard mode selects the only viable neighbouring cell', () => {
    const board = createEmptyBoard();
    board.remainingShips = ['destroyer'];
    board.grid[4][4] = { status: 'hit', shipId: SHIP_DEFS.destroyer.id };
    board.grid[4][3] = { status: 'miss' };
    board.grid[4][5] = { status: 'miss' };
    board.grid[3][4] = { status: 'miss' };

    const { coordinate } = pickHardShot(board, ensureAIContext());
    expect(coordinate).toEqual({ x: 4, y: 5 });
  });
});
