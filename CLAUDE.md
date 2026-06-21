# CLAUDE.md — B42 Spec-Driven Engineering

This repository runs a **spec-driven, test-gated development** workflow. Every change flows
PRD → backlog task → branch → **acceptance tests (from the spec)** → implementation →
quality gate → pull request. A task is **not done, and not committable, until its
spec-derived acceptance tests exist and pass.** These rules are non-negotiable and apply to
the main session and every subagent.

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

### Acceptance tests are mandatory — and they come first
- When a task is taken, **derive acceptance tests from its spec** (the backlog task's
  acceptance criteria, traced to the PRD) **before** writing implementation code. One test
  per acceptance criterion is the baseline.
- **Tag every acceptance test with the task id** (in the test name, the file name, or a
  comment) so it's discoverable — e.g. `describe('WND-03: sends a T-24h reminder', …)`.
  The quality gate fails the commit if no test references the task id.
- A task is **complete only when those tests pass**. Never weaken or delete a test to go
  green — fix the implementation.
- **No commit before the gate is green.** Run `.claude/scripts/quality-gate.sh <TASK-ID>`;
  it verifies the acceptance tests exist *and* the whole suite passes. Only then commit.

### Definition of Done (a task is only done when all are true)
- [ ] Spec-derived **acceptance tests exist**, one per acceptance criterion, tagged with the task id.
- [ ] Implements every acceptance criterion of its backlog task.
- [ ] `.claude/scripts/quality-gate.sh <TASK-ID>` passes: acceptance tests present **and**
      `lint`, `typecheck`, `test` all green locally.
- [ ] Committed (only after the gate is green) on a correctly-named branch with a Conventional Commit message.
- [ ] A pull request to `develop` is open, using the PR template, fully filled in.
- [ ] A fresh-context review (`spec-reviewer` agent) confirmed each acceptance criterion is
      covered by a passing test and found no blocking gaps.

---

## TIER 2 — THE SPEC-DRIVEN LOOP

Run the chain end-to-end with `/spec-flow`, or step through it manually:

| Step | Command / Skill | Input → Output |
|------|-----------------|----------------|
| 1. Define the spec | `product-requirements` *(existing skill)* | idea → `docs/{feature}-prd.md` |
| 2. Decompose to backlog | `/spec-backlog` | PRD → `docs/backlog/{feature}.md` (tasks w/ ids, AC, **acceptance-test plan**, deps) |
| 3. Execute a task | `/task-execute <task-id>` | task → branch + **acceptance tests (from spec, written first)** + implementation + green gate + commit |
| 4. Ship it | `/ship-pr` | commit + PR to `develop` (template, linked task, test status) |
| 5. Review | `spec-reviewer` *(agent)* + `engineering:code-review` *(existing skill)* | diff → criterion-by-criterion test coverage + findings |

**Step 3 is test-first.** Inside `/task-execute`: read the task's acceptance criteria →
write a failing acceptance test for each (tagged with the task id) → implement until they
pass → run `.claude/scripts/quality-gate.sh <task-id>` → commit. The gate blocks the commit
if the acceptance tests are missing or red.

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
- **Acceptance tests come from the spec and are written first** (see Tier 1). Each task's
  acceptance criteria become tests, tagged with the task id so the gate can find them.
- The workflow is **stack-agnostic**: the quality gate calls whatever `lint`, `typecheck`,
  `test`, and `build` scripts your `package.json` defines (missing ones are skipped). For
  non-Node stacks, expose those entry points however your toolchain prefers and point the
  gate at them. Adapt this section to your project's actual stack and commands.
- The gate's **acceptance check is stack-agnostic too**: it greps your test files for the
  task id. If your tests live outside the defaults, set `ACCEPTANCE_DIRS` / `ACCEPTANCE_GLOBS`
  (see the top of `.claude/scripts/quality-gate.sh`).
- New behaviour ships with tests. Bug fixes ship with a regression test reproducing the bug.
- Never weaken or delete a test to make it pass; fix the code.

### Context discipline
- Keep this file lean. Domain-specific rules go in a referenced doc, not inlined here.
- Clear/compact context between unrelated tasks. Don't let one session accumulate the
  state of three features.

---

## Model allocation (cost vs. quality)
- Orchestration, planning, and review → strong model (Opus).
- Scoped implementation in subagents → `CLAUDE_CODE_SUBAGENT_MODEL` (Sonnet) for focused work.
- Keep judgment calls on the strong model; push mechanical fan-out down.
