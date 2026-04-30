# Manual QA Checklist
- Load extension unpacked from `dist/`.
- Open `https://www.facebook.com/{username}/allactivity/`.
- Confirm side panel opens and shows scan controls.
- Run Scan and verify counts update.
- Mark one item Keep and confirm protected count increments.
- Re-scan and verify preview still defaults to dry run workflow.
- Validate unsupported page behavior.
- Export debug logs from storage (developer tools) and verify no credentials/tokens/cookies are present.
