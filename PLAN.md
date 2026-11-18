# JCRM showcase plan

## 1. Product promise and audience

Build a premium, interactive CRM showcase for a B2B sales team. The primary visitor is a sales leader or account executive evaluating the product. Within one minute they should understand the state of the business, identify a priority, and see how AI helps them act. Within three minutes they should complete a useful workflow.

Take inspiration from monday.com's approachable work management and Salesforce's depth of customer context. Give JCRM its own visual identity and a clear point of view: **every important insight leads to a useful, explainable action.**

**Entry experience:** Open directly into a populated workspace as a fictional sales lead. Show a short greeting, one clear priority, and an optional “Take the 3-minute tour” action. Visitors can explore immediately; authentication and setup are outside the initial demo scope.

## 2. The showcase story

Use three connected situations to show breadth without overwhelming the visitor:

| Situation | What the visitor discovers | What they can do |
| --- | --- | --- |
| Recover a stalled deal — primary story | An important proposal is close to its target date, with no recent buyer activity and no next step | Inspect the evidence, prepare a follow-up, and save a task |
| Find a growth opportunity | A recently qualified account has a clear fit and an upcoming discovery meeting | Review the relationship, inspect the opportunity, and prepare meeting notes |
| Understand team momentum | Recent wins, active pipeline, and overdue work tell a coherent story | Drill from a metric or chart into the records that explain it |

### Primary walkthrough: approximately three minutes

1. **Orient:** The command center highlights a stalled proposal alongside a readable pipeline summary and an AI briefing.
2. **Understand:** Open the deal without losing context. See the account, buyer, timeline, amount, close date, and the specific facts behind the recommendation.
3. **Prepare:** Generate a follow-up grounded in those facts. Edit the draft and save an explicit next-step task with an owner and due date.
4. **Act:** Log an activity. If the visitor records buyer confirmation of a commercial review, they can move the deal to Negotiation. AI output alone never advances a stage.
5. **See the result:** The activity and task appear immediately. A stage change updates pipeline totals and the weighted forecast; a saved task updates work priorities. Refresh preserves the result.

A scheduled follow-up resolves a missing-next-step signal; it does not imply a buyer has replied or remove an inactivity signal. Reset returns the workspace to the opening story.

### Three signature moments

- **Insight to action:** A priority card opens the precise deal and its evidence, then carries that context into a useful draft or task.
- **Ask the pipeline:** Questions such as “Which deals closing this month need attention?” return a concise answer, matching records, and useful actions. Provide suggested questions and a clear response when the demo cannot answer a request.
- **Visible impact:** Editing or moving a deal updates the board, record, and dashboard consistently, with a brief confirmation and an available undo for stage moves.

## 3. Scope and product surfaces

Prioritize a complete primary story and an excellent presentation before expanding secondary features.

| Surface | Essential content | Required behavior |
| --- | --- | --- |
| Command center | Four clear KPIs, pipeline by stage, priority deals, today's work, recent activity, and a short AI briefing | Drill into records behind every actionable metric; change the shared owner and period filters |
| Pipeline | Kanban and table views, stage totals, owner/close-date filters, search, and creation | Create and edit a deal; drag between stages or use an accessible stage menu; preserve filters when switching views |
| Relationships | Accounts and contacts in one searchable directory; account detail with people, opportunities, and activity | Create/edit an account or contact, open related records, and log a note |
| Deal workspace | Buyer and account context, commercial details, timeline, next steps, and AI suggestions | Edit fields, log activity, add/complete a task, change stage, and inspect insight evidence |
| My work | Today's, upcoming, and overdue tasks with owner and related record | Create, edit, complete, and reopen tasks; navigate to the linked deal or account |
| AI assistant | Contextual panel on desktop and a dedicated full-screen view on mobile | Briefing, risk explanation, follow-up drafting, and supported pipeline questions; editable results and explicit save actions |

Desktop navigation contains Home, Pipeline, Relationships, and My work, plus a visible AI entry point. Deal details and the AI assistant have shareable routes. Navigation, metric links, filters, and row actions must lead to implemented behavior.

**Required supporting features:** Global search and command palette; useful form validation; deterministic seed/reset; loading, empty, error, and retry states; deep links that survive reloads.

**After the showcase passes:** Live AI provider integration, CSV import/export, advanced reporting, custom fields, dark mode, and broader administrative CRUD can follow. External email/calendar/telephony integrations, production identity and permissions, real collaboration, and a visual automation builder belong to later product work. Reserve extension points without adding inactive navigation or decorative controls.

## 4. Visual and interaction direction

### A deliberate visual identity

