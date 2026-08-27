# docs/

Artifacts of the spec-driven flow live here.

```
docs/
├── product/                   # product level — written once, updated as the product evolves
│   ├── {product}-prd.md       #   Product PRD — output of /product-spec (step 0)
│   └── feature-map.md         #   Backbone, release slices, and the feature table
├── {feature}-prd.md           # PRD — output of /product-requirements (step 1). One per feature.
└── backlog/
    └── {feature}.md           # Backlog — output of /spec-backlog (step 2), the source of truth
```

- **Product PRD** describes the *whole product*: vision, users, outcomes, non-goals.
- **Feature map** decides *what the features are* — the backbone, which release each feature
  lands in, and each feature's unique **task-id prefix**. Assigning prefixes here is what
  stops two features minting the same id.
- **PRDs** describe *what* and *why*. One per feature.
- **Backlog files** describe *how it gets built*: tasks with stable ids, acceptance criteria,
  dependencies, and branch names. Task **Status** is updated as work moves
  `todo → in-progress → in-review → done`.

`docs/product/` is optional — a single-feature addition to an existing codebase starts at
the feature PRD. All of these are committed to git and reviewed like code.
