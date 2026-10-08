import { afterEach, describe, expect, it, vi } from 'vitest';
import { logEvent } from '../src/debug/logger';

afterEach(() => { vi.unstubAllGlobals(); });

describe('private diagnostic storage', () => {
  it('stores only fixed diagnostic metadata and strips private data from old logs', async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('chrome', { storage: { local: { get: vi.fn().mockResolvedValue({ debugLogs: [{ ts: '2026-10-08T01:00:00Z', severity: 'info', code: 'SCAN_STARTED', message: 'Private activity', context: { email: 'private@example.test' } }, { arbitrary: 'bad value' }] }), set } } });
    await logEvent({ ts: '2026-10-08T01:01:00Z', severity: 'info', code: 'SCAN_COMPLETED', message: 'Private Facebook profile URL', context: { cookie: 'private cookie' } });
    expect(set).toHaveBeenCalledWith({ debugLogs: [
      { ts: '2026-10-08T01:00:00.000Z', severity: 'info', code: 'SCAN_STARTED' },
      { ts: '2026-10-08T01:01:00.000Z', severity: 'info', code: 'SCAN_COMPLETED' },
    ] });
    expect(JSON.stringify(set.mock.calls)).not.toContain('Private');
    expect(JSON.stringify(set.mock.calls)).not.toContain('cookie');
  });

  it('recovers from malformed storage and caps log history', async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const metadata = { ts: '2026-10-08T01:00:00Z', severity: 'info', code: 'SCAN_STARTED' };
    const get = vi.fn().mockResolvedValueOnce({ debugLogs: 'corrupt' }).mockResolvedValueOnce({ debugLogs: Array(600).fill(metadata) });
    vi.stubGlobal('chrome', { storage: { local: { get, set } } });
    const event = { ...metadata, severity: 'info' as const, code: 'SCAN_STARTED' as const, message: 'Discarded private text' };
    await logEvent(event);
    expect(set.mock.calls[0][0].debugLogs).toHaveLength(1);
    await logEvent(event);
    expect(set.mock.calls[1][0].debugLogs).toHaveLength(500);
  });
});
