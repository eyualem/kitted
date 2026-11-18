"""Is each style-game format fair to all 8 looks? A $0 simulation (Python standard library, no AI calls).

    python3 tasks/style-quiz/quiz_sim.py            # the full report (about 2 minutes)
    python3 tasks/style-quiz/quiz_sim.py --quick    # a tenth of the runs, for a quick look

What it measures, for every format, through the SAME simulated people (same seeds):
  - one favourite: for each of the 8 looks as a person's real favourite, how often the game puts it 1st and in the top 3;
  - two loves: for each of the 28 pairs of looks a person loves about equally, how often both land in the top 3 and how
    often one of the two is 1st (the look-alike pairs are called out);
  - sneaking in: for each look, how often it lands in the top 3 of people who don't like it (liking under 0.3);
  - the spread: best-served look minus worst-served look. A fair game has a small spread.

Everything below is an ASSUMPTION, stated so it can be argued with. The numbers compare formats under the same
assumptions; they don't predict what real people will do (that's the founder's test with real people, Y30).

1. Likings (0..1). A person's favourite is 0.95. Every other look is 0.20 + 0.55 x how alike it is to the favourite
   (ALIKE below, 0.1 for unrelated looks) + personal noise (sd 0.12), kept within 0.02..0.80. So a tailoring guy often
   likes classic prep too, as real people do. A second population, "flat", gives every other look a liking drawn
   evenly from 0.10..0.65 with no look-alikes at all: in it every look is treated the same by construction, so any
   spread there comes from the format alone.
2. Drawings. Each look has two drawn outfits. How a person feels about a drawing is his liking for its look, blended
   with his liking for the look it's mistaken for (LEAK: a drawing that half-reads as a neighbour), plus PULL (a loud
   drawing catches the eye), plus noise per person (OUTFIT_SD). The before/after values come from Claude's read of
   the 16 drawings on Nov 17 against each look's signature pieces in rubric/v5-styles.md; they're judgment, not data.
3. Behaviour (small effects reported in research on sequential and paired choices; sizes are guesses):
   - FATIGUE: each later card needs a little more to get a Me (+0.01 per card; dating-app studies find people turn
     choosier as a swiping session goes on: Pronk & Denissen 2019, "A Rejection Mindset").
   - FIRST_SD: the first card is judged with no reference point, so with extra noise.
   - LEFT: in a this-or-that the left option gets a small edge (position bias).
   - EXPOSURE: a drawing already seen in the ranking gets a small edge each time (mere exposure).
   Each is also switched off and on alone, to show which one a format is sensitive to.
4. Taps: TAP_SD noise on every tap; a Me needs the feeling to reach YES_AT.
"""
import random, statistics, sys
from itertools import combinations

LOOKS = ["streetwear", "minimalist", "smart_casual", "classic_prep", "tailored", "workwear", "outdoor", "vintage_sport"]
SHORT = {"streetwear": "Streetwear", "minimalist": "Minimal", "smart_casual": "Smart casual", "classic_prep": "Classic prep",
         "tailored": "Tailored", "workwear": "Workwear", "outdoor": "Outdoor", "vintage_sport": "Vintage sport"}
OUTFIT_SD, TAP_SD, YES_AT = 0.15, 0.10, 0.55

# How alike two looks are (0..1; 0.1 when not listed). The four look-alike pairs the founder named, plus smart casual
# and classic prep (polos, chinos and loafers in both).
ALIKE = {
    ("classic_prep", "tailored"): 0.7, ("minimalist", "smart_casual"): 0.6, ("workwear", "outdoor"): 0.6,
    ("streetwear", "vintage_sport"): 0.6, ("smart_casual", "classic_prep"): 0.6,
    ("smart_casual", "tailored"): 0.45, ("minimalist", "tailored"): 0.35, ("minimalist", "classic_prep"): 0.3,
    ("streetwear", "outdoor"): 0.35, ("streetwear", "workwear"): 0.3, ("workwear", "vintage_sport"): 0.25,
    ("outdoor", "vintage_sport"): 0.2, ("streetwear", "minimalist"): 0.2,
}
LOOKALIKE_PAIRS = [("classic_prep", "tailored"), ("minimalist", "smart_casual"), ("workwear", "outdoor"),
                   ("streetwear", "vintage_sport"), ("smart_casual", "classic_prep")]


