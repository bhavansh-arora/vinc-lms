// VINC Lab · lab type `mix`: pour ingredients into a vessel and read analogue meters.
// See ../SPEC.md §2.5. Extra (optional) config: ingredient `form: 'liquid'|'powder'|'solid'|'drops'`
// (otherwise guessed from the unit and label). The contents' colour is the amount-weighted average (RGB)
// of the `color` of every ingredient present (ingredients without a colour are ignored); `colorNear`
// is the Euclidean RGB distance to that colour. Meter values are sum(props[key] * amount), except `ph`, which is the
// amount-weighted average over ingredients that define props.ph (7 when there are none).
import { h, esc, shake, pop, sparkle } from '../kit.js';

export const meta = { title: 'Mix it right', needs: ['gsap'] };

const NS = 'http://www.w3.org/2000/svg';
const W = 400, H = 400;
const n1 = v => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = v => (Math.round(v * 10) / 10).toString();

/* ---------- colour ---------- */
const hex2rgb = h => { let s = String(h || '#ccc').replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join(''); const n = parseInt(s, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2hex = c => '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const shade = (c, k) => rgb2hex(k < 0 ? mixc(c, [0, 0, 0], -k) : mixc(c, [255, 255, 255], k));
const PH = ['#E6262A', '#EE4B2B', '#F47B20', '#F9A51B', '#F6D51E', '#CFE021', '#8DC63F', '#3FAE49', '#1E9C77', '#1C8AB8', '#2A62AE', '#3D47A0', '#5A3A96', '#6B2C8F', '#4B1F6B'];
const phColor = v => { const i = clamp(v, 0, 14), a = Math.floor(i), b = Math.min(14, a + 1); return rgb2hex(mixc(hex2rgb(PH[a]), hex2rgb(PH[b]), i - a)); };

/* ---------- vessels ---------- */
function vesselArt(kind) {
  const V = { kind };
  switch (kind) {
    case 'bowl':
      Object.assign(V, { mode: 'top', open: { cx: 200, cy: 222, rx: 138, ry: 36 }, depth: 62, taper: .42, bottomY: 352 });
      V.back = `<ellipse cx="200" cy="372" rx="120" ry="12" fill="#000" opacity=".18"/>
        <path d="M62 222C64 318 132 362 200 362C268 362 336 318 338 222Z" fill="url(#mx-bowl)"/>
        <path d="M150 360L156 374H244L250 360Z" fill="#C9D3DC"/><ellipse cx="200" cy="374" rx="44" ry="6" fill="#AEB9C4"/>`;
      V.front = `<path d="M62 222C64 318 132 362 200 362C268 362 336 318 338 222A138 36 0 0 1 62 222Z" fill="url(#mx-bowl)"/>
        <path d="M74 262C110 300 290 300 326 262" stroke="#2F6FB0" stroke-width="7" fill="none" opacity=".85"/><path d="M80 278C120 314 280 314 320 278" stroke="#F2B33D" stroke-width="3" fill="none" opacity=".9"/>
        <ellipse cx="200" cy="222" rx="138" ry="36" fill="none" stroke="#fff" stroke-width="5"/><ellipse cx="200" cy="222" rx="138" ry="36" fill="none" stroke="#C9D3DC" stroke-width="1.5"/>
        <path d="M86 244C96 290 130 330 170 344" stroke="#fff" stroke-width="7" opacity=".45" fill="none" stroke-linecap="round"/>`;
      break;
    case 'pot':
      Object.assign(V, { mode: 'top', open: { cx: 200, cy: 172, rx: 114, ry: 30 }, depth: 118, taper: .04, bottomY: 352 });
      V.back = `<ellipse cx="200" cy="372" rx="128" ry="12" fill="#000" opacity=".18"/>
        <path d="M86 172V338Q86 362 120 364H280Q314 362 314 338V172Z" fill="url(#mx-steel)"/>
        <path d="M86 200C60 200 52 214 62 226L86 224M314 200C340 200 348 214 338 226L314 224" stroke="#7D8791" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      V.front = `<path d="M86 172V338Q86 362 120 364H280Q314 362 314 338V172A114 30 0 0 1 86 172Z" fill="url(#mx-steel)"/>
        <path d="M108 196V330" stroke="#fff" stroke-width="9" opacity=".45" stroke-linecap="round"/><path d="M128 200V320" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
        <path d="M86 300H314" stroke="#5E6872" stroke-width="2" opacity=".3"/>
        <ellipse cx="200" cy="172" rx="114" ry="30" fill="none" stroke="#E9EEF2" stroke-width="7"/><ellipse cx="200" cy="172" rx="118" ry="32" fill="none" stroke="#8D98A3" stroke-width="1.5"/>`;
      break;
    case 'bucket':
      Object.assign(V, { mode: 'top', open: { cx: 200, cy: 150, rx: 112, ry: 28 }, depth: 128, taper: .2, bottomY: 356 });
      V.back = `<ellipse cx="200" cy="372" rx="110" ry="11" fill="#000" opacity=".18"/>
        <path d="M88 150C88 52 312 52 312 150" stroke="#8F969E" stroke-width="5" fill="none"/><rect x="180" y="74" width="40" height="10" rx="5" fill="#3B3F45"/>
        <path d="M88 150L116 352Q118 366 140 366H260Q282 366 284 352L312 150Z" fill="url(#mx-bucket)"/>`;
      V.front = `<path d="M88 150L116 352Q118 366 140 366H260Q282 366 284 352L312 150A112 28 0 0 1 88 150Z" fill="url(#mx-bucket)"/>
        <path d="M96 196Q200 222 304 196M104 260Q200 286 296 260" stroke="#1E4F84" stroke-width="3" fill="none" opacity=".45"/>
        <path d="M106 170L128 340" stroke="#9CC8F0" stroke-width="6" opacity=".5" stroke-linecap="round"/>
        <ellipse cx="200" cy="150" rx="112" ry="28" fill="none" stroke="#2F6FB0" stroke-width="9"/><ellipse cx="200" cy="148" rx="112" ry="28" fill="none" stroke="#7DB4E8" stroke-width="2"/>
        <circle cx="88" cy="152" r="5" fill="#3B3F45"/><circle cx="312" cy="152" r="5" fill="#3B3F45"/>`;
      break;
    case 'tank':
      Object.assign(V, { mode: 'side', poly: [[82, 150], [318, 150], [318, 354], [82, 354]], ry: 10 });
      V.back = `<ellipse cx="200" cy="372" rx="140" ry="10" fill="#000" opacity=".18"/><rect x="82" y="150" width="236" height="204" fill="rgba(200,230,245,.25)"/>`;
      V.front = `<rect x="78" y="146" width="244" height="212" rx="6" fill="none" stroke="rgba(150,200,225,.95)" stroke-width="6"/>
        <rect x="70" y="138" width="260" height="12" rx="3" fill="#2E3B44"/><rect x="70" y="354" width="260" height="14" rx="3" fill="#2E3B44"/>
        <path d="M96 166H128L96 240Z" fill="#fff" opacity=".25"/><path d="M302 270V340" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`;
      break;
    case 'jar': {
      const p = [[160, 122], [240, 122], [240, 146]];
      for (let i = 1; i <= 6; i++) { const a = i / 6 * Math.PI / 2; p.push([240 + 42 * Math.sin(a), 146 + 44 * (1 - Math.cos(a))]); }
      p.push([282, 336]);
      for (let i = 1; i <= 5; i++) { const a = i / 5 * Math.PI / 2; p.push([282 - 20 * (1 - Math.cos(a)), 336 + 20 * Math.sin(a)]); }
      p.push([138, 356]);
      for (let i = 1; i <= 5; i++) { const a = i / 5 * Math.PI / 2; p.push([138 - 20 * Math.sin(a), 356 - 20 * (1 - Math.cos(a))]); }
      for (let i = 0; i <= 6; i++) { const a = (6 - i) / 6 * Math.PI / 2; p.push([160 - 42 * Math.sin(a), 146 + 44 * (1 - Math.cos(a))]); }
      p.push([160, 146]);
      Object.assign(V, { mode: 'side', poly: p.map(q => q.map(n1)), ry: 8 });
      const d = 'M' + V.poly.map(q => q.join(' ')).join('L') + 'Z';
      V.back = `<ellipse cx="200" cy="372" rx="100" ry="10" fill="#000" opacity=".18"/><path d="${d}" fill="rgba(210,235,248,.25)"/>
        <g transform="translate(318 340) rotate(-8)"><ellipse cx="0" cy="18" rx="38" ry="7" fill="#000" opacity=".15"/><rect x="-36" y="-2" width="72" height="18" rx="5" fill="#C2502A"/><rect x="-36" y="-2" width="72" height="5" rx="2.5" fill="#E07A52"/><path d="M-30 6H30" stroke="#8E3A1C" stroke-width="1.5" opacity=".6"/></g>`;
      V.front = `<path d="${d}" fill="none" stroke="rgba(150,200,225,.95)" stroke-width="5" stroke-linejoin="round"/>
        <rect x="154" y="116" width="92" height="12" rx="5" fill="rgba(170,210,232,.9)"/><path d="M156 134H244" stroke="rgba(170,210,232,.9)" stroke-width="3"/>
        <path d="M134 204V320" stroke="#fff" stroke-width="8" opacity=".45" stroke-linecap="round"/><path d="M150 214V270" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
      break;
    }
    default: // glass
      Object.assign(V, { mode: 'side', poly: [[137, 118], [263, 118], [250, 350], [150, 350]], ry: 8 });
      V.back = `<ellipse cx="200" cy="376" rx="76" ry="9" fill="#000" opacity=".18"/>
        <path d="M133 114L148 356Q150 372 168 372H232Q250 372 252 356L267 114Z" fill="rgba(215,238,250,.22)"/>
        <ellipse cx="200" cy="116" rx="67" ry="9" fill="none" stroke="rgba(160,200,225,.7)" stroke-width="2.5"/>`;
      V.front = `<path d="M133 114L148 356Q150 372 168 372H232Q250 372 252 356L267 114" fill="none" stroke="rgba(150,196,222,.95)" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M150 350H250L248 364Q246 370 236 370H164Q154 370 152 364Z" fill="rgba(200,230,245,.55)"/>
        <path d="M133 116A67 9 0 0 0 267 116" fill="none" stroke="rgba(150,196,222,.95)" stroke-width="3.5"/>
        <path d="M146 132L158 336" stroke="#fff" stroke-width="8" opacity=".5" stroke-linecap="round"/><path d="M162 140L168 220" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/><path d="M252 150L244 300" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>`;
  }
  if (V.mode === 'side') {
    const ys = V.poly.map(p => p[1]);
    V.top = Math.min(...ys); V.bottom = Math.max(...ys);
    V.maxY = V.top + (V.bottom - V.top) * .12;
  }
  V.mouth = V.mode === 'side' ? V.top : V.open.cy;
  return V;
}
function xRange(poly, y) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    if (y >= Math.min(y1, y2) && y <= Math.max(y1, y2) && y1 !== y2) { const x = x1 + (y - y1) / (y2 - y1) * (x2 - x1); lo = Math.min(lo, x); hi = Math.max(hi, x); }
  }
  return lo === Infinity ? [190, 210] : [lo, hi];
}

