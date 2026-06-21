---
name: spec-backlog
description: Decompose a PRD into a structured, executable backlog — discrete tasks with stable ids, acceptance criteria, dependencies, and branch names — ready for agents to pick up. Triggers on "break the PRD into tasks", "create the backlog", "/spec-backlog", or after a PRD is generated. Reads docs/{feature}-prd.md, writes docs/backlog/{feature}.md.
argument-hint: [path-to-prd or feature-name]
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Spec → Backlog

Turn a PRD into a backlog an agent can execute without re-reading your mind. This is the
bridge between **what** (the PRD) and **how it gets built** (tasks on branches).

## Input
A PRD at `docs/{feature}-prd.md` (from the `product-requirements` skill). If `$ARGUMENTS`
names a PRD path or feature, use it; otherwise ask which PRD to decompose.

## Procedure
1. Read the PRD in full: user stories, acceptance criteria, functional requirements, MVP
   phasing, technical constraints, risks.
2. Slice into tasks that are each:
   - **Independently shippable** — one PR's worth of work, ideally < ~1 day.
   - **Vertically sliced** where possible (a thin end-to-end capability beats a horizontal layer).
   - **Testable** — every acceptance criterion must be expressible as an automated acceptance
     test. If a criterion can't be tested, rewrite it until it can (or flag it explicitly).
3. Assign a **stable id**: a 2–4 letter feature prefix + number, e.g. `WND-01`, `WND-02`.
   Ids never change once written — they thread through branch names, commits, and PRs.
4. Map **dependencies** between tasks and flag which can run **in parallel** vs. must be
   **sequential** (tasks editing the same files = sequential).
5. Derive a **branch name** per task: `feat/<feature>-<short-slug>`.
6. Order the backlog: dependencies first, then by MVP priority from the PRD.

## Output — `docs/backlog/{feature}.md`
```markdown
# Backlog: {Feature Name}
PRD: docs/{feature}-prd.md
Generated: {YYYY-MM-DD}

## Execution plan
- Parallel set A (no shared files): WND-01, WND-03
- Sequential: WND-02 (after WND-01), WND-04 (after WND-02)

## Tasks

### WND-01 — {task title}
- **Status:** todo            <!-- todo | in-progress | in-review | done -->
- **Branch:** feat/{feature}-{slug}
- **Depends on:** none
- **Can parallelize with:** WND-03
- **Description:** {1–2 sentences}
- **Acceptance criteria:**
  - [ ] {testable criterion, traceable to the PRD}
  - [ ] {…}
- **Acceptance tests:**            <!-- one per criterion; written FIRST during /task-execute -->
  - [ ] `WND-01: {criterion}` — {test type: unit | integration | e2e} — {what it asserts}
  - [ ] `WND-01: {…}`
- **Touches:** {files/modules, best estimate — used to detect conflicts}
- **Test notes:** {fixtures/mocks/data needed; how to run just these tests}

### WND-02 — {…}
…
```

Every acceptance test in the plan is **tagged with the task id** (e.g. `WND-01: …`) so the
quality gate can verify it exists. The implementer writes these tests *before* the code.

## Handoff
End by printing the **execution plan** and recommending the next move: either
`/task-execute <id>` for one task, or spawning `feature-implementer` subagents for the
parallel set. Keep the backlog file the single source of truth — update task **Status** as
work progresses.
