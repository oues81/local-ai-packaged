---
description: Read-only audit of repository layout, remotes, branches, and working-tree state
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the audit scope. Prefer the smallest read-only commands
that answer the question. Do not mutate the repository.

## Tool layers

Use the first available layer that can complete each read. Document which layer you used.

1. **MCP Git** (when a `git` MCP server is configured): prefer structured read tools such as
   `git_status`, `git_log`, `git_branch`, and related read-only MCP tools.
2. **Shell `git`**: universal fallback for every layout check below.
3. **`gh` CLI**: optional for GitHub remote context (`gh repo view`, `gh api`); not required for a
   local layout audit.

## Procedure

1. Confirm you are inside a Git work tree: `git rev-parse --is-inside-work-tree`.
2. Report repository root: `git rev-parse --show-toplevel`.
3. Classify the repository shape:
   - common work tree vs linked work tree (`git rev-parse --git-dir`, `git worktree list`);
   - bare vs non-bare (`git rev-parse --is-bare-repository`).
4. List remotes with URLs: `git remote -v`.
5. List local and remote-tracking branches: `git branch -vv` and `git branch -r`.
6. Identify the current branch and upstream tracking relationship:
   `git status -sb` or `git rev-parse --abbrev-ref HEAD@{upstream}` when an upstream exists.
7. Report clean vs dirty state without staging or discarding anything:
   `git status --porcelain=v1 --untracked-files=all`.
8. Summarize in compact form: root, bare/worktree shape, remotes, current branch, upstream,
   and whether the work tree is clean or dirty (with counts of staged / unstaged / untracked
   paths when dirty).

Do not run fetch, pull, checkout, reset, clean, stash, or any write. If MCP Git is available,
prefer it for status, log, and branch reads; fall back to shell `git` when MCP is absent or
insufficient.
