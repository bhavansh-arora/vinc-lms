// VINC Lab · lab type `grow`: a time-lapse plant simulator. See ../SPEC.md §2.6.
// Sliders set the growing conditions; a procedurally drawn plant grows day by day under a sky that
// cycles day and night, and shows its health (droop, yellowing, legginess, brown tips). Events pause
// the clock until the child picks the right fix from a toolbox. Extra (optional) config: a control may
// set `value` (its starting position); otherwise it starts away from the ideal so the child must think.
import { h, esc, shake, pop, sparkle } from '../kit.js';

export const meta = { title: 'Grow a plant', needs: ['gsap'] };

const W = 600, H = 440;
const n1 = v => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 2.2);
function hash(s) { let x = 2166136261; for (const c of String(s)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixHex = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b), k = clamp(t, 0, 1); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const bez = (p, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
const leafD = (len, wid) => `M0 0C${n1(wid * .6)} ${n1(-len * .12)} ${n1(wid * .62)} ${n1(-len * .7)} 0 ${n1(-len)}C${n1(-wid * .62)} ${n1(-len * .7)} ${n1(-wid * .6)} ${n1(-len * .12)} 0 0Z`;

/* ------------------------------------------------------------------------------------------------
   Plant kinds
------------------------------------------------------------------------------------------------ */
const KINDS = {
  tomato: { form: 'stem', h: 205, nodes: 9, leaf: 'compound', len: 58, spread: 64, cluster: 3, col: '#4F9A34', stem: '#5E8F2E', flowerAt: .46, fruitAt: .58, ripeAt: .84, fruit: 'tomato', fruitN: 9, flower: 'yellow', stake: true, name: 'tomato plant' },
  chilli: { form: 'stem', h: 150, nodes: 10, leaf: 'lance', len: 34, spread: 55, cluster: 2, col: '#3F8A2C', stem: '#4E7F2A', branch: true, flowerAt: .48, fruitAt: .6, ripeAt: .86, fruit: 'chilli', fruitN: 8, flower: 'white', name: 'chilli plant' },
  bean: { form: 'stem', h: 235, nodes: 10, leaf: 'trifoliate', len: 34, spread: 62, cluster: 2, col: '#5AA23A', stem: '#5E9A34', climb: true, flowerAt: .44, fruitAt: .58, ripeAt: 2, fruit: 'pod', fruitN: 7, flower: 'violet', name: 'bean plant' },
  marigold: { form: 'stem', h: 125, nodes: 8, leaf: 'pinnate', len: 36, spread: 58, col: '#3E7D2A', stem: '#4C7A2A', branch: true, flowerAt: .46, fruitAt: .56, ripeAt: 2, fruit: 'marigold', fruitN: 5, name: 'marigold' },
  sapling: { form: 'stem', h: 225, nodes: 11, leaf: 'oval', len: 32, spread: 58, col: '#4E9A3A', stem: '#7A5634', woody: true, branch: true, name: 'sapling' },
  spinach: { form: 'rosette', n: 12, leaf: 'spinach', len: 70, col: '#2F7A2A', name: 'spinach' },
  lettuce: { form: 'rosette', n: 15, leaf: 'ruffle', len: 66, col: '#7DBE4A', head: true, name: 'lettuce' },
  coriander: { form: 'clump', n: 9, h: 92, col: '#4C9A34', name: 'coriander' },
  microgreens: { form: 'micro', col: '#7CC250', name: 'microgreens' },
};
const ICON = {
  water: '<path d="M12 3C9 8 6 11 6 14.5a6 6 0 0 0 12 0C18 11 15 8 12 3z" fill="#4BA3E3"/><path d="M9.5 15a2.6 2.6 0 0 0 2.6 2.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4.6" fill="#F2B33D"/><g stroke="#F2B33D" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></g>',
  nutrients: '<path d="M8 3h8v3l-1 1v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7L8 6z" fill="#8C3557"/><rect x="9" y="11" width="6" height="5" rx="1" fill="#F6DFB5"/>',
  ph: '<rect x="9" y="2.5" width="6" height="19" rx="1.5" fill="#F3E9C8" stroke="#BBA58B"/><rect x="9" y="12" width="6" height="9.5" rx="1.5" fill="#E8833A"/>',
  spacing: '<path d="M3 12h18M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" stroke="#1F6F66" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12" cy="6" r="2.4" fill="#4C9A34"/>',
  temp: '<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z" fill="#F4EADB" stroke="#B23A2A" stroke-width="1.4"/><circle cx="12" cy="17" r="2.4" fill="#C2502A"/><path d="M12 9v8" stroke="#C2502A" stroke-width="2"/>',
  shade: '<path d="M3 9l9-5 9 5z" fill="#3F8F4A"/><path d="M5 9v11M19 9v11" stroke="#7A5634" stroke-width="2"/><path d="M4 9h16" stroke="#2F7A3B" stroke-width="2"/>',
};
const KEYNAME = { water: 'Water', sun: 'Sunlight', nutrients: 'Nutrients', ph: 'pH', spacing: 'Spacing', temp: 'Temperature', shade: 'Shade' };
const SYMPTOM = {
  water: { low: 'The leaves are drooping. The plant is thirsty: give it more water.', high: 'Yellow leaves and soggy soil: too much water! Roots need air too.' },
  sun: { low: 'The stem is long and thin, stretching for light. It needs more sunlight.', high: 'The leaf edges are scorched brown: too many hours of strong sun.' },
  nutrients: { low: 'Pale yellow leaves: the plant is hungry for nutrients.', high: 'Brown leaf tips: too much fertiliser burns the roots.' },
  ph: { low: 'Brown spots on the leaves: the water is too acidic, so roots cannot take in food.', high: 'Brown spots on the leaves: the pH is too high, so roots cannot take in food.' },
  spacing: { low: 'The plants are too crowded. They fight for light and stay small.', high: 'So much empty space between plants: you could grow more!' },
  temp: { low: 'It is too cold. The plant is hardly growing.', high: 'It is too hot. The plant wilts in the heat.' },
  shade: { low: 'The midday sun is too harsh without any shade.', high: 'Too much shade: the plant stretches for light.' },
};
const FIX = {
  neem: { label: 'Spray neem', ico: '🌿' }, shade: { label: 'Put up shade net', ico: '⛱️' }, weed: { label: 'Pull the weeds', ico: '🧤' },
  drain: { label: 'Drain extra water', ico: '🕳️' }, water: { label: 'Give water', ico: '🚿' },
};
const EVENT_HINT = {
  pests: 'Aphids are tiny insects that suck the sap. Spray something that chases insects away.',
  heat: 'The sun is burning hot. The plant needs protection from the strong sun.',
  rain: 'Too much rain has flooded the soil. The extra water has to go.',
  weeds: 'Weeds steal water, light and food from your plant. Take them out.',
  wilting: 'The plant is thirsty and its leaves hang down.',
};
const EVENT_FIX = { pests: 'neem', heat: 'shade', rain: 'drain', weeds: 'weed', wilting: 'water' };

/* ------------------------------------------------------------------------------------------------
   Plant drawing (pure: state in, SVG markup out). Origin at the soil surface, up is -y.
------------------------------------------------------------------------------------------------ */
function leafColor(K, S, k = 0) {
  let c = K.col;
  if (k) c = mixHex(c, '#9ED36A', k);
  c = mixHex(c, '#B8D88A', S.leggy * .45);
  c = mixHex(c, '#D9C743', S.yellow * .8);
  c = mixHex(c, '#8A6A3A', S.dead * .85);
  return c;
}
function blade(shape, len, wid, col, S, seedv) {
  const vein = `<path d="M0 0V${n1(-len * .9)}" stroke="#1E4214" stroke-width="${n1(Math.max(.6, len * .025))}" opacity=".35"/>`;
  const tip = S.brown > .04 ? `<path d="M${n1(-wid * .34)} ${n1(-len * .7)}Q0 ${n1(-len * 1.04)} ${n1(wid * .34)} ${n1(-len * .7)}Q0 ${n1(-len * .82)} ${n1(-wid * .34)} ${n1(-len * .7)}Z" fill="#8A5A2B" opacity="${n1(clamp(S.brown * 1.1, 0, .95))}"/>` : '';
  const spots = S.brown > .3 ? `<circle cx="${n1(wid * .15)}" cy="${n1(-len * .45)}" r="${n1(len * .04)}" fill="#7A4A22" opacity="${n1(S.brown * .7)}"/><circle cx="${n1(-wid * .18)}" cy="${n1(-len * .3)}" r="${n1(len * .03)}" fill="#7A4A22" opacity="${n1(S.brown * .6)}"/>` : '';
  if (shape === 'ruffle') {
    const pts = [], N = 9;
    for (let i = 0; i <= N; i++) { const t = i / N, w = Math.sin(Math.PI * Math.pow(t, .8)) * wid * .62 * (t < .2 ? t / .2 : 1), r = 1 + .14 * Math.sin(i * 2.6 + seedv); pts.push([w * r, -len * t]); }
    let d = 'M0 0'; for (let i = 1; i <= N; i++) d += `Q${n1(pts[i - 1][0] * 1.25 + 1)} ${n1((pts[i - 1][1] + pts[i][1]) / 2)} ${n1(pts[i][0])} ${n1(pts[i][1])}`;
    for (let i = N - 1; i >= 0; i--) d += `Q${n1(-pts[i + 1][0] * 1.25 - 1)} ${n1((pts[i + 1][1] + pts[i][1]) / 2)} ${n1(-pts[i][0])} ${n1(pts[i][1])}`;
    return `<path d="${d}Z" fill="${col}"/><path d="${d}Z" fill="url(#gr-leafsheen)"/>${vein}${tip}${spots}`;
  }
  if (shape === 'lobed') {
    const r = len * .3;
    return `<circle cx="0" cy="${n1(-len * .62)}" r="${n1(r)}" fill="${col}"/><circle cx="${n1(-r * .95)}" cy="${n1(-len * .4)}" r="${n1(r * .85)}" fill="${col}"/><circle cx="${n1(r * .95)}" cy="${n1(-len * .4)}" r="${n1(r * .85)}" fill="${col}"/>
      <path d="M0 0V${n1(-len * .6)}M0 ${n1(-len * .3)}L${n1(-r)} ${n1(-len * .42)}M0 ${n1(-len * .3)}L${n1(r)} ${n1(-len * .42)}" stroke="#1E4214" stroke-width=".8" opacity=".35"/>${S.brown > .04 ? `<circle cx="0" cy="${n1(-len * .62 - r * .6)}" r="${n1(r * .45)}" fill="#8A5A2B" opacity="${n1(S.brown)}"/>` : ''}`;
  }
  return `<path d="${leafD(len, wid)}" fill="${col}"/><path d="${leafD(len, wid)}" fill="url(#gr-leafsheen)"/>${vein}${tip}${spots}`;
}
// One leaf (or compound leaf) at the origin pointing up, rotated by `ang` degrees.
function leafUnit(K, S, x, y, ang, size, k, sv) {
  const col = leafColor(K, S, k);
  let inner;
  switch (K.leaf) {
    case 'compound': { // tomato: petiole with leaflet pairs
      const L = size; inner = `<path d="M0 0Q${n1(L * .12)} ${n1(-L * .55)} 0 ${n1(-L)}" stroke="${mixHex(K.stem, '#8A6A3A', S.dead)}" stroke-width="${n1(Math.max(1, L * .045))}" fill="none" stroke-linecap="round"/>`;
      for (let j = 0; j < 2; j++) { const yy = -L * (.35 + j * .3), s2 = L * (.34 - j * .04); inner += `<g transform="translate(0 ${n1(yy)}) rotate(-62)">${blade('oval', s2, s2 * .55, col, S, sv)}</g><g transform="translate(0 ${n1(yy)}) rotate(62)">${blade('oval', s2, s2 * .55, col, S, sv)}</g>`; }
      inner += `<g transform="translate(0 ${n1(-L * .92)})">${blade('oval', L * .4, L * .24, col, S, sv)}</g>`;
      break;
    }
    case 'trifoliate': { const L = size; inner = `<path d="M0 0V${n1(-L * .55)}" stroke="${K.stem}" stroke-width="1.4"/>` + [-50, 0, 50].map(a => `<g transform="translate(0 ${n1(-L * .55)}) rotate(${a})">${blade('oval', L * .62, L * .5, col, S, sv)}</g>`).join(''); break; }
    case 'pinnate': {
      const L = size; inner = `<path d="M0 0V${n1(-L)}" stroke="${col}" stroke-width="1.4"/>`;
      for (let j = 0; j < 5; j++) { const yy = -L * (.2 + j * .17), s2 = L * (.28 - j * .03); inner += `<g transform="translate(0 ${n1(yy)}) rotate(-58)">${blade('lance', s2, s2 * .32, col, S, sv)}</g><g transform="translate(0 ${n1(yy)}) rotate(58)">${blade('lance', s2, s2 * .32, col, S, sv)}</g>`; }
      break;
    }
    case 'lance': inner = blade('lance', size, size * .34, col, S, sv); break;
    default: inner = blade(K.leaf === 'spinach' ? 'oval' : K.leaf, size, size * (K.leaf === 'spinach' ? .62 : .58), col, S, sv);
  }
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(ang)})">${inner}</g>`;
}
function flowerSvg(kind, x, y, s, t) {
  if (s <= .02) return '';
  if (kind === 'white' || kind === 'yellow') {
    const c = kind === 'white' ? '#FFFFFF' : '#F6D02F', r = 3.2 * s;
    let p = ''; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + t * .2; p += `<ellipse cx="${n1(x + Math.cos(a) * r)}" cy="${n1(y + Math.sin(a) * r)}" rx="${n1(2.8 * s)}" ry="${n1(1.6 * s)}" fill="${c}" stroke="rgba(0,0,0,.12)" stroke-width=".5" transform="rotate(${n1(a * 57.3)} ${n1(x + Math.cos(a) * r)} ${n1(y + Math.sin(a) * r)})"/>`; }
    return p + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.8 * s)}" fill="${kind === 'white' ? '#F2C94C' : '#E39B17'}"/>`;
  }
  // violet pea flower
  return `<path d="M${n1(x)} ${n1(y)}c${n1(-5 * s)} ${n1(-2 * s)} ${n1(-5 * s)} ${n1(-8 * s)} 0 ${n1(-8 * s)}c${n1(5 * s)} 0 ${n1(5 * s)} ${n1(6 * s)} 0 ${n1(8 * s)}z" fill="#B48AD8"/><path d="M${n1(x - 2 * s)} ${n1(y)}q${n1(2 * s)} ${n1(3 * s)} ${n1(4 * s)} 0" fill="#8E5CC0"/>`;
}
function fruitSvg(kind, x, y, grow, ripe, i) {
  if (grow <= .02) return '';
  switch (kind) {
    case 'tomato': {
      const r = 3 + 8 * grow, c = mixHex('#6DB33F', '#E0412C', ripe);
      return `<g class="gr-fruit" data-i="${i}"><path d="M${n1(x)} ${n1(y - 10)}V${n1(y - r)}" stroke="#4E7F2A" stroke-width="1.3"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${c}"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="url(#gr-fruitsheen)"/>
        <path d="M${n1(x - r * .5)} ${n1(y - r * .85)}l${n1(r * .5)} ${n1(r * .3)}l${n1(r * .5)} ${n1(-r * .3)}" stroke="#3E7D2A" stroke-width="${n1(1 + grow)}" fill="none" stroke-linecap="round"/></g>`;
    }
    case 'chilli': {
      const L = 6 + 20 * grow, c = mixHex('#3E8E2A', '#D8342A', ripe);
      return `<g class="gr-fruit" data-i="${i}"><path d="M${n1(x)} ${n1(y - 4)}q${n1(L * .1)} ${n1(L * .3)} ${n1(-L * .05)} ${n1(L * .5)}" stroke="#4E7F2A" stroke-width="1.4" fill="none"/>
        <path d="M${n1(x - 2.4)} ${n1(y)}C${n1(x - 3)} ${n1(y + L * .5)} ${n1(x + 1)} ${n1(y + L * .9)} ${n1(x + 4)} ${n1(y + L)}C${n1(x + 3)} ${n1(y + L * .6)} ${n1(x + 3)} ${n1(y + L * .3)} ${n1(x + 2.4)} ${n1(y)}Z" fill="${c}"/><path d="M${n1(x - .8)} ${n1(y + 3)}q0 ${n1(L * .4)} ${n1(2)} ${n1(L * .7)}" stroke="#fff" stroke-width="1" opacity=".45" fill="none"/></g>`;
    }
    case 'pod': {
      const L = 8 + 36 * grow;
      return `<g class="gr-fruit" data-i="${i}"><path d="M${n1(x - 2)} ${n1(y)}C${n1(x - 4)} ${n1(y + L * .5)} ${n1(x - 1)} ${n1(y + L * .9)} ${n1(x + 3)} ${n1(y + L)}C${n1(x + 3)} ${n1(y + L * .6)} ${n1(x + 3)} ${n1(y + L * .3)} ${n1(x + 2)} ${n1(y)}Z" fill="#7CBF4A" stroke="#4E8A2A" stroke-width=".8"/>
        ${[.3, .55, .8].map(t => `<ellipse cx="${n1(x + t * 1.5)}" cy="${n1(y + L * t)}" rx="1.6" ry="${n1(L * .07)}" fill="#9AD06A" opacity=".8"/>`).join('')}</g>`;
    }
    case 'marigold': {
      const s = grow, bud = s < .35;
      if (bud) return `<g class="gr-fruit" data-i="${i}"><ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(2 + s * 9)}" ry="${n1(3 + s * 10)}" fill="#5E9A34"/><ellipse cx="${n1(x)}" cy="${n1(y - 2 - s * 6)}" rx="${n1(1 + s * 5)}" ry="${n1(1 + s * 4)}" fill="#F39A1E"/></g>`;
      const R = 5 + 12 * s; let p = '';
      for (let ring = 0; ring < 3; ring++) { const rr = R * (1 - ring * .3), n = 12 - ring * 3, col = ['#E8781A', '#F39A1E', '#F7B731'][ring]; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + ring * .4; p += `<circle cx="${n1(x + Math.cos(a) * rr * .72)}" cy="${n1(y + Math.sin(a) * rr * .62)}" r="${n1(rr * .36)}" fill="${col}"/>`; } }
      return `<g class="gr-fruit" data-i="${i}">${p}<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R * .22)}" fill="#D9640F"/></g>`;
    }
  }
  return '';
}
function aphid(x, y, a) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)}) scale(1.35)"><path d="M-3 -1l-2 -2M-3 1l-2 2M0 -1.6l0 -2.6M0 1.6v2.6M3 -1l2 -2M3 1l2 2" stroke="#2F5A1A" stroke-width=".7"/><ellipse rx="4" ry="2.6" fill="#8FD14F"/><circle cx="3.6" cy="0" r="1.6" fill="#4F8A25"/><circle cx="4.2" cy="-.5" r=".5" fill="#111"/></g>`;
}

