#!/bin/bash
# Full demo recording — runs in one shell so all processes stay alive.
# Records the complete user journey through every feature.

# Don't exit on error — we want to capture the full journey even if some steps fail
set +e

echo "=========================================="
echo "FinSight AI — Full Demo Recording"
echo "=========================================="

# === 0. Stop any existing recording + close browser ===
agent-browser record stop > /dev/null 2>&1
agent-browser close > /dev/null 2>&1

# Kill any leftover servers
pkill -f "uvicorn app.main" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# === 1. Start backend + frontend, keep alive ===
echo "[1/12] Starting backend + frontend..."
cd /home/z/my-project/finsight-ai/backend
rm -f finsight.db
nohup env DATABASE_URL="sqlite+aiosqlite:///./finsight.db" python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/uvicorn.log 2>&1 &
BACKEND_PID=$!
cd /home/z/my-project/finsight-ai/frontend
nohup pnpm dev > /tmp/nextjs.log 2>&1 &
FRONTEND_PID=$!

# Wait for both to be ready
echo "  waiting for backend..."
for i in $(seq 1 15); do
  curl -sS http://127.0.0.1:8000/health > /dev/null 2>&1 && break
  sleep 1
done
echo "  backend ready (pid $BACKEND_PID)"

echo "  waiting for frontend..."
for i in $(seq 1 25); do
  curl -sS -o /dev/null http://127.0.0.1:3000 2>&1 && break
  sleep 1
done
echo "  frontend ready (pid $FRONTEND_PID)"

# Verify both are actually up
curl -sS http://127.0.0.1:8000/health > /dev/null 2>&1 && echo "  ✓ backend responding" || echo "  ✗ backend NOT responding"
curl -sS -o /dev/null http://127.0.0.1:3000 2>&1 && echo "  ✓ frontend responding" || echo "  ✗ frontend NOT responding"

# === 2. Seed demo data ===
echo "[2/12] Seeding demo data..."
cd /home/z/my-project/finsight-ai/backend
DATABASE_URL="sqlite+aiosqlite:///./finsight.db" python3 scripts/seed.py 2>&1 | tail -2
DATABASE_URL="sqlite+aiosqlite:///./finsight.db" python3 scripts/seed_demo_data.py 2>&1 | tail -3

# === 3. Set up browser ===
echo "[3/12] Setting up browser..."
agent-browser set viewport 1440 900 2>&1 | tail -1
agent-browser open http://127.0.0.1:3000 2>&1 | tail -2
agent-browser wait --load networkidle 2>&1 | tail -1
agent-browser wait 2000 > /dev/null 2>&1

# === 4. Start recording ===
echo "[4/12] Starting video recording..."
agent-browser record start /home/z/my-project/download/FinSight_AI_Demo.webm 2>&1 | tail -2
agent-browser wait 3000 > /dev/null 2>&1

# === 5. Landing page (let it breathe) ===
echo "[5/12] Recording: Landing page (3s)..."
agent-browser wait 3000 > /dev/null 2>&1

# === 6. Click Get Started → Login ===
echo "[6/12] Recording: Click 'Get Started' → Login page..."
agent-browser find role button click --name "Get Started — Free" 2>&1 | tail -1
agent-browser wait --url "/login" 2>&1 | tail -1
agent-browser wait 2500 > /dev/null 2>&1

# === 7. Login ===
echo "[7/12] Recording: Login as demo user..."
# Get fresh refs
REFS=$(agent-browser snapshot -i 2>&1)
EMAIL_REF=$(echo "$REFS" | grep 'textbox "you@example' | grep -o 'e[0-9]*' | head -1)
PASS_REF=$(echo "$REFS" | grep 'textbox "Min 8 chars' | grep -o 'e[0-9]*' | head -1)
# Find the Login button that's NOT the tab toggle (the form submit one is usually last)
LOGIN_BTN=$(echo "$REFS" | grep 'button "Login"' | tail -1 | grep -o 'e[0-9]*' | head -1)
echo "  refs: email=$EMAIL_REF pass=$PASS_REF login=$LOGIN_BTN"
agent-browser fill @$EMAIL_REF "demo@finsight.ai" > /dev/null 2>&1
agent-browser wait 600 > /dev/null 2>&1
agent-browser fill @$PASS_REF "demo1234" > /dev/null 2>&1
agent-browser wait 600 > /dev/null 2>&1
agent-browser click @$LOGIN_BTN > /dev/null 2>&1
agent-browser wait 3000 > /dev/null 2>&1
echo "  after login url: $(agent-browser get url 2>&1 | tail -1)"

