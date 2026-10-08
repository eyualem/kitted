#!/bin/zsh
# Copies the Kitted dev build's data off the founder's iPhone (plugged in, Developer Mode on):
# the SQLite database, the photos the app kept, and the face-hidden detail copies. Then prints one line per check.
# Output: screenshots/phone/<time>/ (git-ignored). Works for development builds only.
set -e
cd "$(dirname "$0")/../.."
DEVICE=$(xcrun devicectl list devices 2>/dev/null | grep -E 'iPhone.*(connected|available)' | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1)
if [[ -z "$DEVICE" ]]; then echo "No iPhone found. Plug it in, unlock it and tap Trust."; exit 1; fi
OUT="screenshots/phone/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"
xcrun devicectl device copy from --device "$DEVICE" --domain-type appDataContainer \
  --domain-identifier com.trykitted.kitted --source Documents --destination "$OUT" >/dev/null
# The face-hidden 2048 px detail copies (Caches/detail, kept a week; DECISIONS-LOG #83).
mkdir -p "$OUT/detail"
xcrun devicectl device copy from --device "$DEVICE" --domain-type appDataContainer \
  --domain-identifier com.trykitted.kitted --source Library/Caches/detail --destination "$OUT/detail" >/dev/null 2>&1 \
  || echo "No detail copies yet (needs the Oct 8 native build)."
DB=$(find "$OUT" -name kitted.db | head -1)
echo "Copied to $OUT"
sqlite3 -separator ' · ' "$DB" "
  select datetime(f.created_at/1000,'unixepoch','localtime'), f.status, coalesce(f.score,'–'), f.occasion,
         coalesce(r.model,''), printf('%.1f s', coalesce(r.latency_ms,0)/1000.0), coalesce(f.photo_file,f.demo_photo_id)
  from fit_checks f left join readings r on r.id = f.reading_id
  where f.photo_file is not null order by f.created_at;"
