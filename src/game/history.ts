import type { BoardState, GameState } from './types';
import { cloneBoard, fireAt } from './engine';

export interface ReplaySnapshot {
  turn: number;
  shooter: 'player' | 'ai';
  boardPlayer: BoardState;
  boardAI: BoardState;
}

export function createReplaySnapshots(initial: GameState): ReplaySnapshot[] {
  let boardPlayer = cloneBoard(initial.initialBoardPlayer ?? initial.boardPlayer);
  let boardAI = cloneBoard(initial.initialBoardAI ?? initial.boardAI);

  const snapshots: ReplaySnapshot[] = [
    {
      turn: 0,
      shooter: 'player',
      boardPlayer: cloneBoard(boardPlayer),
      boardAI: cloneBoard(boardAI)
    }
  ];

  initial.history.forEach(record => {
    const snapshot: ReplaySnapshot = {
      turn: record.turn,
      shooter: record.shooter,
      boardPlayer: cloneBoard(boardPlayer),
      boardAI: cloneBoard(boardAI)
    };
    snapshots.push(snapshot);
  });

  return snapshots;
}

export function getHistoryAtTurn(game: GameState, turn: number | null): { player: BoardState; ai: BoardState } {
  if (turn === null || game.history.length === 0 || game.phase === 'setup') {
    return {
      player: game.boardPlayer,
      ai: game.boardAI
    };
  }

  let playerBoard = cloneBoard(game.initialBoardPlayer ?? game.boardPlayer);
  let aiBoard = cloneBoard(game.initialBoardAI ?? game.boardAI);

  const sortedHistory = [...game.history].sort((a, b) => a.turn - b.turn);

  for (const entry of sortedHistory) {
    if (entry.shooter === 'player') {
      const [nextBoard] = fireAt(aiBoard, entry.target);
      aiBoard = nextBoard;
    } else {
      const [nextBoard] = fireAt(playerBoard, entry.target);
      playerBoard = nextBoard;
    }

    if (entry.turn === turn) {
      break;
    }
  }

  return {
    player: playerBoard,
    ai: aiBoard
  };
}
