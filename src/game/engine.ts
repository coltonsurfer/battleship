import { BOARD_SIZE, DEFAULT_SHIPS, SHIP_ORDER } from './constants';
import type {
  BoardState,
  CellState,
  Coordinate,
  Orientation,
  ShipDefinition,
  ShipId,
  ShipPlacement,
  ShotOutcome
} from './types';

const ORIENTATION_VECTORS: Record<Orientation, Coordinate> = {
  horizontal: { x: 1, y: 0 },
  vertical: { x: 0, y: 1 }
};

const serialize = ({ x, y }: Coordinate) => `${x},${y}`;

function createEmptyGrid(size: number): CellState[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ status: 'empty' } as CellState))
  );
}

export function createEmptyBoard(size: number = BOARD_SIZE): BoardState {
  return {
    size,
    grid: createEmptyGrid(size),
    ships: [],
    remainingShips: [...SHIP_ORDER]
  };
}

function isWithinBounds({ x, y }: Coordinate, size: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function getShipCells(origin: Coordinate, length: number, orientation: Orientation): Coordinate[] {
  const delta = ORIENTATION_VECTORS[orientation];
  return Array.from({ length }, (_, idx) => ({
    x: origin.x + delta.x * idx,
    y: origin.y + delta.y * idx
  }));
}

export function canPlaceShip(
  board: BoardState,
  ship: ShipDefinition,
  origin: Coordinate,
  orientation: Orientation
): boolean {
  const cells = getShipCells(origin, ship.length, orientation);
  if (!cells.every(coord => isWithinBounds(coord, board.size))) return false;

  return cells.every(({ x, y }) => {
    const cell = board.grid[y][x];
    return cell.status === 'empty' || (cell.status === 'ship' && cell.shipId === ship.id);
  });
}

function clearShipFromGrid(grid: CellState[][], ship: ShipPlacement): void {
  const cells = getShipCells(ship.origin, ship.length, ship.orientation);
  cells.forEach(({ x, y }) => {
    grid[y][x] = { status: 'empty' };
  });
}

export function placeShip(
  board: BoardState,
  ship: ShipDefinition,
  origin: Coordinate,
  orientation: Orientation
): BoardState {
  if (!canPlaceShip(board, ship, origin, orientation)) {
    throw new Error(`Cannot place ship ${ship.id} at ${origin.x},${origin.y}`);
  }

  const grid = board.grid.map(row => row.slice());
  const ships = board.ships.map(s => ({ ...s, hits: [...s.hits] }));

  const existing = ships.find(s => s.shipId === ship.id);
  if (existing) {
    clearShipFromGrid(grid, existing);
  }

  const placement: ShipPlacement = {
    shipId: ship.id,
    origin,
    orientation,
    length: ship.length,
    hits: existing ? existing.hits.filter(hit =>
      getShipCells(origin, ship.length, orientation).some(cell => cell.x === hit.x && cell.y === hit.y)
    ) : [],
    sunk: false
  };

  const cells = getShipCells(origin, ship.length, orientation);
  cells.forEach(({ x, y }) => {
    grid[y][x] = { status: 'ship', shipId: ship.id };
  });

  const updatedShips = existing
    ? ships.map(s => (s.shipId === ship.id ? placement : s))
    : [...ships, placement];

  return {
    ...board,
    grid,
    ships: updatedShips,
    remainingShips: board.remainingShips.includes(ship.id)
      ? board.remainingShips
      : [...board.remainingShips, ship.id]
  };
}

export function removeShip(board: BoardState, shipId: ShipId): BoardState {
  const existing = board.ships.find(s => s.shipId === shipId);
  if (!existing) return board;

  const grid = board.grid.map(row => row.slice());
  clearShipFromGrid(grid, existing);

  return {
    ...board,
    grid,
    ships: board.ships.filter(s => s.shipId !== shipId),
    remainingShips: board.remainingShips.includes(shipId)
      ? board.remainingShips
      : [...board.remainingShips]
  };
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomizeFleet(seed: number = Date.now()): BoardState {
  const rand = mulberry32(seed);
  let board = createEmptyBoard();

  for (const ship of DEFAULT_SHIPS) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 500) {
      attempts += 1;
      const orientation: Orientation = rand() < 0.5 ? 'horizontal' : 'vertical';
      const maxX = orientation === 'horizontal' ? board.size - ship.length : board.size - 1;
      const maxY = orientation === 'vertical' ? board.size - ship.length : board.size - 1;
      const origin = {
        x: Math.floor(rand() * (maxX + 1)),
        y: Math.floor(rand() * (maxY + 1))
      };

      if (canPlaceShip(board, ship, origin, orientation)) {
        board = placeShip(board, ship, origin, orientation);
        placed = true;
      }
    }

    if (!placed) {
      throw new Error(`Failed to place ship ${ship.id} randomly`);
    }
  }

  return board;
}

