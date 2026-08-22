---
description: Add, commit, and push with STOP guards for secrets, conflicts, hooks, and merge state
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the commit objective. Perform add → commit → push only
when every STOP guard passes. Prefer the smallest change set that matches the request.

## Tool layers

Use the first available layer that can complete each step. Document which layer you used.

1. **MCP Git** (when a `git` MCP server is configured): prefer structured reads such as
   `git_status`, `git_diff_staged`, `git_diff_unstaged`, and `git_log` before mutating.
2. **Shell `git`**: required for all writes (`add`, `commit`, `push`, and state probes below).
3. **`gh` CLI**: optional for GitHub-side status after push (`gh run list`); not a substitute for
   `git push`.

## Hard prohibitions

- Never use `git push --force`, `git push --force-with-lease`, or any force-push variant.
- Never use `--no-verify`, `--no-gpg-sign`, or other hook-skipping flags.
- Never guess-merge conflict markers or invent commit content the user did not authorize.

## STOP guards (refuse and report — do not commit)

Run these checks before `git commit`. Stop immediately if any fail.

1. **Secrets in the diff**: inspect staged and about-to-be-staged changes for credential-shaped
   content (`.env`, private keys, tokens, `credentials.json`, `Authorization:` / `Bearer `
   literals, AWS/GCP/Azure key patterns). If any candidate is found, STOP and list the paths.
2. **Unresolved conflicts**: if `git status` reports unmerged paths or conflict markers remain,
   STOP. Do not commit a partial merge.
3. **Active merge or rebase**: if `.git/MERGE_HEAD`, `.git/rebase-merge`, or `.git/rebase-apply`
   exists (or `git status` reports merge/rebase in progress), STOP until the user finishes or
   aborts that operation.
4. **Failing pre-commit hooks**: run the normal `git commit` path so hooks execute. If hooks
   fail, STOP; fix the failure or ask the user. Do not retry with `--no-verify`.

## Procedure

1. Read current state with MCP Git when available, otherwise
   `git status -sb` and `git diff` / `git diff --staged`.
2. Run every STOP guard above. If any fails, report the blocker and exit this workflow.
3. Stage only the intended paths (`git add <paths>` or `git add -p`). Avoid blanket
   `git add .` unless the user explicitly requested the entire dirty tree.
4. Draft a concise commit message focused on why the change exists.
5. Commit with hooks enabled:
   `git commit -m "<message>"`
   (On Windows PowerShell, pass the message safely — do not disable hooks.)
6. If commit succeeds and the user requested push, push the current branch to its upstream:
   `git push`
   or `git push -u origin HEAD` only when no upstream is configured and the user authorized
   setting upstream. Never force-push.
7. Report the resulting commit SHA, branch, and push outcome.

If authority for commit or push is missing, stop after the read-only audit and ask.
