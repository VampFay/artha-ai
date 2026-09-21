#!/usr/bin/env bash
# Keep-alive wrapper for the dev server.
# Starts the dev server, then sleeps for 4 hours so the server stays alive
# even after the parent bash exits.
# To stop: pkill -f "next dev" or kill the wrapper PID.

cd /home/z/my-project
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1

# Start dev server
bun run dev > /tmp/artha-dev.log 2>&1 &
SERVER_PID=$!

# Wait for ready
for i in $(seq 1 30); do
  if curl -sf -o /dev/null http://localhost:3000/api/health 2>/dev/null \
     || curl -sf -o /dev/null -H "x-forwarded-proto: https" http://localhost:3000/api/health 2>/dev/null; then
    echo "[wrapper] server ready after ${i}s (PID $SERVER_PID)" >> /tmp/artha-dev.log
    break
  fi
  if [ $i -eq 30 ]; then
    echo "[wrapper] server failed to start" >> /tmp/artha-dev.log
    exit 1
  fi
  sleep 1
done

# Save the server PID for later management
echo $SERVER_PID > /tmp/artha-dev.pid

# Keep the wrapper alive — when this exits, the server dies too
# Sleep for 4 hours, then auto-kill
sleep 14400
kill $SERVER_PID 2>/dev/null
