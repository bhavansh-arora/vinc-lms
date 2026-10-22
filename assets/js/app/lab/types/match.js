// VINC Lab · lab type "match": connect pairs with ropes. Drag from a card's peg (either column) to a card
// in the other column: a springy rope with a slight sag follows the pointer. A right pair tightens the
// rope, ties a knot and throws a confetti puff; a wrong one flashes red and snaps back. Tap a card,
// then a card in the other column, to connect without dragging (keyboard too). Config: SPEC.md §2.3.
import { esc, shuffle } from '../kit.js';
import { t } from '../../../i18n.js';

export const meta = { title: 'Make the match', needs: ['gsap'] };

const COLORS = ['teal', 'rust', 'plum', 'olive', 'amber'];
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

export function mount(stage, cfg, api) {
  const { gsap, Draggable } = api;
  const R = api.reduced;
  const pairs = (cfg.pairs || []).map((p, k) => ({ ...p, k, color: COLORS[k % COLORS.length] }));
  const n = pairs.length;
  let right = pairs.map(p => p.k);
  for (let t = 0; t < 20 && n > 1; t++) { right = shuffle(right, Date.now() + t * 104729); if (right.some((k, i) => k !== i)) break; }
  const timers = [], drags = [], ropes = new Set();
  const later = (fn, ms) => { const t = setTimeout(fn, R ? Math.min(ms, 40) : ms); timers.push(t); return t; };
  let matched = 0, sel = null, drag = null, finished = false;

  const card = (item, side, k, row) => `
    <button type="button" class="mt-card mt-${side}" data-k="${k}" style="grid-row:${row + 2};--c:var(--${pairs[k].color})">
      ${side === 'b' ? '<span class="mt-peg" aria-hidden="true"></span>' : ''}
      ${(item.sprite || item.emoji) ? `<span class="mt-art">${api.art(item)}</span>` : ''}
      <span class="mt-label">${esc(item.label)}</span>
      ${side === 'a' ? '<span class="mt-peg" aria-hidden="true"></span>' : ''}
    </button>`;
  const root = document.createElement('div');
  root.className = 'lab-match';
  root.innerHTML = `
    <div class="mt-board">
      <h3 class="mt-head mt-head-a">${esc(cfg.leftTitle || t('Match'))}</h3>
      <h3 class="mt-head mt-head-b">${esc(cfg.rightTitle || t('with'))}</h3>
      ${pairs.map((p, i) => card(p.a, 'a', p.k, i)).join('')}
      ${right.map((k, i) => card(pairs[k].b, 'b', k, i)).join('')}
      <div class="mt-gap" style="grid-row:2 / span ${n}" aria-hidden="true"></div>
      <svg class="mt-ropes" aria-hidden="true"><g class="mt-rope-layer"></g><g class="mt-knot-layer"></g></svg>
    </div>
    <p class="mt-tip">${t('Drag from a card to its partner, or tap one card and then its partner.')}</p>`;
  stage.append(root);
  const board = root.querySelector('.mt-board'), svg = root.querySelector('.mt-ropes');
  const ropeLayer = svg.querySelector('.mt-rope-layer'), knotLayer = svg.querySelector('.mt-knot-layer');
  const cardsA = [...root.querySelectorAll('.mt-a')], cardsB = [...root.querySelectorAll('.mt-b')];
  const all = [...cardsA, ...cardsB];
  const side = el => (el.classList.contains('mt-a') ? 'a' : 'b');
  const pairOf = el => pairs[+el.dataset.k];
  const labelOf = el => pairOf(el)[side(el)].label;
  all.forEach(el => el.setAttribute('aria-label', `${labelOf(el)}${side(el) === 'a' ? ` (${cfg.leftTitle || t('left')})` : ` (${cfg.rightTitle || t('right')})`}`));
  api.progress(0);

  /* ---------- Geometry ---------- */
  const bbox = () => board.getBoundingClientRect();
  function peg(el) {
    const b = bbox(), r = el.querySelector('.mt-peg').getBoundingClientRect();
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
  }
  const toBoard = (cx, cy) => { const b = bbox(); return { x: cx - b.left, y: cy - b.top }; };

  /* ---------- Ropes: quadratic curves whose control point hangs on a spring ---------- */
  function makeRope(color) {
    const g = svgEl('g', { class: 'mt-rope' });
    g.style.setProperty('--c', `var(--${color})`);
    const base = svgEl('path', { class: 'mt-rope-base' }), main = svgEl('path', { class: 'mt-rope-main' }), twist = svgEl('path', { class: 'mt-rope-twist' });
    const nub = svgEl('circle', { class: 'mt-rope-nub', r: 6 }), ring = svgEl('circle', { class: 'mt-rope-end', r: 7 });
    g.append(base, main, twist, nub, ring);
    ropeLayer.append(g);
    const rope = { g, sx: 0, sy: 0, ex: 0, ey: 0, cx: 0, cy: 0, vx: 0, vy: 0, taut: false, color,
      draw() {
        const d = `M${rope.sx} ${rope.sy}Q${rope.cx} ${rope.cy} ${rope.ex} ${rope.ey}`;
        base.setAttribute('d', d); main.setAttribute('d', d); twist.setAttribute('d', d);
        nub.setAttribute('cx', rope.sx); nub.setAttribute('cy', rope.sy);
        ring.setAttribute('cx', rope.ex); ring.setAttribute('cy', rope.ey);
      },
      setColor(c) { rope.color = c; g.style.setProperty('--c', `var(--${c})`); },
      remove() { ropes.delete(rope); g.remove(); },
    };
    ropes.add(rope);
    return rope;
  }
  function target(r) {
    const dist = Math.hypot(r.ex - r.sx, r.ey - r.sy);
    const sag = r.taut ? 14 + dist * .12 : Math.min(130, 26 + dist * .3);
    return { x: (r.sx + r.ex) / 2, y: (r.sy + r.ey) / 2 + sag };
  }
  function tick() {
    for (const r of ropes) {
      const t = target(r);
      if (R) { r.cx = t.x; r.cy = t.y; r.draw(); continue; }
      r.vx = (r.vx + (t.x - r.cx) * .12) * .82;
      r.vy = (r.vy + (t.y - r.cy) * .12) * .82;
      r.cx += r.vx; r.cy += r.vy;
      r.draw();
    }
  }
  gsap.ticker.add(tick);

  function startRope(el) {
    const p = peg(el);
    const r = makeRope(side(el) === 'a' ? pairOf(el).color : 'amber');
    Object.assign(r, { sx: p.x, sy: p.y, ex: p.x, ey: p.y, cx: p.x, cy: p.y + 10 });
    r.draw();
    return r;
  }
  function retract(r, bad) {
    if (bad) r.g.classList.add('is-bad');
    const s = { x: r.ex, y: r.ey };
    gsap.to(s, { x: r.sx, y: r.sy, duration: R ? .05 : .38, delay: bad ? .28 : 0, ease: 'power3.in',
      onUpdate: () => { r.ex = s.x; r.ey = s.y; }, onComplete: () => gsap.to(r.g, { opacity: 0, duration: .15, onComplete: () => r.remove() }) });
  }
  function moveEnd(r, to, dur = .28, done) {
    const s = { x: r.ex, y: r.ey };
    gsap.to(s, { x: to.x, y: to.y, duration: R ? .05 : dur, ease: 'back.out(1.4)', onUpdate: () => { r.ex = s.x; r.ey = s.y; }, onComplete: done });
  }

  /* ---------- Dragging (an invisible proxy is dragged; the card is the trigger) ---------- */
  const isFree = el => !el.classList.contains('is-matched');
  const candidateAt = (cx, cy, from) => {
    const hit = document.elementFromPoint(cx, cy)?.closest?.('.mt-card');
    if (hit && root.contains(hit) && side(hit) !== side(from) && isFree(hit)) return hit;
    return null;
  };
  function setOver(el) {
    if (!drag || drag.over === el) return;
    drag.over?.classList.remove('is-target');
    drag.over = el;
    if (el) { el.classList.add('is-target'); api.sound('tick'); }
  }
  all.forEach(el => {
    const proxy = document.createElement('div');
    proxy.className = 'mt-proxy';
    board.append(proxy);
    const [d] = Draggable.create(proxy, {
      type: 'x,y', trigger: el, dragClickables: true, minimumMovement: 5, autoScroll: 1, cursor: 'grab', activeCursor: 'grabbing',
      onDragStart() {
        if (!isFree(el) || finished) return;
        if (sel) deselect();
        drag = { from: el, rope: startRope(el), over: null };
        el.classList.add('is-active');
        api.sound('click');
        pulsePeg(el);
      },
      onDrag() {
        if (!drag) return;
        const cx = this.pointerX - window.scrollX, cy = this.pointerY - window.scrollY;
        const over = candidateAt(cx, cy, drag.from);
        setOver(over);
        const p = over ? peg(over) : toBoard(cx, cy);
        drag.rope.ex = p.x; drag.rope.ey = p.y;
      },
      onDragEnd() {
        gsap.set(proxy, { x: 0, y: 0 });
        if (!drag) return;
        const { from, rope, over } = drag;
        setOver(null); drag = null;
        from.classList.remove('is-active');
        if (over) attempt(from, over, rope);
        else { retract(rope); api.sound('whoosh'); }
      },
      onClick() { tap(el); },
    });
    drags.push(d);
    el._drag = d;
    el.addEventListener('click', e => { if (e.detail === 0) tap(el); });
  });

  /* ---------- Tap / keyboard ---------- */
  function tap(el) {
    if (finished) return;
    if (!isFree(el)) { api.sound('tick'); api.say(t('“{label}” is already tied to its partner.', { label: labelOf(el) }), 'info'); return; }
    if (sel && sel.el === el) { deselect(); api.sound('click'); return; }
    if (sel && side(sel.el) !== side(el)) {
      const { el: from, rope } = sel;
      from.classList.remove('is-selected'); from.removeAttribute('aria-pressed');
      sel = null;
      rope.g.classList.remove('is-dangling');
      api.sound('whoosh');
      moveEnd(rope, peg(el), .32, () => attempt(from, el, rope));
      return;
    }
    if (sel) deselect();
    const rope = startRope(el);
    rope.g.classList.add('is-dangling');
    const p = peg(el), dir = side(el) === 'a' ? 1 : -1;
    moveEnd(rope, { x: p.x + dir * 34, y: p.y + 54 }, .5);
    sel = { el, rope };
    el.classList.add('is-selected'); el.setAttribute('aria-pressed', 'true');
    api.sound('pop');
    pulsePeg(el);
    api.say(t('Now tap the partner for “{label}”.', { label: labelOf(el) }), 'info');
  }
  function deselect() {
    if (!sel) return;
    sel.el.classList.remove('is-selected'); sel.el.removeAttribute('aria-pressed');
    retract(sel.rope);
    sel = null;
  }
  const onKey = e => { if (e.key === 'Escape' && sel) { e.preventDefault(); e.stopPropagation(); deselect(); } };
  root.addEventListener('keydown', onKey);
  function pulsePeg(el) { if (!R) gsap.fromTo(el.querySelector('.mt-peg'), { scale: 1.6 }, { scale: 1, duration: .45, ease: 'back.out(3)' }); }

  /* ---------- Judge a connection ---------- */
  const knots = [];
  function attempt(from, to, rope) {
    const a = side(from) === 'a' ? from : to, b = a === from ? to : from;
    if (a.dataset.k === b.dataset.k) tie(a, b, from, to, rope);
    else miss(a, b, to, rope);
  }

  function tie(a, b, from, to, rope) {
    const p = pairOf(a);
    matched++;
    rope.setColor(p.color);
    rope.taut = true;
    rope.g.classList.add('is-tied');
    rope.ends = [from, to];
    const end = peg(to);
    rope.ex = end.x; rope.ey = end.y;
    rope.vy -= 14; // a little twang as it tightens
    [a, b].forEach(el => { el.classList.add('is-matched'); el.style.setProperty('--c', `var(--${p.color})`); el._drag.disable(); el.setAttribute('aria-label', t('{label}: matched', { label: labelOf(el) })); });
    const knot = makeKnot(end, p.color);
    knots.push({ el: knot, card: to });
    puff(end, p.color);
    if (!R) {
      [a, b].forEach(el => gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: .14, yoyo: true, repeat: 1, ease: 'power2.out' }));
    }
    api.sound('pop');
    api.progress(matched / n);
    const msg = p.why || `${p.a.label} — ${p.b.label}.`;
    api.say(`${t(matched === n ? 'All tied up!' : ['Tied!', 'A perfect match!', 'Yes!', 'Knotted!'][matched % 4])} ${msg}`, 'good');
    if (matched === n) finish();
  }

  function miss(a, b, to, rope) {
    api.mistake();
    rope.setColor('rust');
    retract(rope, true);
    [a, b].forEach(el => { el.classList.add('is-wrong'); later(() => el.classList.remove('is-wrong'), 800); });
    if (!R) gsap.fromTo(to, { x: 0 }, { x: 0, duration: .45, ease: 'none', keyframes: { x: [0, -9, 8, -5, 3, 0] } });
    api.sound('bad');
    api.say(t('“{a}” and “{b}” don’t go together. Think again and try another one!', { a: pairOf(a).a.label, b: pairOf(b).b.label }), 'hint');
  }

  function makeKnot(p, color) {
    const g = svgEl('g', { class: 'mt-knot' });
    g.style.setProperty('--c', `var(--${color})`);
    g.innerHTML = `
      <path class="mt-knot-tail" d="M2 6q7 9 1 19"/><path class="mt-knot-tail" d="M-3 6q-8 8-3 17"/>
      <circle class="mt-knot-ball" r="10"/>
      <path class="mt-knot-loop" d="M-7-1C-13-12 5-15 5-4C5 5-9 7-7-1"/>
      <circle class="mt-knot-shine" cx="-3" cy="-4" r="2.6"/>`;
    knotLayer.append(g);
    gsap.set(g, { x: p.x, y: p.y });
    if (!R) {
      gsap.from(g.querySelector('.mt-knot-ball'), { scale: 0, rotation: -120, transformOrigin: '50% 50%', duration: .6, ease: 'elastic.out(1.2, .45)' });
      gsap.from(g.querySelector('.mt-knot-loop'), { drawSVG: '0%', duration: .45, ease: 'power2.inOut', delay: .1 });
      gsap.from(g.querySelectorAll('.mt-knot-tail'), { drawSVG: '0%', duration: .35, ease: 'power2.out', delay: .3, stagger: .08 });
    }
    return g;
  }

  function puff(p, color) {
    if (R) return;
    const cs = getComputedStyle(board);
    const cols = [cs.getPropertyValue(`--${color}`).trim() || '#D98A1C', '#F0B44C', '#FFFFFF', cs.getPropertyValue('--lf').trim() || '#4C7424'];
    for (let i = 0; i < 18; i++) {
      const c = document.createElement('i');
      c.className = i % 3 ? 'mt-conf' : 'mt-conf is-dot';
      c.style.left = `${p.x}px`; c.style.top = `${p.y}px`;
      c.style.background = cols[i % cols.length];
      board.append(c);
      gsap.to(c, { physics2D: { velocity: 140 + Math.random() * 200, angle: -90 + (Math.random() - .5) * 150, gravity: 520 }, rotation: (Math.random() - .5) * 720, opacity: 0, duration: .9 + Math.random() * .5, ease: 'power1.in', onComplete: () => c.remove() });
    }
  }

  function finish() {
    finished = true;
    root.classList.add('is-done');
    root.querySelector('.mt-tip').textContent = t('Every pair is tied together!');
    const list = [...ropes].filter(r => r.taut);
    list.forEach((r, i) => later(() => { r.vy += 26; api.sound('tick'); }, 450 + i * 140));
    if (!R) gsap.to(all, { y: -6, duration: .18, stagger: { each: .05, yoyo: true, repeat: 1 }, delay: .45, ease: 'power2.out' });
    later(() => api.complete({ message: cfg.win || t(api.mistakes ? 'You matched all {n} pairs. Knowing what goes with what is half the skill!' : 'You matched all {n} pairs without a single slip. Knowing what goes with what is half the skill!', { n }) }), 900 + list.length * 140);
  }

  /* ---------- Keep ropes attached when the layout changes ---------- */
  const relayout = () => {
    for (const r of ropes) {
      if (r.ends) { const s = peg(r.ends[0]), e = peg(r.ends[1]); Object.assign(r, { sx: s.x, sy: s.y, ex: e.x, ey: e.y }); }
      else if (sel && sel.rope === r) { const s = peg(sel.el); r.sx = s.x; r.sy = s.y; }
    }
    knots.forEach(k => { const p = peg(k.card); gsap.set(k.el, { x: p.x, y: p.y }); });
  };
  const ro = new ResizeObserver(relayout);
  ro.observe(board);
  if (!R) {
    gsap.from(cardsA, { x: -40, opacity: 0, duration: .5, ease: 'back.out(1.6)', stagger: .06, delay: .15, clearProps: 'opacity,transform' });
    gsap.from(cardsB, { x: 40, opacity: 0, duration: .5, ease: 'back.out(1.6)', stagger: .06, delay: .25, clearProps: 'opacity,transform' });
    gsap.fromTo(cardsA.map(c => c.querySelector('.mt-peg')), { scale: 1 }, { scale: 1.45, duration: .22, yoyo: true, repeat: 1, stagger: .08, delay: 1, ease: 'power2.out' });
  }

  return {
    destroy() {
      gsap.ticker.remove(tick);
      timers.forEach(clearTimeout);
      drags.forEach(d => d.kill());
      ro.disconnect();
      root.removeEventListener('keydown', onKey);
      gsap.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

export const demo = {
  title: 'Garden tool kit',
  mission: 'Before we start digging the school garden, learn the tools. Tie each tool to the job it does best.',
  fact: 'A good trowel, hand fork and watering can are enough to start a small kitchen garden on a school terrace or balcony.',
  win: 'You know your garden tools! Using the right tool makes the work faster, safer and kinder to the plants.',
  leftTitle: 'Tool',
  rightTitle: 'What it is for',
  pairs: [
    { a: { label: 'Trowel', sprite: 'trowel' }, b: { label: 'Digging small holes for seedlings' }, why: 'A trowel’s small, pointed blade digs neat holes without hurting nearby roots.' },
    { a: { label: 'Hand fork', sprite: 'hand-fork' }, b: { label: 'Loosening soil and pulling out weeds' }, why: 'The prongs break up hard soil and lift weeds out, roots and all.' },
    { a: { label: 'Watering can', sprite: 'watering-can' }, b: { label: 'Giving plants a gentle shower' }, why: 'The rose (the holey spout) breaks water into soft drops that do not wash soil away.' },
    { a: { label: 'Shears', sprite: 'shears' }, b: { label: 'Trimming bushes and hedges' }, why: 'Long, sharp blades cut many thin stems in one clean snip.' },
    { a: { label: 'Rake', sprite: 'rake' }, b: { label: 'Gathering dry leaves and levelling soil' }, why: 'The wide row of teeth collects leaves for compost and smooths the bed.' },
    { a: { label: 'Gloves', sprite: 'gloves' }, b: { label: 'Keeping hands safe from thorns and dirt' }, why: 'Gloves protect your skin from cuts, thorns and germs in the soil.' },
  ],
};
