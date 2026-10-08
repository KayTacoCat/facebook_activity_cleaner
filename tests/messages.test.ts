import { describe, it, expect } from 'vitest';
import { isMessage, MAX_SCAN_ITEMS } from '../src/shared/messages';
import type { ActivityItem, Filters } from '../src/shared/types';

const filters: Filters = { includeTypes: ['comments'], contains: [], excludes: [], onlyActionable: false, excludeUnknown: true };
const item: ActivityItem = { id: 'item-0', snippet: 'Comment text', activityType: 'comments', actionLabels: [], fingerprint: 'DIV:0', matched: true, keep: false, state: 'discovered' };

describe('message boundary validation', () => {
  it('accepts valid preview requests and responses', () => {
    expect(isMessage({ type: 'PING' })).toBe(true);
    expect(isMessage({ type: 'SCAN', filters })).toBe(true);
    expect(isMessage({ type: 'SCAN_RESULT', supported: true, items: [item] })).toBe(true);
    expect(isMessage({ type: 'SCAN_RESULT', supported: false, items: [] })).toBe(true);
  });

  it.each([null, undefined, 'SCAN', [], { type: 'DELETE' }, { type: 'SCAN' }, { type: 'PING', html: '<script>' }])('rejects incomplete or unknown messages: %j', value => {
    expect(isMessage(value)).toBe(false);
  });

  it.each([
    { includeTypes: ['invalid'] }, { includeTypes: ['comments', 'comments'] }, { contains: [1] },
    { contains: Array(21).fill('x') }, { excludes: ['x'.repeat(161)] }, { onlyActionable: 'false' }, { excludeUnknown: null },
  ])('rejects malformed and oversized filters: %j', override => {
    expect(isMessage({ type: 'SCAN', filters: { ...filters, ...override } })).toBe(false);
  });

  it.each([
    { id: '<img>' }, { snippet: 'x'.repeat(161) }, { activityType: 'invalid' }, { actionLabels: [1] },
    { matched: 'true' }, { keep: 0 }, { state: 'invalid' }, { fingerprint: null }, { dateText: 123 }, { html: '<img>' },
  ])('rejects malformed result items: %j', override => {
    expect(isMessage({ type: 'SCAN_RESULT', supported: true, items: [{ ...item, ...override }] })).toBe(false);
  });

  it('rejects oversized, duplicate, and unsupported-page result lists', () => {
    const items = Array.from({ length: MAX_SCAN_ITEMS + 1 }, (_, index) => ({ ...item, id: `item-${index}` }));
    expect(isMessage({ type: 'SCAN_RESULT', supported: true, items })).toBe(false);
    expect(isMessage({ type: 'SCAN_RESULT', supported: true, items: [item, item] })).toBe(false);
    expect(isMessage({ type: 'SCAN_RESULT', supported: false, items: [item] })).toBe(false);
    expect(isMessage({ type: 'SCAN_RESULT', items: [] })).toBe(false);
  });

  it('accepts HTML-looking snippets only as strings for safe text rendering', () => {
    expect(isMessage({ type: 'SCAN_RESULT', supported: true, items: [{ ...item, snippet: '<img src="https://evil.test" onerror="alert(1)">' }] })).toBe(true);
  });

  it('validates runner state and highlighting payloads', () => {
    const run = { runId: 'test', state: 'idle', scanCount: 0, queuedCount: 0, completedCount: 0, failedCount: 0, skippedCount: 0 };
    expect(isMessage({ type: 'RUN_UPDATE', run })).toBe(true);
    expect(isMessage({ type: 'RUN_UPDATE', run: { ...run, scanCount: -1 } })).toBe(false);
    expect(isMessage({ type: 'RUN_UPDATE', run: { ...run, state: 'execute' } })).toBe(false);
    expect(isMessage({ type: 'HIGHLIGHT', itemIds: ['item-0'], protectedIds: [] })).toBe(true);
    expect(isMessage({ type: 'HIGHLIGHT', itemIds: ['item-0', 'item-0'], protectedIds: [] })).toBe(false);
  });
});
