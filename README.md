# Funnel Runtime

Fullstack TypeScript runtime for configurable multi-step funnels, pinned configuration versions, A/B experiments, batched events, analytics, synthetic traffic, and rollback. The application uses Next.js, React, Bun, and SQLite without external services.

## Local setup

Requirements: Bun 1.4.0 and a Chromium installation for Playwright.

```bash
cp .env.example .env
bun install --frozen-lockfile
bun run migrate
bun run dev
```

Open `http://localhost:3000` for the funnel and `http://localhost:3000/admin/login` for administration. Migration `0002_seed_initial_funnel.sql` publishes the initial funnel in an empty database.

## Environment

| Variable               | Purpose                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `SQLITE_PATH`          | Persistent SQLite file; defaults to `data/app.sqlite`                       |
| `APP_URL`              | External application URL                                                    |
| `ADMIN_PASSWORD`       | Password for the internal pages                                             |
| `ADMIN_SIGNING_SECRET` | HMAC secret for the admin session cookie                                    |
| `BASE_PATH`            | Optional URL prefix for production deployment and server-side path helpers |
| `NEXT_PUBLIC_BASE_PATH`| Optional client-side URL prefix; falls back to `BASE_PATH` when unset       |
| `LOG_LEVEL`            | Optional production log verbosity; see `.github/workflows/scripts/production.env.example`      |
| `DATA_RETENTION_*`     | Optional production retention schedule; see `.github/workflows/scripts/production.env.example` |

## Commands

| Command                                                                                    | Purpose                                                   |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `bun run dev`                                                                              | Development server                                        |
| `bun run build`                                                                            | Production build                                          |
| `bun run start`                                                                            | Production server                                         |
| `bun run typecheck`                                                                        | Generate Next route types and run TypeScript              |
| `bun run fmt`                                                                              | Format the repository                                     |
| `bun run fmt:check`                                                                        | Check formatting                                          |
| `bun run migrate`                                                                          | Apply immutable SQL migrations and seed an empty database |
| `bun test`                                                                                 | Unit and integration tests                                |
| `bun run test:e2e`                                                                         | Playwright tests against an isolated production build     |
| `bun run generate:traffic -- --sessions 120 --seed 42`                                     | Generate deterministic traffic for the active version     |
| `bun run generate:traffic -- --version-id <id> --sessions 120 --seed 42 --date 2026-09-01` | Generate traffic for a selected version and event date    |

The generator requires at least 100 sessions. It creates both variants, several UTM campaigns and branches, drop-offs, Back/repeated views with different IDs, duplicate batch delivery, and reversed event delivery. It prints the resulting summary so the dashboard can be checked against the generated database.

## Configuration model

`system/funnel/config.schema.ts` validates JSON before publication. A config contains:

- at least six base steps;
- at least one conditional transition (`when`);
- `single-select`, `multi-select`, `number`, and `info` step types;
- answer constraints and conditional transitions;
- a result screen and primary CTA;
- variant A/B overrides for text, exact step order, excluded steps, and result content;
- optional version-scoped custom event names.

When `stepOrder` is present, it defines the effective default sequence. Conditional transitions whose targets remain in the effective variant are preserved; transitions to omitted steps are removed and use the ordered default path. Publication rejects empty or duplicate variant orders and dangling effective transitions.

The frontend renders the effective backend config and contains no funnel-specific screens. The backend validates every mutation and persists answers, current step, history, and progress.

## Data model and versions

SQLite migrations are in `migrations/`:

- `funnel_versions`: immutable JSON snapshots;
- `funnel_activation_history`: append-only publication and rollback ledger; the latest row is active;
- `sessions`: pinned version, pinned A/B variant, initial UTM values, answers, current state, history, and the durable `session_started` event ID;
- `session_transitions`: immutable forward transitions used to validate completion facts;
- `events`: analytics facts keyed by unique `event_id` and enriched with trusted session attribution.

