---
name: docs-review
description: Grammar and style review for Beacon docs content. Use this before committing any change to .mdx files in content/ or content/docs/, and whenever asked to proofread, copyedit, or check grammar in the docs. A PreToolUse hook blocks `git commit` until this review has run on the current .mdx changes, so run it proactively when you're about to commit docs.
---

# Docs review

Check changed `.mdx` files under `content/` for grammar, spelling, and style
problems before they're committed. Report findings and wait for the user's
approval before editing anything.

## 1. Find the files to review

```bash
.claude/hooks/docs-review-gate.sh --list
```

This lists every `.mdx` file under `content/` that differs from `HEAD`
(staged, unstaged, or untracked). If the user names specific files, review
those instead. If the list is empty, say so and stop.

For each file, review the changed lines (`git diff HEAD -- <file>`, or the
whole file if it's untracked), reading enough surrounding context to judge
each sentence. Don't flag problems in untouched text unless they're
egregious; mention those separately as optional.

## 2. What to check

Grammar and mechanics:

- Spelling, typos, and repeated words ("the the").

- Subject-verb agreement, tense consistency, and sentence fragments.

- Articles (a/an/the), punctuation, and comma splices.

- Misused words (its/it's, affect/effect, then/than, setup/set up, login/log in).

Style, following the [Google developer documentation style guide](https://developers.google.com/style):

- Second person ("you"), active voice, present tense.

- Short, direct sentences. Flag wordy phrasing ("in order to", "please note that").

- Sentence case for H2/H3 headings in docs content.

- Title Case for UI labels (buttons, nav items, pane titles) when the doc names them.

- Code-formatted filenames, commands, env vars, and other literal values.

Beacon conventions:

- No em dashes (—). Suggest a hyphen, colon, comma, or a split sentence.

- A blank line between list items (loose lists), per `content/docs/CLAUDE.md`.

- One H1 per page, and meaningful `title` and `description` frontmatter.

Leave alone: content inside code blocks and inline code, frontmatter keys,
MDX/JSX component syntax, and URLs.

## 3. Report

Group findings by file. For each, give the line number, the original text,
the suggested fix, and a short reason:

```
content/docs/quickstart.mdx
- L42: "Run the the command" -> "Run the command" (repeated word)
- L58: "## Deploy To Vercel" -> "## Deploy to Vercel" (sentence-case H2)
```

If you're unsure whether something is an error, say so rather than stating
it as one. If there are no findings, say the files look clean.

## 4. Apply and mark

- Ask the user which fixes to apply. Don't edit until they approve.

- After the approved fixes are in (or if there was nothing to fix), record the
  review so the commit hook lets the commit through:

  ```bash
  .claude/hooks/docs-review-gate.sh --mark
  ```

- The mark is a fingerprint of the current `.mdx` changes. Any further edit to
  those files invalidates it, so run `--mark` last, right before committing.
