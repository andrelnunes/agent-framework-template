# docs/

Artifacts of the spec-driven flow live here.

```
docs/
├── {feature}-prd.md       # PRD — output of the product-requirements skill (step 1)
└── backlog/
    └── {feature}.md       # Backlog — output of /spec-backlog (step 2), the source of truth
```

- **PRDs** describe *what* and *why*. One per feature.
- **Backlog files** describe *how it gets built*: tasks with stable ids, acceptance criteria,
  dependencies, and branch names. Task **Status** is updated as work moves
  `todo → in-progress → in-review → done`.

Both are committed to git and reviewed like code.
