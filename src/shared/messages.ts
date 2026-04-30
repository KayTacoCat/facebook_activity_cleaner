import type { ActivityItem, Filters, RunState } from './types';
export type Message =
  | { type: 'PING' }
  | { type: 'SCAN'; filters: Filters }
  | { type: 'SCAN_RESULT'; items: ActivityItem[] }
  | { type: 'RUN_UPDATE'; run: RunState }
  | { type: 'HIGHLIGHT'; itemIds: string[]; protectedIds: string[] };

export const isMessage = (x: unknown): x is Message => !!x && typeof x === 'object' && 'type' in (x as any);
