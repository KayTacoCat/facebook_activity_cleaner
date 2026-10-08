# Facebook Activity Cleaner Extension

This Chrome extension previews activity from your own Facebook Activity Log. **It does not delete or change Facebook activity.**

## Install

Use Chrome 114 or newer. There is no separate release ZIP yet: download the repository using **Code > Download ZIP** and extract it.

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this `release/facebook-activity-cleaner-extension` folder containing `manifest.json`.
3. Open your own Activity Log at `https://www.facebook.com/<profile>/allactivity/` and reload it.
4. Click the extension icon to open the side panel, then click **Scan**.

Keep selections affect only the current panel session and reset on a new scan. Activity previews stay in memory; there is no export feature. The scanner uses simple heuristics and may miss, duplicate, or misclassify activity. Browser behavior has not yet been manually verified.

Install only a trusted copy. See the repository's `SECURITY.md` for vulnerability reporting and `QA_CHECKLIST.md` for manual checks. Developers regenerate this folder with `npm run release` and verify it with `npm run check:release`.
