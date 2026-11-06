import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDocResponse, buildDocsResponse, buildNavResponse, buildOpenApiDocument } from "./api.ts";
import type { Doc } from "./content.ts";
import { siteUrl } from "./site.ts";

const doc = (slug: string, href: string, content = "Body\n"): Doc => ({
  slug,
  href,
  frontmatter: { title: `${slug} title`, description: `${slug} description` },
  content,
});

test("buildDocsResponse sorts pages by slug and builds absolute URLs", () => {
  const { docs } = buildDocsResponse([doc("quickstart", "/quickstart"), doc("introduction", "/")]);

  assert.deepEqual(docs.map((entry) => entry.slug), ["introduction", "quickstart"]);
  assert.deepEqual(docs[0], {
    slug: "introduction",
    title: "introduction title",
    description: "introduction description",
    url: `${siteUrl}/`,
    markdownUrl: `${siteUrl}/index.md`,
    apiUrl: `${siteUrl}/api/v1/docs/introduction.json`,
  });
  assert.equal(docs[1].markdownUrl, `${siteUrl}/quickstart.md`);
});

test("buildDocResponse converts MDX components to Markdown", () => {
  const { markdown } = buildDocResponse(
    doc("page", "/page", '<Callout type="tip">Read this.</Callout>\n\n[Link](/other)\n')
  );

  assert.match(markdown, /> \*\*Tip:\*\* Read this\./);
  assert.ok(markdown.includes(`[Link](${siteUrl}/other)`));
  assert.ok(!markdown.includes("<Callout"));
});

test("buildNavResponse adds an absolute URL to groups and items", () => {
  const { groups } = buildNavResponse([
    { title: "Guide", href: "/guide", items: [{ title: "Setup", href: "/setup" }] },
  ]);

  assert.deepEqual(groups, [
    {
      title: "Guide",
      href: "/guide",
      url: `${siteUrl}/guide`,
      items: [{ title: "Setup", href: "/setup", url: `${siteUrl}/setup` }],
    },
  ]);
});

test("buildOpenApiDocument describes every endpoint under the versioned server URL", () => {
  const document = buildOpenApiDocument();

  assert.deepEqual(document.servers, [{ url: `${siteUrl}/api/v1` }]);
  assert.deepEqual(Object.keys(document.paths), ["/docs.json", "/docs/{slug}.json", "/nav.json"]);
});
