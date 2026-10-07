#!/bin/sh
# usage: preview.sh <screen 1-20> <light|dark>   -> screenshots/mock/NN-theme.png (1206x2622)
ROOT=/Users/eyu/Desktop/files/Kitted
OUT=$ROOT/screenshots/mock; mkdir -p $OUT
W=$ROOT/build/mockpreview; mkdir -p $W
ln -sfn $ROOT/mockups/img $W/img
{ echo '<!doctype html><meta charset="utf-8">'; cat $ROOT/mockups/kitted-mockups.html;
  cat $ROOT/tools/mockshots/isolate.js; } > $W/preview.html
N=$(printf %02d $1)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --allow-file-access-from-files --force-device-scale-factor=3 --window-size=402,874 \
  --virtual-time-budget=20000 --screenshot=$OUT/$N-$2.png "file://$W/preview.html#n=$1&theme=$2" >/dev/null 2>&1
echo $OUT/$N-$2.png
