#!/usr/bin/env bash
# Usage: REFRESHED_GH_TOKEN=ghp_xxxxxxxx bash /home/z/my-project/scripts/push-rewritten-history.sh
#
# Push the rewritten git history (all commits by VampFay <fayV6969@hotmail.com>)
# to GitHub. The token currently stored in remote.origin.url is EXPIRED
# (GitHub API returns 401 Bad credentials), so we need a fresh PAT to push.
#
# To create a new PAT:
#   1. Visit https://github.com/settings/tokens
#   2. Click "Generate new token (classic)"
#   3. Scope: repo (Full control of private repositories)
#   4. Copy the ghp_xxx token
#   5. Run: REFRESHED_GH_TOKEN=ghp_xxx bash /home/z/my-project/scripts/push-rewritten-history.sh

set -euo pipefail

if [[ -z "${REFRESHED_GH_TOKEN:-}" ]]; then
  echo "ERROR: Set REFRESHED_GH_TOKEN env var to a fresh GitHub PAT."
  echo "  REFRESHED_GH_TOKEN=ghp_xxxx bash $0"
  exit 1
fi

cd /home/z/my-project

echo "=== 1. Update remote URL with fresh token ==="
git remote set-url origin "https://VampFay:${REFRESHED_GH_TOKEN}@github.com/VampFay/artha-ai.git"

echo ""
echo "=== 2. Verify token via GitHub API ==="
curl -s -o /tmp/ghresp.json -w "HTTP %{http_code}\n" \
  -H "Authorization: token ${REFRESHED_GH_TOKEN}" \
  https://api.github.com/repos/VampFay/artha-ai
if grep -q '"full_name"' /tmp/ghresp.json; then
  echo "Token is valid for repo: $(grep '"full_name"' /tmp/ghresp.json | head -1)"
else
  echo "ERROR: Token is invalid or lacks repo access."
  cat /tmp/ghresp.json | head -10
  exit 1
fi

echo ""
echo "=== 3. Force-push rewritten main ==="
git push --force origin main

echo ""
echo "=== 4. Delete remote dependabot branches (and their PRs / comments) ==="
git push origin --delete \
  dependabot/npm_and_yarn/eslint-10.6.0 \
  dependabot/npm_and_yarn/lucide-react-1.23.0 \
  dependabot/npm_and_yarn/prisma-7.8.0 \
  dependabot/npm_and_yarn/prisma/client-7.8.0 \
  dependabot/npm_and_yarn/typescript-6.0.3 || true

echo ""
echo "=== 5. Prune local remote-tracking refs ==="
git fetch --prune origin || true

echo ""
echo "=== DONE ==="
echo "Verify at: https://github.com/VampFay/artha-ai/commits/main"
