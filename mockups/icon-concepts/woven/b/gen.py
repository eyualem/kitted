"""Kitted woven-label icon, round b (bold and modern): b1-b4, each light / -dark / -tint.

1024 x 1024 SVG, shapes only (letters are paths). Run: /usr/bin/python3 gen.py
"""
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))

INDIGO = "#1A2448"
INDIGO_2 = "#22305C"
NIGHT = "#0C0E14"
CHALK = "#EEF0F5"
CHALK_DIM = "#E2E5EC"   # chalk in the dark icon, a touch down so it doesn't glare
CU = "#DE9762"
CU_ON_CHALK = "#C9733A"  # the copper as it must sit on chalk to hold (same hue, deeper)


# ---------- the K ----------------------------------------------------------
# A custom wide geometric K in a 1000 x 1000 box (Archivo Expanded in spirit: wide, flat
# horizontal terminals, the leg springs off the arm, not the stem). One outline, no overlaps.
def _isect(p, d, q, e):
    # p + s d = q + r e
    det = d[0] * (-e[1]) - d[1] * (-e[0])
    s = ((q[0] - p[0]) * (-e[1]) - (q[1] - p[1]) * (-e[0])) / det
    return (p[0] + s * d[0], p[1] + s * d[1])


def k_outline(W=1150.0, H=1000.0, t=260.0, yB=740.0, d_arm=255.0, d_leg=270.0, leg_deg=50.0):
    th = math.atan2(yB, W - t)
    aw = d_arm / math.sin(th)
    yA = yB * (W - aw - t) / (W - t)
    phi = math.radians(leg_deg)
    lw = d_leg / math.sin(phi)
    arm_dir = (t - W, yB)
    leg_dir = (-math.cos(phi), -math.sin(phi))
    R = _isect((W, H), leg_dir, (W, 0), arm_dir)
    L = _isect((W - lw, H), leg_dir, (W, 0), arm_dir)
    return [(0, 0), (t, 0), (t, yA), (W - aw, 0), (W, 0), R, (W, H), (W - lw, H), L, (t, yB), (t, H), (0, H)]


K_PTS = k_outline()
K_W, K_H = 1150.0, 1000.0


def k_d(cx, cy, h, pts=K_PTS, w=K_W):
    s = h / K_H
    x0, y0 = cx - w * s / 2, cy - h / 2
    return "M" + " L".join(f"{x0 + x * s:.1f},{y0 + y * s:.1f}" for x, y in pts) + " Z"


def i_d(x, cy, h, stem):
    # the "I": a bar the same weight as the K's stem
    return f"M{x:.1f},{cy - h / 2:.1f} h{stem:.1f} v{h:.1f} h{-stem:.1f} Z"


def svg(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'
            f'<defs>{defs}</defs>{body}</svg>\n')


def stitch(x1, y1, x2, y2, color, w, dash, gap, extra=""):
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{w}" '
            f'stroke-linecap="round" stroke-dasharray="{dash} {gap}"{extra}/>')


# ---------- b1 · Label as the whole icon -----------------------------------
# The icon IS the label: full-bleed indigo, the two sewn ends as copper running stitches top to
# bottom, the folded ends a shade lighter outside them, a big K centred.
def b1(mode):
    SX = 168           # stitch line inset from each edge
    SW, DASH, GAP = 22, 52, 32
    K_HT = 430
    k = k_d(512, 512, K_HT)
    # stitch lines start/stop on a dash so both ends land clean at the icon edge
    if mode == "tint":
        body = (stitch(SX, -20, SX, 1044, "#FFFFFF", SW, DASH, GAP, ' opacity="0.75"')
                + stitch(1024 - SX, -20, 1024 - SX, 1044, "#FFFFFF", SW, DASH, GAP, ' opacity="0.75"')
                + f'<path d="{k}" fill="#FFFFFF"/>')
        return svg(body)
    field, fold, ink = (INDIGO, INDIGO_2, CHALK) if mode == "full" else (NIGHT, INDIGO, CHALK_DIM)
    body = (f'<rect width="1024" height="1024" fill="{field}"/>'
            + stitch(SX, -20, SX, 1044, CU, SW, DASH, GAP)
            + stitch(1024 - SX, -20, 1024 - SX, 1044, CU, SW, DASH, GAP)
            + f'<path d="{k}" fill="{ink}"/>')
    return svg(body)


# ---------- b2 · The tag edge ----------------------------------------------
# A chalk band crosses the icon and runs off both sides (bigger than the icon); the K in indigo;
# one copper running stitch near the right end only.
def b2(mode):
    BT, BB = 262, 762          # band top / bottom
    K_HT = 344
    KX = 446
    SX = 876
    SW, DASH, GAP = 22, 52, 30
    k = k_d(KX, (BT + BB) / 2, K_HT)
    if mode == "tint":
        defs = ('<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                '<rect width="1024" height="1024" fill="#fff"/>'
                f'<path d="{k}" fill="#000"/>'
                + stitch(SX, BT + 44, SX, BB - 44, "#000", SW, DASH, GAP) + '</mask>')
        body = f'<rect x="0" y="{BT}" width="1024" height="{BB - BT}" fill="#FFFFFF" mask="url(#m)"/>'
        return svg(body, defs)
    if mode == "full":
        bg, band, ink, cu = INDIGO, CHALK, INDIGO, CU_ON_CHALK
    else:
        bg, band, ink, cu = NIGHT, INDIGO_2, CHALK_DIM, CU
    body = (f'<rect width="1024" height="1024" fill="{bg}"/>'
            f'<rect x="0" y="{BT}" width="1024" height="{BB - BT}" fill="{band}"/>'
            f'<path d="{k}" fill="{ink}"/>'
            + stitch(SX, BT + 44, SX, BB - 44, cu, SW, DASH, GAP))
    return svg(body)


