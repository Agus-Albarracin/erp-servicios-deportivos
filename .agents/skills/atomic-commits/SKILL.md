---
name: atomic-commits
description: Propose GitHub Projects items before implementation and plan and create small, reviewable Git commits when the user asks to commit current changes, split a working tree into coherent commits, or prepare an atomic Conventional Commit history. Excludes pushing, pull requests, merging, rebasing, tagging, and amending unless separately requested.
metadata:
  compatibility: Requires Git and a local Git repository.
---

# Atomic Commits

## CRITICAL: One specific task per branch

This user's persistent workflow requires one concrete task per branch and only
commits that serve that task. Before editing, declare the Project item, repository,
specific branch name, base and dependency reason. New independent work requires
another branch from main; use a feature branch as a base only for a real dependency.
Generic catch-all names are prohibited. Share a name across repositories only for
the same concrete task. Read [Project item planning](references/project-items.md)
for the complete branch, commit, PR and push-confirmation rules. Prepare authorized
local commits first, then report exact titles and bases before requesting any
missing push confirmation. Preserve published history when reorganizing work.

## CRITICAL: Project items before implementation

This is an explicit user workflow preference. Before implementing changes,
read [Project item planning](references/project-items.md) and present concrete
GitHub Projects item proposals in the conversation. Reuse existing items.
This gate requires a proposal, not an additional approval or a remote write.
For commit-only requests about existing changes, identify any proposal as
retrospective. Do not invent prior planning or publish items without authorization.


Create the smallest coherent commits that remain honest, reviewable, and usable. Use Conventional Commits and preserve all user-owned work.

## When to Apply

Use this skill to inspect and group changes, stage a precise group, select a Conventional Commit message, create authorized local commits, and verify the resulting history.

## Operating Contract

- Preserve user-owned work and stage only assigned paths.
- Treat planning, local commits, and remote operations as separate authorization boundaries.
- Print the exact commit proposal in the console before creating every commit.

## Reference Router

`priority` measures the impact of ignoring a guide. `dependsOn` identifies the
guides that must be resolved first; it never derives order from impact.

| Reference | Priority | dependsOn | Use when |
| --- | --- | --- | --- |
| [`authorization-scope`](references/authorization-scope.md) | `CRITICAL` | — | Always, before planning or mutating Git state. |
| [`project-items`](references/project-items.md) | `CRITICAL` | `authorization-scope` | Before implementation; reuse existing items or label retrospective proposals for existing changes. |
| [`inspect-safety`](references/inspect-safety.md) | `CRITICAL` | `authorization-scope` | Inspecting a working tree or deciding what belongs in a commit. |
| [`group-atomic`](references/group-atomic.md) | `HIGH` | `inspect-safety` | Grouping assigned changes into independent commits. |
| [`type-selection`](references/type-selection.md) | `HIGH` | `group-atomic` | Selecting a Conventional Commit type and scope. |
| [`message-format`](references/message-format.md) | `HIGH` | `type-selection` | Writing or reviewing a commit message. |
| [`stage-preserve`](references/stage-preserve.md) | `HIGH` | `group-atomic`, `message-format` | Staging a group without absorbing unrelated work. |
| [`verify-report`](references/verify-report.md) | `MEDIUM` | `stage-preserve` | Verifying the commit and reporting its evidence. |

## Quick Reference

| Priority | Category | Use for |
| --- | --- | --- |
| `CRITICAL` | Authorization and inspection | Scope, ownership, secrets, and existing Git state. |
| `HIGH` | Grouping, type, message, and staging | A coherent, reviewable commit. |
| `MEDIUM` | Verification | Evidence after the commit. |

## Workflow

Always read [`references/authorization-scope.md`](references/authorization-scope.md). Then resolve `dependsOn` and read only the guides needed for the current request:

- Planning only: `inspect-safety`, `group-atomic`, `message-format`, and `type-selection`.
- Creating commits: all references.
- Reviewing proposed messages: `message-format` and `type-selection`.
- Diagnosing staging or hook problems: `stage-preserve` and `verify-report`.

Never use `priority` to choose the reading order. Never treat this skill as authorization for an action the user did not request.

## Verification

- Inspect the staged diff before committing.
- Confirm the resulting subject, changed paths, and working-tree status.
- Report checks, remaining changes, and deliberately unperformed remote operations.
