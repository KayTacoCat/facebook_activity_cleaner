// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityItem } from '../src/shared/types';

const supportedTab = { id: 7, url: 'https://www.facebook.com/me/allactivity/' };
const item: ActivityItem = { id: 'item-0', snippet: 'Comment <img src="https://attacker.test">', activityType: 'comments', actionLabels: [], fingerprint: 'DIV:0', matched: true, keep: false, state: 'discovered' };
let query: ReturnType<typeof vi.fn>;
let send: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const app = document.createElement('main');
  app.id = 'app';
  document.body.replaceChildren(app);
  query = vi.fn().mockResolvedValue([supportedTab]);
  send = vi.fn().mockResolvedValue({ type: 'SCAN_RESULT', supported: true, items: [item] });
  vi.stubGlobal('chrome', { tabs: { query, sendMessage: send } });
  await import('../src/sidepanel/main');
});
afterEach(() => { vi.unstubAllGlobals(); });

const clickScan = () => document.querySelector<HTMLButtonElement>('#scan')!.click();
const status = () => document.querySelector('#status')!.textContent;

describe('side panel scan response boundary', () => {
  it('scans only the main frame and renders the validated result as literal text', async () => {
    clickScan();
    await vi.waitFor(() => expect(status()).toContain('Preview complete'));
    expect(send).toHaveBeenCalledWith(7, expect.objectContaining({ type: 'SCAN' }), { frameId: 0 });
    expect(document.querySelector('li')!.textContent).toContain(item.snippet);
    expect(document.querySelector('img')).toBeNull();
  });

  it.each([
    { tabs: [] }, { tabs: [{ id: 7, url: 'https://www.facebook.com/home.php' }] },
    { tabs: [{ id: 7, url: 'https://www.facebook.com.evil.test/me/allactivity/' }] },
    { tabs: [{ url: supportedTab.url }] },
  ])('does not send scans to an unsupported active tab: %j', ({ tabs }) => {
    query.mockResolvedValue(tabs);
    clickScan();
    return vi.waitFor(() => {
      expect(status()).toContain('before scanning');
      expect(send).not.toHaveBeenCalled();
    });
  });

  it.each([
    undefined, { type: 'SCAN_RESULT', items: [item] }, { type: 'SCAN_RESULT', supported: true, items: [{ ...item, matched: 'true' }] },
    { type: 'SCAN_RESULT', supported: true, items: [item, item] },
  ])('rejects malformed responses without displaying activity: %j', response => {
    send.mockResolvedValue(response);
    clickScan();
    return vi.waitFor(() => {
      expect(status()).toContain('invalid scan response');
      expect(document.querySelector('li')).toBeNull();
    });
  });

  it('discards results when the user switches tabs during scanning', async () => {
    query.mockResolvedValueOnce([supportedTab]).mockResolvedValueOnce([{ ...supportedTab, id: 8 }]);
    clickScan();
    await vi.waitFor(() => expect(status()).toContain('changed during scanning'));
    expect(document.querySelector('li')).toBeNull();
  });

  it('discards results when the original tab navigates during scanning', async () => {
    query.mockResolvedValueOnce([supportedTab]).mockResolvedValueOnce([{ ...supportedTab, url: 'https://www.facebook.com/home.php' }]);
    clickScan();
    await vi.waitFor(() => expect(status()).toContain('changed during scanning'));
    expect(document.querySelector('li')).toBeNull();
  });

  it('handles messaging failures and allows another scan', async () => {
    send.mockRejectedValueOnce(new Error('Disconnected tab'));
    clickScan();
    await vi.waitFor(() => expect(status()).toContain('Scanning failed'));
    expect(document.querySelector<HTMLButtonElement>('#scan')!.disabled).toBe(false);
    clickScan();
    await vi.waitFor(() => expect(status()).toContain('Preview complete'));
  });
});
