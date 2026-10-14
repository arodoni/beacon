# Beacon

Beacon is a self-contained static-site generator for docs, tutorials, and product content, built on Next.js. Write pages in Markdown/MDX, configure the sidebar in one file, and get a plain static site with client-side search, syntax highlighting, and dark mode. No server, no vendor lock-in.

## Features

- **Markdown/MDX content** - pages live in `content/docs/*.mdx` with simple frontmatter, rendered with `next-mdx-remote`.
- **Config-driven sidebar** - `content/nav.config.ts` is the single source of truth for structure and ordering. A broken nav link fails the build instead of shipping a 404.
- **Client-side search** - `Cmd/Ctrl+K` opens a fuzzy search (via `fuse.js`) over a search index generated at build/request time. No external search service.
- **Syntax highlighting** - code blocks are highlighted at build time with Shiki (`rehype-pretty-code`), so highlighting doesn't depend on client-side JavaScript, and it follows the site's theme toggle rather than the OS setting.
- **Dark mode** - a toggle in the top bar, persisted to `localStorage`.
- **Plain static output** - `npm run build` produces a static `out/` directory: host it on Vercel.
- **Editor** - a live Markdown editor with instant preview, included as one of the site's pages.

## Getting started

To create a new site from Beacon, run:

```bash
npm create beacon-docs@latest my-docs
```

To work on Beacon itself, clone this repository and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding a page

1. Create `content/docs/your-page.mdx` with frontmatter:
   ```md
   ---
   title: Your Page
   description: A short description for meta tags and search.
   ---

   Your content here.
   ```
2. Add it to `content/nav.config.ts`:
   ```ts
   { title: "Your Page", href: "/your-page" }
   ```

The page is picked up by the catch-all route, included in search, and added to the sitemap automatically on the next build.

## Project structure

- `content/docs/` - MDX content pages.
- `content/nav.config.ts` - sidebar structure.
- `src/lib/content.ts` - content loading, nav validation, and search-index generation, shared by the pages and the search route.
- `src/app/(site)/` - the docs shell (layout, sidebar, top bar) and routes: `page.tsx` (home/introduction), `[...slug]/page.tsx` (catch-all for other docs), `editor/page.tsx` (the live editor), `not-found.tsx`.
- `src/app/search-index.json/route.ts` - static route handler serving the search index.
- `src/components/docs/` - `Sidebar`, `TopBar`, `SearchDialog`, `ThemeToggle`, `Mdx` (the MDX compiler/renderer).
- `src/components/MarkdownWorkspace.tsx` - the Editor's live preview component.
- `e2e/` - Playwright end-to-end tests.
- `packages/create-beacon-docs/` - the `npm create beacon-docs` scaffolder, published to npm separately. It's removed from sites it creates.

## Testing

```bash
npx playwright install chromium   # one-time browser download
npm run test:e2e
```

Runs the Playwright suite in `e2e/` against a dev server it starts automatically.

## Build

```bash
npm run build
```

Outputs a static site to `out/`. Preview exactly what will be deployed, with no Next.js server involved:

```bash
npm run start
```

## Deploying

### Vercel

Connect the repository and deploy with the default settings - Vercel detects the static export automatically.

## Optional environment variables

- `BASE_PATH` - subpath the site is served from (e.g. `/repo-name`). Leave unset for root-domain hosts like Vercel.
- `SITE_URL` - the site's full public URL, used for canonical links, Open Graph tags, `sitemap.xml`, `robots.txt`, `/llms.txt`, and `/llms-full.txt`. Defaults to `https://example.com` if unset.