Publishing creates a new immutable version and activation in one transaction. Rollback appends an activation for an existing version and never deletes versions, sessions, or events. Existing cookies restore their pinned version and variant after refresh, publication, or rollback; only new sessions use the current active version. `?variant=A` and `?variant=B` override assignment only when a new session is created.

## Event schema and idempotency

`POST /api/events` accepts `{ "events": [...] }`. Standard events are:

- `session_started`;
- `step_viewed`;
- `answer_submitted`;
- `step_completed`;
- `back_clicked`;
- `result_viewed`;
- `cta_clicked`.

Each item supplies `eventId`, `eventName`, `sessionId`, `clientTimestamp`, optional `stepId`, optional `transitionId`, and safe event properties. The server adds server timestamp, pinned version/variant, and UTM values. `step_completed` must reference the transition created by the corresponding state mutation. Raw answer keys are rejected recursively.

Every item is parsed and processed independently. A malformed neighbor does not prevent valid items from being accepted. Reusing an accepted `eventId` returns `duplicate`, including retries of `step_completed`, and creates no additional fact. Browser intents survive uncertain delivery in `sessionStorage`, are retried with their original IDs, and are replayed on the next page load if both immediate attempts fail.

Custom events are scoped to the pinned config. The seeded v1 config accepts `benefit_highlight_viewed`; `fixtures/funnels/iteration-2.json` adds `premium_interest_signal` for `wellness-quiz-v2` while keeping `benefit_highlight_viewed`. Sending a custom event outside the pinned config is rejected without affecting that session.

## Analytics rules

All user counts use distinct session IDs rather than event counts:

- started: unique sessions with `session_started`;
- primary conversion: unique sessions with `cta_clicked` divided by started sessions;
- result reach: unique sessions with `result_viewed` divided by started sessions;
- CTA CTR: unique sessions with `cta_clicked` divided by sessions that viewed the result;
- edge conversion: unique sessions completing a concrete transition divided by unique sessions viewing its source step;
- step drop-off: viewed sessions without any completion from that source step.

Metrics are grouped by pinned version and variant. Filters support UTM campaign, version, variant, and client event date. Distinct aggregation and immutable transition facts prevent duplicate IDs, repeated views, Back navigation, and out-of-order arrival from inflating totals. Empty denominators produce no rate instead of division by zero.

## A/B hypothesis and interpretation

**Hypothesis:** variant B's shorter copy, low-friction ordered sequence, and concise result reduce abandonment and increase CTA-from-start conversion relative to variant A.

**Primary metric:** `unique sessions with cta_clicked / unique sessions with session_started` for each variant within the same version, date range, and campaign mix.

Result reach and per-step drop-off are diagnostic metrics. CTA CTR separates result-screen effectiveness from upstream funnel friction. A higher raw rate is not evidence of a winner by itself: compare equivalent traffic slices and wait for an adequate sample before drawing a statistical conclusion.

## Iteration timeline

1. First iteration: dynamic funnel, server-persisted state, immutable versions, A/B assignment, events, analytics, admin pages, traffic generation, and automated tests.
2. Second iteration: `fixtures/funnels/iteration-2.json` adds the premium branch and `premium_interest_signal`, removes steps from variant B, publishes through the same admin API without a schema change, verifies old/new session compatibility, and rolls back while retaining analytics.

## Deployment

`.github/workflows/ci.yml` checks frozen installation, formatting, types, tests, build, and Playwright. `.github/workflows/deploy.yml` builds an archive and deploys it to a configured host. `.github/workflows/scripts/run-archive.sh` applies migrations, swaps releases, checks `/api/health`, and restores the previous release if deployment fails. SQLite remains outside the release directory.

## Known limitations

- Bun is the server runtime, an intentional deviation from the assignment's literal Node.js wording.
- SQLite and the process-local connection model target a single application instance.
- Admin authentication is a shared password with a signed, expiring HTTP-only cookie.
- The visual config editor is intentionally out of scope.
- Runtime retention can delete old session analytics when explicitly enabled in production.
