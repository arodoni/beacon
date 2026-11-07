import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
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

test("buildNavResponse includes nested children with absolute URLs", () => {
  const { groups } = buildNavResponse([
    {
      title: "Guide",
      href: "/guide",
      items: [{ title: "Setup", href: "/setup", children: [{ title: "Details", href: "/details" }] }],
    },
  ]);

  assert.deepEqual(groups[0].items, [
    {
      title: "Setup",
      href: "/setup",
      url: `${siteUrl}/setup`,
      children: [{ title: "Details", href: "/details", url: `${siteUrl}/details` }],
    },
  ]);
});

test("buildOpenApiDocument describes every endpoint under the versioned server URL", () => {
  const document = buildOpenApiDocument();

  assert.deepEqual(document.servers, [{ url: `${siteUrl}/api/v1` }]);
  assert.deepEqual(Object.keys(document.paths), ["/docs.json", "/docs/{slug}.json", "/nav.json", "/openapi.json"]);
});

// Scaffolded sites don't ship Beacon's own spec, so there's nothing to compare.
const specPath = path.join(process.cwd(), "content/openapi.yaml");
test("content/openapi.yaml matches buildOpenApiDocument", { skip: !fs.existsSync(specPath) }, () => {
  type Spec = {
    paths: Record<string, Record<string, { operationId: string; summary: string }>>;
    components: { schemas: Record<string, unknown> };
  };
  const operations = (spec: Spec) =>
    Object.entries(spec.paths).flatMap(([apiPath, methods]) =>
      Object.entries(methods).map(([method, { operationId, summary }]) => ({ apiPath, method, operationId, summary }))
    );

  const file = parseYaml(fs.readFileSync(specPath, "utf8")) as Spec;
  const built = buildOpenApiDocument() as unknown as Spec;

  assert.deepEqual(operations(file), operations(built));
  assert.deepEqual(Object.keys(file.components.schemas).sort(), Object.keys(built.components.schemas).sort());
});
