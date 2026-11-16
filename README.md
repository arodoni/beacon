# Beacon

Beacon is a self-contained static-site generator for docs, tutorials, and product content, built on Next.js. Write pages in Markdown/MDX, configure the sidebar in one file, and get a plain static site with client-side search, syntax highlighting, and dark mode. No server, no vendor lock-in.

Full documentation: [beacon-arodoni.vercel.app](https://beacon-arodoni.vercel.app/)

## Features

- **Markdown/MDX content** with a config-driven sidebar. See [Write Content](https://beacon-arodoni.vercel.app/create-content/).
- **Authoring components** such as callouts, steps, images, and variables. See [Use Authoring Components](https://beacon-arodoni.vercel.app/format/).
- **API reference pages** generated from an OpenAPI 3 file. See [Generate API Reference](https://beacon-arodoni.vercel.app/openapi/).
- **Read-only REST API** that serves pages and navigation as JSON. See [REST API Introduction](https://beacon-arodoni.vercel.app/rest-api/).
- **Drift check** that flags doc pages that go stale. See [Check for Drift](https://beacon-arodoni.vercel.app/doc-updates/).
- **Client-side search, syntax highlighting, and dark mode**, with plain static output you can host on Vercel. See the [Overview](https://beacon-arodoni.vercel.app/).

## Getting started

To create a new site from Beacon, run:

```bash
npm create beacon-docs@latest my-docs
```

For the full walkthrough, see the [Quickstart](https://beacon-arodoni.vercel.app/quickstart/), or the step-by-step [Prepare](https://beacon-arodoni.vercel.app/prepare/) and [Install Beacon](https://beacon-arodoni.vercel.app/install/) guides, which also cover the environment variables.

## Writing and deploying

- [Write Content](https://beacon-arodoni.vercel.app/create-content/): add pages and navigation entries.
- [Deploy Site](https://beacon-arodoni.vercel.app/deploy/): build the site and ship it to Vercel.
- [Troubleshoot](https://beacon-arodoni.vercel.app/troubleshoot/): fixes for common build and deployment issues.
- [Release Notes](https://beacon-arodoni.vercel.app/release-notes/): notable features and changes.

## Contributing to Beacon

To change Beacon itself, for example to fix a bug or add a feature, clone this repository and start the development server. 

You don't need to clone it to build your own docs site; use `npm create
beacon-docs` instead, as described in [Getting started](#getting-started).

```bash
git clone https://github.com/arodoni/beacon.git
cd beacon
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Project structure

- `content/docs/` - MDX content pages.
- `content/nav.config.ts` - sidebar structure.
- `src/lib/content.ts` - content loading, nav validation, and search-index generation, shared by the pages and the search route.
- `src/lib/openapi.ts`, `src/lib/api.ts` - OpenAPI parsing for the API reference pages, and the data behind the REST API.
- `src/app/(site)/` - the docs shell (layout, sidebar, top bar) and routes: `page.tsx` (home/introduction), `[...slug]/page.tsx` (catch-all for other docs), `dashboard/page.tsx` (the drift check), `dashboard/editor/page.tsx` (the live editor), `not-found.tsx`.
- `src/app/api/v1/` - static route handlers for the REST API (`docs.json`, `docs/[slug]`, `nav.json`, `openapi.json`).
- `src/app/search-index.json/`, `src/app/llms.txt/`, `src/app/llms-full.txt/` - static route handlers serving the search index and the LLM-readable site files.
- `src/app/sitemap.ts`, `src/app/robots.ts` - `sitemap.xml` and `robots.txt`.
- `src/components/docs/` - the docs shell and MDX components, including `Sidebar`, `TopBar`, `SearchDialog`, `Mdx` (the MDX compiler/renderer), `Callout`, `Steps`, and `ApiOperation`.
- `src/components/dashboard/` - the drift check's `UpdateMonitoringPane`.
- `src/components/ThemeToggle.tsx` - the dark mode toggle.
- `src/components/MarkdownWorkspace.tsx` - the Editor's live preview component.
- `e2e/` - Playwright end-to-end tests.
- `packages/create-beacon-docs/` - the `npm create beacon-docs` scaffolder, published to npm separately. It's removed from sites it creates.

### Testing

```bash
npx playwright install chromium   # one-time browser download
npm run test:e2e
```

Runs the Playwright suite in `e2e/` against a dev server it starts automatically.

### Build

```bash
npm run build
```

Outputs a static site to `out/`. Preview exactly what will be deployed, with no Next.js server involved:

```bash
npm run start
```
