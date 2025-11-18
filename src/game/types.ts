export type Coordinate = {
  x: number;
  y: number;
};

export type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface ShipDefinition {
  id: ShipId;
  length: number;
  displayName: string;
}

export type Orientation = 'horizontal' | 'vertical';

export type CellState =
  | { status: 'empty' }
  | { status: 'ship'; shipId: ShipId }
  | { status: 'miss' }
  | { status: 'hit'; shipId: ShipId }
  | { status: 'sunk'; shipId: ShipId };

export interface ShipPlacement {
  shipId: ShipId;
  origin: Coordinate;
  orientation: Orientation;
  length: number;
  hits: Coordinate[];
  sunk: boolean;
}

export interface BoardState {
  size: number;
  grid: CellState[][];
  ships: ShipPlacement[];
  remainingShips: ShipId[];
}

export type Phase = 'setup' | 'playerTurn' | 'aiTurn' | 'finished';

export interface TurnRecord {
  turn: number;
  shooter: 'player' | 'ai';
  target: Coordinate;
  result: 'hit' | 'miss';
  shipId?: ShipId;
  sunk?: boolean;
  timestamp: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AIMemory {
  attempted: Set<string>;
  targetQueue: Coordinate[];
  lastHits: Coordinate[];
  probabilityGrid?: number[][];
}

export interface GameState {
  phase: Phase;
  difficulty: Difficulty;
  language: 'en' | 'es';
  boardPlayer: BoardState;
  boardAI: BoardState;
  initialBoardPlayer?: BoardState;
  initialBoardAI?: BoardState;
  aiMemory: AIMemory;
  turnCount: number;
  history: TurnRecord[];
  historyCursor: number | null;
  placementOrder: ShipId[];
  isHistoryOpen: boolean;
  winner?: 'player' | 'ai';
  aiThinking: boolean;
}

export interface ShotOutcomeHit {
  result: 'hit';
  shipId: ShipId;
  sunk: boolean;
}

export interface ShotOutcomeMiss {
  result: 'miss';
}

export type ShotOutcome = ShotOutcomeHit | ShotOutcomeMiss;
