# CLAUDE.md

Guidance for working with files in this directory (`content/docs/`). Migrated out of the project-root `AGENTS.md` since it only applies here.

## AI retrieval optimization

Every page under `content/docs/` is statically prerendered and exposed through `/sitemap.xml`, `/robots.txt`, and `/llms.txt` (the last one is a plain-text index of all docs for LLM/AI crawlers, generated at build time in `src/app/llms.txt/route.ts`). Nothing about this requires a manual step for new pages, but it does depend on frontmatter being meaningful:

- Every doc's `title` and `description` frontmatter fields are load-bearing: they drive the `<title>` tag, meta description, canonical URL, Open Graph tags (via `buildDocMetadata` in `src/lib/seo.ts`), the client search index, and the `/llms.txt` listing. Write them as real, specific summaries, not filler.
- New docs are picked up automatically by `getAllDocSlugs`/`getAllDocsMeta` (`src/lib/content.ts`) as soon as the `.mdx` file exists and has frontmatter, so `/llms.txt` and the sitemap stay in sync without edits.
- Keep one H1 per page and a real H2/H3 hierarchy underneath it. Headings get slugged IDs and anchor links automatically (`rehype-slug` + `rehype-autolink-headings` in `src/components/docs/Mdx.tsx`), so each section should read as a self-contained chunk, since retrieval systems may quote a single section rather than the whole page.
- The canonical site URL comes from the `NEXT_PUBLIC_SITE_URL` env var (`src/lib/site.ts`); set it at build/deploy time so canonical links, OG tags, the sitemap, and `/llms.txt` don't fall back to `https://example.com`.
