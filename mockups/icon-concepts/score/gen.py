"""Kitted 'score and measuring' icon concepts: score-N.svg, -dark.svg, -tint.svg."""
import math, os, sys

OUT = "/Users/eyu/Desktop/files/Kitted/mockups/icon-concepts/score"

MODES = {
    "full": dict(bg=("#22305C", "#1A2448"), main="#EEF0F5", acc="#DE9762"),
    "dark": dict(bg=("#1A2448", "#0E1328"), main="#EEF0F5", acc="#DE9762"),
    "tint": dict(bg=None, main="#FFFFFF", acc="#FFFFFF"),
}
TINT_ACC_OP = 0.55  # copper parts drop to 55% white in tinted mode


def mask(mid, cuts):
    return (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
            f'<rect width="1024" height="1024" fill="white"/>{cuts}</mask>')


def wrap(mode, body, defs=""):
    m = MODES[mode]
    bg = ""
    if m["bg"]:
        defs += (f'<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
                 f'<stop offset="0" stop-color="{m["bg"][0]}"/>'
                 f'<stop offset="1" stop-color="{m["bg"][1]}"/></linearGradient>')
        bg = '<rect width="1024" height="1024" fill="url(#bg)"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" '
            f'viewBox="0 0 1024 1024"><defs>{defs}</defs>{bg}{body}</svg>\n')


def fill_main(mode):
    return f'fill="{MODES[mode]["main"]}"'


def fill_acc(mode):
    m = MODES[mode]
    op = f' fill-opacity="{TINT_ACC_OP}"' if mode == "tint" else ""
    return f'fill="{m["acc"]}"{op}'


def stroke_acc(mode):
    m = MODES[mode]
    op = f' stroke-opacity="{TINT_ACC_OP}"' if mode == "tint" else ""
    return f'stroke="{m["acc"]}"{op}'


def pts(*p):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in p)


# ---------- 1. Tape slash ------------------------------------------------
# The "/" of "/10", drawn as a strip of tailor's tape leaning like the slash.
# Ticks are notched into its left edge; the top half-step is copper (the gain).
def c1(mode):
    k = 0.38              # lean: x per unit of height
    w = 220               # horizontal thickness
    y_bot, y_top = 870, 154
    x_bot = 512 - (w / 2) - (y_bot - y_top) * k / 2   # centre the slash

    def lx(y):            # left edge x at height y
        return x_bot + (y_bot - y) * k

    strip = pts((lx(y_bot), y_bot), (lx(y_bot) + w, y_bot), (lx(y_top) + w, y_top), (lx(y_top), y_top))
    # ticks every 72 px up the strip: long on whole units, short on halves
    cuts = ""
    mark_y = None
    y, i = y_bot - 72, 1
    while y > y_top + 50:
        ln = 100 if i % 2 == 0 else 56
        if i == 6:
            mark_y = y           # the 8th tick becomes the copper reading mark
        else:
            cuts += f'<rect x="{lx(y + 16) - 30:.1f}" y="{y-16:.1f}" width="{ln+30}" height="32" fill="black"/>'
        y -= 72
        i += 1
    defs = mask("m1", cuts)
    # copper mark: one solid tick that crosses the strip's left edge, so it
    # reads on the indigo (and never as the bar of a "7")
    h = 40
    x0 = lx(mark_y) - 78
    mark = f'<rect x="{x0:.1f}" y="{mark_y-h/2:.1f}" width="{78+150}" height="{h}" {fill_acc(mode)}/>'
    cuts += f'<rect x="{x0-10:.1f}" y="{mark_y-h/2-16:.1f}" width="{78+150+26}" height="{h+32}" fill="black"/>'
    defs = mask("m1", cuts)
    body = f'<g mask="url(#m1)"><polygon points="{strip}" {fill_main(mode)}/></g>{mark}'
    return wrap(mode, body, defs)


# ---------- 2. Tape K ----------------------------------------------------
# K: the stem is a tailor's tape (ticks notched into its left edge), the lower
# leg is plain, the upper arm is the copper gain arrow.
def c2(mode):
    sx0, sx1, top, bot = 248, 396, 196, 828
    cuts = ""
    y, i = top + 79, 1
    while y < bot - 30:
        ln = 70 if i % 2 == 0 else 40
        cuts += f'<rect x="{sx0-2}" y="{y-16}" width="{ln+2}" height="32" fill="black"/>'
        y += 79
        i += 1
    defs = mask("m2", cuts)
    stem = f'<rect x="{sx0}" y="{top}" width="{sx1-sx0}" height="{bot-top}" {fill_main(mode)}/>'
    # lower leg: from the junction down to bottom right
    leg = f'<polygon points="{pts((396,470),(548,470),(800,828),(642,828))}" {fill_main(mode)}/>'
    # upper arm: band from the stem toward upper right, ending in an arrowhead
    a0, a1 = (380, 552), (676, 330)
    dx, dy = a1[0] - a0[0], a1[1] - a0[1]
    L = math.hypot(dx, dy)
    d = (dx / L, dy / L)
    n = (-d[1], d[0])
    hw, ah, al = 70, 142, 178    # half shaft width, arrow half width, arrow length
    P = lambda c, k, v: (c[0] + v[0] * k, c[1] + v[1] * k)
    tip = P(a1, al, d)
    arrow = pts(P(a0, hw, n), P(a1, hw, n), P(a1, ah, n), tip,
                P(a1, -ah, n), P(a1, -hw, n), P(a0, -hw, n))
    arm = f'<polygon points="{arrow}" {fill_acc(mode)}/>'   # one solid copper shape
    # in tint mode the copper arm sits at 55%; keep it from showing through the stem
    body = f'{leg}{arm}<g mask="url(#m2)">{stem}</g>'
    return wrap(mode, body, defs)


