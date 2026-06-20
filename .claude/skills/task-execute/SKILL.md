---
name: task-execute
description: Execute one backlog task — create its feat/* branch from develop, implement against the acceptance criteria, run the quality gate, and commit. Triggers on "/task-execute <id>", "work on task <id>", "implement <id>". Updates task status in the backlog file.
argument-hint: <task-id>   e.g. WND-03
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Task Execute

Take a single backlog task from `todo` to a committed branch ready to ship. `$ARGUMENTS` is
the task id. If absent, list `todo` tasks from the backlog and ask which to run.

## Preconditions (verify first)
- A backlog entry for `$ARGUMENTS` exists in `docs/backlog/{feature}.md`.
- Its dependencies are `done`. If not, stop and say which dependency blocks it.

## Procedure
1. **Mark in-progress.** Set the task's Status to `in-progress` in the backlog file.

2. **Branch from develop.**
   ```bash
   git switch develop && git pull --ff-only
   git switch -c <branch-from-the-task>      # the Branch: field of the task
   ```
   (The `PreToolUse` branch guard blocks commits on `main`/`develop`, so you must branch.)

3. **Plan briefly**, then **implement** strictly within the task scope. Read neighbouring
   files to match conventions. Cover every acceptance criterion with code **and** tests.

4. **Quality gate.**
   ```bash
   .claude/scripts/quality-gate.sh
   ```
   Must pass. Fix code, never tests.

5. **Commit** (Conventional Commit, referencing the id):
   ```bash
   git add -A
   git commit -m "feat(<scope>): <subject>" -m "<what & why>" -m "Refs: $ARGUMENTS"
   ```

6. **Update status** to `in-review` and check off the acceptance criteria you've met in the
   backlog file.

7. **Hand off to `/ship-pr`** to push and open the pull request. Do not push to a protected
   branch; the guard will block it anyway.

## Parallelizing
For several independent tasks, don't loop here — spawn one **`feature-implementer`** subagent
per task (pass each the id, backlog path, PRD path, and acceptance criteria), then collect
their branches and ship each with `/ship-pr`. Tasks that share files in their **Touches:**
list must run sequentially.
