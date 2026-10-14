#!/usr/bin/python3
"""Kitted icon, round k: a single refined K on navy. k1..k5, each light / -dark / -tint.
1024 x 1024 SVG, outlined paths only (no text, no fonts). Run: /usr/bin/python3 gen.py
The K is constructed, not traced: the skeleton follows Archivo Expanded Bold's K
(the leg springs from the arm, flat horizontal terminals, wide set), with icon-size corrections."""
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
S = 1024

# ---- palette
CHALK = "#F1F2F6"
CHALK_D = "#E4E7EF"
COPPER = "#DE9762"
COPPER_D = "#C9824F"


def ln(p, q):
    """line through p, q as (point, direction)"""
    return (p, (q[0] - p[0], q[1] - p[1]))


def meet(l1, l2):
    (x1, y1), (dx1, dy1) = l1
    (x2, y2), (dx2, dy2) = l2
    den = dx1 * dy2 - dy1 * dx2
    t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / den
    return (x1 + t * dx1, y1 + t * dy1)


def at_y(l, y):
    return meet(l, ((0, y), (1, 0)))


def at_x(l, x):
    return meet(l, ((x, 0), (0, 1)))


def offset(l, d):
    """shift a line by d along its left normal (y-up coords)"""
    (x, y), (dx, dy) = l
    n = math.hypot(dx, dy)
    return ((x - dy / n * d, y + dx / n * d), (dx, dy))


class K:
    """Geometry in units of cap height (H = 1), y up, origin = bottom-left of the stem."""

    def __init__(self, s=0.262, W=1.16, yj=0.48, ta=0.238, tl=0.27, yo=0.58, ov=0.014, thin=0.022, taper=1.0):
        self.s, self.W, self.H = s, W, 1.0
        xa1 = W - ov                        # arm's top-right corner; the leg's foot overshoots it by ov
        # solve the arm's top-left corner xa0 so the arm's perpendicular thickness is ta
        lo, hi = s + 0.05, xa1 - 0.01
        for _ in range(60):
            xa0 = (lo + hi) / 2
            a = math.atan2(1 - yj, xa0 - s)
            t = (xa1 - xa0) * math.sin(a)
            lo, hi = (xa0, hi) if t > ta else (lo, xa0)
        self.alpha = a
        self.up = ln((s, yj), (xa0, 1))          # arm upper/left edge
        self.lowL = ((xa1, 1), (xa0 - s, 1 - yj))  # arm lower/right edge, parallel
        # leg: outer edge from the foot (W, 0) to the arm's lower edge at height yo
        P7 = at_y(self.lowL, yo)
        self.out = ln((W, 0), P7)
        b = math.atan2(yo, W - P7[0])
        self.beta = b
        foot_in = W - tl / math.sin(b)
        self.inn = ((foot_in, 0), self.out[1])
        P10 = meet(self.inn, self.lowL)
        P11 = at_x(self.lowL, s)
        P11 = (s, P11[1] + thin)                 # joint thinning: the arm narrows a touch where it enters the stem
        foot_in = W - (W - foot_in) * taper      # taper < 1: the leg narrows toward the foot, like a tapered trouser
        self.P = dict(P1=(0, 0), P2=(0, 1), P3=(s, 1), P4=(s, yj), P5=(xa0, 1), P6=(xa1, 1), P7=P7,
                      P8=(W, 0), P9=(foot_in, 0), P10=P10, P11=P11, P12=(s, 0))
        self.xa0, self.xa1 = xa0, xa1

    def outline(self):
        P = self.P
        return [P[k] for k in ("P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12")]

    def stem(self):
        s = self.s
        return [(0, 0), (0, 1), (s, 1), (s, 0)]

    def chevron(self, cut_x):
        """arm + leg, cut by a vertical line at x = cut_x (for the stencil and the layered K)"""
        P = self.P
        A1 = at_x(self.up, cut_x)
        lower = ln(P["P10"], P["P11"])
        A2 = at_x(lower, cut_x)
        return [A1, P["P5"], P["P6"], P["P7"], P["P8"], P["P9"], P["P10"], A2]


