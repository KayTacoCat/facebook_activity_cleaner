# Security policy

## Supported versions

Security fixes are applied to the current `main` branch. Use the extension built from the latest reviewed commit. Older downloaded copies are not maintained separately.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/KayTacoCat/facebook_activity_cleaner/security/advisories/new). Include the affected commit, browser version, reproduction steps, and expected impact. Use synthetic activity records and remove personal information from examples.

If private reporting is unavailable, ask the maintainer to enable it or provide a private reporting channel. Do not publish exploit details, Facebook content, credentials, cookies, access tokens, or browser session exports in issues or pull requests.

## Security boundaries

- Use this extension only with your own Facebook account and content.
- This version previews activity only. It does not delete or change Facebook content and has no export feature.
- Activity snippets stay in panel memory. Diagnostic storage accepts only timestamps, severity levels, and fixed event codes, excluding free text and context. Redaction cannot guarantee removal of every personal detail; review screenshots before sharing.
- Review extension permissions and the complete diff before installing updates. Install an unpacked extension only from a source you trust.
- Supported scans are restricted to `https://www.facebook.com/<profile>/allactivity/`. Heuristic results may be incomplete or inaccurate as Facebook changes its layout.

## Development checks

Run `npm ci --ignore-scripts`, `npm run typecheck`, `npm test`, `npm run build`, `npm run check:release`, and `npm audit --audit-level=high` before proposing a change. Keep `package-lock.json` committed and verify that checked-in release files match the source build.

CI uses read-only repository access. CodeQL receives only the additional permission needed to upload security results. Workflow actions are pinned to full commit IDs, and Dependabot proposes dependency updates for review.

Never commit secrets or personal Facebook activity. Ignore rules are a guardrail; they do not remove data from existing Git history or prevent every possible accidental disclosure.
