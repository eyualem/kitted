#!/usr/bin/python3
"""Kitted icon, woven label round c (the blends): c1 and c2, each light / -dark / -tint.
1024 x 1024 SVG, shapes only. The K is the refined K from ../a/gen.py (imported, not copied).
Run: /usr/bin/python3 gen.py"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("woven_a", os.path.join(HERE, "..", "a", "gen.py"))
A = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(A)
S, k_path, svg, field, rrect = A.S, A.k_path, A.svg, A.field, A.rrect
INDIGO, INDIGO2, NIGHT, CHALK, COPPER, COPPER_D = A.INDIGO, A.INDIGO2, A.NIGHT, A.CHALK, A.COPPER, A.COPPER_D


def write(name, text):
    with open(os.path.join(HERE, name), "w") as f:
        f.write(text)


def stitch_col(x, cy, n, w, h, gap):
    """n slim stitch bars stacked vertically at x, centred on cy: list of (x, y)."""
    span = n * h + (n - 1) * gap
    y0 = cy - span / 2 + h / 2
    return [(x, y0 + i * (h + gap)) for i in range(n)]


def bars(pts, w, h, fill, extra=""):
    return "".join(A.bar(x, y, w, h, fill, extra) for x, y in pts)


# ---------------------------------------------------------------- c1 · a1, scaled up
# The a1 label at 80% of the icon width, 2.1:1, the refined K at 58% of the label height,
# one sewn end at each side: a short column of slim deep-copper stitches.
C1 = dict(w=820, h=392, r=26, kh=228, st_w=19, st_h=50, st_gap=18, st_n=4, st_in=44)


def c1(mode, p=C1):
    x, y = (S - p["w"]) / 2, (S - p["h"]) / 2
    cx, cy = S / 2, S / 2
    sts = (stitch_col(x + p["st_in"], cy, p["st_n"], p["st_w"], p["st_h"], p["st_gap"])
           + stitch_col(x + p["w"] - p["st_in"], cy, p["st_n"], p["st_w"], p["st_h"], p["st_gap"]))
    kd = k_path(cx, cy, p["kh"])
    if mode == "tint":
        defs = (f'<mask id="m"><rect width="{S}" height="{S}" fill="#000"/>'
                f'{rrect(x, y, p["w"], p["h"], p["r"], "#fff")}<path d="{kd}" fill="#000"/>'
                + bars(sts, p["st_w"], p["st_h"], "#000") + '</mask>')
        body = f'<rect width="{S}" height="{S}" fill="#fff" mask="url(#m)"/>'
        body += bars(sts, p["st_w"], p["st_h"], "#fff", 'opacity="0.5"')
        return svg(body, defs)
    if mode == "full":
        fdefs, bg = field(INDIGO2, "#1D2850")
        lab, ink, st = CHALK, INDIGO, COPPER_D
    else:
        fdefs, bg = field("#141A2E", NIGHT)
        lab, ink, st = "#24315F", "#E6E9F0", COPPER
    body = rrect(x, y, p["w"], p["h"], p["r"], lab)
    body += f'<path d="{kd}" fill="{ink}"/>'
    body += bars(sts, p["st_w"], p["st_h"], st)
    return svg(body, fdefs, bg)


# ---------------------------------------------------------------- c2 · b2 with the refined K
# A chalk band runs off both sides (b2's composition) but is shorter, so indigo frames it above
# and below. The refined K, centred. A column of slim stitches near each edge: both sewn ends.
C2 = dict(top=300, h=424, kh=254, st_w=19, st_h=54, st_gap=22, st_n=4, st_x=128)


def c2(mode, p=C2):
    y0, y1 = p["top"], p["top"] + p["h"]
    cy = (y0 + y1) / 2
    kd = k_path(S / 2, cy, p["kh"])
    sts = (stitch_col(p["st_x"], cy, p["st_n"], p["st_w"], p["st_h"], p["st_gap"])
           + stitch_col(S - p["st_x"], cy, p["st_n"], p["st_w"], p["st_h"], p["st_gap"]))
    band = f'<rect x="-10" y="{y0}" width="{S + 20}" height="{p["h"]}"'
    if mode == "tint":
        defs = (f'<mask id="m"><rect width="{S}" height="{S}" fill="#000"/>'
                f'<rect y="{y0}" width="{S}" height="{p["h"]}" fill="#fff"/><path d="{kd}" fill="#000"/>'
                + bars(sts, p["st_w"], p["st_h"], "#000") + '</mask>')
        body = f'<rect width="{S}" height="{S}" fill="#fff" mask="url(#m)"/>'
        body += bars(sts, p["st_w"], p["st_h"], "#fff", 'opacity="0.5"')
        return svg(body, defs)
    if mode == "full":
        fdefs, bg = field(INDIGO2, "#1D2850")
        lab, ink, st = CHALK, INDIGO, COPPER_D
    else:
        fdefs, bg = field("#141A2E", NIGHT)
        lab, ink, st = "#24315F", "#E6E9F0", COPPER
    body = f'{band} fill="{lab}"/>'
    body += f'<path d="{kd}" fill="{ink}"/>'
    body += bars(sts, p["st_w"], p["st_h"], st)
    return svg(body, fdefs, bg)


if __name__ == "__main__":
    for name, fn in (("c1", c1), ("c2", c2)):
        write(f"{name}.svg", fn("full"))
        write(f"{name}-dark.svg", fn("dark"))
        write(f"{name}-tint.svg", fn("tint"))
    print("ok")
