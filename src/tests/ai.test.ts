import { describe, it, expect } from 'vitest';

import {
  ensureAIContext,
  pickEasyShot,
  pickHardShot,
  pickMediumShot,
  pickShotByDifficulty
} from '../game/ai';
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

  it('pickShotByDifficulty mirrors behaviour of each difficulty strategy', () => {
    const easyBoard = createEmptyBoard();
    const easyCtx = ensureAIContext();
    const easyResult = pickShotByDifficulty(easyBoard, 'easy', easyCtx);
    expect(easyCtx.attempted.size).toBe(1);
    expect(easyBoard.grid[easyResult.coordinate.y][easyResult.coordinate.x]).toBeDefined();

    const mediumBoard = createEmptyBoard();
    const mediumCtx = ensureAIContext({
      targetQueue: [{ x: 6, y: 6 }]
    });
    const mediumResult = pickShotByDifficulty(mediumBoard, 'medium', mediumCtx);
    expect(mediumResult.coordinate).toEqual({ x: 6, y: 6 });
    expect(mediumCtx.targetQueue).toHaveLength(0);

    const hardBoard = createEmptyBoard();
    hardBoard.remainingShips = ['destroyer'];
    hardBoard.grid[4][4] = { status: 'hit', shipId: SHIP_DEFS.destroyer.id };
    hardBoard.grid[4][3] = { status: 'miss' };
    hardBoard.grid[4][5] = { status: 'miss' };
    hardBoard.grid[3][4] = { status: 'miss' };
    const hardResult = pickShotByDifficulty(hardBoard, 'hard', ensureAIContext());
    expect(hardResult.coordinate).toEqual({ x: 4, y: 5 });
  });

  it('avoids repeating coordinates across turns for each difficulty', () => {
    const easyBoard = createEmptyBoard();
    const easyContext = ensureAIContext();
    const easyFirst = pickShotByDifficulty(easyBoard, 'easy', easyContext).coordinate;
    const easySecond = pickShotByDifficulty(easyBoard, 'easy', easyContext).coordinate;
    expect(serialize(easyFirst)).not.toEqual(serialize(easySecond));

    const mediumBoard = createEmptyBoard();
    const mediumContext = ensureAIContext({
      targetQueue: [
        { x: 2, y: 2 },
        { x: 2, y: 3 }
      ]
    });
    const mediumFirst = pickShotByDifficulty(mediumBoard, 'medium', mediumContext); // consumes first queue item
    const mediumSecond = pickShotByDifficulty(mediumBoard, 'medium', mediumFirst.context);
    expect(serialize(mediumFirst.coordinate)).not.toEqual(serialize(mediumSecond.coordinate));

    const hardBoard = createEmptyBoard();
    const hardContext = ensureAIContext();
    const hardFirst = pickShotByDifficulty(hardBoard, 'hard', hardContext);
    const hardSecond = pickShotByDifficulty(hardBoard, 'hard', hardFirst.context);
    expect(serialize(hardFirst.coordinate)).not.toEqual(serialize(hardSecond.coordinate));
  });
});
