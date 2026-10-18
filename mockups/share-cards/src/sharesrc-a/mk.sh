#!/bin/sh
# assemble parts/<id>.html from sharesrc/<id>.html, inlining the flats with the given prefix
S=/private/tmp/claude-501/-Users-eyu-Desktop-files-Kitted--claude-worktrees-social-share-card-demos-c424a6/9ecb68fd-10d7-455f-9c3e-0aadff38d780/scratchpad
for f in a1-story:st a2-feed:fd a3-compact:cp; do id=${f%%:*}; p=${f##*:}
 [ -f $S/sharesrc/$id.html ] || continue
 python3 - "$S" "$id" "$p" <<'PY'
import sys;S,i,p=sys.argv[1:]
fl=open(S+'/sharesrc/flats.tpl').read().replace('PFX-',p+'-')
src=open(S+'/sharesrc/%s.html'%i).read().replace('<!--FLATS-->',fl)
open(S+'/share/parts/%s.html'%i,'w').write(src)
PY
done
cd $S/share && KSAFE=${KSAFE:-} python3 build.py
