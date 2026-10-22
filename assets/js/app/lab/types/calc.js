// VINC Lab · calc — a picture problem with working.
// A drawn scene (garden bed, seed tray, market stall, buckets, animal, plank, shop shelf, recipe card,
// chalkboard) shows the givens; sliders change the scene live; the child types answers on a chunky
// number pad; right answers stamp in and the working writes itself on a chalkboard, line by line.
//
// Config (SPEC §2.7) plus optional extras:
//   givens[].role       force a scene role: 'length' | 'width' | 'total' | 'sprouted' | 'girth' | 'piece' | 'count' | 'volume' | 'serves'
//   questions[].key     name the answer so later questions can use it in their `answer` expression
//   questions[].why     a sentence shown with the working once the answer is right
//   working lines may use {key} (a value) and {=expr} (a calculation) so they stay true when sliders move
//   cfg.animal          'cow' | 'buffalo' | 'goat' | 'sheep' for the animal scene (else guessed from the givens)
import { h, esc, evalExpr, fmt, shake, pop, sparkle } from '../kit.js';
import { t } from '../../../i18n.js';

export const meta = { title: 'Picture maths', needs: ['gsap'] };

/* ---------------------------------------------------------------- helpers */
const PRE = new Set(['₹', 'Rs', 'Rs.', '$']);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function withUnit(v, unit) {
  const n = typeof v === 'number' ? fmt(v) : String(v);
  if (!unit) return n;
  if (PRE.has(unit)) return `${unit}${n}`;
  if (unit === '%') return `${n}%`;
  return `${n} ${unit}`;
}
// Hindi configs have Hindi units, so those count as lengths too.
const LEN = { mm: .1, cm: 1, m: 100, metre: 100, metres: 100, meter: 100, meters: 100, km: 1e5, in: 2.54, inch: 2.54, inches: 2.54, ft: 30.48, feet: 30.48, foot: 30.48,
  'मिमी': .1, 'मि.मी.': .1, 'सेमी': 1, 'से.मी.': 1, 'सेंटीमीटर': 1, 'मी': 100, 'मी.': 100, 'मीटर': 100, 'किमी': 1e5, 'कि.मी.': 1e5, 'किलोमीटर': 1e5, 'इंच': 2.54, 'फ़ुट': 30.48, 'फुट': 30.48 };
