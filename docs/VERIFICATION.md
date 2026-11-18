# Showcase verification

Recorded on 2026-11-18. The application is running locally on port 5173 (development UI) and port 8080 (packaged UI and API).

## Implemented

The showcase includes the responsive command center, pipeline board/table, accounts and contacts, linked deal workspaces, activity timelines, task management, global search, Juno, and a short tour. All displayed business metrics come from persisted CRM records. Each visitor gets a separate workspace; reset affects only that visitor.

SQLite migrations, seed/reset, optimistic record versions, stage history, task idempotency, a Maven wrapper, a packaged executable JAR, and a CI workflow are included. PostgreSQL migration guidance is in [POSTGRESQL.md](POSTGRESQL.md).

## Functional checks

| Check | Result |
| --- | --- |
| Final Java/JUnit integration suite | 10 passed, no failures or errors |
| Desktop Chromium workflows | 9 passed |
| Phone Chromium workflows, 390 × 844 | 9 passed |
| WebKit primary story and navigation | 2 passed |
| Firefox navigation across the primary screens | 1 passed |
| TypeScript check and Vite production build | Passed |
| Executable JAR packaging and deep-link navigation | Passed |
| Persistence across a packaged-server restart | Workspace and saved task retained |
| Visitor isolation and scoped reset | Passed with separate browser cookie jars |

The complete `npm test` command passes all ten backend tests and all 21 browser checks. Coverage includes the historical-close-date regression: stage undo restores the original reporting date for closed deals on desktop and phone. The packaged build also passes all ten backend tests.

Coverage includes the primary Acme story; editable, source-backed follow-up drafts; explicit note/task saves; forecast updates and undo; account/contact creation and editing; search; task completion/reopening/editing; failed-save recovery; stale-edit protection; dates at quarter boundaries; and unsupported AI questions. The failed-save workflow also checks form behavior when `crypto.randomUUID` is unavailable.

## Accessibility and responsive layout

All 18 automated axe scans returned **zero violations** for the selected WCAG A/AA rules. They cover Overview, Pipeline, Relationships, My work, Juno, and the primary deal at 1440, 1024, and 390 CSS pixels.

The screenshot/reflow script also visited all six routes at 360, 390, 720, 1024, and 1440 px without page overflow or JavaScript errors. The phone workflow uses a stage menu and adapted cards, so dragging is unnecessary.

Reviewed screenshots cover layout, hierarchy, text contrast, desktop navigation, phone navigation, and deal context. These are browser and viewport checks; physical iOS/Android devices, native software keyboards, and actual browser zoom still need manual device testing. Automated accessibility scans do not establish complete WCAG conformance.

## Recorded performance

Measured on the locally running packaged app with the profile stored in [verification-results.json](verification-results.json): Chromium, 390 × 844 CSS px, cold asset cache, 150 ms latency, 1.6 Mbps download, 750 Kbps upload, and a 4× CPU slowdown.

| Metric | Recorded result | Demo target |
| --- | --- | --- |
| Largest contentful paint | 1.764 seconds | Under 2.5 seconds |
| Cumulative layout shift | 0.018 | Under 0.1 |
| Workspace API response, 95th percentile | 9.9 ms across 50 requests | Under 300 ms |

These are local demo measurements, not a production service guarantee. Assets are compressed, critical fonts are bundled locally, and hashed assets receive immutable cache headers.

## Screenshots

- [Desktop overview](screenshots/overview-desktop.png)
- [Desktop pipeline](screenshots/pipeline-desktop.png)
- [Desktop deal workspace](screenshots/deal-desktop.png)
- [Tablet overview](screenshots/overview-tablet.png)
- [Phone overview](screenshots/overview-mobile.png)
- [Phone deal workspace](screenshots/deal-mobile.png)
- [Phone Juno view](screenshots/juno-mobile.png)

Regenerate against a running packaged server with `npm run screenshots`. Run the responsive accessibility/performance probe with `npm run check:ui`.

## Known boundaries

Juno currently uses clearly labeled deterministic demo intelligence for a focused set of CRM intents. No live model, email sending, calendar integration, production identity/permissions, or PostgreSQL adapter is configured. These remain the extension work described in the plan.

`npm audit --prefix frontend --omit=dev` reports **zero vulnerabilities**. The full frontend audit reports an unpatched development dependency advisory affecting picomatch and its dependent build tools. The [upstream advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) concerns repeated extglob patterns. This build dependency is absent from the deployed Java/React runtime; the full dependency audit is not claimed clean.

The local container required browser libraries extracted under `/tmp`, software EGL configuration for WebKit, and serialized tests to respect its process limit. An ignored `frontend/.env.test.local` supplies those local test settings. On a normal host, use the documented Playwright browser/dependency installation. The remote GitHub Actions workflow was updated but has not been executed from this session.
