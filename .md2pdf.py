import markdown, sys, re
src, html_out, title = sys.argv[1], sys.argv[2], sys.argv[3]
md = open(src, encoding="utf-8").read()
import re as _re
_out=[]; _prev=""
for _l in md.split("\n"):
    _m=_re.match(r"^( *)([-*]|\d+\.) ", _l)
    if _m:
        _ind=len(_m.group(1)); _l=" "*(_ind*2)+_l[_ind:]
        if _prev.strip() and not _re.match(r"^ *([-*]|\d+\.) ", _prev) and not _prev.startswith("|"):
            _out.append("")
    elif _l.startswith("|") and _prev.strip() and not _prev.startswith("|"):
        _out.append("")
    _out.append(_l); _prev=_l
md="\n".join(_out)
body = markdown.markdown(md, extensions=["tables", "sane_lists"])
body = re.sub(r'(https?://[^\s<)"]+)', lambda m: m.group(1) if 'href=' in m.string[max(0,m.start()-6):m.start()] else f'<a href="{m.group(1)}">{m.group(1)}</a>', body)
css = """
@page { size: Letter; margin: 0.7in 0.65in; }
body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1d1d1f; }
h1 { font-size: 20pt; margin: 26px 0 8px; border-bottom: 1.5px solid #1d1d1f; padding-bottom: 4px; page-break-after: avoid; }
h1:first-of-type { font-size: 24pt; border: none; margin-top: 0; }
h2 { font-size: 14pt; margin: 20px 0 6px; page-break-after: avoid; }
h3 { font-size: 12pt; margin: 14px 0 4px; page-break-after: avoid; }
table { border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9.3pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th, td { border: 0.6px solid #c7c7cc; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #f2f2f7; }
blockquote { margin: 10px 0; padding: 8px 14px; border-left: 3px solid #1d1d1f; background: #f5f5f7; }
code { font-family: Menlo, monospace; font-size: 9pt; background: #f2f2f7; padding: 1px 3px; border-radius: 3px; }
pre { background: #f2f2f7; padding: 10px; border-radius: 6px; white-space: pre-wrap; font-size: 8.6pt; }
a { color: #0055b3; text-decoration: none; word-break: break-all; }
hr { border: none; border-top: 0.6px solid #c7c7cc; margin: 18px 0; }
li { margin: 2px 0; }
"""
open(html_out, "w", encoding="utf-8").write(f"<!doctype html><html><head><meta charset='utf-8'><title>{title}</title><style>{css}</style></head><body>{body}</body></html>")
