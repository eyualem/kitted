"""Kitted icon finalists: final-N.svg, final-N-dark.svg, final-N-tint.svg (1024 x 1024, shapes only).

Run: /usr/bin/python3 mockups/icon-concepts/finalists/gen.py
"""
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))

INK = "#1A2448"      # indigo ink (K, stitches on chalk)
CHALK = "#EEF0F5"
CU = "#DE9762"       # copper
CU_LIGHT = "#EDB78D" # dome highlight
CU_DEEP = "#9C5326"  # stamped groove
CU_STITCH = "#CF7C43"  # copper stitches on chalk (a touch deeper so they hold up on the light label)

BG = {"full": ("#22305C", "#1A2448"), "dark": ("#1A2448", "#0C0E14"), "tint": None}
CHALK_BY = {"full": CHALK, "dark": "#E6E9F0", "tint": "#FFFFFF"}

# The two-piece K (brand-4), in a 552 x 520 box: a stem and a separate chevron.
K_STEM = [(0, 0), (150, 0), (150, 520), (0, 520)]
K_CHEV = [(372, 0), (552, 0), (335.3, 249.2), (552, 520), (362, 520), (236.4, 363), (202, 363), (202, 195.5)]


def k_polys(cx, cy, h):
    s = h / 520.0
    x0, y0 = cx - 276 * s, cy - 260 * s
    out = []
    for poly in (K_STEM, K_CHEV):
        out.append(" ".join(f"{x0 + x * s:.1f},{y0 + y * s:.1f}" for x, y in poly))
    return out


def k_shape(cx, cy, h, fill, extra=""):
    return "".join(f'<polygon points="{p}" fill="{fill}"{extra}/>' for p in k_polys(cx, cy, h))


def twill(mode):
    if mode == "tint":
        return ""
    op = 0.035 if mode == "full" else 0.03
    bands = "".join(f'<rect x="{-951 + 120 * i:.1f}" y="-600" width="46" height="2224"/>' for i in range(26))
    return f'<g fill="#FFFFFF" opacity="{op}" transform="rotate(27 512 512)">{bands}</g>'


def wrap(mode, body, defs=""):
    bg = ""
    if BG[mode]:
        a, b = BG[mode]
        defs += (f'<linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">'
                 f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
        bg = '<rect width="1024" height="1024" fill="url(#bg)"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'
            f'<defs>{defs}</defs>{bg}{twill(mode)}{body}</svg>\n')


# ---------- 1. Button on the pocket -----------------------------------------
# A front-pocket scoop: one solid chalk band drops in from the top edge, bends round and runs
# into a copper shank button at lower right. The K is stamped into the button in indigo.
B_CX, B_CY, B_R = 604, 604, 282          # button (55% of the icon)
SEAM_X, SEAM_W = 150, 78                 # vertical run of the scoop, band width


def seam_path():
    r = B_CX - SEAM_X                    # quarter-circle radius so it lands at the button centre
    top = B_CY - r                       # where the curve starts on the vertical run
    return f"M{SEAM_X},-80 L{SEAM_X},{top} A{r},{r} 0 0 0 {B_CX},{B_CY} L1110,{B_CY}"


def pocket_path():
    """The pocket opening: the area inside the scoop (upper right), a shade darker than the front panel."""
    r = B_CX - SEAM_X
    top = B_CY - r
    return f"M{SEAM_X},-80 L{SEAM_X},{top} A{r},{r} 0 0 0 {B_CX},{B_CY} L1110,{B_CY} L1110,-80 Z"


