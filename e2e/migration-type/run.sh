#!/usr/bin/env bash
# Real-browser check of the Xero -> QBO "Type of Data Migration" field against the direct-link mock API (no database).
#   PLAYWRIGHT_PATH=/path/to/node_modules/playwright CHROME_PATH=/usr/bin/google-chrome bash e2e/migration-type/run.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."; OUT="$(mktemp -d)"; cd "$ROOT"
MOCK_PORT="${MOCK_PORT:-19002}"; APP_PORT="${APP_PORT:-14174}"
for p in "$MOCK_PORT" "$APP_PORT"; do if (echo > "/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "port $p is already in use"; exit 1; fi; done
VITE="node $ROOT/node_modules/vite/bin/vite.js"
VITE_API_BASE_URL="http://127.0.0.1:$MOCK_PORT" $VITE build --outDir "$OUT/dist" --emptyOutDir >/dev/null || exit 1
PORT="$MOCK_PORT" MOCK_PORT="$MOCK_PORT" node "$ROOT/e2e/direct-link/mock-api.cjs" & MOCK=$!
$VITE preview --outDir "$OUT/dist" --port "$APP_PORT" --host 127.0.0.1 >/dev/null 2>&1 & PREVIEW=$!
trap 'kill $MOCK $PREVIEW 2>/dev/null; rm -rf "$OUT"' EXIT
sleep 4
export APP_URL="http://127.0.0.1:$APP_PORT" API_URL="http://127.0.0.1:$MOCK_PORT"
node "$HERE/e2e.cjs" | tee "$OUT/log" | grep -E "PASS|FAIL|ALL PASSED|FAILED"; exit "${PIPESTATUS[0]}"
