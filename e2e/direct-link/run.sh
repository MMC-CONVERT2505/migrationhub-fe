#!/usr/bin/env bash
# End-to-end check of the direct-link flows (Xero→Reckon, Xero→MYOB, QBO→MYOB) and the Hub home-page flow, in a real
# browser against a local mock API. No database, no production. Needs Playwright (PLAYWRIGHT_PATH) and Chrome (CHROME_PATH
# if Playwright's own browser is not installed). Run from the repo root:  bash e2e/direct-link/run.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."; OUT="$(mktemp -d)"; cd "$ROOT"
MOCK_PORT="${MOCK_PORT:-19001}"; APP_PORT="${APP_PORT:-14173}"
for p in "$MOCK_PORT" "$APP_PORT"; do if (echo > "/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "port $p is already in use"; exit 1; fi; done
VITE="node $ROOT/node_modules/vite/bin/vite.js"
VITE_API_BASE_URL="http://127.0.0.1:$MOCK_PORT" $VITE build --outDir "$OUT/dist" --emptyOutDir >/dev/null || exit 1
node "$HERE/mock-api.cjs" & MOCK=$!
$VITE preview --outDir "$OUT/dist" --port "$APP_PORT" --host 127.0.0.1 >/dev/null 2>&1 & PREVIEW=$!
trap 'kill $MOCK $PREVIEW 2>/dev/null; rm -rf "$OUT"' EXIT
sleep 4; rc=0
export APP_URL="http://127.0.0.1:$APP_PORT" API_URL="http://127.0.0.1:$MOCK_PORT"
for t in flow back edges; do echo "== $t"; node "$HERE/$t.cjs" > "$OUT/$t.log" 2>&1 || rc=1; grep -E "FAIL|passed|PASSED|FAILED" "$OUT/$t.log" || true; [ $rc -eq 0 ] || grep -vE "^PASS" "$OUT/$t.log" | tail -12; done
exit $rc