def final1(mode):
    ch = CHALK_BY[mode]
    seam = (f'<path d="{seam_path()}" fill="none" stroke="{ch}" stroke-width="{SEAM_W}" '
            f'stroke-linecap="butt"/>')
    pocket_fill = {"full": "#111833", "dark": "#05070D", "tint": "#FFFFFF"}[mode]
    pocket_op = {"full": 0.55, "dark": 0.6, "tint": 0.10}[mode]
    pocket = f'<path d="{pocket_path()}" fill="{pocket_fill}" opacity="{pocket_op}"/>'
    groove_r, groove_w = 214, 44
    k_h = 222
    if mode == "tint":
        defs = (f'<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                f'<rect width="1024" height="1024" fill="#fff"/>'
                f'<circle cx="{B_CX}" cy="{B_CY}" r="{groove_r}" fill="none" stroke="#000" stroke-width="{groove_w}"/>'
                f'{k_shape(B_CX, B_CY, k_h, "#000")}</mask>'
                # a gap round the button so the seam stops short of it
                f'<mask id="g" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                f'<rect width="1024" height="1024" fill="#fff"/>'
                f'<circle cx="{B_CX}" cy="{B_CY}" r="{B_R + 30}" fill="#000"/></mask>')
        body = (f'{pocket}<g mask="url(#g)">{seam}</g>'
                f'<circle cx="{B_CX}" cy="{B_CY}" r="{B_R}" fill="#FFFFFF" mask="url(#m)"/>')
        return wrap(mode, body, defs)
    # dome: a flat lighter half-moon at upper left of the button face (inside the groove)
    face = groove_r - groove_w / 2
    defs = (f'<clipPath id="face"><circle cx="{B_CX}" cy="{B_CY}" r="{face}"/></clipPath>'
            f'<mask id="g" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
            f'<rect width="1024" height="1024" fill="#fff"/>'
            f'<circle cx="{B_CX}" cy="{B_CY}" r="{B_R + 30}" fill="#000"/></mask>')
    off = 74
    body = (f'{pocket}{seam}'
            f'<circle cx="{B_CX}" cy="{B_CY}" r="{B_R}" fill="{CU}"/>'
            f'<g clip-path="url(#face)"><circle cx="{B_CX}" cy="{B_CY}" r="{face}" fill="{CU_LIGHT}"/>'
            f'<circle cx="{B_CX + off}" cy="{B_CY + off}" r="{face + 18}" fill="{CU}"/></g>'
            f'<circle cx="{B_CX}" cy="{B_CY}" r="{groove_r}" fill="none" stroke="{CU_DEEP}" stroke-width="{groove_w}"/>'
            f'{k_shape(B_CX, B_CY, k_h, INK)}')
    return wrap(mode, body, defs)


# ---------- the neck label (shared by 2 and 3) --------------------------------
# Seen from inside the back of a garment: the neck opening is a shade darker at the top, and the
# woven label is sewn just under the neckline, so it follows the collar's curve (the drape). Its two
# ends are sewn down with a row of bold stitches. The curve is what keeps it from reading as a
# ticket or a card: tickets and cards are straight.
NECK_C = (512, -555)       # centre of the neckline circle (above the icon)
NECK_R = 890               # neckline radius: the opening's edge sits at y = 290 in the middle
NECK_SHADE = {"full": ("#111833", 0.55), "dark": ("#05070D", 0.6), "tint": ("#FFFFFF", 0.10)}


def polar(r, deg):
    cx, cy = NECK_C
    a = math.radians(deg)
    return cx + r * math.sin(a), cy + r * math.cos(a)


def label_arc_path(ri, ro, half):
    """An arc segment of the collar circle: inner radius ri, outer ro, from -half to +half degrees."""
    x1, y1 = polar(ri, -half)
    x2, y2 = polar(ri, half)
    x3, y3 = polar(ro, half)
    x4, y4 = polar(ro, -half)
    return (f"M{x1:.1f},{y1:.1f} A{ri},{ri} 0 0 0 {x2:.1f},{y2:.1f} L{x3:.1f},{y3:.1f} "
            f"A{ro},{ro} 0 0 1 {x4:.1f},{y4:.1f} Z")


def stitches(ri, ro, half, inset_deg, n, w, length, pad):
    """Bold stitch bars along each sewn end, each turned to lie along the end's radial line."""
    out = []
    span = ro - ri - 2 * pad
    gap = (span - n * length) / (n - 1)
    for sgn in (-1, 1):
        deg = sgn * (half - inset_deg)
        r = ri + pad + length / 2
        for _ in range(n):
            x, y = polar(r, deg)
            out.append((x, y, -deg))
            r += length + gap
    return [(x, y, a, w, length) for x, y, a in out]


