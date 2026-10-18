#!/usr/bin/env python3
"""Build previews: preview/<id>.html for each parts/<id>.html, and index.html with all of them.
usage: python3 build.py"""
import glob, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
css = open(os.path.join(HERE, 'base.css')).read()
HEAD = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="{rel}base.css">
<style>body{{margin:0;padding:24px;background:#D9DCE2;font:14px/1.45 -apple-system,Helvetica,Arial,sans-serif;color:#131726}}
.k-stage{{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}} .k-cap{{max-width:360px;font-size:13px;color:#4a5060;margin-top:10px}}</style>
"""
parts = sorted(glob.glob(os.path.join(HERE, 'parts', '*.html')))
os.makedirs(os.path.join(HERE, 'preview'), exist_ok=True)
for p in parts:
    pid = os.path.basename(p)[:-5]
    body = open(p).read()
    with open(os.path.join(HERE, 'preview', pid + '.html'), 'w') as f:
        f.write(HEAD.format(rel='../') + '<body class="%s">' % ('show-safe' if 'safe' in os.environ.get('KSAFE','') else '') + body.replace('src="img/', 'src="../img/').replace("url(img/", "url(../img/").replace("'img/", "'../img/") + '</body>')
    print('preview/%s.html' % pid)
