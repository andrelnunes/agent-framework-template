# Agent Framework — Spec-Driven Engineering Kit (v2)

A drop-in configuration that makes a repository **govern its own workflow** when AI agents
(Claude Code, Cursor, OpenAI Codex) work on it. Every change flows the same way:

> **PRD → backlog task → `feat/*` branch → implement → quality gate → pull request → review**

…with the branch model and quality bar **enforced by git hooks and CI**, not left to an
agent's memory. Parallelism comes from **git worktrees** (one isolated checkout per task),
not from soft file-locks.

Works in a **brand-new project** and in an **existing codebase** alike.

## 👨‍💻 Author

**Built by [André Nunes](https://github.com/andrelnunes) | [Tekverso](https://tekverso.com)**
Software architect and AI automation specialist.
[LinkedIn](https://www.linkedin.com/in/andrelnunes/) · [GitHub](https://github.com/andrelnunes) · [Instagram](https://instagram.com/andrenunes.tech)

---

## Why v2 (what changed from v1)

v1 coordinated agents with a **file-reservation system** — soft locks in a `STATUS.md`,
4-hour leases, heartbeats. It only worked if every agent cooperated, and it was fragile.

v2 replaces *coordination by convention* with *coordination by construction*:

| v1 (removed) | v2 (this kit) |
|---|---|
| File reservations in `STATUS.md`, heartbeats, leases | **Git worktrees** — one real checkout per task, zero shared state |
| Prose "Pre-Task / Post-Task checklists" | **Enforced hooks** (branch guard) + **CI** (PR validation) |
| `RULES.md`, `PLAYBOOK.md`, `CHANGELOG.md` scattered | One **`CLAUDE.md`** constitution + Claude Code skills |
| "Remember to follow the protocol" | The protocol is a `/spec-flow` command and a blocking hook |

> Migrating an existing v1 project? See **[MIGRATION.md](MIGRATION.md)**.

---

## What gets installed

```
your-repo/
├── CLAUDE.md                         # the constitution — branch rules, the loop, Definition of Done
├── .claude/
│   ├── settings.json                 # hooks: branch guard (PreToolUse) + auto-format (PostToolUse)
│   ├── scripts/
│   │   ├── guard-branch.sh           # blocks commits/pushes on main & develop
│   │   ├── quality-gate.sh           # lint → typecheck → test (CI parity, run before commit)
│   │   └── worktree.sh               # one isolated git worktree per task (parallel execution)
│   ├── agents/
│   │   ├── feature-implementer.md    # executes one task on its own feat/* branch (parallelizable)
│   │   └── spec-reviewer.md          # fresh-context review vs. acceptance criteria
│   └── skills/
│       ├── spec-backlog/             # PRD → executable backlog          (/spec-backlog)
│       ├── task-execute/             # task → branch + implement + gate  (/task-execute)
│       ├── ship-pr/                  # commit → PR to develop (template) (/ship-pr)
│       └── spec-flow/                # orchestrates the whole chain       (/spec-flow)
├── .github/
│   ├── pull_request_template.md      # required PR description pattern
│   ├── CODEOWNERS                    # review required on .claude/ & .github/
│   └── workflows/pr-validation.yml   # CI: branch name + PR desc + lint/types/test/build
├── docs/
│   ├── {feature}-prd.md              # PRDs land here
│   └── backlog/{feature}.md          # backlog files land here (the source of truth)
└── AGENTS.md, .cursorrules           # (optional) Cursor / Codex / Copilot compat layer
```

---

## Install

### Option A — one command (recommended)

```bash
# into the current directory (new or existing project):
npx agent-framework-template

# or into a specific path:
npx agent-framework-template ./my-project --compat

# from a local clone:
node /path/to/agent-framework-template/init.js ./my-project --compat
```

The installer is **dependency-free** (Node 18+). It:
- copies `CLAUDE.md`, `.claude/`, `.github/`, `docs/` into the target,
- makes the scripts executable,
- adds placeholder `lint`/`typecheck`/`test` scripts to `package.json` if missing (so the
  gates have something to run — replace them with real ones),
- creates the `develop` branch (skip with `--no-git`),
- never overwrites your existing files unless you pass `--force`,
- optionally drops the Cursor/Codex compat layer with `--compat`.

Useful flags: `--dry-run` (preview), `--yes` (non-interactive), `--force`, `--no-git`,
`--help`.

### Option B — copy manually

1. Copy `CLAUDE.md`, `.claude/`, `.github/`, and `docs/` into your repo root.
2. `chmod +x .claude/scripts/*.sh`
3. Create the branches once: `git switch -c develop && git push -u origin develop`.

Either way, define real scripts in `package.json` so the gates do real work
(any missing script is simply skipped):

```json
{ "scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit", "test": "vitest run", "build": "tsc -b" } }
```

---

## Server-side enforcement (one-time, in the GitHub UI)

Hooks stop a *local* bad commit; **branch protection** is what enforces the rules on the
remote. Under **Settings → Branches → Add rule** (or Rulesets):

**`main`**
- Require a pull request before merging · require approvals (≥1) · require Code Owner review
- Require status checks: `branch-name`, `pr-description-check`, `validate`
- No force-push, no deletion · (optional) only allow PRs into `main` from `develop`

**`develop`**
- Require a pull request before merging · require approvals (≥1)
- Require the same status checks · no direct pushes

That closes the loop: agents work only on `feat/*`, every change reaches `develop` then
`main` through a reviewed PR with green checks.

---

## Daily use (Claude Code)

```text
/spec-flow  "<feature idea>"     # idea → PRD → backlog → execution → PRs (pauses at human gates)
```

Or step through it:

```text
product-requirements             # → docs/{feature}-prd.md   (PRD skill)
/spec-backlog  <feature>         # → docs/backlog/{feature}.md  (tasks w/ ids, AC, deps)
/task-execute  WND-03            # branch from develop + implement + quality gate + commit
/ship-pr       WND-03            # push + open PR to develop (template filled, task linked)
```

### Parallel work — one worktree per independent task

```bash
.claude/scripts/worktree.sh new  WND-01      # isolated checkout on feat/wnd-01 from develop
.claude/scripts/worktree.sh new  WND-03      # disjoint files → safe to run at the same time
.claude/scripts/worktree.sh list
.claude/scripts/worktree.sh rm   WND-01 --branch   # after its PR merges
```

Tasks whose **`Touches:`** files overlap (flagged in the backlog) run **sequentially** —
that's how v2 avoids merge conflicts without the old reservation system. The orchestrator
spawns one `feature-implementer` subagent per task in the parallel set.

---

## The spec-driven loop

| Step | Command / Skill | Input → Output |
|------|-----------------|----------------|
| 1. Define the spec | `product-requirements` | idea → `docs/{feature}-prd.md` |
| 2. Decompose to backlog | `/spec-backlog` | PRD → `docs/backlog/{feature}.md` (tasks, AC, deps) |
| 3. Execute a task | `/task-execute <id>` | task → branch + implementation + passing gates |
| 4. Ship it | `/ship-pr <id>` | commit + PR to `develop` (template, linked task) |
| 5. Review | `spec-reviewer` agent + `engineering:code-review` | diff → findings |

**Definition of Done** (from `CLAUDE.md`): every acceptance criterion met · `lint`/`typecheck`/`test`
green locally · Conventional Commit on a correctly-named branch · PR to `develop` with the
template filled · a fresh-context review found no blocking gaps.

---

## Other tools — Cursor, OpenAI Codex, Copilot

Install with `--compat` to get a plain-markdown mirror of the rules:

- **`AGENTS.md`** — the cross-tool rule set (the loop, hard rules, Definition of Done).
- **`.cursorrules`** — point Cursor at it; it enforces the same branch model and gates.
- **Codex / Copilot** — paste the "Hard rules" + "Definition of Done" from `AGENTS.md` into
  your custom instructions.

The enforcement layer (blocking hooks, CI) is shared regardless of which agent edits the
code, because it lives in git and GitHub — not in any one tool.

---

## Customization

- **Branch names, commit format, Definition of Done** → edit `CLAUDE.md` (one source of truth).
- **What the quality gate runs** → it calls your `package.json` scripts; change those.
- **Protected branches / regex** → `PROTECTED_REGEX` in `.claude/scripts/guard-branch.sh`
  and the checks in `.github/workflows/pr-validation.yml`.
- **PR sections required by CI** → the `required` array in `pr-validation.yml` and the
  headings in `.github/pull_request_template.md` (keep them in sync).
- **Subagent model** → `CLAUDE_CODE_SUBAGENT_MODEL` in `.claude/settings.json`.

---

## Troubleshooting

**"My commit was blocked."** You're on `main` or `develop`. Cut a branch:
`git switch develop && git pull && git switch -c feat/<name>`. That's the branch guard doing
its job — don't bypass it.

**"The quality gate skipped everything."** It only runs scripts that exist in `package.json`.
Add real `lint`/`typecheck`/`test` scripts.

**"CI fails on `pr-description-check`."** Fill *every* section of the PR template and include a
backlog task id (e.g. `WND-03`) in the body.

**"Scripts aren't executable."** `chmod +x .claude/scripts/*.sh`.

---

## License

Business Source License 1.1 — see [LICENSE](LICENSE). Converts to Apache 2.0 on 2029-11-25.
Free for commercial and personal use; you may not offer it as a competing
framework-as-a-service.

---

**Built by [André Nunes](https://github.com/andrelnunes) | [Tekverso](https://tekverso.com)**
**Version:** 2.0.0 · **Platforms:** Claude Code (native) · Cursor · OpenAI Codex · Copilot (compat)

Questions? Open an issue at
[github.com/andrelnunes/agent-framework-template](https://github.com/andrelnunes/agent-framework-template/issues)
