#!/bin/sh
# Renders web/public/og.png (the link preview, 1200 × 630) from the built og-card page with the Mac's Chrome.
set -e
cd "$(dirname "$0")/../../web"
npx astro build >/dev/null
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=3000 --screenshot="$PWD/public/og.png" "file://$PWD/dist/og-card/index.html" >/dev/null 2>&1
sips -s format png "$PWD/public/og.png" >/dev/null
ls -l public/og.png
