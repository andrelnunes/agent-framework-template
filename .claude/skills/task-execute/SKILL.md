---
name: task-execute
description: Execute one backlog task TEST-FIRST — create its feat/* branch from develop, write spec-derived acceptance tests, implement until they pass, run the quality gate, and commit. Triggers on "/task-execute <id>", "work on task <id>", "implement <id>". Updates task status in the backlog file.
argument-hint: <task-id>   e.g. WND-03
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Task Execute (test-first)

Take a single backlog task from `todo` to a committed branch ready to ship. `$ARGUMENTS` is
the task id. If absent, list `todo` tasks from the backlog and ask which to run.

**The rule:** a task is done — and committable — *only* once its spec-derived acceptance
tests exist and pass. Write the tests before the implementation. The quality gate enforces it.

## Preconditions (verify first)
- A backlog entry for `$ARGUMENTS` exists in `docs/backlog/{feature}.md`.
- Its dependencies are `done`. If not, stop and say which dependency blocks it.

## Procedure
1. **Mark in-progress.** Set the task's Status to `in-progress` in the backlog file.

2. **Sync, then branch from develop.** Never skip the pull — starting from a stale
   `develop` is how merge conflicts and phantom regressions are born.
   ```bash
   git switch develop && git pull --ff-only
   git switch -c <branch-from-the-task>      # the Branch: field of the task
   ```
   (The `PreToolUse` branch guard blocks commits on `main`/`develop`, so you must branch.)

3. **Write the acceptance tests FIRST.** Read the task's acceptance criteria (and the PRD for
   context). For **each** criterion, write a test that asserts it. **Tag every test with the
   task id** so the gate can find it — put `$ARGUMENTS` in the test name, the file name, or a
   leading comment, e.g.:
   ```js
   describe('WND-03: dispatch sends a T-24h reminder and records status', () => { /* … */ });
   ```
   Run them — they should **fail** now (red), proving they test the unbuilt behaviour. If a
   criterion can't be expressed as an automated test, note why in the backlog and add the
   closest verifiable check; don't silently skip it.

4. **Plan briefly**, then **implement** strictly within the task scope until every acceptance
   test goes green. Read neighbouring files to match conventions. Fix the code, never the test.
   **Scope guardrail:** touch only what the task requires — no refactors, renames, or
   "improvements" to working code unless an acceptance criterion demands it. If you discover
   an out-of-scope problem, add it to the backlog as a new task and leave the code alone.

5. **Quality gate — pass the task id** so the acceptance check runs:
   ```bash
   .claude/scripts/quality-gate.sh $ARGUMENTS
   ```
   It fails if no test references `$ARGUMENTS` or if any check is red. Must pass before you commit.

6. **Get commit approval** *(interactive session only — subagents skip this step)*. Present
   the diff for review and **wait for the user's go-ahead before committing**:
   ```bash
   git diff --stat
   ```
   Summarize the key changes (what changed and why, per file group). No approval, no commit.

7. **Commit** (only after the gate is green and — in the interactive session — the user
   approved; Conventional Commit, referencing the id):
   ```bash
   git add -A
   git commit -m "feat(<scope>): <subject>" -m "<what & why>" -m "Refs: $ARGUMENTS"
   ```

8. **Update status & sync the spec.** Set Status to `in-review` and check off the acceptance
   criteria you've met in the backlog file (each should now map to a passing, tagged test).
   If the implementation legitimately deviated from the spec (criterion reworded, behaviour
   adjusted, edge case discovered), **update the backlog task / PRD now** so the spec matches
   what was built — note what changed and why.

9. **Hand off to `/ship-pr`** to push and open the pull request. Do not push to a protected
   branch; the guard will block it anyway.

## Parallelizing
For several independent tasks, don't loop here — spawn one **`feature-implementer`** subagent
per task (pass each the id, backlog path, PRD path, and acceptance criteria), then collect
their branches and ship each with `/ship-pr`. Tasks that share files in their **Touches:**
list must run sequentially.