function updateShipHits(ship: ShipPlacement, coord: Coordinate): ShipPlacement {
  const exists = ship.hits.some(hit => hit.x === coord.x && hit.y === coord.y);
  if (exists) return ship;

  const hits = [...ship.hits, coord];
  const sunk = hits.length >= ship.length;
  return { ...ship, hits, sunk };
}

export function fireAt(board: BoardState, coord: Coordinate): [BoardState, ShotOutcome] {
  const { x, y } = coord;
  if (!isWithinBounds(coord, board.size)) {
    throw new Error(`Shot ${x},${y} out of bounds.`);
  }

  const cell = board.grid[y][x];
  if (cell.status === 'miss' || cell.status === 'hit' || cell.status === 'sunk') {
    throw new Error(`Cell ${x},${y} already targeted.`);
  }

  const grid = board.grid.map(row => row.slice());
  const ships = board.ships.map(ship => ({ ...ship, hits: [...ship.hits] }));

  if (cell.status !== 'ship') {
    grid[y][x] = { status: 'miss' };
    return [{ ...board, grid }, { result: 'miss' }];
  }

  const shipId = cell.shipId;
  grid[y][x] = { status: 'hit', shipId };

  const updatedShips = ships.map(ship =>
    ship.shipId === shipId ? updateShipHits(ship, coord) : ship
  );

  const targetShip = updatedShips.find(ship => ship.shipId === shipId)!;
  if (targetShip.sunk) {
    const cells = getShipCells(targetShip.origin, targetShip.length, targetShip.orientation);
    cells.forEach(({ x: cx, y: cy }) => {
      grid[cy][cx] = { status: 'sunk', shipId };
    });
  }

  const remainingShips = targetShip.sunk
    ? board.remainingShips.filter(id => id !== shipId)
    : board.remainingShips;

  return [
    { ...board, grid, ships: updatedShips, remainingShips },
    { result: 'hit', shipId, sunk: targetShip.sunk }
  ];
}

export function isFleetComplete(board: BoardState): boolean {
  return board.ships.length === DEFAULT_SHIPS.length;
}

export function isVictory(board: BoardState): boolean {
  return board.remainingShips.length === 0;
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    size: board.size,
    grid: board.grid.map(row => row.map(cell => ({ ...cell }))),
    ships: board.ships.map(ship => ({
      shipId: ship.shipId,
      origin: { ...ship.origin },
      orientation: ship.orientation,
      length: ship.length,
      hits: ship.hits.map(hit => ({ ...hit })),
      sunk: ship.sunk
    })),
    remainingShips: [...board.remainingShips]
  };
}

export function coordinatesForShip(ship: ShipPlacement): Coordinate[] {
  return getShipCells(ship.origin, ship.length, ship.orientation);
}

export function boardToSet(board: BoardState): Set<string> {
  const set = new Set<string>();
  for (let y = 0; y < board.size; y += 1) {
    for (let x = 0; x < board.size; x += 1) {
      const cell = board.grid[y][x];
      if (cell.status === 'miss' || cell.status === 'hit' || cell.status === 'sunk') {
        set.add(serialize({ x, y }));
      }
    }
  }
  return set;
}
