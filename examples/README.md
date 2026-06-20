# Examples

Worked examples of the two artifacts the spec-driven loop produces. They show the **schema**
the skills expect — copy the shape, not the content.

| File | What it is | Produced by |
|------|------------|-------------|
| [`whatsapp-no-show-prd.md`](whatsapp-no-show-prd.md) | A feature PRD (what & why) | `product-requirements` skill → `docs/{feature}-prd.md` |
| [`whatsapp-no-show-backlog.md`](whatsapp-no-show-backlog.md) | The executable backlog (how it gets built) | `/spec-backlog` → `docs/backlog/{feature}.md` |

The backlog is the **source of truth** during execution: task ids (`WND-01`…) thread through
branch names, commits (`Refs: WND-01`), and PRs; `Touches:` drives the parallel-vs-sequential
decision; `Status` moves `todo → in-progress → in-review → done`.

Try it end-to-end in a scratch repo:

```text
/spec-flow "WhatsApp reminder that cuts no-shows for clinic appointments"
```
