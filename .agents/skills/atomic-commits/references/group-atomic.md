# Group Changes Atomically

Each commit must represent one coherent reason for change and leave the repository in a usable state when practical.

- Keep implementation with the tests and documentation required to make that implementation honest.
- Separate independent fixes, features, refactors, tooling, and documentation.
- Order prerequisite commits before their dependents.
- Avoid splitting changes only by file type when the files form one behavior.
- Avoid combining unrelated work merely because it was edited together.

Prefer the smallest group that a reviewer can understand, verify, and revert independently. If separating a change would create broken intermediate history or conceal its purpose, keep it together.
