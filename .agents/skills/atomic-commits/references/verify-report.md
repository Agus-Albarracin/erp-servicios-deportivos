# Verify and Report Each Commit

Run focused checks appropriate to the change before committing when feasible. After each commit, verify its subject, changed paths, and repository status. Confirm that unrelated user-owned changes remain untouched.

Report:

- the commit hash and exact subject;
- the files or behavior included;
- checks run and their result;
- any remaining staged, unstaged, or untracked changes;
- any operation deliberately not performed, especially remote operations.

Do not claim a clean tree, passing check, or successful commit without direct evidence.
