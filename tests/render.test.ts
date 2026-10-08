// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderPreview } from '../src/sidepanel/render';
import type { ActivityItem } from '../src/shared/types';

describe('safe extension preview rendering', () => {
  it('renders malicious Facebook text literally without creating elements or requests', () => {
    const app = document.createElement('div');
    const snippet = '<img src="https://attacker.test/steal" onerror="alert(1)"><script>alert(1)</script><form action="https://attacker.test">';
    const item: ActivityItem = { id: 'item-0', snippet, activityType: 'comments', actionLabels: [], fingerprint: 'DIV:0', matched: true, keep: false, state: 'discovered' };
    const actions = { scan: vi.fn(), protectAll: vi.fn(), clearKeeps: vi.fn(), setKeep: vi.fn() };

    renderPreview(app, [item], '<a href="https://attacker.test">status</a>', false, actions);

    expect(app.textContent).toContain(snippet);
    expect(app.querySelectorAll('img, script, form, a, iframe')).toHaveLength(0);
    expect(app.querySelector('li')?.children).toHaveLength(1);
    expect(app.querySelector('#status')?.textContent).toContain('<a href=');
    const checkbox = app.querySelector('input')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(actions.setKeep).toHaveBeenCalledWith('item-0', true);
    app.querySelector<HTMLButtonElement>('#scan')!.click();
    expect(actions.scan).toHaveBeenCalledOnce();
  });

  it('limits displayed rows and disables scanning while a scan is pending', () => {
    const app = document.createElement('div');
    const items: ActivityItem[] = Array.from({ length: 60 }, (_, index) => ({ id: `item-${index}`, snippet: 'Comment', activityType: 'comments', actionLabels: [], fingerprint: `DIV:${index}`, matched: true, keep: true, state: 'discovered' }));
    renderPreview(app, items, 'Scanning...', true, { scan: vi.fn(), protectAll: vi.fn(), clearKeeps: vi.fn(), setKeep: vi.fn() });
    expect(app.querySelectorAll('li')).toHaveLength(50);
    expect(app.querySelector<HTMLButtonElement>('#scan')?.disabled).toBe(true);
    expect(app.textContent).toContain('Protected: 60');
  });
});
