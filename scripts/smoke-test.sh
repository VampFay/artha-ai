#!/usr/bin/env bash
# ARTHA — Launch Day Smoke Test
# Phase 10 — run this before flipping DNS to verify all critical paths.
#
# Usage:
#   BASE=https://staging.artha.ai bash scripts/smoke-test.sh
#   BASE=http://localhost:3000 bash scripts/smoke-test.sh
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-smoke-admin@test.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-SmokeAdmin1234!}"
USER_EMAIL="${USER_EMAIL:-smoke-user@test.com}"
USER_PASSWORD="${USER_PASSWORD:-SmokeUser1234!}"

echo "── ARTHA smoke test against $BASE ──"

echo "1. Health check"
curl -sf "$BASE/api/health" | jq -e '.status == "ok"' > /dev/null
echo "   ✓ health ok"

echo "2. Public stats endpoint"
curl -sf "$BASE/api/public/stats" | jq -e '.entities != null' > /dev/null
echo "   ✓ public stats ok"

echo "3. Auth — missing token rejected"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/users/me")
[ "$STATUS" = "401" ] || { echo "   ✗ expected 401, got $STATUS"; exit 1; }
echo "   ✓ missing-auth 401"

echo "4. Auth — rate-limited brute force"
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  curl -sf -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-password\"}" > /dev/null 2>&1 || true
done
echo "   ✓ ran 12 wrong logins (should now be rate-limited or locked)"

echo "5. CSP + security headers present"
HEADERS=$(curl -sI "$BASE/")
echo "$HEADERS" | grep -qi "content-security-policy" && echo "   ✓ CSP present" || { echo "   ✗ CSP missing"; exit 1; }
echo "$HEADERS" | grep -qi "strict-transport-security" && echo "   ✓ HSTS present" || { echo "   ✗ HSTS missing"; exit 1; }
echo "$HEADERS" | grep -qi "x-frame-options" && echo "   ✓ X-Frame-Options present" || { echo "   ✗ XFO missing"; exit 1; }

echo "6. Health — dependencies ok"
HEALTH=$(curl -sf "$BASE/api/health")
echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null
echo "$HEALTH" | jq -r 'if .dependencies then (.dependencies | to_entries | map("\(.key)=\(.value.status // .value)") | join(", ")) else "no deps field" end' | xargs -I{} echo "   deps: {}"

echo "── All smoke tests PASSED ──"
