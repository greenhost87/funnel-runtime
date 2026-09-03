# Funnel Runtime

Bun-first fullstack platform for configurable multi-step web funnels with versioning, A/B experiments, event batching, analytics, and rollback.

## Decisions (D1–D3)

**D1 — Bun-first runtime.** Install, scripts, runtime, and SQLite use Bun and `bun:sqlite`. This is an intentional deviation from the original Node.js wording in the assignment brief.

**D2 — Deployment out of scope.** Public URL and persistent production storage remain **TBD** until a separate deployment decision. CI verifies build and tests only.

**D3 — Synthetic fixtures.** Missing source JSON configs are replaced by repository fixtures under `fixtures/funnels/`. Variant B tests lower-friction copy, earlier low-friction questions, reordered steps, and a benefit-oriented result. **Primary metric:** `unique sessions with cta_clicked / unique sessions with session_started`.

## Local setup

```bash
cp .env.example .env
bun install
bun run migrate
bun run seed
bun run dev
```

Open `http://localhost:3000` for the funnel and `/admin/login` for admin (password from `ADMIN_PASSWORD`).

## Environment

| Variable               | Purpose                              |
| ---------------------- | ------------------------------------ |
| `SQLITE_PATH`          | SQLite database file path            |
| `APP_URL`              | Public app URL for links             |
| `ADMIN_PASSWORD`       | Local admin login password           |
| `ADMIN_SIGNING_SECRET` | HMAC secret for admin session cookie |

## Commands

| Command                                                | Purpose                             |
| ------------------------------------------------------ | ----------------------------------- |
| `bun run dev`                                          | Development server                  |
| `bun run build`                                        | Production build                    |
| `bun run typecheck`                                    | TypeScript check                    |
| `bun run fmt` / `fmt:check`                            | Format with oxfmt                   |
| `bun run migrate`                                      | Apply SQL migrations                |
| `bun run seed`                                         | Idempotent initial config publish   |
| `bun test`                                             | Unit/integration tests (`bun:test`) |
| `bun run test:e2e`                                     | Playwright browser tests            |
| `bun run generate:traffic -- --seed 42 --sessions 120` | Synthetic traffic generator         |

## Data model

SQLite tables (see `migrations/0001_initial.sql`):

- `funnel_versions` — immutable published JSON snapshots
- `funnel_activation_history` — activation/rollback ledger; active = latest row
- `sessions` — pinned version/variant, answers, step state, durable `session_started` pending/recorded
- `session_transitions` — immutable forward transitions with `transition_id`
- `events` — idempotent analytics facts keyed by `event_id`

## Config schema

Funnel JSON is validated by Valibot in `system/funnel/config.schema.ts`:

- Step types: `single-select`, `multi-select`, `number`, `info`
- Conditional transitions, result/CTA, variant overrides (order, exclusions, text, result)
- Optional config-declared custom events

Fixtures:

- `fixtures/funnels/initial.json` — first iteration with A/B
- `fixtures/funnels/alternative.json` — alternate publish target
- `fixtures/funnels/iteration-2.json` — second iteration (branch, B screen removal, new event)

## Event schema

Batch endpoint: `POST /api/events` with `{ events: [...] }`.

Required events: `session_started`, `step_viewed`, `answer_submitted`, `step_completed`, `back_clicked`, `result_viewed`, `cta_clicked`.

Each stored event includes server/client timestamps, pinned version/variant, nullable `step_id`, UTM fields, safe properties. `step_completed` must reference an immutable `transition_id`. Raw answers are rejected from event payloads.

Idempotency: duplicate `event_id` returns `duplicate` without double-counting. Partial batch acceptance is supported.

## Aggregation rules

Analytics uses **distinct session IDs** and trusted transition-linked completions:

- Started = unique `session_started`
- Primary metric (D3) = unique `cta_clicked` / unique `session_started`
- Edge conversion = unique completions per immutable `from_step_id` → `to_step_id`/result
- Drop-off = viewed step without completion for that step
- Repeats, Back, duplicate IDs, and out-of-order timestamps do not inflate unique counts

## A/B hypothesis

**Hypothesis (variant B):** Shorter copy, earlier low-friction questions, and reordered steps reduce friction and increase primary CTA-from-start conversion vs variant A.

## Timeline

1. **First iteration:** Core runtime — dynamic funnel, versioning, events, analytics, admin, tests.
2. **Second iteration:** Publish `iteration-2.json` via admin (conditional branch, B screen removal, `premium_interest_signal` event) without SQLite schema changes; verify old sessions stay pinned; rollback preserves analytics.

## Known limitations

- Public URL: **TBD** (D2)
- Production persistent storage: **TBD** (D2)
- Admin auth is local password + signed cookie only
- Visual config editor is intentionally out of scope

## CI

GitHub Actions (`.github/workflows/ci.yml`): frozen install, format check, typecheck, `bun test`, production build, Playwright. No deploy job.
