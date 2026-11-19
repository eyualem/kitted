"""Does the style game (D) get each kind of person to the style he wants, mistakes included? A $0 simulation
(Python standard library, no AI calls). It extends quiz_sim.py: the same people, drawings, card order and ranking,
plus the results screen and the fixes a person makes there, the mistakes people make, and the small fail-safes.

    python3 tasks/style-quiz/flow_sim.py            # the full report (a few minutes; check the Mac's memory first)
    python3 tasks/style-quiz/flow_sim.py --quick    # a sixth of the runs, for a quick look

"Gets to the style he wants" (pass/fail, checked on what he SAVES when he taps Continue, after any fixes he makes):
  - one favourite (any of the 8 looks; liking 0.95, next at most 0.80, so a clear favourite): his favourite is #1.
  - two loves (0.92 and 0.88, no clear favourite): both are in his saved top 3.
  - likes almost everything (favourite 0.92, the rest 0.62..0.82): his favourite is in his saved top 3.
  - picky (favourite 0.90, the rest 0.02..0.35): his favourite is #1.
  - off the menu (his style isn't one of the 8: every look 0.05..0.40 except one near look at 0.55): he ends with his
    own words, or with the near look #1. A FAIL is a confident wrong result: a look he doesn't like saved #1, no words.
  - newcomer (doesn't know the looks' names; a one-favourite person who reads the results screen's names and the
    Add-a-look sheet less surely): his favourite is #1.

Everything below is an ASSUMPTION, stated so it can be argued with. Rates are guesses at plausible sizes, not data;
the numbers compare the game with and without each fail-safe under the same assumptions. The founder's test with real
people (Y30) is what tells whether they hold.
"""
import random, sys
from quiz_sim import (LOOKS, SHORT, LOOKALIKE_PAIRS, DRAWINGS_AFTER, FX_ON, OUTFIT_SD, TAP_SD, YES_AT, alike,
                      d_order_shuffled, Person, likes_one, likes_two)
from itertools import combinations

# A look's nearest neighbour, for misreading a drawing (classic prep <-> tailored, minimal <-> smart casual, ...).
NB = {l: max((o for o in LOOKS if o != l), key=lambda o: alike(l, o)) for l in LOOKS}

# ---------- the results screen: what a person fixes there (most people don't fix a result unless it's clearly wrong) ----
SEE_SD = 0.06            # how surely he reads a look from its name, line and small drawing (newcomer: 0.12)
SEE_SD_NEW = 0.12
MISSING_NOTICED = 0.70   # his favourite isn't on the list and the list is clearly worse: he notices (newcomer 0.35)
MISSING_NOTICED_NEW = 0.35
FIX_MISSING = 0.60       # ...and fixes it (Add a look; if the list is full, Play again or x then Add)
FIX_DISLIKED = 0.50      # a look he doesn't like (reads under 0.35) is on the list: he taps x
# Reorder: the chance he drags his best up grows with how wrong #1 is: (gap - 0.10) / 0.40, at most 0.70.
WORDS_IF_NONE = 0.50     # off the menu, nothing on the list reads as him: he taps "Not quite you? Tell me in your words"
FULL_FOUND = 0.60        # the list is full (3 looks), so today's screen has no Add row: he finds a way (x then Add,
                         # or Play again) 60% of the times he'd fix it
ADD_RIGHT_NEW = 0.80     # a newcomer finds his look in the Add-a-look sheet (else he takes its neighbour)

# ---------- the mistakes (each switched on alone, then all together) ----------
MISTAKES = {
    "mistap":  "mis-tap: 3% of card answers and 2% of this-or-thats go to the other button; he notices 60% / 50%",
    "swipe":   "accidental swipe: 2% of cards fly off in a random direction; he notices 70%. On results, 15% of drags land one row off; he notices 60%",
    "rush":    "rushing: each card after the 4th gets +0.025 tap noise (card 8: 2x), choosiness grows twice as fast, this-or-thats noisier, fixes 0.6x",
    "mind":    "change of mind: after 10% of cards he looks again; if the second look says otherwise, he wants that card back",
    "misread": "misreading: 10% of cards read as the look's neighbour (a blazer as a suit)",
    "fast":    "Continue too fast: 30% of people tap Continue without reading the results (fixes 0.15x)",
    "back":    "Back in the middle: 10% of games, a stray Back on a card undoes the card before; he answers it again",
}
UNDO_HIDDEN = 0.35       # wants a card back and uses the top-left Back to undo it (many read Back as 'leave this step')
UNDO_SHOWN = 0.80        # ...with fail-safe "undo": a visible Undo under the card

