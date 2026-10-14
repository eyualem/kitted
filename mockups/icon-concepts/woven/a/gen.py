#!/usr/bin/python3
"""Kitted icon, woven-label round 2 (variants a1-a4). Run: /usr/bin/python3 gen.py
Writes aN.svg, aN-dark.svg, aN-tint.svg next to this file. Shapes only (no text, fonts or images)."""
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
S = 1024

# Brand colours
INDIGO, INDIGO2, NIGHT = "#1A2448", "#22305C", "#0C0E14"
CHALK, WHITE = "#F3F4F6", "#EEF0F5"
COPPER, COPPER_D = "#DE9762", "#9C5326"


# ---------------------------------------------------------------- geometry
def clip(poly, a, b, c):
    """Keep the part of a convex polygon where a*x + b*y + c >= 0 (Sutherland-Hodgman)."""
    out = []
    n = len(poly)
    for i in range(n):
        p, q = poly[i], poly[(i + 1) % n]
        fp, fq = a * p[0] + b * p[1] + c, a * q[0] + b * q[1] + c
        if fp >= 0:
            out.append(p)
        if (fp >= 0) != (fq >= 0):
            t = fp / (fp - fq)
            out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
    return out


def band(p, q, w, ext=4000):
    """A long quad of width w along the line p->q (extended both ways)."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    nx, ny = -uy * w / 2, ux * w / 2
    a = (p[0] - ux * ext, p[1] - uy * ext)
    b = (q[0] + ux * ext, q[1] + uy * ext)
    return [(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny), (b[0] - nx, b[1] - ny), (a[0] - nx, a[1] - ny)]


def side(p, q, keep):
    """Half-plane through p,q, keeping the side that contains point `keep`: returns (a,b,c)."""
    a, b = q[1] - p[1], p[0] - q[0]
    c = -(a * p[0] + b * p[1])
    if a * keep[0] + b * keep[1] + c < 0:
        a, b, c = -a, -b, -c
    return a, b, c


# ---------------------------------------------------------------- the K
# A refined monogram K in a 1000-unit-tall box. A firm stem, a slightly lighter arm and a leg
# that springs from the arm (not from the stem). Terminals are cut flat at the cap and baseline.
K_H = 1000
K_STEM = 176      # stem weight (17.6% of the height: a semibold, echoing the Archivo Expanded wordmark)
K_ARM = 150       # arm weight (lighter: contrast reads as drawn, not clip art)
K_LEG = 162       # leg weight (a touch heavier than the arm, as in a classic K)
K_ARM_TOP = 770   # where the arm's centreline meets the cap line
K_JOIN = 600      # height where the arm's centreline meets the stem's centre
K_LEG_T = 0.36    # where the leg leaves the arm (0 = at the stem, 1 = at the cap)
K_LEG_FOOT = 800  # where the leg's centreline meets the baseline


def k_polys():
    H = K_H
    stem = [(0, 0), (K_STEM, 0), (K_STEM, H), (0, H)]
    pj, pt = (K_STEM / 2, K_JOIN), (K_ARM_TOP, 0)
    arm = band(pj, pt, K_ARM)
    for hp in ((0, 1, 0), (1, 0, 0), (0, -1, H)):      # y>=0, x>=0, y<=H
        arm = clip(arm, *hp)
    ps = (pj[0] + K_LEG_T * (pt[0] - pj[0]), pj[1] + K_LEG_T * (pt[1] - pj[1]))
    pf = (K_LEG_FOOT, H)
    leg = band(ps, pf, K_LEG)
    leg = clip(leg, 0, -1, H)                          # y<=H
    leg = clip(leg, *side(pj, pt, (K_STEM + 400, H)))  # only below/right of the arm's centreline
    leg = clip(leg, 1, 0, -K_STEM / 2)                 # never left of the stem's centre
    return [stem, arm, leg]


# The construction used: arm and leg meet in one crisp notch that touches the stem's right edge
# (as in a geometric sans like Gotham), rather than the leg branching off the arm. Cleaner at 29 pt
# and less "default Helvetica".
KV_NOTCH = 560      # height of the notch where arm and leg meet the stem
KV_ARM_IN = 690     # x of the arm's inner corner at the cap line
KV_LEG_IN = 720     # x of the leg's inner corner at the baseline


def _edge_band(v, p, w, body_pt):
    """A band of width w whose one edge is the line v->p, lying on the side of body_pt."""
    dx, dy = p[0] - v[0], p[1] - v[1]
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    if (body_pt[0] - v[0]) * nx + (body_pt[1] - v[1]) * ny < 0:
        nx, ny = -nx, -ny
    o = (nx * w / 2, ny * w / 2)
    return band((v[0] + o[0], v[1] + o[1]), (p[0] + o[0], p[1] + o[1]), w)


def k_polys_vertex():
    H = K_H
    stem = [(0, 0), (K_STEM, 0), (K_STEM, H), (0, H)]
    v = (K_STEM, KV_NOTCH)
    arm = _edge_band(v, (KV_ARM_IN, 0), K_ARM, (0, 0))
    leg = _edge_band(v, (KV_LEG_IN, H), K_LEG, (0, H))
    for hp in ((0, 1, 0), (1, 0, 0), (0, -1, H)):
        arm = clip(arm, *hp)
        leg = clip(leg, *hp)
    return [stem, arm, leg]


K_STYLE = "vertex"
if K_STYLE == "vertex":
    k_polys = k_polys_vertex

K_W = max(x for poly in k_polys() for x, _ in poly)


def k_path(cx, cy, h):
    """The K as one SVG path (its polygons overlap; use with nonzero fill), centred optically."""
    s = h / K_H
    w = K_W * s
    ox, oy = cx - w / 2 - 0.02 * h, cy - h / 2  # nudge left: the open right side carries less weight
    d = ""
    for poly in k_polys():
        pts = [(ox + x * s, oy + y * s) for x, y in poly]
        area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1]
                   for i in range(len(pts)))
        if area < 0:  # same winding for every piece, so overlaps fill instead of cancelling
            pts.reverse()
        d += "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z "
    return d.strip()


# ---------------------------------------------------------------- wrappers
def svg(body, defs="", bg=None):
    bgs = bg or ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">'
            f'<defs>{defs}</defs>{bgs}{body}</svg>\n')


def field(top, bottom, gid="f"):
    defs = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>')
    return defs, f'<rect width="{S}" height="{S}" fill="url(#{gid})"/>'


def rrect(x, y, w, h, r, fill, extra=""):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r}" fill="{fill}" {extra}/>'


def bar(x, y, w, h, fill, extra=""):
    """A slim stitch: a rect with fully rounded ends."""
    return rrect(x - w / 2, y - h / 2, w, h, w / 2, fill, extra)


def end_stitches(lx, rx, cy, w, h, gap):
    """Two short vertical stitch bars at each sewn end: returns list of (x, y)."""
    out = []
    for x in (lx, rx):
        for dy in (-(gap / 2 + h / 2), gap / 2 + h / 2):
            out.append((x, cy + dy))
    return out


def write(name, text):
    with open(os.path.join(HERE, name), "w") as f:
        f.write(text)


# ---------------------------------------------------------------- a1 · quiet flat label
# Label: 612 wide (59.8%), 316 tall (about 2:1, a real neck label), radius 26 (2.5%), centred.
A1 = dict(w=624, h=284, r=20, kh=172, st_w=12, st_h=46, st_gap=16, st_in=30)


def a1(mode):
    p = A1
    x, y = (S - p["w"]) / 2, (S - p["h"]) / 2
    cx, cy = S / 2, S / 2
    sts = end_stitches(x + p["st_in"], x + p["w"] - p["st_in"], cy, p["st_w"], p["st_h"], p["st_gap"])
    if mode == "tint":
        defs = (f'<mask id="m"><rect width="{S}" height="{S}" fill="#000"/>'
                f'{rrect(x, y, p["w"], p["h"], p["r"], "#fff")}'
                f'<path d="{k_path(cx, cy, p["kh"])}" fill="#000"/>'
                + "".join(bar(sx, sy, p["st_w"], p["st_h"], "#000") for sx, sy in sts) + '</mask>')
        body = f'<rect width="{S}" height="{S}" fill="#fff" mask="url(#m)"/>'
        body += "".join(bar(sx, sy, p["st_w"], p["st_h"], "#fff", 'opacity="0.5"') for sx, sy in sts)
        return svg(body, defs)
    if mode == "full":
        fdefs, bg = field(INDIGO2, "#1D2850")
        lab, ink, st = CHALK, INDIGO, COPPER_D
    else:
        fdefs, bg = field("#141A2E", NIGHT)
        lab, ink, st = "#24315F", "#E6E9F0", COPPER
    body = rrect(x, y, p["w"], p["h"], p["r"], lab)
    body += f'<path d="{k_path(cx, cy, p["kh"])}" fill="{ink}"/>'
    body += "".join(bar(sx, sy, p["st_w"], p["st_h"], st) for sx, sy in sts)
    return svg(body, fdefs, bg)


# ---------------------------------------------------------------- a2 · tone-on-tone
# A deep indigo label on a lighter indigo field; the K in a pale indigo thread; tonal stitches,
# except one copper stitch (the one sewn mark that is "ours").
A2 = dict(w=624, h=284, r=20, kh=172, st_w=12, st_h=46, st_gap=16, st_in=30)


def a2(mode):
    p = A2
    x, y = (S - p["w"]) / 2, (S - p["h"]) / 2
    cx, cy = S / 2, S / 2
    sts = end_stitches(x + p["st_in"], x + p["w"] - p["st_in"], cy, p["st_w"], p["st_h"], p["st_gap"])
    copper_i = 3  # right end, lower stitch
    if mode == "tint":
        lab = rrect(x, y, p["w"], p["h"], p["r"], "#fff", 'opacity="0.30"')
        k = f'<path d="{k_path(cx, cy, p["kh"])}" fill="#fff"/>'
        st = "".join(bar(sx, sy, p["st_w"], p["st_h"], "#fff", f'opacity="{1 if i == copper_i else 0.5}"')
                     for i, (sx, sy) in enumerate(sts))
        return svg(lab + k + st)
    if mode == "full":
        fdefs, bg = field("#2E3E74", "#283767")
        lab, ink, tone, cop = "#161F3F", "#B9C1DC", "#3A4778", COPPER
    else:
        fdefs, bg = field("#1A2140", "#141A33")
        lab, ink, tone, cop = NIGHT, "#9AA4C6", "#2A3358", COPPER
    body = rrect(x, y, p["w"], p["h"], p["r"], lab)
    body += f'<path d="{k_path(cx, cy, p["kh"])}" fill="{ink}"/>'
    body += "".join(bar(sx, sy, p["st_w"], p["st_h"], cop if i == copper_i else tone)
                    for i, (sx, sy) in enumerate(sts))
    return svg(body, fdefs, bg)


# ---------------------------------------------------------------- a3 · loop label
# A loop label folded over a seam. The field is split by the seam: above it the garment's inside
# (one step darker), below it the outside. The label is folded over the seam edge: the fold is its
# top (fully soft corners), the front layer carries the K, the back layer is cut a little longer and
# shows below the front's cut edge in a second chalk tone. Two slim copper stitches sew both layers
# just under the fold.
A3 = dict(w=560, top=352, cap=50, h=322, band=40, r_fold=24, r_cut=14, kh=166, thread=7, roll=16)


def rr_path(x0, y0, x1, y1, rt, rb):
    """Rectangle path with top corner radius rt and bottom corner radius rb."""
    return (f'M{x0},{y0 + rt} Q{x0},{y0} {x0 + rt},{y0} L{x1 - rt},{y0} Q{x1},{y0} {x1},{y0 + rt} '
            f'L{x1},{y1 - rb} Q{x1},{y1} {x1 - rb},{y1} L{x0 + rb},{y1} Q{x0},{y1} {x0},{y1 - rb} Z')


def a3(mode):
    # A loop label folded over a seam. The seam is a band across the icon with one copper topstitch
    # line along it. The label wraps over the band: the part over the band is the fold (the fabric
    # turning over the edge, one step deeper in tone, with soft top corners); below hangs the front
    # layer with the K. The band and the fold line up, so the second tone reads as the fold, not as
    # a shadow or a 3D edge.
    p = A3
    x0, x1 = (S - p["w"]) / 2, (S + p["w"]) / 2
    top = p["top"]
    band_y0 = top + p["cap"] - p["band"]
    fold_y = top + p["cap"]
    y1 = top + p["h"]
    whole = rr_path(x0, top, x1, y1, p["r_fold"], p["r_cut"])
    # the fold's lower edge rolls down a little in the middle: fabric turning over, not a title bar
    roll = (f'M0,0 L{S},0 L{S},{fold_y} L{x1},{fold_y} '
            f'Q{S / 2},{fold_y + 2 * p["roll"]} {x0},{fold_y} L0,{fold_y} Z')
    cap_clip = f'<clipPath id="cap"><path d="{roll}"/></clipPath>'
    cx, cy = S / 2, (fold_y + p["roll"] + y1) / 2
    kd = k_path(cx, cy, p["kh"])
    band = f'<rect y="{band_y0}" width="{S}" height="{p["band"]}"'
    ty = band_y0 + p["band"] / 2 - p["thread"] / 2
    gap = 26  # the topstitch stops short of the label on each side
    threads = (f'<rect x="-10" y="{ty}" width="{x0 - gap + 10}" height="{p["thread"]}" rx="{p["thread"] / 2}"/>'
               f'<rect x="{x1 + gap}" y="{ty}" width="{S - x1 - gap + 10}" height="{p["thread"]}" rx="{p["thread"] / 2}"/>')
    if mode == "tint":
        defs = cap_clip + (f'<mask id="m"><rect width="{S}" height="{S}" fill="#000"/>'
                           f'<path d="{whole}" fill="#fff"/><path d="{roll}" fill="#000"/>'
                           f'<path d="{kd}" fill="#000"/></mask>'
                           f'<mask id="mu"><rect width="{S}" height="{S}" fill="#fff"/><path d="{whole}" fill="#000"/>'
                           f'<g fill="#000">{threads}</g></mask>')
        body = (f'{band} fill="#fff" opacity="0.16" mask="url(#mu)"/>'
                f'<g fill="#fff" opacity="0.6">{threads}</g>'
                f'<g clip-path="url(#cap)"><path d="{whole}" fill="#fff" opacity="0.55"/></g>'
                f'<rect width="{S}" height="{S}" fill="#fff" mask="url(#m)"/>')
        return svg(body, defs)
    if mode == "full":
        fdefs, bg = field(INDIGO2, "#1D2850")
        band_c, cap_c, front_c, ink, cop = "#18214A", "#CFD3DE", CHALK, INDIGO, COPPER
    else:
        fdefs, bg = field("#141A2E", NIGHT)
        band_c, cap_c, front_c, ink, cop = "#07090F", "#1B2550", "#26346A", "#E6E9F0", COPPER
    body = (f'{band} fill="{band_c}"/><g fill="{cop}">{threads}</g>'
            f'<path d="{whole}" fill="{front_c}"/>'
            f'<g clip-path="url(#cap)"><path d="{whole}" fill="{cap_c}"/></g>'
            f'<path d="{kd}" fill="{ink}"/>')
    return svg(body, fdefs + cap_clip, bg)


# ---------------------------------------------------------------- a4 · woven texture
# The a1 label, with a fine horizontal weave inside it: 6 px rows every 16 px in a barely darker
# chalk. Up close it's fabric; at 60 pt the rows melt into one flat tone.
A4 = dict(w=624, h=284, r=20, kh=172, st_w=12, st_h=46, st_gap=16, st_in=30, row=6, pitch=14)


def a4(mode):
    p = A4
    x, y = (S - p["w"]) / 2, (S - p["h"]) / 2
    cx, cy = S / 2, S / 2
    sts = end_stitches(x + p["st_in"], x + p["w"] - p["st_in"], cy, p["st_w"], p["st_h"], p["st_gap"])
    clipdef = f'<clipPath id="lab">{rrect(x, y, p["w"], p["h"], p["r"], "#000")}</clipPath>'
    rows = []
    yy = y + (p["pitch"] - p["row"]) / 2 + 2
    while yy < y + p["h"]:
        rows.append(f'<rect x="{x}" y="{yy:.1f}" width="{p["w"]}" height="{p["row"]}"/>')
        yy += p["pitch"]
    rows = "".join(rows)
    kd = k_path(cx, cy, p["kh"])
    if mode == "tint":
        defs = clipdef + (f'<mask id="m"><rect width="{S}" height="{S}" fill="#000"/>'
                          f'{rrect(x, y, p["w"], p["h"], p["r"], "#fff")}'
                          f'<g fill="#9a9a9a" clip-path="url(#lab)">{rows}</g>'
                          f'<path d="{kd}" fill="#000"/>'
                          + "".join(bar(sx, sy, p["st_w"], p["st_h"], "#000") for sx, sy in sts) + '</mask>')
        body = f'<rect width="{S}" height="{S}" fill="#fff" mask="url(#m)"/>'
        body += "".join(bar(sx, sy, p["st_w"], p["st_h"], "#fff", 'opacity="0.5"') for sx, sy in sts)
        return svg(body, defs)
    if mode == "full":
        fdefs, bg = field(INDIGO2, "#1D2850")
        lab, weave, ink, st = CHALK, "#E8EAEF", INDIGO, COPPER_D
    else:
        fdefs, bg = field("#141A2E", NIGHT)
        lab, weave, ink, st = "#24315F", "#202C58", "#E6E9F0", COPPER
    body = rrect(x, y, p["w"], p["h"], p["r"], lab)
    body += f'<g fill="{weave}" clip-path="url(#lab)">{rows}</g>'
    body += f'<path d="{kd}" fill="{ink}"/>'
    body += "".join(bar(sx, sy, p["st_w"], p["st_h"], st) for sx, sy in sts)
    return svg(body, fdefs + clipdef, bg)


if __name__ == "__main__":
    for name, fn in (("a1", a1), ("a2", a2), ("a3", a3), ("a4", a4)):
        write(f"{name}.svg", fn("full"))
        write(f"{name}-dark.svg", fn("dark"))
        write(f"{name}-tint.svg", fn("tint"))
    print("ok")