def alike(a, b):
    return 1.0 if a == b else ALIKE.get((a, b), ALIKE.get((b, a), 0.1))


# ---------- the drawings: PULL (a loud drawing catches the eye) and LEAK (half-reads as a neighbour) ----------
# Index 0 is the card's drawing in D, index 1 the ranking's. Claude's read of each, Nov 17:
DRAWINGS_BEFORE = {
    "streetwear":    [dict(), dict(pull=0.04)],                                   # 2: bright red chunky sneakers
    "minimalist":    [dict(), dict()],
    "smart_casual":  [dict(), dict(leak=("minimalist", 0.2))],                    # 2: blue shirt, grey trousers, white sneakers
    "classic_prep":  [dict(leak=("tailored", 0.3)), dict()],                      # 1: a navy blazer, like Tailored's card
    "tailored":      [dict(leak=("classic_prep", 0.15)), dict(leak=("classic_prep", 0.15))],
    "workwear":      [dict(), dict(pull=0.03)],                                   # 2: red check flannel
    "outdoor":       [dict(leak=("workwear", 0.3)), dict(leak=("minimalist", 0.25), pull=0.02)],  # 1: olive zip jacket reads as a field jacket; 2: a plain cream crew
    "vintage_sport": [dict(pull=0.04), dict(pull=0.03)],                          # bold contrast stripes on both
}
# After the drawing fixes in tasks/style-quiz/src/drawings.ts (mockup only; see the DECISIONS-LOG entry):
DRAWINGS_AFTER = {**DRAWINGS_BEFORE,
    "streetwear": [dict(), dict()],                                               # 2: black chunky sneakers
    "outdoor":    [dict(leak=("workwear", 0.1)), dict(leak=("minimalist", 0.1), pull=0.02)],  # 1: a slate-blue shell; 2: a heather fleece pullover
}
DRAWINGS_NONE = {l: [dict(), dict()] for l in LOOKS}

FX_ON = dict(fatigue=0.01, first_sd=0.08, left=0.03, exposure=0.02)
FX_OFF = dict(fatigue=0.0, first_sd=0.0, left=0.0, exposure=0.0)


# ---------- people ----------
def likes_one(fav, rng, flat=False):
    if flat:
        lk = {l: rng.uniform(0.10, 0.65) for l in LOOKS}
    else:
        lk = {l: min(0.80, max(0.02, 0.20 + 0.55 * alike(fav, l) + rng.gauss(0, 0.12))) for l in LOOKS}
    lk[fav] = 0.95
    return lk


def likes_two(p, q, rng):
    lk = {l: min(0.80, max(0.02, 0.20 + 0.55 * max(alike(p, l), alike(q, l)) + rng.gauss(0, 0.12))) for l in LOOKS}
    hi, lo = (p, q) if rng.random() < 0.5 else (q, p)
    lk[hi], lk[lo] = 0.92, 0.88
    return lk, hi


class Person:
    """One simulated person: his likings, how each drawing strikes him, and his tap habits."""

    def __init__(self, likes, rng, drawings, fx):
        self.likes, self.rng, self.fx = likes, rng, fx
        self.world = {}
        for l in LOOKS:
            row = []
            for d in drawings[l]:
                nb, w = d.get("leak", (l, 0.0))
                row.append((1 - w) * likes[l] + w * likes[nb] + d.get("pull", 0.0) + rng.gauss(0, OUTFIT_SD))
            self.world[l] = row
        self.seen = {}

    def feel(self, look, i):
        return self.world[look][i % 2] + self.rng.gauss(0, TAP_SD)

    def card(self, look, pos):
        """Me or Not me on the card at position pos (0 = first)."""
        extra = self.rng.gauss(0, self.fx["first_sd"]) if pos == 0 and self.fx["first_sd"] else 0.0
        return self.feel(look, 0) + extra >= YES_AT + self.fx["fatigue"] * pos

    def pick(self, left, right, i=1, neither=False):
        """This-or-that on drawing i; returns the winner (None for "Neither" when both are far off)."""
        ex = self.fx["exposure"]
        fl = self.feel(left, i) + self.fx["left"] + ex * self.seen.get(left, 0)
        fr = self.feel(right, i) + ex * self.seen.get(right, 0)
        self.seen[left] = self.seen.get(left, 0) + 1
        self.seen[right] = self.seen.get(right, 0) + 1
        if neither and max(fl, fr) < YES_AT - 0.25: return None
        return left if fl >= fr else right


