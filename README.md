# Facebook Activity Cleaner (Personal Use)

Safety-first Chrome MV3 extension scaffold for reviewing your own Facebook Activity Log and running supervised cleanup actions.

## Safety warnings
- Personal-use only on your own account/content.
- Default mode is **Preview / Dry Run**.
- No credentials are collected.
- No hidden/private Facebook APIs are used.

## Install locally
1. `npm install`
2. `npm run build`
3. Chrome → Extensions → Developer mode → Load unpacked → select project folder.

## Permissions
- `storage`: local settings/run state/debug logs.
- `scripting`, `activeTab`: user-invoked tab interactions.
- `sidePanel`: primary interface.
- Host permission: `https://www.facebook.com/*` only.

## Usage
1. Open Activity Log page.
2. Open extension side panel.
3. Scan, review matches, mark Keep as needed.
4. Proceed to later phases for supervised action execution.

## Debug/export
- Debug events are stored in `chrome.storage.local` and can be exported in later phases.
- Redaction helper strips usernames from Facebook profile URLs.

## Troubleshooting
- If scan returns 0 items, scroll and scan again.
- If side panel is unavailable, reload extension and tab.

## Current status
This is a phased implementation foundation (Phase 1 + early Phase 2).
