const FACEBOOK_ORIGIN = 'https://www.facebook.com';

/** Accept only the Activity Log route on the origin covered by our permission. */
export const isSupportedActivityUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.origin === FACEBOOK_ORIGIN
      && url.username === '' && url.password === ''
      && /^\/[A-Za-z0-9_.-]+\/allactivity\/?$/.test(url.pathname);
  } catch {
    return false;
  }
};

/** Runtime requests may originate only from this extension's side panel. */
export const isTrustedPanelSender = (
  sender: chrome.runtime.MessageSender,
  extensionId: string,
): boolean => {
  if (sender.id !== extensionId || sender.tab || typeof sender.url !== 'string') return false;
  try {
    const url = new URL(sender.url);
    return url.protocol === 'chrome-extension:' && url.hostname === extensionId
      && url.port === '' && url.username === '' && url.password === ''
      && url.pathname === '/sidepanel.html';
  } catch {
    return false;
  }
};
