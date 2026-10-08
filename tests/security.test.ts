import { describe, expect, it } from 'vitest';
import { isSupportedActivityUrl, isTrustedPanelSender } from '../src/shared/security';

const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
const sender = { id: extensionId, url: `chrome-extension://${extensionId}/sidepanel.html` };

describe('Activity Log origin and path validation', () => {
  it.each([
    'https://www.facebook.com/me/allactivity',
    'https://www.facebook.com/jane.doe/allactivity/?category_key=comments#section',
    'https://www.facebook.com/123456/allactivity/',
  ])('supports the exact permitted origin and Activity Log route: %s', url => {
    expect(isSupportedActivityUrl(url)).toBe(true);
  });

  it.each([
    undefined, null, '', 'not a URL', 'http://www.facebook.com/me/allactivity',
    'https://facebook.com/me/allactivity', 'https://m.facebook.com/me/allactivity',
    'https://www.facebook.com.evil.test/me/allactivity', 'https://evilfacebook.com/me/allactivity',
    'https://evil.test/?next=https://www.facebook.com/me/allactivity',
    'https://www.facebook.com@evil.test/me/allactivity', 'https://evil.test@www.facebook.com/me/allactivity',
    'https://www.facebook.com:8443/me/allactivity', 'https://www.facebook.com/me',
    'https://www.facebook.com/me/allactivity-extra', 'https://www.facebook.com/me/allactivity/delete',
    'https://www.facebook.com/me%2fallactivity/allactivity', 'https://www.facebook.com/me/?next=/allactivity',
  ])('rejects deceptive origins and unrelated routes: %s', url => {
    expect(isSupportedActivityUrl(url)).toBe(false);
  });
});

describe('runtime sender validation', () => {
  it('allows only the same extension side panel', () => {
    expect(isTrustedPanelSender(sender, extensionId)).toBe(true);
    expect(isTrustedPanelSender({ ...sender, url: `${sender.url}?view=preview` }, extensionId)).toBe(true);
  });

  it.each([
    {}, { ...sender, id: 'another-extension' }, { ...sender, tab: { id: 1 } },
    { ...sender, url: 'https://www.facebook.com/me/allactivity/' },
    { ...sender, url: `chrome-extension://${extensionId}/background.js` },
    { ...sender, url: `chrome-extension://${extensionId}.evil.test/sidepanel.html` },
    { ...sender, url: `https://${extensionId}/sidepanel.html` },
    { ...sender, url: `chrome-extension://${extensionId}/sidepanel.html/extra` },
  ])('rejects untrusted senders: %j', value => {
    expect(isTrustedPanelSender(value, extensionId)).toBe(false);
  });
});
