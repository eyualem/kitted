// The style game's screens: drawing, the phone frame, every view, gestures, the page controls. Owned by the design work.
// Plain code concatenated after logic.js inside one function by build.js.
  // ---------- page settings: motion, text size, theme ----------
  const motionMq = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPref = 'system';
  let reduce = motionMq.matches;
  const applyMotion = () => { reduce = motionPref === 'reduced' || (motionPref === 'system' && motionMq.matches); document.documentElement.dataset.rm = reduce ? '1' : '0'; };
  applyMotion();

  const darkMq = matchMedia('(prefers-color-scheme: dark)');
  let theme = 'system';
  const isDark = () => theme === 'dark' || (theme === 'system' && darkMq.matches);
  const uriCache = new Map();
  const uri = (svg) => { let u = uriCache.get(svg); if (!u) { u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); uriCache.set(svg, u); } return u; };

  // ---------- D's words: today's line first, then alternatives. The phone shows today's words until the founder picks. ----------
  // `pick` is the design pass's recommendation. {n} = a count, {name} = a look's name.
  const COPY = {
    hint: { label: 'Under the card', opts: ['Tap below, or swipe the card.', 'Swipe right for Me, left for Not me.', 'Swipe the card, or tap below.'], pick: 1,
      why: 'Says which way is which, so the swipe teaches itself.' },
    order: { label: 'The ranking step', opts: [['Now put them in order', 'You said Me to these. Tap the one that’s more you.'], ['Now put them in order', 'You said Me to {n}. Tap the one that’s more you.'], ['Which is more you?', 'A few quick picks put your Me\u2019s in order.']], pick: 1,
      why: '"These" points at two cards, but he may have said Me to three or more; the count says why there’s a next step.' },
    result: { label: 'Results line', opts: ['From your {n} picks. Drag to change the order. You can change it anytime in You.', 'Your top looks, in order. Drag to change it. You can change it anytime in You.', 'Drag to change the order. You can change it anytime in You.'], pick: 1,
      why: '"10 picks" counts the ranking taps too, which reads oddly after 8 cards.' },
    none: { label: 'Nothing clicked yet', opts: ['Play again, or tell me in your words.', 'Add a look you like, play again, or tell me in your words.', 'No problem. Add a look, or tell me in your words.'], pick: 1,
      why: 'The screen’s first button is Add a look, and the line didn’t mention it.' },
    neither: { label: 'A and C: the skip button under the pair', opts: ['Neither', 'Neither is me', 'Not these'], pick: 1,
      why: 'Now a full-width button, so he sees he can skip a pair he doesn’t like; "Neither is me" echoes D’s Not me.' },
    removed: { label: 'After he taps ×', opts: [null, 'Removed {name}', '{name} removed'], pick: 1,
      why: 'An Undo note like the app’s "Added 4 to Closet · Undo": one tap on × shouldn’t lose a look for good.' },
  };
  const copySel = Object.fromEntries(Object.keys(COPY).map((k) => [k, 0]));
  const fill = (s, v = {}) => s && s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
  const w = (key, v) => { const o = COPY[key].opts[copySel[key]]; return Array.isArray(o) ? o.map((x) => fill(x, v)) : fill(o, v); };

  // What VoiceOver says for each drawing (outfit 0 is on the card, outfit 1 in the ranking). Drafts, like the words.
  const DESC = {
    streetwear: ['Gray hoodie, wide washed jeans, chunky white sneakers', 'Black crewneck, wide olive cargos, chunky red sneakers'],
    minimalist: ['Cream crewneck, wide black trousers, white sneakers', 'Gray tee, charcoal trousers, black loafers'],
    smart_casual: ['Navy quarter-zip, khaki chinos, brown suede chukkas', 'Light blue shirt, gray trousers, white sneakers'],
    classic_prep: ['Navy blazer, cream chinos, brown loafers', 'Green polo, tan chinos, white sneakers'],
    tailored: ['Charcoal suit, black dress shoes', 'Navy suit, white leather sneakers'],
    workwear: ['Tan overshirt, cuffed dark jeans, brown work boots', 'Red check shirt, washed blue jeans, gray suede boots'],
    outdoor: ['Olive zip jacket, gray cargos, gray trail shoes', 'Oatmeal crewneck, dark olive cargos, orange trail shoes'],
    vintage_sport: ['Green striped tee, faded jeans, white sneakers', 'Navy sweater with gold stripes, dark jeans, cream runners'],
  };

  // ---------- drawing ----------
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'html') el.innerHTML = v; else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  };
  // The app's Outfit: top w·0.95 square; bottoms w·0.95 × w·1.08 tucked 0.14w up; shoes w·0.78 × w·0.51 tucked 0.10w up.
  function outfit(style, i, w) {
    const pieces = SVG[style][i % 2][isDark() ? 1 : 0];
    const img = (svg, pw, ph, mt) => h('img', { src: uri(svg), width: pw, height: ph, alt: '', draggable: 'false', style: `width:${pw}px;height:${ph}px;margin-top:${mt}px` });
    return h('div', { class: 'outfit', style: `width:${w}px`, 'aria-hidden': 'true' },
      img(pieces[0], w * 0.95, w * 0.95, 0), img(pieces[1], w * 0.95, w * 1.08, -w * 0.14), img(pieces[2], w * 0.78, w * 0.51, -w * 0.1));
  }
  const chevL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  const chevR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  const xIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const gripIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 8h14M5 12h14M5 16h14"/></svg>';
  const checkIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const plusIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const cardsIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/><path d="M7 9.5v5M17 9.5v5" stroke-linecap="round"/></svg>';

  // D's card order: a fresh order per game from logic.js's dOrder (style-game-fair, log #486); the fixed D_ORDER only
  // until that branch lands here.
  const cardOrder = (g) => (typeof dOrder === 'function' ? dOrder(g) : D_ORDER);

  // ---------- one phone ----------
  function Phone(root, dir) {
    let st, hist, toastTimer;
    const fresh = () => ({
      view: { a: 'duel', b: 'trio', c: 'grid', d: 'swipe' }[dir],
      picks: [], rounds: [], swipes: [], words: '', editing: false, sheet: false, ended: false, taps: 0, played: false, from: null, note: '', chosen: null, shake: null,
      nudged: false, toast: null,
    });
    const reset = () => { st = fresh(); hist = []; draw(); };
    const save = () => hist.push(JSON.stringify({ ...st, toast: null }));
    const tap = () => { st.taps += 1; st.ended = false; }; // any tap after Continue leaves the Saved state
    const back = () => {
      if (!hist.length) { st.note = 'Back would go to Welcome'; draw(); setTimeout(() => { st.note = ''; draw(); }, 1400); return; }
      const taps = st.taps + 1; st = JSON.parse(hist.pop()); st.taps = taps; draw();
    };
    const go = (fn) => { const stage = root.querySelector('.stage'); if (!stage || reduce) { fn(); draw(); return; } stage.classList.add('out'); setTimeout(() => { fn(); draw(); }, 160); };
    const focusSoon = (sel) => setTimeout(() => root.querySelector(sel)?.focus({ preventScroll: true }), 0);

    function choose(win, pair) {
      if (st.chosen) return;
      tap(); save();
      st.chosen = win; draw();
      setTimeout(() => go(() => {
        st.chosen = null;
        st.rounds.push({ pair, win });
        const fin = dir === 'b' ? (st.rounds.length >= 3 ? trioResult(st) : null) : dir === 'd' ? (ranker(st).done ? ranker(st).result : null) : (bracket(st).done ? bracket(st).result : null);
        if (fin) { st.picks = fin; st.played = true; st.view = dir === 'd' ? 'dresult' : 'reveal'; }
      }), win ? (reduce ? 120 : 260) : 0);
    }

    // D: decide on the current card (a tap on Me / Not me, or a swipe past 90 pt). The card leaves with its stamp showing
    // (a fade under Reduce Motion), so a tap on a button looks the same as a swipe.
    function decide(yes) {
      if (st.flying || st.swipes.length >= 8) return;
      tap(); save();
      st.nudged = true;
      st.flying = yes ? 'r' : 'l';
      // Send the card on screen off from where it is (a fresh card drawn at the end point would skip the motion).
      const card = root.querySelector('.solo');
      if (card) {
        // Drop the first card's lean first and let the style settle, or the fly-out's transition doesn't start.
        if (card.classList.contains('nudge')) { card.classList.remove('nudge'); void card.offsetWidth; }
        card.classList.remove('drag'); card.style.transform = ''; card.querySelectorAll('.stamp').forEach((s) => (s.style.opacity = '')); card.classList.add('fly-' + st.flying);
      }
      setTimeout(() => {
        st.flying = null;
        st.swipes.push({ look: cardOrder(st)[st.swipes.length], yes });
        if (st.swipes.length < 8) { draw(); return; }
        go(() => {
          const r = ranker(st);
          if (r.done) { st.picks = r.result; st.played = true; st.view = 'dresult'; } else st.view = 'order';
        });
      }, reduce ? 150 : 240);
    }
    function dragCard(card) {
      let x0 = null, dx = 0;
      const stamps = () => [card.querySelector('.stamp.me'), card.querySelector('.stamp.no')];
      const hot = (yes, on) => root.querySelector(`[data-yn="${yes ? 'me' : 'no'}"]`)?.classList.toggle('hot', on);
      card.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; st.nudged = true; if (card.classList.contains('nudge')) { card.classList.remove('nudge'); void card.offsetWidth; } card.classList.add('drag'); try { card.setPointerCapture(e.pointerId); } catch (err) { /* same */ } });
      card.addEventListener('pointermove', (e) => {
        if (x0 === null) return;
        const sc = root.getBoundingClientRect().width / 402 || 1;
        dx = (e.clientX - x0) / sc;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
        const [me, no] = stamps(); me.style.opacity = Math.max(0, Math.min(1, dx / 90)); no.style.opacity = Math.max(0, Math.min(1, -dx / 90));
        // Past the line, the matching button lights up (in the app: one selection haptic as it crosses).
        hot(true, dx > 90); hot(false, dx < -90);
      });
      const end = () => {
        if (x0 === null) return;
        x0 = null; card.classList.remove('drag'); hot(true, false); hot(false, false);
        if (Math.abs(dx) > 90) { card.style.transform = ''; decide(dx > 0); }
        else { card.style.transform = ''; stamps().forEach((s) => (s.style.opacity = '')); }
      };
      card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
    }

    // D's results: drag a row by its handle; the others slide to make room; dropping reorders his picks.
    function dragRow(e, i, move) {
      e.preventDefault();
      const grip = e.currentTarget; try { grip.setPointerCapture(e.pointerId); } catch (err) { /* a pointer the browser can't capture; moves still reach the grip */ }
      const els = [...root.querySelectorAll('.ranks .rank')];
      const rects = els.map((r) => r.getBoundingClientRect());
      const sc = root.getBoundingClientRect().width / 402 || 1;
      const me = els[i]; const pitch = rects[i].height + 10 * sc; const y0 = e.clientY;
      let target = i;
      me.classList.add('lift');
      const onMove = (ev) => {
        const dy = ev.clientY - y0;
        me.style.transform = `translateY(${dy / sc}px)`;
        const c = rects[i].top + rects[i].height / 2 + dy;
        target = els.filter((_, j) => j !== i && rects[j].top + rects[j].height / 2 < c).length;
        els.forEach((el, j) => {
          if (j === i) return;
          const sh = i < target && j > i && j <= target ? -pitch : i > target && j < i && j >= target ? pitch : 0;
          el.style.transform = sh ? `translateY(${sh / sc}px)` : '';
        });
      };
      const onUp = () => {
        grip.removeEventListener('pointermove', onMove); grip.removeEventListener('pointerup', onUp); grip.removeEventListener('pointercancel', onUp);
        if (target !== i) move(i, target);
        else { me.classList.remove('lift'); els.forEach((el) => (el.style.transform = '')); }
      };
      grip.addEventListener('pointermove', onMove); grip.addEventListener('pointerup', onUp); grip.addEventListener('pointercancel', onUp);
    }

    function frame(content, dock, step = 2, cls = '') {
      return [
        h('div', { class: 'sb', 'aria-hidden': 'true' }, h('span', { class: 'time' }, '9:41'), h('span', { class: 'island' }),
          h('span', { class: 'sig' }, [5, 7, 9, 12].map((x) => h('i', { style: `height:${x}px` }))), h('span', { class: 'bat' })),
        h('div', { class: 'nav' },
          h('button', { class: 'circle', 'aria-label': 'Back', html: chevL, onclick: back }),
          h('div', { class: 'bar', role: 'progressbar', 'aria-label': `Setup, step ${step} of 3` }, [1, 2, 3].map((n) => h('i', { class: n <= step ? 'on' : '' }))),
          h('span', { class: 'spacer' })),
        h('div', { class: 'scr' }, h('div', { class: 'scroll stage ' + cls }, content), dock ? h('div', { class: 'dock' }, dock) : null),
        ...(st.ended ? [h('div', { class: 'toast saved', role: 'status' }, h('span', { class: 'ok', html: checkIc, 'aria-hidden': 'true' }), h('span', {}, 'Saved'))] : []),
      ];
    }
    // The tap counts sit under the phone, for the founder's comparison (testers look at the phone, not this line).
    const tapsLine = document.querySelector(`[data-taps="${dir}"]`);
    const showTaps = () => { if (tapsLine) tapsLine.textContent = st.ended ? `${st.taps} taps on this step · ${5 + st.taps} from a fresh install to the camera (today 7)` : `${st.taps} taps so far`; };
    // Continue ends the mockup with a one-line Saved note over the screen he's on (in the app, setup goes on to his age).
    const finish = () => { tap(); save(); st.toast = null; st.ended = true; draw(); };
    const title = (t, line) => h('div', { class: 'ttl' }, h('h3', {}, t), line ? h('p', {}, line) : null);
    const dots = (n, on) => h('div', { class: 'dots', 'aria-label': `Pick ${on + 1} of ${n}` }, Array.from({ length: n }, (_, i) => h('i', { class: i <= on ? 'on' : '' })));
    const seen = (style) => st.rounds.filter((x) => x.pair.includes(style)).length;

    const views = {
      grid() {
        const togg = (s) => {
          tap();
          const i = st.picks.indexOf(s);
          if (i >= 0) { save(); st.picks.splice(i, 1); }
          else if (st.picks.length >= 3) { st.shake = s; st.note = 'Up to 3.'; setTimeout(() => { st.note = ''; st.shake = null; draw(); }, 1800); }
          else { save(); st.picks.push(s); }
          draw();
        };
        const tiles = ORDER.map((s) => {
          const n = st.picks.indexOf(s) + 1;
          return h('button', { class: 'tile' + (n ? ' sel' : '') + (st.shake === s ? ' shake' : ''), onclick: () => togg(s), 'aria-pressed': n ? 'true' : 'false', 'aria-label': `${NAMES[s]}: ${LINES[s]}` },
            h('div', { class: 'art' }, outfit(s, 0, 73), outfit(s, 1, 73)),
            h('div', { class: 'nm' }, h('span', {}, NAMES[s]), n ? h('span', { class: 'disc' }, String(n)) : null),
            h('div', { class: 'ln' }, LINES[s]));
        });
        tiles.push(h('div', { class: 'tile other', title: 'Typing is left out of this mockup' }, h('div', { class: 't1' }, 'Something else?'), h('div', { class: 't2' }, 'Tell me in your words')));
        const door = dir === 'c' ? h('button', { class: 'door', onclick: () => { tap(); save(); go(() => { st.view = 'duel'; st.rounds = []; st.from = 'grid'; }); } },
          h('span', { class: 'ic', html: cardsIc }),
          h('span', { class: 'tx' }, h('b', {}, st.played ? 'Play this or that again' : 'Not sure? Try this or that'), h('span', {}, '8 quick picks. We’ll suggest your top 3.')),
          h('span', { class: 'chev', html: chevR })) : null;
        const n = st.picks.length;
        return frame([title("What's your style?", "Pick up to 3 looks you like. Today's outfit comes next."), door, h('div', { class: 'grid' }, tiles)],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('button', { class: 'btn', disabled: !n, onclick: finish }, n ? `Continue · ${n} of 3` : 'Continue')]);
      },
      duel() {
        const r = st.rounds.length;
        const pair = bracket(st).pair;
        const card = (s) => h('button', { class: 'pick' + (st.chosen === s ? ' chosen' : st.chosen ? ' faded' : ''), onclick: () => choose(s, pair), 'data-style': s, 'aria-label': `Outfit ${pair.indexOf(s) + 1}` },
          h('div', { class: 'art' }, outfit(s, seen(s), 136)));
        return frame([title('This or that?', 'Tap the one that’s more you.'), h('div', { class: 'pair' }, pair.map(card)), dots(8, r)],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('button', { class: 'btn sec', onclick: () => choose(null, pair) }, w('neither'))]);
      },
      // D, step 1: one card at a time. The buttons are the main way; the swipe is a shortcut that mirrors them.
      swipe() {
        const n = st.swipes.length;
        const look = cardOrder(st)[Math.min(n, 7)];
        const nudge = n === 0 && !st.nudged && !reduce;
        const card = h('div', { class: 'solo' + (st.flying ? ' fly-' + st.flying : '') + (nudge ? ' nudge' : ''), 'data-style': look, role: 'img', 'aria-label': `Outfit ${Math.min(n + 1, 8)} of 8. ${DESC[look][0]}` },
          h('span', { class: 'stamp me', 'aria-hidden': 'true' }, 'Me'), h('span', { class: 'stamp no', 'aria-hidden': 'true' }, 'Not me'),
          h('div', { class: 'art' }, outfit(look, 0, 170)));
        dragCard(card);
        const prog = h('div', { class: 'prog', 'aria-hidden': 'true' }, Array.from({ length: 8 }, (_, i) => h('i', { class: i < n ? 'done' : i === n ? 'now' : '' })));
        return frame([title('Me or not me?', 'One outfit at a time. Would you wear something like this?'), card, prog, h('div', { class: 'hint' }, w('hint'))],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('div', { class: 'yn' },
            h('button', { class: 'btn sec', 'data-yn': 'no', onclick: () => decide(false) }, 'Not me'),
            h('button', { class: 'btn', 'data-yn': 'me', onclick: () => decide(true) }, 'Me'))]);
      },
      // D, step 2: this-or-that between his Me's. The pair sits mid-screen, in thumb reach.
      order() {
        const pair = ranker(st).pair;
        const [t, line] = w('order', { n: yesList(st).length });
        const card = (s) => h('button', { class: 'pick' + (st.chosen === s ? ' chosen' : st.chosen ? ' faded' : ''), onclick: () => choose(s, pair), 'data-style': s, 'aria-label': DESC[s][1] },
          h('div', { class: 'art' }, outfit(s, 1, 150)));
        return frame([title(t, line), h('div', { class: 'pair mid' }, pair.map(card))],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note)], 2, 'fill');
      },
      // D's results: remove a look, add one from a sheet, say it in his own words, or play again. No grid in setup.
      dresult() {
        const p = st.picks;
        const canGo = () => p.length > 0 || st.words.trim().length > 0;
        const noneLiked = !yesList(st).length;
        const say = (msg) => { const n = root.querySelector('.dock .note'); if (n) n.textContent = msg; };
        const move = (i, to, kbd = false) => {
          if (to === i || to < 0 || to >= p.length) return;
          tap(); save(); const [x] = st.picks.splice(i, 1); st.picks.splice(to, 0, x); draw();
          say(`${NAMES[x]}, now ${to + 1} of ${p.length}`);
          if (kbd) root.querySelectorAll('.grip')[to]?.focus({ preventScroll: true });
        };
        const remove = (i) => {
          tap(); save();
          const [x] = st.picks.splice(i, 1);
          const msg = w('removed', { name: NAMES[x] });
          clearTimeout(toastTimer);
          st.toast = msg ? { text: msg } : null;
          if (msg) toastTimer = setTimeout(() => { if (st.toast) { st.toast = null; draw(); } }, 5000);
          draw();
          if (!msg) say(`Removed ${NAMES[x]}`); // the Undo note announces itself (role=status)
          focusSoon(st.picks.length ? `.rank:nth-child(${Math.min(i, st.picks.length - 1) + 1}) .x` : '.addrow');
        };
        const rows = p.map((s, i) => {
          const grip = h('button', { class: 'grip', html: gripIc, 'aria-label': `Reorder ${NAMES[s]}`, 'aria-keyshortcuts': 'ArrowUp ArrowDown' });
          grip.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { e.preventDefault(); move(i, i - 1, true); } if (e.key === 'ArrowDown') { e.preventDefault(); move(i, i + 1, true); } });
          grip.addEventListener('pointerdown', (e) => dragRow(e, i, move));
          // Screen-reader-only Move up / Move down: the web's stand-in for VoiceOver's actions on the row (see the build notes).
          const sr = [i > 0 ? h('button', { class: 'sr', tabindex: '-1', onclick: () => move(i, i - 1, true) }, `Move ${NAMES[s]} up`) : null,
            i < p.length - 1 ? h('button', { class: 'sr', tabindex: '-1', onclick: () => move(i, i + 1, true) }, `Move ${NAMES[s]} down`) : null];
          return h('li', { class: 'rank', 'data-style': s, 'aria-label': `${i + 1} of ${p.length}, ${NAMES[s]}. ${LINES[s]}` },
            h('div', { class: 'art', 'aria-hidden': 'true' }, outfit(s, 0, 42), h('span', { class: 'disc' }, String(i + 1))),
            h('div', { class: 'tx', 'aria-hidden': 'true' }, h('b', {}, NAMES[s]), h('span', {}, LINES[s])),
            h('button', { class: 'x', 'aria-label': `Remove ${NAMES[s]}`, html: `<span>${xIc}</span>`, onclick: () => remove(i) }),
            grip, sr);
        });
        const add = p.length < 3 ? h('button', { class: 'addrow', onclick: () => { tap(); save(); st.sheet = true; draw(); focusSoon('.sheet .close'); } }, h('span', { html: plusIc, 'aria-hidden': 'true' }), 'Add a look') : null;
        const finishWords = () => { tap(); save(); st.words = st.words.trim(); st.editing = false; draw(); focusSoon('.words .linkbtn'); };
        let words;
        if (st.editing) {
          const input = h('input', { class: 'field', type: 'text', maxlength: '80', placeholder: 'Like skater, or all black', 'aria-label': 'Your style in your words', value: st.words, enterkeyhint: 'done' });
          input.addEventListener('input', (e) => { st.words = e.target.value; const c = root.querySelector('.dock .btn'); if (c) c.disabled = !canGo(); });
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finishWords(); });
          setTimeout(() => { input.focus({ preventScroll: true }); input.scrollIntoView({ block: 'nearest' }); }, 0);
          words = h('div', { class: 'words' }, h('div', { class: 'wrow' }, input, h('button', { class: 'wdone', onclick: finishWords }, 'Done')));
        } else if (st.words) {
          words = h('div', { class: 'words' }, h('div', { class: 'saved' }, 'In your words: ', h('b', {}, `“${st.words}”`)),
            h('button', { class: 'linkbtn', onclick: () => { tap(); st.editing = true; draw(); } }, 'Edit'));
        } else {
          words = h('div', { class: 'words' }, h('button', { class: 'linkbtn', onclick: () => { tap(); st.editing = true; draw(); } }, 'Not quite you? Tell me in your words'));
        }
        const line = fill(w('result', { n: st.rounds.length + st.swipes.length }));
        const head = p.length ? title('Here’s your style', p.length > 1 ? line : line.replace(/ ?Drag[^.]*\./, ''))
          : noneLiked ? title('Nothing clicked yet', w('none'))
          : title('Here’s your style', 'Add a look, or tell me in your words.');
        // One primary action (Continue) in the thumb zone; Play again is a quieter text button under it, as on Welcome.
        const f = frame([head, h('ol', { class: 'ranks' }, rows), add, words],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note),
            h('button', { class: 'btn', disabled: !canGo(), onclick: finish }, 'Continue'),
            h('button', { class: 'txt', onclick: () => { tap(); save(); go(() => { st.swipes = []; st.rounds = []; st.picks = []; st.dSeed = 0; st.toast = null; st.view = 'swipe'; }); } }, 'Play again')]);
        if (st.toast) {
          f.push(h('div', { class: 'toast', role: 'status' }, h('span', {}, st.toast.text),
            h('button', { onclick: () => { clearTimeout(toastTimer); back(); } }, 'Undo')));
        }
        if (st.sheet) {
          const close = () => { tap(); st.sheet = false; draw(); focusSoon('.addrow'); };
          const left = ORDER.filter((s) => !p.includes(s));
          const tiles = left.map((s) => h('button', { class: 'tile', onclick: () => { tap(); save(); st.picks.push(s); st.sheet = false; draw(); say(`Added ${NAMES[s]}`); focusSoon(`.rank:nth-child(${st.picks.length}) .x`); }, 'aria-label': `${NAMES[s]}: ${LINES[s]}` },
            h('div', { class: 'art' }, outfit(s, 0, 66), outfit(s, 1, 66)),
            h('div', { class: 'nm' }, h('span', {}, NAMES[s])),
            h('div', { class: 'ln' }, LINES[s])));
          const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `sh-${dir}` }, h('span', { class: 'grab', 'aria-hidden': 'true' }),
            h('div', { class: 'hd' }, h('h4', { id: `sh-${dir}` }, 'Add a look'), h('button', { class: 'circle close', 'aria-label': 'Close', html: xIc, onclick: close })),
            h('div', { class: 'sheet-body' }, h('div', { class: 'grid' }, tiles)));
          sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
          f.push(h('div', { class: 'sheet-bg', onclick: close }), sheet);
        }
        return f;
      },
      trio() {
        const r = st.rounds.length;
        const set = trioNext(st);
        const card = (s) => h('button', { class: 'pick' + (st.chosen === s ? ' chosen' : st.chosen ? ' faded' : ''), onclick: () => choose(s, set), 'data-style': s, 'aria-label': `Outfit ${set.indexOf(s) + 1}` },
          h('div', { class: 'art' }, outfit(s, r === 2 && s !== 'classic_prep' ? 1 : 0, 92)));
        return frame([title('Which is more you?', 'Tap one. 3 quick picks.'), h('div', { class: 'trio' }, set.map(card)), dots(3, r)],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('button', { class: 'btn sec', onclick: () => choose(null, set) }, 'None of these')]);
      },
      reveal() {
        const p = st.picks;
        if (!p.length) {
          return frame([title('Nothing clicked yet', 'Pick from the full list, or tell me in your words.')],
            [h('button', { class: 'btn', onclick: () => { tap(); save(); go(() => (st.view = 'grid')); } }, 'See all looks')]);
        }
        const rows = p.map((s, i) => h('div', { class: 'rank old' + (i === 0 ? ' first' : '') },
          h('div', { class: 'art' }, outfit(s, 0, 40), outfit(s, 1, 40)),
          h('div', { class: 'tx' }, h('b', {}, NAMES[s]), h('span', {}, LINES[s])),
          h('span', { class: 'disc' }, String(i + 1))));
        const nPicks = st.rounds.length + st.swipes.length;
        return frame([title('Here’s your style', `From your ${nPicks} picks. You can change it anytime in You.`), h('div', { class: 'ranks' }, rows)],
          [h('button', { class: 'txt', onclick: () => { tap(); save(); go(() => (st.view = 'grid')); } }, 'Change picks'),
           h('button', { class: 'btn', onclick: finish }, 'Continue')]);
      },
    };
    function draw() {
      const sc = root.querySelector('.scroll'); const y = sc && root.dataset.view === st.view ? sc.scrollTop : 0;
      root.replaceChildren(...views[st.view]());
      root.dataset.view = st.view;
      const sc2 = root.querySelector('.scroll'); if (sc2) sc2.scrollTop = y;
      showTaps();
    }
    reset();
    return { reset, draw };
  }

  const phones = {};
  document.querySelectorAll('.phone').forEach((el) => (phones[el.dataset.dir] = Phone(el, el.dataset.dir)));
  document.querySelectorAll('[data-restart]').forEach((b) => b.addEventListener('click', () => phones[b.dataset.restart].reset()));
  const redrawAll = () => Object.values(phones).forEach((p) => p.draw());

  // Fit each 402 × 874 phone into its column.
  const fit = () => document.querySelectorAll('.phone-wrap').forEach((w) => {
    const s = Math.min(1, (w.clientWidth - 18) / 402) || 1;
    const p = w.firstElementChild; p.style.transform = `translate(9px, 9px) scale(${s})`; w.style.height = `${874 * s + 18}px`;
  });
  new ResizeObserver(fit).observe(document.querySelector('.row'));
  fit();

  // Page controls: color scheme, text size, motion. Each is a row of toggle buttons.
  const control = (attr, set) => {
    const btns = document.querySelectorAll(`[${attr}]`);
    btns.forEach((b) => b.addEventListener('click', () => { btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); set(b.getAttribute(attr)); }));
  };
  control('data-th', (t) => { theme = t; if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); redrawAll(); });
  control('data-ts', (t) => { document.documentElement.dataset.ts = t; redrawAll(); });
  control('data-mo', (m) => { motionPref = m; applyMotion(); redrawAll(); });
  darkMq.addEventListener('change', () => theme === 'system' && redrawAll());
  motionMq.addEventListener('change', () => { applyMotion(); redrawAll(); });

  // The word options (D, plus A and C's skip button): today's words are on until the founder picks; "Recommended" marks the design pass's pick.
  const copyBox = document.getElementById('copy-d');
  if (copyBox) {
    const sample = { n: 3, name: 'Minimal' };
    const show = (o) => (o === null ? 'No note (today: Back undoes it)' : Array.isArray(o) ? `${fill(o[0], sample)} / ${fill(o[1], sample)}` : fill(o, sample));
    const render = () => {
      copyBox.replaceChildren(
        h('div', { class: 'copy-actions' },
          h('button', { type: 'button', class: 'restart', onclick: () => { Object.keys(COPY).forEach((k) => (copySel[k] = 0)); render(); redrawAll(); } }, 'Today’s words'),
          h('button', { type: 'button', class: 'restart', onclick: () => { Object.keys(COPY).forEach((k) => (copySel[k] = COPY[k].pick)); render(); redrawAll(); } }, 'All recommended')),
        ...Object.entries(COPY).map(([k, c]) => h('fieldset', { class: 'copyset' }, h('legend', {}, c.label),
          ...c.opts.map((o, i) => h('label', { class: 'opt' },
            h('input', { type: 'radio', name: `copy-${k}`, checked: copySel[k] === i, onchange: () => { copySel[k] = i; redrawAll(); } }),
            h('span', {}, show(o), i === 0 ? h('span', { class: 'tag' }, 'today') : null, i === c.pick ? h('span', { class: 'tag rec' }, 'recommended') : null))),
          h('p', { class: 'why' }, c.why))));
    };
    render();
  }

  // Tabs (narrow screens show one phone at a time)
  const showTab = (k) => {
    document.querySelectorAll('figure[data-fig]').forEach((f) => f.classList.toggle('on', f.dataset.fig === k));
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === k)));
    fit();
    if (['a', 'b', 'c', 'd'].includes(k)) { try { history.replaceState(null, '', location.search + '#' + k); } catch (e) { /* fine */ } }
  };
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  const fromHash = location.hash.slice(1);
  showTab(['a', 'b', 'c', 'd'].includes(fromHash) ? fromHash : 'a');
  window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (['a', 'b', 'c', 'd'].includes(k)) showTab(k); });
