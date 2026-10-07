#!/bin/zsh
# Copies the Kitted dev build's data off the founder's iPhone (plugged in, Developer Mode on):
# the SQLite database and the neck-down photos the app kept. Then prints one line per check.
# Output: screenshots/phone/<time>/ (git-ignored). Works for development builds only.
set -e
cd "$(dirname "$0")/../.."
DEVICE=$(xcrun devicectl list devices 2>/dev/null | awk '/iPhone/ && /connected|available/ {print $(NF-2); exit}')
if [[ -z "$DEVICE" ]]; then echo "No iPhone found. Plug it in, unlock it and tap Trust."; exit 1; fi
OUT="screenshots/phone/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"
xcrun devicectl device copy from --device "$DEVICE" --domain-type appDataContainer \
  --domain-identifier com.trykitted.kitted --source Documents --destination "$OUT" >/dev/null
DB=$(find "$OUT" -name kitted.db | head -1)
echo "Copied to $OUT"
sqlite3 -separator ' · ' "$DB" "
  select datetime(f.created_at/1000,'unixepoch','localtime'), f.status, coalesce(f.score,'–'), f.occasion,
         coalesce(r.model,''), printf('%.1f s', coalesce(r.latency_ms,0)/1000.0), coalesce(f.photo_file,f.demo_photo_id)
  from fit_checks f left join readings r on r.id = f.reading_id
  where f.photo_file is not null order by f.created_at;"
