# Migrating agent-framework-template → v2 (spec-driven + worktrees)

> **Status: applied in this repository (v2.0.0).** This document is now both (1) a record of
> *what the v1→v2 refactor changed here*, and (2) a guide for anyone migrating an **existing
> v1 project** (one with a `.agent-framework/` + `STATUS.md`) onto v2. Starting fresh? Skip
> this file — just run the installer.

The thesis: **replace soft file-reservation coordination with worktree isolation, and
replace prose-protocols with enforced hooks + CI.** Keep the parts that worked (backlog
generation, conventional commits, the quality bar) and delete the parts that were fragile
(the reservation engine).

## Migrating an existing v1 project (quick path)
1. From the v1 project root: `npx agent-framework-template . --compat`
   (copies `CLAUDE.md`, `.claude/`, `.github/`, `docs/`; creates `develop`; never clobbers your code).
2. Convert any `backlog.md` into `docs/backlog/{feature}.md` using the v2 schema
   (see `examples/whatsapp-no-show-backlog.md`).
3. Delete the retired reservation subsystem: `.agent-framework/core/STATUS.md`, the
   reservation parts of `PLAYBOOK.md`, and the old `pre-commit` reservation checks.
4. `chmod +x .claude/scripts/*.sh`, push `develop`, enable branch protection, open the first PR.

---

## 1. Delete — the reservation subsystem

These exist to coordinate agents editing the same checkout. With one worktree per agent, they
have no job:

- `.agent-framework/core/STATUS.md` (reservations, heartbeats, coordination requests) — **gone**
- `hooks/pre-commit.template` checks **#1, #2, #5** (STATUS/reservation compliance) — **removed**
- The reservation choreography in `platform-configs/claude-code-setup.md`
  ("Reserve files immediately", "Update heartbeat every 2 hours", "Release files when done") — **gone**
- `init.js` prompts and generation for multi-agent reservation mode — **removed**

## 2. Keep — the good bones (rework lightly)

- **Backlog generation (`init.js` Tier 1–3).** Your PRD → epics → tasks logic is the best part.
  Keep it; change only the **output target** to `docs/backlog/{feature}.md` in the v2 schema
  (task id, acceptance criteria, `Depends on`, `Can parallelize with`, `Touches`, `Branch`).
- **`RULES.md`.** Fold into `CLAUDE.md` (Tier 3 — Quality Standards). One source of truth.
- **`CHANGELOG.md`** + the CHANGELOG-on-user-facing-change nudge — keep as a release-PR step.
- **pre-commit checks #3 (conventional commits), #4 (forbidden files), #7 (no commit to main).**
  Keep — but they now live as **Claude Code hooks** (which actually block) *and* a server-side
  **GitHub branch protection + CI**, so enforcement no longer depends on the agent cooperating.

## 3. Add — the v2 layer (the kit)

Drop the spec-kit into the repo root:

```
CLAUDE.md                          # constitution (absorbs RULES.md)
.claude/
  settings.json                    # hooks: branch guard + auto-format
  scripts/guard-branch.sh          # blocks commit/push on main & develop  (replaces pre-commit #7, hardened)
  scripts/quality-gate.sh          # lint→typecheck→test (CI parity)
  scripts/worktree.sh              # one worktree per task  ← the new parallelism primitive
  agents/feature-implementer.md    # runs one task in its own worktree
  agents/spec-reviewer.md          # fresh-context review vs. acceptance criteria
  skills/spec-backlog/             # PRD → backlog (or keep init.js; see §5)
  skills/task-execute/             # branch+implement+gate+commit
  skills/ship-pr/                  # PR → develop, template enforced
  skills/spec-flow/                # orchestrates the whole loop across worktrees
.github/
  pull_request_template.md         # required PR description pattern
  workflows/pr-validation.yml      # branch-name + PR-desc + lint/types/test/build on PRs to develop
docs/backlog/                      # backlog files land here
```

## 4. The new parallel-execution loop (worktrees, not locks)

```
/spec-flow "<idea>"            # PRD → backlog (parallel-set analysis baked in)
# for the parallel set the backlog identifies (disjoint "Touches:"), per task:
.claude/scripts/worktree.sh new WND-01      # isolated checkout on feat/wnd-01 from develop
.claude/scripts/worktree.sh new WND-03      # isolated checkout on feat/wnd-03 from develop
#   → spawn one feature-implementer agent per worktree (each cd'd into its own dir)
#   → each runs the quality gate, commits, and /ship-pr opens a PR to develop
.claude/scripts/worktree.sh rm WND-01 --branch   # after the PR merges
```

Tasks whose `Touches:` overlap run **sequentially** (same worktree, one after another) — the
backlog flags this so agents don't fan out into a guaranteed merge conflict.

## 5. `init.js` — what we did (Option B + compat)

**Decision applied: Option B.** `init.js` was rewritten from the ~60KB interactive
reservation wizard into a **thin, dependency-free scaffolder** (no `inquirer`/`chalk`/`ora`).
It copies `CLAUDE.md`, `.claude/`, `.github/`, `docs/` into any target (new or existing),
makes scripts executable, seeds `package.json` gate scripts, and creates `develop`. Backlog
*generation* now lives in the `/spec-backlog` skill, where the loop runs.

Cross-platform reach (the Option A upside) is preserved by a **compat layer**: `--compat`
drops `AGENTS.md` + `.cursorrules` so Cursor / Codex / Copilot follow the same rules. Native
enforcement (hooks/CI/skills) for Claude Code; a markdown mirror for everyone else.

## 6. Server-side enforcement (one-time, GitHub UI — you do this, not me)

Hooks stop a *local* bad commit; branch protection is what enforces it on the remote. Under
**Settings → Branches**: protect `main` (PR-only, from `develop`, required checks
`branch-name`/`pr-description-check`/`validate`, no force-push) and `develop` (PR-only, same
checks). Details in the kit README.

---

### What was applied in this repo (v2.0.0)
- ✅ Promoted the kit to the repo root (`CLAUDE.md`, `.claude/`, `.github/`, `docs/`).
- ✅ Deleted the reservation subsystem and stale v1 artifacts (`hooks/pre-commit.template`,
  `platform-configs/` reservation choreography, `templates/`, v1 build-notes).
- ✅ Rewrote `init.js` as the slim v2 scaffolder (§5); bumped `package.json` to 2.0.0,
  dropped the `inquirer`/`chalk`/`ora` dependencies.
- ✅ Added the Cursor/Codex compat layer (`AGENTS.md`, `.cursorrules` via `--compat`).
- ✅ Replaced the v1 example JSON configs with worked PRD + backlog examples (`examples/`).
- ✅ Rewrote `README.md` for the v2 spec-driven flow.

### Still your call (one-time, GitHub UI)
Enable branch protection on `main` and `develop` per §6 — hooks block *local* bad commits,
but only branch protection enforces the rules on the remote.
