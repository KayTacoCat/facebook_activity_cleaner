# Install in Chrome

Use Chrome 114 or newer. Install only a copy from a source you trust. This version previews activity and does not delete or change it.

1. On the repository page, choose **Code > Download ZIP**. There is no separate release ZIP yet.
2. Extract the downloaded archive.
3. Open `chrome://extensions` and turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select `release/facebook-activity-cleaner-extension` inside the extracted repository. Select the folder containing `manifest.json`, not the archive or repository root.
6. Open your own Activity Log at `https://www.facebook.com/<profile>/allactivity/` and reload the page.
7. Click the extension icon, open its side panel, and click **Scan**.

Keep the extracted folder in place while the extension is installed. For a developer build, use the commands in [README.md](README.md) and load `dist` instead.

If the panel or scan fails, reload the extension on `chrome://extensions`, then reload the supported Activity Log page. Facebook layout changes may prevent correct detection; browser behavior still requires the checks in [QA_CHECKLIST.md](QA_CHECKLIST.md).
