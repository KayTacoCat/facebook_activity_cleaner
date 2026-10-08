import { redactText } from '../shared/redaction';
import type { ActivityItem, ActivityType } from '../shared/types';
import { matchItem } from '../shared/filters';
import { isMessage, MAX_SCAN_ITEMS, MAX_SNIPPET_LENGTH } from '../shared/messages';
import { isSupportedActivityUrl, isTrustedPanelSender } from '../shared/security';

const inferType = (text: string): ActivityType => text.toLowerCase().includes('comment') ? 'comments' : 'unknown';

const scan = () => {
  const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-label]')).slice(0, MAX_SCAN_ITEMS);
  return nodes.map((el, idx): ActivityItem => {
    const text = (el.textContent || '').trim();
    return { id: `item-${idx}`, snippet: redactText(text, MAX_SNIPPET_LENGTH), activityType: inferType(text), actionLabels: [], fingerprint: `${el.tagName}:${idx}`, matched: false, keep: false, state: 'discovered' };
  });
};

chrome.runtime.onMessage.addListener((msg: unknown, sender, sendResponse) => {
  if (!isTrustedPanelSender(sender, chrome.runtime.id) || !isMessage(msg) || msg.type !== 'SCAN') return;
  // Gate before reading any page text, including after same-tab navigation.
  if (!isSupportedActivityUrl(location.href) || window.top !== window.self) {
    sendResponse({ type: 'SCAN_RESULT', items: [], supported: false });
    return;
  }
  const items = scan().map(i => ({ ...i, matched: matchItem(i, msg.filters) }));
  sendResponse({ type: 'SCAN_RESULT', items, supported: true });
});