# === 8. Dashboard ===
echo "[8/12] Recording: Dashboard (5s)..."
agent-browser wait 3000 > /dev/null 2>&1
agent-browser scroll down 300 > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# === 9. Documents page ===
echo "[9/12] Recording: Documents page..."
agent-browser find role link click --name "Documents" > /dev/null 2>&1
agent-browser wait --url "/documents" 2>&1 | tail -1
agent-browser wait 2500 > /dev/null 2>&1
agent-browser scroll down 200 > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# === 10. Tax page ===
echo "[10/12] Recording: Tax Readiness page..."
agent-browser find role link click --name "Tax Readiness" > /dev/null 2>&1
agent-browser wait --url "/tax" 2>&1 | tail -1
agent-browser wait 3000 > /dev/null 2>&1
agent-browser scroll down 400 > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1
agent-browser scroll down 400 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# === 11. Finance page ===
echo "[11/12a] Recording: Financial Health page..."
agent-browser find role link click --name "Financial Health" > /dev/null 2>&1
agent-browser wait --url "/finance" 2>&1 | tail -1
agent-browser wait 3000 > /dev/null 2>&1
agent-browser scroll down 300 > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# === 12. Goals page ===
echo "[11/12b] Recording: Goals page..."
agent-browser find role link click --name "Goals" > /dev/null 2>&1
agent-browser wait --url "/goals" 2>&1 | tail -1
agent-browser wait 2500 > /dev/null 2>&1
# Click on the goal card to see detail
agent-browser find text "Emergency Fund" click > /dev/null 2>&1
agent-browser wait 3000 > /dev/null 2>&1
agent-browser scroll down 300 > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# === 13. Assistant page ===
echo "[11/12c] Recording: AI Assistant page..."
agent-browser find role link click --name "Assistant" > /dev/null 2>&1
agent-browser wait --url "/assistant" 2>&1 | tail -1
agent-browser wait 2500 > /dev/null 2>&1
# Click a suggested question
agent-browser find role button click --name "Why is my tax readiness score low?" > /dev/null 2>&1
agent-browser wait 4000 > /dev/null 2>&1

# === 14. Reports page ===
echo "[11/12d] Recording: Reports page..."
agent-browser find role link click --name "Reports" > /dev/null 2>&1
agent-browser wait --url "/reports" 2>&1 | tail -1
agent-browser wait 2500 > /dev/null 2>&1
agent-browser scroll down 300 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# === 15. Settings page ===
echo "[11/12e] Recording: Settings page..."
agent-browser find role link click --name "Settings" > /dev/null 2>&1
agent-browser wait --url "/settings" 2>&1 | tail -1
agent-browser wait 2500 > /dev/null 2>&1
agent-browser scroll down 400 > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# === 16. Back to dashboard, logout ===
echo "[12/12] Recording: Back to dashboard + logout..."
agent-browser find role link click --name "Dashboard" > /dev/null 2>&1
agent-browser wait --url "/dashboard" 2>&1 | tail -1
agent-browser wait 2000 > /dev/null 2>&1
agent-browser find role button click --name "Logout" > /dev/null 2>&1
agent-browser wait 3000 > /dev/null 2>&1

# === Stop recording ===
echo "Stopping recording..."
agent-browser record stop 2>&1 | tail -3

echo "=========================================="
echo "Demo video saved!"
ls -lh /home/z/my-project/download/FinSight_AI_Demo.webm 2>&1
echo "=========================================="

# Cleanup
agent-browser close > /dev/null 2>&1
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "done"