function drawStemPlant(K, S, t, rnd, roots) {
  const g = S.g, vig = .62 + .38 * S.vigor;
  const Hs = Math.max(6, K.h * vig * ease(g) * (1 + S.leggy * .42));
  const sway = Math.sin(t * 1.3 + rnd.ph) * (1.2 + 3 * g) * (1 - S.dead);
  const bend = (S.droop * .55 + S.dead * .5);
  const cv = (rnd.ph % 2 ? 1 : -1) * Hs * .05;
  const P = [[0, 0], [sway * .2 + cv, -Hs * .35], [sway * .6 - cv * .8 + bend * Hs * .2, -Hs * .72], [sway + bend * Hs * .5, -Hs * (1 - bend * .3)]];
  const stemW = (1.4 + 3.6 * g * vig) * (1 - .4 * S.leggy) * (K.woody ? 1.35 : 1);
  const stemCol = mixHex(K.stem, '#8A6A3A', S.dead + (K.woody ? 0 : S.brown * .2));
  const sd = `M0 0C${n1(P[1][0])} ${n1(P[1][1])} ${n1(P[2][0])} ${n1(P[2][1])} ${n1(P[3][0])} ${n1(P[3][1])}`;
  let back = '', mid = '', front = '';
  const slots = [];
  if (K.stake && g > .18) mid += `<path d="M10 6V${n1(-K.h * .95)}" stroke="#C9A35C" stroke-width="5" stroke-linecap="round"/><path d="M10 6V${n1(-K.h * .95)}" stroke="#E6CB8A" stroke-width="1.5" opacity=".7"/>` + [.3, .55, .8].filter(f => f * K.h * .95 < Hs).map(f => { const q = bez(P, clamp(f * K.h * .95 / Hs, 0, 1)); return `<path d="M${n1(q[0])} ${n1(q[1])}L10 ${n1(q[1])}" stroke="#E8DDB0" stroke-width="2"/>`; }).join('');
  if (K.climb) back += `<path d="M14 8V-245" stroke="#B88A4E" stroke-width="5" stroke-linecap="round"/><path d="M14 -245l-6 -8M14 -245l6 -8" stroke="#B88A4E" stroke-width="3" stroke-linecap="round"/>`;
  // stem
  let stemPath = sd;
  if (K.climb) {
    const pts = []; for (let i = 0; i <= 24; i++) { const f = i / 24; pts.push([14 + Math.sin(f * 14) * 7 * Math.min(1, f * 4) + bend * f * f * 30, -Hs * f]); }
    stemPath = 'M0 0' + pts.map(p => `L${n1(p[0])} ${n1(p[1])}`).join('');
    P[0] = [0, 0]; P[1] = [14, -Hs * .33]; P[2] = [14, -Hs * .66]; P[3] = [14 + bend * 30, -Hs];
  }
  mid += `<path d="${stemPath}" stroke="${mixHex(stemCol, '#000', .25)}" stroke-width="${n1(stemW + 1.6)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${stemPath}" stroke="${stemCol}" stroke-width="${n1(stemW)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (g < .1) { // cotyledons
    const top = P[3], s = clamp(g / .1, 0, 1) * 13;
    front += `<g transform="translate(${n1(top[0])} ${n1(top[1])})"><g transform="rotate(${n1(-62 - S.droop * 40)})">${blade('oval', s, s * .8, leafColor(K, S, .25), S, 1)}</g><g transform="rotate(${n1(62 + S.droop * 40)})">${blade('oval', s, s * .8, leafColor(K, S, .25), S, 2)}</g></g>`;
  }
  // leaves at nodes
  const nodesF = K.nodes * clamp((g - .05) * 1.25, 0, 1) * (1 - .3 * S.leggy);
  const n = Math.ceil(nodesF);
  for (let i = 0; i < n; i++) {
    const age = clamp(nodesF - i, 0, 1);
    const f = (i + 1) / (K.nodes * (1 - .3 * S.leggy) + .6);
    const q = bez(P, clamp(f, .05, .97)), side = i % 2 ? 1 : -1;
    const size = K.len * (.6 + .4 * (1 - i / Math.max(1, K.nodes))) * ease(age) * vig * (1 - .28 * S.leggy) * (K.woody ? .85 : 1);
    const ang = side * ((K.spread || 55) - (1 - i / Math.max(1, n)) * 8 + S.droop * (110 - (K.spread || 55)) + S.dead * 40) * (1 - S.leggy * .25) + Math.sin(t * 1.7 + i) * 3 * (1 - S.dead);
    const k = (1 - age) * .5;
    const lu = leafUnit(K, S, q[0], q[1], ang, size, k, i + rnd.ph);
    if (i % 3 === 0) back += lu; else front += lu;
    slots.push({ x: q[0], y: q[1] + 2, side: -side, i });
    // branches
    if (K.branch && i >= 2 && i % 3 === 2 && g > .3) {
      const bl = Hs * .45 * clamp((g - .3) * 2, 0, 1), ba = side * (40 + S.droop * 40) * Math.PI / 180;
      const bx = q[0] + Math.sin(ba) * bl, by = q[1] - Math.cos(ba) * bl;
      back += `<path d="M${n1(q[0])} ${n1(q[1])}Q${n1(q[0] + Math.sin(ba) * bl * .3)} ${n1(q[1] - bl * .6)} ${n1(bx)} ${n1(by)}" stroke="${stemCol}" stroke-width="${n1(stemW * .6)}" fill="none" stroke-linecap="round"/>`;
      for (let j = 0; j < 3; j++) { const ff = (j + 1) / 3.4, lx = q[0] + (bx - q[0]) * ff, ly = q[1] + (by - q[1]) * ff; back += leafUnit(K, S, lx, ly, (j % 2 ? 1 : -1) * (40 + S.droop * 60) + side * 15, K.len * .7 * vig, .2, j + i); slots.push({ x: lx, y: ly + 3, side: j % 2 ? 1 : -1, i: i + j * .3 }); }
      slots.push({ x: bx, y: by, side, i: i + 1 });
    }
  }
  if (g >= .1 && !S.dead) { const tp = P[3], ys = K.len * .32 * vig; front += leafUnit(K, S, tp[0], tp[1], -22 + sway, ys, .45, 7) + leafUnit(K, S, tp[0], tp[1], 26 + sway, ys * .8, .5, 8); }
  // flowers and fruit in the upper slots
  const fr = [];
  if (K.fruit || K.flower) {
    const up = slots.slice(Math.floor(slots.length * .3)).sort((a, b) => b.y - a.y);
    const cl = K.cluster || 1;
    const nT = Math.max(1, Math.round((K.fruitN || 4) / cl * (.35 + .65 * S.vigor)));
    const step = Math.max(1, Math.floor(up.length / nT));
    const pickS = up.filter((_, j) => j % step === 0).slice(0, nT);
    const flowerS = clamp((g - K.flowerAt) / .06, 0, 1) * (1 - clamp((g - (K.fruitAt || 1)) / .06, 0, 1));
    pickS.forEach((s0, tIdx) => {
      for (let c = 0; c < cl; c++) {
        const j = tIdx * 10 + c, hang = K.fruit === 'marigold' ? 0 : 1;
        const ox = s0.side * (10 + c * 10), oy = hang ? 10 + c * 8 + (K.fruit === 'pod' || K.fruit === 'chilli' ? 2 : 0) : -12 - c * 6;
        const x = s0.x + ox, y = s0.y + oy;
        const stalk = `<path d="M${n1(s0.x)} ${n1(s0.y)}Q${n1(s0.x + ox * .7)} ${n1(s0.y - 4)} ${n1(x)} ${n1(y - (hang ? 8 : -4))}" stroke="${stemCol}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
        if (K.flower && flowerS > .02) front += stalk + flowerSvg(K.flower, x, y - 4, flowerS * (1 - S.dead), t);
        if (K.fruit && !S.picked?.has(j)) {
          const gr = clamp((g - K.fruitAt - (tIdx * cl + c) * .01) / (K.fruit === 'marigold' ? .3 : .22), 0, 1) * (.75 + .25 * S.vigor);
          if (gr <= .02) continue;
          const ripe = clamp((g - K.ripeAt - c * .02) / .1, 0, 1);
          front += stalk + fruitSvg(K.fruit, x, y, gr, ripe, j);
          if (gr > .3) fr.push({ x, y, j });
        }
      }
    });
  }
  if (K.fruit === 'marigold' && g > K.fruitAt) {
    const top = P[3], gr = clamp((g - K.fruitAt) / .3, 0, 1);
    if (!S.picked?.has(99)) { front += fruitSvg('marigold', top[0], top[1] - 6, gr, 1, 99); if (gr > .3) fr.push({ x: top[0], y: top[1] - 6, j: 99 }); }
  }
  // aphids crawling up the stem
  let bugs = '';
  const nA = Math.round(10 * S.pests);
  for (let k = 0; k < nA; k++) { const u = ((k / 10 + t * .018 * (1 + k % 3 * .3)) % 1) * .85 + .1, q = bez(P, u); bugs += aphid(q[0] + (k % 2 ? 4 : -4), q[1], -90 + (k % 2 ? 10 : -10)); }
  return { svg: `${back}${mid}${front}${bugs}`, fruit: fr, top: P[3] };
}

