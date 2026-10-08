export type EventCode = 'SCAN_STARTED'|'SCAN_COMPLETED'|'RUN_STARTED'|'RUN_PAUSED'|'RUN_RESUMED'|'RUN_STOPPED'|'RUN_COMPLETED'|'ITEM_ACTION_FAILED'|'MESSAGE_ERROR';
export interface DebugEvent { ts: string; severity: 'info'|'warn'|'error'; code: EventCode; message: string; context?: Record<string, unknown>; }
const codes: EventCode[] = ['SCAN_STARTED', 'SCAN_COMPLETED', 'RUN_STARTED', 'RUN_PAUSED', 'RUN_RESUMED', 'RUN_STOPPED', 'RUN_COMPLETED', 'ITEM_ACTION_FAILED', 'MESSAGE_ERROR'];
interface StoredEvent { ts: string; severity: DebugEvent['severity']; code: EventCode; }

const metadata = (value: unknown): StoredEvent | undefined => {
  if (!value || typeof value !== 'object') return;
  const event = value as Partial<DebugEvent>;
  if (typeof event.ts !== 'string' || event.ts.length > 40 || !Number.isFinite(Date.parse(event.ts))
    || !['info', 'warn', 'error'].includes(event.severity ?? '') || !codes.includes(event.code as EventCode)) return;
  return { ts: new Date(event.ts).toISOString(), severity: event.severity!, code: event.code! };
};

export const logEvent = async (evt: DebugEvent) => {
  const key = 'debugLogs';
  const entry = metadata(evt);
  if (!entry) return;
  const { [key]: stored } = await chrome.storage.local.get(key);
  // Persist only fixed diagnostic metadata. Free text and context can contain private activity.
  const logs = Array.isArray(stored) ? stored.slice(-499).map(metadata).filter(event => event !== undefined) : [];
  await chrome.storage.local.set({ [key]: [...logs, entry] });
};
