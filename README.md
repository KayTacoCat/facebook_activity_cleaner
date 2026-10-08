# Facebook Activity Cleaner (Personal Use)

A Chrome Manifest V3 extension for previewing activity from your own Facebook Activity Log. **This version does not delete or change Facebook activity.**

## Install

There is no packaged release ZIP yet. Download this repository using **Code > Download ZIP**, extract it, and follow [INSTALL.md](INSTALL.md). Load the `release/facebook-activity-cleaner-extension` folder that contains `manifest.json`.

## Use

1. Open your own Activity Log at `https://www.facebook.com/<profile>/allactivity/` and reload the page after installing the extension.
2. Click the extension icon to open its side panel, then click **Scan**.
3. Review the preview and use **Keep**, **Mark all scanned as keep**, or **Clear keeps** to change review selections.

Keep selections apply only to the current panel session and reset when you scan again. They do not change Facebook content. The scanner examines up to 200 loaded candidate elements and displays up to 50 matched previews. Detection is a simple heuristic, currently recognizing comments; counts are not a complete inventory of your activity.

Only the exact `www.facebook.com/<profile>/allactivity` route, with an optional trailing slash and query parameters, is supported. Facebook layout changes can cause missing, duplicate, or misclassified results. If scanning fails, reload the Activity Log and try again.

## Permissions and privacy

- `storage`: local extension state and diagnostic metadata.
- `activeTab`: identify the active tab for a user-requested scan.
- `sidePanel`: the preview interface.
- Host permission: `https://www.facebook.com/*`; runtime checks restrict scans to the supported Activity Log route.

Activity snippets remain in panel memory. There is no export feature or external-request functionality. Diagnostic storage accepts only timestamps, severity levels, and fixed event codes, excluding free text and context. Snippet redaction is a precaution and cannot guarantee removal of every personal detail. Review content before taking screenshots or sharing it.

## Development

Use Node.js 24.15 or newer within the Node 24 release line, or Node 26 or newer.

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
```

Load `dist` in Chrome as an unpacked extension. `npm run release` builds and refreshes the checked-in `release/facebook-activity-cleaner-extension` folder; `npm run check:release` compares it with the current `dist` build. Include regenerated release files when proposing source or dependency changes.

CI checks types, tests, builds, release consistency, and known high/critical dependency vulnerabilities. CodeQL scans extension code and GitHub Actions workflows. These checks reduce risk but do not guarantee security. See [SECURITY.md](SECURITY.md) for private vulnerability reporting and [QA_CHECKLIST.md](QA_CHECKLIST.md) for browser checks that still require manual verification.