- Use a light workspace with warm neutral surfaces, deep ink text, a restrained indigo primary color, and one distinctive AI accent. Assign separate, consistent semantic colors to pipeline stages and status. Verify accessible contrast before finalizing tokens.
- Establish a typography hierarchy for page titles, decision-driving figures, section headings, and dense record details. Use tabular figures for amounts, a consistent spacing scale, and a small set of radii and shadows.
- Create purposeful composition: a strong overview on Home, an immersive board on Pipeline, and a calm, legible deal workspace. Use one dominant action per surface and progressive disclosure for secondary details.
- Use a coherent icon set, fictional company monograms, local avatar assets or initials, and intentional chart styling. Bundle critical assets locally so the opening screen has no dependency on third-party image or font services.
- Write specific product copy. Replace generic AI claims with useful statements such as “No buyer activity in 12 days; proposal closes next week.”

### Make interactions feel finished

- Keep selected records, active filters, view choice, and scroll context when opening and closing details. Put shareable filters in URLs where appropriate.
- Offer inline editing for common deal fields, helpful validation beside the input, and clear saving/saved/failure feedback. Preserve entered text after failed saves.
- Use optimistic stage moves only with rollback on failure. Undo must persist the restored state; it is not a visual-only reversal.
- Use short, purposeful transitions for panels, board movement, and updated values. Respect reduced motion and avoid delaying the task with staged animations or simulated typing.
- Support keyboard search, predictable tab order, visible focus, Escape to dismiss, and focus return after dialogs. Dialogs and sheets manage focus and unsaved draft handling.
- Provide retryable errors and specific empty states with a relevant next action. Show skeletons only while actual data loads.

### Responsive behavior is designed separately

| Viewport | Layout and behavior |
| --- | --- |
| Wide desktop, 1440 px and above | Navigation rail, spacious main workspace, contextual detail or AI panel; important figures and priorities visible early |
| Laptop/tablet, around 1024 px | Collapsible navigation, fewer columns, and overlays when a side panel would crowd content |
| Phone, 360–430 px | Compact header, bottom navigation, stacked priorities, full-screen record/AI views, and safe-area-aware actions |

