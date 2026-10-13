# create-beacon-docs

Create a new [Beacon](https://github.com/arodoni/beacon) docs site.

```bash
npm create beacon-docs@latest my-docs
```

The command does the following:

1. Downloads the latest Beacon source from GitHub into `my-docs`.

1. Sets the project name in `src/lib/site.ts`, `package.json`, and
   `package-lock.json`.

1. Creates `.env.local` from `.env.example`, with `NEXT_PUBLIC_PRODUCT_NAME` set
   to your product name. The file isn't committed, so also set
   `NEXT_PUBLIC_PRODUCT_NAME` in your hosting provider's dashboard before you
   deploy.

1. Replaces Beacon's own docs with the starter pages in `template/content/`: an
   overview page, a getting-started page, and a matching `nav.config.ts`.

1. Starts a Git repository with an initial commit.

1. Installs dependencies with the package manager you ran it with.

It prompts for anything you don't pass on the command line.

## Options

Pass options after `--` when you use `npm create`:

```bash
npm create beacon-docs@latest my-docs -- --product-name "Acme Docs" --yes
```

| Option | Description |
| --- | --- |
| `--product-name <name>` | Product name shown on the site. Defaults to the directory name in title case. |
| `--project-name <name>` | Package and repository name. Defaults to the directory name. |
| `--ref <ref>` | Beacon branch or tag to download. Defaults to `main`. |
| `--no-git` | Don't start a Git repository. |
| `--no-install` | Don't install dependencies. |
| `-y`, `--yes` | Accept defaults without prompting. |
| `-h`, `--help` | Show help. |

## Requirements

- Node.js 20.9.0 or later

- `tar`, which is included with macOS, Linux, and Windows 10 or later

## Develop locally

Run the script directly from the Beacon repository:

```bash
node packages/create-beacon-docs/index.js ../my-docs --no-install
```

The script always downloads Beacon from GitHub, so local changes outside this
directory aren't included until they're pushed.

## Publish

From this directory:

```bash
npm publish
```
