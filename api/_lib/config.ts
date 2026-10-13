export interface WatchConfig {
  githubRepoOwner: string;
  githubRepoName: string;
  watchedDocsFolder: string;
  watchedNavConfigPath: string;
  automationEnabled: boolean;
}

// The repo owner and name have no default: they're empty when unset, and the
// webhook refuses to run until both are configured.
const DEFAULTS: WatchConfig = {
  githubRepoOwner: "",
  githubRepoName: "",
  watchedDocsFolder: "content/docs",
  watchedNavConfigPath: "content/nav.config.ts",
  automationEnabled: false,
};

export function loadConfig(env: Record<string, string | undefined> = process.env): WatchConfig {
  return {
    githubRepoOwner: env.GITHUB_REPO_OWNER || DEFAULTS.githubRepoOwner,
    githubRepoName: env.GITHUB_REPO_NAME || DEFAULTS.githubRepoName,
    watchedDocsFolder: env.WATCHED_DOCS_FOLDER || DEFAULTS.watchedDocsFolder,
    watchedNavConfigPath: env.WATCHED_NAV_CONFIG_PATH || DEFAULTS.watchedNavConfigPath,
    automationEnabled: env.DOC_UPDATE_AUTOMATION_ENABLED === "true",
  };
}

export function isWatchedPath(path: string, config: WatchConfig): boolean {
  const docsPrefix = `${config.watchedDocsFolder}/`;
  return (path.startsWith(docsPrefix) && path.endsWith(".mdx")) || path === config.watchedNavConfigPath;
}
