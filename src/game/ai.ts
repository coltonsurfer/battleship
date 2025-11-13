import { SHIP_DEFS } from './constants';
import type { AIMemory, BoardState, Coordinate, Difficulty, ShipDefinition } from './types';

const serialize = ({ x, y }: Coordinate) => `${x},${y}`;

export interface AIShotResult {
  coordinate: Coordinate;
  context: AIMemory;
}

function createEmptyHeatmap(size: number) {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

const random = () => Math.random();

export function ensureAIContext(ctx?: Partial<AIMemory>): AIMemory {
  return {
    attempted: ctx?.attempted ?? new Set<string>(),
    targetQueue: ctx?.targetQueue ? [...ctx.targetQueue] : [],
    lastHits: ctx?.lastHits ? [...ctx.lastHits] : [],
    probabilityGrid: ctx?.probabilityGrid?.map(row => [...row])
  };
}

function getUnseenCells(board: BoardState, ctx: AIMemory): Coordinate[] {
  const cells: Coordinate[] = [];
  for (let y = 0; y < board.size; y += 1) {
    for (let x = 0; x < board.size; x += 1) {
      const key = serialize({ x, y });
      if (!ctx.attempted.has(key)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

function getNeighbourCoords(coord: Coordinate, size: number): Coordinate[] {
  const neighbours = [
    { x: coord.x + 1, y: coord.y },
    { x: coord.x - 1, y: coord.y },
    { x: coord.x, y: coord.y + 1 },
    { x: coord.x, y: coord.y - 1 }
  ];
  return neighbours.filter(({ x, y }) => x >= 0 && y >= 0 && x < size && y < size);
}

function chooseRandom<T>(items: T[]): T {
  if (!items.length) {
    throw new Error('No items available for selection');
  }
  return items[Math.floor(random() * items.length)];
}

export function pickEasyShot(board: BoardState, ctx: AIMemory): AIShotResult {
  const unseen = getUnseenCells(board, ctx);
  const coord = chooseRandom(unseen);
  ctx.attempted.add(serialize(coord));
  return { coordinate: coord, context: ctx };
}

function sortTargets(queue: Coordinate[], hits: Coordinate[]): Coordinate[] {
  if (hits.length <= 1) return queue;
  const [first, second] = hits.slice(-2);
  if (first.x === second.x) {
    return queue.sort((a, b) => Math.abs(a.y - first.y) - Math.abs(b.y - first.y));
  }
  if (first.y === second.y) {
    return queue.sort((a, b) => Math.abs(a.x - first.x) - Math.abs(b.x - first.x));
  }
  return queue;
}

export function pickMediumShot(board: BoardState, ctx: AIMemory): AIShotResult {
  const queue = ctx.targetQueue;
  if (queue.length) {
    const coord = queue.shift()!;
    ctx.attempted.add(serialize(coord));
    return { coordinate: coord, context: ctx };
  }

  const unseenCells = getUnseenCells(board, ctx);
  const parityCells = unseenCells.filter(({ x, y }) => (x + y) % 2 === 0);
  const pool = parityCells.length ? parityCells : unseenCells;
  const coord = chooseRandom(pool);
  ctx.attempted.add(serialize(coord));
  return { coordinate: coord, context: ctx };
}

function enumeratePlacements(
  ship: ShipDefinition,
  board: BoardState,
  hits: Coordinate[],
  misses: Coordinate[]
): Coordinate[][] {
  const placements: Coordinate[][] = [];
  const hitSet = new Set(hits.map(serialize));
  const missSet = new Set(misses.map(serialize));

  for (let y = 0; y < board.size; y += 1) {
    for (let x = 0; x < board.size; x += 1) {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        const coords: Coordinate[] = [];
        let valid = true;
        for (let i = 0; i < ship.length; i += 1) {
          const cx = orientation === 'horizontal' ? x + i : x;
          const cy = orientation === 'vertical' ? y + i : y;
          if (cx >= board.size || cy >= board.size) {
            valid = false;
            break;
          }
          const key = serialize({ x: cx, y: cy });
          if (missSet.has(key)) {
            valid = false;
            break;
          }
          coords.push({ x: cx, y: cy });
        }
        if (!valid) continue;
        if (hits.length && !coords.some(coord => hitSet.has(serialize(coord)))) continue;
        placements.push(coords);
      }
    }
  }

  return placements;
}

function collectHits(board: BoardState): Coordinate[] {
  const coords: Coordinate[] = [];
  board.grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.status === 'hit') coords.push({ x, y });
    });
  });
  return coords;
}

