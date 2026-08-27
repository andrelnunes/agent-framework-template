# Backlog: CI pnpm version resolution
PRD: n/a — framework maintenance; the CI workflow is the spec.
Generated: 2026-08-27

## Execution plan
- Sequential: AFT-302 (single task)

## Tasks

### AFT-302 — CI must not pin a pnpm version against packageManager
- **Status:** in-review
- **Branch:** fix/pnpm-action-setup-version
- **Depends on:** none
- **Can parallelize with:** none
- **Description:** `pr-validation.yml` pinned `pnpm/action-setup` to `version: 9`. When the
  target repo's `package.json` also carries a `packageManager` field — which every modern
  pnpm scaffold writes, and which corepack requires — the action fails hard with "Multiple
  versions of pnpm specified" before installing anything. The whole `validate` job dies, so
  a correct PR is rejected for a reason that has nothing to do with its changes.
- **Acceptance criteria:**
  - [x] A repo whose `package.json` declares `packageManager: pnpm@x` installs and validates
        in CI, with the version taken from that field
  - [x] A pnpm repo with no `packageManager` field still gets a working pnpm (pinned fallback)
  - [x] npm and yarn repos are unaffected
  - [x] The workflow YAML still parses
- **Acceptance tests:**
  - [x] `AFT-302: the workflow lets packageManager decide the pnpm version` — unit — parses
        the workflow and fails if a literal version is ever re-pinned on the setup step, or if
        either branch of the pm step's output disappears
  - [x] `AFT-302: the version predicate branches on the packageManager field` — unit — runs the
        exact `node -e` predicate the workflow uses against both shapes of `package.json`
  - Note: the first PR for this task claimed a CI-config change "cannot be unit tested" and was
        correctly rejected by the acceptance gate. It can be tested; the claim was wrong.
- **Contracts:** the `pm` detection step gains a `pnpm_version` output, empty when
  `packageManager` is present.
- **Touches:** .github/workflows/pr-validation.yml
- **Test notes:** `npx js-yaml .github/workflows/pr-validation.yml` to confirm it parses.
