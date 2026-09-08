# Respect Authorization and Remote Boundaries

Treat planning, staging, committing, and remote operations as separate permissions.

- Inspect and propose a commit plan when asked to review or plan changes.
- Before requesting authorization for a commit, print the proposal in the console: exact subject, concise description, included paths (and explicit exclusions when relevant), and checks already run. If the session does not already authorize these commits, request approval and wait. Reuse existing explicit authorization without asking again.
- Stage and create local commits only when the user explicitly asks to commit or clearly authorizes the operation.
- Do not push, pull, fetch, open a pull request, merge, rebase, tag, amend, or change remotes unless separately requested.
- Do not alter Git identity or repository configuration without explicit approval.
- Stop before a destructive or history-rewriting operation and request authorization.

An instruction to make atomic commits authorizes local commits for in-scope changes only. It does not authorize including pre-existing user changes unless the user assigns them to the commit.
