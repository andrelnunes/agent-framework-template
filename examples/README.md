# Examples

Worked examples of the artifacts the spec-driven loop produces. They show the **schema** the
skills expect — copy the shape, not the content. All four describe one fictional product, so
you can read them top to bottom as a single trail from product idea to executable tasks.

| File | What it is | Produced by |
|------|------------|-------------|
| [`clinic-ops-product-prd.md`](clinic-ops-product-prd.md) | A product PRD (vision, users, outcomes) | `/product-spec` → `docs/product/{product}-prd.md` |
| [`clinic-ops-feature-map.md`](clinic-ops-feature-map.md) | The feature list, id prefixes, release slices | `/product-spec` → `docs/product/feature-map.md` |
| [`whatsapp-no-show-prd.md`](whatsapp-no-show-prd.md) | A feature PRD (what & why) — the `WND` row of the map | `/product-requirements` → `docs/{feature}-prd.md` |
| [`whatsapp-no-show-backlog.md`](whatsapp-no-show-backlog.md) | The executable backlog (how it gets built) | `/spec-backlog` → `docs/backlog/{feature}.md` |

The first two are **optional** — a single feature added to an existing codebase starts at the
feature PRD. They earn their place when you're starting a product and need to decide what the
features are before speccing any one of them.

The backlog is the **source of truth** during execution: task ids (`WND-01`…) thread through
branch names, commits (`Refs: WND-01`), and PRs; `Touches:` drives the parallel-vs-sequential
decision; `Status` moves `todo → in-progress → in-review → done`.

Try it end-to-end in a scratch repo:

```text
/spec-flow "WhatsApp reminder that cuts no-shows for clinic appointments"
```