const DEFS = `
  <linearGradient id="mx-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EBDA"/><stop offset="1" stop-color="#EAD9BF"/></linearGradient>
  <pattern id="mx-tiles" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="none"/><path d="M40 0H0V40" fill="none" stroke="#D9C6A6" stroke-width="1.5"/></pattern>
  <linearGradient id="mx-counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9844E"/><stop offset="1" stop-color="#8E5F37"/></linearGradient>
  <linearGradient id="mx-bowl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FBF7F0"/><stop offset=".6" stop-color="#ECE4D6"/><stop offset="1" stop-color="#CFC4B2"/></linearGradient>
  <linearGradient id="mx-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9D1D8"/><stop offset=".3" stop-color="#EEF2F5"/><stop offset=".65" stop-color="#AAB4BE"/><stop offset="1" stop-color="#7D8791"/></linearGradient>
  <linearGradient id="mx-bucket" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A90D2"/><stop offset=".55" stop-color="#3A7CBE"/><stop offset="1" stop-color="#2A5F9A"/></linearGradient>
  <linearGradient id="mx-inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".05"/></linearGradient>
  <linearGradient id="mx-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
  <linearGradient id="mx-spoon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F7F9"/><stop offset="1" stop-color="#9AA5B0"/></linearGradient>
  <radialGradient id="mx-surf" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

function formOf(ing) {
  if (ing.form) return ing.form;
  const u = String(ing.unit || '').toLowerCase(), l = String(ing.label || '').toLowerCase();
  if (/^drops?$/.test(u)) return 'drops';
  if (/^(piece|pieces|slice|slices|leaf|leaves|handful|cube|cubes|whole)$/.test(u)) return 'solid';
  if (/^(pinch|g|gram|grams|kg|tsp powder)$/.test(u) || /sugar|salt|powder|flour|jaggery|gur|masala|besan|soda|spice|haldi|turmeric|atta|dust|meal/.test(l)) return 'powder';
  return 'liquid';
}
const VOL = { liquid: 1, powder: .22, solid: .45, drops: .05 };
const TOOL = u => /^(cup|cups|glass|glasses|mug|mugs|litre|litres|l|ml|bottle|jug|bowl)$/i.test(u || '') ? 'jug' : 'spoon';

export function mount(stage, cfg, api) {
  const { gsap } = api;
  const ings = (cfg.ingredients || []).map(i => ({ ...i, form: formOf(i), max: i.max ?? 5 }));
  const meters = cfg.meters || [];
  const rules = cfg.target?.rules || [];
  const kind = ['glass', 'bowl', 'pot', 'bucket', 'tank', 'jar'].includes(cfg.vessel) ? cfg.vessel : 'glass';
  const V = vesselArt(kind);
  const amt = Object.fromEntries(ings.map(i => [i.key, 0]));
  const history = [];
  const timers = [];
  let solved = false, busy = 0, checks = 0;

  const unitWord = (i, n) => { const u = i.unit || 'spoon'; return n === 1 ? u : /s$|ml$|^g$|^kg$|^l$/i.test(u) ? u : /(ch|sh)$/.test(u) ? u + 'es' : u + 's'; };
  const meterLabel = k => meters.find(m => m.key === k)?.label || k;
  const zoneOf = k => { const r = rules.find(x => x.meter === k); return r ? [r.min ?? -Infinity, r.max ?? Infinity] : null; };

  const root = h(`<div class="lab-mix mx-v-${kind}">
    <section class="mx-shelf" aria-label="Ingredients">
      <h3 class="lab-h">Ingredients</h3>
      <p class="mx-tip">Tap to add one ${ings.length ? 'measure' : ''}, or drag it into the ${esc(kind)}.</p>
      <div class="mx-ings"></div>
    </section>
    <div class="mx-mid">
      <button type="button" class="mx-drop" aria-label="The ${esc(kind)}. Drop an ingredient here.">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="A ${esc(kind)} on the kitchen counter">
          <defs>${DEFS}${V.mode === 'side' ? `<clipPath id="mx-clip"><polygon points="${V.poly.map(p => p.join(',')).join(' ')}"/></clipPath>` : `<clipPath id="mx-clip"><ellipse cx="${V.open.cx}" cy="${V.open.cy}" rx="${V.open.rx - 3}" ry="${V.open.ry - 2}"/></clipPath>`}</defs>
          <rect width="${W}" height="${H}" class="mx-bg-wall"/><rect width="${W}" height="352" fill="url(#mx-tiles)" class="mx-bg-tiles"/>
          <path d="M0 352H${W}V${H}H0Z" fill="url(#mx-counter)"/><path d="M0 352H${W}" stroke="#D9A86F" stroke-width="3"/>
          <g class="mx-back">${V.back}</g>
          <g clip-path="url(#mx-clip)" class="mx-inside">
            ${V.mode === 'top' ? `<ellipse cx="${V.open.cx}" cy="${V.open.cy}" rx="${V.open.rx}" ry="${V.open.ry}" class="mx-innerwall"/><ellipse cx="${V.open.cx}" cy="${V.open.cy}" rx="${V.open.rx}" ry="${V.open.ry}" fill="url(#mx-inner)"/>` : ''}
            <g class="mx-liquid" opacity="0"><path class="mx-body"/><path class="mx-shadeov" fill="url(#mx-depth)"/><path class="mx-surface"/><path class="mx-gloss" fill="url(#mx-surf)"/><path class="mx-hl" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/></g>
            <path class="mx-heap" opacity="0"/>
            <g class="mx-bubbles"></g><g class="mx-pieces"></g><g class="mx-clouds"></g>
          </g>
          <g class="mx-front">${V.front}</g>
          <g class="mx-fx"></g>
        </svg>
      </button>
      <div class="mx-acts">
        <button type="button" class="lab-act ghost mx-undo" disabled>↶ Undo</button>
        <button type="button" class="lab-act ghost mx-empty" disabled>Empty</button>
        <button type="button" class="lab-act mx-check" disabled>Check</button>
      </div>
    </div>
    <section class="mx-side">
      <div class="mx-target"><p class="mx-kicker">Your goal</p><p class="mx-goal">${esc(cfg.target?.text || cfg.mission || '')}</p><ul class="mx-rules"></ul></div>
      <div class="mx-meters"></div>
    </section>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('.mx-drop svg'), fx = $('.mx-fx'), piecesG = $('.mx-pieces'), bubblesG = $('.mx-bubbles'), cloudsG = $('.mx-clouds');
  const liq = $('.mx-liquid'), body = $('.mx-body'), shadeov = $('.mx-shadeov'), surface = $('.mx-surface'), gloss = $('.mx-gloss'), hl = $('.mx-hl'), heap = $('.mx-heap');
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.append(e); return e; };

  /* ---------- ingredient buttons ---------- */
  const ingEls = ings.map(i => {
    const b = h(`<button type="button" class="mx-ing" data-key="${esc(i.key)}" style="--c:${esc(i.color || '#ccc')}">
      <span class="mx-ing-art">${api.art(i) || `<span class="mx-blob"></span>`}</span>
      <span class="mx-ing-t"><b>${esc(i.label)}</b><small>1 ${esc(i.unit || 'spoon')} each</small></span>
      <span class="mx-pips" aria-hidden="true">${Array.from({ length: Math.min(i.max, 10) }, () => '<i></i>').join('')}</span>
      <span class="mx-n" aria-live="polite">0</span></button>`);
    b._ing = i;
    $('.mx-ings').append(b);
    return b;
  });

  /* ---------- meters ---------- */
  const meterEls = meters.map(m => {
    const lo = m.min ?? 0, hi = m.max ?? 10, z = zoneOf(m.key);
    let html;
    if (m.key === 'ph') {
      const pct = v => clamp((v - lo) / (hi - lo), 0, 1) * 100;
      const stops = PH.map((c, i) => `${c} ${clamp((i - lo) / (hi - lo), 0, 1) * 100}%`).join(',');
      html = `<div class="mx-meter mx-ph"><div class="mx-m-h"><b>${esc(m.label || 'pH')}</b><span class="mx-m-v">7</span></div>
        <div class="mx-ph-row"><span class="mx-ph-paper"><i></i></span>
        <div class="mx-ph-scale"><div class="mx-ph-bar" style="background:linear-gradient(90deg,${stops})">${z ? `<span class="mx-ph-zone" style="left:${pct(Math.max(lo, z[0]))}%;width:${pct(Math.min(hi, z[1])) - pct(Math.max(lo, z[0]))}%"></span>` : ''}</div>
        <span class="mx-ph-mark"></span><div class="mx-ph-ticks"><span>${lo}</span><span>acid</span><span>${(lo + hi) / 2}</span><span>base</span><span>${hi}</span></div></div></div>
        <p class="mx-ph-word">neutral</p></div>`;
    } else {
      const A = v => Math.PI * (1 - clamp((v - lo) / (hi - lo), 0, 1)), P = (v, r) => [100 + Math.cos(A(v)) * r, 102 - Math.sin(A(v)) * r];
      const arc = (a, b, r) => { const [x1, y1] = P(a, r), [x2, y2] = P(b, r); return `M${n1(x1)} ${n1(y1)}A${r} ${r} 0 0 1 ${n1(x2)} ${n1(y2)}`; };
      let ticks = ''; for (let k = 0; k <= 10; k++) { const v = lo + (hi - lo) * k / 10, [x1, y1] = P(v, 80), [x2, y2] = P(v, k % 5 ? 72 : 66); ticks += `<path d="M${n1(x1)} ${n1(y1)}L${n1(x2)} ${n1(y2)}" class="mx-tick${k % 5 ? '' : ' big'}"/>`; }
      html = `<div class="mx-meter"><div class="mx-m-h"><b>${esc(m.label || m.key)}</b><span class="mx-m-v">0</span></div>
        <svg viewBox="0 0 200 116" class="mx-gauge" aria-hidden="true">
          <path d="${arc(lo, hi, 84)}" class="mx-track"/>
          ${z ? `<path d="${arc(Math.max(lo, z[0]), Math.min(hi, z[1]), 84)}" class="mx-zone"/>` : ''}
          ${ticks}
          <text x="${n1(P(lo, 56)[0] + 4)}" y="${n1(P(lo, 56)[1])}" class="mx-num">${lo}</text><text x="${n1(P(hi, 56)[0] - 4)}" y="${n1(P(hi, 56)[1])}" class="mx-num" text-anchor="end">${hi}</text>
          <g class="mx-needle"><path d="M-3 0L0 -76L3 0Z" class="mx-needle-p"/><circle r="8" class="mx-hub"/><circle r="3" fill="#fff"/></g>
        </svg></div>`;
    }
    const e = h(html); e._m = m; $('.mx-meters').append(e);
    if (m.key !== 'ph') { const nd = e.querySelector('.mx-needle'); nd.setAttribute('transform', 'translate(100 102) rotate(-90)'); e._needle = { rot: -90 }; }
    return e;
  });

  /* ---------- rule list ---------- */
  const ruleText = r => {
    if (r.meter) { const m = meters.find(x => x.key === r.meter); const lbl = m?.label || r.meter; return r.min != null && r.max != null ? `${lbl}: between ${r.min} and ${r.max}` : r.min != null ? `${lbl}: at least ${r.min}` : `${lbl}: at most ${r.max}`; }
    if (r.amount) { const i = ings.find(x => x.key === r.amount); const lbl = i?.label || r.amount, u = i ? unitWord(i, 2) : ''; return r.min != null && r.max != null ? (r.min === r.max ? `${lbl}: exactly ${r.min} ${i ? unitWord(i, r.min) : ''}` : `${lbl}: ${r.min}–${r.max} ${u}`) : r.min != null ? `${lbl}: at least ${r.min} ${u}` : `${lbl}: at most ${r.max} ${u}`; }
    if (r.colorNear) return 'Colour like this';
    return '';
  };
  const rulesUl = $('.mx-rules');
  const ruleEls = rules.map(r => { const li = h(`<li><span class="mx-r-ic" aria-hidden="true"></span><span>${esc(ruleText(r))}</span>${r.colorNear ? `<i class="mx-sw" style="background:${esc(r.colorNear)}"></i>` : ''}</li>`); rulesUl.append(li); return li; });

  /* ---------- state & maths ---------- */
  const values = () => {
    const out = {};
    for (const m of meters) {
      if (m.key === 'ph') {
        let s = 0, w = 0; for (const i of ings) if (amt[i.key] > 0 && i.props?.ph != null) { s += i.props.ph * amt[i.key]; w += amt[i.key]; }
        out.ph = w ? s / w : 7;
      } else out[m.key] = ings.reduce((s, i) => s + (i.props?.[m.key] || 0) * amt[i.key], 0);
    }
    return out;
  };
  const mixColor = () => {
    let w = 0; const c = [0, 0, 0];
    for (const i of ings) { if (!i.color || !amt[i.key]) continue; const k = amt[i.key]; const rgb = hex2rgb(i.color); c[0] += rgb[0] * k; c[1] += rgb[1] * k; c[2] += rgb[2] * k; w += k; }
    return w ? c.map(v => v / w) : null;
  };
  const capacity = ings.reduce((s, i) => s + i.max * VOL[i.form], 0) || 1;
  const liquidVol = () => ings.reduce((s, i) => s + (i.form === 'liquid' || i.form === 'drops' ? amt[i.key] * VOL[i.form] : 0), 0);
  const totalVol = () => ings.reduce((s, i) => s + amt[i.key] * VOL[i.form], 0);
  const L = { lvl: 0, heap: 0, amp: 0, c: [220, 238, 247] };
  let tAll = 0;

  /* ---------- rendering of the contents ---------- */
  function sideSurfaceY(lvl) { return V.bottom - 4 - (V.bottom - 4 - V.maxY) * lvl; }
  function render() {
    const col = rgb2hex(L.c);
    if (V.mode === 'side') {
      const y = sideSurfaceY(L.lvl), [x0, x1] = xRange(V.poly, Math.max(V.top + 1, y));
      const pts = []; for (let x = x0 - 6; x <= x1 + 6; x += 8) pts.push([x, y + Math.sin(x * .07 + tAll * 6) * L.amp + Math.sin(x * .13 - tAll * 4) * L.amp * .5]);
      const top = 'M' + pts.map(p => `${n1(p[0])} ${n1(p[1])}`).join('L');
      const d = `${top}L${n1(x1 + 6)} ${V.bottom + 6}L${n1(x0 - 6)} ${V.bottom + 6}Z`;
      body.setAttribute('d', d); body.setAttribute('fill', col); shadeov.setAttribute('d', d);
      const rx = (x1 - x0) / 2, cx = (x0 + x1) / 2, ry = Math.min(V.ry, rx * .14);
      const sd = `M${n1(x0)} ${n1(y)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(x1)} ${n1(y)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(x0)} ${n1(y)}Z`;
      surface.setAttribute('d', sd); surface.setAttribute('fill', shade(L.c, .28)); gloss.setAttribute('d', sd);
      hl.setAttribute('d', top);
      body.setAttribute('opacity', '.86');
      // heap of powder when there is no liquid
      const hh = L.heap * 40, [hx0, hx1] = xRange(V.poly, V.bottom - 2);
      heap.setAttribute('d', `M${n1(hx0 - 4)} ${V.bottom + 2}Q${n1((hx0 + hx1) / 2)} ${n1(V.bottom - hh * 2)} ${n1(hx1 + 4)} ${V.bottom + 2}Z`);
    } else {
      const o = V.open, s = L.lvl, dy = (1 - s) * V.depth, k = 1 - (1 - s) * V.taper;
      const cy = o.cy + dy + Math.sin(tAll * 5) * L.amp * .3, rx = o.rx * k - 4, ry = o.ry * k - 2;
      const sd = `M${n1(o.cx - rx)} ${n1(cy)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(o.cx + rx)} ${n1(cy)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(o.cx - rx)} ${n1(cy)}Z`;
      body.setAttribute('d', sd); body.setAttribute('fill', col); body.setAttribute('opacity', '1');
      surface.setAttribute('d', sd); surface.setAttribute('fill', 'none'); surface.setAttribute('stroke', shade(L.c, -.2)); surface.setAttribute('stroke-width', '3');
      gloss.setAttribute('d', sd); shadeov.setAttribute('d', '');
      const wob = L.amp * 1.4;
      hl.setAttribute('d', `M${n1(o.cx - rx * .6)} ${n1(cy - ry * .45 + Math.sin(tAll * 7) * wob)}Q${n1(o.cx)} ${n1(cy - ry * .75 - Math.sin(tAll * 7) * wob)} ${n1(o.cx + rx * .5)} ${n1(cy - ry * .5)}`);
      const hk = 1 - (1 - L.heap * .5) * V.taper, hcy = o.cy + V.depth * (1 - L.heap * .35);
      heap.setAttribute('d', `M${n1(o.cx - o.rx * hk * .6)} ${n1(hcy)}Q${n1(o.cx)} ${n1(hcy - 30 * L.heap)} ${n1(o.cx + o.rx * hk * .6)} ${n1(hcy)}A${n1(o.rx * hk * .6)} ${n1(o.ry * .5)} 0 0 1 ${n1(o.cx - o.rx * hk * .6)} ${n1(hcy)}Z`);
    }
    // pieces bob on the surface
    for (const p of pieces) placePiece(p);
  }
  const tick = () => { tAll += gsap.ticker.deltaRatio() / 60; L.amp *= .965; if (L.amp < .05) L.amp = 0; render(); };
  gsap.ticker.add(tick);

  /* ---------- solids as pieces ---------- */
  const pieces = [];
  function placePiece(p) {
    let x, y;
    if (V.mode === 'side') {
      const hasLiquid = liquidVol() > 0;
      const yS = hasLiquid ? sideSurfaceY(L.lvl) : V.bottom - 8 - p.stack * 12;
      const [x0, x1] = xRange(V.poly, clamp(yS, V.top + 2, V.bottom - 2));
      x = x0 + 16 + (x1 - x0 - 32) * p.u;
      y = hasLiquid ? yS + 4 + p.v * Math.min(40, V.bottom - yS - 14) + Math.sin(tAll * 2 + p.ph) * 1.5 : yS;
    } else {
      const o = V.open, s = Math.max(L.lvl, L.heap * .4, .08 + p.stack * .06), k = 1 - (1 - s) * V.taper, cy = o.cy + (1 - s) * V.depth;
      const a = p.u * Math.PI * 2, rr = Math.sqrt(p.v) * .78;
      x = o.cx + Math.cos(a) * (o.rx * k - 22) * rr; y = cy + Math.sin(a) * (o.ry * k - 6) * rr - 6 + Math.sin(tAll * 2 + p.ph) * (L.lvl > 0 ? 1.2 : 0);
    }
    p.g.setAttribute('transform', `translate(${n1(x + p.dx)} ${n1(y + p.dy)}) rotate(${n1(p.rot + Math.sin(tAll * 1.5 + p.ph) * 4)}) scale(${n1(p.sc)})`);
  }
  function artSvg(item, size) {
    if (item.sprite && api.hasSprite(item.sprite)) return api.sprite(item.sprite).replace('<svg ', `<svg x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" style="width:${size}px;height:${size}px" `);
    const em = item.emoji || (/>([^<]+)<\/span>/.exec(api.art(item) || '')?.[1]) || '●';
    return `<text x="0" y="${size * .32}" font-size="${size * .8}" text-anchor="middle">${esc(em)}</text>`;
  }

  /* ---------- pouring ---------- */
  const mouthX = 200, mouthY = V.mouth;
  function targetY() { return V.mode === 'side' ? (liquidVol() > 0 ? sideSurfaceY(L.lvl) : V.bottom - 10) : V.open.cy + (1 - Math.max(L.lvl, .1)) * V.depth; }
  function add(ing, fromDrag) {
    if (solved) return;
    if (amt[ing.key] >= ing.max) { api.say(`That's the most ${ing.label.toLowerCase()} you can add (${ing.max} ${unitWord(ing, ing.max)}).`, 'hint'); shake(api, ingEls[ings.indexOf(ing)]); return; }
    amt[ing.key]++; history.push(ing.key);
    const b = ingEls[ings.indexOf(ing)];
    pop(api, b, 1.08);
    updateIngs();
    busy++;
    const T = { liquid: pourLiquid, drops: pourDrops, powder: pourPowder, solid: dropSolid }[ing.form];
    const land = () => { busy--; settle(ing); };
    if (api.reduced) { land(); return; }
    T(ing, land, fromDrag);
  }
  function settle(ing) {
    const lv = liquidVol(), tot = totalVol();
    const lvl = lv > 0 ? clamp(.12 + .84 * tot / (capacity * .72), .12, .97) : 0;
    const hp = lv > 0 ? 0 : clamp(ings.reduce((s, i) => s + (i.form === 'powder' ? amt[i.key] : 0), 0) / 6, 0, 1);
    const c = mixColor() || hex2rgb(ing?.color || '#DDEEF7');
    gsap.to(L, { lvl, heap: hp, duration: api.reduced ? .1 : .8, ease: 'power2.out' });
    gsap.to(L.c, { 0: c[0], 1: c[1], 2: c[2], duration: api.reduced ? .1 : 1.1, ease: 'power1.inOut' });
    gsap.to(liq, { opacity: lv > 0 ? 1 : 0, duration: .4 });
    heap.setAttribute('fill', rgb2hex(c));
    gsap.to(heap, { opacity: lv > 0 ? 0 : 1, duration: .4 });
    if (ing) { L.amp = Math.min(6, L.amp + (ing.form === 'liquid' ? 4 : 2.2)); if (lv > 0) { ripple(); bubbles(ing.form === 'powder' ? 10 : 6); } }
    updateMeters();
    updateButtons();
    hintNow(ing);
  }
  function hintNow(ing) {
    if (!ing) return;
    const v = values();
    const parts = meters.map(m => `${m.label || m.key} ${fmt(v[m.key])}`);
    api.say(`+1 ${ing.unit || 'spoon'} ${ing.label.toLowerCase()}. ${parts.join(' · ')}`);
  }

  function spoonG(color, powder) {
    const g = el('g', {}, fx);
    g.innerHTML = `<path d="M8 0L120 -6Q126 -2 120 4L8 6Z" fill="url(#mx-spoon)" stroke="#7D8791" stroke-width="1"/>
      <ellipse cx="-12" cy="0" rx="26" ry="14" fill="url(#mx-spoon)" stroke="#7D8791" stroke-width="1.2"/>
      <ellipse class="mx-load" cx="-12" cy="${powder ? -4 : -1}" rx="20" ry="${powder ? 10 : 8}" fill="${color}"/>
      <ellipse cx="-20" cy="-4" rx="7" ry="3" fill="#fff" opacity=".5"/>`;
    return g;
  }
  function jugG(color) {
    const g = el('g', {}, fx);
    g.innerHTML = `<path d="M-30 -40H26L30 34Q30 42 22 42H-22Q-30 42 -30 34Z" fill="rgba(220,240,250,.55)" stroke="rgba(140,190,215,.95)" stroke-width="3"/>
      <path d="M-28 -6H28L29 34Q29 40 22 40H-22Q-28 40 -28 34Z" fill="${color}" opacity=".9"/>
      <path d="M-30 -40L-42 -48L-30 -30" fill="rgba(220,240,250,.7)" stroke="rgba(140,190,215,.95)" stroke-width="3" stroke-linejoin="round"/>
      <path d="M26 -28Q46 -28 46 0Q46 22 28 22" fill="none" stroke="rgba(140,190,215,.95)" stroke-width="5"/>
      <path d="M-22 -32V30" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>`;
    return g;
  }
  function pourLiquid(ing, land) {
    const col = ing.color || '#DDEEF7', jug = TOOL(ing.unit) === 'jug';
    const tool = jug ? jugG(col) : spoonG(col, false);
    const px = mouthX + (jug ? 52 : 40), py = mouthY - (jug ? 80 : 46);
    const tipX = jug ? mouthX + 6 : mouthX - 4;
    const P = { x: px + 150, y: py - 60, r: 0 };
    const set = () => tool.setAttribute('transform', `translate(${n1(P.x)} ${n1(P.y)}) rotate(${n1(P.r)})`);
    set();
    const y0 = mouthY - (jug ? 72 : 44), y1 = targetY();
    const strm = el('path', { d: `M${tipX} ${y0}L${tipX} ${y1}`, stroke: col, 'stroke-width': jug ? 10 : 5, 'stroke-linecap': 'round', opacity: .9 }, fx);
    const shine = el('path', { d: `M${tipX - 1} ${y0}L${tipX - 1} ${y1}`, stroke: '#fff', 'stroke-width': 2, opacity: .45 }, fx);
    gsap.set([strm, shine], { drawSVG: '0% 0%' });
    api.sound('whoosh');
    gsap.timeline({ onComplete: () => { tool.remove(); strm.remove(); shine.remove(); land(); } })
      .to(P, { x: px, y: py, duration: .4, ease: 'power2.out', onUpdate: set })
      .to(P, { r: jug ? -62 : -55, duration: .3, ease: 'power2.inOut', onUpdate: set })
      .add(() => { if (!jug) gsap.to(tool.querySelector('.mx-load'), { attr: { ry: 1 }, duration: .4 }); })
      .to([strm, shine], { drawSVG: '0% 100%', duration: .25, ease: 'power1.in' }, '-=.05')
      .add(() => { splash(tipX, y1, col, 6); api.sound('drop'); })
      .to([strm, shine], { drawSVG: '100% 100%', duration: .3, ease: 'power1.in' }, `+=${jug ? .5 : .2}`)
      .to(P, { r: 0, x: px + 160, y: py - 70, duration: .45, ease: 'power2.in', onUpdate: set }, '-=.1');
  }
  function pourDrops(ing, land) {
    const col = ing.color || '#C2502A', g = el('g', {}, fx);
    g.innerHTML = `<path d="M-5 -10L-2 30L0 36L2 30L5 -10Z" fill="rgba(220,240,250,.8)" stroke="rgba(140,190,215,.95)" stroke-width="2"/><path d="M-3 10L-1.5 30L0 34L1.5 30L3 10Z" fill="${col}"/><g class="mx-bulb"><path d="M-9 -10Q-12 -40 0 -44Q12 -40 9 -10Z" fill="#C2502A"/><path d="M-5 -36Q-6 -22 -5 -14" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/></g>`;
    const P = { x: mouthX + 120, y: mouthY - 110 };
    const set = () => g.setAttribute('transform', `translate(${n1(P.x)} ${n1(P.y)})`);
    set();
    const y1 = targetY();
    gsap.timeline({ onComplete: () => { g.remove(); land(); } })
      .to(P, { x: mouthX, y: mouthY - 70, duration: .45, ease: 'power2.out', onUpdate: set })
      .to(g.querySelector('.mx-bulb'), { scaleX: .7, transformOrigin: '50% 100%', duration: .15, yoyo: true, repeat: 1 })
      .add(() => {
        const d = el('path', { d: `M${mouthX} ${mouthY - 34}q-4 7 0 9q4 -2 0 -9z`, fill: col }, fx);
        gsap.to(d, { y: y1 - mouthY + 30, duration: .45, ease: 'power2.in', onComplete: () => { d.remove(); splash(mouthX, y1, col, 4); api.sound('drop'); } });
      }, '-=.1')
      .to(P, { x: mouthX + 130, y: mouthY - 120, duration: .4, ease: 'power2.in', onUpdate: set }, '+=.45');
  }
  function pourPowder(ing, land) {
    const col = ing.color || '#fff';
    const tool = spoonG(col, true);
    const px = mouthX + 40, py = mouthY - 50;
    const P = { x: px + 150, y: py - 60, r: 0 };
    const set = () => tool.setAttribute('transform', `translate(${n1(P.x)} ${n1(P.y)}) rotate(${n1(P.r)})`);
    set();
    const y1 = targetY();
    api.sound('whoosh');
    gsap.timeline({ onComplete: () => { tool.remove(); land(); } })
      .to(P, { x: px, y: py, duration: .4, ease: 'power2.out', onUpdate: set })
      .to(P, { r: -60, duration: .3, ease: 'power2.inOut', onUpdate: set })
      .add(() => {
        gsap.to(tool.querySelector('.mx-load'), { attr: { ry: 1, rx: 8 }, duration: .5 });
        for (let i = 0; i < 34; i++) {
          const p = el('circle', { cx: mouthX - 6 + rand(-6, 6), cy: mouthY - 46, r: rand(1, 2.3), fill: col, stroke: 'rgba(0,0,0,.18)', 'stroke-width': .5 }, fx);
          gsap.to(p, { y: y1 - mouthY + 46 - rand(0, 6), x: rand(-18, 18), duration: rand(.45, .7), delay: i * .014, ease: 'power2.in', onComplete: () => { p.remove(); } });
        }
        timers.push(setTimeout(() => { if (liquidVol() > 0) cloud(col, y1); api.sound('tick'); }, 450));
      })
      .to(P, { r: 0, x: px + 160, y: py - 70, duration: .45, ease: 'power2.in', onUpdate: set }, '+=.55');
  }
  function dropSolid(ing, land) {
    const size = 46, g = el('g', {}, fx);
    g.innerHTML = artSvg(ing, size);
    const P = { x: mouthX + rand(-30, 30), y: -40, r: rand(-40, 40) };
    const set = () => g.setAttribute('transform', `translate(${n1(P.x)} ${n1(P.y)}) rotate(${n1(P.r)})`);
    set();
    const y1 = targetY();
    api.sound('whoosh');
    gsap.timeline({ onComplete: () => { g.remove(); addPiece(ing); splash(P.x, y1, ing.color || '#9CD0EE', liquidVol() > 0 ? 8 : 0); api.sound('drop'); land(); } })
      .to(P, { y: y1 - 10, r: P.r + rand(-120, 120), duration: .6, ease: 'power2.in', onUpdate: set });
  }
  function addPiece(ing) {
    const g = el('g', { class: 'mx-piece', 'data-key': ing.key }, piecesG);
    g.innerHTML = artSvg(ing, 40);
    const n = pieces.filter(p => p.key === ing.key).length;
    const p = { g, key: ing.key, u: Math.random(), v: Math.random(), ph: rand(0, 6), rot: rand(-50, 50), sc: rand(.85, 1.1), dx: 0, dy: 0, stack: (pieces.length % 4) * .5 + n * .1 };
    pieces.push(p); placePiece(p);
    if (!api.reduced) gsap.from(p, { sc: .2, duration: .5, ease: 'back.out(3)' });
  }
  function splash(x, y, col, n) {
    if (api.reduced || !n) return;
    for (let i = 0; i < n; i++) {
      const d = el('circle', { cx: x, cy: y, r: rand(1.8, 3.4), fill: col, stroke: 'rgba(255,255,255,.7)', 'stroke-width': .8 }, fx);
      const a = rand(-Math.PI * .85, -Math.PI * .15), v = rand(18, 40);
      gsap.timeline({ onComplete: () => d.remove() })
        .to(d, { x: Math.cos(a) * v, duration: .5, ease: 'none' })
        .to(d, { y: Math.sin(a) * v, duration: .25, ease: 'power2.out' }, 0)
        .to(d, { y: 8, opacity: 0, duration: .25, ease: 'power2.in' }, .25);
    }
  }
  function ripple() {
    if (api.reduced) return;
    const y = targetY(), [x0, x1] = V.mode === 'side' ? xRange(V.poly, y) : [V.open.cx - V.open.rx * .8, V.open.cx + V.open.rx * .8];
    for (let i = 0; i < 2; i++) {
      const e = el('ellipse', { cx: mouthX, cy: y, rx: 4, ry: 1.5, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: .85 }, $('.mx-inside'));
      gsap.to(e, { attr: { rx: (x1 - x0) / 2 - 8, ry: V.mode === 'side' ? 6 : V.open.ry * .7 }, opacity: 0, duration: 1.1, delay: i * .22, ease: 'power2.out', onComplete: () => e.remove() });
    }
  }
  function bubbles(n) {
    if (api.reduced) return;
    const ys = targetY();
    for (let i = 0; i < n; i++) {
      if (V.mode === 'side') {
        const yb = V.bottom - 8, [x0, x1] = xRange(V.poly, yb);
        const b = el('circle', { cx: rand(x0 + 10, x1 - 10), cy: yb, r: rand(1.5, 3.8), fill: 'rgba(255,255,255,.35)', stroke: 'rgba(255,255,255,.85)', 'stroke-width': 1 }, bubblesG);
        gsap.timeline({ delay: rand(0, .8), onComplete: () => b.remove() }).to(b, { y: ys - yb + 4, x: rand(-10, 10), duration: rand(1, 1.8), ease: 'power1.in' }).to(b, { opacity: 0, scale: 1.6, transformOrigin: '50% 50%', duration: .15 });
      } else {
        const o = V.open, a = rand(0, Math.PI * 2), r = rand(0, .7);
        const b = el('circle', { cx: o.cx + Math.cos(a) * o.rx * r * .8, cy: ys + Math.sin(a) * o.ry * r * .8, r: rand(1.5, 3.5), fill: 'rgba(255,255,255,.4)', stroke: 'rgba(255,255,255,.9)', 'stroke-width': 1, opacity: 0 }, bubblesG);
        gsap.timeline({ delay: rand(0, 1), onComplete: () => b.remove() }).to(b, { opacity: 1, duration: .3 }).to(b, { scale: 1.8, opacity: 0, transformOrigin: '50% 50%', duration: .3 }, '+=.4');
      }
    }
  }
  function cloud(col, y) {
    if (api.reduced) return;
    for (let i = 0; i < 7; i++) {
      const c = el('circle', { cx: mouthX + rand(-30, 30), cy: y + rand(4, 26), r: rand(6, 12), fill: col, opacity: .55 }, cloudsG);
      gsap.to(c, { attr: { r: rand(20, 34) }, x: rand(-30, 30), y: rand(-6, 14), opacity: 0, duration: rand(1.2, 1.8), ease: 'sine.out', onComplete: () => c.remove() });
    }
  }

  /* ---------- meters & UI updates ---------- */
  function updateMeters() {
    const v = values();
    for (const e of meterEls) {
      const m = e._m, lo = m.min ?? 0, hi = m.max ?? 10, val = v[m.key] ?? 0;
      const vEl = e.querySelector('.mx-m-v'), z = zoneOf(m.key), inZone = z && val >= z[0] && val <= z[1];
      const o = { n: parseFloat(vEl.textContent) || 0 };
      gsap.to(o, { n: val, duration: .6, onUpdate: () => { vEl.textContent = fmt(o.n); } });
      e.classList.toggle('ok', !!inZone && totalVol() > 0);
      if (m.key === 'ph') {
        const pct = clamp((val - lo) / (hi - lo), 0, 1) * 100;
        gsap.to(e.querySelector('.mx-ph-mark'), { left: `${pct}%`, duration: .8, ease: 'elastic.out(1,.5)' });
        e.querySelector('.mx-ph-paper i').style.background = totalVol() > 0 ? phColor(val) : '#F3E9C8';
        e.querySelector('.mx-ph-word').textContent = totalVol() === 0 ? 'Dip the strip: add something first' : val < 6.5 ? `Acidic (sour) · pH ${fmt(val)}` : val > 7.5 ? `Basic (soapy, bitter) · pH ${fmt(val)}` : `Neutral · pH ${fmt(val)}`;
      } else {
        const rot = -90 + 180 * clamp((val - lo) / (hi - lo), 0, 1);
        const nd = e.querySelector('.mx-needle');
        gsap.to(e._needle, { rot, duration: api.reduced ? .1 : 1.1, ease: 'elastic.out(1,.35)', onUpdate: () => nd.setAttribute('transform', `translate(100 102) rotate(${n1(e._needle.rot)})`) });
      }
    }
  }
  function updateIngs() {
    ingEls.forEach(b => {
      const i = b._ing, n = amt[i.key];
      b.querySelector('.mx-n').textContent = n;
      b.querySelectorAll('.mx-pips i').forEach((p, k) => p.classList.toggle('on', k < Math.round(n * Math.min(i.max, 10) / i.max)));
      b.classList.toggle('full', n >= i.max); b.classList.toggle('has', n > 0);
      b.setAttribute('aria-label', `${i.label}: ${n} of ${i.max} ${unitWord(i, i.max)} added. Add one more.`);
    });
  }
  function updateButtons() {
    const any = totalVol() > 0;
    $('.mx-undo').disabled = !history.length || solved; $('.mx-empty').disabled = !any || solved; $('.mx-check').disabled = !any || solved;
    api.progress(solved ? 1 : Math.min(.85, .1 + rules.filter(r => test(r).ok).length / Math.max(1, rules.length) * .75));
  }

  /* ---------- check ---------- */
  function test(r) {
    const v = values();
    if (r.meter) { const x = v[r.meter] ?? 0; return { ok: (r.min == null || x >= r.min - 1e-9) && (r.max == null || x <= r.max + 1e-9), low: r.min != null && x < r.min, x }; }
    if (r.amount) { const x = amt[r.amount] ?? 0; return { ok: (r.min == null || x >= r.min) && (r.max == null || x <= r.max), low: r.min != null && x < r.min, x }; }
    if (r.colorNear) { const c = mixColor(); if (!c) return { ok: false, low: true }; const t = hex2rgb(r.colorNear); const d = Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2]); return { ok: d <= (r.tolerance ?? 60), d }; }
    return { ok: true };
  }
  function tipFor(r, res) {
    if (r.meter) {
      const custom = cfg.tips?.[r.meter]?.[res.low ? 'low' : 'high'];
      if (custom) return custom;
      const lbl = meterLabel(r.meter).toLowerCase();
      if (r.meter === 'ph') return res.low ? 'It is too acidic (pH too low). Add less of the sour ingredient, or more water.' : 'The pH is too high. Add a little of something sour.';
      const best = [...ings].filter(i => (i.props?.[r.meter] || 0) > 0).sort((a, b) => b.props[r.meter] - a.props[r.meter])[0];
      return res.low ? `The ${lbl} is too low${best ? ` — add more ${best.label.toLowerCase()}` : ''}.` : `The ${lbl} is too high${best ? ` — use less ${best.label.toLowerCase()} (tap Undo)` : ''}${ings.some(i => i.form === 'liquid' && !(i.props?.[r.meter])) ? ' or add more of something plain to dilute it' : ''}.`;
    }
    if (r.amount) { const i = ings.find(x => x.key === r.amount); return res.low ? `Add more ${i?.label.toLowerCase() || r.amount}: you need at least ${r.min}.` : `Too much ${i?.label.toLowerCase() || r.amount}: use at most ${r.max} ${i ? unitWord(i, r.max) : ''}.`; }
    if (r.colorNear) return cfg.tips?.color || 'The colour is not quite right yet. Compare it with the swatch and think which ingredient changes the colour.';
    return '';
  }
  function check() {
    if (solved || !totalVol()) return;
    checks++;
    const res = rules.map(test);
    ruleEls.forEach((li, k) => { li.classList.toggle('ok', res[k].ok); li.classList.toggle('no', !res[k].ok); });
    if (!api.reduced) gsap.from(ruleEls, { x: -6, duration: .3, stagger: .05, ease: 'back.out(3)' });
    const bad = res.findIndex(r => !r.ok);
    if (bad < 0) { win(); return; }
    api.mistake();
    const nBad = res.filter(r => !r.ok).length;
    api.say(`${nBad === 1 ? 'Almost!' : 'Not yet.'} ${tipFor(rules[bad], res[bad])}`, 'bad');
    shake(api, $('.mx-drop'));
  }
  function win() {
    solved = true; root.classList.add('solved');
    updateButtons();
    api.say(cfg.good || 'Perfect mix! Every target is met.', 'good');
    sparkle(api, $('.mx-drop'));
    L.amp = 5;
    // garnish: a straw for drinks, a little celebration for everything
    if (V.mode === 'side' && !api.reduced) {
      const y = targetY(), g = el('g', {}, $('.mx-front'));
      g.innerHTML = `<path d="M232 ${y + 70}L262 ${V.top - 60}" stroke="#E2574C" stroke-width="10" stroke-linecap="round"/><path d="M232 ${y + 70}L262 ${V.top - 60}" stroke="#fff" stroke-width="10" stroke-dasharray="8 8" stroke-linecap="butt" opacity=".8"/>`;
      gsap.from(g, { y: -160, opacity: 0, duration: .7, ease: 'bounce.out' });
    }
    for (let i = 0; i < 18 && !api.reduced; i++) {
      const s = el('path', { d: 'M0 -6L1.6 -1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6 -1.6Z', fill: ['#FFE08A', '#fff', '#F2B33D'][i % 3], transform: `translate(${mouthX} ${targetY()})` }, fx);
      const a = rand(-Math.PI, 0);
      gsap.to(s, { x: Math.cos(a) * rand(60, 150), y: Math.sin(a) * rand(60, 140), rotation: 200, scale: 0, duration: 1.1, ease: 'power2.out', onComplete: () => s.remove() });
    }
    timers.push(setTimeout(() => api.complete({ message: cfg.win || cfg.good }), api.reduced ? 200 : 1600));
  }
  function undo() {
    if (!history.length || solved) return;
    const key = history.pop(); amt[key]--;
    const i = ings.find(x => x.key === key);
    if (i.form === 'solid') { const k = pieces.map(p => p.key).lastIndexOf(key); if (k >= 0) { const [p] = pieces.splice(k, 1); gsap.to(p.g, { opacity: 0, duration: .3, onComplete: () => p.g.remove() }); } }
    api.sound('whoosh'); updateIngs(); settle(null);
    api.say(`Took out 1 ${i.unit || 'spoon'} of ${i.label.toLowerCase()}.`);
    ruleEls.forEach(li => li.classList.remove('ok', 'no'));
  }
  function empty() {
    if (solved) return;
    for (const k in amt) amt[k] = 0; history.length = 0;
    pieces.splice(0).forEach(p => gsap.to(p.g, { opacity: 0, y: 20, duration: .4, onComplete: () => p.g.remove() }));
    api.sound('whoosh'); updateIngs(); settle(null);
    ruleEls.forEach(li => li.classList.remove('ok', 'no'));
    api.say(`The ${kind} is empty again. Start fresh!`);
  }

  /* ---------- input ---------- */
  const zoneEl = $('.mx-drop');
  const pointOf = e => { const t = e?.changedTouches?.[0] || e; return { x: t?.clientX ?? 0, y: t?.clientY ?? 0 }; };
  const over = p => { const r = zoneEl.getBoundingClientRect(); return p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom; };
  const drags = ingEls.map(b => api.Draggable.create(b, {
    type: 'x,y', zIndexBoost: true, dragClickables: true, minimumMovement: 6,
    onDragStart() { b.classList.add('dragging'); root.classList.add('dragging'); },
    onDrag() { zoneEl.classList.toggle('over', over(pointOf(this.pointerEvent))); },
    onDragEnd() {
      b.classList.remove('dragging'); root.classList.remove('dragging'); zoneEl.classList.remove('over');
      const ok = over(pointOf(this.pointerEvent));
      gsap.to(b, { x: 0, y: 0, duration: ok ? .25 : .45, ease: ok ? 'power2.out' : 'back.out(1.6)' });
      if (ok) add(b._ing, true);
    },
    onClick() { add(b._ing); },
  })[0]);
  ingEls.forEach(b => b.addEventListener('click', e => { if (e.detail === 0) add(b._ing); }));
  zoneEl.addEventListener('click', () => { if (!solved) api.say('Tap an ingredient to pour it in, or drag it here.', 'hint'); });
  $('.mx-check').onclick = check; $('.mx-undo').onclick = undo; $('.mx-empty').onclick = empty;

  settle(null); updateIngs(); render();
  api.say(cfg.mission || 'Add ingredients, watch the meters, then press Check.');
  return {
    destroy() {
      gsap.ticker.remove(tick);
      timers.forEach(clearTimeout);
      drags.forEach(d => d.kill());
      gsap.killTweensOf(L); gsap.killTweensOf(L.c);
      gsap.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

export const demo = {
  title: 'Make nimbu pani',
  mission: 'Mix a glass of nimbu pani (lemonade) that is sweet, a little sour and just a bit salty. Watch the meters, then press Check.',
  fact: 'Lemon juice is acidic, with a pH of about 2. That is why it tastes sour and can turn blue litmus paper red.',
  vessel: 'glass',
  ingredients: [
    { key: 'water', label: 'Cold water', sprite: 'water-drop', color: '#D7ECF8', unit: 'cup', max: 4, props: { ph: 7 } },
    { key: 'lemon', label: 'Lemon juice', sprite: 'lemon', color: '#F2D54A', unit: 'spoon', max: 4, props: { sour: 3, ph: 2.4 } },
    { key: 'sugar', label: 'Sugar', sprite: 'sugar', color: '#FFFFFF', unit: 'spoon', max: 5, props: { sweet: 2 } },
    { key: 'salt', label: 'Black salt', sprite: 'salt', color: '#E9D6E2', unit: 'pinch', max: 3, props: { salty: 2 } },
    { key: 'mint', label: 'Mint leaves', sprite: 'mint', emoji: '🌿', color: '#5FA040', unit: 'leaf', max: 4, props: { fresh: 1 } },
  ],
  meters: [
    { key: 'sweet', label: 'Sweetness', min: 0, max: 10 },
    { key: 'sour', label: 'Sourness', min: 0, max: 12 },
    { key: 'ph', label: 'pH (acid level)', min: 0, max: 14 },
  ],
  target: {
    text: 'Sweet, a little sour, with a pinch of black salt and enough water to fill the glass.',
    rules: [
      { meter: 'sweet', min: 4, max: 8 },
      { meter: 'sour', min: 3, max: 6 },
      { meter: 'ph', min: 4, max: 6 },
      { amount: 'water', min: 3, max: 4 },
      { amount: 'salt', min: 1, max: 1 },
      { colorNear: '#EDEBD0', tolerance: 45 },
    ],
  },
  tips: {
    sweet: { low: 'Too plain! Add a spoon of sugar.', high: 'Too sweet! Take out some sugar or add more water.' },
    sour: { low: 'It needs more zing: add lemon juice.', high: 'Too sour! Use less lemon juice.' },
    color: 'The colour should be a pale, cloudy lemon. Too yellow means too much lemon for the water.',
  },
  good: 'Perfect nimbu pani: sweet, a little sour and refreshing!',
  win: 'You balanced sweet, sour and salty, and read the pH like a scientist.',
};