def bars_svg(bars, color):
    return "".join(f'<rect x="{x - w / 2:.1f}" y="{y - h / 2:.1f}" width="{w}" height="{h}" rx="15" fill="{color}" '
                   f'transform="rotate({a:.2f} {x:.1f} {y:.1f})"/>' for x, y, a, w, h in bars)


def neck(mode):
    col, op = NECK_SHADE[mode]
    cx, cy = NECK_C
    return f'<circle cx="{cx}" cy="{cy}" r="{NECK_R}" fill="{col}" opacity="{op}"/>'


def neck_label(mode, ri, ro, half, stitch_color, inner_cuts="", inner="", st=(2.6, 4, 30, 56, 22)):
    """Returns (defs, body). The label is chalk with copper/indigo stitches; in tint it's white with
    the stitches and `inner_cuts` cut out. Corners are rounded by a same-colour stroke."""
    inset, n, w, length, pad = st
    bars = stitches(ri, ro, half, inset, n, w, length, pad)
    shape = label_arc_path(ri, ro, half)
    if mode == "tint":
        m = (f'<mask id="labm" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
             f'<rect width="1024" height="1024" fill="#fff"/>{bars_svg(bars, "#000")}{inner_cuts}</mask>')
        body = (f'<path d="{shape}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="36" stroke-linejoin="round" '
                f'mask="url(#labm)"/>')
        return m, body
    ch = CHALK_BY[mode]
    body = (f'<path d="{shape}" fill="{ch}" stroke="{ch}" stroke-width="36" stroke-linejoin="round"/>'
            f'{bars_svg(bars, stitch_color)}{inner}')
    return "", body


# ---------- 2. Woven label ----------------------------------------------------
L2 = (918, 1250, 19.4)     # inner radius, outer radius, half-angle: about 71% of the width


def final2(mode):
    ri, ro, half = L2
    kx, ky = polar((ri + ro) / 2, 0)
    kh = 236
    defs, body = neck_label(mode, ri, ro, half, CU_STITCH, inner_cuts=k_shape(kx, ky, kh, "#000"),
                            inner=k_shape(kx, ky, kh, INK))
    return wrap(mode, neck(mode) + body, defs)


# ---------- 3. Label + check --------------------------------------------------
# The same neck label (no K; indigo stitches so the check is the only copper) with one bold copper
# chalk check across it. The long arm leaves the label and runs up into the neck opening, so the
# check sits on a garment, not inside a box.
L3 = (918, 1250, 19.4)
CHECK = [(334, 588), (452, 700), (772, 252)]
CHECK_W, CHECK_GAP = 104, 20


def check_svg(color, w):
    pts = " ".join(f"{x},{y}" for x, y in CHECK)
    return (f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="{w}" '
            f'stroke-linejoin="miter" stroke-miterlimit="4" stroke-linecap="butt"/>')


def final3(mode):
    ri, ro, half = L3
    defs, lab = neck_label(mode, ri, ro, half, INK)
    m = (f'<mask id="gap" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
         f'<rect width="1024" height="1024" fill="#fff"/>{check_svg("#000", CHECK_W + 2 * CHECK_GAP)}</mask>')
    color = "#FFFFFF" if mode == "tint" else CU
    body = f'{neck(mode)}<g mask="url(#gap)">{lab}</g>{check_svg(color, CHECK_W)}'
    return wrap(mode, body, defs + m)


if __name__ == "__main__":
    for n, fn in ((1, final1), (2, final2), (3, final3)):
        for mode, suf in (("full", ""), ("dark", "-dark"), ("tint", "-tint")):
            with open(os.path.join(OUT, f"final-{n}{suf}.svg"), "w") as f:
                f.write(fn(mode))
    print("wrote 9 SVGs to", OUT)
