# Git Hooks

## Installation

```bash
git config core.hooksPath .githooks
```

This enables the pre-commit topology gate that blocks `.gears/` and `.realm/`
from being committed inside this peer repo (they belong at the KOS root only).
