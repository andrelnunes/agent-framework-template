#!/usr/bin/env bash
# Local quality gate: acceptance-test check -> lint -> typecheck -> test (-> build).
# Mirrors the checks the GitHub Actions PR workflow runs, so "green locally" means
# "green in CI". Run before EVERY commit and before opening a PR.
#
#   .claude/scripts/quality-gate.sh <TASK-ID>          # full gate for a task (acceptance check + lint/types/test)
#   .claude/scripts/quality-gate.sh <TASK-ID> --build  # also run build
#   .claude/scripts/quality-gate.sh --build            # gate without a task id (acceptance check skipped w/ warning)
#
# Acceptance-test policy (the headline rule of this framework):
#   A task is only "done" — and only committable — once acceptance tests derived from its
#   spec (PRD / backlog acceptance criteria) EXIST and PASS. This gate enforces that an
#   acceptance test referencing the task id is present in the test suite, then runs the suite.
#   Tag your acceptance tests with the task id so they're discoverable, e.g.:
#       describe('WND-03: sends a T-24h reminder', ...)         // or in the file name / a comment
#   Override the discovery globs/markers with env vars if your layout differs:
#       ACCEPTANCE_GLOBS, ACCEPTANCE_DIRS (see below).
#
# Stack specifics live in package.json scripts (lint, typecheck, test, build), so this
# script is stack-agnostic. The package manager is auto-detected from the lockfile.
set -uo pipefail

# --- parse args -----------------------------------------------------------
RUN_BUILD=false
TASK_ID=""
for arg in "$@"; do
  case "$arg" in
    --build) RUN_BUILD=true ;;
    --*) : ;; # ignore unknown flags
    *) [ -z "$TASK_ID" ] && TASK_ID="$arg" ;;
  esac
done

# --- detect package manager ----------------------------------------------
if [ -f pnpm-lock.yaml ]; then PM="pnpm"; RUN="pnpm";
elif [ -f yarn.lock ]; then PM="yarn"; RUN="yarn";
else PM="npm"; RUN="npm run"; fi
echo "▸ package manager: $PM"

fail=0

# --- 1. acceptance-test gate ---------------------------------------------
# Find where tests live and confirm at least one references the task id.
# Where to look for acceptance tests.
#
# UNSET (the default) means "search the whole tree", not "search this fixed list". The old
# default was a list of directory names, and the gate used whichever of them happened to
# exist — so the day a repo grew a root-level `e2e/`, the search silently narrowed to it and
# stopped seeing tests under `apps/` and `packages/`. The gate then reported "no test
# references TASK-ID" for tests that existed, and — worse — matched a task id that appeared
# in a comment inside the one directory it still looked at, reporting coverage it had never
# verified.
#
# Set ACCEPTANCE_DIRS explicitly only to narrow the search on purpose.
ACCEPTANCE_DIRS="${ACCEPTANCE_DIRS:-}"
# Os globs são propositadamente largos, mas `*Test.*` é insensível a maiúsculas e casa com
# nomes como `turbo-test.log`. Um log de build contém os nomes dos testes — e portanto os ids
# das tarefas — por isso um artefacto podia satisfazer o portão sozinho. Caches e saídas de
# build ficam de fora da varredura, e ficheiros .log nunca contam como teste.
ACCEPTANCE_GLOBS="${ACCEPTANCE_GLOBS:-*.test.* *.spec.* *_test.* test_*.* *Test.* *.feature}"

acceptance_gate() {
  if [ -z "$TASK_ID" ]; then
    echo "! Acceptance gate: no TASK-ID passed — cannot verify spec coverage."
    echo "  Run: .claude/scripts/quality-gate.sh <TASK-ID>   (e.g. WND-03)"
    echo "  Skipping the existence check, but commits SHOULD reference a task with acceptance tests."
    return 0
  fi

  echo "▸ Acceptance gate for $TASK_ID …"

  # Build a list of candidate test files. With no explicit ACCEPTANCE_DIRS, search the whole
  # tree: a partial match on a fixed list of directory names is how the search silently
  # narrows. Named directories that do not exist are reported, not ignored — a typo in
  # ACCEPTANCE_DIRS should be loud, not a quietly emptier search.
  local search_paths=()
  if [ -n "$ACCEPTANCE_DIRS" ]; then
    for d in $ACCEPTANCE_DIRS; do
      if [ -d "$d" ]; then
        search_paths+=("$d")
      else
        echo "  ! ACCEPTANCE_DIRS names '$d', which does not exist — ignoring it"
      fi
    done
  fi
  if [ "${#search_paths[@]}" -eq 0 ]; then search_paths=("."); fi

  # Collect test files matching common test globs.
  local -a globargs=()
  for g in $ACCEPTANCE_GLOBS; do globargs+=(-iname "$g" -o); done
  # drop the trailing -o
  unset 'globargs[${#globargs[@]}-1]'

  local matches
  matches="$(find "${search_paths[@]}" -type f \( "${globargs[@]}" \) \
              -not -path '*/node_modules/*' -not -path '*/.next/*' \
              -not -path '*/dist/*' -not -path '*/.git/*' \
              -not -path '*/.turbo/*' -not -path '*/coverage/*' \
              -not -path '*/build/*' -not -path '*/out/*' \
              -not -name '*.log' 2>/dev/null \
            | xargs grep -l -- "$TASK_ID" 2>/dev/null || true)"

  if [ -z "$matches" ]; then
    echo "✗ Acceptance gate FAILED: no test references task '$TASK_ID'."
    echo "  Write acceptance tests derived from the task's acceptance criteria FIRST,"
    echo "  tag them with the task id (in the test name, file name, or a comment), then re-run."
    echo "  This is the rule: a task is not done — and not committable — until its"
    echo "  spec-derived acceptance tests exist and pass."
    fail=1
    return 1
  fi

  echo "✓ Acceptance tests found for $TASK_ID:"
  echo "$matches" | sed 's/^/    /'
  return 0
}

acceptance_gate

# --- 2. lint / typecheck / test / build ----------------------------------
gate() {
  # $1 = label, $2 = npm script name
  local label="$1" script="$2"
  if [ ! -f package.json ]; then
    echo "• $label skipped (no package.json)"
    return 0
  fi
  if node -e "process.exit(require('./package.json').scripts?.['$script']?0:1)" 2>/dev/null; then
    echo "▸ $label ($script)…"
    if [ "$PM" = "npm" ]; then npm run "$script"; else $RUN "$script"; fi
    if [ $? -ne 0 ]; then echo "✗ $label FAILED"; fail=1; else echo "✓ $label passed"; fi
  else
    echo "• $label skipped (no '$script' script in package.json)"
  fi
}

gate "Lint"      "lint"
gate "Typecheck" "typecheck"
gate "Tests"     "test"
$RUN_BUILD && gate "Build" "build"

echo "---------------------------------------"
if [ "$fail" -ne 0 ]; then
  echo "✗ Quality gate FAILED. Fix the issues above before committing or opening a PR."
  echo "  Remember: spec-derived acceptance tests must EXIST and PASS before a task is done."
  exit 1
fi
echo "✓ Quality gate passed — acceptance tests present and the suite is green."
exit 0