# ---------- the fail-safes tested ----------
SAFES = {
    "undo":   "Undo under the card: after each answer, a small 'Undo' (the same as Back) shows under the card",
    "nudge":  "a results line: 'Not you? Play again, or fix it below' (fixes 1.3x; a hurrier's 0.15x becomes 0.35x)",
    "low":    "a second look when he says Me to 0 or 1: the Not-me looks again on their other drawing (+6-8 taps for him only)",
    "high":   "a double-check when he says Me to 6 or more: 'Keep the ones you love' over his Me's (+6-8 taps for him only)",
    "addfull": "Add a look stays on a full list: the look he adds takes #3's place, with an Undo note (no extra taps)",
    "peek": "tap the card to see the look's other outfit (like photos on a dating card); his choice: 35% of borderline cards, 3% of the rest",
    "second": "a second drawing on a borderline card (hesitation; caught 60% of the time, 5% false alarms; +1 tap)",
}


class FP(Person):
    def __init__(self, likes, rng, kind, target, newcomer=False, words=False):
        super().__init__(likes, rng, DRAWINGS_AFTER, FX_ON)
        self.kind, self.target, self.newcomer, self.words, self.tap_sd = kind, target, newcomer, words, TAP_SD

    def feel(self, look, i):
        return self.world[look][i % 2] + self.rng.gauss(0, self.tap_sd)


def make(kind, i, rng):
    if kind in ("one", "newcomer"):
        fav = LOOKS[i % 8]
        return FP(likes_one(fav, rng), rng, kind, fav, newcomer=kind == "newcomer")
    if kind in ("two", "two_alike"):
        pairs = list(combinations(LOOKS, 2)) if kind == "two" else LOOKALIKE_PAIRS
        p, q = pairs[i % len(pairs)]
        lk, _ = likes_two(p, q, rng)
        return FP(lk, rng, kind, (p, q))
    if kind == "everything":
        fav = LOOKS[i % 8]
        lk = {l: rng.uniform(0.62, 0.82) for l in LOOKS}; lk[fav] = 0.92
        return FP(lk, rng, kind, fav)
    if kind == "picky":
        fav = LOOKS[i % 8]
        lk = {l: rng.uniform(0.02, 0.35) for l in LOOKS}; lk[fav] = 0.90
        return FP(lk, rng, kind, fav)
    if kind == "offmenu":
        near = LOOKS[i % 8]
        lk = {l: rng.uniform(0.05, 0.40) for l in LOOKS}; lk[near] = 0.55
        return FP(lk, rng, kind, near, words=True)
    raise ValueError(kind)


def passed(p, saved, words):
    t = p.target
    if p.kind in ("one", "newcomer", "picky"): return bool(saved) and saved[0] == t
    if p.kind in ("two", "two_alike"): return t[0] in saved and t[1] in saved
    if p.kind == "everything": return t in saved
    if p.kind == "offmenu": return words or (bool(saved) and saved[0] == t)


