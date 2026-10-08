import type { ActivityItem } from '../shared/types';

interface PreviewActions {
  scan: () => void;
  protectAll: () => void;
  clearKeeps: () => void;
  setKeep: (id: string, keep: boolean) => void;
}

/** Page-derived values are always text, never parsed as extension HTML. */
export const renderPreview = (
  app: HTMLElement,
  items: ActivityItem[],
  status: string,
  scanning: boolean,
  actions: PreviewActions,
): void => {
  const doc = app.ownerDocument;
  const heading = doc.createElement('h2');
  heading.textContent = 'Facebook Activity Cleaner';
  const mode = doc.createElement('p');
  mode.append('Default mode: ');
  const emphasis = doc.createElement('b');
  emphasis.textContent = 'Preview/Dry Run';
  mode.append(emphasis);
  const scan = doc.createElement('button');
  scan.id = 'scan';
  scan.textContent = scanning ? 'Scanning...' : 'Scan';
  scan.disabled = scanning;
  scan.addEventListener('click', actions.scan);
  const protect = doc.createElement('button');
  protect.id = 'protect-all';
  protect.textContent = 'Mark all scanned as keep';
  protect.addEventListener('click', actions.protectAll);
  const clear = doc.createElement('button');
  clear.id = 'clear-keep';
  clear.textContent = 'Clear keeps';
  clear.addEventListener('click', actions.clearKeeps);
  const counts = doc.createElement('div');
  const matched = items.filter(item => item.matched);
  counts.textContent = `Scanned: ${items.length} | Matched: ${matched.length} | Protected: ${items.filter(item => item.keep).length}`;
  const notice = doc.createElement('p');
  notice.id = 'status';
  notice.setAttribute('role', 'status');
  notice.textContent = status;
  const list = doc.createElement('ul');
  for (const item of matched.slice(0, 50)) {
    const row = doc.createElement('li');
    const label = doc.createElement('label');
    const checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.keep;
    checkbox.addEventListener('change', () => actions.setKeep(item.id, checkbox.checked));
    label.append(checkbox, ' Keep');
    row.append(label, ` [${item.activityType}] ${item.snippet}`);
    list.append(row);
  }
  app.replaceChildren(heading, mode, scan, protect, clear, counts, notice, list);
};
