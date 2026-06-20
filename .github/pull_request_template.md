<!--
  PR target MUST be `develop` (never `main`). Title: <type>(<scope>): <subject>
  Every section below is required. The pr-description-check CI job fails the PR
  if a required heading is missing or its body is left empty/unchanged.
-->

## Summary
<!-- What does this PR do and why? 1–3 sentences. State the problem it solves. -->


## Linked PRD / Task
<!-- Required. Link the backlog task id and the PRD. -->
- Task: <!-- e.g. WND-03 -->
- PRD: <!-- e.g. docs/whatsapp-no-show-prd.md -->


## Changes
<!-- Bullet the notable changes. One logical change-set per PR. -->
-


## How to test
<!-- Exact steps / commands a reviewer runs to verify. -->
-


## Acceptance criteria
<!-- Copy the task's acceptance criteria and check off what this PR satisfies. -->
- [ ]


## Risks & rollback
<!-- Known risks, migrations, feature flags, and how to revert if needed. -->


## Checklist
- [ ] Branch is `feat/*` (or `fix/*` / `chore/*`) cut from `develop`, and targets `develop`
- [ ] `lint`, `typecheck`, and `test` pass locally (`.claude/scripts/quality-gate.sh`)
- [ ] New behaviour is covered by tests (bug fixes include a regression test)
- [ ] Conventional Commit messages, no secrets, no dead/commented code
- [ ] Reviewed by the `spec-reviewer` (or a human) against acceptance criteria
