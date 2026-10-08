import type { ActivityItem, Filters, RunState } from './types';

export const MAX_SCAN_ITEMS = 200;
export const MAX_SNIPPET_LENGTH = 160;

export type Message =
  | { type: 'PING' }
  | { type: 'SCAN'; filters: Filters }
  | { type: 'SCAN_RESULT'; items: ActivityItem[]; supported: boolean }
  | { type: 'RUN_UPDATE'; run: RunState }
  | { type: 'HIGHLIGHT'; itemIds: string[]; protectedIds: string[] };

const activityTypes = ['posts', 'comments', 'reactions', 'shares', 'media', 'tags', 'group', 'page', 'searches', 'unknown'];
const itemStates = ['discovered', 'matched', 'protected', 'queued', 'active', 'action_menu_opened', 'action_selected', 'confirmation_detected', 'confirmed', 'completed', 'skipped', 'failed'];
const runStates = ['idle', 'validating_page', 'scanning', 'scan_complete', 'awaiting_user_review', 'awaiting_confirmation', 'running', 'paused', 'stopping', 'stopped', 'completed', 'failed'];

const isRecord = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === 'object' && !Array.isArray(x)
  && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const hasKeys = (x: Record<string, unknown>, required: string[], optional: string[] = []): boolean =>
  required.every(key => Object.hasOwn(x, key))
  && Object.keys(x).every(key => required.includes(key) || optional.includes(key));
const boundedString = (x: unknown, max: number): x is string => typeof x === 'string' && x.length <= max;
const stringArray = (x: unknown, maxItems: number, maxLength: number): x is string[] =>
  Array.isArray(x) && x.length <= maxItems && x.every(value => boundedString(value, maxLength));
const isId = (x: unknown): x is string => typeof x === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(x);
const idArray = (x: unknown): x is string[] =>
  Array.isArray(x) && x.length <= MAX_SCAN_ITEMS && x.every(isId) && new Set(x).size === x.length;
const isCount = (x: unknown): boolean => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;

export const isFilters = (x: unknown): x is Filters => {
  if (!isRecord(x) || !hasKeys(x, ['includeTypes', 'contains', 'excludes', 'onlyActionable', 'excludeUnknown'])) return false;
  return stringArray(x.includeTypes, activityTypes.length, 20)
    && x.includeTypes.every(value => activityTypes.includes(value))
    && new Set(x.includeTypes).size === x.includeTypes.length
    && stringArray(x.contains, 20, MAX_SNIPPET_LENGTH)
    && stringArray(x.excludes, 20, MAX_SNIPPET_LENGTH)
    && typeof x.onlyActionable === 'boolean' && typeof x.excludeUnknown === 'boolean';
};

export const isActivityItem = (x: unknown): x is ActivityItem => {
  if (!isRecord(x) || !hasKeys(x, ['id', 'snippet', 'activityType', 'actionLabels', 'fingerprint', 'matched', 'keep', 'state'], ['dateText'])) return false;
  return isId(x.id) && boundedString(x.snippet, MAX_SNIPPET_LENGTH)
    && typeof x.activityType === 'string' && activityTypes.includes(x.activityType)
    && stringArray(x.actionLabels, 10, 100) && boundedString(x.fingerprint, 100)
    && typeof x.matched === 'boolean' && typeof x.keep === 'boolean'
    && typeof x.state === 'string' && itemStates.includes(x.state)
    && (!Object.hasOwn(x, 'dateText') || boundedString(x.dateText, 100));
};

const isRunState = (x: unknown): x is RunState => {
  if (!isRecord(x) || !hasKeys(x, ['runId', 'state', 'scanCount', 'queuedCount', 'completedCount', 'failedCount', 'skippedCount'], ['startedAt', 'lastActionAt'])) return false;
  return boundedString(x.runId, 100) && typeof x.state === 'string' && runStates.includes(x.state)
    && ['scanCount', 'queuedCount', 'completedCount', 'failedCount', 'skippedCount'].every(key => isCount(x[key]))
    && ['startedAt', 'lastActionAt'].every(key => !Object.hasOwn(x, key) || boundedString(x[key], 40));
};

/** Validate the complete, bounded payload before using data from another context. */
export const isMessage = (x: unknown): x is Message => {
  if (!isRecord(x)) return false;
  switch (x.type) {
    case 'PING': return hasKeys(x, ['type']);
    case 'SCAN': return hasKeys(x, ['type', 'filters']) && isFilters(x.filters);
    case 'SCAN_RESULT':
      return hasKeys(x, ['type', 'items', 'supported']) && typeof x.supported === 'boolean'
        && Array.isArray(x.items) && x.items.length <= MAX_SCAN_ITEMS && x.items.every(isActivityItem)
        && new Set(x.items.map(item => item.id)).size === x.items.length
        && (x.supported || x.items.length === 0);
    case 'RUN_UPDATE': return hasKeys(x, ['type', 'run']) && isRunState(x.run);
    case 'HIGHLIGHT': return hasKeys(x, ['type', 'itemIds', 'protectedIds']) && idArray(x.itemIds) && idArray(x.protectedIds);
    default: return false;
  }
};
