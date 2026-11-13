"""How often does each style-quiz format find a person's real top look? A $0 simulation, no AI calls.

A simulated person has a liking (0..1) for each of the 8 looks. Each drawn outfit is a noisy stand-in for its look
(a drawing can miss: OUTFIT_SD), and each tap is noisy too (TAP_SD). The likings are made up to stand for a few kinds
of people; the point is to compare formats under the same assumptions, not to predict real numbers.
"""
import random, statistics

LOOKS = ["streetwear", "minimalist", "smart_casual", "classic_prep", "tailored", "workwear", "outdoor", "vintage_sport"]
OUTFIT_SD, TAP_SD, YES_AT = 0.15, 0.10, 0.55

PEOPLE = {
    "streetwear guy": dict(streetwear=0.95, vintage_sport=0.65, outdoor=0.5, workwear=0.45, minimalist=0.35, smart_casual=0.2, classic_prep=0.1, tailored=0.1),
    "minimal guy": dict(minimalist=0.95, smart_casual=0.7, tailored=0.55, classic_prep=0.45, workwear=0.35, streetwear=0.3, outdoor=0.25, vintage_sport=0.15),
    "two loves (street + work)": dict(streetwear=0.9, workwear=0.88, outdoor=0.6, vintage_sport=0.55, minimalist=0.4, smart_casual=0.3, classic_prep=0.15, tailored=0.15),
}


def make_world(likes, rng):
    # Two drawn outfits per look; each reads a bit more or less like the look than the look itself.
    return {l: [likes[l] + rng.gauss(0, OUTFIT_SD) for _ in range(2)] for l in LOOKS}


def feel(world, look, i, rng):
    return world[look][i % 2] + rng.gauss(0, TAP_SD)


# ---------- A: the mockup's six this-or-that rounds ----------
def run_a(world, rng):
    rounds, seen = [], {l: 0 for l in LOOKS}

    def scores():
        s = {l: 0.0 for l in LOOKS}
        for pair, win in rounds:
            if win: s[win] += 1
            else:
                for x in pair: s[x] -= 0.5
        return s

    def ranking():
        s = scores()
        last = {l: -1 for l in LOOKS}
        for i, (_, w) in enumerate(rounds):
            if w: last[w] = i
        return sorted(LOOKS, key=lambda l: (-s[l], -last[l], LOOKS.index(l)))

    heats = [("streetwear", "minimalist"), ("workwear", "smart_casual"), ("outdoor", "classic_prep"), ("tailored", "vintage_sport")]
    for r in range(6):
        if r < 4: pair = heats[r]
        else:
            rank, s = ranking(), scores()
            met = lambda a, b: any(a in p and b in p for p, _ in rounds)
            cands = [(rank[i], rank[j], min(s[rank[i]], s[rank[j]]), i + j) for i in range(len(rank)) for j in range(i + 1, len(rank)) if not met(rank[i], rank[j])]
            cands.sort(key=lambda c: (-c[2], c[3]))
            pair = cands[0][:2]
        a, b = (feel(world, x, seen[x], rng) for x in pair)
        for x in pair: seen[x] += 1
        win = None if max(a, b) < YES_AT - 0.25 else (pair[0] if a >= b else pair[1])   # "Neither" only when both are far off
        rounds.append((pair, win))
    wins = {}
    for _, w in rounds:
        if w: wins[w] = wins.get(w, 0) + 1
    return [l for l in ranking() if wins.get(l)][:3], 7


# ---------- A2: a proper bracket: 4 heats, 2 semis, a final, a match for 3rd (8 rounds) ----------
def run_a2(world, rng):
    seen = {l: 0 for l in LOOKS}

    def duel(a, b):
        if a is None: return b, a
        if b is None: return a, b
        fa, fb = feel(world, a, seen[a], rng), feel(world, b, seen[b], rng)
        seen[a] += 1; seen[b] += 1
        if max(fa, fb) < YES_AT - 0.25: return None, None
        return (a, b) if fa >= fb else (b, a)

    heats = [("streetwear", "minimalist"), ("workwear", "smart_casual"), ("outdoor", "classic_prep"), ("tailored", "vintage_sport")]
    w = [duel(*h)[0] for h in heats]
    s1, l1 = duel(w[0], w[1]); s2, l2 = duel(w[2], w[3])
    f1, f2 = duel(s1, s2)
    t3, _ = duel(l1, l2)
    return [x for x in (f1, f2, t3) if x], 9


# ---------- B: three rounds of three (the 7 looks it was drawn with) ----------
def run_b(world, rng):
    def pick(looks, idx):
        f = [(feel(world, l, idx, rng), l) for l in looks]
        best = max(f)
        return best[1] if best[0] >= YES_AT - 0.25 else None
    w1 = pick(["streetwear", "minimalist", "workwear"], 0)
    w2 = pick(["smart_casual", "outdoor", "vintage_sport"], 0)
    w3 = pick([x for x in (w1, w2) if x] + ["classic_prep"], 1)
    out = [w3] if w3 else []
    for x in (w2, w1):
        if x and x not in out: out.append(x)
    return out[:3], 4


# ---------- C: yes/no on one outfit per look, a second outfit for each yes, then this-or-that to order ----------
def run_swipe(world, rng, second=True):
    taps, score = 0, {}
    for l in LOOKS:
        taps += 1
        if feel(world, l, 0, rng) >= YES_AT: score[l] = 1
    if second:
        for l in list(score):
            taps += 1
            if feel(world, l, 1, rng) >= YES_AT: score[l] += 1
            else: score[l] -= 0.5
    liked = sorted(score, key=lambda l: -score[l])
    liked = [l for l in liked if score[l] > 0]
    # Order the top: this-or-that between neighbours, up to 3 extra taps.
    order = liked[:]
    for _ in range(3):
        changed = False
        for i in range(min(3, len(order)) - 1):
            a, b = order[i], order[i + 1]
            taps += 1
            if feel(world, b, 1, rng) > feel(world, a, 1, rng):
                order[i], order[i + 1] = b, a; changed = True
        if not changed: break
    return order[:3], taps + 1


FORMATS = {
    "A  this-or-that, 6 rounds": run_a,
    "A2 this-or-that bracket, 8 rounds": run_a2,
    "B  one of three, 3 rounds": run_b,
    "S1 yes/no x8, then order": lambda w, r: run_swipe(w, r, second=False),
    "S2 yes/no x8, 2nd outfit for each yes, order": run_swipe,
}

if __name__ == "__main__":
    N = 20000
    for who, likes in PEOPLE.items():
        top = max(likes, key=likes.get)
        dislikes = {l for l, v in likes.items() if v < 0.3}
        print(f"\n{who}: real favourite {top}")
        print(f"  {'format':48} {'1st right':>9} {'in top 3':>9} {'a dislike in top 3':>19} {'empty':>6} {'taps':>5}")
        for name, fn in FORMATS.items():
            rng = random.Random(7)
            first = in3 = bad = empty = 0; taps = []
            for _ in range(N):
                res, t = fn(make_world(likes, rng), rng)
                taps.append(t)
                first += bool(res) and res[0] == top
                in3 += top in res
                bad += any(l in dislikes for l in res)
                empty += not res
            print(f"  {name:48} {first/N:9.0%} {in3/N:9.0%} {bad/N:19.0%} {empty/N:6.0%} {statistics.mean(taps):5.1f}")