function drawRosette(K, S, t, rnd) {
  const g = S.g, vig = .62 + .38 * S.vigor;
  const nL = Math.max(2, Math.round(2 + K.n * clamp(g * 1.1, 0, 1) * (1 - .25 * S.leggy)));
  let back = '', front = '';
  const leaves = [];
  for (let i = 0; i < nL; i++) {
    const age = clamp(g * K.n * 1.1 - i + 1, 0, 1);
    const outer = 1 - i / nL; // older leaves are on the outside, bigger and lower
    const side = i % 2 ? 1 : -1;
    const spreadMax = (K.head ? 70 : 80) + S.droop * 18 + S.dead * 15;
    const ang = side * (8 + (spreadMax - 8) * Math.pow(outer, .8) * (.8 + .2 * Math.sin(i * 1.7))) * (1 - S.leggy * .3) + Math.sin(t * 1.4 + i) * 2.5 * (1 - S.dead);
    const len = K.len * vig * (.45 + .55 * ease(g)) * (.5 + .5 * outer) * ease(age) * (1 + S.leggy * .25);
    const pet = len * (.3 + S.leggy * .35);
    const col = leafColor(K, S, (1 - outer) * (K.head ? .4 : .18));
    const a = ang * Math.PI / 180;
    const bx = Math.sin(a) * pet, by = -Math.cos(a) * pet;
    const blade1 = `<path d="M0 0L${n1(bx)} ${n1(by)}" stroke="${mixHex(col, '#E8F2C8', .45)}" stroke-width="${n1(2 + len * .035)}" stroke-linecap="round"/><g transform="translate(${n1(bx)} ${n1(by)}) rotate(${n1(ang)})">${blade(K.leaf === 'ruffle' ? 'ruffle' : 'oval', len, len * (K.leaf === 'ruffle' ? .85 : .66), col, S, i)}</g>`;
    leaves.push({ z: i, m: blade1, x: bx + Math.sin(a) * len * .5, y: by - Math.cos(a) * len * .5, i });
  }
  leaves.sort((p, q) => p.z - q.z).forEach(l => { front += l.m; });
  let bugs = '';
  const nA = Math.round(8 * S.pests);
  for (let k = 0; k < nA; k++) { const l = leaves[k % leaves.length]; bugs += aphid(l.x + Math.sin(t * .6 + k) * 4, l.y + Math.cos(t * .5 + k) * 3, t * 20 + k * 40); }
  return { svg: back + front + bugs, fruit: leaves.filter(l => l.i < nL * .7).slice(0, 6).map(l => ({ x: l.x, y: l.y, j: l.i })), top: [0, -K.len * .8] };
}

function drawClump(K, S, t, rnd) {
  const g = S.g, vig = .62 + .38 * S.vigor, n = Math.max(1, Math.round(2 + (K.n - 2) * clamp(g * 1.3, 0, 1)));
  let out = '';
  const tips = [];
  for (let i = 0; i < n; i++) {
    const a = (-.75 + 1.5 * (i + .5) / n) * (1 + S.droop * .7) + Math.sin(t * 1.3 + i) * .04;
    const hh = K.h * vig * ease(g) * (.7 + .3 * Math.sin(i * 2.3 + 1) ** 2) * (1 + S.leggy * .4);
    const tx = Math.sin(a) * hh * .55, ty = -Math.cos(a * .8) * hh;
    const col = leafColor(K, S, .1);
    out += `<path d="M0 0Q${n1(tx * .2)} ${n1(ty * .6)} ${n1(tx)} ${n1(ty)}" stroke="${mixHex('#7FB24C', '#8A6A3A', S.dead)}" stroke-width="${n1(1.4 + g)}" fill="none" stroke-linecap="round"/>`;
    const ls = 10 + 14 * g * vig;
    out += `<g transform="translate(${n1(tx)} ${n1(ty)}) rotate(${n1(a * 57 + S.droop * 30 * Math.sign(a || 1))})">${blade('lobed', ls, ls, col, S, i)}</g>`;
    if (g > .4) { const mx = tx * .55, my = ty * .55; out += `<g transform="translate(${n1(mx)} ${n1(my)}) rotate(${n1(a * 57 + (i % 2 ? 40 : -40))})">${blade('lobed', ls * .75, ls * .75, col, S, i + 3)}</g>`; }
    tips.push({ x: tx, y: ty, j: i });
  }
  let bugs = ''; for (let k = 0; k < Math.round(7 * S.pests); k++) { const p = tips[k % tips.length]; bugs += aphid(p.x * (.4 + (k % 3) * .2), p.y * (.4 + (k % 3) * .2), -80); }
  return { svg: out + bugs, fruit: tips.slice(0, 6), top: [0, -K.h * .8] };
}

function drawMicro(K, S, t, rnd, width = 316) {
  const g = S.g, vig = .62 + .38 * S.vigor;
  let out = ''; const tips = [];
  const N = 46;
  for (let i = 0; i < N; i++) {
    const row = i % 2, x = -width / 2 + (i + .5) * width / N, j = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hh = (5 + 62 * ease(g) * vig) * (.8 + .3 * Math.abs(j)) * (1 + S.leggy * .5);
    const bend = (S.droop * 22 + S.dead * 18) * (i % 2 ? 1 : -1) + Math.sin(t * 1.6 + i) * 1.5;
    const tx = x + bend * .6, ty = -hh + Math.abs(bend) * .25 - row * 4;
    out += `<path d="M${n1(x)} ${row * -2}Q${n1(x)} ${n1(ty * .6)} ${n1(tx)} ${n1(ty)}" stroke="${mixHex(i % 4 ? '#E3EFC4' : '#C9708A', '#B89A6A', S.dead)}" stroke-width="2" fill="none"/>`;
    const s = (3 + 10 * ease(g)) * vig, col = leafColor(K, S, .1 + (i % 3) * .08);
    out += `<g transform="translate(${n1(tx)} ${n1(ty)}) rotate(${n1(bend * 1.5)})"><path d="${leafD(s, s * .75)}" fill="${col}" transform="rotate(-65)"/><path d="${leafD(s, s * .75)}" fill="${mixHex(col, '#000', .08)}" transform="rotate(65)"/></g>`;
    if (i % 6 === 0) tips.push({ x: tx, y: ty, j: i });
  }
  return { svg: out, fruit: tips, top: [0, -40] };
}

