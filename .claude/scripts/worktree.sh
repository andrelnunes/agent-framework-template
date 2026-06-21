#!/usr/bin/env bash
# Worktree orchestrator — one isolated working directory per backlog task.
# Replaces the v1 file-reservation system: instead of soft locks in STATUS.md,
# each agent gets its own real checkout on its own feat/* branch.
#
#   worktree.sh new   <task-id> [base]   # create ../<repo>.worktrees/<id> on feat/<id> (from base, default develop)
#   worktree.sh list                     # show all worktrees + their branches/status
#   worktree.sh rm    <task-id> [--branch]# remove the worktree (and optionally its branch)
#   worktree.sh prune                    # clean up stale worktree metadata
#
# Conventions:
#   - Worktrees live OUTSIDE the repo (sibling dir) so they don't pollute the main checkout.
#   - Branch name is feat/<task-id-lowercased>; task-id stays uppercase in commits/PRs.
#   - Tasks that share files (see "Touches:" in docs/backlog) must NOT run in parallel —
#     give those sequential worktrees, or one worktree, to avoid merge pain.
set -euo pipefail

BASE_DEFAULT="develop"
REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
WT_ROOT="$(dirname "$REPO_ROOT")/${REPO_NAME}.worktrees"

slug() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9._-' '-' | sed 's/-\+/-/g; s/^-//; s/-$//'; }

cmd="${1:-}"; shift || true

case "$cmd" in
  new)
    ID="${1:?usage: worktree.sh new <task-id> [base]}"
    BASE="${2:-$BASE_DEFAULT}"
    BRANCH="feat/$(slug "$ID")"
    DEST="$WT_ROOT/$(slug "$ID")"
    mkdir -p "$WT_ROOT"

    # make sure base is current
    git -C "$REPO_ROOT" fetch origin --quiet || true
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$BASE"; then
      git -C "$REPO_ROOT" branch --quiet -f "$BASE" "origin/$BASE" 2>/dev/null || true
    fi

    if [ -d "$DEST" ]; then echo "✗ worktree already exists: $DEST"; exit 1; fi
    git -C "$REPO_ROOT" worktree add -b "$BRANCH" "$DEST" "$BASE"
    echo "✓ worktree ready"
    echo "  task:   $ID"
    echo "  branch: $BRANCH  (from $BASE)"
    echo "  path:   $DEST"
    echo
    echo "  → cd \"$DEST\"   then run the agent / task-execute there."
    ;;

  list)
    git -C "$REPO_ROOT" worktree list
    ;;

  rm)
    ID="${1:?usage: worktree.sh rm <task-id> [--branch]}"
    DEST="$WT_ROOT/$(slug "$ID")"
    BRANCH="feat/$(slug "$ID")"
    git -C "$REPO_ROOT" worktree remove "$DEST"
    echo "✓ removed worktree $DEST"
    if [ "${2:-}" = "--branch" ]; then
      git -C "$REPO_ROOT" branch -D "$BRANCH" && echo "✓ deleted branch $BRANCH"
    fi
    ;;

  prune)
    git -C "$REPO_ROOT" worktree prune -v
    echo "✓ pruned stale worktrees"
    ;;

  *)
    grep '^#' "$0" | sed 's/^# \{0,1\}//' | sed '1d'
    exit 1
    ;;
esac
