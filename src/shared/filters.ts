import type { ActivityItem, Filters } from './types';
export const matchItem = (item: ActivityItem, filters: Filters): boolean => {
  if (filters.excludeUnknown && item.activityType === 'unknown') return false;
  if (filters.includeTypes.length && !filters.includeTypes.includes(item.activityType)) return false;
  const s = item.snippet.toLowerCase();
  if (filters.contains.some(k => !s.includes(k.toLowerCase()))) return false;
  if (filters.excludes.some(k => s.includes(k.toLowerCase()))) return false;
  if (filters.onlyActionable && item.actionLabels.length === 0) return false;
  return true;
};