class Game:
    """One play of D for one person, with the switched-on mistakes (m) and fail-safes (s)."""

    def __init__(self, p, m, s, rng):
        self.p, self.m, self.s, self.rng = p, m, s, rng
        self.taps = 0
        self.p_undo = UNDO_SHOWN if "undo" in s else UNDO_HIDDEN
        self.why = None   # where his target was lost, for the failure breakdown

    def chance(self, x):
        return self.rng.random() < x

    # ---- step 1: the 8 cards ----
    def card(self, look, pos, misread):
        p, rng = self.p, self.rng
        rush = "rush" in self.m
        base = (p.likes[NB[look]] + rng.gauss(0, OUTFIT_SD)) if misread else p.world[look][0]
        sd = TAP_SD + (0.025 * max(0, pos - 3) if rush else 0.0)
        thr = YES_AT + p.fx["fatigue"] * pos * (2 if rush else 1)
        f = base + rng.gauss(0, sd) + (rng.gauss(0, p.fx["first_sd"]) if pos == 0 else 0.0)
        peek = "peek" in self.s and ((abs(f - thr) < 0.08 and self.chance(0.35)) or self.chance(0.03))
        if peek or ("second" in self.s and ((abs(f - thr) < 0.08 and self.chance(0.6)) or self.chance(0.05))):
            self.taps += 1                                   # flips to the other drawing (always read correctly)
            f = (f + p.world[look][1] + rng.gauss(0, sd)) / 2
        return f >= thr, base, sd, thr

    def answer(self, look, pos):
        """One card: what he means, what gets recorded, and whether he takes it back."""
        rng, m = self.rng, self.m
        misread = "misread" in m and self.chance(0.10)
        meant, base, sd, thr = self.card(look, pos, misread)
        got, want_back = meant, False
        self.taps += 1
        if "mistap" in m and self.chance(0.03):
            got = not meant; want_back = self.chance(0.60)
        if "swipe" in m and self.chance(0.02):
            got = self.chance(0.5); want_back = got != meant and self.chance(0.70)
        if "mind" in m and self.chance(0.10):
            again = ((base + rng.gauss(0, sd)) + (base + rng.gauss(0, sd))) / 2 >= thr
            if again != got: meant, want_back = again, True
        if want_back and self.chance(self.p_undo):
            self.taps += 2; got = meant
        return got

    def cards(self, order):
        yes, stray = [], (self.rng.randrange(1, 8) if "back" in self.m and self.chance(0.10) else None)
        ans = {}
        for pos, look in enumerate(order):
            if pos == stray:                                  # a stray Back: the card before comes back; he answers again
                self.taps += 1
                ans[order[pos - 1]] = self.answer(order[pos - 1], pos - 1)
            ans[look] = self.answer(look, pos)
        yes = [l for l in order if ans[l]]
        if "low" in self.s and len(yes) <= 1:                 # a second look at the Not me's, on their other drawing
            for l in order:
                if l not in yes:
                    self.taps += 1
                    if self.p.feel(l, 1) >= YES_AT: yes.append(l)
        if "high" in self.s and len(yes) >= 6:                # keep the ones you love
            self.taps += len(yes)
            kept = [l for l in yes if self.p.feel(l, 0) >= YES_AT + 0.15]
            if kept: yes = kept
        return yes

    # ---- step 2: this-or-that between his Me's (binary insertion into a top 3) ----
    def rank(self, yes, flip):
        p, m = self.p, self.m
        p.tap_sd = 0.16 if "rush" in m else TAP_SD
        top, i = [], 0
        for c in yes:
            lo, hi = 0, len(top)
            while lo < hi:
                mid = (lo + hi) // 2
                left, right = (c, top[mid]) if (i + flip) % 2 == 0 else (top[mid], c)
                w = p.pick(left, right); self.taps += 1; i += 1
                if "mistap" in m and self.chance(0.02):
                    wrong = right if w == left else left
                    if not (self.chance(0.5) and self.chance(self.p_undo)): w = wrong
                    else: self.taps += 2
                if w == c: hi = mid
                else: lo = mid + 1
            top.insert(lo, c); del top[3:]
        p.tap_sd = TAP_SD
        return top

    # ---- step 3: "Here's your style": what he fixes before Continue ----
    def results(self, saved, can_replay):
        p, rng, m, s = self.p, self.rng, self.m, self.s
        k = 0.6 if "rush" in m else 1.0
        if "fast" in m and self.chance(0.30): k *= 0.35 if "nudge" in s else 0.15
        elif "nudge" in s: k *= 1.3
        P = lambda x: rng.random() < min(0.9, x * k)
        sd = SEE_SD_NEW if p.newcomer else SEE_SD
        seen = {l: p.likes[l] + rng.gauss(0, sd) for l in LOOKS}
        best = max(LOOKS, key=lambda l: p.likes[l])
        saved, words = list(saved), False

        def add(x):
            if p.newcomer and not self.chance(ADD_RIGHT_NEW) and NB[x] not in saved: x = NB[x]
            if x not in saved: saved.append(x); self.taps += 2

        def empty():
            # Continue needs a look or his words, so he has to do something here
            nonlocal words
            if p.words and self.chance(0.7): words = True; self.taps += 2; return None
            if can_replay and self.chance(0.4): return "replay"
            add(max((l for l in LOOKS if l not in saved), key=lambda l: seen[l])); return None

        if not saved:
            if empty() == "replay": return "replay", words
        # his favourite isn't there and what is there is clearly worse; or another look he loves is missing
        # while a clearly worse one made the list (noticed half as often)
        noticed = MISSING_NOTICED_NEW if p.newcomer else MISSING_NOTICED
        for x in sorted((l for l in LOOKS if p.likes[l] >= 0.85 or l == best), key=lambda l: -p.likes[l]):
            if x in saved or not saved: continue
            gap = p.likes[x] - (max(p.likes[y] for y in saved) if x == best else min(p.likes[y] for y in saved))
            if gap >= 0.15 and self.chance(noticed * (1 if x == best else 0.5)) and P(FIX_MISSING):
                if len(saved) < 3: add(x)
                elif "addfull" in s: saved.pop(); add(x)       # Add a look stays on a full list; it replaces #3
                elif not self.chance(FULL_FOUND): continue      # today: the Add row is gone on a full list
                elif can_replay and self.chance(0.5): self.taps += 1; return "replay", words
                else:
                    saved.remove(min(saved, key=lambda l: seen[l])); self.taps += 1; add(x)
        # a look he doesn't like
        for x in list(saved):
            if seen[x] < 0.35 and P(FIX_DISLIKED): saved.remove(x); self.taps += 1
        if not saved and not words:
            if empty() == "replay": return "replay", words
        # #1 isn't his best of the list: drag it up if #1 is clearly wrong
        if saved:
            top = max(saved, key=lambda l: seen[l])
            if saved[0] != top and P(max(0.0, min(0.7, (seen[top] - seen[saved[0]] - 0.10) / 0.40))):
                saved.remove(top); self.taps += 1
                slipped = "swipe" in m and self.chance(0.15) and len(saved) >= 1
                saved.insert(1 if slipped else 0, top)
                if slipped and self.chance(0.6): saved.remove(top); saved.insert(0, top); self.taps += 1
        if p.words and not words and (not saved or max(seen[x] for x in saved) < 0.5) and P(WORDS_IF_NONE):
            words = True; self.taps += 2
        self.taps += 1                                        # Continue
        return saved, words

    def play(self):
        rng, replay = self.rng, True
        while True:
            order, flip = d_order_shuffled(rng), rng.randrange(2)
            yes = self.cards(order)
            raw = self.rank(yes, flip)
            if self.raw is None: self.raw, self.yes_n = raw, len(yes)
            out, words = self.results(raw, replay)
            if out == "replay":
                replay = False; self.taps += 1; continue
            return out, words

    raw = None