function drawPlant(K, S, t, rnd) {
  if (K.form === 'rosette') return drawRosette(K, S, t, rnd);
  if (K.form === 'clump') return drawClump(K, S, t, rnd);
  if (K.form === 'micro') return drawMicro(K, S, t, rnd);
  return drawStemPlant(K, S, t, rnd);
}
function rootTree(seed) {
  const r = rng(seed), out = [];
  const grow = (x, y, a, len, d) => {
    const pts = [[x, y]];
    for (let k = 0; k < 6; k++) { a += (r() - .5) * .55; a = a * .85 + Math.PI / 2 * .15; x += Math.cos(a) * len / 6; y += Math.sin(a) * len / 6; pts.push([x, y]); }
    out.push({ pts, d });
    if (d < 3) for (let k = 1; k < 6; k += 1 + (r() < .4)) grow(pts[k][0], pts[k][1], Math.PI / 2 + (k % 2 ? -1 : 1) * (.5 + r() * .8), len * (.3 + r() * .22) * (d ? .8 : 1), d + 1);
  };
  grow(0, 0, Math.PI / 2, 1, 0);
  return out;
}
const smoothD = p => { let d = `M${n1(p[0][0])} ${n1(p[0][1])}`; for (let i = 1; i < p.length; i++) { const m = [(p[i - 1][0] + p[i][0]) / 2, (p[i - 1][1] + p[i][1]) / 2]; d += `Q${n1(p[i - 1][0])} ${n1(p[i - 1][1])} ${n1(m[0])} ${n1(m[1])}`; } return d + `L${n1(p[p.length - 1][0])} ${n1(p[p.length - 1][1])}`; };

