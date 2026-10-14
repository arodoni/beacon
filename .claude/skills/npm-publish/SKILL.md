---
name: npm-publish
description: Bump and publish the create-beacon-docs package to npm. Use when the user asks to publish, release, or bump create-beacon-docs, or says "npm publish", usually right after a PR that touched packages/create-beacon-docs/ was merged to main. Also use when `npm publish` fails with E404 or E401, which here means npm isn't logged in.
---

# Publish create-beacon-docs

`packages/create-beacon-docs/` is published to npm separately from Beacon.
Publish only code that's already merged to main. Never push to GitHub, and
never commit on main.

## 1. Check the starting state

```bash
git branch --show-current
git status --short
git fetch -q origin
[ "$(git rev-parse main)" = "$(git rev-parse origin/main)" ] && echo up-to-date
```

- The current branch must be `main` and match `origin/main`. If the merged
  feature branch is still checked out, run the `merged-to-main` skill first.

- If there are uncommitted changes, stop and show them. A leftover
  `package.json` version change usually means an earlier publish wasn't
  committed. Compare it with `npm view create-beacon-docs version` and ask the
  user what to do.

## 2. Choose the version bump

List the changes to shipped files since the last published version:

```bash
cd packages/create-beacon-docs
v=$(npm view create-beacon-docs version)
last=$(git log -1 --format=%H -S"\"version\": \"$v\"" main -- package.json)
git log --oneline "$last"..main -- index.js template package.json README.md
```

This finds the commit that set the published version, not a commit message,
because squash merges replace commit messages with the PR title.

- If `$last` is empty, the published version isn't on main yet, which
  usually means the previous bump PR hasn't merged. Say so and stop.

- If no commits are listed, there's nothing to publish. Say so and stop.

Otherwise, propose a bump type and wait for the user to confirm it:

- `patch`: fixes and template wording.
- `minor`: new CLI options.
- `major`: breaking CLI changes.

## 3. Check the npm login

```bash
npm whoami
```

If this fails with `E401`, ask the user to run `npm login` themselves. It
opens a browser, so Claude can't complete it. Without a login, `npm publish`
fails with a misleading `E404 Not Found - PUT`, not a 401.

## 4. Bump and preview

```bash
npm version <patch|minor|major> --no-git-tag-version
npm publish --dry-run
```

The `--dry-run` file list should contain only `index.js`, `template/`,
`package.json`, `README.md`, and `LICENSE`. If anything else shows up, stop and
check the `files` field in `package.json`.

## 5. Publish

Show the new version and ask the user to confirm before publishing. Publishing
can't be undone: npm never allows a version number to be reused.

```bash
npm publish
npm view create-beacon-docs version
```

If it fails with `EOTP`, the account uses 2FA. Ask the user for the current
code and run `npm publish --otp=<code>`, or ask them to run `npm publish`
themselves.

## 6. Commit the version bump

The bump is now an uncommitted change on main. Move it to a branch and commit
it there:

```bash
git checkout -b bump-create-beacon-docs-<version>
git add packages/create-beacon-docs/package.json
git commit -m "Bump create-beacon-docs to <version>"
```

## 7. Report

In one or two lines, give the published version and the branch with the bump
commit. Then ask the user to push the branch and open a PR.
