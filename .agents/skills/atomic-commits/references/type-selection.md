# Select the Commit Type and Scope

Choose the type by the primary reason for the change, not by the file extension or the fact that something was edited.

| Type | Primary intent |
| --- | --- |
| `feat` | Add a user-visible capability or new supported behavior. |
| `fix` | Correct a defect, regression, crash, invalid output, or security bug. |
| `perf` | Improve performance without changing supported behavior. |
| `refactor` | Restructure production code without adding behavior or fixing a defect. |
| `test` | Add or correct tests without changing production behavior. |
| `docs` | Change only human-facing documentation or code comments. |
| `style` | Change only formatting or source presentation; visible UI styling is normally `feat` or `fix`. |
| `build` | Change dependencies, package metadata, compilation, bundling, or build tooling. |
| `ci` | Change CI/CD workflows or pipeline automation. |
| `chore` | Perform repository maintenance not described more precisely above. |
| `revert` | Revert the effect of an earlier commit. |

`modified`, `update`, `change`, and `misc` are not types. Do not use `chore` as a default bucket.

Derive an optional, short, stable scope from the affected product area, package, module, or subsystem. Omit it when no single scope improves clarity. When a group appears to need two types, select the externally meaningful outcome; split only when both results are independently coherent.
