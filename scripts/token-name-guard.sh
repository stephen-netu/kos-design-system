#!/usr/bin/env bash
# token-name-guard.sh — fail CI when a var(--x) references a design-system token
# that doesn't exist (the "phantom token" / F-09 class).
#
# Allowlist = every CSS custom property DEFINED in the design-system token source
#             ∪ tokens defined locally in the target app
#             ∪ explicit exceptions in an optional allowlist file (one --name per line).
# Phantom    = any var(--x) used in the target whose --x is in none of the above.
#
# Usage:
#   token-name-guard.sh <DS_TOKEN_DIR> <TARGET_DIR> [ALLOWLIST_FILE]
# e.g. (from an app that depends on @stephen-netu/design-system):
#   scripts/token-name-guard.sh \
#     node_modules/@stephen-netu/design-system/dist \
#     src \
#     .token-allow
#
# Exit 0 = clean; Exit 1 = phantom tokens found (prints them with file:line).
set -euo pipefail

DS="${1:?usage: token-name-guard.sh <DS_TOKEN_DIR> <TARGET_DIR> [ALLOWLIST_FILE]}"
TGT="${2:?missing TARGET_DIR}"
ALLOW="${3:-/dev/null}"

# Never scan build output or vendored trees — they pollute results (Playwright .venv, dist, etc.)
XD=(--exclude-dir=dist --exclude-dir=node_modules --exclude-dir=.venv \
    --exclude-dir=site-packages --exclude-dir=cargo-target --exclude-dir=build \
    --exclude-dir=.svelte-kit --exclude-dir=.git --exclude-dir=coverage)
INC=(--include=*.css --include=*.svelte --include=*.ts)

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
defname='[-][-][A-Za-z0-9_-]+[[:space:]]*:'        # a CSS custom-property DEFINITION
usename='var\([[:space:]]*[-][-][A-Za-z0-9_-]+'     # a var(--x) USE

# 1) Build the allowlist: design-system defs ∪ target-local defs ∪ explicit exceptions
{ grep -rhoE "${XD[@]}" "${INC[@]}" "$defname" "$DS"  2>/dev/null || true
  grep -rhoE "${XD[@]}" "${INC[@]}" "$defname" "$TGT" 2>/dev/null || true
} | sed -E 's/[[:space:]]*:.*//; s/[[:space:]]+$//' | sort -u > "$tmp/defined"
grep -vE '^\s*(#|$)' "$ALLOW" 2>/dev/null | sed -E 's/[[:space:]]+$//' | sort -u >> "$tmp/defined" || true
sort -u "$tmp/defined" -o "$tmp/defined"

# 2) Collect var(--x) uses in the target
grep -rhoE "${XD[@]}" "${INC[@]}" "$usename" "$TGT" 2>/dev/null \
  | grep -oE '[-][-][A-Za-z0-9_-]+' | sort -u > "$tmp/used"

# 3) Phantom = used − defined
comm -23 "$tmp/used" "$tmp/defined" > "$tmp/phantom"

if [ -s "$tmp/phantom" ]; then
  echo "✗ phantom design-system tokens in '$TGT' (used via var(--x) but never defined):"
  while IFS= read -r t; do
    echo "  $t"
    grep -rnoE "${XD[@]}" "${INC[@]}" "var($t[),; ]" "$TGT" 2>/dev/null | sed 's#^#      #' | head -3 || true
  done < "$tmp/phantom"
  printf '\n%s phantom token name(s). Rename to a real token, define it, or add an intentional exception to the allowlist (%s).\n' \
    "$(wc -l < "$tmp/phantom" | tr -d ' ')" "$ALLOW"
  exit 1
fi
echo "✓ no phantom tokens — every var(--x) in '$TGT' resolves to a design-system or local token."
