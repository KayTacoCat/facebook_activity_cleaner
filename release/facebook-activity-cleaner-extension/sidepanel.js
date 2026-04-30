const app = document.getElementById('app');
const filters = { includeTypes: [], contains: [], excludes: [], onlyActionable: false, excludeUnknown: true };
let items = [];

const render = () => {
  const matched = items.filter(i => i.matched);
  app.innerHTML = `<h2>Facebook Activity Cleaner</h2>
  <p>Default mode: <b>Preview/Dry Run</b></p>
  <button id="scan">Scan</button>
  <button id="protect-all">Mark all visible as keep</button>
  <button id="clear-keep">Clear keeps</button>
  <div>Scanned: ${items.length} | Matched: ${matched.length} | Protected: ${items.filter(i=>i.keep).length}</div>
  <ul>${matched.slice(0,50).map(i=>`<li><label><input data-id="${i.id}" type="checkbox" ${i.keep?'checked':''}/> Keep</label> [${i.activityType}] ${i.snippet}</li>`).join('')}</ul>`;
  document.getElementById('scan')?.addEventListener('click', doScan);
  document.getElementById('protect-all')?.addEventListener('click', () => { items = items.map(i => ({ ...i, keep: true })); render(); });
  document.getElementById('clear-keep')?.addEventListener('click', () => { items = items.map(i => ({ ...i, keep: false })); render(); });
  app.querySelectorAll('input[data-id]').forEach(cb => cb.addEventListener('change', () => { items = items.map(i => i.id===cb.dataset.id ? { ...i, keep: cb.checked } : i); }));
};

const doScan = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const res = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN', filters });
  items = res.items || [];
  render();
};

render();
