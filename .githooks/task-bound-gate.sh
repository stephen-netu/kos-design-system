#!/usr/bin/env bash
# task-bound-gate.sh — refuse default-branch commits when KOS_TASK_ID is unset.
#
# Installed into each peer's .githooks/ (by `kos-repos install-peer-hooks`) and
# invoked from the pre-commit hook. When on main/master without KOS_TASK_ID and
# without an UNTRACKED .kos-session-env at repo root, the commit is refused.
# This catches the failure mode where a session works in the primary checkout
# and lands commits directly on the default branch, bypassing the worktree
# lifecycle (T-02).
#
# WHY THE BYPASS FILE MUST BE UNTRACKED (kos:sovereign-123142)
# .kos-session-env is a per-worktree session artifact written by
# `scripts/kos-spawn` to $WT. Its EXISTENCE is the assertion "this working copy
# belongs to a live, task-bound session". A file has no TTL, no owner and no
# invalidation, so once committed that assertion becomes permanent and
# repo-wide: the gate exits 0 on main forever. That is exactly what happened in
# KOS/mir (tracked 2026-07-06, asserting a Completed task) and KOS/amandla
# (tracked 2026-06-17), which left T-02 disarmed in both peers for 8-10 weeks
# while 28 commits landed on main.
#
# Lie-mode class: BYPASS TOKEN OUTLIVES ITS SESSION. The tracked/untracked
# distinction is the invalidation the file itself does not carry — git already
# knows whether this file is a session artifact or a repo asset.
#
# Override (emergency only): KOS_ACKNOWLEDGE_RISK=1 or git commit --no-verify.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '')"
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fi

# Detect current branch.
current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"

# Only enforce on the default branch.
case "$current_branch" in
  main|master) ;;
  *) exit 0 ;;
esac

# Session is task-bound if KOS_TASK_ID is set.
if [[ -n "${KOS_TASK_ID:-}" ]]; then
  exit 0
fi

# Session is task-bound if an UNTRACKED .kos-session-env exists at repo root.
# A TRACKED one is a committed artifact, not a session, and grants nothing.
tracked_token=0
if [[ -f "$REPO_ROOT/.kos-session-env" ]]; then
  if git -C "$REPO_ROOT" ls-files --error-unmatch .kos-session-env >/dev/null 2>&1; then
    tracked_token=1
  else
    exit 0
  fi
fi

# Emergency override.
if [[ "${KOS_ACKNOWLEDGE_RISK:-}" == "1" ]]; then
  exit 0
fi

# Refuse.
echo "" >&2
echo "COMMIT BLOCKED — default branch ($current_branch) commit without KOS_TASK_ID." >&2
echo "  This session is not bound to a TOS task. Commits on $current_branch must go through" >&2
echo "  the worktree lifecycle (kos-spawn / kc / kk), not the primary checkout." >&2
if [[ $tracked_token -eq 1 ]]; then
  echo "" >&2
  echo "  NOTE: .kos-session-env is present but TRACKED in this repo, so it grants no" >&2
  echo "  bypass. A committed session file is not a session — it asserts a task binding" >&2
  echo "  for every checkout, forever. Untrack it:" >&2
  echo "      git rm --cached .kos-session-env && echo .kos-session-env >> .gitignore" >&2
fi
echo "  Fix: set KOS_TASK_ID, work in a worktree, or bypass with --no-verify." >&2
exit 1
