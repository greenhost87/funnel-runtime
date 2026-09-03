# Delivery checklist

| Item              | Status                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| Repository URL    | Fill from `git remote get-url origin` before handoff                      |
| README            | [`README.md`](./README.md)                                                |
| CI                | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — run on push/PR |
| Public URL        | **TBD — blocking** until deployment decision (D2)                         |
| Local smoke       | `bun run migrate && bun run seed && bun run dev`                          |
| Tests             | `bun test`, `bun run test:e2e`                                            |
| Traffic generator | `bun run generate:traffic -- --seed 42 --sessions 120`                    |

## Pre-handoff verification

- [ ] Repository URL recorded above
- [ ] CI green on `main`
- [ ] README reviewed against assignment section 9
- [ ] Admin publish + rollback verified with `iteration-2.json`
- [ ] Public URL smoke check **or** explicit TBD note retained

## Notes

- D1 (Bun-first) and D2 (no deploy in plan) are deliberate accepted decisions documented in README.
- Primary metric formula: `unique sessions with cta_clicked / unique sessions with session_started`.
