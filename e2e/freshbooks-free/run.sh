#!/usr/bin/env bash
# Real-browser checks of QBO -> FreshBooks being free and sold only in the US and Canada, against the local mock API (seeded catalogue).
#   PLAYWRIGHT_PATH=/path/to/node_modules/playwright CHROME_PATH=/usr/bin/google-chrome bash e2e/freshbooks-free/run.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."; OUT="$(mktemp -d)"; cd "$ROOT"
MOCK_PORT="${MOCK_PORT:-19013}"; APP_PORT="${APP_PORT:-14192}"
for p in "$MOCK_PORT" "$APP_PORT"; do if (echo > "/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "port $p is already in use"; exit 1; fi; done
VITE="node $ROOT/node_modules/vite/bin/vite.js"
VITE_API_BASE_URL="http://127.0.0.1:$MOCK_PORT" $VITE build --outDir "$OUT/dist" --emptyOutDir >/dev/null || exit 1
MOCK_PORT="$MOCK_PORT" node "$HERE/../homepage-content/mock-api.cjs" >/dev/null & MOCK=$!
$VITE preview --outDir "$OUT/dist" --port "$APP_PORT" --host 127.0.0.1 >/dev/null 2>&1 & PREVIEW=$!
trap 'kill $MOCK $PREVIEW 2>/dev/null; rm -rf "$OUT"' EXIT
sleep 4
export APP_URL="http://127.0.0.1:$APP_PORT" API_URL="http://127.0.0.1:$MOCK_PORT"
node "$HERE/e2e.cjs" | tee "$OUT/log" | grep -E "PASS|FAIL|ERROR"; exit "${PIPESTATUS[0]}"
