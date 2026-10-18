// VINC Lab · lab type "sort": drag items from a tray into real-looking containers (bins, baskets,
// crates, cardboard boxes). Lids and flaps react on hover, bins gulp items in with a squash, items
// float gently in the tray and a combo counter rewards streaks. Tap an item, then a bin, to sort
// without dragging (works with the keyboard too). Config: SPEC.md §2.1.
import { esc, shuffle, sparkle } from '../kit.js';

export const meta = { title: 'Sort it out', needs: ['gsap'] };

const COLORS = ['olive', 'teal', 'rust', 'plum', 'amber'];
const SHAPES = ['bin', 'basket', 'crate', 'box'];

/** Pick a container shape: cfg `shape`, else a guess from the bin's id/label, else cycle. */
function shapeFor(bin, i) {
  if (SHAPES.includes(bin.shape)) return bin.shape;
  const s = `${bin.id} ${bin.label}`.toLowerCase();
  if (/\b(bin|dustbin|waste|trash|garbage|compost|recycl\w*|hazard\w*)\b/.test(s)) return 'bin';
  if (/basket|fruit|vegetable|harvest|kitchen|eat/.test(s)) return 'basket';
  if (/crate|wood|tool|metal|market|sell/.test(s)) return 'crate';
  if (/box|carton|paper|cardboard|store|pack|keep|save/.test(s)) return 'box';
  return SHAPES[i % SHAPES.length];
}

/* ---------- Container drawings (viewBox 0 0 200 200). back = behind the pile, front = in front. ---------- */
function defs(id, body) {
  return `<defs>
    <linearGradient id="${id}-sh" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
    <linearGradient id="${id}-v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
    <clipPath id="${id}-clip"><path d="${body}"/></clipPath>
  </defs>`;
}
const SHADOW = '<ellipse cx="100" cy="191" rx="70" ry="7" fill="#000" opacity=".16"/>';

