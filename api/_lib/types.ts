export interface PullRequestWebhookPayload {
  action: string;
  pull_request: {
    number: number;
    merged: boolean;
    merge_commit_sha: string;
    html_url: string;
    base: { ref: string; sha: string };
    head: { ref: string; sha: string };
    user: { login: string };
    title: string;
    labels?: { name: string }[];
  };
  repository: {
    owner: { login: string };
    name: string;
  };
}

export interface ProposedFile {
  path: string;
  content: string;
}

export interface ProposeDocUpdatesResult {
  needs_update: boolean;
  summary: string;
  files: ProposedFile[];
  nav_config_content: string | null;
}

export interface StoredSuggestion {
  sourcePrNumber: number;
  sourcePrUrl: string;
  sourcePrTitle: string;
  summary: string;
  files: ProposedFile[];
  navConfigContent: string | null;
  generatedAt: string;
}