# ---------- D: Me / Not me on each look, then binary insertion of the Me's into a top 3 ----------
D_ORDER_FIXED = ["streetwear", "classic_prep", "workwear", "minimalist", "vintage_sport", "tailored", "outdoor", "smart_casual"]
D_ALIKE = {frozenset(p) for p in LOOKALIKE_PAIRS}


def circle_ok(order):
    """No look-alikes next to each other, counting the last card as next to the first (so any rotation is fine)."""
    return not any(frozenset((order[i], order[(i + 1) % len(order)])) in D_ALIKE for i in range(len(order)))


def d_order_shuffled(rng):
    """logic.js dGameFor(): a random order with no look-alikes side by side, the last card counting as next to the
    first. The set of such orders is closed under rotation, so every look is equally likely at every position (1/8)."""
    order = LOOKS[:]
    while True:
        rng.shuffle(order)
        if circle_ok(order): return order


def run_d(person, rng, order=None, flip=0, ranking="insert"):
    order = order or D_ORDER_FIXED
    yes = [l for pos, l in enumerate(order) if person.card(l, pos)]
    taps = len(order)
    top, i = [], 0

    def beats(a, b):  # a is the newcomer; logic.js shows it left when (i + flip) is even
        nonlocal i, taps
        left, right = (a, b) if (i + flip) % 2 == 0 else (b, a)
        if hasattr(person, "log"): person.log.append((a, b, left == a))
        i += 1; taps += 1
        return person.pick(left, right) == a

    for c in yes:
        lo, hi = 0, len(top)
        while lo < hi:
            mid = (lo + hi) // 2
            if beats(c, top[mid]): hi = mid
            else: lo = mid + 1
        top.insert(lo, c)
        del top[3:]
    return top, taps + 1


def fmt_d_fixed(person, rng):
    return run_d(person, rng)


def fmt_d_fair(person, rng):
    return run_d(person, rng, order=d_order_shuffled(rng), flip=rng.randrange(2))


def fmt_d_shuffle_only(person, rng):
    return run_d(person, rng, order=d_order_shuffled(rng), flip=0)


# ---------- A: the 8-look bracket (4 heats, 2 semis, a final, a match for 3rd) ----------
HEATS = [("streetwear", "minimalist"), ("workwear", "smart_casual"), ("outdoor", "classic_prep"), ("tailored", "vintage_sport")]


def fmt_a(person, rng):
    taps = 0
    seen = {l: 0 for l in LOOKS}

    def duel(a, b):
        nonlocal taps
        if a is None: return b, a
        if b is None: return a, b
        taps += 1
        w = person.pick(a, b, i=min(seen[a], seen[b]), neither=True)
        seen[a] += 1; seen[b] += 1
        if w is None: return None, None
        return (a, b) if w == a else (b, a)

    w = [duel(*h)[0] for h in HEATS]
    s1, l1 = duel(w[0], w[1]); s2, l2 = duel(w[2], w[3])
    f1, f2 = duel(s1, s2)
    t3, _ = duel(l1, l2)
    return [x for x in (f1, f2, t3) if x], taps + 1


# ---------- B: three rounds of three (drawn with 7 looks: no Tailored) ----------
def fmt_b(person, rng):
    def pick(looks, idx):
        f = [(person.feel(l, idx) + (person.fx["left"] if j == 0 else 0.0), l) for j, l in enumerate(looks)]
        best = max(f)
        return best[1] if best[0] >= YES_AT - 0.25 else None
    w1 = pick(["streetwear", "minimalist", "workwear"], 0)
    w2 = pick(["smart_casual", "outdoor", "vintage_sport"], 0)
    w3 = pick([x for x in (w1, w2) if x] + ["classic_prep"], 1)
    out = [w3] if w3 else []
    for x in (w2, w1):
        if x and x not in out: out.append(x)
    return out[:3], 4


FORMATS = {
    "D before (fixed card order)": fmt_d_fixed,
    "D shuffled order only": fmt_d_shuffle_only,
    "D after (shuffle + sides)": fmt_d_fair,
    "A bracket (reference)": fmt_a,
    "B threes (reference)": fmt_b,
}


