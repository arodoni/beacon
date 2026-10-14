---
name: merged-to-main
description: Post-merge cleanup. Use when the user says "merged to main" (or "merged", "PR merged", "it's merged") about the current feature branch. Switches to main, pulls the latest from origin, and deletes the local feature branch. Never deletes the branch on GitHub.
---

# Merged to main

The user just merged the current feature branch's PR. Saying "merged to main"
is their go-ahead for every step below. Only the local branch is deleted:
never push or delete anything on GitHub.

## 1. Check the starting state

```bash
branch=$(git branch --show-current)
git status --short
```

- If `$branch` is `main` (or `master`), there's no feature branch to clean up.
  Ask which branch was merged, then continue from step 2 with that name.

- If there are uncommitted changes, stop and show them. Don't switch branches
  or delete anything until the user says what to do with them.

## 2. Update main

```bash
git checkout main
git pull --ff-only origin main
```

If the pull isn't a fast-forward, stop and report it.

## 3. Delete the local branch

```bash
git branch -d "$branch"
```

PRs are usually squash-merged, so `-d` often refuses with "not fully merged".
In that case, check whether main already contains all of the branch's changes
by merging the branch into main in memory and comparing trees:

```bash
[ "$(git merge-tree --write-tree main "$branch")" = "$(git rev-parse 'main^{tree}')" ] && echo contained
```

- `contained`: safe to force-delete with `git branch -D "$branch"`.

- Anything else (or a conflict): the branch has work that isn't on main. Don't
  delete it. Show `git log main.."$branch" --oneline` and ask the user.

## 4. Report

One or two lines: the latest commit on main and whether the local branch was
deleted (or skipped and why). Don't create a new branch; wait for the user to
name one.
