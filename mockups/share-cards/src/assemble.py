#!/usr/bin/env python3
"""Assemble the published demo page: page.html (artifact body) from header + all parts."""
import os, re
H = os.path.dirname(os.path.abspath(__file__))
base = open(os.path.join(H, 'base.css')).read()
ORDER = [
 ('Stills', 'For Stories, the feed and messages. Built with the app\'s own look.', ['a1-story', 'a2-feed', 'a3-compact']),
 ('On his own content', 'Stickers he places over his own photo, plus the brand\'s signature object.', ['b1-stickers', 'b2-tag', 'b3-recap']),
 ('Motion', 'Short loops for TikTok, Reels and Shorts. Press Replay under a card to watch it again.', ['c1-reveal', 'c2-before-after', 'c3-guess']),
]
head = open(os.path.join(H, 'page-head.html')).read()
out = [head.replace('/*BASE*/', base)]
for gi, (g, gdesc, ids) in enumerate(ORDER):
    out.append(f'<div class="pg-group" id="g{gi+1}"><div class="pg-gh"><h2 class="pg-gt">{g}</h2><p class="pg-gd">{gdesc}</p></div>')
    for pid in ids:
        body = open(os.path.join(H, 'parts', pid + '.html')).read()
        out.append(f'<div class="pg-part" id="{pid}"><div class="pg-scroll">{body}</div></div>')
    out.append('</div>')
out.append(open(os.path.join(H, 'page-foot.html')).read())
html = '\n'.join(out)
open(os.path.join(H, 'page.html'), 'w').write(html)
print('page.html', len(html)//1024, 'KB')
