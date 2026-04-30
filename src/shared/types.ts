export type RunnerState =
  | 'idle' | 'validating_page' | 'scanning' | 'scan_complete' | 'awaiting_user_review'
  | 'awaiting_confirmation' | 'running' | 'paused' | 'stopping' | 'stopped' | 'completed' | 'failed';

export type ItemState =
  | 'discovered' | 'matched' | 'protected' | 'queued' | 'active' | 'action_menu_opened'
  | 'action_selected' | 'confirmation_detected' | 'confirmed' | 'completed' | 'skipped' | 'failed';

export type ActivityType = 'posts'|'comments'|'reactions'|'shares'|'media'|'tags'|'group'|'page'|'searches'|'unknown';
export interface ActivityItem {
  id: string; snippet: string; dateText?: string; activityType: ActivityType; actionLabels: string[];
  fingerprint: string; matched: boolean; keep: boolean; state: ItemState;
}
export interface Filters { includeTypes: ActivityType[]; contains: string[]; excludes: string[]; onlyActionable: boolean; excludeUnknown: boolean; }
export interface RunState { runId: string; state: RunnerState; scanCount: number; queuedCount: number; completedCount: number; failedCount: number; skippedCount: number; startedAt?: string; lastActionAt?: string; }
