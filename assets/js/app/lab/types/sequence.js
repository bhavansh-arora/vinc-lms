// VINC Lab · lab type "sequence": put the steps of a process in order. Shuffled cards sit in numbered
// slots on a conveyor belt; drag a card onto another slot to swap them (cards tilt as they move), or tap
// two cards to swap (arrow keys move a focused card). "Check" clicks correct cards into place; when
// every step is right, a glowing runner travels the belt and each step lights up in turn.
// Config: SPEC.md §2.2.
import { esc, shuffle, sparkle } from '../kit.js';

export const meta = { title: 'Step by step', needs: ['gsap'] };

const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GRIP = '<svg viewBox="0 0 12 20" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="4" r="1.6"/><circle cx="9" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="9" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/><circle cx="9" cy="16" r="1.6"/></g></svg>';

export function mount(stage, cfg, api) {
  const { gsap, Draggable } = api;
  const R = api.reduced;
  const steps = (cfg.steps || []).map((s, i) => ({ ...s, i }));
  const n = steps.length;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // shuffle so that at most a quarter of the steps start in the right place (and never all of them)
  let order = steps.map(s => s.i);
  for (let t = 0; t < 40; t++) {
    order = shuffle(order, Date.now() + t * 7919);
    if (order.filter((s, p) => s === p).length <= Math.floor(n / 4)) break;
  }
  const locked = new Array(n).fill(false);
  let selected = null, lastChecked = '', busy = false, finished = false, checks = 0;
  const timers = [], drags = [];
  const later = (fn, ms) => { const t = setTimeout(fn, R ? Math.min(ms, 40) : ms); timers.push(t); return t; };

  const root = document.createElement('div');
  root.className = 'lab-sequence';
  root.innerHTML = `
    <div class="seq-board">
      <svg class="seq-belt" aria-hidden="true">
        <path class="seq-belt-bed"/><path class="seq-belt-roll"/><path class="seq-belt-lit"/>
        <g class="seq-runner"><circle r="15" class="seq-runner-halo"/><circle r="8" class="seq-runner-dot"/></g>
      </svg>
      <ol class="seq-slots" aria-label="Steps in order">${order.map((_, p) => `
        <li class="seq-slot" data-pos="${p}"><span class="seq-num" aria-hidden="true">${p + 1}</span><div class="seq-socket"></div></li>`).join('')}
      </ol>
    </div>
    <div class="seq-bar">
      <p class="seq-status" aria-live="polite"></p>
      <button type="button" class="lab-act seq-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Check my order</button>
    </div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const board = $('.seq-board'), list = $('.seq-slots'), belt = $('.seq-belt');
  const bed = $('.seq-belt-bed'), roll = $('.seq-belt-roll'), lit = $('.seq-belt-lit'), runner = $('.seq-runner');
  const slots = [...root.querySelectorAll('.seq-slot')];
  const sockets = slots.map(s => s.querySelector('.seq-socket'));
  const status = $('.seq-status'), checkBtn = $('.seq-check');

  const cards = steps.map(s => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'seq-card';
    el.dataset.step = s.i;
    el.innerHTML = `<span class="seq-grip" aria-hidden="true">${GRIP}</span>${(s.sprite || s.emoji) ? `<span class="seq-art">${api.art(s)}</span>` : ''}<span class="seq-text">${esc(s.label)}</span><span class="seq-lock" aria-hidden="true">${LOCK}</span>`;
    return el;
  });
  order.forEach((s, p) => sockets[p].append(cards[s]));
  const posOf = el => order.indexOf(+el.dataset.step);
  const label = el => { const p = posOf(el); return `Slot ${p + 1}: ${steps[+el.dataset.step].label}${locked[p] ? ' (locked in)' : ''}`; };
  const relabel = () => cards.forEach(c => c.setAttribute('aria-label', label(c)));
  relabel();
  const setStatus = () => {
    const k = locked.filter(Boolean).length;
    status.innerHTML = `<b>${k}</b> of ${n} locked in${k < n ? ' · <span>drag or tap two cards to swap them</span>' : ''}`;
  };
  setStatus();
  api.progress(0);

  /* ---------- Layout: balanced columns + the conveyor path through the slots ---------- */
  let cols = 1, anchors = [], segLen = [], totalLen = 0;
  function layout() {
    const w = board.clientWidth;
    const max = w < 520 ? 1 : Math.max(1, Math.min(n, Math.floor((w + 18) / 196)));
    const rows = Math.ceil(n / max);
    cols = Math.ceil(n / rows);
    list.style.setProperty('--cols', cols);
    root.classList.toggle('is-list', cols === 1);
    requestAnimationFrame(drawPath);
  }
  function drawPath() {
    if (!root.isConnected) return;
    const b = board.getBoundingClientRect();
    belt.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    belt.setAttribute('width', b.width); belt.setAttribute('height', b.height);
    anchors = slots.map(s => {
      const r = s.getBoundingClientRect();
      if (cols === 1) { const nr = s.querySelector('.seq-num').getBoundingClientRect(); return { x: nr.left + nr.width / 2 - b.left, y: r.top + r.height / 2 - b.top, top: r.top - b.top, bottom: r.bottom - b.top }; }
      return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top, top: r.top - b.top, bottom: r.bottom - b.top };
    });
    if (!anchors.length) return;
    const rr = 18;
    let d = `M${anchors[0].x} ${anchors[0].y}`;
    const parts = [d];
    for (let k = 1; k < anchors.length; k++) {
      const a = anchors[k - 1], c = anchors[k];
      if (Math.abs(a.y - c.y) < 4 || cols === 1) d += ` L${c.x} ${c.y}`;
      else {
        // drop into the gap between the rows, run back along it, then rise into the next slot
        const gy = (a.bottom + c.top) / 2, dir = c.x < a.x ? -1 : 1;
        d += ` L${a.x} ${gy - rr} Q${a.x} ${gy} ${a.x + dir * rr} ${gy} L${c.x - dir * rr} ${gy} Q${c.x} ${gy} ${c.x} ${gy + rr} L${c.x} ${c.y}`;
      }
      parts.push(d);
    }
    [bed, roll, lit].forEach(p => p.setAttribute('d', d));
    // cumulative lengths to each anchor (for the walkthrough runner)
    const probe = document.createElementNS(SVGNS, 'path');
    belt.append(probe);
    segLen = parts.map(pd => { probe.setAttribute('d', pd); return probe.getTotalLength(); });
    probe.remove();
    totalLen = segLen[segLen.length - 1] || 1;
    if (!finished) gsap.set(lit, { drawSVG: '0% 0%' });
    gsap.set(runner, { x: anchors[0].x, y: anchors[0].y });
  }
  gsap.set(runner, { opacity: 0, scale: 0 });
  const ro = new ResizeObserver(() => layout());
  ro.observe(board);
  layout();
  if (!R) {
    gsap.to(roll, { strokeDashoffset: -28, duration: .9, ease: 'none', repeat: -1 });
    gsap.from(cards, { y: -50, rotation: () => (Math.random() - .5) * 30, opacity: 0, scale: .7, duration: .6, ease: 'back.out(1.6)', stagger: .07, delay: .2, clearProps: 'opacity' });
  }

  /* ---------- Moving cards ---------- */
  function flip(el, before, opts = {}) {
    const after = el.getBoundingClientRect();
    gsap.fromTo(el, { x: before.left - after.left, y: before.top - after.top, rotation: opts.rot ?? 0 },
      { x: 0, y: 0, rotation: 0, scale: 1, duration: R ? .05 : .5, ease: opts.ease || 'power3.out', delay: opts.delay || 0, onComplete: opts.done });
  }
  function swap(pa, pb, dragged) {
    const a = cards[order[pa]], b = cards[order[pb]];
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const rot = gsap.getProperty(a, 'rotation');
    gsap.killTweensOf([a, b], 'x,y,rotation');
    gsap.set([a, b], { x: 0, y: 0, rotation: 0 });
    sockets[pb].append(a); sockets[pa].append(b);
    [order[pa], order[pb]] = [order[pb], order[pa]];
    flip(a, ra, { rot, ease: dragged ? 'back.out(2)' : 'power3.inOut' });
    flip(b, rb, { ease: 'back.out(1.4)', delay: dragged ? 0 : .04 });
    if (!R) {
      gsap.fromTo(a, { scale: 1.06 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .5)', delay: .3 });
      later(() => { sparkleSmall(sockets[pb]); }, 380);
    }
    api.sound('drop');
    relabel();
  }
  function sparkleSmall(el) { if (!R) gsap.fromTo(el, { '--flash': 1 }, { '--flash': 0, duration: .6, ease: 'power2.out' }); }

  // Drag
  const slotAt = (x, y) => slots.findIndex((s, p) => { if (locked[p]) return false; const r = s.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; });
  let target = -1;
  const setTarget = p => {
    if (p === target) return;
    if (target >= 0) { slots[target].classList.remove('is-target'); gsap.to(cards[order[target]], { scale: 1, duration: .2 }); }
    target = p;
    if (p >= 0) { slots[p].classList.add('is-target'); gsap.to(cards[order[p]], { scale: .92, duration: .2 }); api.sound('tick'); }
  };
  cards.forEach(el => {
    const tilt = gsap.quickTo(el, 'rotation', { duration: .35, ease: 'power3.out' });
    let lastX = 0;
    const [d] = Draggable.create(el, {
      type: 'x,y', dragClickables: true, zIndexBoost: true, minimumMovement: 6, autoScroll: 1,
      onDragStart() {
        deselect();
        lastX = this.x;
        el.classList.add('is-drag');
        gsap.to(el, { scale: 1.07, duration: .2, ease: 'back.out(3)' });
        api.sound('click');
      },
      onDrag() {
        tilt(Math.max(-14, Math.min(14, (this.x - lastX) * 1.4)));
        lastX = this.x;
        const p = slotAt(this.pointerX - window.scrollX, this.pointerY - window.scrollY);
        setTarget(p === posOf(el) ? -1 : p);
      },
      onDragEnd() {
        el.classList.remove('is-drag');
        const p = target; setTarget(-1);
        if (p >= 0 && !busy && !locked[posOf(el)]) swap(posOf(el), p, true);
        else { tilt(0); gsap.to(el, { x: 0, y: 0, scale: 1, rotation: 0, duration: .5, ease: 'back.out(1.6)' }); }
      },
      onClick() { tap(el); },
    });
    drags.push(d);
    el.addEventListener('click', e => { if (e.detail === 0 || el.classList.contains('is-locked')) tap(el); });
    el.addEventListener('keydown', e => {
      const p = posOf(el);
      const dir = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key];
      if (dir) {
        e.preventDefault();
        if (busy || locked[p]) return;
        let q = p + dir;
        while (q >= 0 && q < n && locked[q]) q += dir;
        if (q < 0 || q >= n) { api.sound('tick'); return; }
        deselect(); swap(p, q, false); el.focus();
      } else if (e.key === 'Escape' && selected) { e.preventDefault(); e.stopPropagation(); deselect(); }
    });
  });

  // Tap two cards to swap them
  function tap(el) {
    if (busy || finished) return;
    const p = posOf(el);
    if (locked[p]) { api.sound('tick'); api.say(`Step ${p + 1} is already locked in. Move the others around it.`, 'hint'); bump(el); return; }
    if (!selected) {
      selected = el; el.classList.add('is-selected'); el.setAttribute('aria-pressed', 'true');
      gsap.to(el, { y: -6, scale: 1.04, duration: .3, ease: 'back.out(3)' });
      api.sound('pop');
      api.say('Now tap the card you want to swap it with.', 'info');
      return;
    }
    if (selected === el) { deselect(); api.sound('click'); return; }
    const a = selected; deselect(true);
    swap(posOf(a), p, false);
  }
  function deselect(quiet) {
    if (!selected) return;
    const el = selected; selected = null;
    el.classList.remove('is-selected'); el.removeAttribute('aria-pressed');
    if (!quiet) gsap.to(el, { y: 0, scale: 1, duration: .25 });
  }
  function bump(el) { if (!R) gsap.fromTo(el, { x: 0 }, { x: 0, duration: .4, keyframes: { x: [0, -6, 5, -3, 0] } }); }

  /* ---------- Check ---------- */
  checkBtn.addEventListener('click', () => {
    if (busy || finished) return;
    deselect();
    const sig = order.join(',');
    const fresh = [];
    order.forEach((s, p) => { if (s === p && !locked[p]) fresh.push(p); });
    const wrong = order.map((s, p) => (s === p ? -1 : p)).filter(p => p >= 0);
    checks++;
    busy = true;
    fresh.forEach((p, k) => later(() => lockIn(p), 120 + k * 170));
    later(() => {
      busy = false;
      setStatus();
      api.progress(locked.filter(Boolean).length / n * .85);
      if (!wrong.length) { walkthrough(); return; }
      wrong.forEach(p => { bump(cards[order[p]]); slots[p].classList.add('is-wrong'); later(() => slots[p].classList.remove('is-wrong'), 900); });
      if (sig !== lastChecked) api.mistake();
      lastChecked = sig;
      const first = wrong[0];
      const hint = first === 0 ? 'Which step has to happen first of all?' : `Which step comes straight after “${steps[first - 1].label}”?`;
      if (fresh.length) api.say(`${fresh.length} more locked in! ${wrong.length} still out of place. ${hint}`, 'hint');
      else { api.sound('bad'); api.say(`${wrong.length} steps are still out of place. ${hint}`, 'hint'); }
    }, 160 + fresh.length * 170);
    api.sound('click');
  });

  function lockIn(p) {
    locked[p] = true;
    const el = cards[order[p]];
    el.classList.add('is-locked'); slots[p].classList.add('is-locked');
    drags[order[p]].disable();
    api.sound('drop');
    if (!R) {
      gsap.timeline()
        .to(el, { y: -10, scale: 1.05, duration: .12, ease: 'power2.out' })
        .to(el, { y: 0, scaleY: .9, scaleX: 1.04, duration: .08, ease: 'power3.in' })
        .to(el, { scale: 1, scaleX: 1, scaleY: 1, duration: .6, ease: 'elastic.out(1.1, .4)' });
      gsap.fromTo(el.querySelector('.seq-lock'), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(3)', delay: .12 });
      gsap.fromTo(slots[p].querySelector('.seq-num'), { scale: 1.5 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    }
    later(() => api.sound('click'), 110);
    relabel();
  }

  /* ---------- Walkthrough: a runner travels the belt; each step lights up ---------- */
  function walkthrough() {
    finished = true; busy = true;
    checkBtn.disabled = true;
    root.classList.add('is-done');
    api.progress(.9);
    status.innerHTML = '<b>Perfect order!</b> Watch the whole process…';
    api.say(checks === 1 ? 'All in order on the first try! Let’s walk through it.' : 'All in order! Let’s walk through it step by step.', 'good');
    const per = R ? .25 : 1.25;
    const tl = gsap.timeline({ delay: R ? .1 : .7, onComplete: end });
    tl.to(runner, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' });
    for (let k = 0; k < n; k++) {
      if (k > 0) {
        tl.to(runner, { motionPath: { path: bed, start: segLen[k - 1] / totalLen, end: segLen[k] / totalLen }, duration: per * .45, ease: 'power1.inOut' })
          .to(lit, { drawSVG: `0% ${segLen[k] / totalLen * 100}%`, duration: per * .45, ease: 'power1.inOut' }, '<');
      }
      tl.add(() => lightUp(k));
      tl.to({}, { duration: per * .55 });
    }
    tl.to(runner, { scale: 2.2, opacity: 0, duration: .4, ease: 'power2.out' });
  }
  function lightUp(k) {
    const el = cards[order[k]];
    cards.forEach(c => c.classList.remove('is-lit'));
    el.classList.add('is-lit');
    slots[k].classList.add('is-visited');
    api.sound('tick');
    const s = steps[k];
    api.say(`Step ${k + 1}: ${s.label}${s.detail ? ` — ${s.detail}` : ''}`, 'info');
    if (!R) {
      gsap.fromTo(el, { scale: 1 }, { scale: 1.08, duration: .2, yoyo: true, repeat: 1, ease: 'power2.out' });
      sparkle(api, slots[k].querySelector('.seq-num'));
    }
    if (cols === 1) el.scrollIntoView?.({ block: 'nearest', behavior: R ? 'auto' : 'smooth' });
    api.progress(.9 + .1 * (k + 1) / n);
  }
  function end() {
    cards.forEach(c => c.classList.remove('is-lit'));
    root.classList.add('is-finale');
    if (!R) gsap.to(cards, { y: -12, duration: .2, ease: 'power2.out', stagger: { each: .06, yoyo: true, repeat: 1 } });
    later(() => api.complete({ message: cfg.win || `You put all ${n} steps in order${checks === 1 ? ' on your very first check' : ''}. Doing things in the right order is what makes a process work!` }), 500);
  }

  return {
    destroy() {
      timers.forEach(clearTimeout);
      drags.forEach(d => d.kill());
      ro.disconnect();
      gsap.killTweensOf([roll, lit, runner, ...cards]);
    },
  };
}

export const demo = {
  title: 'Build a compost pit',
  mission: 'Our class is starting a compost pit in the school garden. Put the steps in the right order, then press “Check my order”.',
  fact: 'A well-made compost pit turns kitchen and garden waste into dark, crumbly compost in about two to three months.',
  win: 'Your compost pit is ready! In a few weeks the worms and microbes will turn the waste into rich, dark compost for the garden.',
  steps: [
    { label: 'Choose a shady spot and dig a pit about 1 metre deep', sprite: 'spade', detail: 'Shade stops the pit from drying out too fast.' },
    { label: 'Spread a layer of dry leaves and twigs at the bottom', sprite: 'dry-leaves', detail: 'Twigs and leaves let air flow and extra water drain.' },
    { label: 'Add a layer of kitchen and garden waste', sprite: 'kitchen-waste', detail: 'Peels and plant scraps are the food for the compost.' },
    { label: 'Sprinkle a thin layer of soil or cow dung', sprite: 'cow-dung', detail: 'This adds the microbes that break the waste down.' },
    { label: 'Sprinkle water to keep the layers damp', sprite: 'watering-can', detail: 'Damp like a squeezed sponge, never soggy.' },
    { label: 'Cover the pit with a jute sack or leaves', sprite: 'mulch', detail: 'The cover keeps in heat and moisture and keeps pests away.' },
    { label: 'Turn the mix with a fork every two weeks', sprite: 'hand-fork', detail: 'Turning lets in air so the microbes keep working.' },
  ],
};
