#!/usr/bin/env bash
# Derive the backlog task id a pull request is about.
#
#   task-id.sh "<pr body>" "<pr title>" "<branch name>"
#
# Prints the id (e.g. WND-03) on stdout, or nothing if none is found.
#
# Why this exists: taking the first id-shaped token anywhere in the body is wrong. A good PR
# body cites user stories (US-01), other tasks, and linked issues — any of which can appear
# before the task id and hijack the match. That produced BOTH failure modes in practice: a
# correct PR rejected because the gate looked for the wrong id, and — worse — a PR passing
# because a test file happened to mention the wrong id it had guessed.
#
# Precedence: the "Task:" line of the PR template, then a "Refs:" line, then the branch name,
# then anywhere in the body/title as a last resort.
set -uo pipefail

BODY="${1:-}"
TITLE="${2:-}"
BRANCH="${3:-}"

ID_RE='[A-Z]{2,4}-[0-9]+'

# 1. The "Task:" line of the PR template — the authoritative declaration.
id="$(printf '%s' "$BODY" | grep -iE '^[[:space:]]*[-*]?[[:space:]]*\**task\**:?' \
      | grep -oE "$ID_RE" | head -1)"

# 2. A "Refs:" trailer, as commits use.
if [ -z "$id" ]; then
  id="$(printf '%s' "$BODY" | grep -iE '^[[:space:]]*\**refs\**:?' \
        | grep -oE "$ID_RE" | head -1)"
fi

# 3. The branch name, when it carries the id (feat/wnd-03 → WND-03).
if [ -z "$id" ]; then
  id="$(printf '%s' "$BRANCH" | tr '[:lower:]' '[:upper:]' \
        | grep -oE "$ID_RE" | head -1)"
fi

# 4. Last resort: anywhere in the body or title.
if [ -z "$id" ]; then
  id="$(printf '%s\n%s' "$BODY" "$TITLE" | grep -oE "$ID_RE" | head -1)"
fi

printf '%s' "$id"