# ---------- 3. Up-step ---------------------------------------------------
# A band of tape that climbs one step: two white treads (ticks cut up from
# their lower edges) joined by a solid copper riser, the re-check gain.
def c3(mode):
    t = 184                                   # band thickness
    lo = (128, 570, 424, 570 + t)             # lower tread x0,y0,x1,y1
    hi = (600, 274, 896, 274 + t)             # upper tread
    riser = (424, 274, 600, 570 + t)          # copper riser
    cuts = ""
    for (x0, y0, x1, y1) in (lo, hi):
        for i, f in enumerate((1/6, 2/6, 3/6, 4/6, 5/6)):
            x = x0 + (x1 - x0) * f
            ln = 66 if i % 2 == 0 else 38
            cuts += f'<rect x="{x-15:.1f}" y="{y1-ln}" width="30" height="{ln+4}" fill="black"/>'
    defs = mask("m3", cuts)
    r = lambda b, attr: f'<rect x="{b[0]}" y="{b[1]}" width="{b[2]-b[0]}" height="{b[3]-b[1]}" {attr}/>'
    gap = 28   # a cut seam between tape and riser
    rl = (lo[0], lo[1], lo[2] - gap // 2, lo[3])
    rh = (hi[0] + gap // 2, hi[1], hi[2], hi[3])
    body = (f'<g mask="url(#m3)">{r(rl, fill_main(mode))}{r(rh, fill_main(mode))}</g>'
            f'{r((riser[0] + gap // 2, riser[1], riser[2] - gap // 2, riser[3]), fill_acc(mode))}')
    return wrap(mode, body, defs)


# ---------- 4. Tape at 8 ------------------------------------------------
# A segment of tailor's tape from 7 to 9 with a condensed "8" above it and one
# copper tick at the 8 mark: the score, read off a measure.
def eight(cx, top, sw):
    """Condensed 8: two stacked elliptical rings sharing the waist (even-odd)."""
    def ring(cy, rx, ry):
        o = (f"M{cx-rx},{cy} A{rx},{ry} 0 1 1 {cx+rx},{cy} A{rx},{ry} 0 1 1 {cx-rx},{cy} Z")
        ix, iy = rx - sw, ry - sw
        i = (f"M{cx-ix},{cy} A{ix},{iy} 0 1 1 {cx+ix},{cy} A{ix},{iy} 0 1 1 {cx-ix},{cy} Z")
        return o + " " + i
    rt = (74, 92)       # top bowl rx, ry (tall and narrow, like Archivo Condensed)
    rb = (86, 108)      # bottom bowl
    cy_t = top + rt[1]
    cy_b = cy_t + rt[1] + rb[1] - sw   # bowls overlap by one stroke
    return ring(cy_t, *rt), ring(cy_b, *rb)


def c4(mode):
    ty0, ty1 = 600, 800          # tape band
    cuts = ""
    unit = 236
    for j in range(-2, 3):       # whole marks at 7, 8, 9 (8 is copper)
        x = 512 + j * unit
        if j == 0:
            continue
        cuts += f'<rect x="{x-16}" y="{ty0-2}" width="32" height="112" fill="black"/>'
    for j in (-1.5, -0.5, 0.5, 1.5):
        x = 512 + j * unit
        cuts += f'<rect x="{x-16:.0f}" y="{ty0-2}" width="32" height="70" fill="black"/>'
    for j in (-1.75, -1.25, -0.75, 0.75, 1.25, 1.75):
        x = 512 + j * unit
        cuts += f'<rect x="{x-14:.0f}" y="{ty0-2}" width="28" height="38" fill="black"/>'
    defs = mask("m4", cuts)
    tape = f'<rect x="-10" y="{ty0}" width="1044" height="{ty1-ty0}" {fill_main(mode)}/>'
    # copper mark at 8: a bar cut through the tape top, rising toward the numeral
    mark = f'<rect x="490" y="526" width="44" height="166" {fill_acc(mode)}/>'
    t, b = eight(512, 136, 48)
    num = (f'<path d="{t}" fill-rule="evenodd" {fill_main(mode)}/>'
           f'<path d="{b}" fill-rule="evenodd" {fill_main(mode)}/>')
    body = f'<g mask="url(#m4)">{tape}</g>{mark}{num}'
    return wrap(mode, body, defs)


CONCEPTS = {"score-1": c1, "score-2": c2, "score-3": c3, "score-4": c4}

if __name__ == "__main__":
    for name in sys.argv[1:] or list(CONCEPTS):
        for mode, suf in (("full", ""), ("dark", "-dark"), ("tint", "-tint")):
            with open(os.path.join(OUT, f"{name}{suf}.svg"), "w") as f:
                f.write(CONCEPTS[name](mode))
    print("ok")
