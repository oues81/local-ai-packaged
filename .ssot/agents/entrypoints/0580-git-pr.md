---
description: Manage pull requests with gh — create, review, CI status, and merge
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the PR objective (create, review, check CI, or merge).
Prefer `gh` for GitHub pull-request operations. Do not force-push or skip required checks.

## Tool layers

Use the first available layer that can complete each step. Document which layer you used.

1. **MCP Git** (when a `git` MCP server is configured): prefer structured reads for local branch
   and diff context (`git_status`, `git_log`, `git_diff_*`) before opening or merging a PR.
2. **Shell `git`**: local branch, remote, and push prerequisites (`git status -sb`,
   `git rev-parse`, `git push -u` when the user authorized publishing the branch).
3. **`gh` CLI**: required for GitHub PR operations — create, view, review, checks, and merge.

## Procedure

### Create

1. Confirm the current branch is not the default branch and has an upstream (or push with
   explicit user authority first).
2. Inspect local commits and dirty state with MCP Git or shell `git`. Do not open a PR from a
   dirty tree unless the user explicitly accepts that scope.
3. Create the PR with `gh`:
   `gh pr create --title "<title>" --body "<body>"`
   Use a heredoc/body file for multi-line summaries. Include Summary and Test plan sections
   when the repository expects them.
4. Report the PR URL.

### Review

1. Load the PR: `gh pr view <number|--url> --json title,body,baseRefName,headRefName,files,commits`
   or `gh pr diff`.
2. Summarize intent, risk, and review findings. Request changes or approve only when the user
   authorizes that action (`gh pr review`).

### CI status

1. Check required status: `gh pr checks` and/or `gh run list --branch <branch>`.
2. Report failing jobs with links; do not merge while required checks fail unless the user
   explicitly overrides repository policy (and the override is allowed by `gh`).

### Merge

1. Confirm the PR is mergeable and checks are green (or the user explicitly accepted risk).
2. Merge with the repository's preferred strategy, for example:
   `gh pr merge <number> --merge` or `--squash` or `--rebase`
   Match existing repo conventions; do not force-merge around failing protected checks.
3. Report the merge commit / result and whether the remote branch was deleted.

Never use `git push --force` to "fix" a PR branch. Prefer MCP Git / shell `git` for local
context and `gh` for all GitHub PR mutuations.
