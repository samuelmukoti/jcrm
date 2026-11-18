# jcrm

A working CRM showcase: Java 25/Spring Boot API, React/TypeScript UI, SQLite persistence, and contextual demo intelligence through Juno.

## Conventions

- Run tests before claiming a change is complete.
- Prefer the smallest change that makes the test pass.
- Match the existing code style; avoid unrelated formatting churn.
- Ask one clarifying question when a consequential requirement is ambiguous.
- Use integer cents for money and preserve workspace ownership on every record/query.
- Keep applied database migrations immutable; add a version for schema changes.
- AI suggestions require an explicit user action before writing CRM data.

## Commands

- Develop: `npm run dev` (UI 5173, API 8080; installs frontend dependencies on first run)
- Backend tests: `./mvnw test`
- Frontend type check/build: `npm run build`
- Browser tests: `npm run test:browser` (install Playwright browsers first)
- All checks: `npm test`
- Package frontend and executable JAR: `npm run package`
- Container build/runtime checks: `npm run test:containers` (requires Docker Engine/Compose)

## Structure

- `backend/`: Maven module, Spring Boot services/API, JDBC repository, versioned SQLite migrations, JUnit integration tests.
- `frontend/`: React routes/components, responsive styles, locked npm dependencies, Playwright tests.
- `scripts/`: local development orchestration and container checks.
- `Dockerfile`, `docker-compose.*.yml`, `docker/`: packaged runtime, preview/production deployment, and health check.
- `docs/`: deployment instructions, verification evidence, and PostgreSQL migration notes.
- `PLAN.md`: showcase design and delivery contract.

## Demo boundaries

Juno uses deterministic demo intelligence. A live provider, external communications, and production identity are future integrations. Every visitor has a separate session workspace; reset must remain scoped to it.
