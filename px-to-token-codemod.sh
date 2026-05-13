#!/bin/bash
# px-to-token-codemod.sh — Bulk replaces raw px values with design tokens
# Usage: ./px-to-token-codemod.sh [--dry-run] <app-dir>
# Safety: Run with --dry-run to preview

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

TARGET_DIR="${1:-}"
if [[ -z "$TARGET_DIR" ]]; then
  echo "Usage: $0 [--dry-run] <app-dir>"
  exit 1
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "ERROR: Directory not found: $TARGET_DIR"
  exit 1
fi

replace_in_file() {
  local file="$1" old="$2" new="$3"
  if grep -qF "$old" "$file" 2>/dev/null; then
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "  would replace: $old -> $new"
    else
      python3 -c "
with open('$file', 'r') as f: c = f.read()
c = c.replace('$old', '$new')
with open('$file', 'w') as f: f.write(c)
"
    fi
  fi
}

find "$TARGET_DIR" -name '*.svelte' -type f | while read -r file; do
  if ! grep -q 'px' "$file" 2>/dev/null; then continue; fi
  echo "Processing: $file"

  # border-radius
  replace_in_file "$file" 'border-radius: 1px' 'border-radius: var(--radius-xs)'
  replace_in_file "$file" 'border-radius: 2px' 'border-radius: var(--radius-sm)'
  replace_in_file "$file" 'border-radius: 3px' 'border-radius: var(--radius-md)'
  replace_in_file "$file" 'border-radius: 4px' 'border-radius: var(--radius-sm)'
  replace_in_file "$file" 'border-radius: 6px' 'border-radius: var(--radius-md)'
  replace_in_file "$file" 'border-radius: 8px' 'border-radius: var(--radius-lg)'
  replace_in_file "$file" 'border-radius: 10px' 'border-radius: var(--radius-lg)'
  replace_in_file "$file" 'border-radius: 12px' 'border-radius: var(--radius-xl)'
  replace_in_file "$file" 'border-radius: 999px' 'border-radius: var(--radius-full)'
  replace_in_file "$file" 'border-radius: 9999px' 'border-radius: var(--radius-full)'

  # border shorthand
  replace_in_file "$file" 'border: 1px solid ' 'border: var(--border-width-thin) solid '
  replace_in_file "$file" 'border: 1px ' 'border: var(--border-width-thin) '

  # font-size
  replace_in_file "$file" 'font-size: 9px' 'font-size: var(--text-xs)'
  replace_in_file "$file" 'font-size: 10px' 'font-size: var(--text-xs)'
  replace_in_file "$file" 'font-size: 11px' 'font-size: var(--text-xs)'
  replace_in_file "$file" 'font-size: 12px' 'font-size: var(--text-sm)'
  replace_in_file "$file" 'font-size: 13px' 'font-size: var(--text-base)'
  replace_in_file "$file" 'font-size: 14px' 'font-size: var(--text-base)'
  replace_in_file "$file" 'font-size: 16px' 'font-size: var(--text-lg)'
  replace_in_file "$file" 'font-size: 18px' 'font-size: var(--text-2xl)'
  replace_in_file "$file" 'font-size: 20px' 'font-size: var(--text-xl)'
  replace_in_file "$file" 'font-size: 24px' 'font-size: var(--text-2xl)'
  replace_in_file "$file" 'font-size: 28px' 'font-size: var(--text-3xl)'
  replace_in_file "$file" 'font-size: 30px' 'font-size: var(--text-3xl)'
  replace_in_file "$file" 'font-size: 36px' 'font-size: var(--text-4xl)'

  # padding
  replace_in_file "$file" 'padding: 4px' 'padding: var(--space-1)'
  replace_in_file "$file" 'padding: 8px' 'padding: var(--space-2)'
  replace_in_file "$file" 'padding: 12px' 'padding: var(--space-3)'
  replace_in_file "$file" 'padding: 16px' 'padding: var(--space-4)'
  replace_in_file "$file" 'padding: 24px' 'padding: var(--space-6)'
  replace_in_file "$file" 'padding: 32px' 'padding: var(--space-8)'

  # padding shorthand
  replace_in_file "$file" 'padding: 8px 12px' 'padding: var(--space-2) var(--space-3)'
  replace_in_file "$file" 'padding: 8px 16px' 'padding: var(--space-2) var(--space-4)'
  replace_in_file "$file" 'padding: 12px 16px' 'padding: var(--space-3) var(--space-4)'
  replace_in_file "$file" 'padding: 4px 8px' 'padding: var(--space-1) var(--space-2)'
  replace_in_file "$file" 'padding: 16px 24px' 'padding: var(--space-4) var(--space-6)'

  # directional padding
  replace_in_file "$file" 'padding-top: 8px' 'padding-top: var(--space-2)'
  replace_in_file "$file" 'padding-bottom: 8px' 'padding-bottom: var(--space-2)'
  replace_in_file "$file" 'padding-left: 8px' 'padding-left: var(--space-2)'
  replace_in_file "$file" 'padding-right: 8px' 'padding-right: var(--space-2)'
  replace_in_file "$file" 'padding-top: 16px' 'padding-top: var(--space-4)'
  replace_in_file "$file" 'padding-bottom: 16px' 'padding-bottom: var(--space-4)'

  # gap
  replace_in_file "$file" 'gap: 4px' 'gap: var(--space-1)'
  replace_in_file "$file" 'gap: 8px' 'gap: var(--space-2)'
  replace_in_file "$file" 'gap: 10px' 'gap: var(--space-3)'
  replace_in_file "$file" 'gap: 12px' 'gap: var(--space-3)'
  replace_in_file "$file" 'gap: 16px' 'gap: var(--space-4)'
  replace_in_file "$file" 'gap: 24px' 'gap: var(--space-6)'

  # margin
  replace_in_file "$file" 'margin: 4px' 'margin: var(--space-1)'
  replace_in_file "$file" 'margin: 8px' 'margin: var(--space-2)'
  replace_in_file "$file" 'margin: 12px' 'margin: var(--space-3)'
  replace_in_file "$file" 'margin: 16px' 'margin: var(--space-4)'
  replace_in_file "$file" 'margin-top: 8px' 'margin-top: var(--space-2)'
  replace_in_file "$file" 'margin-bottom: 8px' 'margin-bottom: var(--space-2)'
  replace_in_file "$file" 'margin-bottom: 16px' 'margin-bottom: var(--space-4)'
  replace_in_file "$file" 'margin-top: 16px' 'margin-top: var(--space-4)'
  replace_in_file "$file" 'margin-right: 8px' 'margin-right: var(--space-2)'
  replace_in_file "$file" 'margin-left: 8px' 'margin-left: var(--space-2)'

  # width/height utility
  replace_in_file "$file" 'width: 4px' 'width: var(--space-1)'
  replace_in_file "$file" 'width: 8px' 'width: var(--space-2)'
  replace_in_file "$file" 'height: 4px' 'height: var(--space-1)'
  replace_in_file "$file" 'height: 8px' 'height: var(--space-2)'
  replace_in_file "$file" 'height: 6px' 'height: var(--size-divider)'
  replace_in_file "$file" 'width: 6px' 'width: var(--size-divider)'

  # blur effects
  replace_in_file "$file" 'blur(2px)' 'blur(var(--blur-sm))'
  replace_in_file "$file" 'blur(4px)' 'blur(var(--blur-md))'
  replace_in_file "$file" 'blur(8px)' 'blur(var(--blur-lg))'

  # row/column gap
  replace_in_file "$file" 'row-gap: 8px' 'row-gap: var(--space-2)'
  replace_in_file "$file" 'column-gap: 8px' 'column-gap: var(--space-2)'
done