const DRAW = {
  bin(id) {
    const body = 'M40 78H160L151 180Q150 188 142 188H58Q50 188 49 180Z';
    return {
      back: `${defs(id, body)}${SHADOW}<path d="M38 70H162L159 86H41Z" class="srt-c-dd"/>`,
      front: `
        <path d="${body}" class="srt-c"/><path d="${body}" fill="url(#${id}-sh)"/>
        <g stroke="#fff" stroke-opacity=".22" stroke-width="7" stroke-linecap="round"><path d="M71 100L74 168M100 100V170M129 100L126 168"/></g>
        <path d="M52 176H148" stroke="#000" stroke-opacity=".12" stroke-width="4" stroke-linecap="round"/>
        <rect x="32" y="70" width="136" height="14" rx="7" class="srt-c-d"/>
        <rect x="38" y="72" width="124" height="3.5" rx="1.75" fill="#fff" opacity=".3"/>
        <circle cx="60" cy="187" r="10" fill="#2E2A26"/><circle cx="60" cy="187" r="4" fill="#9A9088"/>
        <circle cx="140" cy="187" r="10" fill="#2E2A26"/><circle cx="140" cy="187" r="4" fill="#9A9088"/>
        <g class="srt-lid">
          <path d="M28 72Q28 52 50 50H150Q172 52 172 72Z" class="srt-c-d"/><path d="M28 72Q28 52 50 50H150Q172 52 172 72Z" fill="url(#${id}-v)"/>
          <path d="M44 59Q58 55 96 55" stroke="#fff" stroke-opacity=".4" stroke-width="4" stroke-linecap="round" fill="none"/>
          <rect x="82" y="41" width="36" height="11" rx="5.5" class="srt-c-dd"/>
        </g>`,
      pile: [21, 20, 58, 23], emblem: 63,
    };
  },
  basket(id) {
    const body = 'M36 86Q100 106 164 86L151 174Q148 188 134 188H66Q52 188 49 174Z';
    let weave = '';
    for (let r = 0, y = 92; y < 190; r++, y += 15) {
      for (let x = 22 + (r % 2) * 11; x < 178; x += 22) weave += `<rect x="${x}" y="${y}" width="18" height="10" rx="5"/>`;
    }
    return {
      back: `${defs(id, body)}${SHADOW}
        <g class="srt-lid"><path d="M44 88C40 14 160 14 156 88" fill="none" stroke="#8E6230" stroke-width="11" stroke-linecap="round"/>
        <path d="M44 88C40 14 160 14 156 88" fill="none" stroke="#E3BE7F" stroke-width="3" stroke-dasharray="8 6" stroke-linecap="round"/></g>
        <ellipse cx="100" cy="87" rx="64" ry="14" fill="#5E3E1C"/>`,
      front: `
        <path d="${body}" fill="#C99A55"/>
        <g clip-path="url(#${id}-clip)"><g fill="#E8C68A" opacity=".75">${weave}</g>
          <path d="M40 120Q100 138 160 120L158 140Q100 158 42 140Z" class="srt-c"/>
          <path d="M41 123Q100 141 159 123" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" fill="none"/></g>
        <path d="${body}" fill="url(#${id}-sh)"/>
        <path d="M34 86Q100 108 166 86" stroke="#8E6230" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M34 86Q100 108 166 86" stroke="#E3BE7F" stroke-width="3.5" fill="none" stroke-dasharray="9 6" stroke-linecap="round"/>`,
      pile: [22, 22, 56, 22], emblem: 66,
    };
  },
  crate(id) {
    const body = 'M24 74H176V190H24Z';
    const slat = y => `<rect x="28" y="${y}" width="144" height="32" rx="5" fill="#C98B4E"/>
      <rect x="32" y="${y + 2}" width="136" height="4" rx="2" fill="#fff" opacity=".22"/>
      <path d="M44 ${y + 12}h46M104 ${y + 22}h52M60 ${y + 25}h22" stroke="#7A4A22" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`;
    return {
      back: `${defs(id, body)}${SHADOW}<rect x="28" y="56" width="144" height="11" rx="3" fill="#A86B35"/><path d="M30 64H170L166 80H34Z" fill="#4A2E16"/>`,
      front: `
        <rect x="28" y="76" width="144" height="110" rx="6" fill="#4A2E16"/>
        ${slat(78)}${slat(114)}${slat(150)}
        <rect x="44" y="118" width="112" height="24" rx="4" class="srt-c" opacity=".92"/>
        <rect x="22" y="70" width="20" height="120" rx="5" fill="#A86B35"/><rect x="158" y="70" width="20" height="120" rx="5" fill="#A86B35"/>
        <rect x="25" y="72" width="5" height="114" rx="2.5" fill="#fff" opacity=".2"/><rect x="161" y="72" width="5" height="114" rx="2.5" fill="#fff" opacity=".2"/>
        <g fill="#5A3A1E">${[94, 130, 166].map(y => `<circle cx="32" cy="${y}" r="2.6"/><circle cx="168" cy="${y}" r="2.6"/>`).join('')}</g>
        <path d="${body}" fill="url(#${id}-sh)"/>`,
      pile: [20, 15, 60, 25], emblem: 65,
    };
  },
  box(id) {
    const body = 'M32 80H168V188H32Z';
    return {
      back: `${defs(id, body)}${SHADOW}<path d="M38 80L48 46H152L162 80Z" fill="#A9733D"/><path d="M48 46H152L150 52H50Z" fill="#fff" opacity=".18"/><rect x="34" y="72" width="132" height="13" fill="#4F321A"/>`,
      front: `
        <rect x="32" y="80" width="136" height="108" rx="5" fill="#C8955A"/>
        <rect x="32" y="80" width="136" height="7" fill="#000" opacity=".13"/>
        <rect x="88" y="80" width="24" height="46" class="srt-c" opacity=".9"/><rect x="88" y="80" width="5" height="46" fill="#fff" opacity=".25"/>
        <g stroke="#7A5530" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55"><path d="M48 108V94M43 99l5-5 5 5M58 108V94M53 99l5-5 5 5"/></g>
        <path d="M44 176h26" stroke="#7A5530" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>
        <rect x="32" y="80" width="136" height="108" rx="5" fill="url(#${id}-sh)"/>
        <g class="srt-flap-l"><path d="M32 80L96 80L86 52L24 58Z" fill="#D9AC74"/><path d="M32 80L96 80L86 52L24 58Z" fill="url(#${id}-v)"/><path d="M30 64L88 58" stroke="#B07A42" stroke-width="2" opacity=".5"/></g>
        <g class="srt-flap-r"><path d="M168 80L104 80L114 52L176 58Z" fill="#CE9F66"/><path d="M168 80L104 80L114 52L176 58Z" fill="url(#${id}-v)"/><path d="M170 64L112 58" stroke="#B07A42" stroke-width="2" opacity=".5"/></g>`,
      pile: [21, 17, 58, 26], emblem: 70,
    };
  },
};

