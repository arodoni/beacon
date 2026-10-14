# AGENTS.md

## Project status

- Beacon is a Next.js 16 project using the App Router.
- The main UI lives in `src/app/page.tsx` with the Markdown workspace in `src/components/MarkdownWorkspace.tsx`.
- Styling is implemented using Tailwind CSS v4 and app-level CSS in `src/app/globals.css`.

## Guidance for AI coding agents

- Treat this as a frontend-first docs editor project.
- Preserve the existing Next.js App Router layout and the client-side Markdown editing experience.
- Use `react-markdown` with `remark-gfm` for rendering Markdown.
- Follow the [Google developer documentation style guide](https://developers.google.com/style) for prose written in docs content or UI copy.
- Use Title Case for UI labels (e.g. nav items, buttons, pane titles). Note this overrides the Google style guide's usual sentence-case preference for headings.
- Use Sentence case for in-page section titles (H2/H3 headings within docs content), matching the Google style guide's usual preference.
- Always ask and get explicit acceptance before applying a suggested fix or change. Don't implement it as part of surfacing the suggestion.

## When expanding features

- Keep the live editor and preview tightly integrated in `src/components/MarkdownWorkspace.tsx`.
- Add new UI components under `src/components/`.
- Avoid changing the repository layout unless you also update the app entrypoint and README.
- When you implement a new feature, add a dated entry to `content/docs/release-notes.mdx` describing it.

## create-beacon-docs package

- `packages/create-beacon-docs/` is published to npm separately. When a change touches a file it ships (`index.js`, `template/`, `package.json`, or `README.md`), remind the user to bump its version and republish: run `npm version patch|minor|major` and then `npm publish` in that directory, after the PR merges. Use patch for fixes and template wording, minor for new options, and major for breaking CLI changes.
- The scaffolder relies on parts of Beacon: the `projectName` line in `src/lib/site.ts`, `.env.example`, `content/docs/*.mdx`, and `content/nav.config.ts`. If a change renames or moves any of these, flag that `packages/create-beacon-docs/index.js` may need updating, followed by a version bump.
- Changes to the rest of Beacon don't need a version bump, because the scaffolder downloads the latest `main` from GitHub.

## Git / PR workflow

- When updating code or docs, use the current branch. Don't create a new branch, even if the change seems unrelated to the branch's existing work.
- If the current branch is `main`, pull the latest `main`, then create a new feature branch and make the update there. Never commit directly to the `main` branch.
- Never push commits directly to GitHub. Always open a pull request instead.
- Never merge a pull request.

See `content/docs/CLAUDE.md` for AI retrieval optimization guidance (frontmatter, heading structure, canonical URLs) that applies when editing docs content.
