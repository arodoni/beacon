#!/usr/bin/env bash
# Blocks `git commit` when .mdx files under content/ changed but haven't been
# through the docs-review skill. The skill runs this script with --mark after
# its review, which records a fingerprint of the current .mdx changes. Any
# later edit to those files changes the fingerprint and re-arms the gate.
#
#   docs-review-gate.sh          PreToolUse hook mode (reads hook JSON on stdin)
#   docs-review-gate.sh --mark   record the current changes as reviewed
#   docs-review-gate.sh --list   print the changed .mdx files under content/

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"
marker="$(git rev-parse --git-dir)/docs-review-ok"
pathspec=':(glob)content/**/*.mdx'

# Tracked changes (staged or not) plus untracked files, so `git add ... &&
# git commit` and `git commit -a` in one command are covered too.
changed_files() {
  {
    git diff --name-only HEAD -- "$pathspec"
    git ls-files --others --exclude-standard -- "$pathspec"
  } | sort -u
}

fingerprint() {
  {
    git diff HEAD -- "$pathspec"
    git ls-files --others --exclude-standard -z -- "$pathspec" | xargs -0 cat 2>/dev/null || true
  } | shasum -a 256 | cut -d' ' -f1
}

case "${1:-}" in
  --mark)
    fingerprint >"$marker"
    echo "Marked current content/ .mdx changes as reviewed."
    exit 0
    ;;
  --list)
    changed_files
    exit 0
    ;;
esac

command=$(jq -r '.tool_input.command // empty')
if ! grep -Eq '(^|[;&|(]|[[:space:]])git[[:space:]][^;&|]*commit([[:space:]]|$)' <<<"$command"; then
  exit 0
fi

files=$(changed_files)
[ -z "$files" ] && exit 0

if [ -f "$marker" ] && [ "$(cat "$marker")" = "$(fingerprint)" ]; then
  exit 0
fi

reason="These .mdx files under content/ changed but haven't been grammar-reviewed:
$files
Run the docs-review skill on them before committing."

jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
