#!/usr/bin/env bash
# Start prod server, run all smoke tests, kill server.
# Run: bash /home/z/my-project/scripts/smoke-prod.sh
set -uo pipefail

cd /home/z/my-project

# Clean any stale state
rm -f /tmp/artha-*.log /tmp/h.json /tmp/r.html
pkill -f "server.js" 2>/dev/null || true
sleep 1

echo "── Starting prod server ──"
bun .next/standalone/server.js > /tmp/artha-prod.log 2>&1 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null" EXIT

# Wait for "Ready" up to 15s
for i in $(seq 1 15); do
  if curl -sf -o /dev/null http://localhost:3000/api/ready 2>/dev/null \
     || curl -sf -o /dev/null http://localhost:3000/api/health 2>/dev/null; then
    break
  fi
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Server died during startup. Log:"
    cat /tmp/artha-prod.log
    exit 1
  fi
  sleep 1
done

echo "Server PID: $SERVER_PID"
echo ""

# ── Health endpoint (no reverse proxy headers — direct HTTP) ──
echo "1. GET /api/health"
STATUS=$(curl -s -o /tmp/h.json -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$STATUS" = "200" ]; then
  echo "   ✓ HTTP 200 — $(jq -c . /tmp/h.json 2>/dev/null || head -c 100 /tmp/h.json)"
elif [ "$STATUS" = "301" ]; then
  echo "   ⚠ HTTP 301 (middleware HTTPS redirect — expected, reverse proxy handles this in prod)"
else
  echo "   ✗ HTTP $STATUS"
  cat /tmp/h.json | head -5
fi

# ── Health via reverse-proxy headers ──
echo "2. GET /api/health (with x-forwarded-proto: https)"
STATUS=$(curl -s -o /tmp/h.json -w "%{http_code}" \
  -H "x-forwarded-proto: https" -H "x-forwarded-host: localhost" \
  http://localhost:3000/api/health || echo "000")
if [ "$STATUS" = "200" ]; then
  echo "   ✓ HTTP 200 — $(jq -c . /tmp/h.json 2>/dev/null || head -c 100 /tmp/h.json)"
else
  echo "   ✗ HTTP $STATUS"
  cat /tmp/h.json | head -5
fi

# ── /api/ready ──
echo "3. GET /api/ready"
STATUS=$(curl -s -o /tmp/h.json -w "%{http_code}" \
  -H "x-forwarded-proto: https" http://localhost:3000/api/ready || echo "000")
if [ "$STATUS" = "200" ]; then
  echo "   ✓ HTTP 200 — $(jq -c . /tmp/h.json 2>/dev/null || head -c 100 /tmp/h.json)"
else
  echo "   ⚠ HTTP $STATUS (may be 404 if no /api/ready route — not a blocker)"
fi

# ── Public stats ──
echo "4. GET /api/public/stats"
STATUS=$(curl -s -o /tmp/h.json -w "%{http_code}" \
  -H "x-forwarded-proto: https" http://localhost:3000/api/public/stats || echo "000")
if [ "$STATUS" = "200" ]; then
  echo "   ✓ HTTP 200 — body keys: $(jq -r 'keys | join(", ")' /tmp/h.json 2>/dev/null || echo 'parse-failed')"
else
  echo "   ✗ HTTP $STATUS"
fi

# ── Root page ──
echo "5. GET / (login page)"
STATUS=$(curl -s -o /tmp/r.html -w "%{http_code}" \
  -H "x-forwarded-proto: https" http://localhost:3000/ || echo "000")
if [ "$STATUS" = "200" ]; then
  SIZE=$(wc -c < /tmp/r.html)
  echo "   ✓ HTTP 200 — HTML size: $SIZE bytes"
  # Check for some expected string
  if grep -qi "artha" /tmp/r.html; then
    echo "   ✓ contains 'artha' in HTML"
  fi
else
  echo "   ✗ HTTP $STATUS"
fi

# ── Missing auth = 401 ──
echo "6. GET /api/users/me (no auth — should be 401)"
STATUS=$(curl -s -o /tmp/h.json -w "%{http_code}" \
  -H "x-forwarded-proto: https" http://localhost:3000/api/users/me || echo "000")
if [ "$STATUS" = "401" ]; then
  echo "   ✓ HTTP 401 (correctly rejected missing auth)"
else
  echo "   ⚠ HTTP $STATUS (expected 401)"
fi

# ── Invalid login = 401 ──
echo "7. POST /api/auth/login (invalid creds)"
STATUS=$(curl -s -o /tmp/h.json -w "%{http_code}" \
  -X POST -H "Content-Type: application/json" -H "x-forwarded-proto: https" \
  -d '{"email":"nobody@nowhere.test","password":"wrong-pass"}' \
  http://localhost:3000/api/auth/login || echo "000")
if [ "$STATUS" = "401" ]; then
  echo "   ✓ HTTP 401 (correctly rejected invalid creds)"
else
  echo "   ⚠ HTTP $STATUS (expected 401)"
fi

# ── Security headers ──
echo "8. Security headers present"
HEADERS=$(curl -sI -H "x-forwarded-proto: https" http://localhost:3000/)
for H in "Strict-Transport-Security" "Content-Security-Policy" "X-Frame-Options" "X-Content-Type-Options" "Referrer-Policy"; do
  if echo "$HEADERS" | grep -qi "$H"; then
    echo "   ✓ $H"
  else
    echo "   ✗ $H MISSING"
  fi
done

# ── Maintenance page route exists ──
echo "9. GET /maintenance"
STATUS=$(curl -s -o /tmp/r.html -w "%{http_code}" \
  -H "x-forwarded-proto: https" http://localhost:3000/maintenance || echo "000")
if [ "$STATUS" = "200" ]; then
  SIZE=$(wc -c < /tmp/r.html)
  echo "   ✓ HTTP 200 — HTML size: $SIZE bytes"
else
  echo "   ✗ HTTP $STATUS"
fi

# ── 404 page ──
echo "10. GET /this-page-doesnt-exist (404)"
STATUS=$(curl -s -o /tmp/r.html -w "%{http_code}" \
  -H "x-forwarded-proto: https" http://localhost:3000/this-page-doesnt-exist || echo "000")
if [ "$STATUS" = "404" ]; then
  echo "   ✓ HTTP 404 (custom not-found page rendered)"
else
  echo "   ⚠ HTTP $STATUS"
fi

echo ""
echo "── Cleanup ──"
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "── All smoke tests complete ──"
