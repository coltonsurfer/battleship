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
  if (hits.length === 0) {
    // For hard mode: prioritize center cells and high-value positions
    return candidates.sort((a, b) => {
      const center = (board.size - 1) / 2;
      const aDist = Math.abs(a.x - center) + Math.abs(a.y - center);
      const bDist = Math.abs(b.x - center) + Math.abs(b.y - center);
      return aDist - bDist;
    });
  }
  
  const hitSet = new Set(hits.map(serialize));
  return candidates.sort((a, b) => {
    // Prioritize cells adjacent to hits
    const aAdj = getNeighbourCoords(a, board.size).filter(n => hitSet.has(serialize(n))).length;
    const bAdj = getNeighbourCoords(b, board.size).filter(n => hitSet.has(serialize(n))).length;
    
    if (aAdj !== bAdj) {
      return bAdj - aAdj;
    }
    
    // Secondary: prefer cells that align with hit patterns
    const aAligned = hits.some(h => h.x === a.x || h.y === a.y) ? 1 : 0;
    const bAligned = hits.some(h => h.x === b.x || h.y === b.y) ? 1 : 0;
    
    if (aAligned !== bAligned) {
      return bAligned - aAligned;
    }
    
    // Tertiary: prefer center positions
    const center = (board.size - 1) / 2;
    const aDist = Math.abs(a.x - center) + Math.abs(a.y - center);
    const bDist = Math.abs(b.x - center) + Math.abs(b.y - center);
    return aDist - bDist;
  });
}

export function pickHardShot(board: BoardState, ctx: AIMemory): AIShotResult {
  const hits = collectHits(board);
  const misses = collectMisses(board);
  const heatmap = createEmptyHeatmap(board.size);

  // Build probability heatmap based on all possible ship placements
  for (const shipId of board.remainingShips) {
    const ship = SHIP_DEFS[shipId];
    const placements = enumeratePlacements(ship, board, hits, misses);
    
    // Weight longer ships more heavily (they're harder to hide)
    const weight = ship.length;
    
    for (const placement of placements) {
      placement.forEach(({ x, y }) => {
        if (!ctx.attempted.has(serialize({ x, y }))) {
          heatmap[y][x] += weight;
        }
      });
    }
  }

  // Apply additional strategic bonuses
  for (let y = 0; y < heatmap.length; y += 1) {
    for (let x = 0; x < heatmap[y].length; x += 1) {
      const key = serialize({ x, y });
      if (ctx.attempted.has(key)) continue;
      
      // Bonus for cells adjacent to hits (hunt mode)
      const adjacentHits = getNeighbourCoords({ x, y }, board.size)
        .filter(n => hits.some(h => h.x === n.x && h.y === n.y))
        .length;
      heatmap[y][x] += adjacentHits * 50; // Heavy bonus for adjacent cells
      
      // Bonus for cells that form lines with existing hits
      const lineBonus = hits.filter(h => 
        (h.x === x && Math.abs(h.y - y) <= 2) || 
        (h.y === y && Math.abs(h.x - x) <= 2)
      ).length;
      heatmap[y][x] += lineBonus * 30;
      
      // Bonus for center positions (ships more likely in center)
      const center = (board.size - 1) / 2;
      const distFromCenter = Math.abs(x - center) + Math.abs(y - center);
      const centerBonus = Math.max(0, 10 - distFromCenter);
      heatmap[y][x] += centerBonus;
      
      // Bonus for parity pattern (checkerboard optimization)
      if ((x + y) % 2 === 0) {
        heatmap[y][x] += 5;
      }
    }
  }

  // Find all cells with the highest probability
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

  // Use advanced prioritization to break ties
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
