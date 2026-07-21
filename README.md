# Beacon

Beacon is a self-contained static-site generator for docs, tutorials, and product content, built on Next.js. Write pages in Markdown/MDX, configure the sidebar in one file, and get a plain static site with client-side search, syntax highlighting, and dark mode. No server, no vendor lock-in.

## Features

- **Markdown/MDX content** - pages live in `content/docs/*.mdx` with simple frontmatter, rendered with `next-mdx-remote`.
- **Config-driven sidebar** - `content/nav.config.ts` is the single source of truth for structure and ordering. A broken nav link fails the build instead of shipping a 404.
- **Client-side search** - `Cmd/Ctrl+K` opens a fuzzy search (via `fuse.js`) over a search index generated at build/request time. No external search service.
- **Syntax highlighting** - code blocks are highlighted at build time with Shiki (`rehype-pretty-code`), so highlighting doesn't depend on client-side JavaScript, and it follows the site's theme toggle rather than the OS setting.
- **Dark mode** - a toggle in the top bar, persisted to `localStorage`.
- **Plain static output** - `npm run build` produces a static `out/` directory: host it on Vercel, Netlify, GitHub Pages, or any static file host.
- **Playground** - a live Markdown editor with instant preview, included as one of the site's pages.

## Getting started

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
- `src/app/(site)/` - the docs shell (layout, sidebar, top bar) and routes: `page.tsx` (home/introduction), `[...slug]/page.tsx` (catch-all for other docs), `playground/page.tsx` (the live editor), `not-found.tsx`.
- `src/app/search-index.json/route.ts` - static route handler serving the search index.
- `src/components/docs/` - `Sidebar`, `TopBar`, `SearchDialog`, `ThemeToggle`, `Mdx` (the MDX compiler/renderer).
- `src/components/MarkdownWorkspace.tsx` - the Playground's editor + live preview.

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

### Netlify

`netlify.toml` is already set up (`command = "npm run build"`, `publish = "out"`). Connect the repository and deploy.

### GitHub Pages

1. Set the base path at build time if deploying under a subpath (`username.github.io/repo-name`):
   ```bash
   NEXT_PUBLIC_BASE_PATH=/repo-name npm run build
   ```
2. `public/.nojekyll` is already included so GitHub Pages serves the `_next/` asset directory correctly.
3. A ready-to-use workflow is included at `.github/workflows/deploy-gh-pages.yml` - it builds and deploys `out/` on every push to `main`. Enable it by setting the repository's Pages source to "GitHub Actions" (Settings → Pages).

### Any other static host

Upload the contents of `out/` - it's plain HTML/CSS/JS with no server-side requirements.

## Optional environment variables

- `NEXT_PUBLIC_BASE_PATH` - subpath the site is served from (e.g. `/repo-name` for GitHub Pages). Leave unset for root-domain hosts like Vercel/Netlify.
- `NEXT_PUBLIC_SITE_URL` - the site's full public URL, used in `sitemap.xml` and `robots.txt`.
