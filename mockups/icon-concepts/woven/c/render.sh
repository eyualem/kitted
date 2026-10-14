#!/bin/zsh
# Render c*.svg to 1024 PNGs (tint versions on grey), then sheet.html to sheet.png. Headless Chrome, one at a time.
cd "${0:A:h}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=${TMPDIR:-/tmp}/kitted-woven-c; mkdir -p $TMP
for f in ${@:-c*.svg}; do
  n=${f:r}; src="file://$PWD/$f"
  if [[ $n == *-tint ]]; then
    print "<html><body style='margin:0;background:#3A3A3C'><img src='$src' width=1024 height=1024 style='display:block'></body></html>" > $TMP/$n.html
    src="file://$TMP/$n.html"
  fi
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1024,1024 --screenshot="$PWD/$n.png" "$src" >/dev/null 2>&1
done
