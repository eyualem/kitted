#!/bin/sh
# runprep.sh <kmeasure> <list> <outdir>: the app's whole prep per photo; keeps the sent copy as <outdir>/sent/<n>.jpg
KM=$1; LIST=$2; OUT=$3; mkdir -p $OUT/sent; : > $OUT/prep.jsonl
n=0
while IFS= read -r f; do
  n=$((n+1)); root=$OUT/tmp; rm -rf $root; mkdir -p $root
  j=$($KM prep "$f" $root 2>/dev/null | tr -d '\n')
  st=$(printf '%s' "$j" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("status","err"))
except Exception: print("crash")')
  if [ "$st" = ok ]; then cp $root/Caches/upload/$(printf '%s' "$j" | python3 -c 'import sys,json;print(json.load(sys.stdin)["sha256"])').jpg $OUT/sent/$n.jpg; fi
  printf '{"n":%d,"photo":"%s","status":"%s"}\n' $n "$f" "$st" >> $OUT/prep.jsonl
done < $LIST
rm -rf $OUT/tmp
