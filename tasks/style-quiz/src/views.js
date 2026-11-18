// The style game's screens: drawing, the phone frame, every view, gestures, the page controls. Owned by the design work.
// Plain code concatenated after logic.js inside one function by build.js.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- theme ----------
  const darkMq = matchMedia('(prefers-color-scheme: dark)');
  let theme = 'system';
  const isDark = () => theme === 'dark' || (theme === 'system' && darkMq.matches);
  const uriCache = new Map();
  const uri = (svg) => { let u = uriCache.get(svg); if (!u) { u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); uriCache.set(svg, u); } return u; };

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
  const plusIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const cardsIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/><path d="M7 9.5v5M17 9.5v5" stroke-linecap="round"/></svg>';

  // ---------- one phone ----------
  function Phone(root, dir) {
    let st, hist;
    const fresh = () => ({
      view: { a: 'duel', b: 'trio', c: 'grid', d: 'swipe' }[dir],
      picks: [], rounds: [], swipes: [], words: '', editing: false, sheet: false, ended: false, taps: 0, played: false, from: null, note: '', chosen: null, shake: null,
    });
    const reset = () => { st = fresh(); hist = []; draw(); };
    const save = () => hist.push(JSON.stringify(st));
    const tap = () => { st.taps += 1; };
    const back = () => {
      if (!hist.length) { st.note = 'Back would go to Welcome'; draw(); setTimeout(() => { st.note = ''; draw(); }, 1400); return; }
      const taps = st.taps + 1; st = JSON.parse(hist.pop()); st.taps = taps; draw();
    };
    const go = (fn) => { const stage = root.querySelector('.stage'); if (!stage || reduce) { fn(); draw(); return; } stage.classList.add('out'); setTimeout(() => { fn(); draw(); }, 160); };

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

    // D: decide on the current card (a tap on Me / Not me, or a swipe past 90 px).
    function decide(yes) {
      if (st.flying || st.swipes.length >= 8) return;
      tap(); save();
      st.flying = yes ? 'r' : 'l'; draw();
      setTimeout(() => {
        st.flying = null;
        st.swipes.push({ look: dOrder(st)[st.swipes.length], yes });
        if (st.swipes.length < 8) { draw(); return; }
        go(() => {
          const r = ranker(st);
          if (r.done) { st.picks = r.result; st.played = true; st.view = 'dresult'; } else st.view = 'order';
        });
      }, reduce ? 0 : 220);
    }
    function dragCard(card) {
      let x0 = null, dx = 0;
      const stamps = () => [card.querySelector('.stamp.me'), card.querySelector('.stamp.no')];
      card.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; card.classList.add('drag'); try { card.setPointerCapture(e.pointerId); } catch (err) { /* same */ } });
      card.addEventListener('pointermove', (e) => {
        if (x0 === null) return;
        const sc = root.getBoundingClientRect().width / 402 || 1;
        dx = (e.clientX - x0) / sc;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
        const [me, no] = stamps(); me.style.opacity = Math.max(0, Math.min(1, dx / 90)); no.style.opacity = Math.max(0, Math.min(1, -dx / 90));
      });
      const end = () => {
        if (x0 === null) return;
        x0 = null; card.classList.remove('drag');
        if (Math.abs(dx) > 90) { card.style.transform = ''; decide(dx > 0); }
        else { card.style.transform = ''; stamps().forEach((s) => (s.style.opacity = 0)); }
      };
      card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
    }

    // D's results: drag a row by its grip; the others slide to make room; dropping reorders his picks.
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

    function frame(content, dock, step = 2) {
      return [
        h('div', { class: 'sb' }, h('span', { class: 'time' }, '9:41'), h('span', { class: 'island' }),
          h('span', { class: 'sig' }, [5, 7, 9, 12].map((x) => h('i', { style: `height:${x}px` }))), h('span', { class: 'bat' })),
        h('div', { class: 'nav' },
          h('button', { class: 'circle', 'aria-label': 'Back', html: chevL, onclick: back }),
          h('div', { class: 'bar', 'aria-hidden': 'true' }, [1, 2, 3].map((n) => h('i', { class: n <= step ? 'on' : '' }))),
          h('span', { class: 'spacer' })),
        h('div', { class: 'scr' }, h('div', { class: 'scroll stage' }, content), dock ? h('div', { class: 'dock' }, dock) : null),
        ...(st.ended ? endCard() : []),
      ];
    }
    // The mockup's end (not an app screen): what he saved and the taps, over the screen he left.
    function endCard() {
      const picks = st.picks.map((s, i) => `${i + 1} ${NAMES[s]}`).join(' \u00b7 ');
      const said = [picks, st.words ? `\u201c${st.words}\u201d` : ''].filter(Boolean).join(' + ');
      return [h('div', { class: 'end-bg' }), h('div', { class: 'endcard', role: 'status' },
        h('div', { class: 'eyebrow' }, 'Saved. End of the mockup.'),
        h('div', { class: 'big' }, said),
        h('div', { class: 'stat' }, `${st.taps} taps on this step \u00b7 ${5 + st.taps} from a fresh install to the camera (today 7)`),
        h('div', { class: 'stat' }, 'In the app, setup goes on to your age, then Stylist.'),
        h('button', { onclick: reset }, 'Start again'))];
    }
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
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('button', { class: 'btn', disabled: !n, onclick: () => { tap(); save(); go(() => (st.ended = true)); } }, n ? `Continue · ${n} of 3` : 'Continue')]);
      },
      duel() {
        const r = st.rounds.length;
        const pair = bracket(st).pair;
        const card = (s) => h('button', { class: 'pick' + (st.chosen === s ? ' chosen' : st.chosen ? ' faded' : ''), onclick: () => choose(s, pair), 'data-style': s, 'aria-label': `Outfit ${pair.indexOf(s) + 1}` },
          h('div', { class: 'art' }, outfit(s, seen(s), 136)));
        return frame([title('This or that?', 'Tap the one that’s more you.'), h('div', { class: 'pair' }, pair.map(card)), dots(8, r)],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('button', { class: 'txt', onclick: () => choose(null, pair) }, 'Neither')]);
      },
      swipe() {
        const n = st.swipes.length;
        const look = dOrder(st)[Math.min(n, 7)];
        const card = h('div', { class: 'solo' + (st.flying ? ' fly-' + st.flying : ''), 'data-style': look, role: 'img', 'aria-label': `Outfit ${n + 1} of 8` },
          h('span', { class: 'stamp no' }, 'Not me'), h('span', { class: 'stamp me' }, 'Me'),
          h('div', { class: 'art' }, outfit(look, 0, 170)));
        dragCard(card);
        return frame([title('Me or not me?', 'One outfit at a time. Would you wear something like this?'), card, dots(8, n), h('div', { class: 'hint' }, 'Tap below, or swipe the card.')],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('div', { class: 'yn' },
            h('button', { class: 'btn sec', onclick: () => decide(false) }, 'Not me'),
            h('button', { class: 'btn', onclick: () => decide(true) }, 'Me'))]);
      },
      order() {
        const pair = ranker(st).pair;
        const card = (s) => h('button', { class: 'pick' + (st.chosen === s ? ' chosen' : st.chosen ? ' faded' : ''), onclick: () => choose(s, pair), 'data-style': s, 'aria-label': `Outfit ${pair.indexOf(s) + 1}` },
          h('div', { class: 'art' }, outfit(s, 1, 136)));
        return frame([title('Now put them in order', 'You said Me to these. Tap the one that’s more you.'), h('div', { class: 'pair' }, pair.map(card))],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note)]);
      },
      // D's results: remove a look, add one from a sheet, say it in his own words, or play again. No grid in setup.
      dresult() {
        const p = st.picks;
        const canGo = () => p.length > 0 || st.words.trim().length > 0;
        const noneLiked = !yesList(st).length;
        const move = (i, to, kbd = false) => { if (to === i || to < 0 || to >= p.length) return; tap(); save(); const [x] = st.picks.splice(i, 1); st.picks.splice(to, 0, x); draw(); if (kbd) root.querySelectorAll('.grip')[to]?.focus({ preventScroll: true }); };
        const rows = p.map((s, i) => {
          const grip = h('button', { class: 'grip', html: gripIc, 'aria-label': `Move ${NAMES[s]}, number ${i + 1}. Use the arrow keys.` });
          grip.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { e.preventDefault(); move(i, i - 1, true); } if (e.key === 'ArrowDown') { e.preventDefault(); move(i, i + 1, true); } });
          grip.addEventListener('pointerdown', (e) => dragRow(e, i, move));
          return h('div', { class: 'rank' + (i === 0 ? ' first' : ''), 'data-style': s },
            h('div', { class: 'art' }, outfit(s, 0, 40), outfit(s, 1, 40), h('span', { class: 'disc' }, String(i + 1))),
            h('div', { class: 'tx' }, h('b', {}, NAMES[s]), h('span', {}, LINES[s])),
            h('button', { class: 'x', 'aria-label': `Remove ${NAMES[s]}`, html: xIc, onclick: () => { tap(); save(); st.picks.splice(i, 1); draw(); } }),
            grip);
        });
        const add = p.length < 3 ? h('button', { class: 'addrow', onclick: () => { tap(); save(); st.sheet = true; draw(); } }, h('span', { html: plusIc, 'aria-hidden': 'true' }), 'Add a look') : null;
        const finishWords = () => { tap(); save(); st.words = st.words.trim(); st.editing = false; draw(); };
        let words;
        if (st.editing) {
          const input = h('input', { class: 'field', type: 'text', maxlength: '80', placeholder: 'Like skater, or all black', 'aria-label': 'Your style in your words', value: st.words });
          input.addEventListener('input', (e) => { st.words = e.target.value; const c = root.querySelector('.dock .btn:not(.sec)'); if (c) c.disabled = !canGo(); });
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finishWords(); });
          setTimeout(() => input.focus({ preventScroll: true }), 0);
          words = h('div', { class: 'words' }, h('div', { class: 'wrow' }, input, h('button', { class: 'wdone', onclick: finishWords }, 'Done')));
        } else if (st.words) {
          words = h('div', { class: 'words' }, h('div', { class: 'saved' }, 'In your words: ', h('b', {}, `\u201c${st.words}\u201d`)),
            h('button', { class: 'linkbtn', onclick: () => { tap(); st.editing = true; draw(); } }, 'Edit'));
        } else {
          words = h('div', { class: 'words' }, h('button', { class: 'linkbtn', onclick: () => { tap(); st.editing = true; draw(); } }, 'Not quite you? Tell me in your words'));
        }
        const head = p.length ? title('Here\u2019s your style', `From your ${st.rounds.length + st.swipes.length} picks.${p.length > 1 ? ' Drag to change the order.' : ''} You can change it anytime in You.`)
          : noneLiked ? title('Nothing clicked yet', 'Play again, or tell me in your words.')
          : title('Here\u2019s your style', 'Add a look, or tell me in your words.');
        const f = frame([head, h('div', { class: 'ranks' }, rows, add), words],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('div', { class: 'yn' },
            h('button', { class: 'btn sec', onclick: () => { tap(); save(); go(() => { st.swipes = []; st.rounds = []; st.picks = []; st.dSeed = 0; st.view = 'swipe'; }); } }, 'Play again'),
            h('button', { class: 'btn', disabled: !canGo(), onclick: () => { tap(); save(); go(() => (st.ended = true)); } }, 'Continue'))]);
        if (st.sheet) {
          const close = () => { tap(); st.sheet = false; draw(); };
          const left = ORDER.filter((s) => !p.includes(s));
          const tiles = left.map((s) => h('button', { class: 'tile', onclick: () => { tap(); save(); st.picks.push(s); st.sheet = false; draw(); }, 'aria-label': `${NAMES[s]}: ${LINES[s]}` },
            h('div', { class: 'art' }, outfit(s, 0, 73), outfit(s, 1, 73)),
            h('div', { class: 'nm' }, h('span', {}, NAMES[s])),
            h('div', { class: 'ln' }, LINES[s])));
          f.push(h('div', { class: 'sheet-bg', onclick: close }),
            h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Add a look' }, h('span', { class: 'grab' }),
              h('div', { class: 'hd' }, h('b', {}, 'Add a look'), h('button', { class: 'txt', onclick: close }, 'Close')),
              h('div', { class: 'sheet-body' }, h('div', { class: 'grid' }, tiles))));
        }
        return f;
      },
      trio() {
        const r = st.rounds.length;
        const set = trioNext(st);
        const card = (s) => h('button', { class: 'pick' + (st.chosen === s ? ' chosen' : st.chosen ? ' faded' : ''), onclick: () => choose(s, set), 'data-style': s, 'aria-label': `Outfit ${set.indexOf(s) + 1}` },
          h('div', { class: 'art' }, outfit(s, r === 2 && s !== 'classic_prep' ? 1 : 0, 92)));
        return frame([title('Which is more you?', 'Tap one. 3 quick picks.'), h('div', { class: 'trio' }, set.map(card)), dots(3, r)],
          [h('div', { class: 'note', 'aria-live': 'polite' }, st.note), h('button', { class: 'txt', onclick: () => choose(null, set) }, 'None of these')]);
      },
      reveal() {
        const p = st.picks;
        if (!p.length) {
          return frame([title('Nothing clicked yet', 'Pick from the full list, or tell me in your words.')],
            [h('button', { class: 'btn', onclick: () => { tap(); save(); go(() => (st.view = 'grid')); } }, 'See all looks')]);
        }
        const rows = p.map((s, i) => h('div', { class: 'rank' + (i === 0 ? ' first' : '') },
          h('div', { class: 'art' }, outfit(s, 0, 40), outfit(s, 1, 40)),
          h('div', { class: 'tx' }, h('b', {}, NAMES[s]), h('span', {}, LINES[s])),
          h('span', { class: 'disc' }, String(i + 1))));
        const nPicks = st.rounds.length + st.swipes.length;
        return frame([title('Here’s your style', `From your ${nPicks} picks. You can change it anytime in You.`), h('div', { class: 'ranks' }, rows)],
          [h('button', { class: 'txt', onclick: () => { tap(); save(); go(() => (st.view = 'grid')); } }, 'Change picks'),
           h('button', { class: 'btn', onclick: () => { tap(); save(); go(() => (st.ended = true)); } }, 'Continue')]);
      },
    };
    function draw() {
      const sc = root.querySelector('.scroll'); const y = sc && root.dataset.view === st.view ? sc.scrollTop : 0;
      root.replaceChildren(...views[st.view]());
      root.dataset.view = st.view;
      const sc2 = root.querySelector('.scroll'); if (sc2) sc2.scrollTop = y;
    }
    reset();
    return { reset, draw };
  }

  const phones = {};
  document.querySelectorAll('.phone').forEach((el) => (phones[el.dataset.dir] = Phone(el, el.dataset.dir)));
  document.querySelectorAll('[data-restart]').forEach((b) => b.addEventListener('click', () => phones[b.dataset.restart].reset()));

  // Fit each 402 × 874 phone into its column.
  const fit = () => document.querySelectorAll('.phone-wrap').forEach((w) => {
    const s = Math.min(1, (w.clientWidth - 18) / 402) || 1;
    const p = w.firstElementChild; p.style.transform = `translate(9px, 9px) scale(${s})`; w.style.height = `${874 * s + 18}px`;
  });
  new ResizeObserver(fit).observe(document.querySelector('.row'));
  fit();

  // Theme control
  const setTheme = (t) => {
    theme = t;
    if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('[data-th]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.th === t)));
    Object.values(phones).forEach((p) => p.draw());
  };
  document.querySelectorAll('[data-th]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.th)));
  darkMq.addEventListener('change', () => theme === 'system' && Object.values(phones).forEach((p) => p.draw()));

  // Tabs (narrow screens show one phone at a time)
  const showTab = (k) => {
    document.querySelectorAll('figure[data-fig]').forEach((f) => f.classList.toggle('on', f.dataset.fig === k));
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === k)));
    fit();
    if (['a', 'b', 'c', 'd'].includes(k)) { try { history.replaceState(null, '', '#' + k); } catch (e) { /* fine */ } }
  };
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  const fromHash = location.hash.slice(1);
  showTab(['a', 'b', 'c', 'd'].includes(fromHash) ? fromHash : 'a');
  window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (['a', 'b', 'c', 'd'].includes(k)) showTab(k); });