def area_centroid(pts):
    a = cx = cy = 0
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    a /= 2
    return cx / (6 * a), cy / (6 * a)


class Place:
    """Maps K units to icon pixels: cap height h px, optically centred on (cx, cy)."""

    def __init__(self, k, h, cx=S / 2, cy=S / 2, lift=0.012):
        self.k, self.h = k, h
        gx, _ = area_centroid(k.outline())
        bx = k.W / 2
        ox = (bx + gx) / 2                       # optical x-centre: halfway between box centre and ink centroid
        self.x0 = cx - ox * h
        self.y0 = cy + h / 2 - lift * h          # baseline; lifted slightly above true centre

    def pt(self, p):
        return (self.x0 + p[0] * self.h, self.y0 - p[1] * self.h)

    def d(self, pts):
        q = [self.pt(p) for p in pts]
        return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in q) + " Z"


def svg(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">'
            f'<defs>{defs}</defs>{body}</svg>')


def field(top, bot, gid="f"):
    defs = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>')
    return defs, f'<rect width="{S}" height="{S}" fill="url(#{gid})"/>'


# fields: light (the default icon) and dark (iOS dark mode)
NAVY = ("#243266", "#151C3C")       # k1, k2, k4, k5: navy, a gentle top-to-bottom grade
NAVY_DARK = ("#141A33", "#0A0D1B")
NIGHT = ("#161D36", "#0D1121")      # k3: night navy, as in c2-dark but kept navy at the bottom
NIGHT_DARK = ("#0D1120", "#07090F")
BAND, BAND_DARK = "#26346A", "#1A2448"

KH = 0.555 * S                      # cap height for k1, k2, k4, k5 (55.5% of the icon)


def write(name, text):
    with open(os.path.join(HERE, name), "w") as f:
        f.write(text)


def mono(fill_paths, defs=""):
    """tint version: white shapes on transparent; iOS supplies the dark ground and the tint"""
    return svg(fill_paths, defs)


# ---------------------------------------------------------------- k1 pure
def k1(mode, k=K()):
    pl = Place(k, KH)
    d = pl.d(k.outline())
    if mode == "tint":
        return mono(f'<path d="{d}" fill="#fff"/>')
    fd, bg = field(*(NAVY if mode == "light" else NAVY_DARK))
    ink = CHALK if mode == "light" else CHALK_D
    return svg(bg + f'<path d="{d}" fill="{ink}"/>', fd)


# ---------------------------------------------------------------- k2 copper gusset
def gusset(k, gap=0.0, depth=0.16):
    """a small copper wedge filling the tip of the crotch where the arm meets the stem (a gusset);
    gap > 0 insets it (tried: it reads as a play button). Its open edge is square to the crotch's bisector, so it reads as a wedge driven into the joint"""
    vx = ((k.s + gap, 0), (0, 1))
    upo = offset(k.up, gap)                  # left normal of an up-right line points up-left: into the crotch
    apex = meet(vx, upo)
    ux, uy = k.up[1]; n = math.hypot(ux, uy); ux, uy = ux / n, uy / n
    bx, by = ux, uy + 1; n = math.hypot(bx, by); bx, by = bx / n, by / n
    c = (apex[0] + bx * depth, apex[1] + by * depth)
    edge = (c, (-by, bx))
    return [apex, meet(edge, upo), meet(edge, vx)]


def k2(mode, k=K()):
    pl = Place(k, KH)
    d = pl.d(k.outline())
    g = pl.d(gusset(k))
    if mode == "tint":
        return mono(f'<path d="{d}" fill="#fff"/><path d="{g}" fill="#fff" opacity="0.55"/>')
    fd, bg = field(*(NAVY if mode == "light" else NAVY_DARK))
    ink = CHALK if mode == "light" else CHALK_D
    cu = COPPER if mode == "light" else COPPER_D
    return svg(bg + f'<path d="{d}" fill="{ink}"/><path d="{g}" fill="{cu}"/>', fd)


# ---------------------------------------------------------------- k3 two-tone navy (band)
K3H, BAND_H = 0.45 * S, 0.62 * S


