#!/bin/bash
# Streamlined demo recording — under 4 minutes, every feature, tight pacing.
set +e

OUT=/home/z/my-project/download/FinSight_AI_Demo.webm

# Stop any existing recording
agent-browser record stop > /dev/null 2>&1
sleep 1

# Servers should be running from previous shell. Verify.
echo "backend: $(curl -sS http://127.0.0.1:8000/health 2>&1 | head -1)"

# Open fresh page at landing
agent-browser set viewport 1440 900 > /dev/null 2>&1
agent-browser open http://127.0.0.1:3000 > /dev/null 2>&1
agent-browser wait --load networkidle > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# === RECORD ===
echo "starting recording..."
agent-browser record start $OUT 2>&1 | tail -1

# Scene 1: Landing (2s)
echo "  landing"
agent-browser wait 2000 > /dev/null 2>&1

# Scene 2: Click Get Started (1.5s)
echo "  → login page"
agent-browser find role button click --name "Get Started — Free" > /dev/null 2>&1
agent-browser wait --url "/login" > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 3: Fill login form (2s)
echo "  fill login"
REFS=$(agent-browser snapshot -i 2>&1)
EMAIL=$(echo "$REFS" | grep 'textbox "you@example' | grep -o 'e[0-9]*' | head -1)
PASS=$(echo "$REFS" | grep 'textbox "Min 8 chars' | grep -o 'e[0-9]*' | head -1)
LOGINBTN=$(echo "$REFS" | grep 'button "Login"' | tail -1 | grep -o 'e[0-9]*' | head -1)
agent-browser fill @$EMAIL "demo@finsight.ai" > /dev/null 2>&1
agent-browser wait 400 > /dev/null 2>&1
agent-browser fill @$PASS "demo1234" > /dev/null 2>&1
agent-browser wait 400 > /dev/null 2>&1
agent-browser click @$LOGINBTN > /dev/null 2>&1
agent-browser wait 2500 > /dev/null 2>&1

# Scene 4: Dashboard (2.5s)
echo "  dashboard"
agent-browser wait 2000 > /dev/null 2>&1
agent-browser scroll down 250 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 5: Documents (2s)
echo "  documents"
agent-browser find role link click --name "Documents" > /dev/null 2>&1
agent-browser wait --url "/documents" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# Scene 6: Tax (3s)
echo "  tax"
agent-browser find role link click --name "Tax Readiness" > /dev/null 2>&1
agent-browser wait --url "/tax" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1
agent-browser scroll down 400 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 7: Finance (3s)
echo "  finance"
agent-browser find role link click --name "Financial Health" > /dev/null 2>&1
agent-browser wait --url "/finance" > /dev/null 2>&1
agent-browser wait 2500 > /dev/null 2>&1
agent-browser scroll down 250 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 8: Goals (2s)
echo "  goals"
agent-browser find role link click --name "Goals" > /dev/null 2>&1
agent-browser wait --url "/goals" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# Scene 9: Goal detail (2.5s)
echo "  goal detail"
agent-browser find text "Emergency Fund" click > /dev/null 2>&1
agent-browser wait 2500 > /dev/null 2>&1
agent-browser scroll down 200 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 10: Assistant (4s — includes LLM call wait)
echo "  assistant"
agent-browser find role link click --name "Assistant" > /dev/null 2>&1
agent-browser wait --url "/assistant" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1
agent-browser find role button click --name "Why is my tax readiness score low?" > /dev/null 2>&1
agent-browser wait 3500 > /dev/null 2>&1

# Scene 11: Reports (2s)
echo "  reports"
agent-browser find role link click --name "Reports" > /dev/null 2>&1
agent-browser wait --url "/reports" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1
agent-browser scroll down 250 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 12: Settings (2.5s)
echo "  settings"
agent-browser find role link click --name "Settings" > /dev/null 2>&1
agent-browser wait --url "/settings" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1
agent-browser scroll down 350 > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1

# Scene 13: Back to dashboard + logout (2.5s)
echo "  dashboard + logout"
agent-browser find role link click --name "Dashboard" > /dev/null 2>&1
agent-browser wait --url "/dashboard" > /dev/null 2>&1
agent-browser wait 1500 > /dev/null 2>&1
agent-browser find role button click --name "Logout" > /dev/null 2>&1
agent-browser wait 2000 > /dev/null 2>&1

# Stop
echo "stopping..."
agent-browser record stop 2>&1 | tail -2
ls -lh $OUT 2>&1
echo "done"
