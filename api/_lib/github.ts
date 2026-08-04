import { Octokit } from "@octokit/rest";

/**
 * Read-only GitHub access. Every function here only ever performs GET-style
 * reads (compare, get-content) - there are deliberately no write/create/update
 * calls anywhere in this module. The token this client is constructed with
 * only needs Contents: Read-only permission.
 */
export function createGithubClient(token: string): Octokit {
  return new Octokit({ auth: token });
}

export interface ChangedFile {
  path: string;
  patch?: string;
  status: string;
}

export async function getChangedFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<ChangedFile[]> {
  const { data } = await octokit.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`,
  });
  return (data.files ?? []).map((file) => ({
    path: file.filename,
    patch: file.patch,
    status: file.status,
  }));
}

export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(data) || data.type !== "file" || typeof data.content !== "string") {
      return null;
    }
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "status" in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

/** Lists the repo-relative paths of every `.mdx` file directly under `folder`. */
export async function listMdxFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  folder: string,
  ref: string,
): Promise<string[]> {
  const { data } = await octokit.repos.getContent({ owner, repo, path: folder, ref });
  if (!Array.isArray(data)) return [];
  return data.filter((entry) => entry.type === "file" && entry.name.endsWith(".mdx")).map((entry) => entry.path);
}
