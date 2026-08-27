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
#
# Normalise `git -C <path> <subcommand>` to `git <subcommand>` first: matching the literal
# substring "git commit" alone let `git -C /repo commit` through the guard completely,
# unchecked. The path is still read below to resolve which repo is being acted on.
CMD_NORM="$(printf '%s' "$CMD" | sed -E 's/git[[:space:]]+-C[[:space:]]+[^[:space:]]+/git/g')"
case "$CMD_NORM" in
  *"git commit"*|*"git push"*) : ;;
  *) exit 0 ;;   # not a protected operation, allow
esac

# Resolve the branch of the repository the command will actually run in — NOT the hook's
# own working directory. A session started in one repo routinely runs git in another
# (`cd /other/repo && git commit`, `git -C /other/repo commit`), and reading the hook's cwd
# there is wrong in both directions: it blocks legal commits when the session's own repo
# happens to sit on develop, and it waves through a commit on a *protected* branch of the
# target repo whenever the session's repo is on a feature branch.
#
# Precedence: an explicit `git -C <path>`, then a leading `cd <path>`, then the event's cwd,
# then the hook's own cwd.
TARGET_DIR=""
case "$CMD" in
  *"git -C "*)
    TARGET_DIR="$(printf '%s' "$CMD" | sed -n 's/.*git -C \([^ ]*\).*/\1/p' | head -1)" ;;
esac
if [ -z "$TARGET_DIR" ]; then
  case "$CMD" in
    "cd "*)
      TARGET_DIR="$(printf '%s' "$CMD" | sed -n 's/^cd \([^&;|]*\).*/\1/p' | head -1 \
                    | sed 's/[[:space:]]*$//')" ;;
  esac
fi
if [ -z "$TARGET_DIR" ] && command -v python3 >/dev/null 2>&1; then
  TARGET_DIR="$(printf '%s' "$INPUT" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("cwd","") or "")' 2>/dev/null || true)"
fi
# Strip surrounding quotes a command may carry, then fall back to the hook's cwd.
TARGET_DIR="$(printf '%s' "$TARGET_DIR" | sed 's/^["'"'"']//; s/["'"'"']$//')"
[ -d "$TARGET_DIR" ] || TARGET_DIR="."

CURRENT_BRANCH="$(git -C "$TARGET_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"

deny() {
  # $1 = reason
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":%s}}\n' \
    "$(printf '%s' "$1" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '"%s"' "$1")"
  exit 0
}

# Block commits made while sitting on a protected branch.
if printf '%s' "$CMD_NORM" | grep -q 'git commit'; then
  if printf '%s' "$CURRENT_BRANCH" | grep -Eq "$PROTECTED_REGEX"; then
    deny "Blocked: you are on protected branch '$CURRENT_BRANCH'. Create a feat/* branch from develop before committing. Run: git switch develop && git pull && git switch -c feat/<feature-name>"
  fi
fi

# Block pushes to protected branches (explicit refspec or current branch protected).
if printf '%s' "$CMD_NORM" | grep -q 'git push'; then
  if printf '%s' "$CMD" | grep -Eq 'origin (main|master|develop)\b'; then
    deny "Blocked: direct push to a protected branch. main and develop only update via a reviewed pull request."
  fi
  if printf '%s' "$CURRENT_BRANCH" | grep -Eq "$PROTECTED_REGEX"; then
    deny "Blocked: pushing from protected branch '$CURRENT_BRANCH'. Push your feat/* branch instead and open a PR to develop."
  fi
fi

exit 0
