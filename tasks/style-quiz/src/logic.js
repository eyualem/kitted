// The style game's logic: the looks, their order, and how each game ranks them. Owned by the fairness work.
// Plain code concatenated inside one function by build.js (no imports); views.js reads these names.
  const NAMES = { streetwear: 'Streetwear', minimalist: 'Minimal', smart_casual: 'Smart casual', classic_prep: 'Classic prep', workwear: 'Workwear', outdoor: 'Outdoor', vintage_sport: 'Vintage sport', tailored: 'Tailored' };
  const LINES = {
    streetwear: 'Hoodies, graphic tees, baggy jeans or cargos, big sneakers', minimalist: 'Plain pieces, quiet colors, clean lines',
    smart_casual: 'Polos, quarter-zips, button-ups, chinos, neat shoes', classic_prep: 'Blazers, polos, knits, chinos, loafers',
    workwear: 'Chore coats, flannels, sturdy jeans, boots', outdoor: 'Shell jackets, fleeces, cargos, trail shoes', vintage_sport: 'Football jerseys, rugby shirts, retro sneakers',
    tailored: 'Suits, blazers, dress trousers, loafers',
  };
  const ORDER = ['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored', 'workwear', 'outdoor', 'vintage_sport'];
  // ---------- A's game: an 8-look bracket ----------
  // Four first-round pairs, two semifinals, a final and a match for 3rd: every first-round winner plays again, so no
  // early pick gets lost (the first mockup ranked tied winners by how recently they won, which buried round 1).
  // "Neither" knocks both out; a match with one side missing passes the other through without a round.
  const HEATS = [['streetwear', 'minimalist'], ['workwear', 'smart_casual'], ['outdoor', 'classic_prep'], ['tailored', 'vintage_sport']];
  function bracket(g) {
    let i = 0;
    const play = (a, b) => {
      if (!a || !b) return { win: a || b || null, lose: null };
      if (i < g.rounds.length) { const x = g.rounds[i++]; return { win: x.win, lose: x.win ? (x.win === a ? b : a) : null }; }
      throw { ask: [a, b] };
    };
    try {
      const w = HEATS.map(([a, b]) => play(a, b).win);
      const s1 = play(w[0], w[1]), s2 = play(w[2], w[3]);
      const f = play(s1.win, s2.win), t = play(s1.lose, s2.lose);
      return { done: true, result: [f.win, f.lose, t.win].filter(Boolean) };
    } catch (e) { if (e && e.ask) return { done: false, pair: e.ask }; throw e; }
  }

  // ---------- B's game: three rounds of three ----------
  function trioNext(g) {
    const r = g.rounds.length;
    if (r === 0) return ['streetwear', 'minimalist', 'workwear'];
    if (r === 1) return ['smart_casual', 'outdoor', 'vintage_sport'];
    return [g.rounds[0].win, g.rounds[1].win, 'classic_prep'].filter(Boolean);
  }
  function trioResult(g) {
    const w = g.rounds.map((x) => x.win);
    const fin = w[2];
    const out = fin ? [fin] : [];
    [w[1], w[0]].forEach((s) => { if (s && !out.includes(s)) out.push(s); });
    return out.slice(0, 3);
  }

  // ---------- D's game: Me / Not me on each look, then rank the Me's ----------
  // Each look once (its first drawing). Each Me is placed into a top 3 by binary insertion, this-or-that on second
  // drawings (at most 2 taps per Me after the first). Replayed from the rounds so Back works. Simulated in
  // tasks/style-quiz/quiz_sim.py ("D after").
  //
  // Fair to every look (the style-game-fair work, Nov 17): the cards come in a fresh random order for each game, with
  // no look-alikes side by side, counting the last card as next to the first. That last rule keeps every look equally
  // likely at every position (1 in 8; without it Smart casual and Classic prep land first or last 29% of the time, not
  // 25%). A fixed order gave the first card's warm-up and the last cards' growing choosiness to the same looks.
  // The this-or-that starts on a random side per game, then alternates: alternating by round alone put the newcomer on
  // the left 69% of the time and, with the fixed order, Streetwear on the left in only 21% of its rounds.
  // The game's seed lives in its state (st.dSeed, set on first use), so Back keeps the same order; clear it to reshuffle.
  const D_ALIKE = [['classic_prep', 'tailored'], ['minimalist', 'smart_casual'], ['workwear', 'outdoor'], ['streetwear', 'vintage_sport'], ['smart_casual', 'classic_prep']];
  const rng32 = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const dGames = new Map();
  function dGameFor(seed) {
    let g = dGames.get(seed);
    if (g) return g;
    const r = rng32(seed), o = ORDER.slice();
    const alike = (x, y) => D_ALIKE.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
    do { for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } }
    while (o.some((x, i) => alike(x, o[(i + 1) % o.length])));
    g = { order: o, flip: r() < 0.5 ? 1 : 0 };
    dGames.set(seed, g);
    return g;
  }
  const dGame = (st) => { if (!st.dSeed) st.dSeed = 1 + Math.floor(Math.random() * 0x7FFFFFFE); return dGameFor(st.dSeed); };
  const dOrder = (st) => dGame(st).order;
  const yesList = (g) => g.swipes.filter((x) => x.yes).map((x) => x.look);
  function ranker(g) {
    let i = 0; const top = []; const flip = dGame(g).flip;
    // a is the Me being placed: on the left when (round + flip) is even
    const beats = (a, b) => { if (i < g.rounds.length) return g.rounds[i++].win === a; throw { ask: (i + flip) % 2 ? [b, a] : [a, b] }; };
    try {
      for (const c of yesList(g)) {
        let lo = 0, hi = top.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (beats(c, top[mid])) hi = mid; else lo = mid + 1; }
        top.splice(lo, 0, c); top.length = Math.min(top.length, 3);
      }
      return { done: true, result: top.slice() };
    } catch (e) { if (e && e.ask) return { done: false, pair: e.ask }; throw e; }
  }
