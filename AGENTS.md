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
- Always ask and get explicit acceptance before applying a suggested fix or change. Don't implement it as part of surfacing the suggestion.

## When expanding features

- Keep the live editor and preview tightly integrated in `src/components/MarkdownWorkspace.tsx`.
- Add new UI components under `src/components/`.
- Avoid changing the repository layout unless you also update the app entrypoint and README.

## Git / PR workflow

- Always create a branch for changes. Never commit directly to the `main` branch.
- Never push commits directly to GitHub. Always open a pull request instead.
- Never merge a pull request.

See `content/docs/CLAUDE.md` for AI retrieval optimization guidance (frontmatter, heading structure, canonical URLs) that applies when editing docs content.
