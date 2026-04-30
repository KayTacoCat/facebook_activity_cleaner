export const redactText = (input, limit = 160) => {
  let text = (input || '').replace(/https?:\/\/www\.facebook\.com\/[A-Za-z0-9_.-]+/g, '[redacted-profile-link]');
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
};

export const matchItem = (item, filters) => {
  if (filters.excludeUnknown && item.activityType === 'unknown') return false;
  if (filters.includeTypes?.length && !filters.includeTypes.includes(item.activityType)) return false;
  const snippet = (item.snippet || '').toLowerCase();
  if (filters.contains?.length && !filters.contains.every(s => snippet.includes(s.toLowerCase()))) return false;
  if (filters.excludes?.length && filters.excludes.some(s => snippet.includes(s.toLowerCase()))) return false;
  if (filters.onlyActionable && (!item.actionLabels || item.actionLabels.length === 0)) return false;
  return true;
};
