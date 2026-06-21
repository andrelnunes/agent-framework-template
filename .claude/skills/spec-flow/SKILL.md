---
name: spec-flow
description: Orchestrate the full spec-driven loop from a raw idea to merged-ready PRs — PRD, backlog, parallel execution, and pull requests with quality gates. Triggers on "/spec-flow", "run the spec-driven flow", "take this from idea to PRs". Coordinates the existing product-requirements skill and the spec-backlog / task-execute / ship-pr skills plus the implementer and reviewer agents.
argument-hint: [feature idea or PRD path]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Spec Flow (orchestrator)

Drive a feature through the whole pipeline. You are the conductor — delegate each phase to
the right skill or agent, confirm at the gates, and keep the backlog file as the source of truth.

## The chain

**1 · Spec.** If no PRD exists for this idea, run the **`product-requirements`** skill to
produce `docs/{feature}-prd.md`. Confirm the PRD with the user before decomposing.

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
- After the PRD (step 1) — is this the right spec?
- After the backlog (step 2) — right slices, right order?
- Before each PR is actually created (step 5) — confirm title + body.

Everything between those gates can run autonomously. Report a concise status after each phase:
which tasks are `todo / in-progress / in-review / done`, and what's blocked on what.

## Guardrails (always in force)
- `main` protected; `develop` integration-only; work on `feat/*` cut from `develop`.
- The branch-guard hook blocks commits/pushes on protected branches — don't fight it.
- Definition of Done (see CLAUDE.md) must hold before a task is `done`.
