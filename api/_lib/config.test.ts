import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, isWatchedPath } from "./config.ts";

test("loadConfig falls back to Beacon's current defaults when env vars are unset", () => {
  const config = loadConfig({});
  assert.deepEqual(config, {
    githubRepoOwner: "arodoni",
    githubRepoName: "beacon",
    watchedDocsFolder: "content/docs",
    watchedNavConfigPath: "content/nav.config.ts",
  });
});

test("loadConfig honors overrides for every field", () => {
  const config = loadConfig({
    GITHUB_REPO_OWNER: "someone-else",
    GITHUB_REPO_NAME: "other-repo",
    WATCHED_DOCS_FOLDER: "docs",
    WATCHED_NAV_CONFIG_PATH: "docs/nav.ts",
  });
  assert.deepEqual(config, {
    githubRepoOwner: "someone-else",
    githubRepoName: "other-repo",
    watchedDocsFolder: "docs",
    watchedNavConfigPath: "docs/nav.ts",
  });
});

const defaultConfig = loadConfig({});

test("isWatchedPath matches an .mdx file under the watched docs folder", () => {
  assert.equal(isWatchedPath("content/docs/configure.mdx", defaultConfig), true);
});

test("isWatchedPath matches the nav config path exactly", () => {
  assert.equal(isWatchedPath("content/nav.config.ts", defaultConfig), true);
});

test("isWatchedPath rejects a non-.mdx file under the docs folder", () => {
  assert.equal(isWatchedPath("content/docs/CLAUDE.md", defaultConfig), false);
});

test("isWatchedPath rejects an .mdx file outside the docs folder", () => {
  assert.equal(isWatchedPath("src/docs/configure.mdx", defaultConfig), false);
});

test("isWatchedPath rejects unrelated app code", () => {
  assert.equal(isWatchedPath("src/lib/seo.ts", defaultConfig), false);
});
