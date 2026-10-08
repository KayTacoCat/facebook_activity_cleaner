// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Filters } from '../src/shared/types';

const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
const sender = { id: extensionId, url: `chrome-extension://${extensionId}/sidepanel.html` };
const filters: Filters = { includeTypes: [], contains: [], excludes: [], onlyActionable: false, excludeUnknown: true };
type Listener = (message: unknown, sender: chrome.runtime.MessageSender, reply: (value: unknown) => void) => void;
let listener: Listener;

beforeEach(async () => {
  vi.resetModules();
  document.body.replaceChildren();
  vi.stubGlobal('chrome', { runtime: { id: extensionId, onMessage: { addListener: (value: Listener) => { listener = value; } } } });
  vi.stubGlobal('location', { href: 'https://www.facebook.com/me/allactivity/' });
  await import('../src/content/activityContentScript');
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('content script scan authorization', () => {
  it.each([null, { type: 'SCAN' }, { type: 'SCAN', filters: { ...filters, contains: [1] } }, { type: 'DELETE' }])('ignores malformed or non-preview requests: %j', message => {
    const query = vi.spyOn(document, 'querySelectorAll');
    const reply = vi.fn();
    expect(() => listener(message, sender, reply)).not.toThrow();
    expect(query).not.toHaveBeenCalled();
    expect(reply).not.toHaveBeenCalled();
  });

  it.each([
    { ...sender, id: 'another-extension' }, { ...sender, tab: { id: 1 } },
    { id: extensionId, url: 'https://www.facebook.com/me/allactivity/' }, {},
  ])('reads no page content for untrusted senders: %j', untrusted => {
    const query = vi.spyOn(document, 'querySelectorAll');
    const reply = vi.fn();
    listener({ type: 'SCAN', filters }, untrusted, reply);
    expect(query).not.toHaveBeenCalled();
    expect(reply).not.toHaveBeenCalled();
  });

  it.each([
    'https://www.facebook.com/home.php', 'https://www.facebook.com.evil.test/me/allactivity/',
    'https://evil.test/?next=facebook.com/me/allactivity',
  ])('checks the current page before any DOM scan: %s', url => {
    vi.stubGlobal('location', { href: url });
    const query = vi.spyOn(document, 'querySelectorAll');
    const reply = vi.fn();
    listener({ type: 'SCAN', filters }, sender, reply);
    expect(query).not.toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith({ type: 'SCAN_RESULT', supported: false, items: [] });
  });

  it('refuses scans in child frames', () => {
    vi.stubGlobal('window', { top: {}, self: {} });
    const query = vi.spyOn(document, 'querySelectorAll');
    const reply = vi.fn();
    listener({ type: 'SCAN', filters }, sender, reply);
    expect(query).not.toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith({ type: 'SCAN_RESULT', supported: false, items: [] });
  });

  it('returns bounded text previews without clicking or changing Facebook DOM', () => {
    for (let index = 0; index < 205; index++) {
      const article = document.createElement('div');
      article.setAttribute('role', 'article');
      article.textContent = `Comment <img src="https://attacker.test"> ${'x'.repeat(200)}`;
      document.body.append(article);
    }
    const before = document.body.innerHTML;
    const click = vi.spyOn(HTMLElement.prototype, 'click');
    const reply = vi.fn();
    listener({ type: 'SCAN', filters }, sender, reply);
    const response = reply.mock.calls[0][0];
    expect(response.supported).toBe(true);
    expect(response.items).toHaveLength(200);
    expect(response.items[0].snippet).toHaveLength(160);
    expect(response.items[0].snippet).toContain('<img');
    expect(response.items.every((item: { matched: boolean }) => item.matched)).toBe(true);
    expect(document.body.innerHTML).toBe(before);
    expect(click).not.toHaveBeenCalled();
  });
});