/* ------------------------------------------------------------------------------------------------
   The lab
------------------------------------------------------------------------------------------------ */
export function mount(stage, cfg, api) {
  const { gsap } = api;
  const plantKind = KINDS[cfg.plant] ? cfg.plant : 'tomato';
  const K = KINDS[plantKind];
  const medium = ['soil', 'water', 'cocopeat'].includes(cfg.medium) ? cfg.medium : 'soil';
  const days = Math.max(5, cfg.days || 30);
  const controls = (cfg.controls || []).map(c => {
    const min = c.min ?? 0, max = c.max ?? 10, ideal = c.ideal || [min + (max - min) * .4, min + (max - min) * .6];
    const step = c.step ?? ((max - min) <= 14 ? (Number.isInteger(min) && Number.isInteger(max) && max - min >= 6 ? 1 : .5) : Math.max(1, Math.round((max - min) / 20)));
    let v = c.value;
    if (v == null) { const mid = min + (max - min) * .5; v = mid >= ideal[0] && mid <= ideal[1] ? min + (max - min) * .15 : mid; v = Math.round(v / step) * step; }
    return { ...c, min, max, ideal, step, v };
  });
  const events = [...(cfg.events || [])].sort((a, b) => a.day - b.day).map(e => ({ ...e, fix: e.fix || EVENT_FIX[e.kind] || 'water', done: false }));
  const rnd = { ph: hash(plantKind) % 7 };
  const roots = rootTree(hash(plantKind + medium));
  const timers = [];
  const groundY = K.form === 'micro' ? 338 : medium === 'soil' ? 318 : 304;
  const plantX = 300;

  // simulation state
  const S = { g: 0, vigor: 1, droop: 0, yellow: 0, leggy: 0, brown: 0, pests: 0, dead: 0, picked: new Set() };
  const T = { droop: 0, yellow: 0, leggy: 0, brown: 0 }; // targets the look eases towards
  const EV = { droop: 0, yellow: 0, brown: 0, pests: 0 }; // extra symptoms from an event
  let day = 0, dayFrac = 0, health = 100, running = false, started = false, speed = 1, ended = false;
  let paused = null; // current event
  let tAll = 0, lastHint = -10, shadeNet = 0, rainOn = 0, heatOn = 0, puddle = 0, weeds = [];
  let healthSum = 0, healthN = 0;

  const has = k => controls.some(c => c.key === k);
  const env = { moist: .5, shade: 0, temp: .5, sun: .7, spacing: .5, nutrients: .5 };

  /* ---------- DOM ---------- */
  const root = h(`<div class="lab-grow gr-m-${medium} gr-p-${plantKind}">
    <div class="gr-scene">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="A ${esc(K.name)} growing in ${esc(medium)}">
        <defs>
          <linearGradient id="gr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0" stop-color="#7EC8F0"/><stop offset="1" class="s1" stop-color="#DDF2FB"/></linearGradient>
          <radialGradient id="gr-sunglow"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
          <linearGradient id="gr-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A5030"/><stop offset="1" stop-color="#4A2D18"/></linearGradient>
          <linearGradient id="gr-coco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E4E2C"/><stop offset="1" stop-color="#5E301A"/></linearGradient>
          <linearGradient id="gr-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD0F0" stop-opacity=".85"/><stop offset="1" stop-color="#3A8CCB" stop-opacity=".92"/></linearGradient>
          <linearGradient id="gr-pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D2743F"/><stop offset=".5" stop-color="#BE5E30"/><stop offset="1" stop-color="#984420"/></linearGradient>
          <linearGradient id="gr-leafsheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
          <radialGradient id="gr-fruitsheen" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
          <pattern id="gr-dots" width="40" height="40" patternUnits="userSpaceOnUse">${(() => { const r = rng(7); let s = ''; for (let i = 0; i < 40; i++) s += `<circle cx="${n1(r() * 40)}" cy="${n1(r() * 40)}" r="${n1(.6 + r() * 1.3)}" fill="${['#9A6B42', '#3B2412', '#B0875A', '#2A190C'][i % 4]}" opacity=".8"/>`; return s; })()}</pattern>
          <pattern id="gr-mesh" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0L10 10M10 0L0 10" stroke="#1F5A2A" stroke-width="1.4"/></pattern>
          <clipPath id="gr-under"><rect x="0" y="${groundY}" width="${W}" height="${H - groundY}"/></clipPath>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#gr-sky)"/>
        <g class="gr-stars" opacity="0">${(() => { const r = rng(3); let s = ''; for (let i = 0; i < 40; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(r() * 200)}" r="${n1(.6 + r() * 1.3)}" fill="#fff"/>`; return s; })()}</g>
        <g class="gr-sun"><circle r="58" fill="url(#gr-sunglow)"/><circle r="22" fill="#FFD95A"/><circle r="22" fill="#F2B33D" opacity=".35" class="gr-sun-hot"/></g>
        <g class="gr-moon"><circle r="16" fill="#F4F1E6"/><circle cx="6" cy="-4" r="13" fill="url(#gr-sky)" opacity=".0"/><circle cx="-5" cy="-3" r="3" fill="#DCD6C2"/><circle cx="4" cy="6" r="2.2" fill="#DCD6C2"/></g>
        <g class="gr-clouds">
          <g class="gr-cloud c1"><ellipse cx="0" cy="0" rx="40" ry="14" fill="#fff"/><circle cx="-12" cy="-8" r="15" fill="#fff"/><circle cx="12" cy="-12" r="18" fill="#fff"/></g>
          <g class="gr-cloud c2"><ellipse cx="0" cy="0" rx="30" ry="10" fill="#fff"/><circle cx="-8" cy="-7" r="11" fill="#fff"/><circle cx="9" cy="-9" r="13" fill="#fff"/></g>
        </g>
        <g class="gr-rainclouds" opacity="0">${[90, 220, 360, 500].map((x, i) => `<g transform="translate(${x} ${48 + (i % 2) * 14})"><ellipse rx="70" ry="22" fill="#6B7A8C"/><circle cx="-24" cy="-14" r="24" fill="#7A899B"/><circle cx="20" cy="-18" r="28" fill="#6B7A8C"/></g>`).join('')}</g>
        <g class="gr-backdrop">${backdrop(medium, K, groundY)}</g>
        <g class="gr-neigh"></g>
        <g class="gr-weeds"></g>
        <g class="gr-underground" clip-path="url(#${medium === 'cocopeat' && K.form !== 'micro' ? 'gr-potclip' : 'gr-under'})"><g class="gr-roots"></g><g class="gr-bubbles"></g></g>
        <g class="gr-puddle" opacity="0"><ellipse cx="${plantX}" cy="${groundY + 3}" rx="150" ry="9" fill="#6FA9D6" opacity=".75"/><ellipse cx="${plantX - 40}" cy="${groundY + 1}" rx="60" ry="3" fill="#fff" opacity=".45"/></g>
        <g class="gr-plant" transform="translate(${plantX} ${groundY})"></g>
        <g class="gr-foreground">${foreground(medium, K, groundY)}</g>
        <g class="gr-net" opacity="0"><path d="M60 92V${groundY}M540 92V${groundY}" stroke="#7A5634" stroke-width="6"/><rect class="gr-net-cloth" x="54" y="86" width="492" height="16" rx="3" fill="url(#gr-mesh)" stroke="#2F7A3B" stroke-width="2"/><rect x="54" y="86" width="492" height="16" rx="3" fill="#2F7A3B" opacity=".35"/><path d="M60 102L80 ${groundY - 40}M540 102L520 ${groundY - 40}" stroke="#2F7A3B" stroke-width="1" opacity=".0"/></g>
        <g class="gr-shadow-net" opacity="0"><rect x="0" y="0" width="${W}" height="${H}" fill="#123B1A" opacity=".18"/></g>
        <g class="gr-haze" opacity="0"><rect width="${W}" height="${H}" fill="#FF9A3C" opacity=".14"/>${[150, 260, 360, 460].map(x => `<path class="hz" d="M${x} ${groundY}q-10 -20 0 -40q10 -20 0 -40q-10 -20 0 -40" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`).join('')}</g>
        <g class="gr-rain" opacity="0"></g>
        <g class="gr-fx"></g>
        <g class="gr-thermo" transform="translate(560 120)" opacity="${has('temp') ? 1 : 0}"><rect x="-9" y="-46" width="18" height="96" rx="9" class="gr-thermo-bg"/><rect x="-3.5" y="-38" width="7" height="72" rx="3.5" fill="#F4EADB"/><rect class="gr-thermo-fill" x="-3.5" y="-10" width="7" height="44" rx="3.5" fill="#D9452B"/><circle cy="38" r="8" fill="#D9452B"/></g>
      </svg>
      <div class="gr-event" hidden><span class="gr-ev-ic" aria-hidden="true"></span><p></p></div>
      <div class="gr-tools" hidden role="group" aria-label="Pick the right fix"></div>
      <button type="button" class="gr-harvest lab-go" hidden></button>
      <div class="gr-hud" aria-live="polite">
        <div class="gr-day"><span class="gr-dayn">Day <b>0</b></span><small>of ${days}</small></div>
        <div class="gr-stage">Seed</div>
      </div>
    </div>
    <aside class="gr-panel">
      <div class="gr-health"><span class="gr-heart" aria-hidden="true">♥</span><div class="gr-hbar" role="meter" aria-label="Plant health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div><b class="gr-hv">100</b></div>
      <div class="gr-ctrls"></div>
      <div class="gr-go"><button type="button" class="lab-act gr-play">▶ Grow</button><button type="button" class="lab-act ghost gr-speed" aria-label="Speed: normal">1×</button></div>
    </aside>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('svg'), plantG = $('.gr-plant'), rootsG = $('.gr-roots'), fxG = $('.gr-fx'), neighG = $('.gr-neigh'), weedsG = $('.gr-weeds');
  const stop0 = $('.s0'), stop1 = $('.s1'), sunG = $('.gr-sun'), moonG = $('.gr-moon'), starsG = $('.gr-stars');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.append(e); return e; };

  /* ---------- controls ---------- */
  const ctrlEls = controls.map(c => {
    const id = `gr-${c.key}-${Math.random().toString(36).slice(2, 7)}`;
    const row = h(`<div class="gr-ctrl" data-key="${esc(c.key)}">
      <label for="${id}"><span class="gr-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[c.key] || ICON.nutrients}</svg></span><span class="gr-cl">${esc(c.label || KEYNAME[c.key] || c.key)}</span><output class="gr-cv"></output></label>
      <input id="${id}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.v}">
      <span class="gr-chip" aria-live="polite"></span></div>`);
    row._c = c;
    const inp = row.querySelector('input');
    const fmtV = () => { row.querySelector('.gr-cv').textContent = `${+(+c.v).toFixed(2)} ${c.unit || ''}`.trim(); inp.style.setProperty('--p', `${(c.v - c.min) / (c.max - c.min) * 100}%`); };
    inp.addEventListener('input', () => { c.v = +inp.value; fmtV(); applyEnv(); if (started) updateChips(); api.sound('tick'); });
    fmtV();
    $('.gr-ctrls').append(row);
    return row;
  });
  const devOf = c => { const r = (c.max - c.min) || 1; return c.v < c.ideal[0] ? -(c.ideal[0] - c.v) / r : c.v > c.ideal[1] ? (c.v - c.ideal[1]) / r : 0; };
  const scoreOf = c => clamp(1 - Math.abs(devOf(c)) * 3.2, 0, 1);
  function quality() {
    if (!controls.length) return 1;
    const s = controls.map(scoreOf);
    return .5 * s.reduce((a, b) => a + b, 0) / s.length + .5 * Math.min(...s);
  }
  function updateChips() {
    ctrlEls.forEach(row => {
      const d = devOf(row._c), chip = row.querySelector('.gr-chip');
      const st = d < -1e-9 ? 'low' : d > 1e-9 ? 'high' : 'ok';
      chip.className = `gr-chip ${st}`;
      chip.textContent = st === 'ok' ? '✓ Just right' : st === 'low' ? '▼ Too little' : '▲ Too much';
      if (row._c.key === 'spacing') chip.textContent = st === 'ok' ? '✓ Just right' : st === 'low' ? '▼ Too close' : '▲ Too far apart';
      if (row._c.key === 'temp') chip.textContent = st === 'ok' ? '✓ Just right' : st === 'low' ? '▼ Too cold' : '▲ Too hot';
    });
  }
  function applyEnv() {
    // targets for the plant's look (eased in the ticker), and the scene's own reactions
    T.droop = T.yellow = T.leggy = T.brown = 0;
    for (const c of controls) {
      const d = devOf(c), m = clamp(Math.abs(d) * 3.2, 0, 1);
      if (!d) continue;
      const low = d < 0;
      switch (c.key) {
        case 'water': if (low) T.droop = Math.max(T.droop, m); else T.yellow = Math.max(T.yellow, m * .9); break;
        case 'sun': if (low) T.leggy = Math.max(T.leggy, m); else T.brown = Math.max(T.brown, m); break;
        case 'nutrients': if (low) T.yellow = Math.max(T.yellow, m); else T.brown = Math.max(T.brown, m * .8); break;
        case 'ph': T.brown = Math.max(T.brown, m); T.yellow = Math.max(T.yellow, m * .4); break;
        case 'spacing': if (low) T.leggy = Math.max(T.leggy, m * .6); break;
        case 'temp': if (low) T.yellow = Math.max(T.yellow, m * .5); else { T.droop = Math.max(T.droop, m * .7); T.brown = Math.max(T.brown, m * .5); } break;
        case 'shade': if (low) T.brown = Math.max(T.brown, m * .6); else T.leggy = Math.max(T.leggy, m); break;
      }
    }
    const val = k => { const c = controls.find(x => x.key === k); return c ? (c.v - c.min) / ((c.max - c.min) || 1) : null; };
    env.moist = val('water') ?? .5; env.shade = val('shade') ?? 0; env.temp = val('temp') ?? .5; env.sun = val('sun') ?? .6; env.spacing = val('spacing'); env.nutrients = val('nutrients') ?? .4;
    // scene reactions
    const wet = $('.gr-soilwet'); if (wet) gsap.to(wet, { opacity: clamp(env.moist * 1.1 - .1, 0, .9), duration: .5 });
    if (!paused || paused.kind !== 'rain') gsap.to($('.gr-puddle'), { opacity: has('water') && devOf(controls.find(c => c.key === 'water')) > 0 ? clamp(devOf(controls.find(c => c.key === 'water')) * 4, 0, 1) : puddle, duration: .5 });
    if (has('shade')) { shadeNet = env.shade; gsap.to($('.gr-net'), { opacity: env.shade > .03 ? .4 + env.shade * .6 : 0, duration: .4 }); gsap.to($('.gr-shadow-net'), { opacity: env.shade, duration: .4 }); }
    const th = $('.gr-thermo-fill'); const tf = 8 + env.temp * 64; th.setAttribute('y', n1(34 - tf)); th.setAttribute('height', n1(tf));
    const nut = $('.gr-granules'); if (nut) nut.style.opacity = has('nutrients') ? clamp(env.nutrients * 1.2, 0, 1) : .3;
    drawNeighbours();
  }

  /* ---------- static scenery helpers ---------- */
  function drawRoots() {
    const depth = medium === 'water' ? 105 : 110, s = clamp(S.g * 1.4, .05, 1) * depth * (.7 + .3 * S.vigor);
    const wd = medium === 'water' ? .5 : 1;
    const col = medium === 'water' ? '#F4F0DC' : '#EFE2C4', hairCol = S.dead ? '#8A6A3A' : col;
    if (K.form === 'micro') { rootsG.innerHTML = ''; return; }
    rootsG.setAttribute('transform', `translate(${plantX} ${groundY + (medium === 'water' ? 10 : 0)})`);
    rootsG.innerHTML = roots.filter(r => r.d <= Math.floor(S.g * 5)).map(r => `<path d="${smoothD(r.pts.map(p => [p[0] * s * (r.d ? 1.15 : .35) * wd, p[1] * s]))}" stroke="${hairCol}" stroke-width="${n1(Math.max(.7, (3.4 - r.d * .9) * (.4 + .6 * S.g)))}" fill="none" stroke-linecap="round" opacity="${r.d > 2 ? .7 : .95}"/>`).join('');
  }
  function drawNeighbours() {
    if (env.spacing == null || medium !== 'soil' || K.form === 'micro') { neighG.innerHTML = ''; return; }
    const dx = 70 + env.spacing * 170;
    const NS2 = { ...S, g: S.g * .95, pests: 0, leggy: Math.max(S.leggy, 0) };
    const p = drawPlant(K, NS2, tAll + 1.7, rnd).svg;
    neighG.innerHTML = [-1, 1].map(s => `<g transform="translate(${n1(plantX + s * dx)} ${groundY - 4}) scale(.82)" opacity=".7">${p}</g>`).join('') + (dx < 300 ? [-1, 1].map(s => `<g transform="translate(${n1(plantX + s * dx * 2)} ${groundY - 6}) scale(.7)" opacity=".45">${p}</g>`).join('') : '');
  }

  /* ---------- sky ---------- */
  const SKY = { day: ['#6FBFEE', '#D8F0FB'], dusk: ['#F29A5A', '#FBE0AE'], night: ['#16203F', '#36477A'] };
  function sky(phase) {
    // phase 0..1 within a day: 0–.7 sun up, .7–.8 dusk, .8–.95 night, .95–1 dawn
    let a, b, night = 0;
    const dayLen = has('sun') ? clamp(.45 + env.sun * .35, .45, .8) : .7;
    if (api.reduced || !started) phase = .35 * dayLen / .7;
    const p = phase;
    const mix = (x, y, t) => [mixHex(x[0], y[0], t), mixHex(x[1], y[1], t)];
    if (p < dayLen - .06) [a, b] = SKY.day;
    else if (p < dayLen + .04) [a, b] = mix(SKY.day, SKY.dusk, (p - dayLen + .06) / .1);
    else if (p < dayLen + .1) { [a, b] = mix(SKY.dusk, SKY.night, (p - dayLen - .04) / .06); night = (p - dayLen - .04) / .06; }
    else if (p < .95) { [a, b] = SKY.night; night = 1; }
    else { [a, b] = mix(SKY.night, SKY.day, (p - .95) / .05); night = 1 - (p - .95) / .05; }
    if (heatOn) { a = mixHex(a, '#F6B26B', heatOn * .5); b = mixHex(b, '#FFE2A8', heatOn * .6); }
    if (rainOn) { a = mixHex(a, '#7D8A99', rainOn * .7); b = mixHex(b, '#B9C3CE', rainOn * .7); }
    stop0.setAttribute('stop-color', a); stop1.setAttribute('stop-color', b);
    starsG.setAttribute('opacity', n1(night));
    const sp = clamp(p / dayLen, 0, 1), sa = Math.PI * (1 - sp);
    const sunR = 1 + heatOn * .5;
    sunG.setAttribute('transform', `translate(${n1(300 + Math.cos(sa) * 250)} ${n1(250 - Math.sin(sa) * 190)}) scale(${n1(sunR)})`);
    sunG.setAttribute('opacity', p < dayLen + .04 ? 1 : 0);
    $('.gr-sun-hot').setAttribute('opacity', n1(.35 + heatOn * .6));
    const mp = clamp((p - dayLen) / (1 - dayLen), 0, 1), ma = Math.PI * (1 - mp);
    moonG.setAttribute('transform', `translate(${n1(300 + Math.cos(ma) * 240)} ${n1(240 - Math.sin(ma) * 170)})`);
    moonG.setAttribute('opacity', n1(night));
    root.classList.toggle('night', night > .5);
  }

  /* ---------- the loop ---------- */
  const dayDur = () => (api.reduced ? .35 : 1.15) / speed;
  let renderSkip = 0;
  const tick = () => {
    const dt = Math.min(.05, gsap.ticker.deltaRatio() / 60);
    tAll += dt;
    if (running && !paused && !ended) {
      dayFrac += dt / dayDur();
      // grow continuously
      S.g = clamp(S.g + dt / dayDur() / days * (S.dead ? 0 : 1), 0, 1);
      if (dayFrac >= 1) { dayFrac -= 1; nextDay(); }
    }
    // ease the look towards the targets
    const k = Math.min(1, dt * 1.6);
    S.droop = lerp(S.droop, clamp(T.droop * (started ? 1 : .35) + EV.droop, 0, 1), k);
    S.yellow = lerp(S.yellow, clamp(T.yellow * (started ? 1 : .35) + EV.yellow, 0, 1), k);
    S.leggy = lerp(S.leggy, clamp(T.leggy * (started ? 1 : .35), 0, 1), k);
    S.brown = lerp(S.brown, clamp(T.brown * (started ? 1 : .35) + EV.brown, 0, 1), k);
    S.pests = lerp(S.pests, EV.pests, Math.min(1, dt * 2.5));
    // clouds drift
    const c1 = $('.gr-cloud.c1'), c2 = $('.gr-cloud.c2');
    c1.setAttribute('transform', `translate(${n1((tAll * 8) % 760 - 80)} 70)`); c2.setAttribute('transform', `translate(${n1((tAll * 5 + 380) % 760 - 80)} 110)`);
    sky(running || ended ? dayFrac : .3);
    if (rainOn > .01) drawRain();
    if (++renderSkip % (running ? 1 : 2) === 0) render();
  };
  function render() {
    const p = drawPlant(K, S, tAll, rnd);
    plantG.innerHTML = p.svg;
    plantG._fruit = p.fruit; plantG._top = p.top;
    drawRoots();
    if (env.spacing != null && renderSkip % 6 === 0) drawNeighbours();
    if (medium === 'water' && !api.reduced && renderSkip % 14 === 0) bubble();
  }
  gsap.ticker.add(tick);

  function nextDay() {
    day++;
    const q = quality();
    if (q >= .985) health = Math.min(100, health + 2.5); else health = Math.max(0, health - (1 - q) * 6.5);
    S.vigor = lerp(S.vigor, q, .12);
    healthSum += health; healthN++;
    updateHud();
    if (day === 2) { updateChips(); root.classList.add('chips'); api.say('Look at the slider labels: they now tell you if each condition is just right.', 'hint'); }
    // a hint about the worst condition every few days
    if (day - lastHint >= 5 && q < .985) {
      const worst = [...controls].sort((a, b) => scoreOf(a) - scoreOf(b))[0];
      const d = devOf(worst);
      if (d) { api.say(SYMPTOM[worst.key]?.[d < 0 ? 'low' : 'high'] || `${worst.label} is not right yet.`, 'hint'); lastHint = day; pulseCtrl(worst.key); }
    }
    if (health <= 0) { die(); return; }
    const ev = events.find(e => !e.done && e.day <= day);
    if (ev) { startEvent(ev); return; }
    if (day >= days) finishGrowth();
  }
  function pulseCtrl(key) { const row = ctrlEls.find(r => r._c.key === key); if (row && !api.reduced) gsap.fromTo(row, { backgroundColor: 'rgba(217,138,28,.35)' }, { backgroundColor: 'rgba(217,138,28,0)', duration: 1.4 }); }
  const stageName = () => {
    const g = S.g;
    if (S.dead) return 'Wilted';
    if (g < .06) return 'Seed';
    if (g < .15) return 'Sprouting';
    if (g < .35) return 'Seedling';
    if (K.flowerAt && g < K.flowerAt) return 'Growing leaves';
    if (K.flowerAt && g < (K.fruitAt || 1)) return 'Flowering';
    if (K.fruit && g < Math.min(1, K.ripeAt ?? 1)) return K.fruit === 'marigold' ? 'Blooming' : 'Fruiting';
    if (g < .85) return 'Growing';
    return 'Ready to harvest';
  };
  function updateHud() {
    $('.gr-dayn b').textContent = day;
    $('.gr-stage').textContent = stageName();
    const hv = Math.round(health);
    $('.gr-hv').textContent = hv;
    const bar = $('.gr-hbar i');
    bar.style.transform = `scaleX(${hv / 100})`;
    bar.style.background = hv >= 80 ? 'var(--ok)' : hv >= 55 ? 'var(--amber)' : 'var(--bad)';
    $('.gr-hbar').setAttribute('aria-valuenow', hv);
    api.progress(Math.min(.95, day / days * .9 + (ended ? .1 : 0)));
  }

  /* ---------- play controls ---------- */
  const playBtn = $('.gr-play');
  playBtn.onclick = () => {
    if (ended || paused) return;
    if (S.dead) { restartGrowth(); return; }
    running = !running;
    if (running && !started) { started = true; api.say(`Day 1… Watch your ${K.name} grow. You can move the sliders at any time.`); root.classList.add('started'); sparkle(api, playBtn); }
    playBtn.textContent = running ? '❚❚ Pause' : '▶ Grow';
    api.sound(running ? 'whoosh' : 'click');
  };
  $('.gr-speed').onclick = e => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; e.currentTarget.textContent = `${speed}×`; e.currentTarget.setAttribute('aria-label', `Speed: ${speed} times`); api.sound('click'); };

  /* ---------- events ---------- */
  const evBox = $('.gr-event'), tools = $('.gr-tools');
  function startEvent(ev) {
    paused = ev; ev.done = true;
    playBtn.disabled = true;
    api.sound('bad');
    evBox.hidden = false;
    evBox.querySelector('.gr-ev-ic').textContent = { pests: '🐛', heat: '🔥', rain: '🌧️', weeds: '🌱', wilting: '🥀' }[ev.kind] || '⚠️';
    evBox.querySelector('p').textContent = ev.text || EVENT_HINT[ev.kind] || 'Something is wrong!';
    if (!api.reduced) gsap.fromTo(evBox, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'back.out(2)' });
    api.say(`Day ${day}: ${ev.text || 'Something is wrong!'} Pick the right fix.`, 'hint');
    // symptoms
    if (ev.kind === 'pests') { EV.pests = 1; EV.yellow = .25; }
    if (ev.kind === 'heat') { gsap.to(ST, { heat: 1, duration: 1, onUpdate: syncST }); EV.droop = .6; EV.brown = .3; }
    if (ev.kind === 'rain') { gsap.to(ST, { rain: 1, duration: 1, onUpdate: syncST }); gsap.to($('.gr-puddle'), { opacity: 1, duration: 2 }); EV.yellow = .45; }
    if (ev.kind === 'weeds') sproutWeeds();
    if (ev.kind === 'wilting') { EV.droop = .95; }
    // toolbox
    const keys = ['neem', 'shade', 'weed', 'drain', 'water'];
    tools.innerHTML = keys.map(k => `<button type="button" class="gr-tool" data-fix="${k}"><span aria-hidden="true">${FIX[k].ico}</span>${esc(k === ev.fix && ev.fixLabel ? ev.fixLabel : FIX[k].label)}</button>`).join('');
    tools.hidden = false;
    if (!api.reduced) gsap.from(tools.children, { y: 30, opacity: 0, duration: .4, stagger: .06, ease: 'back.out(2)', delay: .3 });
    tools.querySelectorAll('button').forEach(b => b.onclick = () => pickFix(b, ev));
  }
  const ST = { heat: 0, rain: 0 };
  const syncST = () => { heatOn = ST.heat; rainOn = ST.rain; $('.gr-haze').setAttribute('opacity', n1(ST.heat)); $('.gr-rainclouds').setAttribute('opacity', n1(ST.rain)); $('.gr-rain').setAttribute('opacity', n1(ST.rain)); };
  function pickFix(btn, ev) {
    if (btn.disabled || paused !== ev) return;
    const k = btn.dataset.fix;
    if (k !== ev.fix) {
      api.mistake(); health = Math.max(1, health - 4); updateHud();
      btn.classList.add('wrong'); btn.disabled = true; shake(api, btn);
      api.say(`${FIX[k].label} won't help here. ${EVENT_HINT[ev.kind] || ''}`, 'bad');
      return;
    }
    tools.querySelectorAll('button').forEach(b => { b.disabled = true; });
    btn.classList.add('right');
    pop(api, btn);
    api.sound('good');
    const done = () => {
      tools.hidden = true; evBox.hidden = true;
      api.say({ neem: 'The neem spray chased the aphids away. Neem is a natural, safe pest repellent.', shade: 'The shade net cools the plant and stops the leaves from scorching.', weed: 'Weeds out! Now your plant gets all the water and food.', drain: 'The extra water drained away, so the roots can breathe again.', water: 'A good drink of water: the leaves perk up again.' }[k], 'good');
      paused = null; playBtn.disabled = false;
      if (day >= days) finishGrowth();
    };
    ({ neem: fixNeem, shade: fixShade, weed: fixWeeds, drain: fixDrain, water: fixWater }[k])(done);
  }
  function fixNeem(done) {
    const g = el('g', {}, fxG);
    g.innerHTML = `<g transform="scale(1.1)"><rect x="-12" y="-6" width="24" height="44" rx="6" fill="#3E8E4E"/><rect x="-9" y="6" width="18" height="16" rx="3" fill="#F6DFB5"/><path d="M-6 12h12M-6 16h8" stroke="#4C7424" stroke-width="1.5"/><rect x="-6" y="-16" width="12" height="12" rx="2" fill="#E6E2D8"/><path d="M6 -14h14v6H6z" fill="#BFC6CC"/><path d="M-2 -16q-10 0 -10 12" stroke="#BFC6CC" stroke-width="4" fill="none"/></g>`;
    const P = { x: plantX + 170, y: groundY - 160 };
    const set = () => g.setAttribute('transform', `translate(${n1(P.x)} ${n1(P.y)})`); set();
    const tl = gsap.timeline({ onComplete: () => { g.remove(); done(); } });
    tl.to(P, { x: plantX + 80, y: groundY - 130, duration: .5, ease: 'power2.out', onUpdate: set });
    const pts = [[80, -150], [70, -100], [75, -60], [80, -120]];
    pts.forEach(([x, y], i) => {
      tl.to(P, { x: plantX + x, y: groundY + y, duration: .35, onUpdate: set, onStart: () => mist(P.x - 6, P.y - 14) });
    });
    tl.to(EV, { pests: 0, yellow: 0, duration: .8 }, '-=.6').to(P, { x: plantX + 260, y: groundY - 200, duration: .4, ease: 'power2.in', onUpdate: set });
    tl.add(() => api.sound('whoosh'), 0);
  }
  function mist(x, y) {
    api.sound('whoosh');
    for (let i = 0; i < 16; i++) {
      const c = el('circle', { cx: x, cy: y, r: 1.5 + Math.random() * 2.5, fill: '#E6F4FF', opacity: .9 }, fxG);
      gsap.to(c, { attr: { cx: x - 40 - Math.random() * 80, cy: y + (Math.random() - .4) * 60, r: 4 + Math.random() * 5 }, opacity: 0, duration: .8 + Math.random() * .4, ease: 'power2.out', onComplete: () => c.remove() });
    }
  }
  function fixShade(done) {
    const net = $('.gr-net');
    gsap.timeline({ onComplete: () => { done(); timers.push(setTimeout(() => { if (!has('shade') && !ended) gsap.to(net, { opacity: 0, duration: .6 }); gsap.to($('.gr-shadow-net'), { opacity: has('shade') ? env.shade : 0, duration: .6 }); }, (api.reduced ? 1 : 6) * dayDur() * 1000)); } })
      .set(net, { opacity: 1 })
      .fromTo(net.querySelector('.gr-net-cloth'), { attr: { width: 0 } }, { attr: { width: 492 }, duration: 1, ease: 'power2.out' })
      .to($('.gr-shadow-net'), { opacity: .7, duration: .6 }, '-=.4')
      .to(ST, { heat: 0, duration: 1, onUpdate: syncST }, '-=.3')
      .to(EV, { droop: 0, brown: 0, duration: 1 }, '<');
    api.sound('whoosh');
  }
  function sproutWeeds() {
    weedsG.innerHTML = '';
    const xs = [-150, -95, -55, 60, 110, 160].map(x => plantX + x + (Math.random() - .5) * 14);
    weeds = xs.map((x, i) => {
      const g = el('g', { transform: `translate(${n1(x)} ${groundY})` }, weedsG);
      g._x = x;
      const s = .8 + Math.random() * .5;
      g.innerHTML = `<g class="wd" transform="scale(${n1(s)})">${[-30, -12, 8, 26].map(a => `<path d="M0 2q${a * .3} -14 ${a * .7} -26" stroke="#6E9A2E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${leafD(16, 7)}" fill="#7FA83A" transform="translate(${a * .55} -18) rotate(${a})"/>`).join('')}${i % 2 ? `<path d="M2 2V-34" stroke="#6E9A2E" stroke-width="2"/><circle cx="2" cy="-37" r="6" fill="#F6D02F"/><circle cx="2" cy="-37" r="2.5" fill="#E39B17"/>` : ''}</g>`;
      const inner = g.firstElementChild;
      if (!api.reduced) gsap.from(inner, { scale: 0, transformOrigin: '50% 100%', duration: .5, delay: i * .12, ease: 'back.out(2.5)' });
      return g;
    });
    EV.yellow = .3; EV.droop = .2;
  }
  function fixWeeds(done) {
    const tl = gsap.timeline({ onComplete: done });
    weeds.forEach((w, i) => {
      tl.to(w, { y: -60, x: (i < 3 ? -1 : 1) * 60, rotation: (i < 3 ? -1 : 1) * 60, opacity: 0, duration: .45, ease: 'power2.in', onStart: () => { api.sound('pop'); dirt(w._x); } }, i * .22);
    });
    tl.to(EV, { yellow: 0, droop: 0, duration: .6 }).add(() => { weedsG.innerHTML = ''; weeds = []; });
  }
  function dirt(x) {
    for (let i = 0; i < 8; i++) {
      const c = el('circle', { cx: x, cy: groundY, r: 1.5 + Math.random() * 2, fill: '#6B4426' }, fxG);
      gsap.to(c, { attr: { cx: x + (Math.random() - .5) * 40, cy: groundY - 10 - Math.random() * 30 }, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => c.remove() });
    }
  }
  function fixDrain(done) {
    // a little channel opens at the side and the water runs away
    const ch = el('path', { d: `M${plantX + 150} ${groundY + 2}Q${plantX + 210} ${groundY + 8} ${W} ${groundY + 18}`, stroke: '#5A93C4', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round', opacity: .9 }, fxG);
    gsap.timeline({ onComplete: () => { gsap.to(ch, { opacity: 0, duration: .5, onComplete: () => ch.remove() }); done(); } })
      .fromTo(ch, { drawSVG: '0%' }, { drawSVG: '100%', duration: .6, ease: 'power1.out' })
      .to($('.gr-puddle'), { opacity: 0, duration: 1.4 })
      .to(ST, { rain: 0, duration: 1.2, onUpdate: syncST }, '<')
      .to(EV, { yellow: 0, duration: 1 }, '<');
    api.sound('whoosh');
  }
  function fixWater(done) {
    const g = el('g', {}, fxG);
    g.innerHTML = `<path d="M-30 -10h44v34a6 6 0 0 1 -6 6h-32a6 6 0 0 1 -6 -6z" fill="#2E8BC0"/><path d="M14 -2l28 -20l4 4l-26 24z" fill="#2E8BC0"/><circle cx="45" cy="-20" r="5" fill="#1F6E9A"/><path d="M-30 -2q-14 6 0 22" stroke="#1F6E9A" stroke-width="5" fill="none"/><path d="M-24 -4v24" stroke="#fff" opacity=".35" stroke-width="4" stroke-linecap="round"/>`;
    const P = { x: plantX + 160, y: groundY - 170, r: 0 };
    const set = () => g.setAttribute('transform', `translate(${n1(P.x)} ${n1(P.y)}) rotate(${n1(P.r)})`); set();
    gsap.timeline({ onComplete: () => { g.remove(); done(); } })
      .to(P, { x: plantX + 40, y: groundY - 130, duration: .5, ease: 'power2.out', onUpdate: set })
      .to(P, { r: 30, duration: .3, onUpdate: set })
      .add(() => {
        for (let i = 0; i < 26; i++) {
          const d = el('path', { d: 'M0 0q-3 5 0 7q3 -2 0 -7z', fill: '#7FC4F0', transform: `translate(${plantX + 70} ${groundY - 140})` }, fxG);
          gsap.to(d, { x: -40 - Math.random() * 60, y: 120 + Math.random() * 20, duration: .6, delay: i * .04, ease: 'power2.in', onComplete: () => d.remove() });
        }
        api.sound('whoosh');
      })
      .to(EV, { droop: 0, duration: 1.2 }, '+=.3')
      .to(P, { r: 0, x: plantX + 220, y: groundY - 220, duration: .4, ease: 'power2.in', onUpdate: set });
  }
  const drops = [];
  function drawRain() {
    const rg = $('.gr-rain');
    if (!drops.length) for (let i = 0; i < 70; i++) { drops.push({ x: Math.random() * W, y: Math.random() * H, v: 380 + Math.random() * 200, e: el('path', { stroke: '#CFE6F7', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: .8 }, rg) }); }
    for (const d of drops) { d.y += d.v / 60; if (d.y > groundY) { d.y = -20; d.x = Math.random() * W; } d.e.setAttribute('d', `M${n1(d.x)} ${n1(d.y)}l-3 12`); }
  }
  function bubble() {
    const b = el('circle', { cx: plantX + (Math.random() - .5) * 140, cy: H - 26, r: 1.5 + Math.random() * 3, fill: 'rgba(255,255,255,.4)', stroke: '#fff', 'stroke-width': .8 }, $('.gr-bubbles'));
    gsap.to(b, { attr: { cy: groundY + 18 }, cx: '+=' + ((Math.random() - .5) * 20), duration: 1.6 + Math.random(), ease: 'power1.in', onComplete: () => b.remove() });
  }

  /* ---------- death and the end ---------- */
  function die() {
    running = false; S.dead = 0; api.mistake();
    gsap.to(S, { dead: 1, duration: api.reduced ? .2 : 1.6 });
    playBtn.textContent = '↺ Try again';
    api.say(`Oh no, the ${K.name} has died. Look at the slider labels: fix what is wrong, then try again.`, 'bad');
    updateChips(); root.classList.add('chips');
    $('.gr-stage').textContent = 'Wilted';
  }
  function restartGrowth() {
    gsap.killTweensOf(S); gsap.killTweensOf(EV);
    Object.assign(S, { g: 0, vigor: 1, dead: 0, picked: new Set() });
    Object.assign(EV, { droop: 0, yellow: 0, brown: 0, pests: 0 });
    day = 0; dayFrac = 0; health = 100; lastHint = -10; healthSum = 0; healthN = 0;
    events.forEach(e => { e.done = false; });
    weedsG.innerHTML = '';
    running = true; playBtn.textContent = '❚❚ Pause';
    updateHud();
    api.say('A fresh seed! Day 1 again.');
  }
  function finishGrowth() {
    if (ended) return;
    ended = true; running = false;
    playBtn.disabled = true; playBtn.textContent = 'Grown!';
    $('.gr-speed').disabled = true;
    gsap.to({ v: S.g }, { v: 1, duration: .6, onUpdate() { S.g = this.targets()[0].v; } });
    updateHud();
    const hv = Math.round(health);
    const hb = $('.gr-harvest');
    if (cfg.harvest) {
      hb.innerHTML = `${cfg.harvest.sprite ? `<span class="gr-hv-art">${api.art(cfg.harvest)}</span>` : '🧺'} ${esc(cfg.harvest.text || 'Harvest!')}`;
      hb.hidden = false;
      if (!api.reduced) gsap.fromTo(hb, { scale: .5, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(2.2)', delay: .6 });
      api.say(`Day ${days}! Your ${K.name} is ready, with health ${hv}. Time to harvest!`, 'good');
      hb.onclick = harvest;
    } else {
      api.say(`Day ${days}! Your ${K.name} has grown, with health ${hv}.`, 'good');
      timers.push(setTimeout(complete, api.reduced ? 300 : 1800));
    }
  }
  function complete() {
    const hv = Math.round(health);
    api.complete({ stars: hv >= 80 ? 3 : hv >= 55 ? 2 : 1, score: hv / 100, message: cfg.win || `Final health: ${hv}/100. ${hv >= 80 ? 'A healthy, happy plant!' : hv >= 55 ? 'Good, but some conditions were off for a while.' : 'The plant struggled. Try to keep every slider in the green.'}` });
  }
  function harvest() {
    const hb = $('.gr-harvest');
    hb.disabled = true;
    gsap.to(hb, { scale: .8, opacity: 0, duration: .3, onComplete: () => { hb.hidden = true; } });
    root.classList.add('picking');
    const basket = el('g', { transform: `translate(${W - 92} ${H - 48})` }, fxG);
    basket.innerHTML = `<ellipse cx="0" cy="34" rx="56" ry="8" fill="#000" opacity=".2"/><path d="M-52 -4H52L42 32H-42Z" fill="#C98B44"/><path d="M-50 4H50M-47 14H47M-44 24H44" stroke="#9A6430" stroke-width="2.5"/><path d="M-30 -4V32M-10 -4V32M10 -4V32M30 -4V32" stroke="#9A6430" stroke-width="2" opacity=".6"/><path d="M-40 -4Q0 -60 40 -4" stroke="#9A6430" stroke-width="5" fill="none"/><rect x="-56" y="-8" width="112" height="9" rx="4" fill="#B5793A"/>`;
    const counter = el('text', { x: 0, y: -26, 'text-anchor': 'middle', class: 'gr-count' }, basket);
    if (!api.reduced) gsap.from(basket, { y: 80, opacity: 0, duration: .5, ease: 'back.out(2)' });
    const fr = (plantG._fruit || []).slice(0, 10);
    const item = cfg.harvest?.sprite && api.hasSprite(cfg.harvest.sprite) ? api.sprite(cfg.harvest.sprite) : null;
    let n = 0;
    const tl = gsap.timeline({ delay: api.reduced ? 0 : .5, onComplete: () => { sparkle(api, $('.gr-scene')); api.say(`You picked ${n} ${n === 1 ? 'one' : ''}! ${cfg.harvest?.text ? '' : ''}Great harvest.`.replace(' one!', '!'), 'good'); timers.push(setTimeout(complete, api.reduced ? 200 : 1200)); } });
    fr.forEach((f, i) => {
      const g = el('g', {}, fxG);
      const x0 = plantX + f.x, y0 = groundY + f.y;
      g.innerHTML = item ? item.replace('<svg ', `<svg x="-16" y="-16" width="32" height="32" style="width:32px;height:32px" `) : `<circle r="9" fill="${K.fruit === 'tomato' ? '#E0412C' : K.fruit === 'chilli' ? '#D8342A' : K.fruit === 'marigold' ? '#F39A1E' : '#5EA234'}"/>`;
      g.setAttribute('transform', `translate(${n1(x0)} ${n1(y0)})`);
      const P = { t: 0 };
      tl.add(() => { S.picked.add(f.j); api.sound('pop'); }, i * .28);
      tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: .05 }, i * .28);
      tl.to(P, {
        t: 1, duration: .6, ease: 'power1.inOut', onUpdate: () => {
          const t = P.t, x = lerp(x0, W - 92 + (i % 5 - 2) * 14, t), y = lerp(y0, H - 52 - Math.floor(i / 5) * 8, t) - Math.sin(t * Math.PI) * 90;
          g.setAttribute('transform', `translate(${n1(x)} ${n1(y)}) rotate(${n1(t * 360)}) scale(${n1(1 - t * .2)})`);
        }, onComplete: () => { n++; counter.textContent = `×${n}`; api.sound('drop'); },
      }, i * .28);
    });
    if (!fr.length) tl.to({}, { duration: .5 });
  }

  /* ---------- go ---------- */
  applyEnv();
  updateHud();
  sky(.3);
  render();
  api.say(`${cfg.mission || ''} Set the sliders, then press Grow.`.trim());
  return {
    destroy() {
      gsap.ticker.remove(tick);
      timers.forEach(clearTimeout);
      gsap.killTweensOf([S, EV, ST]);
      gsap.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

/* ------------------------------------------------------------------------------------------------
   Scenery by medium
------------------------------------------------------------------------------------------------ */
function backdrop(medium, K, gy) {
  const hills = `<path d="M0 ${gy - 60}Q120 ${gy - 120} 250 ${gy - 70}T520 ${gy - 80}T${W} ${gy - 70}V${gy}H0Z" fill="#9CC48A" opacity=".75"/><path d="M0 ${gy - 30}Q160 ${gy - 80} 330 ${gy - 40}T${W} ${gy - 45}V${gy}H0Z" fill="#7FB06A" opacity=".8"/>`;
  if (K.form === 'micro') {
    return `${hills}<rect x="0" y="${gy - 6}" width="${W}" height="${H - gy + 6}" fill="#B9844E"/><path d="M0 ${gy + 22}H${W}" stroke="#94643A" stroke-width="3"/>
      <ellipse cx="300" cy="${gy + 40}" rx="170" ry="8" fill="#000" opacity=".2"/>
      <path d="M126 ${gy - 18}H474L466 ${gy + 36}H134Z" fill="#2D3034"/><rect x="134" y="${gy - 14}" width="332" height="16" fill="${medium === 'cocopeat' ? 'url(#gr-coco)' : medium === 'water' ? '#F2EEE5' : 'url(#gr-soil)'}"/><rect x="134" y="${gy - 14}" width="332" height="16" fill="url(#gr-dots)" opacity="${medium === 'water' ? 0 : .5}"/>`;
  }
  if (medium === 'water') {
    return `<rect x="0" y="0" width="${W}" height="${gy - 40}" fill="none"/><path d="M0 ${gy - 40}H${W}" stroke="#C9D3DC" stroke-width="4" opacity=".0"/>${hills}
      <rect x="0" y="${gy + 96}" width="${W}" height="${H - gy - 96}" fill="#B9844E"/><path d="M0 ${gy + 96}H${W}" stroke="#94643A" stroke-width="3"/>
      <ellipse cx="300" cy="${gy + 118}" rx="190" ry="8" fill="#000" opacity=".2"/>
      <rect x="120" y="${gy + 4}" width="360" height="110" rx="6" fill="rgba(210,235,248,.35)" stroke="rgba(150,200,225,.95)" stroke-width="4"/>
      <rect x="124" y="${gy + 22}" width="352" height="88" fill="url(#gr-water)"/>
      <path d="M124 ${gy + 22}H476" stroke="#fff" stroke-width="2" opacity=".6"/>
      <rect x="112" y="${gy - 4}" width="376" height="14" rx="4" fill="#ECEFF2" stroke="#B9C2CB" stroke-width="2"/>
      <rect x="282" y="${gy - 8}" width="36" height="34" rx="4" fill="#2F3438"/><path d="M286 ${gy + 2}H314M286 ${gy + 10}H314M286 ${gy + 18}H314" stroke="#555D63" stroke-width="2"/>
      <rect x="500" y="${gy + 66}" width="56" height="34" rx="6" fill="#3B4248"/><circle cx="514" cy="${gy + 83}" r="5" fill="#8DBB5A"/><path d="M500 ${gy + 80}Q470 ${gy + 60} 460 ${gy + 100}" stroke="#7FB3C9" stroke-width="3" fill="none"/><rect x="250" y="${gy + 98}" width="40" height="8" rx="4" fill="#9AA1AA"/><path d="M290 ${gy + 102}Q380 ${gy + 104} 460 ${gy + 100}" stroke="#7FB3C9" stroke-width="3" fill="none"/>`;
  }
  if (medium === 'cocopeat') {
    return `${hills}<rect x="0" y="${gy + 60}" width="${W}" height="${H - gy - 60}" fill="#C9B79A"/><path d="M0 ${gy + 60}H${W}" stroke="#A8957A" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${i * 120} ${gy + 60}L${i * 120 - 40} ${H}" stroke="#A8957A" stroke-width="2"/>`).join('')}
      <ellipse cx="300" cy="${gy + 120}" rx="110" ry="10" fill="#000" opacity=".22"/>
      <path d="M196 ${gy - 6}H404L384 ${gy + 120}H216Z" fill="url(#gr-pot)"/>
      <rect x="208" y="${gy - 2}" width="184" height="${H - gy}" fill="url(#gr-coco)" clip-path="url(#gr-potclip)"/>`;
  }
  // soil: fence + garden bed cut-away
  let fence = '';
  for (let x = 6; x < W; x += 34) fence += `<path d="M${x} ${gy - 8}V${gy - 92}l12 -12l12 12V${gy - 8}Z" fill="#E8D2A8" stroke="#BC9C6A" stroke-width="2"/>`;
  return `${hills}<rect x="0" y="${gy - 70}" width="${W}" height="10" fill="#D7BB88"/><rect x="0" y="${gy - 40}" width="${W}" height="10" fill="#D7BB88"/>${fence}
    <rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="url(#gr-soil)"/><rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="url(#gr-dots)" opacity=".6"/>
    <rect class="gr-soilwet" x="0" y="${gy}" width="${W}" height="${H - gy}" fill="#2A1608" opacity=".3"/>
    <path d="M0 ${gy + 70}Q150 ${gy + 62} 300 ${gy + 74}T${W} ${gy + 68}" stroke="#3A2210" stroke-width="2" fill="none" opacity=".35"/>
    ${[[60, gy + 40], [520, gy + 90], [140, gy + 100], [440, gy + 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="#8C8074"/><ellipse cx="${x - 3}" cy="${y - 2}" rx="3" ry="2" fill="#fff" opacity=".3"/>`).join('')}`;
}
function foreground(medium, K, gy) {
  if (K.form === 'micro') return `<path d="M126 ${gy - 18}H474" stroke="#4A4E54" stroke-width="5" stroke-linecap="round"/><path d="M134 ${gy + 2}L136 ${gy + 34}H464L466 ${gy + 2}" fill="none" stroke="#3A3D42" stroke-width="3"/>`;
  if (medium === 'water') return `<rect x="270" y="${gy - 10}" width="60" height="10" rx="3" fill="#2F3438"/>`;
  if (medium === 'cocopeat') return `<path d="M188 ${gy - 14}H412V${gy + 4}H188Z" fill="#D47A48"/><path d="M190 ${gy - 12}H410" stroke="#F0A372" stroke-width="3" stroke-linecap="round"/><path d="M226 ${gy + 14}L240 ${gy + 110}" stroke="#E79A68" stroke-width="5" opacity=".5" stroke-linecap="round"/><g class="gr-granules">${[230, 262, 340, 372, 300].map((x, i) => `<circle cx="${x}" cy="${gy + 1 + (i % 2)}" r="2.6" fill="#F2F2EE" stroke="#BBB" stroke-width=".6"/>`).join('')}</g>
    <defs><clipPath id="gr-potclip"><path d="M204 ${gy}H396L378 ${gy + 116}H222Z"/></clipPath></defs>`;
  let grass = ''; let x = 0; const r = rng(11);
  while (x < W) { grass += `<path d="M${n1(x)} ${gy + 2}q${n1(r() * 4 - 2)} ${n1(-6 - r() * 6)} ${n1(r() * 6 - 3)} ${n1(-9 - r() * 8)}" stroke="${['#5C9A2E', '#7DB446', '#4C8424'][Math.floor(r() * 3)]}" stroke-width="2" fill="none" stroke-linecap="round"/>`; x += 6 + r() * 7; if (x > 160 && x < 440) x = 440; }
  return `<path d="M0 ${gy}H160M440 ${gy}H${W}" stroke="#6FA83A" stroke-width="6"/><path d="M160 ${gy}H440" stroke="#5A3A20" stroke-width="3" opacity=".6"/>${grass}<g class="gr-granules">${[200, 236, 270, 334, 368, 404].map((x, i) => `<circle cx="${x}" cy="${gy - 1 + (i % 2)}" r="2.4" fill="#F2F2EE" stroke="#BBB" stroke-width=".6"/>`).join('')}</g>`;
}

export const demo = {
  title: 'Grow a tomato plant',
  mission: 'Grow healthy tomatoes in the school garden in 40 days. Find the right water, sunlight and nutrients, and deal with trouble when it comes.',
  fact: 'A tomato plant needs 6–8 hours of sunlight a day. Tomatoes are actually fruits, not vegetables!',
  plant: 'tomato',
  medium: 'soil',
  days: 40,
  controls: [
    { key: 'water', label: 'Water per day', min: 0, max: 10, ideal: [4, 6], unit: 'cups' },
    { key: 'sun', label: 'Sunlight', min: 0, max: 12, ideal: [6, 8], unit: 'hours' },
    { key: 'nutrients', label: 'Compost', min: 0, max: 10, ideal: [3, 6], unit: 'handfuls' },
    { key: 'spacing', label: 'Spacing', min: 10, max: 100, step: 5, ideal: [45, 60], unit: 'cm' },
  ],
  events: [
    { day: 14, kind: 'pests', text: 'Aphids are crawling up the stem!', fix: 'neem', fixLabel: 'Spray neem' },
    { day: 22, kind: 'weeds', text: 'Weeds are popping up around your plant.', fix: 'weed' },
    { day: 30, kind: 'heat', text: 'A heat wave! It is 42 °C today.', fix: 'shade', fixLabel: 'Put up a shade net' },
  ],
  harvest: { text: 'Pick the ripe tomatoes', sprite: 'tomato' },
  win: 'You grew juicy red tomatoes by giving the plant the right water, sun, food and care.',
};
