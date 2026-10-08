import type { ActivityItem, Filters } from '../shared/types';
import { isMessage } from '../shared/messages';
import { isSupportedActivityUrl } from '../shared/security';
import { renderPreview } from './render';

const app = document.getElementById('app');
if (!app) throw new Error('Missing side panel container.');
const filters: Filters = { includeTypes: [], contains: [], excludes: [], onlyActionable: false, excludeUnknown: true };
let items: ActivityItem[] = [];
let scanning = false;
let status = 'Open your Facebook Activity Log to preview visible activity.';

const render = () => renderPreview(app, items, status, scanning, {
  scan: () => { void doScan(); },
  protectAll: () => { items = items.map(item => ({ ...item, keep: true })); render(); },
  clearKeeps: () => { items = items.map(item => ({ ...item, keep: false })); render(); },
  setKeep: (id, keep) => { items = items.map(item => item.id === id ? { ...item, keep } : item); render(); },
});

const doScan = async () => {
  if (scanning) return;
  scanning = true;
  items = [];
  status = 'Checking the active Activity Log page...';
  render();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (typeof tab?.id !== 'number' || !isSupportedActivityUrl(tab.url)) {
      status = 'Open your Facebook Activity Log at https://www.facebook.com/<profile>/allactivity/ before scanning.';
      return;
    }
    const response: unknown = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN', filters }, { frameId: 0 });
    if (!isMessage(response) || response.type !== 'SCAN_RESULT') {
      status = 'The page returned an invalid scan response. Reload the Activity Log and try again.';
      return;
    }
    if (!response.supported) {
      status = 'This page is not a supported Facebook Activity Log.';
      return;
    }
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab?.id !== tab.id || currentTab.url !== tab.url || !isSupportedActivityUrl(currentTab.url)) {
      status = 'The active page changed during scanning. Return to your Activity Log and scan again.';
      return;
    }
    items = response.items;
    status = 'Preview complete. This extension does not delete or change Facebook activity.';
  } catch {
    status = 'Scanning failed. Reload the Activity Log and try again.';
  } finally {
    scanning = false;
    render();
  }
};

render();
