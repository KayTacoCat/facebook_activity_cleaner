# Manual Chrome QA

These checks have not yet been verified in a live Chrome session. Use only your own Facebook account. The current extension is preview-only.

- [ ] Build with Node 24.15+ (Node 24) or Node 26+, using `npm ci --ignore-scripts` and `npm run build`. Load `dist` unpacked in Chrome 114+.
- [ ] Confirm Chrome loads the background worker, content script, and side panel without extension errors. Check that permissions are `storage`, `activeTab`, `sidePanel`, and the `www.facebook.com` host only.
- [ ] Reload `https://www.facebook.com/<profile>/allactivity/`, open the panel from the extension icon, and scan. Confirm counts and previews update without changing Facebook activity.
- [ ] Check **Keep**, **Mark all scanned as keep**, and **Clear keeps**. Confirm protected counts update and a new scan clears prior selections.
- [ ] Compare preview snippets with the loaded page. Record missing, duplicate, or misclassified items; heuristic counts are not a complete activity inventory.
- [ ] Navigate to the Facebook home page or another unsupported route. Confirm the panel is disabled there or scanning is refused. Return to the exact supported route and reload before rescanning.
- [ ] Reload the extension and confirm prior activity previews do not return. If the active tab changes during a scan, confirm old-tab results are not displayed as the current preview.
- [ ] Inspect `chrome.storage.local` in extension developer tools. Confirm no activity snippets or exports are stored. Any `debugLogs` entries must contain only a timestamp, severity, and fixed event code, without free text or context.
- [ ] Run `npm run release` and `npm run check:release`, then repeat the load-and-scan checks using `release/facebook-activity-cleaner-extension`.

Record the tested commit, Chrome version, date, and findings when completing this checklist. Remove personal content from screenshots or reports.
