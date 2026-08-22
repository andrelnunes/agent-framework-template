---
name: ship-pr
description: Push the current feat/* branch and open a pull request to develop with a complete, standards-compliant description linked to its backlog task. Triggers on "/ship-pr", "open a PR", "ship this". Runs the quality gate first and uses the repo PR template.
argument-hint: [task-id]   (inferred from the branch/commit if omitted)
allowed-tools: Read, Bash, Grep, Glob
---

# Ship PR

Open a pull request that a reviewer can approve with confidence. Target is **always
`develop`** — never `main`.

## Preconditions
- `HEAD` is on a `feat/*` / `fix/*` / `chore/*` branch (not `main`/`develop`).
- The work is committed. If there are uncommitted changes, stop and commit them first
  (via `/task-execute`'s commit step) — don't bundle unrelated changes.

## Procedure
1. **Resolve the task id** from `$ARGUMENTS`, the branch name, or the commit's `Refs:` line.
   Read the matching task in `docs/backlog/{feature}.md` for title and acceptance criteria.

2. **Re-run the gate WITH the task id** to guarantee CI parity and confirm the acceptance
   tests exist and pass:
   ```bash
   .claude/scripts/quality-gate.sh <task-id>
   ```
   If it fails — including "no test references the task id" — **do not open the PR**. Go back
   to `/task-execute` and write/fix the acceptance tests first.

3. **Push the branch:**
   ```bash
   git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
   ```
   (Pushing a `feat/*` branch is allowed; pushing `main`/`develop` is blocked by the guard.)

4. **Compose the PR body** by filling **every** section of
   `.github/pull_request_template.md` — Summary, Linked PRD/Task, Changes, How to test,
   Acceptance criteria, Risks/Rollback, Checklist. **Map each acceptance criterion to the
   acceptance test that proves it** (file + test name). An empty or templated-but-unfilled
   section will fail the CI `pr-description-check`.
   Before composing, verify two DoD items and state them in the body: **no out-of-scope
   changes** (every hunk traces to a criterion or explicit request) and **spec in sync**
   (backlog/PRD updated if implementation deviated). If either fails, go back to
   `/task-execute` first.

5. **Open the PR to `develop`:**
   ```bash
   gh pr create --base develop \
     --head "$(git rev-parse --abbrev-ref HEAD)" \
     --title "feat(<scope>): <subject>" \
     --body-file <filled-template>
   ```
   If `gh` is unavailable, print the title + body and the compare URL for the user to open it.
   **Opening the PR is the user's call to confirm** — present the title and body and get a
   go-ahead before creating it.

6. **Update the backlog:** set the task Status to `in-review` and paste the PR URL under it.

7. **Trigger review:** hand the branch to the **`spec-reviewer`** agent (and the CI will run
   `pr-validation.yml` automatically on the PR).

## Note
This skill never merges. Merges to `develop` (and later `develop`→`main`) happen through
GitHub after review + green checks, per branch-protection rules.
