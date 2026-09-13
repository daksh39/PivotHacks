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

# --- the listings themselves --------------------------------------------
# A well-formed envelope is not the same as a working card. The service worker
# once dropped `options` on the floor, everything still typechecked, and every
# product read "nothing secondhand listed". So assert on content, not shape.

FRIDGE='"Midea 3.1 Cu. Ft. Compact Mini Fridge with Freezer"'

# One listing, priced in the page's currency, no constraints.
with_listing() {
  post "{\"product\":{\"title\":$FRIDGE,\"price\":89,\"currency\":\"USD\",\"category\":\"\",
         \"imageUrl\":null,\"sourceUrl\":\"https://www.amazon.com/dp/SMOKE\"},
         \"context\":$1,
         \"options\":[{\"source\":\"amazon\",\"title\":\"Used - Very Good\",\"price\":52,
           \"currency\":\"USD\",\"url\":\"https://example.test/a\",\"imageUrl\":null,
           \"condition\":\"Used - Very Good\",\"daysToHand\":7}]}"
}

assert_json() {
  local name="$1" body="$2" script="$3"
  printf '  %-38s' "$name"
  if node -e "$script" <<<"$body" 2>/tmp/verte-smoke.err; then echo "ok"
  else echo "FAIL — $(cat /tmp/verte-smoke.err)"; fail=1; fi
}

assert_json "listings survive the round trip" \
  "$(with_listing '{"needInDays":null,"hasCar":true,"budgetCap":null}')" '
  let raw=""; process.stdin.on("data",d=>raw+=d).on("end",()=>{
    const r=JSON.parse(raw);
    if (r.options.length !== 1) { console.error("options dropped: got "+r.options.length); process.exit(1) }
    if (r.savingsUsd !== 37) { console.error("expected savingsUsd 37, got "+r.savingsUsd); process.exit(1) }
  });'

# Pivot 03: the same product under a deadline nothing meets is a different
# ANSWER, not the same answer reworded.
assert_json "a deadline changes the answer" \
  "$(with_listing '{"needInDays":1,"hasCar":true,"budgetCap":null}')" '
  let raw=""; process.stdin.on("data",d=>raw+=d).on("end",()=>{
    const r=JSON.parse(raw);
    if (r.reason !== "nothing-arrives-in-time") { console.error("reason was "+r.reason); process.exit(1) }
    if (r.savingsUsd !== null) { console.error("claimed a saving on an unusable option"); process.exit(1) }
  });'

# ...and so does a budget it cannot meet.
assert_json "a budget changes the answer" \
  "$(with_listing '{"needInDays":null,"hasCar":true,"budgetCap":40}')" '
  let raw=""; process.stdin.on("data",d=>raw+=d).on("end",()=>{
    const r=JSON.parse(raw);
    if (r.reason !== "nothing-in-budget") { console.error("reason was "+r.reason); process.exit(1) }
    if (r.savingsUsd !== null) { console.error("claimed a saving they cannot afford"); process.exit(1) }
    if (!r.options.length) { console.error("over-budget listings must still be shown"); process.exit(1) }
  });'

printf '  %-38s' "POST /lookup  unknown → 404"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/lookup" \
  -H 'Content-Type: application/json' \
  -d '{"product":{"title":"Artisanal Sourdough Starter","price":12,"currency":"USD","category":"","imageUrl":null,"sourceUrl":"x"},"options":[]}')
if [ "$code" = "404" ]; then echo "ok"; else echo "FAIL (got $code)"; fail=1; fi

# Every slug the classifier can emit must have guidance behind it. Without a
# row we answer 404 and the card never renders on a page we DID recognise.
# The list comes from the classifier itself — it was hand-written here once and
# went stale the first time someone widened it.
printf '  %-38s' "guidance for every classifier slug"
slugs=$(npx --no-install tsx -e 'import { KNOWN_CATEGORIES } from "./proxy/categories"; console.log(KNOWN_CATEGORIES.join(" "))' 2>/dev/null)
if [ -z "$slugs" ]; then
  echo "SKIP (could not read the classifier)"
else
  missing=""
  for slug in $slugs; do
    c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/lookup" \
      -H 'Content-Type: application/json' \
      -d "{\"product\":{\"title\":\"x\",\"price\":1,\"currency\":\"USD\",\"category\":\"$slug\",\"imageUrl\":null,\"sourceUrl\":\"x\"},\"options\":[]}")
    [ "$c" = "200" ] || missing="$missing $slug"
  done
  n=$(echo $slugs | wc -w | tr -d ' ')
  if [ -z "$missing" ]; then echo "ok  ($n categories)"; else echo "FAIL — no guidance for:$missing"; fail=1; fi
fi

echo
[ "$fail" = 0 ] && echo "all green" || echo "FAILURES — see above"
exit "$fail"
