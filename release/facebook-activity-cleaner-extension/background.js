chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    runState: {
      runId: '', state: 'idle', scanCount: 0, queuedCount: 0,
      completedCount: 0, failedCount: 0, skippedCount: 0
    }
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status === 'complete' && tab.url?.includes('facebook.com') && tab.url.includes('/allactivity')) {
    await chrome.sidePanel.setOptions({ tabId, enabled: true, path: 'sidepanel.html' });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') sendResponse({ ok: true, tabId: sender.tab?.id });
});
