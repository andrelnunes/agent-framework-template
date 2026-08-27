---
name: spec-flow
description: Orchestrate the full spec-driven loop from a raw idea to merged-ready PRs — product spec, PRD, backlog, parallel execution, and pull requests with quality gates. Triggers on "/spec-flow", "run the spec-driven flow", "take this from idea to PRs". Coordinates the product-spec / product-requirements / spec-backlog / task-execute / ship-pr skills plus the implementer and reviewer agents.
argument-hint: [feature idea or PRD path]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Spec Flow (orchestrator)

Drive a feature through the whole pipeline. You are the conductor — delegate each phase to
the right skill or agent, confirm at the gates, and keep the backlog file as the source of truth.

## The chain

**0 · Product (only when the ask is product-scale).** If the request is a whole product
rather than one feature — and `docs/product/` holds no product PRD — run **`/product-spec`**
first. It produces `docs/product/{product}-prd.md` and `docs/product/feature-map.md`, which
decides *what the features are*, assigns each a unique task-id prefix, and orders them into
release slices. Then run steps 1–5 per feature, walking skeleton first. For a single feature
in an existing product, skip to step 1.

**1 · Spec.** If no PRD exists for this idea, run the **`/product-requirements`** skill to
produce `docs/{feature}-prd.md`. If the feature has a row in `docs/product/feature-map.md`,
pass it along — the row carries the id prefix and release slice this PRD must respect.

**1.5 · Clarify.** Interrogate the spec before decomposing — don't just ask "is this right?".
Challenge the PRD with up to **5 targeted questions** covering: ambiguities, unstated edge
cases, criteria that aren't testable as written, missing external-behaviour contracts
(inputs/outputs, pre/postconditions, invariants), and conflicts with existing functionality.
**Encode every answer back into the PRD** — clarifications that live only in chat are lost.
Exit this phase only when the user confirms the updated spec.

**2 · Backlog.** Run **`/spec-backlog`** on the PRD → `docs/backlog/{feature}.md`. Present the
execution plan (parallel sets vs. sequential chains). Get a go-ahead on scope and ordering.

**3 · Execute.** For each ready task:
- Independent tasks in a parallel set → spawn one **`feature-implementer`** subagent each,
  passing the **task id, backlog path, PRD path, and acceptance criteria** explicitly. Cap
  parallelism sensibly; tasks sharing files in **Touches:** run sequentially.
- A single task → run **`/task-execute <id>`** directly.

**4 · Review.** For each finished branch, run the **`spec-reviewer`** agent against the task's
acceptance criteria, plus the existing **`engineering:code-review`** skill. Send anything with
blocking findings back to step 3.

**5 · Ship.** For each approved branch, run **`/ship-pr`** to push and open a PR to `develop`
(template filled, task linked). CI `pr-validation.yml` runs the gates automatically.

## Gates where you pause for the user
- The feature map (step 0, product-scale runs only) — right features, right release slices,
  walking skeleton genuinely end-to-end? Everything downstream inherits this decision.
- Clarify (step 1.5) — targeted questions answered and encoded into the PRD; spec confirmed.
- Before each commit made in the interactive session — diff presented, user approved
  (subagents commit on their own branches; their checkpoint is the PR).
- After the backlog (step 2) — right slices, right order?
- Before each PR is actually created (step 5) — confirm title + body.

Everything between those gates can run autonomously. Report a concise status after each phase:
which tasks are `todo / in-progress / in-review / done`, and what's blocked on what.

## Guardrails (always in force)
- `main` protected; `develop` integration-only; work on `feat/*` cut from an **up-to-date**
  `develop` (`git pull --ff-only` first, always).
- The branch-guard hook blocks commits/pushes on protected branches — don't fight it.
- **Scope & non-regression:** no changes to working functionality beyond the task's
  acceptance criteria or an explicit user request; out-of-scope findings become new backlog
  tasks, not inline fixes.
- Definition of Done (see CLAUDE.md) must hold before a task is `done` — including spec-sync
  when implementation deviated from the spec.
