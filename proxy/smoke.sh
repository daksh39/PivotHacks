#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Proves the proxy returns a well-formed VerteResult. Run it after any change
# to proxy/*.
#
#     npm run proxy          # in one terminal (no credentials needed)
#     npm run smoke          # in another
#
# /lookup takes { product, context?, options? }. Listings arrive WITH the
# request — both sources are same-origin reads only the content script can
# perform — so `options` here stands in for what the page yielded.
# ---------------------------------------------------------------------------
set -uo pipefail

BASE="${VERTE_PROXY:-http://localhost:8787}"
fail=0

post() {
  curl -fsS -X POST "$BASE/lookup" -H 'Content-Type: application/json' -d "$1" 2>/dev/null || true
}

# A ProductContext wrapped in the request envelope, with no listings found.
lookup() {
  post "{\"product\":{\"title\":$1,\"price\":$2,\"currency\":\"USD\",\"category\":\"\",
        \"imageUrl\":null,\"sourceUrl\":\"https://www.amazon.com/dp/SMOKE\"},
        \"context\":{\"needInDays\":null,\"hasCar\":true},\"options\":[]}"
}

check() {
  local name="$1" body="$2" expect_verdict="${3:-}"
  printf '  %-38s' "$name"
  if [ -z "$body" ]; then echo "FAIL (no response)"; fail=1; return; fi
  if EXPECT="$expect_verdict" node -e '
    let raw = "";
    process.stdin.on("data", d => raw += d).on("end", () => {
      const r = JSON.parse(raw);
      const need = ["product","guidance","options","context","reason",
                    "passedOver","savingsUsd","co2AvoidedKg"];
      const missing = need.filter(k => !(k in r));
      if (missing.length) { console.error("missing: " + missing.join(", ")); process.exit(1); }
      if (!Array.isArray(r.options)) { console.error("options is not an array"); process.exit(1); }
      if (!["safe","check","avoid"].includes(r.guidance.verdict)) {
        console.error("bad verdict: " + r.guidance.verdict); process.exit(1);
      }
      if (typeof r.guidance.bulky !== "boolean") {
        console.error("guidance.bulky must be a boolean — rank.ts depends on it"); process.exit(1);
      }
      // §09: a figure only ever appears with a citation behind it.
      const sourced = r.guidance.co2Source && !/^\s*$|placeholder|todo|tbd|to source/i.test(r.guidance.co2Source);
      if (!sourced && r.guidance.embodiedCo2Kg !== 0) {
        console.error("uncited category carries " + r.guidance.embodiedCo2Kg + " kg"); process.exit(1);
      }
      if (process.env.EXPECT && r.guidance.verdict !== process.env.EXPECT) {
        console.error("expected verdict " + process.env.EXPECT + ", got " + r.guidance.verdict);
        process.exit(1);
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

printf '  %-38s' "GET /health"
health=$(curl -fsS "$BASE/health" 2>/dev/null || true)
if [ -n "$health" ]; then echo "ok  $health"; else echo "FAIL (is the proxy running?)"; exit 1; fi

check "POST /lookup  mini fridge"        "$(lookup '"Midea 3.1 Cu. Ft. Compact Mini Fridge with Freezer"' 89)"  safe
check "POST /lookup  mattress (buy new)" "$(lookup '"Zinus 8 Inch Green Tea Memory Foam Mattress, Twin XL"' 159)" avoid
check "POST /lookup  laptop (cited co2)" "$(lookup '"Apple MacBook Air 13-inch M2"' 999)"                          check
check "POST /lookup  microwave"          "$(lookup '"Toshiba 0.9 Cu Ft Countertop Microwave"' 109)"                 safe

printf '  %-38s' "POST /lookup  unknown → 404"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/lookup" \
  -H 'Content-Type: application/json' \
  -d '{"product":{"title":"Artisanal Sourdough Starter","price":12,"currency":"USD","category":"","imageUrl":null,"sourceUrl":"x"},"options":[]}')
if [ "$code" = "404" ]; then echo "ok"; else echo "FAIL (got $code)"; fail=1; fi

# Every slug the classifier can emit must have guidance behind it. Without a
# row we answer 404 and the card never renders on a page we DID recognise.
printf '  %-38s' "guidance for all 24 categories"
missing=""
for slug in desk bookshelf dresser mini-fridge microwave monitor textbook cookware \
            bike storage-bin drying-rack fan laptop desk-chair blender kettle \
            headphones winter-coat mattress pillow bike-helmet non-stick-pan \
            smoke-detector surge-protector; do
  c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/lookup" \
    -H 'Content-Type: application/json' \
    -d "{\"product\":{\"title\":\"x\",\"price\":1,\"currency\":\"USD\",\"category\":\"$slug\",\"imageUrl\":null,\"sourceUrl\":\"x\"},\"options\":[]}")
  [ "$c" = "200" ] || missing="$missing $slug"
done
if [ -z "$missing" ]; then echo "ok"; else echo "FAIL — no guidance for:$missing"; fail=1; fi

echo
[ "$fail" = 0 ] && echo "all green" || echo "FAILURES — see above"
exit "$fail"
