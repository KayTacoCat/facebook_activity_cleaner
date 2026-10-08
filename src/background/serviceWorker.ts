import { store } from '../storage/localStore';
import { isMessage } from '../shared/messages';
import { isSupportedActivityUrl, isTrustedPanelSender } from '../shared/security';
import type { RunState } from '../shared/types';

// Content scripts do not need access to extension storage or diagnostic logs.
void chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch(() => {});
void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  void store.set('runState', { runId: '', state: 'idle', scanCount: 0, queuedCount: 0, completedCount: 0, failedCount: 0, skippedCount: 0 } satisfies RunState);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status === 'complete' || typeof info.url === 'string') {
    try {
      await chrome.sidePanel.setOptions({ tabId, enabled: isSupportedActivityUrl(info.url ?? tab.url), path: 'sidepanel.html' });
    } catch {
      // A closed or inaccessible tab must not produce an unhandled rejection.
    }
  }
});

chrome.runtime.onMessage.addListener((msg: unknown, sender, sendResponse) => {
  if (isTrustedPanelSender(sender, chrome.runtime.id) && isMessage(msg) && msg.type === 'PING') {
    sendResponse({ ok: true });
  }
});