def k3(mode, k=K()):
    pl = Place(k, K3H)
    d = pl.d(k.outline())
    y = (S - BAND_H) / 2
    band = f'<rect x="0" y="{y:.1f}" width="{S}" height="{BAND_H:.1f}" fill="{{}}"/>'
    if mode == "tint":
        return mono(band.format("#fff").replace("/>", ' opacity="0.16"/>') + f'<path d="{d}" fill="#fff"/>')
    fd, bg = field(*(NIGHT if mode == "light" else NIGHT_DARK))
    b = BAND if mode == "light" else BAND_DARK
    ink = CHALK if mode == "light" else CHALK_D
    return svg(bg + band.format(b) + f'<path d="{d}" fill="{ink}"/>', fd)


# ---------------------------------------------------------------- k4 stencil cut
CUT = 34 / KH                       # 34 px at 1024


def k4(mode, k=K()):
    pl = Place(k, KH)
    d = pl.d(k.stem()) + " " + pl.d(k.chevron(k.s + CUT))
    if mode == "tint":
        return mono(f'<path d="{d}" fill="#fff"/>')
    fd, bg = field(*(NAVY if mode == "light" else NAVY_DARK))
    ink = CHALK if mode == "light" else CHALK_D
    return svg(bg + f'<path d="{d}" fill="{ink}"/>', fd)


# ---------------------------------------------------------------- k5 layered: two pieces, a tonal overlap
def overlap(k):
    """where the arm band, carried on to the stem's left edge, lies over the stem"""
    P = k.P
    lower = ln(P["P10"], P["P11"])
    return [at_x(k.up, 0), at_x(k.up, k.s), at_x(lower, k.s), at_x(lower, 0)]


def tailored(leg=0.76, arm=0.86):
    """the tailored K: both diagonals narrow toward their ends, like a tapered trouser leg and a
    lapel point, while they keep full weight at the joint"""
    k = K(taper=leg)
    x0, x1 = k.P["P5"][0], k.P["P6"][0]
    k.P["P5"] = (x1 - (x1 - x0) * arm, 1)
    return k


def k5(mode):
    return k1(mode, tailored())


def standins():
    """three generic stand-ins for crowded K icons (simple shapes, not the real logos)"""
    out = {}
    # a blocky pixel K, green on black
    cells = ["X...X", "X..X.", "XXX..", "X..X.", "X...X"]
    c, x0, y0 = 104, 512 - 2.5 * 104, 512 - 2.5 * 104
    sq = "".join(f'<rect x="{x0 + j * c:.0f}" y="{y0 + i * c:.0f}" width="{c}" height="{c}"/>'
                 for i, r in enumerate(cells) for j, ch in enumerate(r) if ch == "X")
    out["standin-green"] = svg(f'<rect width="{S}" height="{S}" fill="#0B0B0C"/><g fill="#53F21A">{sq}</g>')
    plain = K(s=0.2, W=0.86, ta=0.19, tl=0.2, yj=0.45, yo=0.55)
    pl = Place(plain, 0.5 * S)
    fd, bg = field("#FF9A3C", "#F2541B", "o")
    out["standin-orange"] = svg(bg + f'<path d="{pl.d(plain.outline())}" fill="#fff"/>', fd)
    out["standin-pink"] = svg(f'<rect width="{S}" height="{S}" fill="#FFB3C7"/>'
                              f'<path d="{pl.d(plain.outline())}" fill="#17120F"/>')
    return out


VARIANTS = dict(k1=k1, k2=k2, k3=k3, k4=k4, k5=k5)

if __name__ == "__main__":
    k = K()
    print("alpha %.1f  beta %.1f  xa0 %.3f" % (math.degrees(k.alpha), math.degrees(k.beta), k.xa0))
    for n, fn in VARIANTS.items():
        write(f"{n}.svg", fn("light"))
        write(f"{n}-dark.svg", fn("dark"))
        write(f"{n}-tint.svg", fn("tint"))
    for n, text in standins().items():
        write(f"{n}.svg", text)
    print("wrote", len(VARIANTS) * 3, "svgs + 3 stand-ins")
