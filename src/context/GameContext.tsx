import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren
} from 'react';

import { BOARD_SIZE, DEFAULT_DIFFICULTY, DEFAULT_SHIPS } from '../game/constants';
import {
  cloneBoard,
  createEmptyBoard,
  fireAt,
  isFleetComplete,
  isVictory,
  randomizeFleet
} from '../game/engine';
import {
  ensureAIContext,
  pickShotByDifficulty,
  updateContextOnHit,
  updateContextOnMiss
} from '../game/ai';
import type { AIMemory, BoardState, Coordinate, Difficulty, GameState, ShipId, ShotOutcome } from '../game/types';

interface PlayerFirePayload {
  coordinate: Coordinate;
}

interface AiShotPayload {
  coordinate: Coordinate;
  board: BoardState;
  outcome: ShotOutcome;
  aiMemory: AIMemory;
}

interface SetBoardPayload {
  board: BoardState;
}

interface SetHistoryCursorPayload {
  turn: number | null;
}

export type GameAction =
  | { type: 'RESET_TO_SETUP' }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'RANDOMIZE_PLAYER_FLEET'; seed?: number }
  | { type: 'SET_PLAYER_BOARD'; payload: SetBoardPayload }
  | { type: 'START_GAME'; seed?: number }
  | { type: 'PLAYER_FIRE'; payload: PlayerFirePayload }
  | { type: 'AI_SHOT_RESOLVED'; payload: AiShotPayload }
  | { type: 'TOGGLE_HISTORY' }
  | { type: 'SET_HISTORY_CURSOR'; payload: SetHistoryCursorPayload };

const GameContext = createContext<{ state: GameState; dispatch: Dispatch<GameAction> } | undefined>(
  undefined
);

const getRemainingShips = (board: BoardState): ShipId[] =>
  DEFAULT_SHIPS.filter((ship): boolean => !board.ships.some(s => s.shipId === ship.id)).map(
    ({ id }) => id
  );

function createInitialState(difficulty: Difficulty = DEFAULT_DIFFICULTY): GameState {
  const boardPlayer = createEmptyBoard(BOARD_SIZE);
  const boardAI = createEmptyBoard(BOARD_SIZE);
  return {
    phase: 'setup',
    difficulty,
    boardPlayer,
    boardAI,
    aiMemory: ensureAIContext(),
    initialBoardPlayer: undefined,
    initialBoardAI: undefined,
    turnCount: 1,
    history: [],
    historyCursor: null,
    placementOrder: getRemainingShips(boardPlayer),
    isHistoryOpen: false,
    winner: undefined,
    aiThinking: false
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET_TO_SETUP':
      return createInitialState(state.difficulty);

    case 'SET_DIFFICULTY':
      if (state.phase !== 'setup') {
        return { ...state, difficulty: action.difficulty };
      }
      return { ...createInitialState(action.difficulty) };

    case 'RANDOMIZE_PLAYER_FLEET': {
      const randomized = randomizeFleet(action.seed ?? Date.now());
      return {
        ...state,
        boardPlayer: randomized,
        placementOrder: getRemainingShips(randomized)
      };
    }

    case 'SET_PLAYER_BOARD':
      return {
        ...state,
        boardPlayer: action.payload.board,
        placementOrder: getRemainingShips(action.payload.board)
      };

    case 'START_GAME': {
      if (!isFleetComplete(state.boardPlayer)) {
        throw new Error('Cannot start game until all ships are placed.');
      }
      const boardAI = randomizeFleet(action.seed ?? Date.now());
      return {
        ...state,
        phase: 'playerTurn',
        boardAI,
        initialBoardPlayer: cloneBoard(state.boardPlayer),
        initialBoardAI: cloneBoard(boardAI),
        aiMemory: ensureAIContext(),
        turnCount: 1,
        history: [],
        historyCursor: null,
        winner: undefined,
        aiThinking: false
      };
    }

    case 'PLAYER_FIRE': {
      if (state.phase !== 'playerTurn') return state;
      const { coordinate } = action.payload;
      const [boardAI, outcome] = fireAt(state.boardAI, coordinate);

      const historyEntry = {
        turn: state.turnCount,
        shooter: 'player' as const,
        target: coordinate,
        result: outcome.result,
        shipId: outcome.result === 'hit' ? outcome.shipId : undefined,
        sunk: outcome.result === 'hit' ? outcome.sunk : undefined,
        timestamp: Date.now()
      };

      if (isVictory(boardAI)) {
        return {
          ...state,
          boardAI,
          history: [...state.history, historyEntry],
          winner: 'player',
          phase: 'finished',
          aiThinking: false,
          turnCount: state.turnCount + 1,
          historyCursor: null
        };
      }

      return {
        ...state,
        boardAI,
        history: [...state.history, historyEntry],
        phase: 'aiTurn',
        aiThinking: true,
        turnCount: state.turnCount + 1,
        historyCursor: null
      };
    }

    case 'AI_SHOT_RESOLVED': {
      if (state.phase !== 'aiTurn') return state;
      const { coordinate, board, outcome, aiMemory } = action.payload;

      const historyEntry = {
        turn: state.turnCount,
        shooter: 'ai' as const,
        target: coordinate,
        result: outcome.result,
        shipId: outcome.result === 'hit' ? outcome.shipId : undefined,
        sunk: outcome.result === 'hit' ? outcome.sunk : undefined,
        timestamp: Date.now()
      };

      if (isVictory(board)) {
        return {
          ...state,
          boardPlayer: board,
          history: [...state.history, historyEntry],
          winner: 'ai',
          phase: 'finished',
          aiThinking: false,
          aiMemory,
          turnCount: state.turnCount + 1,
          historyCursor: null
        };
      }

      return {
        ...state,
        boardPlayer: board,
        history: [...state.history, historyEntry],
        phase: 'playerTurn',
        aiThinking: false,
        aiMemory,
        turnCount: state.turnCount + 1,
        historyCursor: null
      };
    }

    case 'TOGGLE_HISTORY':
      return {
        ...state,
        isHistoryOpen: !state.isHistoryOpen,
        historyCursor: state.isHistoryOpen ? null : state.historyCursor
      };

    case 'SET_HISTORY_CURSOR':
      return {
        ...state,
        historyCursor: action.payload.turn
      };

    default:
      return state;
  }
}

export function GameProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState());

  useEffect(() => {
    if (state.phase !== 'aiTurn' || !state.aiThinking || state.winner) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const baseContext = ensureAIContext(state.aiMemory);
      const { coordinate, context } = pickShotByDifficulty(state.boardPlayer, state.difficulty, baseContext);
      const [board, outcome] = fireAt(state.boardPlayer, coordinate);
      const updatedContext = outcome.result === 'hit'
        ? updateContextOnHit(context, coordinate, outcome.sunk, state.boardPlayer.size)
        : updateContextOnMiss(context);

      dispatch({
        type: 'AI_SHOT_RESOLVED',
        payload: {
          coordinate,
          board,
          outcome,
          aiMemory: updatedContext
        }
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [state.phase, state.aiThinking, state.boardPlayer, state.difficulty, state.aiMemory, state.winner]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider');
  }
  return ctx;
}
