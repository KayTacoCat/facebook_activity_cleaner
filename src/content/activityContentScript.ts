import { redactText } from '../shared/redaction';
import type { ActivityItem, ActivityType } from '../shared/types';
import { matchItem } from '../shared/filters';

const isSupportedPage = () => /facebook\.com\/.+\/allactivity/.test(location.href);
const inferType = (text: string): ActivityType => text.toLowerCase().includes('comment') ? 'comments' : 'unknown';

const scan = () => {
  const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-label]')).slice(0, 200);
  return nodes.map((el, idx): ActivityItem => {
    const text = (el.textContent || '').trim();
    return { id: `item-${idx}`, snippet: redactText(text, 160), activityType: inferType(text), actionLabels: [], fingerprint: `${el.tagName}:${idx}`, matched: false, keep: false, state: 'discovered' };
  });
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SCAN') {
    const items = scan().map(i => ({ ...i, matched: matchItem(i, msg.filters) }));
    sendResponse({ type: 'SCAN_RESULT', items, supported: isSupportedPage() });
  }
});
