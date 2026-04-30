import { store } from '../storage/localStore';
import type { Message } from '../shared/messages';
import type { RunState } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  void store.set('runState', { runId: '', state: 'idle', scanCount: 0, queuedCount: 0, completedCount: 0, failedCount: 0, skippedCount: 0 } satisfies RunState);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status === 'complete' && tab.url?.includes('facebook.com') && tab.url.includes('/allactivity')) {
    await chrome.sidePanel.setOptions({ tabId, enabled: true, path: 'sidepanel.html' });
  }
});

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  if (msg.type === 'PING') sendResponse({ ok: true, tabId: sender.tab?.id });
});