const isLen = it => !!it && (String(it.unit || '').toLowerCase() in LEN);
const toCm = it => (+it.value) * (LEN[String(it.unit || '').toLowerCase()] ?? 1);
function rng(seed) { let s = seed % 2147483647 || 7; return () => (s = s * 16807 % 2147483647) / 2147483647; }
function seededShuffle(n, seed) { const a = [...Array(n).keys()], r = rng(seed); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const trunc = (s, n) => (s = String(s ?? '')).length > n ? `${s.slice(0, n - 1)}…` : s;
const idsIn = expr => [...String(expr).matchAll(/[A-Za-z_]\w*/g)].map(m => m[0]);

const EMOJI = { seed: '🌱', seedling: '🌱', 'seed-packet': '🌱', tomato: '🍅', spinach: '🥬', lettuce: '🥬', cabbage: '🥬', carrot: '🥕', radish: '🥕', chilli: '🌶️', brinjal: '🍆', okra: '🫛', beans: '🫛', peas: '🫛', coriander: '🌿', mint: '🌿', onion: '🧅', potato: '🥔', garlic: '🧄', ginger: '🫚', mango: '🥭', apple: '🍎', banana: '🍌', orange: '🍊', lemon: '🍋', cucumber: '🥒', grapes: '🍇', coconut: '🥥', cow: '🐄', calf: '🐄', goat: '🐐', buffalo: '🐃', sheep: '🐑', hen: '🐔', egg: '🥚', 'milk-can': '🥛', fodder: '🌾', hay: '🌾', bucket: '🪣', mug: '☕', tap: '🚰', 'water-drop': '💧', 'rupee-note': '💵', coin: '🪙', 'price-tag': '🏷️', 'money-bag': '💰', 'wood-plank': '🪵', 'measuring-tape': '📏', ruler: '📏', saw: '🪚', sugar: '🧂', salt: '🧂', jaggery: '🟫', curd: '🥣', bowl: '🥣', spoon: '🥄', lemonade: '🍋', poha: '🍚', 'shopping-bag': '🛍️', 'product-box': '📦', soap: '🧼', notebook: '📓', pencil: '✏️', clock: '⏰', calendar: '📅' };

/** Sprite (or emoji) placed inside an SVG scene at x,y with size s. */
function svgArt(api, item, x, y, s, cls = '') {
  if (!item) return '';
  if (item.sprite && api.hasSprite(item.sprite)) {
    return api.sprite(item.sprite, { cls }).replace('<svg ', `<svg x="${x}" y="${y}" width="${s}" height="${s}" style="width:${s}px;height:${s}px" `);
  }
  const e = item.emoji || (item.sprite && EMOJI[item.sprite]);
  return e ? `<text class="${cls}" x="${x + s / 2}" y="${y + s / 2 + s * .04}" font-size="${s * .74}" text-anchor="middle" dominant-baseline="central">${esc(e)}</text>` : '';
}
function htmlArt(api, item) {
  if (!item) return '';
  if (item.sprite && api.hasSprite(item.sprite)) return api.sprite(item.sprite);
  const e = item.emoji || (item.sprite && EMOJI[item.sprite]);
  return e ? `<span class="lab-emoji" aria-hidden="true">${esc(e)}</span>` : '';
}

/** A rounded value label for scenes. */
function pill(x, y, text, { key = '', fill = '#FFF9EF', stroke = '#D98A1C', ink = '#2B1A10', fs = 17, cls = '' } = {}) {
  const w = Math.max(44, String(text).length * fs * .6 + 22), hh = fs + 14;
  return `<g class="c-pill ${cls}" ${key ? `data-key="${esc(key)}"` : ''} transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="c-pill-in"><rect x="${(-w / 2).toFixed(1)}" y="${-hh / 2}" width="${w.toFixed(1)}" height="${hh}" rx="${hh / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="800" fill="${ink}">${esc(text)}</text></g></g>`;
}
const cloud = (x, y, s = 1) => `<g class="c-cloud" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="8" rx="34" ry="11" fill="#fff"/><circle cx="-12" cy="2" r="12" fill="#fff"/><circle cx="6" cy="-3" r="15" fill="#fff"/><circle cx="21" cy="4" r="10" fill="#fff"/></g>`;
const sun = (x, y) => `<g class="c-sun"><circle cx="${x}" cy="${y}" r="34" fill="#FFE9A8" opacity=".45"/><circle cx="${x}" cy="${y}" r="21" fill="#F7C948"/><circle cx="${x - 6}" cy="${y - 6}" r="7" fill="#FFF3C4" opacity=".7"/></g>`;

/** Horizontal / vertical dimension arrows that draw themselves outward from the middle. */
function dimH(x1, x2, y, label, key, ext0) {
  const m = (x1 + x2) / 2;
  return `<g class="c-dim">
    <path class="c-ext" d="M${x1} ${ext0}V${y + 7}M${x2} ${ext0}V${y + 7}" stroke="#9A5B0A" stroke-width="1.5" stroke-dasharray="3 3" opacity=".7"/>
    <path class="c-dl" d="M${m} ${y}H${x1 + 2}" stroke="#D98A1C" stroke-width="3" stroke-linecap="round"/>
    <path class="c-dl" d="M${m} ${y}H${x2 - 2}" stroke="#D98A1C" stroke-width="3" stroke-linecap="round"/>
    <path class="c-ah" d="M${x1 + 10} ${y - 6}L${x1} ${y}L${x1 + 10} ${y + 6}" fill="none" stroke="#D98A1C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="c-ah" d="M${x2 - 10} ${y - 6}L${x2} ${y}L${x2 - 10} ${y + 6}" fill="none" stroke="#D98A1C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${pill(m, y, label, { key })}</g>`;
}
function dimV(x, y1, y2, label, key, ext0) {
  const m = (y1 + y2) / 2;
  return `<g class="c-dim">
    <path class="c-ext" d="M${ext0} ${y1}H${x + 7}M${ext0} ${y2}H${x + 7}" stroke="#9A5B0A" stroke-width="1.5" stroke-dasharray="3 3" opacity=".7"/>
    <path class="c-dl" d="M${x} ${m}V${y1 + 2}" stroke="#D98A1C" stroke-width="3" stroke-linecap="round"/>
    <path class="c-dl" d="M${x} ${m}V${y2 - 2}" stroke="#D98A1C" stroke-width="3" stroke-linecap="round"/>
    <path class="c-ah" d="M${x - 6} ${y1 + 10}L${x} ${y1}L${x + 6} ${y1 + 10}" fill="none" stroke="#D98A1C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="c-ah" d="M${x - 6} ${y2 - 10}L${x} ${y2}L${x + 6} ${y2 - 10}" fill="none" stroke="#D98A1C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${pill(x, m, label, { key })}</g>`;
}
function playDims(g, el, tl, at = 0) {
  el.querySelectorAll('.c-dim').forEach((d, i) => {
    const t = at + i * .45;
    tl.from(d.querySelectorAll('.c-ext'), { opacity: 0, duration: .25 }, t)
      .fromTo(d.querySelectorAll('.c-dl'), { drawSVG: '0%' }, { drawSVG: '100%', duration: .5, ease: 'power2.inOut' }, t + .05)
      .from(d.querySelectorAll('.c-ah'), { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: .25, ease: 'back.out(3)' }, t + .45)
      .from(d.querySelectorAll('.c-pill-in'), { scale: 0, transformOrigin: '50% 50%', duration: .45, ease: 'back.out(2.4)' }, t + .4);
  });
}

/* ---------------------------------------------------------------- scenes
   Each scene: (c) -> { svg, play(el, tl, first), cheer?(el), kick?(el, key) }
   c: { id, api, items, pick(re, test?), rest(), first } */
const SCENES = {
  'garden-bed'(c) {
    const { id } = c;
    const L = c.pick('length', /len|long|लंबाई|लम्बाई/i, isLen), Wd = c.pick('width', /wid|bread|wide|across|चौड़ाई/i, isLen);
    const lv = L ? toCm(L) : 400, wv = Wd ? toCm(Wd) : lv * .5;
    const k = Math.min(290 / lv, 100 / (wv * .62));
    const bw = clamp(lv * k, 60, 290), bh = clamp(wv * .62 * k, 26, 100);
    const cx = 214, x0 = cx - bw / 2, yb = 196, y0 = yb - bh;
    const rows = Math.max(1, Math.round(bh / 22)), cols = Math.max(2, Math.min(14, Math.round(bw / 26)));
    const r = rng(11);
    let soil = '', plants = '';
    for (let i = 0; i < rows; i++) {
      const y = y0 + (i + .5) * bh / rows;
      soil += `<path d="M${x0 + 8} ${y + 3}H${x0 + bw - 8}" stroke="#94643E" stroke-width="5" stroke-linecap="round" opacity=".55"/>`;
      for (let j = 0; j < cols; j++) {
        const x = x0 + (j + .5) * bw / cols, s = .8 + r() * .4;
        plants += `<g class="c-plant" transform="translate(${x.toFixed(1)} ${(y + 2).toFixed(1)}) scale(${s.toFixed(2)})"><path d="M0 0V-8" stroke="#3F7A22" stroke-width="2" stroke-linecap="round"/><ellipse cx="-4.5" cy="-9" rx="5" ry="2.6" transform="rotate(-28 -4.5 -9)" fill="#86C553"/><ellipse cx="4.5" cy="-10" rx="5" ry="2.6" transform="rotate(28 4.5 -10)" fill="#62A83A"/></g>`;
      }
    }
    for (let i = 0; i < 26; i++) soil += `<circle cx="${(x0 + 6 + r() * (bw - 12)).toFixed(1)}" cy="${(y0 + 4 + r() * (bh - 8)).toFixed(1)}" r="${(1 + r() * 1.6).toFixed(1)}" fill="${r() > .5 ? '#5A3820' : '#A87650'}" opacity=".7"/>`;
    let hedge = 'M0 118';
    for (let x = 0; x < 480; x += 32) hedge += ` q16 ${-18 - (x % 3) * 5} 32 0`;
    hedge += ' V132 H0Z';
    let tufts = '';
    for (let i = 0; i < 14; i++) { const x = r() * 470, y = 140 + r() * 130; if (x > x0 - 20 && x < x0 + bw + 70 && y > y0 - 10 && y < yb + 64) continue; tufts += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l-3-8M${x.toFixed(0)} ${y.toFixed(0)}l1-10M${x.toFixed(0)} ${y.toFixed(0)}l4-7" stroke="#5E9A34" stroke-width="2" stroke-linecap="round"/>`; }
    const can = c.api.hasSprite('watering-can') ? svgArt(c.api, { sprite: 'watering-can' }, 8, 196, 70) : '';
    const svg = `<defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD6EE"/><stop offset="1" stop-color="#E4F4EA"/></linearGradient>
      <linearGradient id="${id}lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9D46F"/><stop offset="1" stop-color="#77AC47"/></linearGradient>
      <linearGradient id="${id}soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B4126"/><stop offset="1" stop-color="#8A5934"/></linearGradient>
      <linearGradient id="${id}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D6A46B"/><stop offset="1" stop-color="#9E6A39"/></linearGradient></defs>
      <rect width="480" height="280" fill="url(#${id}sky)"/>${sun(428, 40)}${cloud(90, 36, .9)}${cloud(300, 24, .7)}
      <path d="${hedge}" fill="#5B9638"/><path d="${hedge}" fill="#4A8530" transform="translate(16 6)" opacity=".7"/>
      <rect y="124" width="480" height="156" fill="url(#${id}lawn)"/>
      <path d="M0 160H480M0 214H480" stroke="#fff" stroke-width="22" opacity=".06"/>${tufts}${can}
      <ellipse cx="${cx + 4}" cy="${yb + 22}" rx="${bw / 2 + 22}" ry="11" fill="#1E3A10" opacity=".22"/>
      <rect x="${x0}" y="${yb}" width="${bw}" height="18" fill="url(#${id}wood)"/>
      <path d="${Array.from({ length: Math.max(1, Math.floor(bw / 62)) }, (_, i) => `M${(x0 + (i + 1) * bw / (Math.floor(bw / 62) + 1)).toFixed(1)} ${yb + 2}v14`).join('')}" stroke="#7F5228" stroke-width="1.5" opacity=".6"/>
      <rect x="${x0}" y="${yb + 15}" width="${bw}" height="3" fill="#6E4522" opacity=".5"/>
      <rect class="c-bedtop" x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="3" fill="url(#${id}soil)" stroke="#C99256" stroke-width="6"/>
      <g class="c-soil">${soil}</g><rect class="c-area" x="${x0 + 3}" y="${y0 + 3}" width="${bw - 6}" height="${bh - 6}" fill="#F0B44C" opacity="0"/>
      <g class="c-plants">${plants}</g>
      <rect x="${x0 - 4}" y="${y0 - 4}" width="8" height="${bh + 26}" rx="2" fill="#B98048"/><rect x="${x0 + bw - 4}" y="${y0 - 4}" width="8" height="${bh + 26}" rx="2" fill="#B98048"/>
      ${dimH(x0, x0 + bw, yb + 46, L ? withUnit(L.value, L.unit) : t('length'), L?.key, yb + 22)}
      ${Wd ? dimV(x0 + bw + 28, y0, yb, withUnit(Wd.value, Wd.unit), Wd.key, x0 + bw + 8) : ''}`;
    return {
      svg,
      play(el, tl, first) {
        const g = c.api.gsap;
        if (first) {
          tl.from(el.querySelectorAll('.c-plant'), { scale: 0, transformOrigin: '50% 100%', duration: .35, ease: 'back.out(3)', stagger: { each: .012, from: 'random' } }, .1);
          playDims(g, el, tl, .3);
        }
        if (!c.api.reduced) {
          g.to(el.querySelectorAll('.c-cloud'), { x: '+=24', duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 1.5 });
          g.to(el.querySelectorAll('.c-plants'), { skewX: 2, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 100%' });
        }
      },
      cheer(el) { c.api.gsap.fromTo(el.querySelector('.c-area'), { opacity: .5 }, { opacity: 0, duration: 1.4, ease: 'power2.out' }); },
    };
  },

  'seed-tray'(c) {
    const { id } = c;
    const S = c.pick('sprouted', /sprout|germin|grew|came|alive|healthy|success|up\b|अंकुर|उग|निकल|स्वस्थ/i);
    const T = c.pick('total', /sown|total|plant|seed|number|count|बोए|कुल|पौध|बीज|संख्या|गिनती/i) || c.pick('total', null);
    const N = clamp(Math.round(+T?.value || 20), 1, 400), K = clamp(Math.round(+S?.value || 0), 0, N);
    const per = Math.ceil(N / 100), cells = Math.ceil(N / per), kc = Math.round(K / per);
    const cols = Math.ceil(Math.sqrt(cells * 400 / 168)), rows = Math.ceil(cells / cols);
    const cs = Math.min(400 / cols, 168 / rows), tw = cols * cs, th = rows * cs, tx = 240 - tw / 2, ty = 64 + (168 - th) / 2;
    const order = seededShuffle(cells, 31).slice(0, kc);
    const sprouted = new Set(order);
    const r = rng(5);
    let cellsSvg = '', sprouts = '';
    for (let i = 0; i < cells; i++) {
      const x = tx + (i % cols) * cs, y = ty + Math.floor(i / cols) * cs, m = cs * .1;
      cellsSvg += `<rect x="${(x + m).toFixed(1)}" y="${(y + m).toFixed(1)}" width="${(cs - 2 * m).toFixed(1)}" height="${(cs - 2 * m).toFixed(1)}" rx="${(cs * .16).toFixed(1)}" fill="#3B2615"/><ellipse cx="${(x + cs / 2).toFixed(1)}" cy="${(y + cs * .6).toFixed(1)}" rx="${(cs * .3).toFixed(1)}" ry="${(cs * .16).toFixed(1)}" fill="#5A3A20"/>`;
      if (!sprouted.has(i)) cellsSvg += `<ellipse cx="${(x + cs / 2).toFixed(1)}" cy="${(y + cs * .55).toFixed(1)}" rx="${(cs * .12).toFixed(1)}" ry="${(cs * .08).toFixed(1)}" transform="rotate(${(r() * 80 - 40).toFixed(0)} ${(x + cs / 2).toFixed(1)} ${(y + cs * .55).toFixed(1)})" fill="#D9B479"/>`;
    }
    for (const i of order) {
      const x = tx + (i % cols) * cs + cs / 2, y = ty + Math.floor(i / cols) * cs + cs * .62, s = cs / 26;
      sprouts += `<g class="c-sprout" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})"><g class="c-sp-in"><path d="M0 0C-1 -5 1 -9 0 -13" stroke="#4B8A26" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M0 -12C-4 -18 -11 -17 -12 -13C-8 -10 -3 -10 0 -12Z" fill="#8BD05A"/><path d="M0 -12C4 -19 11 -18 12 -14C8 -10 3 -10 0 -12Z" fill="#62AE36"/></g></g>`;
    }
    const svg = `<defs>
      <linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EAD4"/><stop offset="1" stop-color="#EBD7B6"/></linearGradient>
      <linearGradient id="${id}tbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C58E55"/><stop offset="1" stop-color="#9C6534"/></linearGradient>
      <linearGradient id="${id}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CFEFFF"/><stop offset="1" stop-color="#9ED2EE"/></linearGradient></defs>
      <rect width="480" height="280" fill="url(#${id}wall)"/>
      <rect x="18" y="8" width="96" height="74" rx="4" fill="url(#${id}glass)" stroke="#FFFDF7" stroke-width="6"/><path d="M66 8V82M18 45H114" stroke="#FFFDF7" stroke-width="4"/>
      <path d="M18 82L114 82L250 280H0Z" fill="#FFF8D8" opacity=".25"/>
      <rect y="112" width="480" height="168" fill="url(#${id}tbl)"/><rect y="112" width="480" height="6" fill="#DDA971"/>
      <path d="M0 160Q120 150 240 162T480 156M0 215Q160 205 300 220T480 212M0 256Q100 248 220 258T480 250" stroke="#8A5629" stroke-width="1.5" fill="none" opacity=".45"/>
      <ellipse cx="244" cy="${ty + th + 18}" rx="${tw / 2 + 24}" ry="10" fill="#3A220E" opacity=".3"/>
      <rect x="${tx - 12}" y="${ty - 12}" width="${tw + 24}" height="${th + 24}" rx="12" fill="#285B3A"/>
      <rect x="${tx - 12}" y="${ty - 12}" width="${tw + 24}" height="${th + 24}" rx="12" fill="none" stroke="#3F8058" stroke-width="3"/>
      <rect x="${tx - 6}" y="${ty - 8}" width="${tw + 12}" height="4" rx="2" fill="#5FA27A" opacity=".6"/>
      ${cellsSvg}<g class="c-sprouts">${sprouts}</g>
      <g class="c-count" transform="translate(${tx + tw + 12} 14)"><rect x="-150" y="0" width="150" height="36" rx="18" fill="#FFF9EF" stroke="#4C7424" stroke-width="2.5"/>
        <text x="-75" y="19" text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="800" fill="#2B1A10">🌱 <tspan class="c-n">${K}</tspan> / ${N}</text></g>
      ${per > 1 ? `<text x="${tx - 8}" y="34" font-size="13" font-weight="700" fill="#6E5442">${t('each cell = {n} seeds', { n: per })}</text>` : ''}`;
    return {
      svg,
      play(el, tl, first) {
        const g = c.api.gsap, n = el.querySelector('.c-n'), sp = el.querySelectorAll('.c-sprout .c-sp-in');
        if (first && sp.length) {
          n.textContent = '0';
          let cnt = 0;
          const each = Math.min(.09, 3.2 / sp.length);
          tl.from(sp, { scale: 0, transformOrigin: '50% 100%', duration: .4, ease: 'back.out(3.5)', stagger: { each, onStart() { cnt++; n.textContent = Math.min(cnt * per, K); if (cnt % 3 === 0) c.api.sound('tick'); } } }, .3)
            .add(() => { n.textContent = K; }, '>')
            .from(el.querySelector('.c-count'), { scale: 1.25, transformOrigin: '100% 0%', duration: .4, ease: 'back.out(3)' }, '>');
        }
        if (!c.api.reduced && sp.length) g.to(el.querySelector('.c-sprouts'), { skewX: 1.5, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      },
      cheer(el) { c.api.gsap.fromTo(el.querySelectorAll('.c-sp-in'), { rotation: -14 }, { rotation: 0, transformOrigin: '50% 100%', duration: .9, ease: 'elastic.out(1.2,.3)', stagger: { each: .01, from: 'random' } }); },
    };
  },

  market(c) {
    const { id } = c;
    const list = c.items.slice(0, 4), n = Math.max(1, list.length), sw = 340 / n;
    let stripes = '', scallops = '';
    for (let i = 0; i < 16; i++) {
      const col = i % 2 ? '#FFF1DA' : '#C9502A';
      stripes += `<rect x="${i * 30}" y="26" width="30" height="40" fill="${col}"/>`;
      scallops += `<path d="M${i * 30} 66a15 15 0 0 0 30 0Z" fill="${col}"/>`;
    }
    let tags = '', goods = '';
    list.forEach((it, i) => {
      const cx = 22 + sw * (i + .5), ty = 78 + (n > 3 ? (i % 2) * 6 : 0), hasArt = it.sprite || it.emoji;
      const val = withUnit(it.value, it.unit), w = Math.max(70, sw - 8);
      tags += `<g class="c-tag" data-key="${esc(it.key)}" data-ox="${cx}">
        <path d="M${cx} 70V${ty + 6}" stroke="#6E4522" stroke-width="1.6"/>
        <rect x="${cx - w / 2}" y="${ty}" width="${w}" height="48" rx="9" fill="${it.isInput ? '#FCE7BD' : '#FFF8E8'}" stroke="${it.isInput ? '#D98A1C' : '#C2502A'}" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${ty + 7}" r="3.4" fill="#6E4522"/>
        <text x="${cx}" y="${ty + 26}" text-anchor="middle" font-size="18" font-weight="800" fill="#2B1A10" class="c-tagv">${esc(val)}</text>
        <text x="${cx}" y="${ty + 40}" text-anchor="middle" font-size="10" font-weight="700" fill="#7A5A44">${esc(trunc(it.label, Math.floor(w / 5.6)))}</text></g>`;
      if (hasArt) {
        goods += `<g class="c-good" data-key="${esc(it.key)}">${svgArt(c.api, it, cx - 28, 126, 56)}
          <path d="M${cx - 36} 172h72l-7 22c-1 4-4 6-8 6h-42c-4 0-7-2-8-6Z" fill="#B97A3C"/>
          <path d="M${cx - 33} 180h66M${cx - 31} 188h62" stroke="#8A5526" stroke-width="2" opacity=".7"/>
          <ellipse cx="${cx}" cy="172" rx="37" ry="5" fill="#9A6230"/></g>`;
      }
    });
    const svg = `<defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A0"/><stop offset="1" stop-color="#FFF1DC"/></linearGradient>
      <linearGradient id="${id}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C68A4E"/><stop offset="1" stop-color="#93592B"/></linearGradient></defs>
      <rect width="480" height="280" fill="url(#${id}sky)"/>
      <path d="M0 150V96h40v-20h36v30h40v-40h30v54h50v-24h44v34h60v-46h40v26h50v-18h40v54h50V150Z" fill="#EBC79A" opacity=".8"/>
      <rect y="236" width="480" height="44" fill="#E2C496"/><path d="M0 248H480" stroke="#CDA875" stroke-width="2"/>
      <rect x="20" y="30" width="8" height="216" fill="#7E4E28"/><rect x="452" y="30" width="8" height="216" fill="#7E4E28"/>
      <g class="c-awning">${stripes}${scallops}<rect y="18" width="480" height="10" rx="3" fill="#7E4E28"/><rect y="28" width="480" height="5" fill="#000" opacity=".08"/></g>
      ${tags}
      <ellipse cx="240" cy="266" rx="236" ry="10" fill="#5A3416" opacity=".25"/>
      ${goods}
      <rect x="12" y="198" width="456" height="11" rx="3" fill="#DBA96D"/>
      <rect x="18" y="209" width="444" height="54" fill="url(#${id}wood)"/>
      <path d="M92 210v52M166 210v52M240 210v52M314 210v52M388 210v52" stroke="#6F4220" stroke-width="2" opacity=".5"/>
      <g class="c-cash" transform="translate(416 196)">
        <path d="M-40 -48L40 -48L34 -70L-34 -70Z" fill="#3F978B"/><path d="M-30 -66H30" stroke="#7CC6BB" stroke-width="2"/>
        <rect x="-40" y="-48" width="80" height="44" rx="6" fill="#2A7C71"/>
        <rect x="-36" y="-52" width="72" height="8" rx="3" fill="#1E5E56"/>
        <circle cx="-18" cy="-52" r="6" fill="#F2C94C"/><circle cx="-6" cy="-54" r="6" fill="#E3B23C"/><rect x="4" y="-60" width="26" height="12" rx="2" fill="#7CBF6A" transform="rotate(-8 17 -54)"/>
        <rect x="-36" y="-44" width="72" height="5" fill="#fff" opacity=".18"/>
        <text x="0" y="-20" text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="800" fill="#D9F1EC">₹</text></g>`;
    return {
      svg,
      play(el, tl, first) {
        const g = c.api.gsap, tagsEl = el.querySelectorAll('.c-tag');
        if (first) {
          tl.from(tagsEl, { y: -70, opacity: 0, duration: .7, ease: 'bounce.out', stagger: .12 }, .1)
            .from(el.querySelectorAll('.c-good'), { y: 30, opacity: 0, duration: .5, ease: 'back.out(2)', stagger: .1 }, .3);
        }
        if (!c.api.reduced) tagsEl.forEach((t, i) => g.fromTo(t, { rotation: -3.5 }, { rotation: 3.5, svgOrigin: `${t.dataset.ox} 70`, duration: 1.5 + i * .23, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      },
      kick(el, key) {
        const t = el.querySelector(`.c-tag[data-key="${CSS.escape(key)}"]`);
        if (t) c.api.gsap.fromTo(t, { rotation: 14 }, { rotation: 0, svgOrigin: `${t.dataset.ox} 70`, duration: 1.2, ease: 'elastic.out(1.3,.25)' });
      },
      cheer(el) {
        const g = c.api.gsap, box = el.querySelector('.c-cash'), svgEl = el;
        for (let i = 0; i < 7; i++) {
          const coin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          coin.innerHTML = '<circle r="8" fill="#F2C94C" stroke="#B8860B" stroke-width="2"/><text text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="800" fill="#8A6100">₹</text>';
          svgEl.append(coin);
          const sx = 140 + Math.random() * 120;
          g.fromTo(coin, { x: sx, y: -12 }, { duration: .8, delay: i * .09, ease: 'power1.in', motionPath: { path: [{ x: sx, y: -12 }, { x: (sx + 416) / 2, y: 30 + Math.random() * 30 }, { x: 410 + Math.random() * 12, y: 146 }], curviness: 1.4 }, onComplete() { coin.remove(); c.api.sound('drop'); } });
        }
        g.fromTo(box, { scaleY: 1 }, { scaleY: .9, scaleX: 1.06, transformOrigin: '50% 100%', duration: .12, yoyo: true, repeat: 5, delay: .7, ease: 'power1.inOut' });
      },
    };
  },

  shop(c) {
    const { id } = c;
    const withArt = c.items.filter(i => i.sprite || i.emoji).slice(0, 6), plain = c.items.filter(i => !withArt.includes(i)).slice(0, 3);
    const top = withArt.slice(0, Math.ceil(withArt.length / 2)), bot = withArt.slice(top.length);
    const shelf = (row, y) => row.map((it, i) => {
      const sw = 400 / row.length, cx = 40 + sw * (i + .5), val = withUnit(it.value, it.unit), w = Math.max(60, val.length * 10.5 + 18);
      return `<g class="c-prod" data-key="${esc(it.key)}">${svgArt(c.api, it, cx - 44, y - 50, 44)}${svgArt(c.api, it, cx, y - 50, 44)}${svgArt(c.api, it, cx - 26, y - 58, 52)}</g>
        <g class="c-label" data-key="${esc(it.key)}"><rect x="${cx - w / 2}" y="${y + 3}" width="${w}" height="26" rx="4" fill="${it.isInput ? '#FCE7BD' : '#FFE27A'}" stroke="#C7A12A" stroke-width="1.5"/>
        <text x="${cx}" y="${y + 17}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="800" fill="#2B1A10">${esc(val)}</text></g>`;
    }).join('');
    const board = plain.length ? `<g class="c-board"><rect x="150" y="6" width="180" height="${22 + plain.length * 20}" rx="6" fill="#2F4F3A" stroke="#8A5A2E" stroke-width="5"/>
      ${plain.map((it, i) => `<text data-key="${esc(it.key)}" x="240" y="${24 + i * 20}" text-anchor="middle" font-size="13" font-weight="700" fill="#F4F1E6">${esc(trunc(it.label, 16))}: ${esc(withUnit(it.value, it.unit))}</text>`).join('')}</g>` : '';
    const svg = `<defs><linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8EAD2"/><stop offset="1" stop-color="#EBD3AE"/></linearGradient>
      <linearGradient id="${id}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D19B5E"/><stop offset="1" stop-color="#A06A36"/></linearGradient></defs>
      <rect width="480" height="280" fill="url(#${id}wall)"/>
      <path d="M0 0H480" stroke="#E0C49A" stroke-width="10"/>
      ${board}
      <rect x="22" y="40" width="10" height="210" fill="#8A5A2E"/><rect x="448" y="40" width="10" height="210" fill="#8A5A2E"/>
      <rect x="22" y="${top.length ? 118 : 0}" width="436" height="10" fill="url(#${id}wood)" ${top.length ? '' : 'opacity="0"'}/><rect x="22" y="128" width="436" height="8" fill="#000" opacity=".08"/>
      <rect x="22" y="206" width="436" height="10" fill="url(#${id}wood)"/><rect x="22" y="216" width="436" height="8" fill="#000" opacity=".08"/>
      ${bot.length ? shelf(top, 118) + shelf(bot, 206) : shelf(top, 206)}
      <rect y="252" width="480" height="28" fill="#CDB28A"/><path d="M0 252H480M60 252l-20 28M160 252l-10 28M260 252v28M360 252l10 28M460 252l20 28" stroke="#B49870" stroke-width="2"/>`;
    return {
      svg,
      play(el, tl, first) {
        if (first) tl.from(el.querySelectorAll('.c-prod'), { y: -30, opacity: 0, duration: .55, ease: 'bounce.out', stagger: .1 }, .1)
          .from(el.querySelectorAll('.c-label'), { rotationX: 90, scaleY: 0, transformOrigin: '50% 0%', duration: .4, ease: 'back.out(2)', stagger: .08 }, .4);
      },
      kick(el, key) { el.querySelectorAll(`[data-key="${CSS.escape(key)}"]`).forEach(t => c.api.gsap.fromTo(t, { scale: 1.15 }, { scale: 1, transformOrigin: '50% 50%', duration: .5, ease: 'back.out(3)' })); },
      cheer(el) { c.api.gsap.fromTo(el.querySelectorAll('.c-prod'), { y: 0 }, { y: -10, duration: .18, yoyo: true, repeat: 1, stagger: .06, ease: 'power2.out' }); },
    };
  },

  water(c) {
    const { id } = c;
    const VOL = /^(l|litres?|liters?|ml|millilitres?|kl|ली|ली\.|लीटर|मिली|मि\.ली\.|मिलीलीटर|किलोलीटर)$/i;
    const kindOf = s => /mug|मग/i.test(s) ? 'mug' : /glass|cup|गिलास|कप/i.test(s) ? 'glass' : /bottle|बोतल/i.test(s) ? 'bottle' : 'bucket';
    const vols = c.items.filter(i => VOL.test(i.unit || '') || i.role === 'volume');
    const counts = c.items.filter(i => !vols.includes(i) && (i.role === 'count' || /bucket|mug|glass|bottle|cup|times|count|number|people|members|days|trips|flush|बाल्टी|मग|गिलास|बोतल|कप|बार|गिनती|संख्या|लोग|सदस्य|दिन|चक्कर|फ़्लश|फ्लश/i.test(`${i.key} ${i.label} ${i.unit}`))).slice(0, 2);
    let groups;
    if (counts.length) {
      groups = counts.map((ct, i) => {
        const kind = kindOf(`${ct.label} ${ct.unit} ${ct.key}`);
        const vol = vols.find(v => kindOf(`${v.label} ${v.key}`) === kind && /mug|glass|bottle|cup|bucket|मग|गिलास|बोतल|कप|बाल्टी/i.test(`${v.label} ${v.key}`)) || (counts.length === 1 ? vols[0] : vols[i]);
        return { kind, n: Math.max(1, Math.round(+ct.value)), vol, count: ct, level: .82 };
      });
    } else {
      const mx = Math.max(1, ...vols.map(v => +v.value));
      groups = (vols.length ? vols : c.items.slice(0, 1)).slice(0, 3).map(v => ({ kind: kindOf(`${v.label} ${v.key}`), n: 1, vol: v, level: clamp(.2 + .7 * (+v.value / mx), .2, .9) }));
    }
    const SIZE = { bucket: [66, 64], mug: [44, 40], glass: [30, 46], bottle: [28, 62] };
    const cap = groups.length > 1 ? 6 : 9;
    let need = 0; groups.forEach(gp => { gp.show = Math.min(gp.n, cap); need += gp.show * (SIZE[gp.kind][0] + 10) + 26; });
    const s = Math.min(1.25, 360 / need), base = 246;
    let x = 104 + Math.max(0, (360 - need * s) / 2), out = '', labels = '', ci = 0;
    for (const gp of groups) {
      const [w, ht] = SIZE[gp.kind].map(v => v * s), gx0 = x;
      for (let i = 0; i < gp.show; i++, ci++) { out += vessel(gp.kind, x + w / 2, base, w, ht, gp.level, `${id}v${ci}`); x += w + 10 * s; }
      const txt = gp.count ? `${gp.n > gp.show ? `${gp.show}+… ` : ''}×${fmt(gp.n)}${gp.vol ? ` · ${t('{v} each', { v: withUnit(gp.vol.value, gp.vol.unit) })}` : ''}` : withUnit(gp.vol.value, gp.vol.unit);
      labels += pill((gx0 + x - 10 * s) / 2, base - ht - 30, txt, { key: gp.count?.key || gp.vol?.key, fs: 15, stroke: '#2C7BB0' });
      x += 26 * s;
    }
    let tiles = '';
    for (let yy = 0; yy < 220; yy += 36) tiles += `<path d="M0 ${yy}H480" stroke="#BFDCE2" stroke-width="2"/>`;
    for (let xx = 0; xx < 480; xx += 36) tiles += `<path d="M${xx} 0V220" stroke="#BFDCE2" stroke-width="2"/>`;
    const svg = `<defs><linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F4F6"/><stop offset="1" stop-color="#D3EBEF"/></linearGradient>
      <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5BB4EC"/><stop offset="1" stop-color="#1F79BE"/></linearGradient>
      <linearGradient id="${id}chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2F6F8"/><stop offset=".5" stop-color="#AEBBC2"/><stop offset="1" stop-color="#7D8C94"/></linearGradient></defs>
      <rect width="480" height="280" fill="url(#${id}wall)"/>${tiles}
      <rect y="220" width="480" height="60" fill="#A9BFC4"/><path d="M0 220H480" stroke="#8FA7AD" stroke-width="3"/><path d="M60 220l-30 60M180 220l-12 60M300 220l12 60M420 220l30 60" stroke="#93AAB0" stroke-width="2"/>
      <rect x="0" y="62" width="62" height="14" fill="url(#${id}chrome)"/>
      <rect x="54" y="54" width="22" height="30" rx="5" fill="url(#${id}chrome)"/>
      <rect x="58" y="40" width="14" height="16" rx="3" fill="#C9D3D8"/><rect x="48" y="36" width="34" height="8" rx="4" fill="#C2502A"/>
      <path d="M76 72h12a6 6 0 0 1 6 6v10h-10v-6h-8Z" fill="url(#${id}chrome)"/>
      <path class="c-drip" d="M89 96c-3 5-4 7-4 9a4 4 0 0 0 8 0c0-2-1-4-4-9Z" fill="#3D9BE0"/>
      ${out}${labels}`;
    return {
      svg,
      play(el, tl, first) {
        const g = c.api.gsap, fills = el.querySelectorAll('.c-fill');
        if (first) {
          tl.from(el.querySelectorAll('.c-vessel'), { y: 30, opacity: 0, duration: .45, ease: 'back.out(2)', stagger: .06 }, .05);
          fills.forEach((f, i) => tl.from(f, { y: +f.dataset.h, duration: .7, ease: 'power2.out', onStart: () => i % 2 || c.api.sound('drop') }, .4 + i * .22));
          tl.from(el.querySelectorAll('.c-pill-in'), { scale: 0, transformOrigin: '50% 50%', duration: .45, ease: 'back.out(2.4)', stagger: .15 }, '>-.2');
        }
        if (!c.api.reduced) {
          g.to(el.querySelectorAll('.c-wave'), { x: -20, duration: 1.6, repeat: -1, ease: 'none' });
          g.fromTo(el.querySelector('.c-drip'), { y: 0, opacity: 1, scale: .4, transformOrigin: '50% 0%' }, { keyframes: [{ scale: 1, duration: .8, ease: 'sine.in' }, { y: 120, duration: .5, ease: 'power2.in' }, { opacity: 0, duration: .01 }], repeat: -1, repeatDelay: .6 });
        }
      },
      cheer(el) { c.api.gsap.fromTo(el.querySelectorAll('.c-fill'), { y: 4 }, { y: 0, duration: 1, ease: 'elastic.out(1.2,.3)', stagger: .05 }); },
    };
  },

  animal(c) {
    const all = `${c.api.cfg.animal || ''} ${c.items.map(i => `${i.sprite || ''} ${i.label}`).join(' ')}`;
    const sp = /buffalo|भैंस/i.test(all) ? 'buffalo' : /goat|बकरी|बकरा/i.test(all) ? 'goat' : /sheep|भेड़/i.test(all) ? 'sheep' : 'cow';
    const G = c.pick('girth', /girth|chest|heart|round|घेरा|घेर|छाती/i), L = c.pick('length', /len|body|long|लंबाई|लम्बाई|शरीर/i);
    const P = { cow: { body: '#F7F1E7', patch: '#6B4226', dark: '#4A2E1A', s: 1 }, buffalo: { body: '#4A4646', patch: '#3A3636', dark: '#262222', s: 1 }, goat: { body: '#D6A874', patch: '#F4EADB', dark: '#6B4A2E', s: .82 }, sheep: { body: '#F2EDE4', patch: '#E4DDD2', dark: '#3A3030', s: .82 } }[sp];
    const s = P.s, ox = 262, oy = 162, T = (x, y) => [ox + x * s, oy + y * s];
    const horns = sp === 'buffalo' ? `<path d="M-122 -58C-110 -78 -84 -78 -80 -60C-92 -70 -106 -66 -114 -52Z" fill="#2B2724"/>` : sp === 'goat' ? `<path d="M-128 -56C-124 -76 -108 -84 -96 -78C-108 -74 -116 -66 -120 -52Z" fill="#8C7A64"/>` : sp === 'cow' ? `<path d="M-130 -56C-132 -66 -128 -72 -122 -72C-124 -66 -124 -60 -122 -55Z" fill="#E8DCC4"/>` : '';
    const wool = sp === 'sheep' ? Array.from({ length: 14 }, (_, i) => `<circle cx="${-80 + (i % 7) * 28}" cy="${-34 + Math.floor(i / 7) * 34}" r="20" fill="#FFFFFF" opacity=".55"/>`).join('') : '';
    const patches = sp === 'cow' ? `<path d="M10 -50C30 -56 50 -40 40 -22C28 -8 6 -20 2 -32C0 -40 4 -46 10 -50Z" fill="${P.patch}"/><path d="M60 0C78 -6 92 8 86 24C76 34 56 30 54 16C52 8 54 2 60 0Z" fill="${P.patch}"/><path d="M-70 -44C-58 -50 -48 -40 -52 -30C-58 -22 -72 -28 -74 -36Z" fill="${P.patch}"/>` : '';
    const body = `M-92 -28C-92 -58 -40 -60 0 -58C50 -60 92 -58 100 -30C108 -4 104 30 82 38C40 50 -50 50 -84 36C-102 26 -98 -8 -92 -28Z`;
    const leg = (x, d = 0) => `<g class="c-leg"><rect x="${x - 7}" y="${24 + d}" width="15" height="${68 - d}" rx="7" fill="${P.body}" stroke="${P.dark}" stroke-width="2"/><rect x="${x - 8}" y="84" width="17" height="10" rx="3" fill="${P.dark}"/></g>`;
    const tape = { x: -48 };
    const svg = `<defs><linearGradient id="${c.id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A4D8F0"/><stop offset="1" stop-color="#EAF6EA"/></linearGradient>
      <linearGradient id="${c.id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FCB62"/><stop offset="1" stop-color="#6E9F3E"/></linearGradient>
      <clipPath id="${c.id}cb"><path d="${body}"/></clipPath></defs>
      <rect width="480" height="280" fill="url(#${c.id}sky)"/>${sun(60, 40)}${cloud(380, 34, .8)}${cloud(220, 22, .6)}
      <path d="M0 140C80 104 160 130 240 112S400 96 480 124V170H0Z" fill="#B8D88A"/>
      <g stroke="#9C6B3D" stroke-width="6" stroke-linecap="round"><path d="M0 150H480M0 170H480"/>${[20, 110, 200, 290, 380, 470].map(x => `<path d="M${x} 136V184"/>`).join('')}</g>
      <rect y="176" width="480" height="104" fill="url(#${c.id}g)"/>
      <g transform="translate(18 196)"><ellipse cx="34" cy="44" rx="40" ry="7" fill="#2E4416" opacity=".25"/><rect x="0" y="6" width="68" height="40" rx="10" fill="#E3BE5C"/><path d="M6 18H62M6 30H62" stroke="#C49A3A" stroke-width="2.5"/><path d="M10 8l-4-6M30 6l2-7M52 8l5-6" stroke="#E3BE5C" stroke-width="2"/></g>
      <ellipse cx="${ox}" cy="${oy + 96 * s}" rx="${120 * s}" ry="${10 * s}" fill="#2E4416" opacity=".25"/>
      <g class="c-animal" transform="translate(${ox} ${oy}) scale(${s})">
        <path class="c-tail" d="M98 -28C116 -12 112 20 110 50" stroke="${P.dark}" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse class="c-tail" cx="110" cy="56" rx="6" ry="10" fill="${P.dark}"/>
        ${leg(62)}${leg(84, 4)}
        <path class="c-tape-back" d="M${tape.x} -62C${tape.x - 13} -30 ${tape.x - 13} 20 ${tape.x} 52" stroke="#C99A1F" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="${body}" fill="${P.body}" stroke="${P.dark}" stroke-width="2.5"/>
        <g clip-path="url(#${c.id}cb)">${patches}${wool}<path d="M-90 30C-40 46 40 46 100 26V60H-90Z" fill="#000" opacity=".07"/><path d="M-80 -46C-40 -56 40 -56 90 -44" stroke="#fff" stroke-width="8" opacity=".25" fill="none" stroke-linecap="round"/></g>
        ${sp === 'cow' ? `<ellipse cx="44" cy="44" rx="14" ry="8" fill="#F1B3A8" stroke="${P.dark}" stroke-width="1.5"/>` : ''}
        ${leg(-70)}${leg(-46, 4)}
        <path class="c-tape" d="M${tape.x} -62C${tape.x + 12} -30 ${tape.x + 12} 20 ${tape.x} 52" stroke="#F4C531" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path class="c-tape c-ticks" d="M${tape.x} -62C${tape.x + 12} -30 ${tape.x + 12} 20 ${tape.x} 52" stroke="#7A5A10" stroke-width="5" stroke-dasharray="1.4 5" fill="none"/>
        <g class="c-head">
          <path d="M-86 -30C-100 -50 -112 -52 -122 -46L-104 -6C-96 -6 -88 -14 -86 -30Z" fill="${P.body}" stroke="${P.dark}" stroke-width="2.5"/>
          ${horns}
          <g class="c-ear"><ellipse cx="-108" cy="-54" rx="12" ry="6" transform="rotate(-24 -108 -54)" fill="${sp === 'buffalo' ? '#3A3636' : P.body}" stroke="${P.dark}" stroke-width="2"/></g>
          <path d="M-118 -54C-136 -60 -156 -48 -160 -24C-162 -10 -150 -2 -138 -4C-124 -6 -110 -20 -108 -36C-108 -46 -112 -52 -118 -54Z" fill="${P.body}" stroke="${P.dark}" stroke-width="2.5"/>
          ${sp === 'cow' ? `<path d="M-132 -52C-124 -54 -118 -48 -120 -40C-126 -38 -134 -44 -132 -52Z" fill="${P.patch}"/>` : ''}
          <ellipse cx="-152" cy="-14" rx="12" ry="10" fill="${sp === 'buffalo' ? '#2E2A2A' : '#EBB3A2'}" stroke="${P.dark}" stroke-width="2"/>
          <circle cx="-156" cy="-15" r="1.8" fill="${P.dark}"/><circle cx="-148" cy="-13" r="1.8" fill="${P.dark}"/>
          <g class="c-eye"><ellipse cx="-134" cy="-36" rx="4" ry="4.6" fill="#2B1A10"/><circle cx="-133" cy="-37.5" r="1.4" fill="#fff"/></g>
          ${sp === 'goat' ? `<path d="M-146 -4C-148 6 -144 12 -140 14C-140 6 -140 0 -142 -4Z" fill="#8C7A64"/>` : ''}
        </g></g>
      ${G ? `<g class="c-girth">${pill(...T(tape.x + 6, 74), `${withUnit(G.value, G.unit)}`, { key: G.key, stroke: '#C99A1F' })}</g>` : ''}
      ${L ? dimH(T(-90, 0)[0], T(102, 0)[0], T(0, -84)[1], withUnit(L.value, L.unit), L.key, T(0, -60)[1]) : ''}`;
    return {
      svg,
      play(el, tl, first) {
        const g = c.api.gsap;
        if (first) {
          tl.from(el.querySelector('.c-animal'), { x: '+=60', opacity: 0, duration: .7, ease: 'power3.out' }, 0)
            .fromTo(el.querySelectorAll('.c-tape-back'), { drawSVG: '0%' }, { drawSVG: '100%', duration: .4, ease: 'none' }, .6)
            .fromTo(el.querySelectorAll('.c-tape'), { drawSVG: '0%' }, { drawSVG: '100%', duration: .7, ease: 'power2.inOut' }, .95)
            .from(el.querySelectorAll('.c-girth .c-pill-in'), { scale: 0, transformOrigin: '50% 50%', duration: .45, ease: 'back.out(2.4)' }, 1.5);
          playDims(g, el, tl, 1.7);
        }
        if (!c.api.reduced) {
          g.to(el.querySelectorAll('.c-tail'), { rotation: 9, svgOrigin: '98 -28', duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          g.to(el.querySelector('.c-head'), { rotation: -3, svgOrigin: '-90 -20', duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          g.to(el.querySelector('.c-ear'), { rotation: -14, svgOrigin: '-100 -52', duration: .16, yoyo: true, repeat: 1, repeatDelay: 0, ease: 'power1.inOut', delay: 2 }).repeat(-1).repeatDelay(3);
          g.to(el.querySelector('.c-eye'), { scaleY: .1, transformOrigin: '50% 50%', duration: .08, yoyo: true, repeat: 1 }).repeat(-1).repeatDelay(3.4);
          g.to(el.querySelectorAll('.c-cloud'), { x: '+=20', duration: 8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        }
      },
      cheer(el) { c.api.gsap.fromTo(el.querySelector('.c-animal'), { y: 0 }, { y: -14, duration: .22, yoyo: true, repeat: 3, ease: 'power2.out' }); },
    };
  },

  plank(c) {
    const { id } = c;
    const P = c.pick('piece', /piece|part|cut|each|size|shelf|leg|strip|टुकड़|हिस्स|कट|प्रत्येक|नाप|शेल्फ़|शेल्फ|पाया|पट्टी/i, isLen);
    const L = c.pick('length', /plank|board|length|total|long|wood|तख़्त|तख्त|पटरा|बोर्ड|लंबाई|लम्बाई|कुल|लकड़ी/i, isLen) || c.pick('length', null, isLen);
    const lv = L ? toCm(L) : 200, pv = P ? toCm(P) : 0;
    const x0 = 60, pw0 = 380, nCut = pv > 0 ? Math.floor(lv / pv + 1e-9) : 0, ppx = pv > 0 ? pw0 * pv / lv : 0;
    let cuts = '', pieces = '';
    for (let i = 0; i < nCut; i++) {
      const xa = x0 + i * ppx;
      pieces += `<rect class="c-piece" x="${xa.toFixed(1)}" y="126" width="${ppx.toFixed(1)}" height="40" fill="${i % 2 ? '#fff' : '#F0B44C'}" opacity=".16"/>`;
      if (ppx > 52) pieces += `<text x="${(xa + ppx / 2).toFixed(1)}" y="${150}" text-anchor="middle" font-size="12" font-weight="700" fill="#6B4320" opacity=".85">${esc(withUnit(P.value, P.unit))}</text>`;
      const xc = xa + ppx;
      if (xc < x0 + pw0 - .5) cuts += `<path class="c-cut" d="M${xc.toFixed(1)} 120V166" stroke="#2B1A10" stroke-width="2" stroke-dasharray="5 4"/>`;
    }
    const left = nCut && x0 + nCut * ppx < x0 + pw0 - 1 ? `<rect x="${(x0 + nCut * ppx).toFixed(1)}" y="126" width="${(pw0 - nCut * ppx).toFixed(1)}" height="40" fill="url(#${id}hatch)"/>` : '';
    let grain = '';
    const r = rng(9);
    for (let i = 0; i < 6; i++) { const y = 130 + i * 6 + r() * 3; grain += `<path d="M${x0} ${y.toFixed(1)}C${x0 + 90} ${(y - 4).toFixed(1)} ${x0 + 160} ${(y + 4).toFixed(1)} ${x0 + 240} ${y.toFixed(1)}S${x0 + 340} ${(y - 3).toFixed(1)} ${x0 + pw0} ${y.toFixed(1)}" stroke="#B98446" stroke-width="1.3" fill="none" opacity=".6"/>`; }
    let ticks = '';
    for (let t = 0; t <= pw0; t += 9.5) ticks += `<path d="M${x0 + t} 98v${Math.round(t / 9.5) % 5 ? 4 : 8}" stroke="#2B1A10" stroke-width="1.2"/>`;
    let peg = '';
    for (let yy = 12; yy < 104; yy += 18) for (let xx = 12; xx < 480; xx += 18) peg += `<circle cx="${xx}" cy="${yy}" r="2.2"/>`;
    const tools = ['saw', 'hammer', 'try-square'].filter(n => c.api.hasSprite(n)).map((n, i) => svgArt(c.api, { sprite: n }, 300 + i * 58, 4, 54)).join('');
    const svg = `<defs><linearGradient id="${id}bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B57A43"/><stop offset="1" stop-color="#84522A"/></linearGradient>
      <linearGradient id="${id}top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2CC95"/><stop offset="1" stop-color="#E2B077"/></linearGradient>
      <linearGradient id="${id}tape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE066"/><stop offset="1" stop-color="#F2BE22"/></linearGradient>
      <pattern id="${id}hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#C2502A" opacity=".08"/><path d="M0 0V8" stroke="#C2502A" stroke-width="2.5" opacity=".35"/></pattern></defs>
      <rect width="480" height="280" fill="#EFDDBF"/><g fill="#CDB38C">${peg}</g>${tools}
      <rect y="104" width="480" height="176" fill="url(#${id}bench)"/><rect y="104" width="480" height="8" fill="#C99059"/>
      <path d="M0 200H480M0 244H480" stroke="#6F4421" stroke-width="2" opacity=".35"/>
      <ellipse cx="${x0 + pw0 / 2}" cy="180" rx="${pw0 / 2 + 14}" ry="8" fill="#3A200C" opacity=".3"/>
      <g class="c-plank"><rect x="${x0}" y="120" width="${pw0}" height="8" fill="#F7D9AA"/><rect x="${x0}" y="126" width="${pw0}" height="40" fill="url(#${id}top)"/>
        ${grain}<ellipse cx="${x0 + 120}" cy="144" rx="9" ry="4" fill="none" stroke="#A46E34" stroke-width="1.6"/><ellipse cx="${x0 + 290}" cy="138" rx="6" ry="3" fill="#A46E34" opacity=".5"/>
        <rect x="${x0}" y="166" width="${pw0}" height="8" fill="#C38B4F"/><rect x="${x0 + pw0 - 3}" y="120" width="5" height="54" fill="#B27B40"/>
        ${pieces}${left}${cuts}</g>
      <g class="c-tapebody">
        <rect class="c-tapestrip" x="${x0}" y="92" width="${pw0}" height="16" fill="url(#${id}tape)" stroke="#B78A10" stroke-width="1"/>
        <g class="c-tapestrip">${ticks}</g>
        <path class="c-hook" d="M${x0 + pw0} 90h5v24h-5" fill="#555"/>
        <g transform="translate(${x0 - 34} 100)"><rect x="-26" y="-26" width="52" height="52" rx="12" fill="#E3A21A"/><rect x="-26" y="-26" width="52" height="52" rx="12" fill="none" stroke="#9A6A08" stroke-width="2"/><circle r="13" fill="#2B2B2B"/><circle r="5" fill="#E3A21A"/><rect x="18" y="-8" width="10" height="16" rx="2" fill="#2B2B2B"/></g>
      </g>
      ${L ? `<g class="c-dim">${pill(x0 + pw0 / 2, 72, withUnit(L.value, L.unit), { key: L.key })}</g>` : ''}
      ${nCut ? `<text x="${x0}" y="196" font-size="15" font-weight="800" fill="#FFF3DE">${t(left ? (nCut > 1 ? '{n} pieces of {size} + a bit left over' : '{n} piece of {size} + a bit left over') : (nCut > 1 ? '{n} pieces of {size}' : '{n} piece of {size}'), { n: nCut, size: esc(withUnit(P.value, P.unit)) })}</text>` : ''}`;
    return {
      svg,
      play(el, tl, first) {
        if (!first) return;
        tl.from(el.querySelectorAll('.c-tapestrip'), { scaleX: 0, transformOrigin: '0% 50%', duration: .9, ease: 'power2.out' }, .2)
          .from(el.querySelector('.c-hook'), { x: -pw0, duration: .9, ease: 'power2.out' }, .2)
          .from(el.querySelectorAll('.c-pill-in'), { scale: 0, transformOrigin: '50% 50%', duration: .45, ease: 'back.out(2.4)' }, 1)
          .fromTo(el.querySelectorAll('.c-cut'), { drawSVG: '0%' }, { drawSVG: '100%', duration: .25, stagger: .18, ease: 'none' }, 1.1)
          .from(el.querySelectorAll('.c-piece'), { opacity: 0, duration: .3, stagger: .1 }, 1.2);
      },
      cheer(el) { c.api.gsap.fromTo(el.querySelectorAll('.c-piece'), { opacity: .7 }, { opacity: .16, duration: .9, stagger: .08 }); },
    };
  },

  recipe(c) {
    const { id } = c;
    const list = c.items.slice(0, 6), serves = c.pick('serves', /serve|people|person|plate|portion|guest|student|children|friends|परोस|लोग|व्यक्ति|प्लेट|मेहमान|विद्यार्थी|बच्चे|दोस्त/i);
    const lines = list.filter(i => i !== serves), lh = Math.min(34, 168 / Math.max(1, lines.length));
    const title = trunc(c.api.cfg.title || t('Recipe'), 22);
    const rows = lines.map((it, i) => {
      const y = 82 + i * lh;
      // Fit label and value on one ruled line: shrink a long value, then shorten the label to the space left.
      const val = withUnit(it.value, it.unit), lfs = Math.min(15, lh * .5), x0 = 56 + lh;
      let vfs = Math.min(17, lh * .56);
      if (val.length * vfs * .56 > 128) vfs = Math.max(10, 128 / (val.length * .56));
      const room = 304 - x0 - val.length * vfs * .56 - 10;
      return `<g class="c-line" data-key="${esc(it.key)}">${svgArt(c.api, it, 52, y - lh * .42, lh * .8)}
        <text x="${x0}" y="${y + 1}" font-size="${lfs.toFixed(1)}" font-weight="600" fill="#5E4634" dominant-baseline="central">${esc(trunc(it.label, Math.max(6, Math.floor(room / (lfs * .52)))))}</text>
        <text class="c-lv" x="304" y="${y + 1}" font-size="${vfs.toFixed(1)}" font-weight="800" fill="#2B1A10" text-anchor="end" dominant-baseline="central">${esc(withUnit(it.value, it.unit))}</text></g>`;
    }).join('');
    let ruled = '';
    for (let y = 82 + lh / 2; y < 254; y += lh) ruled += `<path d="M44 ${y.toFixed(1)}H314" stroke="#B8D4EA" stroke-width="1.2"/>`;
    const props = list.filter(i => i.sprite || i.emoji).slice(0, 3).map((it, i) => svgArt(c.api, it, 352 + (i % 2) * 54, 150 + Math.floor(i / 2) * 50 - i * 6, 52)).join('');
    const svg = `<defs><linearGradient id="${id}ctr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B6A4C"/><stop offset="1" stop-color="#5E4430"/></linearGradient></defs>
      <rect width="480" height="280" fill="#F3EBDD"/>
      <g stroke="#E0D3BC" stroke-width="2">${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 36} 0V120"/>`).join('')}${Array.from({ length: 4 }, (_, i) => `<path d="M0 ${i * 36}H480"/>`).join('')}</g>
      <rect y="116" width="480" height="164" fill="url(#${id}ctr)"/><rect y="116" width="480" height="7" fill="#A88563"/>
      <ellipse cx="400" cy="250" rx="70" ry="10" fill="#000" opacity=".2"/>
      <g transform="translate(400 210)"><path d="M-64 -30H64C62 4 34 24 0 24S-62 4 -64 -30Z" fill="#E8E2D6"/><path d="M-64 -30H64C62 4 34 24 0 24S-62 4 -64 -30Z" fill="none" stroke="#B9AE9C" stroke-width="2"/><ellipse cx="0" cy="-30" rx="64" ry="12" fill="#F7F3EA" stroke="#B9AE9C" stroke-width="2"/><ellipse cx="0" cy="-29" rx="54" ry="8" fill="#E6C784"/><path d="M-20 -60L18 -22" stroke="#9C7A54" stroke-width="7" stroke-linecap="round"/><ellipse cx="-24" cy="-64" rx="9" ry="6" transform="rotate(45 -24 -64)" fill="#9C7A54"/></g>
      ${props}
      <g class="c-card" transform="rotate(-2 180 150)">
        <rect x="40" y="18" width="282" height="248" rx="8" fill="#000" opacity=".18" transform="translate(4 6)"/>
        <rect x="40" y="18" width="282" height="248" rx="8" fill="#FFFCF4"/>
        <path d="M70 18V266" stroke="#F1A9A0" stroke-width="1.5"/>${ruled}
        <text x="181" y="46" text-anchor="middle" font-size="19" font-weight="800" fill="#8C3557" font-family="Lora, Georgia, serif">${esc(title)}</text>
        <path d="M110 58H252" stroke="#8C3557" stroke-width="2" stroke-linecap="round" opacity=".5"/>
        ${rows}
        <circle cx="181" cy="18" r="8" fill="#C2502A"/><circle cx="179" cy="16" r="2.5" fill="#fff" opacity=".6"/>
      </g>
      ${serves ? `<g class="c-serves" data-key="${esc(serves.key)}" transform="translate(360 48) rotate(10)"><circle r="40" fill="#D98A1C"/><circle r="34" fill="none" stroke="#FFF1DA" stroke-width="2" stroke-dasharray="4 3"/>
        <text y="-10" text-anchor="middle" font-size="12" font-weight="700" fill="#FFF7EA">${esc(/serve|परोस/i.test(serves.label) || /serve/i.test(serves.key) ? t('Serves') : trunc(serves.label, 9))}</text><text class="c-lv" y="13" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">${esc(fmt(+serves.value))}</text></g>` : ''}`;
    return {
      svg,
      play(el, tl, first) {
        if (!first) return;
        tl.from(el.querySelector('.c-card'), { y: -40, rotation: -8, opacity: 0, transformOrigin: '50% 0%', duration: .7, ease: 'back.out(1.6)' }, 0)
          .from(el.querySelectorAll('.c-line'), { x: -16, opacity: 0, duration: .35, stagger: .12, ease: 'power2.out' }, .5)
          .from(el.querySelector('.c-serves'), { scale: 0, rotation: -90, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2)' }, .9);
      },
      kick(el, key) { el.querySelectorAll(`[data-key="${CSS.escape(key)}"] .c-lv`).forEach(t => c.api.gsap.fromTo(t, { scale: 1.35, fill: '#D98A1C' }, { scale: 1, fill: '#2B1A10', transformOrigin: '100% 50%', duration: .6, ease: 'back.out(3)' })); },
      cheer(el) { pop(c.api, el.querySelector('.c-card'), 1.03); },
    };
  },

  generic(c) {
    const { id } = c;
    const list = c.items.slice(0, 6), lh = Math.min(36, 170 / Math.max(1, list.length));
    const rows = list.map((it, i) => {
      const y = 62 + i * lh + lh / 2;
      // Fit "label = value" inside the board: shrink the chalk a little, then shorten the label.
      const val = withUnit(it.value, it.unit), room = 436 - (68 + lh), need = it.label.length + 3 + val.length;
      const fs = Math.max(13, Math.min(18, lh * .55, room / (need * .5)));
      const max = Math.max(8, Math.floor(room / (fs * .5)) - 3 - val.length);
      return `<g class="c-line" data-key="${esc(it.key)}">${svgArt(c.api, it, 60, y - lh * .4, lh * .8)}
        <text class="c-chalk" x="${68 + lh}" y="${y}" font-size="${fs.toFixed(1)}" dominant-baseline="central">${esc(trunc(it.label, max))} = <tspan class="c-lv" font-weight="800" fill="#FFE59A">${esc(withUnit(it.value, it.unit))}</tspan></text></g>`;
    }).join('');
    const svg = `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36584A"/><stop offset="1" stop-color="#244236"/></linearGradient>
      <filter id="${id}chalk"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter></defs>
      <rect width="480" height="280" fill="#EFE4D2"/>
      <rect x="22" y="14" width="436" height="234" rx="10" fill="#9A6A3A"/><rect x="32" y="24" width="416" height="214" rx="4" fill="url(#${id}b)"/>
      <ellipse cx="140" cy="200" rx="90" ry="20" fill="#fff" opacity=".04"/><ellipse cx="360" cy="80" rx="70" ry="24" fill="#fff" opacity=".05"/>
      <text class="c-chalk" x="60" y="48" font-size="16" fill="#F7E7B5" opacity=".9">${t('What we know:')}</text>
      <g filter="url(#${id}chalk)" fill="#F4F1E6">${rows}</g>
      <rect x="40" y="246" width="400" height="10" rx="3" fill="#7E5530"/><rect x="300" y="236" width="44" height="12" rx="3" fill="#C9B79A"/><rect x="304" y="240" width="36" height="8" fill="#4E4E4E"/>
      <rect x="120" y="241" width="22" height="6" rx="3" fill="#fff"/><rect x="150" y="241" width="16" height="6" rx="3" fill="#F6E58D"/>`;
    return {
      svg,
      play(el, tl, first) { if (first) tl.from(el.querySelectorAll('.c-line'), { clipPath: 'inset(0 100% 0 0)', duration: .5, stagger: .2, ease: 'none' }, .2); },
      kick(el, key) { el.querySelectorAll(`[data-key="${CSS.escape(key)}"]`).forEach(t => pop(c.api, t, 1.06)); },
    };
  },
};

function vessel(kind, cx, base, w, ht, level, cid) {
  const wh = ht * level, top = base - ht;
  let bodyPath, extra = '', rim = '';
  if (kind === 'bucket') {
    const tw = w / 2, bw = w * .36;
    bodyPath = `M${cx - tw} ${top}L${cx - bw} ${base - 4}Q${cx - bw} ${base} ${cx - bw + 4} ${base}H${cx + bw - 4}Q${cx + bw} ${base} ${cx + bw} ${base - 4}L${cx + tw} ${top}Z`;
    rim = `<ellipse cx="${cx}" cy="${top}" rx="${tw}" ry="${w * .08}" fill="none" stroke="#2C7BB0" stroke-width="3"/>`;
    extra = `<path d="M${cx - tw + 2} ${top}C${cx - tw} ${top - ht * .55} ${cx + tw} ${top - ht * .55} ${cx + tw - 2} ${top}" fill="none" stroke="#5A6C76" stroke-width="2.5"/>`;
  } else {
    const hw = w / 2 * (kind === 'mug' ? .8 : 1), r = kind === 'bottle' ? w * .3 : 4;
    bodyPath = kind === 'bottle'
      ? `M${cx - w * .18} ${top}V${top + ht * .18}Q${cx - hw} ${top + ht * .26} ${cx - hw} ${top + ht * .4}V${base - r}Q${cx - hw} ${base} ${cx - hw + r} ${base}H${cx + hw - r}Q${cx + hw} ${base} ${cx + hw} ${base - r}V${top + ht * .4}Q${cx + hw} ${top + ht * .26} ${cx + w * .18} ${top + ht * .18}V${top}Z`
      : `M${cx - hw} ${top}V${base - r}Q${cx - hw} ${base} ${cx - hw + r} ${base}H${cx + hw - r}Q${cx + hw} ${base} ${cx + hw} ${base - r}V${top}Z`;
    if (kind === 'mug') extra = `<path d="M${cx + hw} ${top + ht * .2}h${w * .14}a${w * .12} ${w * .12} 0 0 1 ${w * .12} ${w * .12}v${ht * .22}a${w * .12} ${w * .12} 0 0 1 -${w * .12} ${w * .12}h-${w * .14}" fill="none" stroke="#2C7BB0" stroke-width="${Math.max(3, w * .09)}"/>`;
  }
  const fillTop = base - wh, amp = Math.max(1.5, w * .04);
  let wave = `M${cx - w} ${fillTop}`;
  for (let x = cx - w; x < cx + w + 20; x += 10) wave += ` q5 ${-amp} 10 0`;
  return `<g class="c-vessel"><ellipse cx="${cx}" cy="${base + 2}" rx="${w * .5}" ry="${w * .07 + 1}" fill="#3B5560" opacity=".25"/>${extra}
    <clipPath id="${cid}"><path d="${bodyPath}"/></clipPath>
    <path d="${bodyPath}" fill="#E8F4FB" opacity=".75"/>
    <g clip-path="url(#${cid})"><g class="c-fill" data-h="${wh.toFixed(1)}"><path class="c-wave" d="${wave} V${base + 4} H${cx - w} Z" fill="url(#${cid.replace(/v\d+$/, 'w')})" opacity=".92"/><path class="c-wave" d="${wave}" fill="none" stroke="#A9DDFB" stroke-width="2"/></g></g>
    <path d="${bodyPath}" fill="none" stroke="#2C7BB0" stroke-width="2.5" stroke-linejoin="round"/>${rim}
    <path d="M${cx - w * .3} ${top + ht * .15}V${base - ht * .2}" stroke="#fff" stroke-width="${Math.max(2, w * .06)}" opacity=".55" stroke-linecap="round"/></g>`;
}

/* ---------------------------------------------------------------- working */
const pretty = s => s.replace(/\s+/g, '').replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/(?<=[\d)])-/g, ' − ').replace(/\+/g, ' + ').replace(/\^/g, '^');
const numStr = v => { const r = +(+v).toFixed(4); return Math.abs(r) >= 1000 ? fmt(r, 4) : String(r); };
function autoWorking(expr, vars, unit) {
  let s = String(expr).replace(/[A-Za-z_]\w*/g, m => (m in vars ? `(${numStr(vars[m])})` : m)).replace(/\((-?[\d.]+)\)/g, (m, n) => (+n < 0 ? m : n));
  const lines = [pretty(s)];
  for (let k = 0; k < 4; k++) {
    const m = /([A-Za-z_]\w*)?\(([^()]*)\)/.exec(s);
    if (!m) break;
    if (!m[1] && /^-?[\d.]+$/.test(m[2].trim())) { s = s.replace(m[0], m[2]); continue; }
    let v; try { v = evalExpr(m[0]); } catch { break; }
    s = s.replace(m[0], numStr(v));
    if (/[*/+^%-]/.test(s.replace(/^-/, ''))) lines.push(`= ${pretty(s)}`);
  }
  let res; try { res = evalExpr(expr, vars); } catch { res = NaN; }
  lines.push(`= ${withUnit(+res.toFixed(2), unit)}`);
  return [...new Set(lines)].slice(-5);
}
function fillTemplate(str, vars) {
  return String(str).replace(/\{=([^}]+)\}/g, (_, e) => { try { return fmt(evalExpr(e, vars)); } catch { return '?'; } })
    .replace(/\{([A-Za-z_]\w*)\}/g, (m, k) => (k in vars ? fmt(+vars[k]) : m));
}

/* ---------------------------------------------------------------- mount */
let UID = 0;
export function mount(stage, cfg, api) {
  const g = api.gsap, id = `lc${++UID}`;
  const sceneName = SCENES[cfg.scene] ? cfg.scene : 'generic';
  const items = [
    ...(cfg.givens || []).map(x => ({ ...x, value: +x.value, isInput: false })),
    ...(cfg.inputs || []).map(x => ({ ...x, value: +(x.value ?? x.min ?? 0), isInput: true })),
  ];
  const qs = (cfg.questions || []).filter(q => q && q.answer != null);
  const answered = {};
  const vars = () => { const v = {}; items.forEach(i => { v[i.key] = i.value; }); return Object.assign(v, answered); };
  const inputNames = new Set((cfg.inputs || []).map(i => i.key));
  let qi = 0, misses = 0, typed = '', busy = false, sctx = null, scene = null, workShown = false;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, api.reduced ? Math.min(ms, 120) : ms));

  const unitOf = q => q.unit || '';
  const pre = q => PRE.has(unitOf(q));
  const needMinus = qs.some(q => { try { return evalExpr(q.answer, vars()) < 0; } catch { return false; } });

  const root = h(`<div class="lab-calc cs-${sceneName}">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="${id}chalk"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter></svg>
    <div class="calc-l">
      <figure class="calc-scene">
        <div class="calc-svgwrap"><svg class="calc-svg" viewBox="0 0 480 280" role="img" aria-label="${esc(t('Picture: {list}', { list: items.map(i => `${i.label} ${withUnit(i.value, i.unit)}`).join(', ') }))}"></svg></div>
        <figcaption class="calc-chips">${items.filter(i => !i.isInput).map(i => `<div class="calc-chip" data-key="${esc(i.key)}"><span class="calc-chip-art">${htmlArt(api, i)}</span><span class="calc-chip-txt"><small>${esc(i.label)}</small><b>${esc(withUnit(i.value, i.unit))}</b></span></div>`).join('')}</figcaption>
      </figure>
      <div class="calc-board" hidden><div class="calc-board-frame"><p class="calc-board-h">${t('Working')}</p><ol class="calc-lines" style="filter:url(#${id}chalk)"></ol><i class="calc-nib"></i></div></div>
    </div>
    <div class="calc-r">
      <section class="calc-q">
        <div class="calc-steps">${qs.map((_, i) => `<span class="calc-step" data-i="${i}">${i + 1}</span>`).join('')}</div>
        <p class="calc-ask" aria-live="polite"></p>
      </section>
      ${(cfg.inputs || []).length ? `<div class="calc-inputs">${items.filter(i => i.isInput).map(i => `<label class="calc-slider" data-key="${esc(i.key)}"><span class="calc-sl-top"><span class="calc-sl-name">${esc(i.label)}</span><output>${esc(withUnit(i.value, i.unit))}</output></span>
        <input type="range" min="${i.min ?? 0}" max="${i.max ?? 100}" step="${i.step ?? 1}" value="${i.value}" aria-label="${esc(i.label)}"></label>`).join('')}</div>` : ''}
      <div class="calc-ans">
        <div class="calc-display" tabindex="0" role="textbox" aria-label="${t('Your answer')}"><span class="calc-pre"></span><span class="calc-digits"></span><i class="calc-caret"></i><span class="calc-unit"></span><span class="calc-placeholder">?</span></div>
        <div class="calc-stamp" aria-hidden="true"><span class="calc-stamp-in"><b></b><small>${t('Correct')}</small></span></div>
      </div>
      <div class="calc-pad" role="group" aria-label="${t('Number pad')}">
        ${['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map(k => `<button type="button" class="calc-key ${k === '⌫' ? 'calc-key-del' : ''}" data-k="${k}" aria-label="${k === '⌫' ? t('Delete') : k === '.' ? t('Decimal point') : k}">${k}</button>`).join('')}
        ${needMinus ? `<button type="button" class="calc-key calc-key-neg" data-k="-" aria-label="${t('Minus')}">−</button>` : ''}
      </div>
      <div class="calc-acts">
        <button type="button" class="calc-hint">💡 ${t('Hint')}</button>
        <button type="button" class="calc-check">${t('Check')} <span aria-hidden="true">✓</span></button>
        <button type="button" class="calc-next" hidden>${t('Next')} <span aria-hidden="true">→</span></button>
      </div>
    </div>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svgEl = $('.calc-svg'), digits = $('.calc-digits'), display = $('.calc-display'), stamp = $('.calc-stamp');
  const board = $('.calc-board'), linesEl = $('.calc-lines'), nib = $('.calc-nib');
  const btnCheck = $('.calc-check'), btnNext = $('.calc-next'), btnHint = $('.calc-hint');

  /* ----- scene ----- */
  function renderScene(first) {
    sctx?.revert();
    const used = new Set();
    const c = {
      id, api, items,
      pick(role, re, test) {
        const ok = i => !used.has(i) && (!test || test(i));
        const it = items.find(i => ok(i) && i.role === role) || (re ? items.find(i => ok(i) && !i.role && re.test(`${i.key} ${i.label}`)) : items.find(i => ok(i) && !i.role));
        if (it) used.add(it);
        return it || null;
      },
    };
    scene = SCENES[sceneName](c);
    svgEl.innerHTML = scene.svg;
    sctx = g.context(() => { const tl = g.timeline(); scene.play?.(svgEl, tl, first); });
  }
  renderScene(true);

  /* ----- sliders ----- */
  root.querySelectorAll('.calc-slider').forEach(lab => {
    const it = items.find(i => i.key === lab.dataset.key), inp = lab.querySelector('input'), out = lab.querySelector('output');
    let lastTick = 0;
    const paint = () => { const p = (it.value - +inp.min) / ((+inp.max - +inp.min) || 1) * 100; inp.style.setProperty('--p', `${p}%`); };
    paint();
    inp.addEventListener('input', () => {
      it.value = +inp.value; out.textContent = withUnit(it.value, it.unit); paint();
      renderScene(false); scene.kick?.(svgEl, it.key);
      const now = performance.now(); if (now - lastTick > 70) { api.sound('tick'); lastTick = now; }
      g.fromTo(out, { scale: 1.2 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
      if (workShown && !stamp.classList.contains('on')) showWorking(false);
    });
  });

  /* ----- answer entry ----- */
  function paintTyped(added) {
    digits.innerHTML = [...typed].map(ch => `<span>${ch === '-' ? '−' : esc(ch)}</span>`).join('');
    display.classList.toggle('empty', !typed);
    display.setAttribute('aria-label', typed ? t('Your answer: {n}', { n: typed }) : t('Your answer: empty'));
    if (added && !api.reduced) g.from(digits.lastElementChild, { y: -16, scale: 1.6, opacity: 0, duration: .28, ease: 'back.out(3)' });
  }
  function press(k) {
    if (busy || btnCheck.hidden) return;
    if (k === '⌫' || k === 'Backspace') { typed = typed.slice(0, -1); paintTyped(false); api.sound('click'); return; }
    if (k === '-') { typed = typed.startsWith('-') ? typed.slice(1) : `-${typed}`; paintTyped(false); api.sound('click'); return; }
    if (k === '.' && typed.includes('.')) return;
    if (!/^[\d.]$/.test(k) || typed.replace(/[-.]/g, '').length >= 9) return;
    typed += k; paintTyped(true); api.sound('click');
  }
  root.querySelectorAll('.calc-key').forEach(b => b.addEventListener('click', () => {
    press(b.dataset.k);
    if (!api.reduced) g.fromTo(b, { scale: .88 }, { scale: 1, duration: .35, ease: 'elastic.out(1.4,.4)' });
  }));
  const onKey = e => {
    if (e.target.matches?.('input[type=range]') && /^Arrow|Home|End|Page/.test(e.key)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[\d.]$/.test(e.key) || e.key === 'Backspace' || (e.key === '-' && needMinus)) {
      e.preventDefault(); press(e.key);
      const b = root.querySelector(`.calc-key[data-k="${e.key === 'Backspace' ? '⌫' : CSS.escape(e.key)}"]`);
      if (b && !api.reduced) g.fromTo(b, { scale: .88 }, { scale: 1, duration: .35, ease: 'elastic.out(1.4,.4)' });
    } else if (e.key === 'Enter' && !e.target.matches?.('button')) {
      e.preventDefault(); if (!btnNext.hidden) btnNext.click(); else check();
    }
  };
  api.root.addEventListener('keydown', onKey);

  /* ----- questions ----- */
  function showQuestion(first) {
    const q = qs[qi];
    misses = 0; typed = ''; workShown = false; paintTyped(false);
    $('.calc-pre').textContent = pre(q) ? unitOf(q) : '';
    $('.calc-unit').textContent = pre(q) ? '' : unitOf(q);
    stamp.classList.remove('on');
    root.classList.remove('solved');
    btnCheck.hidden = false; btnHint.hidden = false; btnNext.hidden = true;
    root.querySelectorAll('.calc-step').forEach((s, i) => { s.classList.toggle('on', i === qi); s.classList.toggle('done', i < qi); });
    root.querySelectorAll('.calc-chip.hl').forEach(c => c.classList.remove('hl'));
    const ask = $('.calc-ask');
    ask.textContent = q.ask || t('Work it out!');
    hideBoard();
    if (!first && !api.reduced) g.from(ask, { x: 40, opacity: 0, duration: .45, ease: 'power3.out' });
    if (!first) {
      api.say(q.ask, 'info');
      if (matchMedia('(max-width: 760px)').matches) $('.calc-q').scrollIntoView({ block: 'start', behavior: api.reduced ? 'auto' : 'smooth' });
    }
  }
  function target(q) { return evalExpr(q.answer, vars()); }
  function tolOf(q, t) { return q.tolerance ?? (Math.abs(t - Math.round(t)) < 1e-6 ? 0 : .051); }

  function check() {
    if (busy || btnCheck.hidden) return;
    const q = qs[qi];
    if (!typed || typed === '-' || typed === '.') { api.say(t('Type your answer on the number pad first.'), 'hint'); shake(api, display); return; }
    const x = parseFloat(typed);
    let want;
    try { want = target(q); } catch (e) { console.error(e); api.say(t('This question has a problem in its answer formula.'), 'bad'); return; }
    const tol = tolOf(q, want);
    if (Math.abs(x - want) <= tol + 1e-9) return right(q, want);
    misses++; api.mistake();
    shake(api, display);
    display.classList.add('wrong'); later(() => display.classList.remove('wrong'), 700);
    let why = '';
    if (want !== 0 && Math.abs(x - want * 100) < 1e-6) why = t('You may have multiplied by 100 one time too many.');
    else if (want !== 0 && Math.abs(x * 100 - want) < 1e-6) why = t('Nearly! Remember to multiply by 100 to turn it into a percentage.');
    else if (Math.abs(x - want) <= Math.max(1, Math.abs(want) * .03)) why = t('So close! Check your rounding.');
    if (misses === 1) {
      api.say(`${why || t('Not quite.')} ${q.hint || t('Look at the numbers in the picture again.')}`, 'bad');
      highlightChips(q);
    } else {
      api.say(misses === 2 ? `${why ? `${why} ` : ''}${t("Let's work it out together on the board. Then type the answer.")}` : t('Follow the board, line by line, and type the last number.'), 'hint');
      highlightChips(q);
      if (!workShown) showWorking(true);
    }
  }
  function highlightChips(q) {
    const ids = new Set(idsIn(q.answer));
    root.querySelectorAll('.calc-chip, .calc-slider').forEach(ch => {
      const on = ids.has(ch.dataset.key);
      ch.classList.toggle('hl', on);
      if (on && !api.reduced) g.fromTo(ch, { scale: 1.08 }, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.4)' });
    });
  }
  function workingFor(q) {
    const v = vars();
    const usesInput = idsIn(q.answer).some(k => inputNames.has(k));
    if (Array.isArray(q.working) && q.working.length && (!usesInput || q.working.some(w => /\{/.test(w)))) return q.working.map(w => fillTemplate(w, v));
    return autoWorking(q.answer, v, unitOf(q));
  }
  function hideBoard() { board.hidden = true; linesEl.innerHTML = ''; root.classList.remove('has-board'); }
  function showWorking(animate) {
    workShown = true;
    const lines = workingFor(qs[qi]);
    board.hidden = false; root.classList.add('has-board');
    linesEl.innerHTML = lines.map(l => `<li><span>${esc(l)}</span></li>`).join('');
    if (qs[qi].why && root.classList.contains('solved')) linesEl.insertAdjacentHTML('beforeend', `<li class="calc-why"><span>${esc(qs[qi].why)}</span></li>`);
    if (matchMedia('(max-width: 760px)').matches) board.scrollIntoView({ block: 'nearest', behavior: api.reduced ? 'auto' : 'smooth' });
    if (!animate || api.reduced) return g.timeline();
    const tl = g.timeline();
    tl.from(board, { y: 24, opacity: 0, duration: .35, ease: 'back.out(1.6)' });
    linesEl.querySelectorAll('li').forEach(li => {
      const sp = li.firstElementChild, w = sp.offsetWidth, d = clamp(sp.textContent.length * .045, .35, 1.3);
      tl.set(nib, { opacity: 1, x: sp.offsetLeft, y: li.offsetTop + li.offsetHeight / 2 })
        .fromTo(sp, { clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0% -20% 0)', duration: d, ease: 'none', onStart: () => api.sound('tick') })
        .to(nib, { x: sp.offsetLeft + w, duration: d, ease: 'none', onUpdate() { if (Math.random() < .25) dust(); } }, '<')
        .to({}, { duration: .18 });
    });
    tl.to(nib, { opacity: 0, duration: .2 });
    return tl;
  }
  function dust() {
    const p = document.createElement('i'); p.className = 'calc-dust';
    const fr = board.querySelector('.calc-board-frame');
    p.style.left = `${g.getProperty(nib, 'x') + 4}px`; p.style.top = `${g.getProperty(nib, 'y') + 6}px`;
    fr.append(p);
    g.to(p, { y: 30 + Math.random() * 20, x: (Math.random() - .5) * 16, opacity: 0, duration: .8, ease: 'power1.in', onComplete: () => p.remove() });
  }

  function right(q, want) {
    busy = true;
    if (q.key) answered[q.key] = want;
    root.classList.add('solved');
    btnCheck.hidden = true; btnHint.hidden = true;
    const shown = withUnit(+want.toFixed(2), unitOf(q));
    stamp.querySelector('b').textContent = shown;
    stamp.classList.add('on');
    api.sound('drop');
    if (!api.reduced) {
      g.timeline()
        .fromTo(stamp.firstElementChild, { scale: 2.6, rotation: -28, opacity: 0 }, { scale: 1, rotation: -9, opacity: 1, duration: .32, ease: 'power4.in' })
        .fromTo(display, { y: 0 }, { y: 5, duration: .06, yoyo: true, repeat: 1, ease: 'power1.out' })
        .add(() => { inkSplat(); sparkle(api, stamp); }, '<');
    } else g.set(stamp.firstElementChild, { rotation: -9, opacity: 1 });
    api.say(t(['Brilliant! {shown}.', 'Spot on! {shown}.', 'Yes! Well worked out. {shown}.', 'Correct! {shown}.'][qi % 4], { shown }), 'good');
    const step = root.querySelector(`.calc-step[data-i="${qi}"]`); step?.classList.add('done'); if (step) pop(api, step, 1.4);
    api.progress((qi + 1) / qs.length);
    scene.cheer?.(svgEl);
    later(() => {
      const tl = showWorking(true);
      tl.add(() => {
        busy = false;
        if (qi < qs.length - 1) { btnNext.hidden = false; btnNext.innerHTML = `${t('Next question')} <span aria-hidden="true">→</span>`; btnNext.focus({ preventScroll: true }); if (!api.reduced) g.from(btnNext, { scale: .6, opacity: 0, duration: .45, ease: 'back.out(2.5)' }); }
        else finish();
      });
    }, 650);
  }
  function inkSplat() {
    const r = stamp.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('i'); p.className = 'calc-ink';
      stamp.append(p);
      const a = Math.random() * Math.PI * 2, d = r.width * (.45 + Math.random() * .25);
      g.fromTo(p, { x: 0, y: 0, scale: .2 + Math.random() * .8, opacity: .8 }, { x: Math.cos(a) * d, y: Math.sin(a) * d * .6, duration: .25, ease: 'power3.out' });
    }
  }
  function finish() {
    const ribbon = h(`<div class="calc-done"><span>🎉 ${t('All {n} solved!', { n: qs.length })}</span></div>`);
    $('.calc-r').append(ribbon);
    if (!api.reduced) g.from(ribbon, { scale: .3, rotation: -12, opacity: 0, duration: .6, ease: 'back.out(2.2)' });
    later(() => api.complete(), 1500);
  }

  btnCheck.addEventListener('click', check);
  btnHint.addEventListener('click', () => {
    const q = qs[qi]; api.sound('pop');
    highlightChips(q);
    api.say(q.hint || t('Look for the numbers you need in the picture.'), 'hint');
  });
  btnNext.addEventListener('click', () => {
    if (busy) return;
    api.sound('whoosh'); qi++;
    showQuestion(false);
    display.focus({ preventScroll: true });
  });
  display.addEventListener('click', () => display.focus({ preventScroll: true }));

  if (!qs.length) { $('.calc-ask').textContent = t('No questions in this lab.'); return { destroy() { sctx?.revert(); } }; }
  showQuestion(true);
  api.say(`${cfg.mission ? `${cfg.mission} ` : ''}`.trim() || qs[0].ask);

  return {
    destroy() {
      timers.forEach(clearTimeout);
      api.root.removeEventListener('keydown', onKey);
      sctx?.revert();
      g.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

/* ---------------------------------------------------------------- demo */
export const demo = {
  title: 'Seed germination check',
  mission: 'Your class sowed spinach (palak) seeds in a tray. Count what came up, then work out the germination percentage.',
  fact: 'Spinach seeds usually sprout in 7 to 10 days if the soil stays moist and cool.',
  scene: 'seed-tray',
  givens: [
    { key: 'sown', label: 'Seeds sown', value: 50, unit: 'seeds', sprite: 'seed' },
    { key: 'sprouted', label: 'Seeds sprouted', value: 42, unit: 'seeds', sprite: 'seedling' },
  ],
  questions: [
    { ask: 'How many seeds did NOT sprout?', answer: 'sown - sprouted', unit: 'seeds', key: 'failed', hint: 'Take the sprouted seeds away from the seeds sown.', working: ['50 − 42 = 8 seeds'] },
    { ask: 'What is the germination percentage?', answer: '(sprouted / sown) * 100', unit: '%', tolerance: .5, hint: 'Divide sprouted by sown, then multiply by 100.', working: ['42 ÷ 50 = 0.84', '0.84 × 100 = 84%'], why: 'Above 80% is a healthy batch of seeds.' },
    { ask: 'Slide to pick a seed packet. About how many of its seeds will sprout?', answer: 'packet * sprouted / sown', unit: 'seeds', hint: 'Use the same fraction: 42 out of every 50 seeds sprout.', working: ['{packet} ÷ 50 = {=packet / 50} trays of 50', '{=packet / 50} × 42 = {=packet * sprouted / sown} seeds'] },
  ],
  inputs: [
    { key: 'packet', label: 'Seeds in a new packet', min: 50, max: 500, step: 50, value: 200, unit: 'seeds' },
  ],
  win: 'You can now check any batch of seeds before planting!',
};