# ---------- measuring ----------
def per_look(fn, n, drawings, fx, flat=False, seed=7):
    """For each look as the real favourite: (1st right, in top 3). Also the sneak-in rate per look."""
    out, sneak_hit, sneak_n, taps = {}, {l: 0 for l in LOOKS}, {l: 0 for l in LOOKS}, []
    for li, fav in enumerate(LOOKS):
        rng = random.Random(seed * 1000 + li)
        first = in3 = 0
        for _ in range(n):
            lk = likes_one(fav, rng, flat)
            res, t = fn(Person(lk, rng, drawings, fx), rng)
            taps.append(t)
            first += bool(res) and res[0] == fav
            in3 += fav in res
            for l in LOOKS:
                if lk[l] < 0.3:
                    sneak_n[l] += 1; sneak_hit[l] += l in res
        out[fav] = (first / n, in3 / n)
    sneak = {l: sneak_hit[l] / max(1, sneak_n[l]) for l in LOOKS}
    return out, sneak, statistics.mean(taps)


def per_pair(fn, n, drawings, fx, seed=11):
    """For each pair loved about equally: (both in top 3, one of the two 1st, the higher one 1st)."""
    out = {}
    for pi, (p, q) in enumerate(combinations(LOOKS, 2)):
        rng = random.Random(seed * 1000 + pi)
        both = one = hi1 = 0
        for _ in range(n):
            lk, hi = likes_two(p, q, rng)
            res, _ = fn(Person(lk, rng, drawings, fx), rng)
            both += p in res and q in res
            one += bool(res) and res[0] in (p, q)
            hi1 += bool(res) and res[0] == hi
        out[(p, q)] = (both / n, one / n, hi1 / n)
    return out


def side_shares(fn, n, seed=3):
    """How often each look is on the left in D's ranking, and how often the newcomer is."""
    left, tot, nl, nt = {l: 0 for l in LOOKS}, {l: 0 for l in LOOKS}, 0, 0
    rng = random.Random(seed)
    for k in range(n):
        person = Person(likes_one(LOOKS[k % 8], rng), rng, DRAWINGS_NONE, FX_OFF)
        person.log = []
        fn(person, rng)
        for newcomer, other, on_left in person.log:
            lft = newcomer if on_left else other
            left[lft] += 1; tot[newcomer] += 1; tot[other] += 1
            nl += on_left; nt += 1
    return left, tot, nl, nt


def spread(vals):
    return max(vals) - min(vals)


def pct(x):
    return f"{x * 100:4.0f}%"


def table_one(title, results):
    print(f"\n{title}")
    print(f"  {'format':30}" + "".join(f"{SHORT[l][:12]:>13}" for l in LOOKS) + f"{'spread':>8}")
    for name, (res, _, _) in results.items():
        for k, label in ((0, "1st"), (1, "top 3")):
            vals = [res[l][k] for l in LOOKS]
            print(f"  {name[:24] + ' ' + label:30}" + "".join(f"{pct(v):>13}" for v in vals) + f"{spread(vals) * 100:7.1f}")


