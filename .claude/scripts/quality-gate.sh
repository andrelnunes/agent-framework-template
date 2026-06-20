#!/usr/bin/env bash
# Local quality gate: lint -> typecheck -> test (-> build, optional).
# Mirrors the checks the GitHub Actions PR workflow runs, so "green locally" means
# "green in CI". Run before every commit and before opening a PR.
#
#   .claude/scripts/quality-gate.sh          # lint + typecheck + test
#   .claude/scripts/quality-gate.sh --build  # also run build
#
# Stack specifics live in package.json scripts (lint, typecheck, test, build), so this
# script is stack-agnostic. The package manager is auto-detected from the lockfile.
set -uo pipefail

RUN_BUILD=false
[ "${1:-}" = "--build" ] && RUN_BUILD=true

# --- detect package manager ----------------------------------------------
if [ -f pnpm-lock.yaml ]; then PM="pnpm"; RUN="pnpm";
elif [ -f yarn.lock ]; then PM="yarn"; RUN="yarn";
else PM="npm"; RUN="npm run"; fi
echo "▸ package manager: $PM"

fail=0
gate() {
  # $1 = label, $2 = npm script name
  local label="$1" script="$2"
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
  exit 1
fi
echo "✓ Quality gate passed."
exit 0
