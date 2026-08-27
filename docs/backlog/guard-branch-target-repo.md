# Backlog: Branch guard correctness
PRD: n/a — framework maintenance; CLAUDE.md's branch model is the spec.
Generated: 2026-08-27

## Execution plan
- Sequential: AFT-301 (single task)

## Tasks

### AFT-301 — The branch guard must judge the repo the command targets
- **Status:** in-review
- **Branch:** fix/guard-branch-target-repo
- **Depends on:** none
- **Can parallelize with:** none
- **Description:** Two defects, found while running the kit from one repo against another.
  (1) `guard-branch.sh` read `HEAD` from the *hook's* working directory, so it judged the
  session's own repo rather than the one being committed to — blocking legal commits when
  the session repo sat on `develop`, and waving through a commit on a protected branch of
  the target repo whenever the session repo sat on a feature branch. (2) The command matcher
  tested for the literal substring `git commit`, so `git -C <path> commit` — the ordinary way
  to act on another repo, and what a subagent naturally writes — bypassed the guard entirely,
  with no branch check at all.
- **Acceptance criteria:**
  - [x] A commit on a protected branch of the **target** repo is denied, whatever branch the
        hook's own repo is on
  - [x] `git -C <path> commit` resolves and judges `<path>`, and is no longer a bypass
  - [x] A `cd <path> && git commit` prefix resolves and judges `<path>`
  - [x] The event's `cwd` is used when the command names no path
  - [x] A commit on a feature branch of the target repo is still allowed
  - [x] A push aimed at `main`/`master`/`develop` is denied regardless of current branch
- **Acceptance tests:**
  - [x] `AFT-301: branch guard reads the branch of the repo the command targets` —
        integration — builds a throwaway git repo on `develop`, then asserts each case above
        against it. Replaces the previous version of this test, which read the *real* repo's
        HEAD and therefore passed on a feature branch and failed on `develop` — a latent
        failure CI could never catch, since PR checkouts are detached-HEAD.
- **Contracts:** the hook's decision protocol is unchanged (deny JSON on stdout, exit 0).
  Resolution precedence is now: `git -C <path>` → leading `cd <path>` → event `cwd` → the
  hook's own cwd.
- **Touches:** .claude/scripts/guard-branch.sh, tests/framework.test.js
- **Test notes:** `npm test`. Note that a test asserting a push to a protected branch must
  not contain that command as a literal in a shell heredoc — the guard will block the write.
- **Known gap:** other git global flags before the subcommand (`--no-pager`, `--git-dir=`)
  are not normalised. `-C` was fixed because it is the one agents actually use; the rest is
  logged here rather than silently assumed handled.
