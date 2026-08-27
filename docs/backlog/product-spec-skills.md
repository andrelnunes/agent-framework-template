# Backlog: Product-spec skills
PRD: n/a — framework maintenance; the kit's own docs are the spec.
Generated: 2026-08-27

## Execution plan
- Sequential: AFT-300 (single task; every file is part of one chain)

## Tasks

### AFT-300 — Ship the two missing rungs above the backlog
- **Status:** in-review
- **Branch:** feat/product-spec-skills
- **Depends on:** none
- **Can parallelize with:** none
- **Description:** The kit referenced a `product-requirements` skill in eight places but
  never shipped it, so `/spec-flow` died at step 1 in every installed repo. And there was no
  rung above the feature: nothing decided what a product's features are, what ships first,
  or that their task-id prefixes don't collide. This adds both skills and wires them in.
- **Acceptance criteria:**
  - [x] `/product-requirements` exists and writes `docs/{feature}-prd.md` with the seven
        headings `/spec-backlog` reads
  - [x] `/product-spec` exists and writes `docs/product/{product}-prd.md` +
        `docs/product/feature-map.md`, assigning each feature a unique id prefix
  - [x] `/product-spec` degrades gracefully when the user-scoped `story-mapping` skill is
        absent, rather than failing
  - [x] `/spec-backlog` takes a feature's prefix from the feature map when one exists
  - [x] Every skill referenced in the kit's docs resolves to an installed skill
  - [x] The installer ships both new skills into a fresh project
- **Acceptance tests:**
  - [x] `AFT-300: installer ships every kit skill, with frontmatter matching its directory`
        — integration — installs into a temp dir and asserts each skill's `SKILL.md` exists
        and its frontmatter `name` equals its directory (the name is how `/<skill>` resolves)
  - [x] `AFT-300: no doc references a skill that is not installed` — unit — scans the kit's
        docs for backticked `/slash` invocations and fails on any that isn't shipped. This
        is the regression guard for the original bug; it caught a second dangling `/prd`
        reference in `CLAUDE.md:30` on its first run.
- **Contracts:** `/product-requirements` output headings are a contract with `/spec-backlog`
  (Problem, Goal, Users & stories, Functional requirements, MVP phasing, Technical
  constraints, Risks). Feature-map id prefixes are permanent — they're embedded in branch
  names and commit trailers.
- **Touches:** .claude/skills/product-spec/, .claude/skills/product-requirements/,
  .claude/skills/spec-flow/SKILL.md, .claude/skills/spec-backlog/SKILL.md, CLAUDE.md,
  README.md, docs/README.md, examples/
- **Test notes:** `npm test` (node:test, zero deps). The doc-scan test needs no fixture; the
  installer test scaffolds into a temp dir and cleans up after itself.
