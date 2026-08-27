---
name: product-spec
description: Spec a whole product, not one feature — vision, users, outcomes, then a story-mapped feature list with unique task-id prefixes and release slices. Triggers on "/product-spec", "spec the whole product", "what should we build first", or a greenfield repo with no docs/product/. Writes docs/product/{product}-prd.md and docs/product/feature-map.md, which feed /product-requirements per feature.
argument-hint: [product idea or name]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Product Spec (the rung above the feature)

Decide **what the features are** before anyone writes a feature PRD. Output is two files
that make the rest of the loop navigable: a product PRD, and a feature map that assigns each
feature its id prefix and release slice.

Use this when starting a product, or when a backlog has grown without anyone deciding what
ships first. For a single feature inside an existing product, skip straight to
`/product-requirements`.

## Input
`$ARGUMENTS` is the product idea or name. If `docs/product/` already holds a PRD, read it and
**update** rather than overwrite — this skill is re-runnable as the product evolves.

## Procedure

### 1 · Frame the product
Ask up to **5 questions**, prioritising the ones that change the feature list: who the user
is and what they do today instead; the one outcome that defines success; what is explicitly
out of scope; hard constraints (compliance, integrations, platform); and what "done enough
to ship" means for release 1. Encode the answers into the PRD.

### 2 · Map the product into features

Decomposition follows Jeff Patton's user story mapping. **If the `story-mapping` skill is
available, delegate to it** for the backbone and release slicing, then bring the result back
here. It is a *user-scoped* skill and may not be installed — check first, and if it is
missing, run this condensed sequence inline. Never fail because a skill is absent.

1. **Backbone.** List the **activities** a user moves through, left to right in the order
   they actually happen. Narrative order, not architectural layers.
2. **Tasks under each activity.** The steps within it. Go **mile wide, inch deep** — cover
   the whole backbone before deepening any part.
3. **Slice releases.** Draw a line across the map. **Release 1 is the walking skeleton:** the
   thinnest path that crosses the *entire* backbone so a user can go end to end. A release
   that covers one activity beautifully and leaves the journey broken is not a release.
4. **A feature = a slice-crossing chunk** of one or more activities — one `docs/{feature}-prd.md`'s
   worth of work. Not a layer ("the database"), not a single story.

### 3 · Assign id prefixes — do not skip this
Give every feature a **unique 2–4 letter prefix**. Backlog task ids derive from it
(`AUTH-01`, `NOTIF-03`) and thread through branch names, commits, PRs, and the acceptance
gate's search. `/spec-backlog` mints a prefix per feature with nothing to deconflict
against, so without this table two features can collide on the same id — and the gate would
then match one feature's test against the other's task. Assigning prefixes here removes the
collision by construction. Check the table for a clash before adding a row.

### 4 · Write both files, then stop for confirmation
The feature list is the highest-leverage decision in the loop — everything downstream
inherits it. Present the map and get a go-ahead before anyone writes a feature PRD.

## Output — `docs/product/{product}-prd.md`

```markdown
# Product PRD: {Product Name}

## Vision
{What this product is, for whom, in 2–4 sentences. The change it makes in someone's life.}

## Users
- **{Role}** — {their situation today, what they do instead, what they need}

## Outcomes
{How success is measured — behavioural or business outcomes, not feature counts.}
- {Outcome, with a number where one is knowable}

## Non-goals
- {What this product deliberately does not do — the boundary that keeps scope honest}

## Constraints
- {Platform, compliance, integrations, budget, team shape}

## Risks
- {What could sink the product, and how it's mitigated}
```

## Output — `docs/product/feature-map.md`

```markdown
# Feature Map: {Product Name}
Product PRD: docs/product/{product}-prd.md
Generated: {YYYY-MM-DD}

## Backbone
{Activity 1} → {Activity 2} → {Activity 3} → {Activity 4}

## Releases
- **R1 — walking skeleton:** {the thinnest end-to-end path, and what a user can do once it ships}
- **R2:** {what deepens}

## Features

| Prefix | Feature | Activity | Release | PRD | Status |
|--------|---------|----------|---------|-----|--------|
| `ABC` | {name} | {activity} | R1 | `docs/{feature}-prd.md` | todo |
| `DEF` | {name} | {activity} | R2 | — | todo |

<!-- Status: todo | speccing | in-progress | shipped. Prefixes are unique and permanent. -->

## Dependencies
- {FEATURE-B needs FEATURE-A shipped first, and why}
```

## Guardrails
- **Stay at product altitude.** Vision, users, outcomes, boundaries. The moment you are
  writing acceptance criteria, you are in `/product-requirements`, not here.
- **Prefixes are permanent.** They are embedded in branch names and commit trailers. Renaming
  one orphans the acceptance gate's link to shipped work.
- **Re-runnable.** Update the map as the product evolves; never silently drop a feature row —
  mark it and say why.

## Handoff
Print the backbone, the release slices, and the feature table. Then recommend
`/product-requirements <first R1 feature>` — walking skeleton first, in dependency order.
