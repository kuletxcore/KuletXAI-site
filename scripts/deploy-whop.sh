#!/usr/bin/env bash
# Deploy to Whop, then undo what `whop apps deploy` rewrites: the Worker name in wrangler.jsonc and the deploy script in package.json.
set -euo pipefail
cd "$(dirname "$0")/.."
if ! git diff --quiet -- wrangler.jsonc package.json; then
  echo "wrangler.jsonc or package.json has uncommitted changes; commit or restore them first" >&2
  exit 1
fi
trap 'git checkout -- wrangler.jsonc package.json' EXIT
# Prefer an installed Whop CLI over the project's node_modules copy, which `npm run` puts first on PATH
WHOP=$(type -ap whop | grep -v node_modules | head -1 || true)
if [ -n "$WHOP" ]; then "$WHOP" apps deploy "$@"; else npx whop apps deploy "$@"; fi