# ---------- b3 · Copper thread ---------------------------------------------
# A chalk label tilted -6 deg on indigo, sewn on by one continuous copper thread: it runs down the
# label's left seam, out through the bottom edge and away off the icon in one curve.
LBL_W, LBL_H, LBL_R = 640, 400, 22
ROT = -6
CX, CY = 512, 476


def b3(mode):
    k = k_d(0, 0, 250)
    hw, hh = LBL_W / 2, LBL_H / 2
    seam_x = -hw + 64
    TW = 24
    # in label-local coordinates: starts just inside the top edge, straight down the seam,
    # through the bottom edge, then one long curve away to the lower left, off the icon.
    # starts just inside the top edge, straight down the seam, out through the bottom edge, one
    # soft turn, then pulled taut along under the label and off the right side of the icon.
    thread = (f"M{seam_x},{-hh + 46} L{seam_x},{hh + 20} "
              f"C{seam_x},{hh + 74} {seam_x + 22},{hh + 74} {seam_x + 96},{hh + 74} L{seam_x + 1100},{hh + 74}")
    grp = f'transform="translate({CX} {CY}) rotate({ROT})"'
    label = f'<rect x="{-hw}" y="{-hh}" width="{LBL_W}" height="{LBL_H}" rx="{LBL_R}"'
    kx = 34  # K sits a little right of centre to balance the seam
    if mode == "tint":
        defs = ('<mask id="m" maskUnits="userSpaceOnUse" x="-1024" y="-1024" width="3072" height="3072">'
                '<rect x="-1024" y="-1024" width="3072" height="3072" fill="#fff"/>'
                f'<path d="{k}" transform="translate({kx} 0)" fill="#000"/>'
                f'<path d="{thread}" fill="none" stroke="#000" stroke-width="{TW + 18}" stroke-linecap="round"/>'
                '</mask>')
        body = (f'<g {grp}>{label} fill="#FFFFFF" mask="url(#m)"/>'
                f'<path d="{thread}" fill="none" stroke="#FFFFFF" stroke-width="{TW}" stroke-linecap="round"/></g>')
        return svg(body, defs)
    if mode == "full":
        bg, lab, ink = INDIGO, CHALK, INDIGO
    else:
        bg, lab, ink = NIGHT, CHALK_DIM, INDIGO
    body = (f'<rect width="1024" height="1024" fill="{bg}"/>'
            f'<g {grp}>{label} fill="{lab}"/>'
            f'<path d="{k}" transform="translate({kx} 0)" fill="{ink}"/>'
            f'<path d="{thread}" fill="none" stroke="{CU}" stroke-width="{TW}" stroke-linecap="round"/></g>')
    return svg(body)


# ---------- b4 · Wordmark crop ---------------------------------------------
# A close-up of the real wordmark label: its left end sewn onto a chalk shirt, the copper stitch
# just in from the end, a huge K and the start of the I, the label running off top, right, bottom.
def b4(mode):
    LX = 96                    # label's left end
    SX = 186                   # stitch
    K_HT = 470
    KX0 = 256                  # K's left edge
    s = K_HT / K_H
    k = k_d(KX0 + K_W * s / 2, 512, K_HT)
    stem = 260 * s
    ix = KX0 + K_W * s + 150   # tracked wide, as the wordmark is
    ii = i_d(ix, 512, K_HT, stem)
    SW, DASH, GAP = 24, 58, 38
    if mode == "tint":
        body = (f'<rect x="{LX}" y="-10" width="{1034 - LX}" height="1044" rx="10" fill="#FFFFFF" opacity="0.14"/>'
                + stitch(SX, -20, SX, 1044, "#FFFFFF", SW, DASH, GAP, ' opacity="0.7"')
                + f'<path d="{k} {ii}" fill="#FFFFFF"/>')
        return svg(body)
    if mode == "full":
        shirt, lab, ink = CHALK, INDIGO, CHALK
    else:
        shirt, lab, ink = NIGHT, INDIGO_2, CHALK_DIM
    body = (f'<rect width="1024" height="1024" fill="{shirt}"/>'
            f'<rect x="{LX}" y="-10" width="{1034 - LX}" height="1044" rx="10" fill="{lab}"/>'
            + stitch(SX, -20, SX, 1044, CU, SW, DASH, GAP)
            + f'<path d="{k} {ii}" fill="{ink}"/>')
    return svg(body)


if __name__ == "__main__":
    for name, fn in (("b1", b1), ("b2", b2), ("b3", b3), ("b4", b4)):
        for mode, suf in (("full", ""), ("dark", "-dark"), ("tint", "-tint")):
            with open(os.path.join(OUT, f"{name}{suf}.svg"), "w") as f:
                f.write(fn(mode))
    print("ok")
