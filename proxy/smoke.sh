#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Proves the proxy returns a well-formed VerteResult. Run it after any change
# to proxy/*.  verte-plan.md gate one depends on this being green.
#
#     npm run proxy:mock     # in one terminal
#     npm run smoke          # in another
# ---------------------------------------------------------------------------
set -uo pipefail

BASE="${VERTE_PROXY:-http://localhost:8787}"
fail=0

check() {
  local name="$1" body="$2"
  printf '  %-34s' "$name"
  if [ -z "$body" ]; then echo "FAIL (no response)"; fail=1; return; fi
  if node -e '
    let raw = "";
    process.stdin.on("data", d => raw += d).on("end", () => {
      const r = JSON.parse(raw);
      const need = ["product","guidance","options","savingsUsd","co2AvoidedKg"];
      const missing = need.filter(k => !(k in r));
      if (missing.length) { console.error("missing: " + missing.join(", ")); process.exit(1); }
      if (!Array.isArray(r.options)) { console.error("options is not an array"); process.exit(1); }
      if (!["safe","check","avoid"].includes(r.guidance.verdict)) {
        console.error("bad verdict: " + r.guidance.verdict); process.exit(1);
      }
    });
  ' <<<"$body" 2>/tmp/verte-smoke.err; then
    echo "ok"
  else
    echo "FAIL — $(cat /tmp/verte-smoke.err)"
    fail=1
  fi
}

echo "verte proxy smoke test — $BASE"

printf '  %-34s' "GET /health"
health=$(curl -fsS "$BASE/health" 2>/dev/null || true)
if [ -n "$health" ]; then echo "ok  $health"; else echo "FAIL (is the proxy running?)"; exit 1; fi

post() {
  curl -fsS -X POST "$BASE/lookup" -H 'Content-Type: application/json' -d "$1" 2>/dev/null || true
}

check "POST /lookup  mini fridge" "$(post '{
  "title":"Midea 3.1 Cu. Ft. Compact Mini Fridge with Freezer",
  "price":89,"currency":"USD","category":"","imageUrl":null,
  "sourceUrl":"https://www.amazon.com/dp/TEST"
}')"

check "POST /lookup  mattress (buy new)" "$(post '{
  "title":"Zinus 8 Inch Green Tea Memory Foam Mattress, Twin XL",
  "price":159,"currency":"USD","category":"","imageUrl":null,
  "sourceUrl":"https://www.amazon.com/dp/TEST2"
}')"

printf '  %-34s' "POST /lookup  unknown → 404"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/lookup" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Artisanal Sourdough Starter","price":12,"currency":"USD","category":"","imageUrl":null,"sourceUrl":"x"}')
if [ "$code" = "404" ]; then echo "ok"; else echo "FAIL (got $code)"; fail=1; fi

echo
[ "$fail" = 0 ] && echo "all green" || echo "FAILURES — see above"
exit "$fail"
