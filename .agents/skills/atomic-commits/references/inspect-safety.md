# Inspect the Working Tree Safely

Before planning or staging, inspect the repository root, current branch, status, staged diff, unstaged diff, untracked files, and recent history. Distinguish changes made for the current task from pre-existing user-owned work.

Look for credentials, private keys, tokens, environment files, generated output, large binaries, and dependency caches. Never stage suspected secrets. Report the path and pause before exposing or committing sensitive contents.

Do not discard, rewrite, or absorb unrelated changes. If a file mixes task changes with user changes, use precise patch staging only when the separation is unambiguous; otherwise ask before proceeding.