On phones, default Pipeline to a stage-filtered list with stage counts and a stage-change menu. The board may remain optional. Convert wide tables to cards with key fields; constrain any horizontal scrolling to the relevant component. Ensure forms work with the software keyboard and avoid overlapping sticky controls. Aim for at least 44 px primary touch targets and test at 200% zoom. Apply relevant [WCAG 2.2 AA criteria](https://www.w3.org/WAI/WCAG22/quickref/) to the primary workflows, including contrast, labels, focus, and non-color status cues.

### Early visual checkpoint

Before building all modules, create a populated Home and deal workspace at desktop and phone sizes. Review composition, typography, density, hierarchy, and the AI interaction using real seed content. Save screenshots in the project as a comparison baseline. Resolve weak layouts at this point.

## 5. Data that supports a believable demo

### Seed scenario

Seed approximately 25 accounts, 50 contacts, 35 opportunities, five fictional team members, and enough tasks and activity history to explain the three situations. Include open opportunities across Qualified, Discovery, Proposal, and Negotiation, plus Won and Lost history. Give the primary account a coherent buyer, proposal, meeting notes, and unanswered follow-up.

Anchor relative seed dates to workspace creation or reset so the opening story stays current. Use an injectable clock in tests and a deterministic seed recipe; derive stable record IDs within each workspace so separate visitors do not collide. Default Home and Pipeline to the current quarter and all owners. Handle quarter boundaries explicitly so the primary deal appears in that quarter, with copy that reflects its actual close date. Use synthetic businesses and reserved example email domains.

### Shared domain and definitions

Core records: workspace, team member, account, contact, opportunity, activity, task, and opportunity stage history. Include workspace ownership in the initial schema and keep related records within the same workspace. Link contacts to accounts, opportunities to accounts and a primary contact, tasks to their subject record and owner, and timeline events to the originating action.

- Use one currency, USD, for the initial demo. Store money in integer minor units; format consistently in the UI and avoid floating-point currency arithmetic.
- Define stage probabilities centrally as transparent demo assumptions: Qualified 20%, Discovery 40%, Proposal 60%, Negotiation 80%, Won 100%, Lost 0%. These are not AI-calibrated win probabilities.
- **Open pipeline:** sum of open deal amounts in the selected owner scope and expected-close period.
- **Weighted forecast:** sum of those open amounts multiplied by stage probability. Display the period and explain the formula.
- **Won value:** sum of Won deals by actual close date in the period. **Win rate:** Won divided by Won plus Lost in the same actual-close cohort; display an empty state when the denominator is zero.
- Share owner/period definitions between KPIs, charts, and drilldowns. Distinguish current pipeline from historical stage movement. Generate historical charts from seeded and recorded events; show comparison percentages only when a real baseline exists.
- Store instants in UTC and retain date-only values for close dates and task due dates. Define a workspace timezone for today, overdue, and reporting boundaries.

All displayed metrics, insights, search results, and timelines must reflect persisted records. Mutations refresh affected queries so an open panel and the dashboard cannot silently disagree.

## 6. AI that earns its place in the workflow

### Required capabilities

1. **Morning briefing:** Summarize pipeline attention and today's work, linking each claim to the relevant records.
2. **Deal risk explanation:** Explain deterministic signals such as inactivity, a missing next step, overdue work, and close-date proximity. Show signal dates and source facts.
3. **Follow-up draft:** Use the account, named buyer, last relevant activity, and intended next step. Let the visitor revise, copy, or save the draft as a note and create a task.
4. **Supported pipeline questions:** Retrieve filtered CRM records for a small, explicit set of intents covering at-risk deals, closing periods, owners, and upcoming work. Show the interpreted filters and links to results.

### Implementation contract

- Keep scoring and CRM queries in application code. Put text generation behind an `AiAssistant` interface returning structured content, source record references, and proposed actions.
- Ship a deterministic demo assistant that produces data-aware output for the supported actions and question intents. Label its mode once in the assistant header. Unexpected requests receive an honest limitation plus useful suggested questions; avoid canned answers presented as unrestricted intelligence.
- Add a live provider adapter after the complete demo passes. Keep provider keys server-side and use the same context, output validation, evidence display, and action contract.
- Use task-specific retrieval rather than sending the whole database. Generated text must not invent buyer statements, prior emails, deal facts, or quantitative confidence.
- Treat retrieved notes as data. Apply proposed writes through validated application services, after the visitor explicitly confirms the action and its fields. Do not execute arbitrary model-generated SQL or commands.
- Invalidate stale insights and drafts when relevant facts change; show a regenerate action. Save the evidence timestamp with generated output. Use pending states, timeouts, and retry behavior that preserve the user's draft.
- The demo copies drafts and records internal notes/tasks. Sending an email requires a later integration; the UI reports exactly what was saved or copied.

Verify output against a small fixture set: the primary stalled deal, an account with limited history, a deal with contradictory notes, an unsupported question, and provider failure when the optional adapter is enabled. Check grounding, useful next actions, and write approval, rather than relying on prose matching.

## 7. Technical architecture and demo operation

| Layer | Initial choice | Delivery requirement |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, and route-based navigation | Reusable components, responsive views, shareable record routes, and a reproducible locked build |
| UI behavior | Accessible primitives with custom styling | Use established focus/dialog behavior; invest custom work in composition and product interactions |
| Client data | One query/cache strategy and typed API contracts | Central invalidation, mutation rollback, and consistent error handling; avoid duplicating server state |
| API | Java 25, Spring Boot REST, Maven wrapper | Validated requests, stable error shapes, business rules in services, and health/readiness checks |
| Persistence | Spring JDBC repositories and file-backed SQLite | Transactions, parameterized SQL, explicit mappings, and indexed filter/search fields |
| Schema | One versioned migration mechanism plus separate demo seed/reset logic | Prove SQLite driver and migration compatibility in the foundation phase |
| Verification | JUnit integration tests and browser workflow tests | Cover persisted behavior, the primary story, and phone layouts; use real SQLite for persistence tests |

Suggested layout: `backend/`, `frontend/`, `docs/`, and root development scripts. Check the actual toolchain before scaffolding: the initial planning session found no Maven executable, so include the Maven wrapper and document compatible Java and Node versions. Select and lock compatible stable dependencies using the [Spring Boot requirements](https://docs.spring.io/spring-boot/system-requirements.html) and [Vite setup guidance](https://vite.dev/guide/).

**Local delivery:** One documented root command starts API and UI with clear readiness output and useful port errors. A documented verification command runs backend checks, frontend type/build checks, and the primary browser tests. Development proxies `/api` to the backend; the packaged build serves the frontend and API from one origin. Refreshing a nested route works in both modes.

**Demo hosting:** Package a deployable build and document the runtime command, port, health check, and persistent database directory. Use one application instance with a local persistent volume for SQLite. WAL requires processes to share the same host and is unsuitable for a network filesystem; follow the [SQLite WAL guidance](https://www.sqlite.org/wal.html). Run the packaged build during acceptance so deployment behavior is exercised before handoff.

**Visitor state:** Local runs can use one workspace. Before exposing a public demo, isolate each visitor's seeded workspace behind a server-issued opaque session cookie. Scope all reads, writes, AI context, and reset operations to that workspace. Refresh preserves it; another visitor's reset cannot affect it. Document expiration and clean up expired demo workspaces. A shared writable global demo is not an acceptable public preview.

### SQLite now, PostgreSQL later

- Use application-generated UUIDs, explicit boolean/date/time mappings, domain-level validation, and database constraints that express the same rules in both databases.
- Enable foreign keys for every SQLite connection, configure a bounded busy timeout, and keep write transactions short. Exclude database, WAL, and shared-memory files from version control.
- Add record versions for editable opportunities/tasks so stale edits produce a recoverable conflict rather than overwriting another change. Save stage updates and timeline events in one transaction; guard repeated task submissions from creating duplicates.
- Isolate vendor-specific migrations, search behavior, and SQL behind repository contracts. Do not depend on SQLite-only functions in business rules or use database-specific JSON as the core domain schema.
- Document a later PostgreSQL profile, matching schema migrations, data transfer, amount/date/row-count validation, and repository contract tests. Keep the initial implementation focused on SQLite; changing the JDBC URL alone is not the migration plan.

## 8. Delivery sequence and quality gates

| Phase | Work | Exit gate |
| --- | --- | --- |
| 1. Foundation and visual proof | Verify toolchain; scaffold app; prove SQLite migration/persistence; build populated Home and deal layouts at desktop/phone sizes | Reproducible startup and reload, working persistence smoke test, and reviewed screenshots that establish a strong visual direction |
| 2. Complete the primary story | Wire the primary deal, timeline, tasks, stage changes, derived metrics, and deterministic AI actions end to end | The full three-minute story works with no API key, survives refresh, and has meaningful browser/API coverage |
| 3. Complete exploration | Add the rest of Pipeline, Relationships, My work, search, supported AI questions, and the other two seed situations | Every visible navigation item and action works; filters and drilldowns agree; keyboard and phone flows are usable |
| 4. Showcase release | Refine copy/motion/states; verify packaged build; add reset/tour; prepare screenshots and presenter instructions; add visitor isolation if hosting publicly | Acceptance walkthrough and quality checks pass, with a repeatable launch/reset and no unresolved blocker in a primary flow |

A live provider adapter and other extensions follow these gates. Keep the initial visual work and the final polish pass in the schedule; expanding secondary CRUD must not displace them.

### Verification that matters

- Test API validation, money/forecast calculations, date boundaries, constraints, persistence, stage history, stale edits, repeated submissions, reset, and workspace isolation when enabled.
- Run browser coverage for the complete primary story, create/edit/search, filters and drilldowns, keyboard stage changes, failed-save recovery, and phone navigation. Verify that an undone stage move stays undone after reload, and reset leaves no stale cached data.
- Capture visual baselines at 1440 × 900, 1024 × 768, and 390 × 844; smoke-check 360 px width and 200% zoom. Inspect focus, touch targets, bottom navigation, panel layering, truncation, and page overflow manually.
- Check the primary story in Chromium and WebKit, with a Firefox navigation smoke test. Record actual browser/device coverage and any remaining limitations.
- Set an initial-load target of LCP under 2.5 seconds and CLS under 0.1 on the packaged seeded app using a documented mobile test profile. Target ordinary demo API responses below 300 ms at the 95th percentile on the recorded local test machine; these are demo budgets, not production service guarantees. Investigate slow assets, requests, or rendering rather than adding artificial delays.

## 9. Acceptance and handoff

The showcase is ready when a new visitor can:

1. Understand the opening priorities in under one minute and complete the primary story in about three minutes without explanation from the presenter.
2. Inspect the stalled deal's evidence, generate and edit a grounded follow-up, and deliberately save a task or note.
3. Change a stage, see correct derived values and timeline history, undo the move, and refresh without losing persisted state.
4. Find an account/contact through search, navigate between related records, and complete work from My work.
5. Ask a supported pipeline question, inspect the matching records, and receive useful guidance for an unsupported request.
6. Repeat the essential story on a phone using the adapted layouts and without drag-and-drop.
7. Recover from a failed save without losing entered content and use Reset demo to restore the opening story and clear stale UI state.
8. Open the packaged build directly at a deal URL. For a public preview, use two separate browser sessions and verify that edits/reset remain isolated.

Deliver working source, setup/run/test instructions, the packaged build procedure, environment examples without secrets, a short presenter script, desktop/mobile screenshots, and a concise list of actual limitations. Record which acceptance checks were run. The application and test suites are now implemented; see [verification evidence](docs/VERIFICATION.md) for the checks actually run and remaining limitations.

## 10. Implementation status

The core showcase is built and running: responsive CRM screens, persistent SQLite records, an evidence-backed demo assistant, isolated visitor sessions, seed/reset, and a packaged Java application. Setup and demo instructions are in [README.md](README.md), with [screenshots and verification](docs/VERIFICATION.md). A live AI provider and PostgreSQL implementation remain future integrations.
