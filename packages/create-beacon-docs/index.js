#!/usr/bin/env node
// Scaffolds a new Beacon docs site: downloads the Beacon repository from
// GitHub, sets the product and project names, then optionally starts a Git
// repository and installs dependencies. Beacon's own docs are replaced with the
// starter pages in template/. Uses only Node built-ins.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const REPO = "arodoni/beacon";

// Files in the Beacon repository that only make sense for Beacon itself.
const REPO_ONLY_PATHS = ["packages", ".github/CODEOWNERS", ".claude/settings.local.json"];

const TEMPLATE_DIR = fileURLToPath(new URL("./template", import.meta.url));

const HELP = `Usage: npm create beacon-docs@latest [directory] -- [options]

Options:
  --product-name <name>  Product name shown on the site (default: from directory)
  --project-name <name>  Package and repository name (default: directory name)
  --ref <ref>            Beacon branch or tag to download (default: main)
  --no-git               Don't start a Git repository
  --no-install           Don't install dependencies
  -y, --yes              Accept defaults without prompting
  -h, --help             Show this help`;

function fail(message) {
  console.error(`\nError: ${message}`);
  process.exit(1);
}

function toProjectName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-~]+/g, "-")
    .replace(/^[-.~]+|-+$/g, "");
}

function toProductName(projectName) {
  return projectName
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function isValidProjectName(name) {
  return /^[a-z0-9][a-z0-9-._~]*$/.test(name) && name.length <= 214;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function packageManager() {
  const agent = process.env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";
  return "npm";
}

async function download(ref, targetDir) {
  const url = `https://codeload.github.com/${REPO}/tar.gz/${encodeURIComponent(ref)}`;
  const response = await fetch(url);
  if (!response.ok) {
    fail(`Couldn't download Beacon (${ref}) from ${url}: HTTP ${response.status}.`);
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "create-beacon-docs-"));
  const archive = path.join(tempDir, "beacon.tar.gz");
  try {
    writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
    const extracted = spawnSync("tar", ["-xzf", archive, "-C", targetDir, "--strip-components=1"], {
      stdio: "inherit",
    });
    if (extracted.status !== 0) fail("Couldn't extract the Beacon archive. Make sure `tar` is installed.");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function replaceInFile(file, replacements) {
  if (!existsSync(file)) return;
  let content = readFileSync(file, "utf8");
  for (const [pattern, value] of replacements) content = content.replace(pattern, value);
  writeFileSync(file, content);
}

// The product name is read from NEXT_PUBLIC_PRODUCT_NAME, so start .env.local
// from .env.example with that value filled in. Next.js expands $VAR in env
// files, so escape $.
function writeEnvLocal(targetDir, productName) {
  const example = path.join(targetDir, ".env.example");
  const line = `NEXT_PUBLIC_PRODUCT_NAME=${JSON.stringify(productName).replaceAll("$", "\\$")}`;
  let content = existsSync(example) ? readFileSync(example, "utf8") : "";
  content = /^NEXT_PUBLIC_PRODUCT_NAME=.*$/m.test(content)
    ? content.replace(/^NEXT_PUBLIC_PRODUCT_NAME=.*$/m, () => line)
    : `${content}${content && !content.endsWith("\n") ? "\n" : ""}${line}\n`;
  writeFileSync(path.join(targetDir, ".env.local"), content);
}

function customize(targetDir, { productName, projectName }) {
  for (const repoOnly of REPO_ONLY_PATHS) {
    rmSync(path.join(targetDir, repoOnly), { recursive: true, force: true });
  }

  // Swap Beacon's docs for the starter pages. Other files in content/docs/,
  // such as CLAUDE.md, are kept.
  const docsDir = path.join(targetDir, "content/docs");
  for (const file of readdirSync(docsDir)) {
    if (file.endsWith(".mdx")) rmSync(path.join(docsDir, file));
  }
  cpSync(path.join(TEMPLATE_DIR, "content"), path.join(targetDir, "content"), { recursive: true });

  replaceInFile(path.join(targetDir, "src/lib/site.ts"), [
    [/export const projectName = ".*?";/, `export const projectName = ${JSON.stringify(projectName)};`],
  ]);

  writeEnvLocal(targetDir, productName);

  for (const file of ["package.json", "package-lock.json"]) {
    const filePath = path.join(targetDir, file);
    if (!existsSync(filePath)) continue;
    const json = JSON.parse(readFileSync(filePath, "utf8"));
    json.name = projectName;
    if (json.packages?.[""]) json.packages[""].name = projectName;
    writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
  }
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        "product-name": { type: "string" },
        "project-name": { type: "string" },
        ref: { type: "string", default: "main" },
        "no-git": { type: "boolean", default: false },
        "no-install": { type: "boolean", default: false },
        yes: { type: "boolean", short: "y", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (error) {
    fail(`${error.message}\n\n${HELP}`);
  }
  const { values, positionals } = parsed;

  if (values.help) {
    console.log(HELP);
    return;
  }

  const interactive = process.stdin.isTTY && !values.yes;
  const prompt = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  const ask = async (question, fallback) => {
    if (!prompt) return fallback;
    const answer = await prompt.question(`${question} (${fallback}): `);
    return answer.trim() || fallback;
  };

  try {
    const directory = positionals[0] ?? (await ask("Project directory", "my-docs"));
    const targetDir = path.resolve(directory);
    if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
      fail(`${targetDir} already exists and isn't empty.`);
    }

    const projectName =
      values["project-name"] ?? (await ask("Project name", toProjectName(path.basename(targetDir))));
    if (!isValidProjectName(projectName)) {
      fail(`"${projectName}" isn't a valid project name. Use lowercase letters, numbers, and hyphens.`);
    }

    const productName = values["product-name"] ?? (await ask("Product name", toProductName(projectName)));
    if (!productName.trim()) fail("The product name can't be empty.");

    prompt?.close();

    console.log(`\nCreating ${productName} in ${targetDir}...`);
    mkdirSync(targetDir, { recursive: true });
    await download(values.ref, targetDir);
    customize(targetDir, { productName, projectName });

    if (!values["no-git"]) {
      const committed =
        run("git", ["init", "--quiet", "--initial-branch=main"], targetDir) &&
        run("git", ["add", "--all"], targetDir) &&
        run("git", ["commit", "--quiet", "-m", "Initial commit from create-beacon-docs"], targetDir);
      if (!committed) console.warn("\nCouldn't create the initial Git commit. You can run `git init` yourself.");
    }

    const pm = packageManager();
    if (!values["no-install"]) {
      console.log(`\nInstalling dependencies with ${pm}...`);
      if (!run(pm, ["install"], targetDir)) fail(`\`${pm} install\` failed. Run it again in ${targetDir}.`);
    }

    const cd = path.relative(process.cwd(), targetDir) || ".";
    console.log(`\nDone. Next steps:\n\n  cd ${cd}`);
    if (values["no-install"]) console.log(`  ${pm} install`);
    console.log(`  ${pm} run dev\n`);
    console.log(
      `The product name is set in .env.local, which isn't committed. Before you deploy, set\n` +
        `NEXT_PUBLIC_PRODUCT_NAME=${productName} in your hosting provider's dashboard too.\n`,
    );
  } finally {
    prompt?.close();
  }
}

main().catch((error) => fail(error.message));
