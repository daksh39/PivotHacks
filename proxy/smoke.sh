#!/usr/bin/env bash
# Proves the proxy returns a well-formed VerteResult on the paths that matter.
# Run the proxy first:  npm run proxy
set -u
BASE="${VERTE_PROXY:-http://localhost:8787}"
pass=0; fail=0

echo "verte proxy smoke test — $BASE"

check() {
  local name="$1" expr="$2" payload="${3:-}"
  local body
  if [ -z "$payload" ]; then body=$(curl -s -m 60 "$BASE/health")
  else body=$(curl -s -m 60 -X POST "$BASE/lookup" -H 'content-type: application/json' -d "$payload"); fi
  if printf '%s' "$body" | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit(1)
sys.exit(0 if ($expr) else 1)
" 2>/dev/null; then
    printf '  %-40s ok\n' "$name"; pass=$((pass+1))
  else
    printf '  %-40s FAILED\n' "$name"; echo "      $body" | head -c 300; echo; fail=$((fail+1))
  fi
}

FRIDGE='{"product":{"title":"Midea 3.1 Cu Ft Compact Refrigerator Mini Fridge","price":89,"currency":"USD","sourceUrl":"https://www.amazon.com/dp/B01LZG17UO"}}'
MON='{"product":{"title":"Dell 24 inch LED Monitor","price":179,"sourceUrl":"https://www.amazon.com/dp/X"}}'
SCREEN='{"product":{"title":"Samsung 27 inch Odyssey G5 Curved QHD Gaming Screen 165Hz","price":249,"sourceUrl":"https://www.amazon.com/dp/Y"}}'

check "GET /health"                              "d['ok'] is True"
check "classifies a mini fridge"                 "d['product']['category']=='mini-fridge'" "$FRIDGE"
check "AI classifies what the rules miss"        "d['product']['category']=='monitor'" "$SCREEN"
check "sourced figure only where cited"          "d['embodiedCo2Kg']>0 and d['guidance']['co2Source']!=''" "$MON"
check "uncited category shows no figure"         "d['embodiedCo2Kg'] is None" "$FRIDGE"
check "alternatives carry a reason"              "all(a['why'] for a in d['alternatives'])" "$MON"
check "alternatives are marked as estimates"     "all(a['estimated'] is True for a in d['alternatives'])" "$MON"
check "links are searches, never invented URLs"  "all('/s?k=' in a['url'] or 'searchpage' in a['url'] for a in d['alternatives'])" "$MON"
check "unknown category still gets a card"      "d['product']['category']=='other' and d['embodiedCo2Kg'] is None" '{"product":{"title":"Sterling silver cufflinks","price":40,"sourceUrl":"https://www.amazon.com/dp/Z"}}'
check "missing title → 400"                      "d.get('error')=='product.title is required'" '{"product":{}}'

# ── Voice ────────────────────────────────────────────────────────────────────
voice() { # name, python expr, audio file, content-type
  local name="$1" expr="$2" file="$3" type="${4:-audio/wav}"
  local body
  body=$(curl -s -m 90 -X POST "$BASE/voice" -H "content-type: $type" --data-binary "@$file")
  if printf '%s' "$body" | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit(1)
sys.exit(0 if ($expr) else 1)
" 2>/dev/null; then
    printf '  %-40s ok\n' "$name"; pass=$((pass+1))
  else
    printf '  %-40s FAILED\n' "$name"; echo "      $body" | head -c 300; echo; fail=$((fail+1))
  fi
}

TMP=$(mktemp -d)
: > "$TMP/empty.wav"
voice "voice: empty body → 400" "d.get('error')=='No audio received'" "$TMP/empty.wav"

if command -v say >/dev/null && command -v afconvert >/dev/null; then
  say -o "$TMP/speech.aiff" "I need a mini fridge for my dorm room"
  afconvert -f WAVE -d LEI16 "$TMP/speech.aiff" "$TMP/speech.wav"
  voice "voice: speech → mini-fridge lookup" \
    "'fridge' in d['transcript'].lower() and d['result']['product']['category']=='mini-fridge'" "$TMP/speech.wav"

  # One second of silence: nothing to transcribe.
  python3 -c "
import wave
w=wave.open('$TMP/silence.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
w.writeframes(b'\\x00\\x00'*16000); w.close()"
  voice "voice: silence → 422" "d.get('error','').startswith(\"Didn't catch\")" "$TMP/silence.wav"
else
  echo "  voice: speech checks skipped (needs macOS say + afconvert)"
fi
rm -rf "$TMP"

echo
if [ "$fail" -eq 0 ]; then echo "all green ($pass checks)"; else echo "$fail failed, $pass passed"; exit 1; fi
