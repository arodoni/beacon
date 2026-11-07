import { test } from "node:test";
import assert from "node:assert/strict";
import { getActiveGroup, withApiReference } from "./nav.ts";

const guide = { title: "Guide", href: "/guide", items: [{ title: "Setup", href: "/setup" }] };
const generated = {
  title: "API Reference",
  href: "/api-reference/get-pet",
  items: [{ title: "Get pet", href: "/api-reference/get-pet", section: "Pets", method: "GET" }],
};

test("withApiReference leaves the nav alone when there's no spec", () => {
  assert.deepEqual(withApiReference([guide], null), [guide]);
});

test("withApiReference appends a group when no title matches", () => {
  assert.deepEqual(withApiReference([guide], generated), [guide, generated]);
});

test("withApiReference adds endpoints after a same-titled group's items", () => {
  const own = { title: "API Reference", href: "/intro", items: [{ title: "Intro", href: "/intro" }] };
  const [merged, ...rest] = withApiReference([own], generated);

  assert.equal(rest.length, 0);
  assert.equal(merged.href, "/intro");
  assert.deepEqual(merged.items, [...own.items, ...generated.items]);
});

test("getActiveGroup finds a group through a nested child", () => {
  const nested = { ...guide, items: [{ title: "Setup", href: "/setup", children: [{ title: "Deep", href: "/deep" }] }] };

  assert.equal(getActiveGroup("/deep/", [nested])?.title, "Guide");
});
