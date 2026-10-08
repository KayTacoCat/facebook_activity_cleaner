import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
const sender = { id: extensionId, url: `chrome-extension://${extensionId}/sidepanel.html` };
let updated: (id: number, info: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => Promise<void>;
let message: (value: unknown, sender: chrome.runtime.MessageSender, reply: (value: unknown) => void) => void;
let setOptions: ReturnType<typeof vi.fn>;
let setAccessLevel: ReturnType<typeof vi.fn>;
let setPanelBehavior: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  setOptions = vi.fn().mockResolvedValue(undefined);
  setAccessLevel = vi.fn().mockResolvedValue(undefined);
  setPanelBehavior = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('chrome', {
    runtime: { id: extensionId, onInstalled: { addListener: vi.fn() }, onMessage: { addListener: (value: typeof message) => { message = value; } } },
    tabs: { onUpdated: { addListener: (value: typeof updated) => { updated = value; } } },
    sidePanel: { setOptions, setPanelBehavior }, storage: { local: { setAccessLevel } },
  });
  await import('../src/background/serviceWorker');
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('background security boundaries', () => {
  it('restricts storage to trusted contexts and enables toolbar access', () => {
    expect(setAccessLevel).toHaveBeenCalledWith({ accessLevel: 'TRUSTED_CONTEXTS' });
    expect(setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
  });

  it('enables only supported tabs and disables the panel after navigation', async () => {
    const tab = { id: 7, url: 'https://www.facebook.com/me/allactivity/' } as chrome.tabs.Tab;
    await updated(7, { status: 'complete' }, tab);
    expect(setOptions).toHaveBeenLastCalledWith({ tabId: 7, enabled: true, path: 'sidepanel.html' });
    await updated(7, { url: 'https://www.facebook.com.evil.test/me/allactivity/' }, tab);
    expect(setOptions).toHaveBeenLastCalledWith({ tabId: 7, enabled: false, path: 'sidepanel.html' });
    await updated(7, { url: 'https://www.facebook.com/home.php' }, tab);
    expect(setOptions).toHaveBeenLastCalledWith({ tabId: 7, enabled: false, path: 'sidepanel.html' });
  });

  it('handles a closed tab without an unhandled rejection', async () => {
    setOptions.mockRejectedValue(new Error('Closed tab'));
    await expect(updated(7, { status: 'complete' }, { url: 'https://www.facebook.com/me/allactivity/' } as chrome.tabs.Tab)).resolves.toBeUndefined();
  });

  it('rejects untrusted or malformed ping requests', () => {
    const reply = vi.fn();
    message({ type: 'PING' }, { ...sender, id: 'other-extension' }, reply);
    message({ type: 'PING' }, { ...sender, tab: { id: 1 } as chrome.tabs.Tab }, reply);
    message({ type: 'PING', extra: 'payload' }, sender, reply);
    message(null, sender, reply);
    expect(reply).not.toHaveBeenCalled();
    message({ type: 'PING' }, sender, reply);
    expect(reply).toHaveBeenCalledWith({ ok: true });
  });
});
