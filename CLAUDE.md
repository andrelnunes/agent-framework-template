# CLAUDE.md — B42 Spec-Driven Engineering

This repository runs a **spec-driven development** workflow. Every change flows
PRD → backlog task → branch → implementation → quality gate → pull request.
These rules are non-negotiable and apply to the main session and every subagent.

---

## TIER 1 — HARD RULES (check before every action)

### Branch model
- `main` is **protected**. Never commit, push, rebase, or force-push to it. It only
  receives code through a merged, reviewed pull request from `develop`.
- `develop` is the **integration branch**. Never commit directly to it either. It only
  receives code through a merged pull request from a `feat/*` branch.
- All work happens on **`feat/<feature-name>`** branches, always cut **from `develop`**.
  - Naming: `feat/` for features, `fix/` for bug fixes, `chore/` for tooling/maintenance.
  - `<feature-name>` is kebab-case and traces back to a backlog task id, e.g.
    `feat/whatsapp-no-show-reminder` (task `WND-03`).

### Before touching any file
1. Confirm `HEAD` is on a `feat/*` / `fix/*` / `chore/*` branch — **not** `main` or `develop`.
   If it is not, stop and create the correct branch from an up-to-date `develop` first.
2. Confirm a backlog task exists for this work. If there is no task, you are working
   without a spec — go back to `/spec-backlog` (or `/prd` if there is no PRD yet).

A `PreToolUse` hook enforces the branch rule automatically and will block a `git commit`
or `git push` issued while on `main` or `develop`. Do not try to work around it.

### Definition of Done (a task is only done when all are true)
- [ ] Implements every acceptance criterion of its backlog task.
- [ ] `lint`, `typecheck`, and `test` all pass locally (run `.claude/scripts/quality-gate.sh`).
- [ ] Committed on a correctly-named branch with a Conventional Commit message.
- [ ] A pull request to `develop` is open, using the PR template, fully filled in.
- [ ] A fresh-context review (`spec-reviewer` agent) found no blocking gaps.

---

## TIER 2 — THE SPEC-DRIVEN LOOP

Run the chain end-to-end with `/spec-flow`, or step through it manually:

| Step | Command / Skill | Input → Output |
|------|-----------------|----------------|
| 1. Define the spec | `product-requirements` *(existing skill)* | idea → `docs/{feature}-prd.md` |
| 2. Decompose to backlog | `/spec-backlog` | PRD → `docs/backlog/{feature}.md` (tasks w/ ids, AC, deps) |
| 3. Execute a task | `/task-execute <task-id>` | task → branch + implementation + passing gates |
| 4. Ship it | `/ship-pr` | commit + PR to `develop` (template, linked task) |
| 5. Review | `spec-reviewer` *(agent)* + `engineering:code-review` *(existing skill)* | diff → findings |

**Planning before code is mandatory.** For any multi-file or non-trivial task, produce a
short plan (files to touch, approach, risks) and confirm it before implementing. Separate
*research/planning* from *execution* so you don't confidently build the wrong thing.

### Running work in parallel
- Use **subagents** (`feature-implementer`) for independent backlog tasks. Spawn one per
  task; each works on its own `feat/*` branch. Be explicit about how many to run.
- A subagent inherits none of the parent conversation. Pass it the **task id, the backlog
  file path, the PRD path, and the acceptance criteria** directly in its prompt.
- When two tasks touch the same files, run them **sequentially**, not in parallel, to avoid
  merge conflicts. Prefer git worktrees if you genuinely need concurrent checkouts.

---

## TIER 3 — QUALITY STANDARDS

### Commits — Conventional Commits
```
<type>(<scope>): <subject>     # type ∈ feat|fix|chore|docs|refactor|test|perf

<body: what & why, not how>

Refs: <task-id>                # e.g. Refs: WND-03
```
One logical change per commit. No `WIP`, no commented-out code, no secrets.

### Pull requests
- Target `develop`, never `main`.
- Title mirrors the lead commit: `feat(scope): subject`.
- Body uses `.github/pull_request_template.md` with **every** section filled. The CI
  `pr-description-check` job fails the PR if required sections are missing.
- Link the backlog task and PRD. A PR with no linked task is not reviewable.

### Tests & validation
- The workflow is **stack-agnostic**: the quality gate calls whatever `lint`, `typecheck`,
  `test`, and `build` scripts your `package.json` defines (missing ones are skipped). For
  non-Node stacks, expose those entry points however your toolchain prefers and point the
  gate at them. Adapt this section to your project's actual stack and commands.
- New behaviour ships with tests. Bug fixes ship with a regression test.
- Never weaken a test to make it pass; fix the code.

### Context discipline
- Keep this file lean. Domain-specific rules go in a referenced doc, not inlined here.
- Clear/compact context between unrelated tasks. Don't let one session accumulate the
  state of three features.

---

## Model allocation (cost vs. quality)
- Orchestration, planning, and review → strong model (Opus).
- Scoped implementation in subagents → `CLAUDE_CODE_SUBAGENT_MODEL` (Sonnet) for focused work.
- Keep judgment calls on the strong model; push mechanical fan-out down.
