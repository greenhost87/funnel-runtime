# Pre-commit checklist

Run all of these before every commit. Each one has caught a real CI/deploy
failure in the past — skipping any of them is how broken commits reach `main`.
Order is cheapest-first so failures surface fast.

1. Format (write, then check) — `oxfmt`. The deploy pipeline runs
   `fmt:check` inside `build-artifact.sh` and fails the whole deploy on
   formatting drift:
   - `bun run fmt`
   - `bun run fmt:check`
2. Lint gate — `Oxlint` (+ Fallow). This is the only check that enforces
   eslint-style rules such as `max-lines-per-function` (limit: 40 lines per
   function, UI components included). Neither `tsc` nor tests catch these:
   - harness `verify` (agent-quality-gate)
3. Types:
   - `bun run typecheck`
4. Unit tests:
   - `bun test`
5. Production build:
   - `bun --bun next build`
6. E2E (Playwright, chromium). Full suite takes ~1 min. At minimum run the
   spec covering the changed area, then the full suite before pushing:
   - `bun run scripts/run-e2e.ts tests/e2e/<name>.pw.ts`
   - `bun run scripts/run-e2e.ts`

# Production-install constraint

The server installs with `bun install --production --frozen-lockfile`
(devDependencies excluded) and runs `next start` against `next.config.ts`.
Anything required at runtime — e.g. `typescript` for loading
`next.config.ts` — must live in `dependencies`, never in `devDependencies`.
After moving a package between sections, run `bun install` to refresh
`bun.lock` and commit the lockfile.
