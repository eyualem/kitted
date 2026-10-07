#!/bin/sh
# usage: webshot.sh <screen 1-20> <light|dark>   (web preview must be running on :8081)
OUT=/Users/eyu/Desktop/files/Kitted/screenshots/web; mkdir -p $OUT; N=$(printf %02d $1)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=3 --window-size=402,874 --virtual-time-budget=30000 \
  --screenshot=$OUT/$N-$2.png "http://localhost:8081/demo/screen/$1?theme=$2&latency=0&frame=1&uiTesting=1" >/dev/null 2>&1
echo $OUT/$N-$2.png
