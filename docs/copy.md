# UI Copy Standard (STE-strict)

Canonical writing standard for **all user-facing copy** in KOS apps: button labels, form
labels, tooltips, error toasts/messages, empty states, status text, and placeholders. This is
the design-system source of truth; peer apps (Agora, Atelier, Ryu, Loge, Mir, Guanxi, Amandla,
Paracosm, Sonda, Stinger) inherit it by consuming this package.

This standard is **STE-strict** (ASD-STE100 Simplified Technical English, applied to
microcopy) and is enforced by `MANDATE-8` in `.gears/AGENT_MANDATES.md`. It is reconciled with
LEAP's existing unified voice guideline (`leap/EmptyState-Copy-Audit.md`, kos:leap-899): that
audit's casing/punctuation/emoji rules are preserved below as explicit exceptions.

## Core rules

1. **Active voice.** "Save your changes" — not "Your changes will be saved."
2. **Imperative for actions.** Button: `Save`, `Delete`, `Cancel`. Never a gerund-as-label
   (`Submitting…` as a button label).
3. **One word per concept.** Pick `delete` / `remove` / `clear` and reuse it everywhere. Do not
   rotate synonyms for the same action across the app.
4. **No marketing adjectives.** Never `seamless`, `powerful`, `robust`, `effortless`,
   `world-class`, `next-generation`, `revolutionary`, `cutting-edge`, etc.
5. **No semicolons.** Split into two sentences if needed.
6. **Strict word set:**
   - `can` (permission) — not `may`
   - `must` (obligation) — not `should` / `shall`
   - `because` (cause) — not `since`
   - `use` / `with` — not `using`
   - `obey` for instructions — not `follow`
7. **Length caps.** Labels ≤ 3 words where possible. Tooltips ≤ 1 short sentence. Error
   messages ≤ 2 sentences: name the problem, then the fix.
8. **Articles.** Full sentences (toasts, messages, empty-state text) keep their articles
   (`Remove the file`). Labels and list items may be article-free fragments (`Delete file`).

## Per-element guidance

| Element | Rule | Example |
|---|---|---|
| Button | Imperative verb, active | `Save`, `Delete`, `Connect` |
| Form label | Noun or noun phrase | `Email`, `Workspace name` |
| Tooltip | One sentence, states what/why | `Sorts tasks by due date` |
| Error toast | Problem + fix, active voice | `Can't connect to the server. Check your network and try again.` |
| Empty state | Declarative; add next step if user can act | `No groves yet. Create a grove to start.` |
| Status text | Plain, present-tense statement | `Saving…` / `Saved` |
| Placeholder | Hint, not a command | `Search tasks…` |

## Documented exceptions (from LEAP voice guideline)

- **Sentence case**, not Title Case, not ALL CAPS: `No file open` — not `No File Open`.
- **ALL CAPS is allowed only** in intentional sysadmin/HUD contexts (`NO TELEMETRY`). Do not
  spread it to normal copy.
- **No trailing period** on single-line empty-state titles; multi-sentence messages use normal
  punctuation.
- **No emoji in core shell copy.** Feature panels (e.g. trading) may use emoji, but consistently.
- **Contractions are permitted** in microcopy for natural tone (`can't`, `won't`). This is the
  one STE rule relaxed for UI — everywhere else STE is strict.

## How to verify

- Author or review copy with the `ste-writing` agent skill (`review` mode, strict target:
  under 1.5 violations / 100 words).
- Extract copy strings and lint them:
  `python3 .gears/_realm/tools/ste-lint/ste-lint.py --strict <file>`
- `MANDATE-8` requires this before any PR that adds or changes user-facing copy.

## Source

Based on ASD-STE100 Simplified Technical English, Issue 9 (free on request at asd-ste100.org).
Unofficial, not affiliated with ASD. ASD-STE100 is a registered EU trademark (No. 017966390).
See `.gears/_realm/context/ste-writing-standard.md` for the full KOS writing standard and
`.gears/_realm/tools/ste-lint/` for the linter.