export function mount(stage, cfg, api) {
  const { gsap, Draggable } = api;
  const R = api.reduced;
  const uid = 'srt' + Math.random().toString(36).slice(2, 7);
  const bins = (cfg.bins || []).map((b, i) => ({ ...b, i, shape: shapeFor(b, i), color: COLORS.includes(b.color) ? b.color : COLORS[i % COLORS.length] }));
  const binById = Object.fromEntries(bins.map(b => [b.id, b]));
  const items = shuffle((cfg.items || []).map((it, i) => ({ ...it, i })));
  const total = items.length;
  let sorted = 0, streak = 0, best = 0, picked = null, finished = false;
  const timers = [], drags = [], floats = new Map(), counts = {};
  const later = (fn, ms) => { const t = setTimeout(fn, R ? Math.min(ms, 60) : ms); timers.push(t); return t; };

  const root = document.createElement('div');
  root.className = 'lab-sort';
  root.innerHTML = `
    <section class="srt-tray" aria-label="Items to sort">
      <header class="srt-head">
        <h3 class="srt-title">Sort these <span class="srt-left" aria-live="polite"></span></h3>
        <div class="srt-combo" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z"/></svg><span>Combo <b>×2</b></span></div>
      </header>
      <ul class="srt-items" role="list">${items.map(it => `
        <li class="srt-slot"><button class="srt-item" type="button" data-i="${it.i}" aria-label="${esc(it.label)}: pick up to sort">
          <span class="srt-float"><span class="srt-art">${api.art(it)}</span><span class="srt-name">${esc(it.label)}</span></span>
        </button></li>`).join('')}
      </ul>
      <div class="srt-done" hidden><b>All sorted!</b></div>
      <p class="srt-tip">Drag each item into the right container, or tap an item and then tap a container.</p>
    </section>
    <section class="srt-bins" style="--n:${bins.length}" aria-label="Containers">${bins.map(b => {
      const d = DRAW[b.shape](`${uid}-${b.i}`);
      const emb = (b.sprite || b.emoji) ? `<span class="srt-emb" style="top:${d.emblem}%">${api.art(b)}</span>` : '';
      const [pl, pt, pw, ph] = d.pile;
      return `<button class="srt-bin" type="button" data-bin="${esc(b.id)}" data-shape="${b.shape}" style="--bin:var(--${b.color});--bin-soft:var(--${b.color}-soft)" aria-label="${esc(b.label)}">
        <span class="srt-glow" aria-hidden="true"></span>
        <span class="srt-bin-art" aria-hidden="true"><span class="srt-bin-body">
          <svg class="srt-back" viewBox="0 0 200 200">${d.back}</svg>
          <span class="srt-pile" style="left:${pl}%;top:${pt}%;width:${pw}%;height:${ph}%"></span>
          <svg class="srt-front" viewBox="0 0 200 200">${d.front}</svg>
          ${emb}
        </span><span class="srt-count" hidden>0</span></span>
        <span class="srt-bin-label">${esc(b.label)}</span>
      </button>`;
    }).join('')}
    </section>`;
  stage.append(root);

  const $ = s => root.querySelector(s);
  const leftEl = $('.srt-left'), combo = $('.srt-combo'), list = $('.srt-items');
  const binEls = [...root.querySelectorAll('.srt-bin')];
  bins.forEach((b, i) => { b.el = binEls[i]; b.art = b.el.querySelector('.srt-bin-art'); b.body = b.el.querySelector('.srt-bin-body'); b.pile = b.el.querySelector('.srt-pile'); counts[b.id] = 0; });
  const itemEls = [...root.querySelectorAll('.srt-item')];
  const itemOf = el => items.find(it => it.i === +el.dataset.i);
  const updateLeft = () => { const n = total - sorted; leftEl.textContent = n ? `· ${n} left` : ''; };
  updateLeft();
  api.progress(0);

  /* ---------- Container moods: -1 slam shut, 0 rest, 1 peek, 2 wide open ---------- */
  function mood(b, level) {
    const art = b.body, dur = level === -1 ? .12 : .32, ease = level === -1 ? 'power3.in' : 'back.out(2.2)';
    gsap.to(art, { scale: [1, 1, 1.04, 1.08][level + 1], y: [0, 0, -2, -5][level + 1], duration: .35, ease: 'back.out(2)', overwrite: 'auto' });
    if (b.shape === 'bin') gsap.to(art.querySelector('.srt-lid'), { rotation: [0, 0, -24, -52][level + 1], svgOrigin: '28 72', duration: dur, ease, overwrite: 'auto' });
    if (b.shape === 'box') {
      const a = [30, 8, -14, -34][level + 1];
      gsap.to(art.querySelector('.srt-flap-l'), { rotation: a, svgOrigin: '32 80', duration: dur, ease, overwrite: 'auto' });
      gsap.to(art.querySelector('.srt-flap-r'), { rotation: -a, svgOrigin: '168 80', duration: dur, ease, overwrite: 'auto' });
    }
    if (b.shape === 'basket') gsap.to(art.querySelector('.srt-lid'), { y: [4, 0, -5, -12][level + 1], duration: dur, ease, overwrite: 'auto' });
    b.el.classList.toggle('is-open', level === 2);
  }
  bins.forEach(b => {
    if (b.shape === 'box') { gsap.set(b.art.querySelector('.srt-flap-l'), { rotation: 8, svgOrigin: '32 80' }); gsap.set(b.art.querySelector('.srt-flap-r'), { rotation: -8, svgOrigin: '168 80' }); }
  });
  const restLevel = () => (picked ? 1 : 0);
  let hoverBin = null;
  function setHover(b) {
    if (b === hoverBin) return;
    if (hoverBin) { hoverBin.el.classList.remove('is-over'); mood(hoverBin, restLevel()); }
    hoverBin = b;
    if (b) { b.el.classList.add('is-over'); mood(b, 2); api.sound('tick'); }
  }

  /* ---------- Gentle floating in the tray ---------- */
  function startFloat(el) {
    if (R) return;
    const f = el.querySelector('.srt-float');
    floats.set(el, gsap.to(f, { y: -4 - Math.random() * 4, rotation: (Math.random() - .5) * 4, duration: 1.4 + Math.random() * 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: Math.random() * 1.2 }));
  }
  function stopFloat(el) { floats.get(el)?.kill(); floats.delete(el); gsap.to(el.querySelector('.srt-float'), { y: 0, rotation: 0, duration: .2 }); }

  if (!R) gsap.from(itemEls, { y: -40, scale: .4, opacity: 0, duration: .55, ease: 'back.out(1.8)', stagger: .05, delay: .15, clearProps: 'opacity' });
  if (!R) gsap.from(bins.map(b => b.art), { y: 40, opacity: 0, duration: .6, ease: 'back.out(1.6)', stagger: .1, delay: .25, clearProps: 'opacity' });
  itemEls.forEach(el => later(() => el.isConnected && !el.classList.contains('is-gone') && startFloat(el), 900));

  /* ---------- Picking (tap / keyboard) ---------- */
  function pick(el) {
    if (finished || el.classList.contains('is-gone')) return;
    if (picked === el) { unpick(); api.sound('click'); return; }
    unpick(true);
    picked = el;
    el.classList.add('is-picked');
    el.setAttribute('aria-pressed', 'true');
    gsap.to(el, { scale: 1.08, duration: .3, ease: 'back.out(3)' });
    api.sound('pop');
    bins.forEach((b, i) => { mood(b, 1); if (!R) gsap.fromTo(b.art, { rotation: 0 }, { rotation: 0, duration: .5, delay: i * .06, keyframes: { rotation: [0, -4, 3, 0] } }); });
    api.say(`Where does “${itemOf(el).label}” go? Tap its container.`, 'info');
  }
  function unpick(silent) {
    if (!picked) return;
    const el = picked; picked = null;
    el.classList.remove('is-picked'); el.removeAttribute('aria-pressed');
    if (!el.classList.contains('is-gone')) gsap.to(el, { scale: 1, duration: .25 });
    if (!silent) bins.forEach(b => mood(b, 0));
  }

  /* ---------- Dragging ---------- */
  const pointInBin = (x, y) => bins.find(b => { const r = b.el.getBoundingClientRect(); return x > r.left - 14 && x < r.right + 14 && y > r.top - 24 && y < r.bottom + 10; });
  const overlapBin = el => {
    const a = el.getBoundingClientRect(); let bestB = null, bestA = 0;
    for (const b of bins) {
      const r = b.art.getBoundingClientRect();
      const ov = Math.max(0, Math.min(a.right, r.right) - Math.max(a.left, r.left)) * Math.max(0, Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top));
      if (ov > bestA) { bestA = ov; bestB = b; }
    }
    return bestA > a.width * a.height * .3 ? bestB : null;
  };
  itemEls.forEach(el => {
    const tilt = gsap.quickTo(el, 'rotation', { duration: .3, ease: 'power3.out' });
    let lastX = 0;
    const [d] = Draggable.create(el, {
      type: 'x,y', dragClickables: true, zIndexBoost: true, minimumMovement: 6, autoScroll: 1,
      onDragStart() {
        if (picked && picked !== el) unpick(true);
        if (picked === el) { picked = null; el.classList.remove('is-picked'); el.removeAttribute('aria-pressed'); }
        stopFloat(el); lastX = this.x;
        el.classList.add('is-drag');
        gsap.to(el, { scale: 1.12, duration: .2, ease: 'back.out(3)' });
        api.sound('click');
      },
      onDrag() {
        tilt(Math.max(-16, Math.min(16, (this.x - lastX) * 1.6))); lastX = this.x;
        const px = this.pointerX - window.scrollX, py = this.pointerY - window.scrollY;
        setHover(pointInBin(px, py) || overlapBin(el));
      },
      onDragEnd() {
        el.classList.remove('is-drag');
        tilt(0);
        const b = hoverBin;
        setHover(null);
        if (b) tryDrop(el, b, true);
        else {
          gsap.to(el, { x: 0, y: 0, scale: 1, rotation: 0, duration: .55, ease: 'back.out(1.5)', onComplete: () => startFloat(el) });
          bins.forEach(bb => mood(bb, 0));
        }
      },
      onClick() { pick(el); },
    });
    drags.push(d);
    // keyboard / assistive-tech activation (pointer taps are handled by Draggable's onClick)
    el.addEventListener('click', e => { if (e.detail === 0) pick(el); });
  });

  binEls.forEach((el, i) => {
    const b = bins[i];
    el.addEventListener('click', () => {
      if (finished) return;
      if (!picked) {
        api.sound('click');
        if (!R) gsap.fromTo(b.art, { rotation: 0 }, { rotation: 0, duration: .5, keyframes: { rotation: [0, -5, 4, 0] } });
        api.say(`First pick an item from the tray, then tap “${b.label}”.`, 'hint');
        return;
      }
      const it = picked; unpick(true); bins.forEach(bb => { if (bb !== b) mood(bb, 0); }); tryDrop(it, b, false);
    });
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !hoverBin && !finished) mood(b, picked ? 2 : 1); });
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hoverBin !== b && !finished) mood(b, restLevel()); });
  });
  const onKey = e => { if (e.key === 'Escape' && picked) { e.stopPropagation(); e.preventDefault(); unpick(); } };
  root.addEventListener('keydown', onKey);

  /* ---------- Drop logic ---------- */
  function tryDrop(el, b, dragged) {
    const it = itemOf(el);
    if (it.bin === b.id) gulp(el, it, b, dragged);
    else reject(el, it, b, dragged);
  }

  function gulp(el, it, b, dragged) {
    el.classList.add('is-gone');
    el.disabled = true;
    drags[itemEls.indexOf(el)]?.disable();
    stopFloat(el);
    sorted++; streak++; best = Math.max(best, streak);
    counts[b.id]++;
    updateLeft();
    api.progress(sorted / total);
    const art = b.art.getBoundingClientRect(), r = el.getBoundingClientRect();
    const mx = art.left + art.width / 2, my = art.top + art.height * .36;
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
    const x0 = gsap.getProperty(el, 'x'), y0 = gsap.getProperty(el, 'y');
    mood(b, 2);
    const tl = gsap.timeline({ onComplete: () => land(el, it, b) });
    if (dragged) tl.to(el, { x: x0 + dx, y: y0 + dy - 26, scale: .62, rotation: dx > 0 ? 12 : -12, duration: .22, ease: 'power2.out' });
    else tl.to(el, { motionPath: { path: [{ x: x0, y: y0 }, { x: x0 + dx * .5, y: y0 + Math.min(dy, 0) - 110 }, { x: x0 + dx, y: y0 + dy - 26 }], curviness: 1.25 }, scale: .62, rotation: dx > 0 ? 200 : -200, duration: R ? .2 : .6, ease: 'power1.inOut' });
    tl.to(el, { y: `+=${art.height * .2}`, scale: .2, opacity: 0, rotation: '+=20', duration: .18, ease: 'power2.in' });
    api.sound('whoosh');
  }

  function land(el, it, b) {
    // the slot collapses and the rest of the tray slides together (FLIP)
    const slot = el.closest('.srt-slot');
    const others = [...list.children].filter(s => s !== slot);
    const before = others.map(s => s.getBoundingClientRect());
    slot.remove();
    others.forEach((s, k) => { const a = s.getBoundingClientRect(); const ddx = before[k].left - a.left, ddy = before[k].top - a.top; if (ddx || ddy) gsap.fromTo(s, { x: ddx, y: ddy }, { x: 0, y: 0, duration: .45, ease: 'power3.out' }); });

    // squash, lid claps shut, pile grows
    gsap.timeline()
      .to(b.art, { scaleY: .8, scaleX: 1.14, transformOrigin: '50% 100%', duration: .09, ease: 'power2.out' })
      .to(b.art, { scaleY: 1, scaleX: 1, duration: .7, ease: 'elastic.out(1.1, .35)' });
    mood(b, -1);
    later(() => mood(b, picked ? 1 : 0), 160);
    api.sound('pop');
    addToPile(b, it);
    const c = b.el.querySelector('.srt-count');
    c.hidden = false; c.textContent = counts[b.id];
    if (!R) gsap.fromTo(c, { scale: 1.8 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    sparkle(api, b.pile, ['#F0B44C', '#FFFFFF', getComputedStyle(b.el).getPropertyValue('--bin').trim() || '#4C7424', '#4C7424']);
    showCombo();
    const why = it.why ? ` ${it.why}` : ` ${it.label} belongs in ${b.label}.`;
    const cheer = streak >= 5 ? `On fire! ${streak} in a row!` : streak >= 3 ? `Combo ×${streak}!` : ['Yes!', 'Right!', 'Spot on!', 'Correct!'][sorted % 4];
    api.say(`${cheer}${why}`, 'good');
    if (sorted === total) finish();
  }

  function addToPile(b, it) {
    const p = document.createElement('span');
    p.className = 'srt-pile-i';
    p.innerHTML = api.art(it);
    const n = b.pile.children.length;
    p.style.left = `${8 + ((n * 37) % 64)}%`;
    p.style.bottom = `${(n % 3) * 9}%`;
    b.pile.append(p);
    const rot = ((n * 53) % 50) - 25;
    gsap.fromTo(p, { y: -60, scale: .3, rotation: rot * 3, opacity: 0 }, { y: 0, scale: 1, rotation: rot, opacity: 1, duration: R ? .1 : .6, ease: 'bounce.out' });
    while (b.pile.children.length > 6) b.pile.firstElementChild.remove();
  }

  function reject(el, it, b, dragged) {
    api.mistake();
    streak = 0; showCombo();
    mood(b, -1);
    later(() => mood(b, 0), 260);
    if (!R) gsap.fromTo(b.art, { rotation: 0 }, { rotation: 0, duration: .5, ease: 'none', keyframes: { rotation: [0, -7, 6, -4, 2, 0] }, transformOrigin: '50% 100%' });
    b.el.classList.add('is-wrong'); el.classList.add('is-wrong');
    later(() => { b.el.classList.remove('is-wrong'); el.classList.remove('is-wrong'); }, 900);
    if (dragged) {
      gsap.to(el, { x: 0, y: 0, scale: 1, rotation: 0, duration: .7, ease: 'back.out(1.3)', onComplete: () => startFloat(el) });
    } else if (!R) {
      gsap.fromTo(el, { x: 0 }, { x: 0, duration: .45, ease: 'none', keyframes: { x: [0, -10, 9, -6, 4, 0] } });
    }
    api.sound('bad');
    api.say(`Not the ${b.label}. ${it.why || `Think: where does ${it.label} really belong?`}`, 'hint');
  }

  function showCombo() {
    if (streak >= 2) {
      combo.querySelector('b').textContent = `×${streak}`;
      const fresh = combo.hidden;
      combo.hidden = false;
      combo.classList.toggle('is-hot', streak >= 5);
      if (!R) gsap.fromTo(combo, { scale: fresh ? 0 : 1.5, rotation: fresh ? -20 : 8 }, { scale: 1, rotation: 0, duration: .55, ease: 'elastic.out(1, .45)' });
    } else if (!combo.hidden) {
      if (R) { combo.hidden = true; return; }
      gsap.to(combo, { y: 16, rotation: 25, opacity: 0, duration: .35, ease: 'power2.in', onComplete: () => { combo.hidden = true; gsap.set(combo, { clearProps: 'all' }); } });
    }
  }

  function finish() {
    finished = true;
    unpick(true);
    const done = $('.srt-done');
    done.hidden = false;
    $('.srt-tip').hidden = true;
    if (!R) gsap.from(done, { scale: .6, opacity: 0, duration: .5, ease: 'back.out(2)' });
    const tl = gsap.timeline({ delay: .5, onComplete: () => api.complete({ message: cfg.win || `All ${total} items are in the right place${best >= 3 ? `, with a best streak of ${best}` : ''}. Sorting at the source makes recycling and composting easy!` }) });
    bins.forEach((b, i) => {
      tl.add(() => { mood(b, 2); sparkle(api, b.art); api.sound('tick'); }, i * .18)
        .to(b.art, { y: -22, duration: .22, ease: 'power2.out' }, i * .18)
        .to(b.art, { y: 0, duration: .5, ease: 'bounce.out' }, i * .18 + .22)
        .add(() => mood(b, 0), i * .18 + .6);
    });
  }

  return {
    destroy() {
      timers.forEach(clearTimeout);
      drags.forEach(d => d.kill());
      floats.forEach(t => t.kill());
      root.removeEventListener('keydown', onKey);
      gsap.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

export const demo = {
  title: 'Waste sorting station',
  mission: 'Our school garden makes compost from wet waste. Sort the rubbish from today’s lunch break into the right containers so nothing harmful reaches the soil.',
  fact: 'About half of the waste from an Indian home is wet waste. Composting it at school can turn a whole term of peels and leaves into rich soil for the garden.',
  win: 'The compost pit gets only wet waste, the kabadiwala gets clean dry waste, and harmful waste is kept safely away. You are a sorting champion!',
  bins: [
    { id: 'wet', label: 'Wet waste (compost)', sprite: 'compost-bin', color: 'olive', shape: 'bin' },
    { id: 'dry', label: 'Dry waste (kabadiwala)', sprite: 'recycle', color: 'teal', shape: 'crate' },
    { id: 'hazard', label: 'Hazardous waste', sprite: 'battery', color: 'rust', shape: 'box' },
  ],
  items: [
    { label: 'Banana peel', sprite: 'banana', bin: 'wet', why: 'Peels rot quickly and feed the compost worms.' },
    { label: 'Dry leaves', sprite: 'dry-leaves', bin: 'wet', why: 'Leaves are plant matter. They add brown carbon to compost.' },
    { label: 'Egg shells', sprite: 'egg', bin: 'wet', why: 'Crushed shells add calcium to the compost.' },
    { label: 'Vegetable peels', sprite: 'carrot', bin: 'wet', why: 'Peels from the kitchen break down in a few weeks.' },
    { label: 'Used tea leaves', emoji: '🍵', bin: 'wet', why: 'Tea leaves are wet, natural waste. Worms love them!' },
    { label: 'Old newspaper', sprite: 'newspaper', bin: 'dry', why: 'Clean, dry paper is sold to the kabadiwala and made into new paper.' },
    { label: 'Plastic bottle', sprite: 'plastic-bottle', bin: 'dry', why: 'Plastic never rots. Rinse it and send it for recycling.' },
    { label: 'Cardboard', sprite: 'cardboard', bin: 'dry', why: 'Flattened cardboard is dry waste that can be recycled.' },
    { label: 'Glass jar', sprite: 'pickle-jar', bin: 'dry', why: 'Clean glass can be melted and recycled again and again.' },
    { label: 'Used battery', sprite: 'battery', bin: 'hazard', why: 'Batteries leak harmful metals. Keep them out of soil and water.' },
    { label: 'Broken CFL bulb', sprite: 'bulb', bin: 'hazard', why: 'CFL bulbs contain mercury, which is poisonous.' },
    { label: 'Old medicines', sprite: 'pill', bin: 'hazard', why: 'Expired medicines can poison soil and water. Hand them in safely.' },
  ],
};