PERSONAS = [("one", "One favourite (8 looks)"), ("newcomer", "Newcomer, no names"), ("two", "Two loves (28 pairs)"),
            ("two_alike", "Two look-alike loves"), ("everything", "Likes almost everything"), ("picky", "Picky"),
            ("offmenu", "Style not in the 8")]
COLS = ["none"] + list(MISTAKES) + ["all"]


def run(kind, n, mcol, safes, seed=5):
    """Pass rate, pass rate before his own fixes, average taps, the worst target's pass rate, and near misses (failed,
    but his saved #1 is a look he likes 0.7 or more: the right kind of look in the wrong order)."""
    m = set(MISTAKES) if mcol == "all" else (set() if mcol == "none" else {mcol})
    ok = raw_ok = taps = near = 0
    by, byn = {}, {}
    lost_card = lost_rank = 0
    for i in range(n):
        rng = random.Random(seed * 10_000_019 + PERSONAS.index(next(x for x in PERSONAS if x[0] == kind)) * 1_000_003
                            + COLS.index(mcol) * 100_003 + i)
        p = make(kind, i, rng)
        g = Game(p, m, set(safes), rng)
        saved, words = g.play()
        good = passed(p, saved, words)
        ok += good; taps += g.taps
        near += (not good) and bool(saved) and p.kind != "offmenu" and p.likes[saved[0]] >= 0.7
        raw_ok += passed(p, g.raw, False)
        key = p.target if isinstance(p.target, str) else p.target
        by[key] = by.get(key, 0) + good; byn[key] = byn.get(key, 0) + 1
    worst = min(by, key=lambda k: by[k] / byn[k])
    return ok / n, raw_ok / n, taps / n, (worst, by[worst] / byn[worst]), near / n


