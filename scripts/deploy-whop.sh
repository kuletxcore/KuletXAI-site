#!/usr/bin/env bash
# Deploy to Whop, then undo the Worker name that `whop apps deploy` writes into wrangler.jsonc.
set -euo pipefail
cd "$(dirname "$0")/.."
if ! git diff --quiet -- wrangler.jsonc; then
  echo "wrangler.jsonc has uncommitted changes; commit or restore them first" >&2
  exit 1
fi
trap 'git checkout -- wrangler.jsonc' EXIT
if command -v whop >/dev/null; then whop apps deploy "$@"; else npx whop apps deploy "$@"; fi
