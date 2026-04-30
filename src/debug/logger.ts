export type EventCode = 'SCAN_STARTED'|'SCAN_COMPLETED'|'RUN_STARTED'|'RUN_PAUSED'|'RUN_RESUMED'|'RUN_STOPPED'|'RUN_COMPLETED'|'ITEM_ACTION_FAILED'|'MESSAGE_ERROR';
export interface DebugEvent { ts: string; severity: 'info'|'warn'|'error'; code: EventCode; message: string; context?: Record<string, unknown>; }
export const logEvent = async (evt: DebugEvent) => {
  const key = 'debugLogs';
  const { [key]: logs = [] } = await chrome.storage.local.get(key);
  logs.push(evt);
  await chrome.storage.local.set({ [key]: logs.slice(-500) });
};
