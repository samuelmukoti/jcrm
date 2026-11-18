# JCRM

**A little clarity. A lot of momentum.** A working CRM showcase with an intelligent assistant, a responsive workspace, and persistent SQLite data.

## Start the demo

Requires Java 25 and Node 24 (or a Vite-compatible Node version). Maven is bootstrapped by the included wrapper.

```bash
npm run dev
```

The first run installs the locked frontend dependencies. Open **[http://localhost:5173](http://localhost:5173)** after the API reports ready. The frontend uses Vite; the Java API listens on port 8080. Frontend changes reload automatically; restart the development command after backend changes.

Each browser gets an isolated, seeded workspace with 25 companies, 50 contacts, 35 opportunities, five fictional teammates, and a connected activity/task history. Changes survive refresh and server restart. Sessions expire after seven days; expired data is cleaned up when another workspace is created.

## Try the showcase

1. Start on Overview and open **See the opportunity**. Acme's stalled enterprise proposal needs a next step.
2. Select **Draft a follow-up**. Juno uses the buyer, opportunity, and recorded history. Edit the draft and inspect its source facts.
3. **Save as note**, then **Create next step**. Nothing is emailed automatically.
4. Change the deal stage to Negotiation, return to the overview, and inspect the updated forecast. Stage moves have a persistent **Undo** action.
5. Explore the Pipeline board/table, Relationships directory, and My work. Use Ctrl/Cmd+K to find a company, person, or deal.
6. Open Juno and ask **Which deals need attention?** or **What is closing this month?**
7. Open your profile or Workspace settings to reset your demo. Other browser sessions are unaffected.

The phone UI uses bottom navigation, full-screen dialogs, account cards, and a stage-filtered opportunity list with a stage menu. Drag-and-drop is optional on desktop.

## Build and run the packaged app

```bash
npm ci --prefix frontend
npm run package
java --enable-native-access=ALL-UNNAMED -jar backend/target/jcrm-api-1.0.0.jar
```

Open **[http://localhost:8080](http://localhost:8080)**. The executable JAR serves the built frontend and API together, including deep routes such as `/deals/<id>`.

Set `PORT` to change the packaged app's port. Set `JCRM_DB_PATH` to an absolute path on a persistent local volume. The development command defaults to `data/jcrm.db` at the repository root; a packaged app defaults to `data/jcrm.db` relative to its launch directory. Use one application instance with SQLite and a local disk. The Vite proxy targets port 8080 during development.

`GET /api/health` returns readiness once database migrations and startup have completed. Critical fonts and icons are bundled; the running showcase needs no image CDN or AI account.

## Docker and DevStation LivePreview

For DevStation LivePreview, select Compose, `docker-compose.preview.yml`, and public service `jcrm`. No `.env` settings are required. The image serves both the UI and API on port 8080 and stores SQLite in a named volume.

```bash
docker compose -f docker-compose.preview.yml up -d --build --wait
docker compose -f docker-compose.preview.yml port jcrm 8080
```

Open the reported host port. For single-host production hosting, use `docker-compose.prod.yml` with `.env.production.example`. See [deployment instructions](docs/DEPLOYMENT.md) for setup, updates, proxy settings, data persistence, and backups.

## Verify

```bash
npm ci --prefix frontend
npm exec --prefix frontend -- playwright install --with-deps chromium webkit firefox
npm test
```

Separate checks:

```bash
./mvnw test
npm run build
npm run test:browser
npm run test:containers # Requires Docker; builds and checks both Compose configurations.
```

Browser tests launch the development servers when needed and use isolated sessions. To verify an already running packaged app:

```bash
JCRM_BASE_URL=http://127.0.0.1:8080 npm run test:browser
```

Local browser overrides can be supplied in an ignored `frontend/.env.test.local`. To capture the packaged UI, run `npm run screenshots`; `npm run check:ui` records responsive accessibility and performance measurements.

See [verification notes](docs/VERIFICATION.md) for actual coverage, screenshots, and remaining limitations.

## Architecture

- `backend/`: Spring Boot 4.1.2, Java 25, validation, Spring JDBC, and SQLite JDBC 3.54.1.0.
- `frontend/`: React 19, TypeScript, Vite 8, TanStack Query, React Router, Radix dialogs, local Inter fonts, and Lucide icons.
- `backend/src/main/resources/db/migration/sqlite/`: transactional, ordered schema migrations with stored SHA-256 checksums. Applied migration files are immutable; add a new version to change the schema.
- `scripts/dev.mjs`: development startup and coordinated shutdown.
- `frontend/tests/`: Playwright workflows for desktop, phone, and cross-browser smoke coverage.

Juno currently uses **deterministic demo intelligence**, clearly labeled in the UI. It answers a focused set of CRM questions and produces contextual drafts without an API key. `AiAssistant` is the server-side extension point for a future live model. No live provider or external email/calendar connection is configured.

Amounts are integer cents; dates and reporting rules are explicit. Attention comes from buyer inactivity, close dates, open next steps, and overdue work. Stage probabilities are transparent demo assumptions, independent of AI. See [the implementation plan](PLAN.md) and [the PostgreSQL migration path](docs/POSTGRESQL.md).