function collectMisses(board: BoardState): Coordinate[] {
  const coords: Coordinate[] = [];
  board.grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.status === 'miss') coords.push({ x, y });
    });
  });
  return coords;
}

function prioritiseHotCells(candidates: Coordinate[], hits: Coordinate[], board: BoardState): Coordinate[] {
  if (hits.length === 0) return candidates;
  const hitSet = new Set(hits.map(serialize));
  return candidates.sort((a, b) => {
    const aAdj = getNeighbourCoords(a, board.size).some(n => hitSet.has(serialize(n))) ? 1 : 0;
    const bAdj = getNeighbourCoords(b, board.size).some(n => hitSet.has(serialize(n))) ? 1 : 0;
    if (aAdj === bAdj) {
      const center = (board.size - 1) / 2;
      const aDist = Math.abs(a.x - center) + Math.abs(a.y - center);
      const bDist = Math.abs(b.x - center) + Math.abs(b.y - center);
      return aDist - bDist;
    }
    return bAdj - aAdj;
  });
}

export function pickHardShot(board: BoardState, ctx: AIMemory): AIShotResult {
  const hits = collectHits(board);
  const misses = collectMisses(board);
  const heatmap = createEmptyHeatmap(board.size);

  for (const shipId of board.remainingShips) {
    const ship = SHIP_DEFS[shipId];
    for (const placement of enumeratePlacements(ship, board, hits, misses)) {
      placement.forEach(({ x, y }) => {
        if (!ctx.attempted.has(serialize({ x, y }))) {
          heatmap[y][x] += 1;
        }
      });
    }
  }

  let candidates: Coordinate[] = [];
  let bestScore = -1;
  for (let y = 0; y < heatmap.length; y += 1) {
    for (let x = 0; x < heatmap[y].length; x += 1) {
      const score = heatmap[y][x];
      const key = serialize({ x, y });
      if (ctx.attempted.has(key)) continue;
      if (score > bestScore) {
        candidates = [{ x, y }];
        bestScore = score;
      } else if (score === bestScore) {
        candidates.push({ x, y });
      }
    }
  }

  if (!candidates.length) {
    return pickMediumShot(board, ctx);
  }

  const prioritised = prioritiseHotCells(candidates, hits, board);
  const coord = prioritised[0];
  ctx.attempted.add(serialize(coord));
  ctx.probabilityGrid = heatmap;
  return { coordinate: coord, context: ctx };
}

export function updateContextOnHit(
  ctx: AIMemory,
  coord: Coordinate,
  sunk: boolean,
  boardSize: number
): AIMemory {
  const next = ensureAIContext(ctx);
  next.lastHits = [...next.lastHits, coord];
  if (sunk) {
    next.targetQueue = [];
    next.lastHits = [];
    return next;
  }
  const neighbours = getNeighbourCoords(coord, boardSize).filter(
    n => !next.attempted.has(serialize(n))
  );
  const dedup = new Map<string, Coordinate>();
  [...next.targetQueue, ...neighbours].forEach(c => dedup.set(serialize(c), c));
  next.targetQueue = sortTargets([...dedup.values()], next.lastHits);
  return next;
}

export function updateContextOnMiss(ctx: AIMemory): AIMemory {
  return ensureAIContext(ctx);
}

export function pickShotByDifficulty(board: BoardState, difficulty: Difficulty, ctx: AIMemory): AIShotResult {
  switch (difficulty) {
    case 'easy':
      return pickEasyShot(board, ctx);
    case 'medium':
      return pickMediumShot(board, ctx);
    case 'hard':
      return pickHardShot(board, ctx);
    default:
      return pickEasyShot(board, ctx);
  }
}
