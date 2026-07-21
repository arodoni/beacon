# AGENTS.md

## Project status

- Beacon is a Next.js 16 project using the App Router.
- The main UI lives in `src/app/page.tsx` with the Markdown workspace in `src/components/MarkdownWorkspace.tsx`.
- Styling is implemented using Tailwind CSS v4 and app-level CSS in `src/app/globals.css`.

## Guidance for AI coding agents

- Treat this as a frontend-first docs editor project.
- Preserve the existing Next.js App Router layout and the client-side Markdown editing experience.
- Use `react-markdown` with `remark-gfm` for rendering Markdown.

## Run commands

- `npm install`
- `npm run dev`
- `npm run build`

## When expanding features

- Keep the live editor and preview tightly integrated in `src/components/MarkdownWorkspace.tsx`.
- Add new UI components under `src/components/`.
- Avoid changing the repository layout unless you also update the app entrypoint and README.
