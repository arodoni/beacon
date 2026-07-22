---
name: browser-testing
description: How to launch and drive the Beacon app in a real headless browser with Playwright, to run the committed e2e suite or to do a one-off visual/behavioral check. Use this whenever asked to run, test, or verify Beacon in a browser, confirm a UI or CSS change actually renders correctly, debug something that "looks wrong" on a page, or write a new Playwright test - even if Playwright or e2e testing isn't mentioned by name. Prefer this over curl or reading the code alone for anything about how a page actually looks or behaves, since Tailwind/CSS and hydration bugs are invisible to both.
---

# Browser-testing Beacon

Beacon is a client-heavy Next.js app (live Markdown preview, dark mode, search),
so a lot of real bugs are only visible in an actual rendered page - not in the
JSX, not in a `curl` response. Playwright is already wired into this repo for
exactly that reason. Use it whenever you need to confirm what a user would
actually see, not just what the code says should happen.

## What's already set up

- `@playwright/test` is a devDependency (project-local, not just the global CLI).
- `playwright.config.ts` at the repo root: `testDir` is `./e2e`, `baseURL` is
  `http://localhost:3000`, and `webServer` auto-runs `npm run dev` (and reuses
  an already-running server instead of double-starting one).
- `e2e/editor.spec.ts` has existing tests for the live Markdown editor/preview.
- Chromium's browser binary is cached at `~/Library/Caches/ms-playwright`. If
  it's ever missing (fresh machine, wrong version), fetch it once with:
  ```bash
  npx playwright install chromium
  ```
- `playwright` is also installed globally on this laptop (`~/.npm-global`, on
  PATH) for ad-hoc CLI use (`playwright --version`, `playwright codegen`), but
  that's separate from the project's own `@playwright/test` dependency -
  scripts/tests that `import` Playwright still need the local devDependency,
  since Node resolves imports from the project's `node_modules`, not the
  global install.

## Path A: run the committed e2e suite

This is the default when asked to "run the tests" or "make sure nothing broke":

```bash
npm run test:e2e
```

This starts the dev server automatically if one isn't already running on
port 3000, runs everything in `e2e/`, and tears down cleanly. No manual
server management needed.

To add a new test, drop a `*.spec.ts` file in `e2e/` and use `@playwright/test`'s
`test`/`expect`/`page` - see `e2e/editor.spec.ts` for the existing style and
the selector gotcha below.

## Path B: one-off manual check (no test file)

Use this when investigating something specific - "does this render right,"
"did my CSS change break this page," "why does this look wrong" - where
writing a permanent test isn't the point, you just need to *see* the page.

1. Make sure the dev server is up (or let a script's own `chromium.launch()`
   hit it once it's running):
   ```bash
   npm run dev &
   ```
   If port 3000 is already held by a stale process, free it first:
   ```bash
   lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
   ```

2. Write a small standalone script rather than trying to inspect things by
   reading code or curling HTML - both miss CSS/JS-driven bugs entirely.
   The loop that has actually caught real bugs here:

   ```js
   import { chromium } from "playwright";

   const browser = await chromium.launch();
   const page = await browser.newPage();
   page.on("pageerror", (err) => console.log("pageerror:", err.message));
   page.on("console", (msg) => {
     if (msg.type() === "error") console.log("console error:", msg.text());
   });

   await page.goto("http://localhost:3000/<route>", { waitUntil: "networkidle" });
   await page.screenshot({ path: "/tmp/check.png", fullPage: true });

   // If a visual bug is suspected, don't just check the HTML structure -
   // check computed styles. Correct DOM with wrong CSS looks identical to
   // correct DOM in a curl/grep check.
   const info = await page.evaluate(() => {
     const el = document.querySelector("<selector>");
     return { fontSize: getComputedStyle(el).fontSize, text: el.textContent };
   });
   console.log(info);

   await browser.close();
   ```

3. **Actually look at the screenshot** (read it as an image) rather than only
   trusting the DOM/console output - a page can have perfectly correct HTML
   and still be visually broken (this is exactly how a `not-prose` class
   silently killing all heading/list styling in the live preview pane was
   found: the rendered `<h1>`/`<li>` markup was correct, but computed
   `font-size`/`font-weight` showed everything collapsed to plain-text
   sizing - only visible via screenshot + `getComputedStyle`, not via curl
   or reading the JSX).

## Gotcha: `.prose` is not a unique selector

Beacon wraps content in Tailwind Typography's `.prose` class in more than one
place - the site layout's `<article class="prose">` around every page's main
content, *and* the Editor's live preview `<div data-testid="markdown-preview"
class="prose">`. A bare `page.locator(".prose")` will resolve to multiple
elements and either throw (strict mode) or silently grab the wrong one.
Prefer `page.getByTestId(...)` or role/label-based locators
(`page.getByLabel("Markdown editor")`, `page.getByRole(...)`) over class or
positional selectors (`.nth(1)`) when targeting elements in this codebase.
