# Stage Precisely Without Data Loss

Stage explicit paths or reviewed patches belonging only to the current atomic group. Never use broad staging such as `git add .` or `git add -A` in a dirty worktree unless every change has been inspected and assigned to the same commit.

Preserve the existing index. If unrelated changes are already staged, do not unstage, overwrite, or commit them without authorization. Verify the staged diff before every commit.

Do not use destructive cleanup, checkout, reset, restore, or stash commands to simplify staging. If a hook changes files or a commit fails, inspect the resulting status before retrying. Never bypass hooks unless the user explicitly authorizes it.
