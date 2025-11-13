import type { ShipDefinition, ShipId } from './types';

export const BOARD_SIZE = 10;

export const SHIP_ORDER: ShipId[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

export const SHIP_DEFS: Record<ShipId, ShipDefinition> = {
  carrier: { id: 'carrier', length: 5, displayName: 'Cattle Carrier (5)' },
  battleship: { id: 'battleship', length: 4, displayName: 'Bronco Battleship (4)' },
  cruiser: { id: 'cruiser', length: 3, displayName: 'Cowboy Cruiser (3)' },
  submarine: { id: 'submarine', length: 3, displayName: 'Stampede Sub (3)' },
  destroyer: { id: 'destroyer', length: 2, displayName: 'Lasso Destroyer (2)' }
};

export const DEFAULT_SHIPS: ShipDefinition[] = SHIP_ORDER.map(id => SHIP_DEFS[id]);

export const DEFAULT_DIFFICULTY = 'easy' as const;
