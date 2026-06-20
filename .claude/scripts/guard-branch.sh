#!/usr/bin/env bash
# PreToolUse hook: blocks git commit / git push when HEAD is on a protected branch
# (main, develop), and blocks any push that targets main/develop directly.
#
# Reads the Claude Code PreToolUse JSON event on stdin, inspects the Bash command,
# and emits a permission decision. Wired in .claude/settings.json under PreToolUse → Bash.
#
# Decision protocol: print hookSpecificOutput JSON and exit 0.
#   permissionDecision "deny"  -> tool call is blocked, reason shown to Claude
#   (no output / exit 0)        -> allowed
set -euo pipefail

PROTECTED_REGEX='^(main|master|develop)$'

# --- read the event -------------------------------------------------------
INPUT="$(cat)"

# Extract the command from .tool_input.command. Prefer python3; fall back to grep.
if command -v python3 >/dev/null 2>&1; then
  CMD="$(printf '%s' "$INPUT" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)"
else
  CMD="$INPUT"
fi

# Only care about git commit / git push.
case "$CMD" in
  *"git commit"*|*"git push"*) : ;;
  *) exit 0 ;;   # not a protected operation, allow
esac

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"

deny() {
  # $1 = reason
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":%s}}\n' \
    "$(printf '%s' "$1" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '"%s"' "$1")"
  exit 0
}

# Block commits made while sitting on a protected branch.
if printf '%s' "$CMD" | grep -q 'git commit'; then
  if printf '%s' "$CURRENT_BRANCH" | grep -Eq "$PROTECTED_REGEX"; then
    deny "Blocked: you are on protected branch '$CURRENT_BRANCH'. Create a feat/* branch from develop before committing. Run: git switch develop && git pull && git switch -c feat/<feature-name>"
  fi
fi

# Block pushes to protected branches (explicit refspec or current branch protected).
if printf '%s' "$CMD" | grep -q 'git push'; then
  if printf '%s' "$CMD" | grep -Eq 'origin (main|master|develop)\b'; then
    deny "Blocked: direct push to a protected branch. main and develop only update via a reviewed pull request."
  fi
  if printf '%s' "$CURRENT_BRANCH" | grep -Eq "$PROTECTED_REGEX"; then
    deny "Blocked: pushing from protected branch '$CURRENT_BRANCH'. Push your feat/* branch instead and open a PR to develop."
  fi
fi

exit 0