if __name__ == "__main__":
    quick = "--quick" in sys.argv
    N1, N2 = (2000, 1000) if quick else (20000, 6000)

    print("One favourite, realistic likings (look-alikes liked more), drawings as they were, behaviour effects on.")
    res_before = {name: per_look(fn, N1, DRAWINGS_BEFORE, FX_ON) for name, fn in FORMATS.items()}
    table_one("Favourite found 1st / in the top 3 (each column: people whose real favourite is that look)", res_before)

    print("\nThe same with the fixed drawings (D after = shuffle + sides + drawings):")
    res_after = {name: per_look(fn, N1, DRAWINGS_AFTER, FX_ON) for name, fn in FORMATS.items()}
    table_one("Favourite found 1st / in the top 3, fixed drawings", res_after)

    print("\nFlat likings (no look-alikes) and neutral drawings: any spread here is the format's own.")
    res_flat = {name: per_look(fn, N1, DRAWINGS_NONE, FX_ON, flat=True) for name, fn in FORMATS.items()}
    table_one("Favourite found 1st / in the top 3, flat likings", res_flat)

    print("\nOne effect at a time, at 3x its size so its push shows above the noise (flat likings, neutral drawings,")
    print("so only the effect can tilt it): spread of '1st' across the 8 looks, in points; 'none' is the noise floor")
    print(f"  {'format':30}{'none':>8}{'fatigue':>9}{'1st card':>9}{'left':>8}{'exposure':>9}{'all':>8}")
    worst_by = {}
    for name in ("D before (fixed card order)", "D after (shuffle + sides)", "A bracket (reference)"):
        row = []
        for knob in (None, "fatigue", "first_sd", "left", "exposure", "all"):
            big = {k: 3 * v for k, v in FX_ON.items()}
            fx = big if knob == "all" else dict(FX_OFF, **({knob: big[knob]} if knob else {}))
            r, _, _ = per_look(FORMATS[name], N1 // 2, DRAWINGS_NONE, fx, flat=True)
            row.append(spread([r[l][0] for l in LOOKS]) * 100)
            if knob and knob != "all":
                lo = min(LOOKS, key=lambda l: r[l][0]); worst_by.setdefault(name, []).append(f"{knob}: {SHORT[lo]} lowest")
        print(f"  {name[:30]:30}" + "".join(f"{v:8.1f}" + (" " if j in (1, 2, 4) else "") for j, v in enumerate(row)))
        print(f"  {'':30}  ({'; '.join(worst_by[name])})")

    print("\nSneaking in: how often each look lands in the top 3 of people who don't like it (liking under 0.3)")
    print(f"  {'format':30}" + "".join(f"{SHORT[l][:12]:>13}" for l in LOOKS) + f"{'spread':>8}")
    for label, results in (("before", res_before), ("fixed drawings", res_after)):
        for name in ("D before (fixed card order)", "D after (shuffle + sides)", "A bracket (reference)"):
            sn = results[name][1]
            print(f"  {(name[:20] + ', ' + label)[:30]:30}" + "".join(f"{sn[l] * 100:12.1f}%" for l in LOOKS) + f"{spread(list(sn.values())) * 100:7.1f}")

    print("\nSides in D's this-or-that (realistic likings): how often each look is shown on the left, and the newcomer")
    for name, fn in (("D before (fixed card order)", fmt_d_fixed), ("D after (shuffle + sides)", fmt_d_fair)):
        lt, tt, nl, nt = side_shares(fn, N1)
        print(f"  {name:30} newcomer left {nl / nt * 100:4.1f}%;  " + ", ".join(f"{SHORT[l]} {lt[l] / tt[l] * 100:.0f}%" for l in LOOKS))

    print("\nTaps on the step (cards + this-or-thats + Continue), fixed drawings:")
    for name, (_, _, t) in res_after.items():
        print(f"  {name:30} {t:5.1f}")

    print("\nTwo loves (each of the 28 pairs, liked 0.92 and 0.88), fixed drawings, behaviour effects on")
    for name in ("D before (fixed card order)", "D after (shuffle + sides)", "A bracket (reference)"):
        drw = DRAWINGS_BEFORE if name.startswith("D before") else DRAWINGS_AFTER
        pr = per_pair(FORMATS[name], N2, drw, FX_ON)
        both = [v[0] for v in pr.values()]; one = [v[1] for v in pr.values()]; hi = [v[2] for v in pr.values()]
        worst = min(pr, key=lambda k: pr[k][0]); best = max(pr, key=lambda k: pr[k][0])
        print(f"  {name}" + ("  (drawings as they were)" if name.startswith("D before") else ""))
        print(f"    both in top 3: mean {pct(statistics.mean(both))}, spread {spread(both) * 100:.1f} pts"
              f"  (worst {SHORT[worst[0]]} + {SHORT[worst[1]]} {pct(pr[worst][0])}, best {SHORT[best[0]]} + {SHORT[best[1]]} {pct(pr[best][0])})")
        print(f"    one of the two 1st: mean {pct(statistics.mean(one))}, spread {spread(one) * 100:.1f} pts;"
              f"  the slightly-more-loved one 1st: mean {pct(statistics.mean(hi))}")
        print("    look-alike pairs (both in top 3 / one of the two 1st): " + ", ".join(
            f"{SHORT[p]} + {SHORT[q]} {pct(pr[(p, q) if (p, q) in pr else (q, p)][0]).strip()} / {pct(pr[(p, q) if (p, q) in pr else (q, p)][1]).strip()}"
            for p, q in LOOKALIKE_PAIRS))