def pct(x):
    return f"{x * 100:.0f}%"


if __name__ == "__main__":
    quick = "--quick" in sys.argv
    N = 1000 if quick else 6000
    only = [a.split("=", 1)[1] for a in sys.argv if a.startswith("--safes=")]
    configs = [("today", [])] + [(k, [k]) for k in SAFES] + [(o, o.split("+")) for o in only]
    kept = only[-1] if only else None

    print("Mistakes (each alone, then all together):")
    for k, v in MISTAKES.items(): print(f"  {k:8} {v}")
    print("Fail-safes tested:")
    for k, v in SAFES.items(): print(f"  {k:8} {v}")
    print(f"\n{N} people per cell. A cell: share who end setup with the style they want (pass/fail at the top).")

    res = {}
    for name, safes in configs:
        for kind, _ in PERSONAS:
            for col in COLS:
                res[(name, kind, col)] = run(kind, N, col, safes)

    def table(name):
        print(f"\n### {name}\n")
        print("| Who | " + " | ".join(COLS) + " | taps |")
        print("|---|" + "---|" * (len(COLS) + 1))
        for kind, label in PERSONAS:
            row = [res[(name, kind, c)] for c in COLS]
            print(f"| {label} | " + " | ".join(pct(r[0]) for r in row) + f" | {row[0][2]:.1f} |")

    table("today")
    if kept:
        print(f"\n### Today -> with the kept fail-safes ({kept})\n")
        print("| Who | " + " | ".join(COLS) + " | taps |")
        print("|---|" + "---|" * (len(COLS) + 1))
        for kind, label in PERSONAS:
            a = [res[("today", kind, c)][0] for c in COLS]; b = [res[(kept, kind, c)][0] for c in COLS]
            print(f"| {label} | " + " | ".join(f"{x * 100:.0f} → {y * 100:.0f}" for x, y in zip(a, b))
                  + f" | {res[('today', kind, 'none')][2]:.1f} → {res[(kept, kind, 'none')][2]:.1f} |")

    print("\n### Before his own fixes (what the game alone gives, no mistakes / all mistakes), today\n")
    for kind, label in PERSONAS:
        a, b = res[("today", kind, "none")], res[("today", kind, "all")]
        print(f"  {label:26} game alone {pct(a[1]):>4} -> after fixes {pct(a[0]):>4} (near miss {pct(a[4]):>3})"
              f"  |  all mistakes: {pct(b[1]):>4} -> {pct(b[0]):>4} (near miss {pct(b[4]):>3})   worst target (none): {a[3][0]} {pct(a[3][1])}")

    print("\n### Each fail-safe's effect: change in pass rate vs today, in points (+ is better), and extra taps\n")
    print("| Fail-safe | " + " | ".join(lbl for _, lbl in PERSONAS) + " | mean | extra taps |")
    print("|---|" + "---|" * (len(PERSONAS) + 2))
    for name, _ in configs[1:]:
        d = []
        for kind, _ in PERSONAS:
            d.append(sum(res[(name, kind, c)][0] - res[("today", kind, c)][0] for c in COLS) / len(COLS) * 100)
        dt = sum(res[(name, kind, "none")][2] - res[("today", kind, "none")][2] for kind, _ in PERSONAS) / len(PERSONAS)
        print(f"| {name} | " + " | ".join(f"{x:+.1f}" for x in d) + f" | {sum(d) / len(d):+.1f} | {dt:+.2f} |")
