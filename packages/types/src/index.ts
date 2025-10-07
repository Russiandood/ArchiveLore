export type Tier = 0 | 1 | 2 | 3 | 4 | 5; // Mundane..Divine
export type Role = 'broadcaster' | 'editor' | 'mod' | 'viewer';
export interface LedgerDelta {
  materials?: Record<number, number>;
  essence?: Record<number, number>;
  sparks?: Record<number, number>;
}
