// VINC Lab · lab type `layers`: build something layer by layer in a cut-away container
// (compost bin, pot, bottle filter, trench, seed tray, bucket, tank, pit), then watch a time-lapse.
// See ../SPEC.md §2.4. Everything is drawn here in SVG; textures are procedural and seeded, so the
// same config always looks the same.
import { h, esc, shuffle, shake, pop, sparkle } from '../kit.js';
import { t, isHi } from '../../../i18n.js';

export const meta = { title: 'Build it layer by layer', needs: ['gsap'] };

const W = 520, H = 440;
const NS = 'http://www.w3.org/2000/svg';

/* ------------------------------------------------------------------------------------------------
   Small maths helpers (seeded randomness, smooth paths)
------------------------------------------------------------------------------------------------ */
function hash(s) { let x = 2166136261; for (const c of String(s)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; }
function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hash(seed);
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const R = (r, a, b) => a + r() * (b - a);
const pick = (r, a) => a[Math.floor(r() * a.length)];
const n1 = v => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function closedSmooth(p) {
  const n = p.length; let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + 'Z';
}
function openSmooth(p) {
  const n = p.length; let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(n - 1, i + 2)];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d;
}
const blob = (r, cx, cy, rx, ry, n = 7, j = .16, rot = 0) => closedSmooth(Array.from({ length: n }, (_, i) => { const a = rot + i / n * Math.PI * 2, k = 1 + R(r, -j, j); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; }));
const poly = (r, cx, cy, rad, n = 6, j = .3) => 'M' + Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 + R(r, -.3, .3), k = 1 + R(r, -j, j); return `${n1(cx + Math.cos(a) * rad * k)} ${n1(cy + Math.sin(a) * rad * k * .8)}`; }).join('L') + 'Z';
const leafD = (len, wid) => `M0 0C${n1(wid * .55)} ${n1(-len * .15)} ${n1(wid * .6)} ${n1(-len * .72)} 0 ${n1(-len)}C${n1(-wid * .6)} ${n1(-len * .72)} ${n1(-wid * .55)} ${n1(-len * .15)} 0 0Z`;

/** x-extent of a polygon at height y. */
function xRange(poly, y) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    if ((y >= Math.min(y1, y2)) && (y <= Math.max(y1, y2)) && y1 !== y2) {
      const x = x1 + (y - y1) / (y2 - y1) * (x2 - x1); lo = Math.min(lo, x); hi = Math.max(hi, x);
    }
  }
  return lo === Infinity ? [W / 2 - 1, W / 2 + 1] : [lo, hi];
}
const ptsAttr = p => p.map(q => q.join(',')).join(' ');
/** A tweenable transform about a fixed SVG point (GSAP's svgOrigin drifts on groups whose bbox changes mid-tween). */
function xf(el, ox, oy, init = {}) {
  const s = { x: 0, y: 0, sx: 1, sy: 1, rot: 0, ...init };
  s.apply = () => el.setAttribute('transform', `translate(${n1(s.x + ox)} ${n1(s.y + oy)}) rotate(${n1(s.rot)}) scale(${s.sx.toFixed(4)} ${s.sy.toFixed(4)}) translate(${-ox} ${-oy})`);
  s.apply();
  return s;
}

/* ------------------------------------------------------------------------------------------------
   Textures. Every texture: a vertical gradient (g), an optional seeded pattern (pat), loose pieces
   drawn as separate shapes (items), a bumpiness for the top edge, a pour style (kind), and colours
   for the falling stream.
------------------------------------------------------------------------------------------------ */
const scatter = (b, r, n, fn) => { const out = []; for (let i = 0; i < n; i++) out.push(fn(R(r, b.x0 + 4, b.x1 - 4), R(r, b.y0 + 3, b.y1 - 2), i)); return out; };
const count = (b, per, max = 60) => clamp(Math.round((b.x1 - b.x0) * (b.y1 - b.y0) / per), 2, max);
const stone = (r, x, y, rx, ry, cols, j = .18) => {
  const c = pick(r, cols);
  return `<g><path d="${blob(r, x + .8, y + 1.6, rx, ry, 7, j)}" fill="#000" opacity=".28"/><path d="${blob(r, x, y, rx, ry, 7, j)}" fill="${c}"/><ellipse cx="${n1(x - rx * .32)}" cy="${n1(y - ry * .38)}" rx="${n1(rx * .38)}" ry="${n1(ry * .22)}" fill="#fff" opacity=".32" transform="rotate(-15 ${n1(x)} ${n1(y)})"/></g>`;
};
const chunk = (r, x, y, rad, cols, hi = '#fff', ho = .25) => `<g><path d="${poly(r, x, y, rad, 5 + Math.floor(r() * 3), .28)}" fill="${pick(r, cols)}"/><path d="M${n1(x - rad * .6)} ${n1(y - rad * .3)}l${n1(rad * .7)} ${n1(-rad * .35)}" stroke="${hi}" stroke-width="1.2" opacity="${ho}" stroke-linecap="round"/></g>`;
const leafItem = (r, x, y, len, cols, vein = '#000', vo = .25) => {
  const rot = R(r, 0, 360), wid = len * R(r, .45, .62), c = pick(r, cols);
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)})"><path d="${leafD(len, wid)}" fill="${c}"/><path d="M0 0L0 ${n1(-len * .92)}" stroke="${vein}" stroke-width=".9" opacity="${vo}"/><path d="M0 ${n1(-len * .35)}l${n1(wid * .3)} ${n1(-len * .15)}M0 ${n1(-len * .55)}l${n1(-wid * .28)} ${n1(-len * .14)}" stroke="${vein}" stroke-width=".7" opacity="${vo * .8}" fill="none"/></g>`;
};
const packed = (b, r, rx, ry, fn) => {
  const out = [];
  for (let y = b.y1 - ry * .5; y > b.y0 + ry * .2; y -= ry * R(r, 1.25, 1.55)) {
    for (let x = b.x0 - rx * R(r, 0, 1); x < b.x1 + rx; x += rx * R(r, 1.55, 1.95)) out.push(fn(x + R(r, -2, 2), y + R(r, -2, 2)));
  }
  return out;
};

const TEX = {
  soil: { g: ['#7B5130', '#4E301A'], pat: 'soil', bump: 3, kind: 'grain', colors: ['#6B4426', '#8C6440', '#4A2E17'],
    items: (b, r) => [...scatter(b, r, count(b, 900, 14), (x, y) => stone(r, x, y, R(r, 1.8, 3.6), R(r, 1.4, 2.6), ['#8C8074', '#9C8B78', '#7A6A5A'])),
      ...scatter(b, r, count(b, 2400, 5), (x, y) => `<path d="M${n1(x)} ${n1(y)}q${n1(R(r, 3, 6))} ${n1(R(r, -3, 3))} ${n1(R(r, 8, 13))} ${n1(R(r, 0, 4))}" stroke="#C9A77A" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>`)] },
  pebbles: { g: ['#625850', '#463D36'], bump: 6, kind: 'grain', colors: ['#A39A8E', '#8C8378', '#C7BBA9'],
    items: (b, r) => packed(b, r, R(r, 10, 12), R(r, 7, 8.5), (x, y) => stone(r, x, y, R(r, 8, 13), R(r, 6, 8.5), ['#A39A8E', '#8C8378', '#B9AE9F', '#7E7468', '#C7BBA9', '#968A7A', '#B5A28A', '#8E8F94'])) },
  gravel: { g: ['#77736C', '#56524D'], pat: 'gravel', bump: 4, kind: 'grain', colors: ['#8F8C86', '#A7A39B', '#6F6B66'],
    items: (b, r) => packed(b, r, 6.5, 5, (x, y) => chunk(r, x, y, R(r, 4, 6.5), ['#9A968F', '#8A8781', '#B3AEA4', '#7C7A76', '#A49C90', '#8C9096'])) },
  sand: { g: ['#E3C893', '#C9A867'], pat: 'sand', bump: 1.6, kind: 'grain', colors: ['#E0C48C', '#D2B074', '#EBD6A6'],
    items: (b, r) => scatter(b, r, count(b, 1500, 10), (x, y) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R(r, 1, 1.9))}" fill="${pick(r, ['#B7925A', '#F4E4C0', '#A88A5C'])}"/>`) },
  charcoal: { g: ['#2E2D2F', '#18181A'], bump: 4, kind: 'grain', colors: ['#2A2A2C', '#3E3E44', '#111'],
    items: (b, r) => packed(b, r, 7.5, 5.5, (x, y) => chunk(r, x, y, R(r, 5, 8.5), ['#1E1E20', '#2B2B2F', '#36363C', '#141416'], '#9AA3B5', .45)) },
  leaves: { g: ['#3F6B2A', '#2C4E1D'], bump: 5, kind: 'pieces', colors: ['#5E9B36', '#7DB446', '#4A7F2A'],
    items: (b, r) => scatter(b, r, count(b, 260, 46), (x, y) => leafItem(r, x, y, R(r, 11, 18), ['#5E9B36', '#7DB446', '#4A7F2A', '#8CC152', '#3F7A2B'], '#21401A', .45)) },
  'dry-leaves': { g: ['#86582A', '#5F3C1B'], bump: 5, kind: 'pieces', colors: ['#B5762F', '#D2A055', '#8A5524'],
    items: (b, r) => scatter(b, r, count(b, 240, 48), (x, y) => leafItem(r, x, y, R(r, 10, 17), ['#B5762F', '#D2A055', '#8A5524', '#C98B3C', '#9E6A33', '#E0B26A'], '#4A2C10', .5)) },
  'green-waste': { g: ['#4E7B2E', '#35571F'], pat: 'clippings', bump: 4, kind: 'pieces', colors: ['#6FA83A', '#4F8A25', '#8CC152'],
    items: (b, r) => [...scatter(b, r, count(b, 160, 70), (x, y) => { const a = R(r, 0, Math.PI); const l = R(r, 6, 12); return `<path d="M${n1(x)} ${n1(y)}l${n1(Math.cos(a) * l)} ${n1(Math.sin(a) * l * .6)}" stroke="${pick(r, ['#7DB446', '#5C9A2E', '#A2CC5E', '#4C8424'])}" stroke-width="${n1(R(r, 1.6, 2.6))}" stroke-linecap="round"/>`; }),
      ...scatter(b, r, count(b, 900, 10), (x, y) => leafItem(r, x, y, R(r, 8, 13), ['#5E9B36', '#7DB446'], '#21401A', .4))] },
  'kitchen-waste': { g: ['#6E5232', '#4C3720'], pat: 'tea', bump: 5, kind: 'pieces', colors: ['#F2C94C', '#E8833A', '#7DB446', '#F4EFE4'],
    items: (b, r) => scatter(b, r, count(b, 330, 34), (x, y, i) => {
      const k = i % 6, rot = n1(R(r, 0, 360));
      if (k === 0) return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot})"><path d="M-10 0q10 -9 20 0q-10 -4 -20 0z" fill="#F2C94C" stroke="#C99A23" stroke-width=".8"/><path d="M-10 0l-2 1M10 0l2 1" stroke="#5B3A12" stroke-width="2" stroke-linecap="round"/></g>`;
      if (k === 1) return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot})"><path d="M-7 2a7 7 0 0 1 14 0z" fill="#E8833A"/><path d="M-5 2a5 5 0 0 1 10 0z" fill="#F7D9A8"/></g>`;
      if (k === 2) return `<path d="${poly(r, x, y, R(r, 4, 6), 6, .45)}" fill="#F4EFE4" stroke="#D9CFC0" stroke-width=".8"/>`;
      if (k === 3) return `<g><circle cx="${n1(x)}" cy="${n1(y)}" r="4.6" fill="#E9782A"/><circle cx="${n1(x)}" cy="${n1(y)}" r="2.4" fill="#F5A04D"/></g>`;
      if (k === 4) return `<path d="${blob(r, x, y, R(r, 4, 7), R(r, 2.5, 4), 6, .3)}" fill="${pick(r, ['#7DB446', '#5C9A2E', '#9CC85A'])}"/>`;
      return `<path d="M${n1(x - 6)} ${n1(y)}q6 -8 12 0" stroke="#B7637E" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    }) },
  'cow-dung': { g: ['#6A5530', '#4A3A1E'], pat: 'dung', bump: 4, kind: 'grain', colors: ['#5B4A2A', '#6E5A33', '#4A3A1E'],
    items: (b, r) => [...scatter(b, r, count(b, 380, 30), (x, y) => `<g><path d="${blob(r, x, y + 1, R(r, 5, 9), R(r, 3, 5), 7, .22)}" fill="#3F3118" opacity=".7"/><path d="${blob(r, x, y, R(r, 5, 9), R(r, 3, 5), 7, .22)}" fill="${pick(r, ['#5E4C2B', '#6E5A33', '#54432A'])}"/><path d="M${n1(x - 3)} ${n1(y - 2)}q3 -1.5 6 0" stroke="#8F7A4C" stroke-width="1" fill="none" opacity=".7"/></g>`),
      ...scatter(b, r, count(b, 700, 14), (x, y) => `<path d="M${n1(x)} ${n1(y)}l${n1(R(r, -8, 8))} ${n1(R(r, -3, 3))}" stroke="#C9A95A" stroke-width="1.1" opacity=".8" stroke-linecap="round"/>`)] },
  compost: { g: ['#46301C', '#2C1D10'], pat: 'compost', bump: 3, kind: 'grain', colors: ['#3A2617', '#5A3D24', '#2A1A0E'],
    items: (b, r) => [...scatter(b, r, count(b, 420, 26), (x, y) => `<path d="${blob(r, x, y, R(r, 1.8, 3.4), R(r, 1.4, 2.6), 6, .3)}" fill="${pick(r, ['#5A3D24', '#22160C', '#694A2E'])}"/>`),
      ...scatter(b, r, count(b, 2200, 5), (x, y) => `<path d="M${n1(x)} ${n1(y)}q4 -3 9 -1" stroke="#E8DCC2" stroke-width=".8" fill="none" opacity=".55"/>`)] },
  worms: { g: ['#4E331E', '#36230F'], pat: 'soil', bump: 3, kind: 'worms', colors: ['#C86B6E', '#B85860'], items: () => [] },
  water: { g: ['rgba(110,184,232,.78)', 'rgba(42,112,186,.88)'], bump: 0, kind: 'liquid', colors: ['#6EB8E8'],
    items: (b, r) => scatter(b, r, count(b, 1400, 9), (x, y) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R(r, 1.2, 3))}" fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.6)" stroke-width=".8"/>`) },
  cocopeat: { g: ['#86492A', '#5E311A'], pat: 'fibre', bump: 3, kind: 'grain', colors: ['#8E5230', '#A86A3E', '#6A3A1F'],
    items: (b, r) => scatter(b, r, count(b, 500, 24), (x, y) => `<path d="M${n1(x)} ${n1(y)}q${n1(R(r, 2, 5))} ${n1(R(r, -4, 4))} ${n1(R(r, 7, 12))} ${n1(R(r, -2, 2))}" stroke="${pick(r, ['#C08250', '#A4673A', '#D69A62'])}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`) },
  coir: { g: ['#8D5E2E', '#6A441F'], bump: 4, kind: 'pieces', colors: ['#B07A3C', '#C99558', '#7A4E22'],
    items: (b, r) => scatter(b, r, count(b, 120, 70), (x, y) => `<path d="M${n1(x - 12)} ${n1(y + R(r, -3, 3))}q${n1(R(r, 6, 10))} ${n1(R(r, -8, 8))} ${n1(R(r, 18, 26))} ${n1(R(r, -4, 4))}" stroke="${pick(r, ['#C99558', '#B07A3C', '#DDB07A', '#93622E'])}" stroke-width="${n1(R(r, 1, 1.8))}" fill="none" stroke-linecap="round"/>`) },
  clay: { g: ['#C06C3F', '#984A26'], bump: 3, kind: 'grain', colors: ['#C06C3F', '#D9875A'],
    items: (b, r) => [...scatter(b, r, count(b, 600, 18), (x, y) => `<g><path d="${blob(r, x, y, R(r, 6, 11), R(r, 3, 5), 7, .2)}" fill="${pick(r, ['#CC7B4C', '#A9582F', '#D98C5C'])}"/><path d="M${n1(x - 4)} ${n1(y - 2)}q4 -2 8 0" stroke="#F2B488" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/></g>`),
      ...scatter(b, r, count(b, 2400, 4), (x, y) => `<path d="M${n1(x)} ${n1(y)}l3 4l-2 3l4 5" stroke="#7A3A1C" stroke-width=".9" fill="none" opacity=".6"/>`)] },
  mulch: { g: ['#7B5A33', '#5A3F22'], bump: 5, kind: 'pieces', colors: ['#A57B48', '#C49A62', '#8C6236'],
    items: (b, r) => [...scatter(b, r, count(b, 230, 50), (x, y) => `<rect x="${n1(x - 6)}" y="${n1(y - 2)}" width="${n1(R(r, 8, 14))}" height="${n1(R(r, 3, 5))}" rx="1.6" fill="${pick(r, ['#A57B48', '#C49A62', '#8C6236', '#B98950'])}" transform="rotate(${n1(R(r, -40, 40))} ${n1(x)} ${n1(y)})"/>`),
      ...scatter(b, r, count(b, 500, 18), (x, y) => `<path d="M${n1(x)} ${n1(y)}l${n1(R(r, -12, 12))} ${n1(R(r, -4, 4))}" stroke="#E2C27A" stroke-width="1.2" stroke-linecap="round"/>`)] },
  seeds: { g: null, bump: 0, kind: 'seeds', colors: ['#D9B77A'],
    items: (b, r) => { const out = []; const n = clamp(Math.round((b.x1 - b.x0) / 22), 4, 16); for (let i = 0; i < n; i++) { const x = b.x0 + (i + .5) * (b.x1 - b.x0) / n + R(r, -4, 4), y = b.y1 - R(r, 3, 6); out.push(`<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(R(r, -50, 50))})"><ellipse rx="4.6" ry="3" fill="#D9B77A" stroke="#8A6A3A" stroke-width=".9"/><ellipse cx="-1.4" cy="-1" rx="1.6" ry=".9" fill="#fff" opacity=".55"/></g>`); } return out; } },
  cloth: { g: ['#F3EEE2', '#DCD3C0'], pat: 'weave', bump: 1.2, kind: 'sheet', colors: ['#F3EEE2'],
    items: (b, r) => scatter(b, r, count(b, 1200, 6), (x, y) => `<path d="M${n1(x - 10)} ${n1(y)}q10 -3 20 0" stroke="#B9AE98" stroke-width="1" fill="none" opacity=".6"/>`) },
  net: { g: null, pat: 'mesh', bump: 0, kind: 'sheet', colors: ['#3F8F4A'], items: () => [] },
  plastic: { g: ['rgba(206,228,250,.85)', 'rgba(160,196,232,.85)'], bump: 2, kind: 'sheet', colors: ['#CFE4FA'],
    items: (b, r) => scatter(b, r, count(b, 500, 14), (x, y) => `<path d="M${n1(x)} ${n1(y)}l${n1(R(r, 4, 9))} ${n1(R(r, -3, 3))}l${n1(R(r, 3, 7))} ${n1(R(r, -2, 3))}" stroke="#fff" stroke-width="1.3" fill="none" opacity=".8" stroke-linecap="round"/>`) },
  cotton: { g: ['#FFFFFF', '#E9E6DF'], bump: 4.5, kind: 'sheet', colors: ['#FFFFFF'],
    items: (b, r) => scatter(b, r, count(b, 300, 26), (x, y) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R(r, 3, 6))}" fill="${pick(r, ['#FFFFFF', '#F1EEE8', '#E4E0D8'])}" opacity=".9"/>`) },
  newspaper: { g: ['#E6E1D6', '#CFC8B9'], bump: 3, kind: 'pieces', colors: ['#E9E5DC', '#D8D2C4'],
    items: (b, r) => scatter(b, r, count(b, 300, 30), (x, y) => { const w = R(r, 12, 20), hh = R(r, 6, 9); return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(R(r, -35, 35))})"><rect x="${n1(-w / 2)}" y="${n1(-hh / 2)}" width="${n1(w)}" height="${n1(hh)}" rx="1" fill="${pick(r, ['#F2EEE5', '#E2DCCF', '#EDE7DA'])}" stroke="#B9B1A1" stroke-width=".6"/><path d="M${n1(-w / 2 + 2)} ${n1(-hh / 2 + 2)}h${n1(w - 4)}M${n1(-w / 2 + 2)} 0h${n1(w * .6)}M${n1(-w / 2 + 2)} ${n1(hh / 2 - 2)}h${n1(w - 6)}" stroke="#6E6A62" stroke-width=".9" opacity=".55"/></g>`; }) },
};
const FALLBACK = { g: ['#A38B68', '#7E6747'], pat: 'soil', bump: 3, kind: 'grain', colors: ['#A38B68'], items: () => [] };
const tex = name => TEX[name] || FALLBACK;
const THICK = { soil: 1.2, pebbles: 1, sand: 1, gravel: .9, charcoal: .8, leaves: 1, 'dry-leaves': 1.05, 'green-waste': 1, 'kitchen-waste': 1.1, 'cow-dung': .85, compost: 1, worms: .8, water: 1.2, cocopeat: 1, coir: .7, clay: .9, mulch: .6, seeds: .32, cloth: .3, net: .26, plastic: .4, cotton: .5, newspaper: .45 };
const COMPOSTABLE = new Set(['leaves', 'dry-leaves', 'green-waste', 'kitchen-waste', 'cow-dung', 'newspaper', 'mulch', 'soil', 'worms', 'cocopeat', 'coir']);

/** Seeded pattern tiles shared by the scene and the card swatches. */
function patternDefs() {
  const tile = (id, w, body) => `<pattern id="lyr-p-${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  const dots = (seed, w, n, rmin, rmax, cols, op = [.7, 1]) => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${n1(R(r, 0, w))}" cy="${n1(R(r, 0, w))}" r="${n1(R(r, rmin, rmax))}" fill="${pick(r, cols)}" opacity="${n1(R(r, op[0], op[1]))}"/>`; return s; };
  const strokes = (seed, w, n, len, cols, sw) => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const x = R(r, 0, w), y = R(r, 0, w), a = R(r, 0, Math.PI * 2), l = R(r, len * .5, len); s += `<path d="M${n1(x)} ${n1(y)}q${n1(Math.cos(a + .6) * l * .5)} ${n1(Math.sin(a + .6) * l * .5)} ${n1(Math.cos(a) * l)} ${n1(Math.sin(a) * l)}" stroke="${pick(r, cols)}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`; } return s; };
  return [
    tile('soil', 70, dots('soil', 70, 80, .6, 1.9, ['#8E6440', '#3B2412', '#A07450', '#5A3A20', '#2E1C0E'])),
    tile('gravel', 40, dots('gravel', 40, 40, .6, 1.4, ['#55524E', '#9D9890', '#4A4744'])),
    tile('sand', 36, dots('sand', 36, 70, .45, 1.05, ['#B8965C', '#F6E7C4', '#C9A867', '#A68352', '#FFF4DA'], [.6, 1])),
    tile('clippings', 50, strokes('clip', 50, 22, 8, ['#6FA83A', '#3E6E22', '#8CC152'], 1.4)),
    tile('tea', 40, dots('tea', 40, 26, .6, 1.3, ['#2E1E10', '#3D2A16', '#7A5A30'])),
    tile('dung', 50, dots('dung', 50, 40, .8, 2.2, ['#3F3118', '#7A6640', '#544222'], [.5, .9])),
    tile('compost', 50, dots('compost', 50, 70, .6, 1.8, ['#1E130A', '#5A3D24', '#3A2617', '#6E4D2E'])),
    tile('fibre', 50, strokes('fibre', 50, 34, 7, ['#B0703F', '#5E311A', '#C88A55'], 1)),
    tile('weave', 6, '<path d="M0 1.5h6M0 4.5h6" stroke="#C9BFAA" stroke-width=".8" opacity=".8"/><path d="M1.5 0v6M4.5 0v6" stroke="#E9E2D2" stroke-width=".8"/>'),
    tile('mesh', 14, '<path d="M0 0L14 14M14 0L0 14" stroke="#2F7A3B" stroke-width="1.6"/><circle cx="7" cy="7" r="1.6" fill="#1F5A2A"/>'),
  ].join('') + Object.entries(TEX).filter(([, t]) => t.g).map(([k, t]) => `<linearGradient id="lyr-g-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.g[0]}"/><stop offset="1" stop-color="${t.g[1]}"/></linearGradient>`).join('')
    + `<linearGradient id="lyr-g-fallback" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${FALLBACK.g[0]}"/><stop offset="1" stop-color="${FALLBACK.g[1]}"/></linearGradient>`;
}
const gradId = name => TEX[name]?.g ? `lyr-g-${name}` : (TEX[name] ? null : 'lyr-g-fallback');
const patId = name => tex(name).pat ? `lyr-p-${tex(name).pat}` : null;

/* ------------------------------------------------------------------------------------------------
   Containers: interior polygon (open at the top), back and front artwork, optional outlet.
------------------------------------------------------------------------------------------------ */
const SKY = (y) => `<rect width="${W}" height="${y + 4}" fill="url(#lyr-sky)"/><circle cx="470" cy="46" r="22" fill="#FFE7A3" opacity=".9"/><circle cx="470" cy="46" r="34" fill="#FFE7A3" opacity=".25"/>
  <path d="M30 ${y}q40 -26 80 -6q30 -22 70 0z" fill="#9CC28A" opacity=".55"/><path d="M380 ${y}q50 -34 110 -4q20 -10 40 4z" fill="#8DB57A" opacity=".55"/>`;
const GRASS = (y, x0 = 0, x1 = W, skip = []) => { const r = rng('grass' + y); let s = `<rect x="${x0}" y="${y - 3}" width="${x1 - x0}" height="9" fill="#6FA83A"/>`; for (let x = x0; x < x1; x += R(r, 5, 9)) { if (skip.some(([a, b]) => x > a && x < b)) continue; s += `<path d="M${n1(x)} ${y + 2}q${n1(R(r, -3, 3))} ${n1(-R(r, 5, 12))} ${n1(R(r, -4, 4))} ${n1(-R(r, 8, 15))}" stroke="${pick(r, ['#5C9A2E', '#7DB446', '#4C8424'])}" stroke-width="2" fill="none" stroke-linecap="round"/>`; } return s; };
const GROUND = (y) => `<rect y="${y}" width="${W}" height="${H - y}" fill="url(#lyr-earth)"/><rect y="${y}" width="${W}" height="${H - y}" fill="url(#lyr-p-soil)" opacity=".55"/>`;

function containerArt(kind, withTap) {
  const C = {};
  switch (kind) {
    case 'pot': {
      C.poly = [[84, 100], [276, 100], [276, 128], [262, 132], [242, 380], [118, 380], [98, 132], [84, 128]];
      C.outlet = [180, 392];
      C.back = `<ellipse cx="180" cy="412" rx="118" ry="10" fill="#000" opacity=".16"/>
        <path d="M84 404h192l-12 10H96z" fill="#9C4A24"/><path d="M78 396h204q2 8 -6 8H84q-8 0 -6 -8z" fill="#C46638"/>
        <polygon points="${ptsAttr(C.poly)}" fill="url(#lyr-pot-in)"/>`;
      C.front = `<path fill-rule="evenodd" fill="url(#lyr-pot)" d="M60 96H300V130L288 134L258 394H102L72 134L60 130Z M84 100V128L98 132L118 380H242L262 132L276 128V100Z"/>
        <path d="M60 96H300V130L288 134H72L60 130Z M84 100V128L98 132H262L276 128V100Z" fill-rule="evenodd" fill="#D47A48"/>
        <path d="M62 99H82M278 99H298" stroke="#F0A372" stroke-width="3" stroke-linecap="round"/>
        <path d="M74 140L102 388" stroke="#E79A68" stroke-width="3" opacity=".6" stroke-linecap="round"/>
        <rect x="170" y="380" width="20" height="14" fill="#3A1C0C"/>`;
      break;
    }
    case 'bottle': {
      const p = [[102, 58], [258, 58], [258, 266]];
      for (let i = 1; i <= 8; i++) { const t = i / 8, a = t * Math.PI / 2; p.push([194 + (258 - 194) * Math.cos(a), 266 + (330 - 266) * Math.sin(a)]); }
      p.push([194, 374], [166, 374]);
      for (let i = 8; i >= 1; i--) { const t = i / 8, a = t * Math.PI / 2; p.push([166 - (166 - 102) * Math.cos(a), 266 + (330 - 266) * Math.sin(a)]); }
      p.push([102, 266]);
      C.poly = p.map(([x, y]) => [n1(x), n1(y)]);
      C.outlet = [180, 376];
      C.glass = { x0: 122, x1: 238, top: 342, bottom: 430 };
      C.back = `<ellipse cx="180" cy="432" rx="78" ry="7" fill="#000" opacity=".16"/>
        <path d="M120 340H240L234 428Q234 432 230 432H130Q126 432 126 428Z" fill="rgba(200,228,245,.28)" stroke="rgba(160,200,225,.9)" stroke-width="3"/>
        <polygon points="${ptsAttr(C.poly)}" fill="rgba(210,235,250,.22)"/>`;
      C.front = `<polygon points="${ptsAttr(C.poly)}" fill="none" stroke="rgba(150,196,225,.95)" stroke-width="5" stroke-linejoin="round"/>
        <path d="M98 58H262" stroke="rgba(150,196,225,.95)" stroke-width="6" stroke-linecap="round"/>
        <path d="M112 70V250" stroke="#fff" stroke-width="7" opacity=".42" stroke-linecap="round"/><path d="M126 70V180" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
        <path d="M100 130H260M100 200H260" stroke="rgba(150,196,225,.6)" stroke-width="3"/>
        <rect x="160" y="350" width="40" height="10" rx="3" fill="rgba(150,196,225,.9)"/>
        <path d="M128 350V420" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/>`;
      break;
    }
    case 'trench': {
      C.poly = [[72, 128], [298, 128], [268, 402], [102, 402]];
      C.back = `${SKY(128)}${GROUND(128)}<polygon points="${ptsAttr(C.poly)}" fill="url(#lyr-hole)"/>`;
      C.front = `<polygon points="${ptsAttr(C.poly)}" fill="none" stroke="#3A2414" stroke-width="5" stroke-linejoin="round" opacity=".7"/>
        ${GRASS(128, 0, W, [[70, 300]])}
        <path d="M40 160q8 6 4 16M330 180q-6 8 -2 18M60 300q10 4 8 14M320 330q-8 6 -4 14" stroke="#C9A77A" stroke-width="1.6" fill="none" opacity=".6"/>`;
      break;
    }
    case 'pit': {
      C.poly = [[80, 120], [280, 120], [280, 400], [80, 400]];
      const bricks = (x, y, w, hh) => { let s = ''; const bw = 22, bh = 11; for (let yy = y, row = 0; yy < y + hh; yy += bh, row++) for (let xx = x - (row % 2 ? bw / 2 : 0); xx < x + w; xx += bw) { const x1 = Math.max(x, xx), x2 = Math.min(x + w, xx + bw); if (x2 - x1 > 2) s += `<rect x="${x1 + .8}" y="${yy + .8}" width="${x2 - x1 - 1.6}" height="${Math.min(bh, y + hh - yy) - 1.6}" rx="1.5" fill="${['#B5532E', '#A8492A', '#C1613A'][(row + Math.round(xx)) % 3]}"/>`; } return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#D9C7A8"/>${s}`; };
      C.back = `${SKY(120)}${GROUND(120)}<polygon points="${ptsAttr(C.poly)}" fill="url(#lyr-hole)"/>`;
      C.front = `${GRASS(120, 0, W, [[48, 312]])}${bricks(64, 98, 16, 316)}${bricks(280, 98, 16, 316)}${bricks(64, 400, 232, 14)}${bricks(48, 98, 16, 22)}${bricks(296, 98, 16, 22)}
        <rect x="46" y="94" width="268" height="5" rx="2" fill="#8E3E22" opacity=".0"/>`;
      break;
    }
    case 'tray': {
      C.poly = [[42, 176], [318, 176], [310, 350], [50, 350]];
      C.back = `<rect y="372" width="${W}" height="${H - 372}" fill="url(#lyr-table)"/><path d="M0 372H${W}" stroke="#7A4E2A" stroke-width="3"/>
        <ellipse cx="180" cy="372" rx="160" ry="8" fill="#000" opacity=".18"/>
        <polygon points="${ptsAttr(C.poly)}" fill="#26282B"/>`;
      C.front = `<path fill-rule="evenodd" fill="url(#lyr-tray)" d="M26 168H334V178L322 364H38L26 178Z M42 176L50 350H310L318 176Z"/>
        <path d="M24 166H336" stroke="#5A5E64" stroke-width="5" stroke-linecap="round"/>
        ${[80, 130, 180, 230, 280].map(x => `<rect x="${x - 6}" y="352" width="12" height="7" rx="2" fill="#0E0F10"/>`).join('')}`;
      break;
    }
    case 'bucket': {
      C.poly = [[80, 104], [280, 104], [258, 388], [102, 388]];
      if (withTap) { C.outlet = [40, 384]; C.glass = { x0: 14, x1: 66, top: 392, bottom: 436 }; }
      C.back = `<ellipse cx="180" cy="404" rx="100" ry="9" fill="#000" opacity=".16"/>
        <path d="M66 104C66 22 294 22 294 104" stroke="#8F969E" stroke-width="5" fill="none"/><rect x="160" y="22" width="40" height="10" rx="5" fill="#3B3F45"/>
        <polygon points="${ptsAttr(C.poly)}" fill="url(#lyr-bucket-in)"/>`;
      C.front = `<path fill-rule="evenodd" fill="url(#lyr-bucket)" d="M62 96H298V108L270 398H90L62 108Z M80 104L102 388H258L280 104Z"/>
        <rect x="58" y="92" width="244" height="14" rx="6" fill="#2F6FB0"/><path d="M62 95H298" stroke="#7DB4E8" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M70 200L84 204M68 290L94 294M290 200L276 204M292 290L266 294" stroke="#1E4F84" stroke-width="3" opacity=".5"/>
        <circle cx="62" cy="104" r="5" fill="#3B3F45"/><circle cx="298" cy="104" r="5" fill="#3B3F45"/>
        ${withTap ? `<rect x="44" y="362" width="52" height="12" rx="4" fill="#B8BEC6"/><rect x="34" y="358" width="14" height="28" rx="4" fill="#9AA1AA"/><rect x="52" y="352" width="10" height="10" rx="2" fill="#D24B3A"/>` : [130, 180, 230].map(x => `<rect x="${x - 5}" y="388" width="10" height="10" fill="#1A2633"/>`).join('')}`;
      break;
    }
    case 'tank': {
      C.poly = [[82, 112], [306, 112], [306, 392], [82, 392]];
      if (withTap) { C.outlet = [44, 384]; C.glass = { x0: 16, x1: 70, top: 394, bottom: 436 }; }
      C.back = `<ellipse cx="194" cy="406" rx="128" ry="8" fill="#000" opacity=".16"/>
        <polygon points="${ptsAttr(C.poly)}" fill="rgba(190,225,240,.25)"/><path d="M82 112L306 112L306 392L82 392Z" fill="url(#lyr-tank-back)"/>`;
      C.front = `<rect x="78" y="112" width="232" height="280" fill="none" stroke="rgba(150,200,225,.95)" stroke-width="7"/>
        <rect x="70" y="102" width="248" height="12" rx="3" fill="#2E3B44"/><rect x="70" y="390" width="248" height="14" rx="3" fill="#2E3B44"/>
        <path d="M96 130L130 130L96 220Z" fill="#fff" opacity=".22"/><path d="M290 280V372" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>
        ${withTap ? `<rect x="48" y="362" width="36" height="12" rx="4" fill="#B8BEC6"/><rect x="38" y="358" width="14" height="28" rx="4" fill="#9AA1AA"/><rect x="58" y="352" width="10" height="10" rx="2" fill="#D24B3A"/>` : ''}`;
      break;
    }
    default: { // bin: a green compost bin with air holes
      C.poly = [[72, 96], [288, 96], [274, 388], [86, 388]];
      const holes = (x1, x2, y1, y2) => { let s = ''; for (let i = 0; i < 6; i++) { const t = (i + .5) / 6; s += `<circle cx="${n1(x1 + (x2 - x1) * t)}" cy="${n1(y1 + (y2 - y1) * t)}" r="3.2" fill="#1A2E14"/>`; } return s; };
      C.back = `<ellipse cx="180" cy="414" rx="132" ry="9" fill="#000" opacity=".16"/>
        <rect x="88" y="398" width="26" height="14" rx="3" fill="#2E4A22"/><rect x="246" y="398" width="26" height="14" rx="3" fill="#2E4A22"/>
        <polygon points="${ptsAttr(C.poly)}" fill="url(#lyr-bin-in)"/>
        ${[150, 210, 270, 330].map(y => `<path d="M${n1(xRange(C.poly, y)[0] + 4)} ${y}H${n1(xRange(C.poly, y)[1] - 4)}" stroke="#000" opacity=".12" stroke-width="2"/>`).join('')}
        ${[130, 180, 230].map(x => [170, 260].map(y => `<circle cx="${x}" cy="${y}" r="3" fill="#0F1C0B" opacity=".5"/>`).join('')).join('')}`;
      C.front = `<path fill-rule="evenodd" fill="url(#lyr-bin)" d="M58 94H302L288 402H72Z M72 96L86 388H274L288 96Z"/>
        <rect x="48" y="82" width="264" height="16" rx="7" fill="#3E7A2A"/><path d="M54 85H306" stroke="#8CC86A" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M63 104L77 394" stroke="#9BD078" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>
        ${holes(64, 76, 120, 380)}${holes(296, 284, 120, 380)}`;
    }
  }
  const ys = C.poly.map(p => p[1]);
  C.top = Math.min(...ys); C.bottom = Math.max(...ys);
  C.cx = n1((xRange(C.poly, C.bottom - 2)[0] + xRange(C.poly, C.bottom - 2)[1] + xRange(C.poly, C.top + 2)[0] + xRange(C.poly, C.top + 2)[1]) / 4);
  C.right = Math.max(...C.poly.map(p => p[0]));
  return C;
}
const SCENE_DEFS = `
  <linearGradient id="lyr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ED3F0"/><stop offset="1" stop-color="#E4F3FB"/></linearGradient>
  <linearGradient id="lyr-earth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5A33"/><stop offset="1" stop-color="#55361D"/></linearGradient>
  <linearGradient id="lyr-hole" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E2614"/><stop offset="1" stop-color="#24160A"/></linearGradient>
  <linearGradient id="lyr-pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C8693A"/><stop offset=".5" stop-color="#B85A2E"/><stop offset="1" stop-color="#9A4622"/></linearGradient>
  <linearGradient id="lyr-pot-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A3518"/><stop offset="1" stop-color="#4E200C"/></linearGradient>
  <linearGradient id="lyr-bin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5FA03E"/><stop offset=".55" stop-color="#4C8A2F"/><stop offset="1" stop-color="#376B22"/></linearGradient>
  <linearGradient id="lyr-bin-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F4D27"/><stop offset="1" stop-color="#1C3017"/></linearGradient>
  <linearGradient id="lyr-bucket" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A90D2"/><stop offset=".55" stop-color="#3A7CBE"/><stop offset="1" stop-color="#2A5F9A"/></linearGradient>
  <linearGradient id="lyr-bucket-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#244B73"/><stop offset="1" stop-color="#173350"/></linearGradient>
  <linearGradient id="lyr-tray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4E54"/><stop offset="1" stop-color="#2A2C30"/></linearGradient>
  <linearGradient id="lyr-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9844E"/><stop offset="1" stop-color="#94643A"/></linearGradient>
  <linearGradient id="lyr-tank-back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6F4FA" stop-opacity=".35"/><stop offset="1" stop-color="#9FCBE0" stop-opacity=".15"/></linearGradient>
  <linearGradient id="lyr-clean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD4F2" stop-opacity=".85"/><stop offset="1" stop-color="#4B9AD6" stop-opacity=".9"/></linearGradient>
  <radialGradient id="lyr-glow"><stop offset="0" stop-color="#FFE7A3" stop-opacity=".9"/><stop offset="1" stop-color="#FFE7A3" stop-opacity="0"/></radialGradient>`;

/* ------------------------------------------------------------------------------------------------
   The lab
------------------------------------------------------------------------------------------------ */
export function mount(stage, cfg, api) {
  const { gsap } = api;
  const layers = (cfg.layers || []).map((l, i) => ({ ...l, i, real: true }));
  const distractors = (cfg.distractors || []).map((l, i) => ({ ...l, i: 100 + i, real: false }));
  const kind = ['bin', 'pot', 'bottle', 'trench', 'tray', 'bucket', 'tank', 'pit'].includes(cfg.container) ? cfg.container : 'bin';
  const after = cfg.after || { anim: 'none' };
  const C = containerArt(kind, after.anim === 'filter');
  const kindName = { bin: t('bin'), pot: t('pot'), bottle: t('bottle'), trench: t('trench'), tray: t('tray'), bucket: t('bucket'), tank: t('tank'), pit: t('pit') }[kind];
  const seed = hash(cfg.title || kind);
  const timers = [], tickers = [];
  let placed = 0, busy = false, sel = null, wrongHere = 0, finished = false, queued = null;

  // Band geometry: bottom → top, sharing ~86% of the height.
  const fillFrac = after.anim === 'roots' || after.anim === 'sprout' ? .8 : kind === 'tray' ? .84 : .86;
  const usable = (C.bottom - C.top) * fillFrac;
  const weights = layers.map(l => THICK[l.texture] ?? 1);
  const unit = usable / (weights.reduce((a, b) => a + b, 0) || 1);
  let yy = C.bottom;
  const bands = layers.map((l, i) => { const y1 = yy, y0 = yy - weights[i] * unit; yy = y0; return { y0, y1 }; });
  const topSurface = yy;

  const root = h(`<div class="lab-layers lyr-k-${kind}${layers.length + distractors.length > 7 ? ' many' : ''}">
    <svg class="lyr-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${patternDefs()}</defs></svg>
    <section class="lyr-tray" aria-label="${t('Layers to add')}">
      <header class="lyr-tray-h"><h3 class="lab-h">${t('Pick the next layer')}</h3><span class="lyr-count" aria-live="polite"><b>0</b> / ${layers.length}</span></header>
      <p class="lyr-tip">${t('Start at the <b>bottom</b>. Drag a card into the {kind}, or tap a card and then tap the {kind}.', { kind: esc(kindName) })}</p>
      <div class="lyr-cards"></div>
    </section>
    <div class="lyr-scene">
      <button type="button" class="lyr-drop" aria-label="${t('Add the chosen layer to the {kind}', { kind: esc(kindName) })}">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('Cut-away view of the {kind}', { kind: esc(kindName) })}">
          <defs>${SCENE_DEFS}<clipPath id="lyr-clip"><polygon points="${ptsAttr(C.poly)}"/></clipPath>
            ${C.glass ? `<clipPath id="lyr-glass-clip"><path d="M${C.glass.x0 + 3} ${C.glass.top}H${C.glass.x1 - 3}L${C.glass.x1 - 7} ${C.glass.bottom - 3}H${C.glass.x0 + 7}Z"/></clipPath>` : ''}</defs>
          <g class="lyr-back">${C.back}</g>
          <g class="lyr-under"></g>
          <g clip-path="url(#lyr-clip)"><g class="lyr-ghost"></g><g class="lyr-stack"></g><g class="lyr-fx-in"></g></g>
          <g class="lyr-fx-mid"></g>
          <g class="lyr-front">${C.front}</g>
          <polygon class="lyr-zone" points="${ptsAttr(C.poly)}"/>
          <g class="lyr-fx-top"></g>
          <g class="lyr-tags"></g>
          <g class="lyr-hud" opacity="0"><rect x="10" y="10" width="132" height="40" rx="20" class="lyr-hud-bg"/>
            <g class="lyr-hud-sun" transform="translate(32 30)"><circle r="8" fill="#F2B33D"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 -11.5V-14.5" stroke="#F2B33D" stroke-width="2.4" stroke-linecap="round" transform="rotate(${i * 45})"/>`).join('')}</g>
            <text x="50" y="36" class="lyr-hud-t">${t('Day {n}', { n: 0 })}</text></g>
        </svg>
      </button>
    </div>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('.lyr-scene svg'), stackG = $('.lyr-stack'), ghostG = $('.lyr-ghost'), fxIn = $('.lyr-fx-in'), fxMid = $('.lyr-fx-mid'), fxTop = $('.lyr-fx-top'), tagsG = $('.lyr-tags'), under = $('.lyr-under');
  const drop = $('.lyr-drop'), cardsEl = $('.lyr-cards');
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.append(e); return e; };
  const frag = (markup, parent) => { const g = el('g', {}, parent); g.innerHTML = markup; return g; };

  /* ---------- cards ---------- */
  const all = shuffle([...layers, ...distractors], seed);
  const swatch = (l, id) => {
    const t = tex(l.texture), r = rng(`${l.texture}-sw`), b = { x0: 0, x1: 64, y0: 0, y1: 64 };
    const items = l.texture === 'worms' ? [wormStatic(r, 32, 30, 0), wormStatic(r, 22, 46, 1.2), wormStatic(r, 42, 16, 2.4)].join('') : t.items(b, r).join('');
    const g = gradId(l.texture), p = patId(l.texture);
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="${id}"><circle cx="32" cy="32" r="30"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect width="64" height="64" fill="${l.texture === 'net' || l.texture === 'seeds' ? '#8A6440' : '#ccc'}"/>${g ? `<rect width="64" height="64" fill="url(#${g})"/>` : ''}${p ? `<rect width="64" height="64" fill="url(#${p})"/>` : ''}${items}
      <ellipse cx="22" cy="14" rx="16" ry="7" fill="#fff" opacity=".18"/></g><circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2"/></svg>`;
  };
  const cards = all.map((l, k) => {
    const b = h(`<button type="button" class="lyr-card" data-k="${k}">
      <span class="lyr-sw">${swatch(l, `lyr-sw-${k}`)}${l.sprite || l.emoji ? `<span class="lyr-sw-art">${api.art(l)}</span>` : ''}</span>
      <span class="lyr-card-l">${esc(l.label)}</span><span class="lyr-tick" aria-hidden="true">✓</span></button>`);
    b._layer = l;
    cardsEl.append(b);
    return b;
  });

  /* ---------- drag & tap ---------- */
  const zone = $('.lyr-zone');
  const overZone = (x, y) => { const r = zone.getBoundingClientRect(); return x > r.left - 20 && x < r.right + 20 && y > r.top - 60 && y < r.bottom + 10; };
  const drags = cards.map(card => api.Draggable.create(card, {
    type: 'x,y', zIndexBoost: true, dragClickables: true, minimumMovement: 6,
    onPress() { if (!busy && !card.classList.contains('used')) api.sound('click'); },
    onDragStart() { card.classList.add('dragging'); setSel(null); root.classList.add('dragging'); },
    onDrag() { const e = this.pointerEvent; const p = pointOf(e); zone.classList.toggle('over', overZone(p.x, p.y)); },
    onRelease() { card.classList.remove('dragging'); root.classList.remove('dragging'); zone.classList.remove('over'); },
    onDragEnd() {
      const p = pointOf(this.pointerEvent);
      if (busy && overZone(p.x, p.y)) { queued = card; return; }
      if (!finished && !card.classList.contains('used') && overZone(p.x, p.y)) tryPlace(card);
      else gsap.to(card, { x: 0, y: 0, duration: .45, ease: 'back.out(1.6)' });
    },
    onClick() { if (!card.classList.contains('used')) setSel(sel === card ? null : card); },
  })[0]);
  const pointOf = e => { const t = e?.changedTouches?.[0] || e?.touches?.[0] || e; return { x: t?.clientX ?? 0, y: t?.clientY ?? 0 }; };
  cards.forEach(card => card.addEventListener('click', e => { if (e.detail === 0 && !card.classList.contains('used')) setSel(sel === card ? null : card); }));
  drop.addEventListener('click', () => {
    if (finished) return;
    if (busy) { if (sel) queued = sel; return; }
    if (!sel) { api.say(t('First pick a layer card, then tap the {kind}.', { kind: kindName }), 'hint'); pulseCards(); return; }
    tryPlace(sel);
  });
  function setSel(c) {
    sel?.classList.remove('sel'); sel = c; c?.classList.add('sel');
    root.classList.toggle('has-sel', !!c);
    drop.setAttribute('aria-label', c ? t('Add {label} to the {kind}', { label: c._layer.label, kind: kindName }) : t('Add the chosen layer to the {kind}', { kind: kindName }));
    if (c) api.sound('pop');
  }
  function pulseCards() { if (!api.reduced) gsap.fromTo(cards.filter(c => !c.classList.contains('used')), { y: 0 }, { y: -6, duration: .18, yoyo: true, repeat: 1, stagger: .04, ease: 'power2.out' }); }

  /* ---------- placing ---------- */
  const lowerFirst = s => String(s || '').replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase()).replace(/\.$/, '');
  function tryPlace(card) {
    if (busy || finished) return;
    const l = card._layer, want = layers[placed];
    setSel(null);
    const same = want && l.real && l.label === want.label && l.texture === want.texture;
    if (same) { accept(card); return; }
    api.mistake(); wrongHere++;
    gsap.to(card, { x: 0, y: 0, duration: .45, ease: 'back.out(1.6)', onComplete: () => shake(api, card) });
    flashZone();
    if (!l.real) api.say(`${t('{label}? No!', { label: l.label })} ${l.why || t('It does not belong in a {kind}.', { kind: kindName })}`, 'bad');
    else {
      const later = l.i > placed;
      let msg = t(later ? 'Not yet! {label} goes higher up.' : '{label} is already in.', { label: l.label });
      if (wrongHere >= 2 && want.why) msg += isHi() ? ` ${t('Hint: {why}', { why: want.why })}` : ` Hint: the next layer ${lowerFirst(want.why).replace(/^(it|this|they) /i, '')}.`;
      else msg += ` ${placed === 0 ? t('What should go right at the bottom?') : t('What comes just above {label}?', { label: isHi() ? layers[placed - 1].label : layers[placed - 1].label.toLowerCase() })}`;
      api.say(msg, 'bad');
    }
    if (wrongHere >= 3) { const right = cards.find(c => !c.classList.contains('used') && c._layer.real && c._layer.label === want.label); if (right) { right.classList.add('glow'); gsap.fromTo(right, { rotation: -4 }, { rotation: 0, duration: .6, ease: 'elastic.out(1.2,.3)' }); } }
  }
  function flashZone() { zone.classList.remove('bad'); void zone.getBBox(); zone.classList.add('bad'); timers.push(setTimeout(() => zone.classList.remove('bad'), 700)); }

  function accept(card) {
    busy = true; root.classList.add('busy');
    const l = card._layer, idx = placed;
    wrongHere = 0; cards.forEach(c => c.classList.remove('glow'));
    // fly the card to the container mouth
    const m = svg.getScreenCTM(), pt = new DOMPoint(C.cx, C.top - 10).matrixTransform(m);
    const r = card.getBoundingClientRect();
    const dx = pt.x - (r.left + r.width / 2) + gsap.getProperty(card, 'x'), dy = pt.y - (r.top + r.height / 2) + gsap.getProperty(card, 'y');
    gsap.timeline()
      .to(card, { x: dx, y: dy, scale: .5, duration: api.reduced ? .01 : .35, ease: 'power2.in' })
      .to(card, { opacity: 0, duration: .12 })
      .add(() => { card.classList.add('used'); card.disabled = true; gsap.set(card, { x: 0, y: 0, scale: 1 }); gsap.to(card, { opacity: 1, duration: .3 }); });
    placed++;
    $('.lyr-count b').textContent = placed;
    api.progress(placed / (layers.length + (after.anim && after.anim !== 'none' ? 1 : .2)));
    const done = () => {
      addTag(idx);
      api.say(`${l.label} — ${l.why || t('nicely done!')}`, 'good');
      sparkleAt(C.cx, bands[idx].y0);
      busy = false; root.classList.remove('busy');
      if (placed === layers.length) finish(); else drawGhost();
      if (queued && !finished) { const q = queued; queued = null; if (!q.classList.contains('used')) tryPlace(q); }
    };
    pour(idx, done);
  }

  /* ---------- band rendering ---------- */
  const bandEls = [];
  function bandMarkup(idx) {
    const l = layers[idx], t = tex(l.texture), { y0, y1 } = bands[idx];
    const [ax, bx] = xRange(C.poly, y0 + 1), [cx2, dx2] = xRange(C.poly, Math.min(y1, C.bottom) - 1);
    const box = { x0: Math.max(ax, cx2), x1: Math.min(bx, dx2), y0, y1 };
    const r = rng(seed + idx * 977 + hash(l.texture));
    const xs0 = Math.min(ax, cx2) - 12, xs1 = Math.max(bx, dx2) + 12;
    const top = [];
    for (let x = xs0; x <= xs1 + 12; x += 12) top.push([x, y0 + (t.bump ? R(r, -t.bump, t.bump * .4) : 0)]);
    const base = openSmooth(top) + `L${n1(xs1 + 12)} ${n1(y1 + 9)}L${n1(xs0)} ${n1(y1 + 9)}Z`;
    const edge = openSmooth(top);
    const g = gradId(l.texture), p = patId(l.texture);
    return { box, base, edge, xs0, xs1, r, markup: `<g class="lyr-fill">${g ? `<path class="lyr-base" d="${base}" fill="url(#${g})"/>` : ''}${p ? `<path class="lyr-pat" d="${base}" fill="url(#${p})"${l.texture === 'net' ? '' : ' opacity=".9"'}/>` : ''}${t.bump || l.texture === 'cloth' ? `<path class="lyr-edge" d="${edge}" fill="none" stroke="#000" stroke-width="1.5" opacity=".18"/>` : ''}</g>
      <g class="lyr-items">${t.items(box, r).join('')}</g>
      ${l.texture === 'net' ? `<path d="${edge}" fill="none" stroke="#1F5A2A" stroke-width="2.5"/>` : ''}` };
  }

  function pour(idx, done) {
    const l = layers[idx], t = tex(l.texture), bm = bandMarkup(idx);
    const g = el('g', { class: 'lyr-band' });
    g.innerHTML = bm.markup;
    stackG.prepend(g); // lower layers stay in front, so their bumpy tops poke into this one
    const B = { g, ...bm, idx, tex: l.texture };
    bandEls[idx] = B;
    ghostG.innerHTML = '';
    const items = [...g.querySelectorAll('.lyr-items > *')];
    const fillG = g.querySelector('.lyr-fill');
    if (l.texture === 'worms') addWorms(B, 5);
    if (l.texture === 'water') liveWater(B);
    api.sound(t.kind === 'liquid' ? 'whoosh' : 'drop');
    if (api.reduced) { gsap.from(g, { opacity: 0, duration: .3, onComplete: done }); return; }
    const tl = gsap.timeline({ onComplete: done });
    const fallH = bands[idx].y1 - C.top + 70;
    const G = xf(g, C.cx, bands[idx].y1), F = xf(fillG, C.cx, bands[idx].y1);
    const upd = o => ({ ...o, onUpdate: G.apply }), updF = o => ({ ...o, onUpdate: F.apply });
    if (t.kind === 'sheet') {
      tl.fromTo(G, { y: -(bands[idx].y0 - C.top + 90), rot: -3 }, upd({ y: 0, rot: 0, duration: .7, ease: 'power2.in' }))
        .fromTo(G, { sy: .7 }, upd({ sy: 1, duration: .6, ease: 'elastic.out(1,.35)' }));
      tl.add(() => api.sound('pop'), .7);
    } else if (t.kind === 'seeds') {
      tl.from(items, { y: -fallH, opacity: 0, duration: .55, stagger: { each: .07, from: 'random' }, ease: 'bounce.out' });
      tl.add(() => api.sound('tick'), .3);
    } else if (t.kind === 'liquid') {
      stream(t.colors[0], bands[idx].y1, .9, true);
      tl.fromTo(G, { sy: 0 }, upd({ sy: 1, duration: 1, ease: 'power1.inOut' }), .25)
        .add(() => ripple(bands[idx].y0), 1.1);
    } else if (t.kind === 'worms') {
      tl.from(fillG, { opacity: 0, duration: .5 })
        .from(g.querySelectorAll('.lyr-worm'), { y: -fallH, duration: .7, stagger: .12, ease: 'bounce.out' }, 0);
    } else {
      if (t.kind === 'grain') stream(t.colors, bands[idx].y1, .8, false);
      else flutter(t.colors, bands[idx].y1);
      tl.fromTo(F, { sy: 0 }, updF({ sy: 1, duration: .8, ease: 'power2.out' }), .2)
        .from(items, t.kind === 'pieces'
          ? { y: () => -R(Math.random, fallH * .6, fallH), rotation: () => R(Math.random, -90, 90), opacity: 0, duration: .8, stagger: { amount: .5, from: 'random' }, ease: 'power2.in' }
          : { y: -fallH * .5, opacity: 0, duration: .55, stagger: { amount: .45, from: 'random' }, ease: 'power3.in' }, .15)
        .fromTo(G, { sy: 1.12, sx: .985 }, upd({ sy: 1, sx: 1, duration: .7, ease: 'elastic.out(1,.4)' }), '-=.15');
    }
    tl.add(() => { g.removeAttribute('transform'); fillG.removeAttribute('transform'); });
  }

  // Falling stream of particles (grain) or a liquid ribbon.
  function stream(colors, yEnd, dur, liquid) {
    const yStart = Math.min(C.top - 70, 20);
    if (liquid) {
      const w = 12, rib = el('rect', { x: C.cx - w / 2, y: yStart, width: w, height: yEnd - yStart, rx: 6, fill: colors, opacity: .85 }, fxTop);
      const hi = el('rect', { x: C.cx - 2, y: yStart, width: 3, height: yEnd - yStart, rx: 1.5, fill: '#fff', opacity: .5 }, fxTop);
      gsap.timeline({ onComplete: () => { rib.remove(); hi.remove(); } })
        .from([rib, hi], { scaleY: 0, svgOrigin: `${C.cx} ${yStart}`, duration: .3, ease: 'power2.in' })
        .to([rib, hi], { scaleY: 0, svgOrigin: `${C.cx} ${yEnd}`, duration: .35, ease: 'power2.in' }, `+=${dur}`);
      return;
    }
    const cols = [].concat(colors), n = 26;
    for (let i = 0; i < n; i++) {
      const p = el('circle', { cx: C.cx + R(Math.random, -9, 9), cy: yStart, r: R(Math.random, 1.8, 3.6), fill: cols[i % cols.length] }, fxTop);
      gsap.fromTo(p, { y: 0, opacity: 1 }, { y: yEnd - yStart - R(Math.random, 0, 14), x: R(Math.random, -14, 14), duration: R(Math.random, .45, .6), delay: i / n * dur, ease: 'power2.in', onComplete: () => p.remove() });
    }
  }
  function flutter(colors, yEnd) {
    const cols = [].concat(colors);
    for (let i = 0; i < 12; i++) {
      const p = el('path', { d: leafD(R(Math.random, 9, 14), R(Math.random, 5, 7)), fill: cols[i % cols.length], transform: `translate(${C.cx + R(Math.random, -60, 60)} ${C.top - 60})` }, fxTop);
      gsap.to(p, { y: yEnd - C.top + 40 - R(Math.random, 0, 30), x: R(Math.random, -30, 30), rotation: R(Math.random, -270, 270), duration: R(Math.random, .7, 1), delay: i * .04, ease: 'power1.in', onComplete: () => p.remove() });
    }
  }
  function ripple(y) {
    const [a, b] = xRange(C.poly, y);
    for (let i = 0; i < 2; i++) {
      const e = el('ellipse', { cx: C.cx, cy: y, rx: 6, ry: 2, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: .8 }, fxMid);
      gsap.to(e, { attr: { rx: (b - a) / 2 - 6, ry: 5 }, opacity: 0, duration: 1, delay: i * .25, ease: 'power2.out', onComplete: () => e.remove() });
    }
  }
  function sparkleAt(x, y) {
    if (api.reduced) return;
    for (let i = 0; i < 10; i++) {
      const s = el('path', { d: 'M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z', fill: ['#FFE08A', '#fff', '#F2B33D'][i % 3], transform: `translate(${x} ${y})` }, fxTop);
      const a = i / 10 * Math.PI * 2;
      gsap.to(s, { x: Math.cos(a) * R(Math.random, 40, 90), y: Math.sin(a) * R(Math.random, 20, 50) - 10, rotation: 180, scale: 0, duration: .8, ease: 'power2.out', onComplete: () => s.remove() });
    }
  }

  /* ---------- live bits: worms and water ---------- */
  const worms = [];
  function wormStatic(r, x, y, ph) {
    const pts = []; for (let k = 0; k < 7; k++) pts.push([x - 12 + k * 4, y + Math.sin(ph + k * .9) * 3]);
    return `<path d="${openSmooth(pts)}" stroke="#C86B6E" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${openSmooth(pts)}" stroke="#F0A5A5" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7" transform="translate(0 -1)"/>`;
  }
  function addWorms(B, n, bounds) {
    const r = rng(seed + 31 * (worms.length + 1));
    for (let i = 0; i < n; i++) {
      const g = el('g', { class: 'lyr-worm' }, bounds ? fxIn : B.g.querySelector('.lyr-items'));
      const body = el('path', { stroke: pick(r, ['#C86B6E', '#BE5E66', '#D27A78']), 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
      const band = el('path', { stroke: '#A84B55', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: .9 }, g);
      const shine = el('path', { stroke: '#F6B6B4', 'stroke-width': 1.3, fill: 'none', 'stroke-linecap': 'round', opacity: .75 }, g);
      const bx = bounds || { x0: B.box.x0 + 14, x1: B.box.x1 - 14, y0: B.box.y0 + 6, y1: B.box.y1 - 4 };
      const w = { body, band, shine, bx, x: R(r, bx.x0 + 20, bx.x1 - 20), y: R(r, bx.y0, bx.y1), a: R(r, -.6, .6) + (r() < .5 ? Math.PI : 0), ph: R(r, 0, 6), len: R(r, 22, 32), sp: R(r, 5, 9), trail: [] };
      worms.push(w); drawWorm(w, 0);
    }
  }
  function drawWorm(w, dt) {
    w.ph += dt * 6;
    w.a += Math.sin(w.ph * .23) * dt * .9;
    w.x += Math.cos(w.a) * w.sp * dt; w.y += Math.sin(w.a) * w.sp * dt * .6;
    if (w.x < w.bx.x0 || w.x > w.bx.x1) { w.a = Math.PI - w.a; w.x = clamp(w.x, w.bx.x0, w.bx.x1); }
    if (w.y < w.bx.y0 || w.y > w.bx.y1) { w.a = -w.a; w.y = clamp(w.y, w.bx.y0, w.bx.y1); }
    const pts = [], dx = Math.cos(w.a), dy = Math.sin(w.a) * .6;
    for (let k = 0; k < 8; k++) { const s = k / 7 * w.len, wav = Math.sin(w.ph - k * .8) * 2.6 * (k / 7 + .3); pts.push([w.x - dx * s - dy * wav, w.y - dy * s + dx * wav]); }
    const d = openSmooth(pts);
    w.body.setAttribute('d', d); w.shine.setAttribute('d', d); w.shine.setAttribute('transform', 'translate(0 -1.2)');
    w.band.setAttribute('d', openSmooth(pts.slice(1, 3)));
  }
  const waters = [];
  function liveWater(B) {
    const surf = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: .65 }, B.g);
    waters.push({ B, surf, base: B.g.querySelector('.lyr-base') });
  }
  let tPrev = performance.now(), tAll = 0;
  const tick = () => {
    const now = performance.now(), dt = Math.min(.05, (now - tPrev) / 1000); tPrev = now; tAll += dt;
    if (api.reduced) return;
    for (const w of worms) drawWorm(w, dt);
    for (const wt of waters) {
      const { B } = wt, y0 = bands[B.idx].y0, pts = [];
      for (let x = B.xs0; x <= B.xs1 + 12; x += 10) pts.push([x, y0 + Math.sin(x * .045 + tAll * 2.2) * 2.2 + Math.sin(x * .11 - tAll * 1.4) * 1.1]);
      const top = openSmooth(pts);
      wt.base.setAttribute('d', `${top}L${n1(B.xs1 + 12)} ${n1(bands[B.idx].y1 + 9)}L${n1(B.xs0)} ${n1(bands[B.idx].y1 + 9)}Z`);
      wt.surf.setAttribute('d', top);
    }
  };
  gsap.ticker.add(tick); tickers.push(tick);

  /* ---------- tags & ghost ---------- */
  const tagYs = [];
  function addTag(idx) {
    const l = layers[idx], { y0, y1 } = bands[idx];
    let ty = (y0 + y1) / 2;
    const prev = tagYs[tagYs.length - 1];
    if (prev != null && ty > prev - 26) ty = prev - 26;
    tagYs.push(ty);
    const xr = xRange(C.poly, (y0 + y1) / 2)[1];
    const tx = Math.max(C.right + 14, 318);
    const label = l.label.length > 22 ? l.label.slice(0, 21) + '…' : l.label;
    const g = el('g', { class: 'lyr-tag' }, tagsG);
    g.innerHTML = `<path d="M${n1(xr - 8)} ${n1((y0 + y1) / 2)}C${n1(xr + 10)} ${n1((y0 + y1) / 2)} ${n1(tx - 16)} ${n1(ty)} ${n1(tx)} ${n1(ty)}" class="lyr-lead"/><circle cx="${n1(xr - 8)}" cy="${n1((y0 + y1) / 2)}" r="3.5" class="lyr-dot"/>
      <rect x="${tx}" y="${n1(ty - 12)}" height="24" rx="12" class="lyr-tag-bg"/><circle cx="${tx + 12}" cy="${n1(ty)}" r="9" class="lyr-num"/><text x="${tx + 12}" y="${n1(ty + 4)}" class="lyr-num-t">${idx + 1}</text>
      <text x="${tx + 26}" y="${n1(ty + 5)}" class="lyr-tag-t">${esc(label)}</text>`;
    const tw = g.querySelector('.lyr-tag-t').getComputedTextLength?.() || label.length * 7.5;
    g.querySelector('.lyr-tag-bg').setAttribute('width', n1(Math.min(W - tx - 4, tw + 36)));
    if (!api.reduced) gsap.from(g, { opacity: 0, x: -16, duration: .4, ease: 'back.out(2)' });
  }
  function drawGhost() {
    ghostG.innerHTML = '';
    if (placed >= layers.length) return;
    const { y0, y1 } = bands[placed];
    const g = frag(`<rect x="0" y="${n1(y0)}" width="${W}" height="${n1(y1 - y0)}" class="lyr-ghost-r"/>
      <g class="lyr-ghost-q"><circle cx="${C.cx}" cy="${n1((y0 + y1) / 2)}" r="${n1(Math.min(13, (y1 - y0) / 2 + 3))}"/><text x="${C.cx}" y="${n1((y0 + y1) / 2 + 5)}">?</text></g>`, ghostG);
    if (!api.reduced) gsap.from(g, { opacity: 0, duration: .4 });
  }
  drawGhost();

  /* ---------- the end: time-lapse ---------- */
  function finish() {
    finished = true; root.classList.add('done');
    ghostG.innerHTML = '';
    const anim = after.anim || 'none';
    api.say(after.text ? `${t('All {n} layers are in! Now watch…', { n: layers.length })} ${after.text}` : t('All {n} layers are in. Well built!', { n: layers.length }), 'good');
    const go = () => {
      const tl = gsap.timeline({ onComplete: () => timers.push(setTimeout(() => api.complete({ message: cfg.win || after.text || t('You built every layer in the right order!') }), api.reduced ? 100 : 900)) });
      ({ compost: tlCompost, roots: tlRoots, sprout: tlSprout, filter: tlFilter, bubbles: tlBubbles }[anim] || tlNone)(tl);
      api.progress(.95);
    };
    timers.push(setTimeout(go, api.reduced ? 50 : 1200));
  }
  const hud = $('.lyr-hud'), hudT = $('.lyr-hud-t'), hudSun = $('.lyr-hud-sun');
  function dayCounter(tl, days, dur, at = 0) {
    const o = { d: 0 };
    tl.to(hud, { opacity: 1, duration: .3 }, at)
      .to(o, { d: days, duration: dur, ease: 'none', onUpdate: () => { hudT.textContent = t('Day {n}', { n: Math.round(o.d) }); } }, at)
      .to(hudSun, { rotation: 360 * Math.ceil(days / 6), svgOrigin: '32 30', duration: dur, ease: 'none' }, at);
  }
  const stackBounds = () => {
    const comp = layers.map((l, i) => COMPOSTABLE.has(l.texture) ? bands[i].y1 : 0);
    const y1 = Math.max(...comp) || C.bottom - 8, [a, b] = xRange(C.poly, y1 - 6);
    return { x0: a + 16, x1: b - 16, y0: topSurface + 10, y1: Math.max(topSurface + 30, y1 - 8) };
  };

  function tlCompost(tl) {
    dayCounter(tl, 45, 5);
    const r = rng(seed + 5);
    bandEls.forEach((B, i) => {
      if (!COMPOSTABLE.has(B.tex)) return;
      const ov = el('g', { opacity: 0 }, B.g);
      ov.innerHTML = `<path d="${B.base}" fill="url(#lyr-g-compost)"/><path d="${B.base}" fill="url(#lyr-p-compost)"/>${TEX.compost.items(B.box, r).join('')}`;
      const delay = .3 + (bandEls.length - i) * .35;
      tl.to(ov, { opacity: .95, duration: 2.6, ease: 'power1.inOut' }, delay);
      const old = B.g.querySelectorAll('.lyr-items > :not(.lyr-worm)');
      if (old.length) tl.to(old, { opacity: .1, duration: 2.4 }, delay);
    });
    tl.add(() => addWorms(null, 6, stackBounds()), .2);
    const S = xf(stackG, C.cx, C.bottom);
    tl.to(S, { sy: .84, duration: 4.6, ease: 'power1.inOut', onUpdate: S.apply }, .3)
      .to(tagsG, { opacity: .35, duration: 1 }, .3).to(tagsG, { opacity: 1, duration: .6 }, 5.2);
    for (let i = 0; i < 4; i++) {
      const x = C.cx - 50 + i * 33;
      const p = el('path', { d: `M${x} ${topSurface}q-8 -14 0 -26q8 -12 0 -26`, stroke: '#fff', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, fxTop);
      tl.fromTo(p, { opacity: 0, y: 0 }, { opacity: .5, y: -20, duration: 1.2, repeat: 2, yoyo: true, ease: 'sine.inOut' }, .8 + i * .3);
    }
    tl.add(() => { api.say(t('Dark, crumbly vermicompost! The worms did all the work.'), 'good'); sparkleAt(C.cx, topSurface + 40); }, 5.2);
  }

  function tlRoots(tl) {
    dayCounter(tl, 21, 4.4);
    const r = rng(seed + 9), cx = C.cx, y0 = topSurface + 2;
    // roots: a branching tree drawn down through the layers
    const roots = [];
    const grow = (x, y, ang, len, depth, gen) => {
      const pts = [[x, y]]; let a = ang;
      for (let k = 0; k < 5; k++) { a += R(r, -.25, .25); x += Math.cos(a) * len / 5; y += Math.sin(a) * len / 5; if (y > C.bottom - 10) { y = C.bottom - 10; break; } const [lo, hi] = xRange(C.poly, y); x = clamp(x, lo + 8, hi - 8); pts.push([x, y]); }
      roots.push({ d: openSmooth(pts), w: Math.max(1.2, 4.2 - gen * 1.3), gen });
      if (depth > 0) for (let k = 1; k < pts.length - 1; k += 1 + (r() < .5 ? 1 : 0)) grow(pts[k][0], pts[k][1], Math.PI / 2 + (r() < .5 ? -1 : 1) * R(r, .6, 1.1), len * R(r, .38, .55), depth - 1, gen + 1);
    };
    grow(cx, y0, Math.PI / 2, (C.bottom - y0) * .92, 2, 0);
    const rg = el('g', {}, fxIn);
    roots.forEach(q => { el('path', { d: q.d, stroke: '#7A5A36', 'stroke-width': q.w + 1.6, fill: 'none', 'stroke-linecap': 'round', opacity: .55, class: `lyr-rt g${q.gen}` }, rg); el('path', { d: q.d, stroke: '#F3E7CC', 'stroke-width': q.w, fill: 'none', 'stroke-linecap': 'round', class: `lyr-rt g${q.gen}` }, rg); });
    [0, 1, 2].forEach(gn => tl.fromTo(rg.querySelectorAll(`.g${gn}`), { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.2 - gn * .4, stagger: .05, ease: 'power1.out' }, .4 + gn * 1.1));
    plant(tl, cx, y0, 92, 6, .3);
    tl.add(() => sparkleAt(cx, y0 - 60), 4.6);
  }
  function plant(tl, x, y, hgt, nLeaves, at) {
    const pg = el('g', {}, fxMid);
    const stem = el('path', { d: `M${x} ${y}C${x - 6} ${y - hgt * .4} ${x + 8} ${y - hgt * .7} ${x} ${y - hgt}`, stroke: '#4C8A2A', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, pg);
    tl.fromTo(stem, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power1.out' }, at);
    for (let i = 0; i < nLeaves; i++) {
      const t = (i + 1) / (nLeaves + .4), ly = y - hgt * t, side = i % 2 ? 1 : -1, len = 22 + 8 * Math.sin(t * Math.PI);
      const lf = el('g', { transform: `translate(${x + side * 1.5} ${n1(ly)}) rotate(${side * (62 - t * 25)})` }, pg);
      lf.innerHTML = `<path d="${leafD(len, len * .55)}" fill="${i % 2 ? '#6FB43F' : '#5EA234'}"/><path d="M0 0V${-len * .9}" stroke="#2F5E1A" stroke-width="1" opacity=".45"/>`;
      const inner = lf.firstElementChild, vein = lf.lastElementChild;
      tl.from([inner, vein], { scale: 0, transformOrigin: '50% 100%', duration: .6, ease: 'back.out(2.2)' }, at + .3 + t * 1.3);
    }
    return pg;
  }

  function tlSprout(tl) {
    dayCounter(tl, 7, 4);
    const seedIdx = layers.findIndex(l => l.texture === 'seeds');
    const sy = seedIdx >= 0 ? bands[seedIdx].y1 - 5 : topSurface + 6;
    const [lo, hi] = xRange(C.poly, topSurface + 2), n = clamp(Math.round((hi - lo) / 46), 3, 7);
    const r = rng(seed + 3);
    for (let i = 0; i < n; i++) {
      const x = lo + (i + .5) * (hi - lo) / n + R(r, -6, 6), hgt = sy - topSurface + R(r, 26, 44), at = .3 + i * .25 + R(r, 0, .3);
      const sd = el('ellipse', { cx: x, cy: sy, rx: 4.6, ry: 3, fill: '#D9B77A', stroke: '#8A6A3A', 'stroke-width': .9 }, fxIn);
      tl.to(sd, { attr: { rx: 5.6, ry: 4 }, duration: .4, ease: 'back.out(3)' }, at);
      const root = el('path', { d: `M${x} ${sy}q${R(r, -6, 6)} 10 ${R(r, -4, 4)} ${R(r, 20, 30)}`, stroke: '#F3E7CC', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, fxIn);
      tl.fromTo(root, { drawSVG: '0%' }, { drawSVG: '100%', duration: .9 }, at + .3);
      const stemD = `M${x} ${sy}C${x + 6} ${sy - hgt * .3} ${x - 7} ${sy - hgt * .7} ${x} ${sy - hgt}`;
      const stem = el('path', { d: stemD, stroke: '#7BBE48', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, fxMid);
      tl.fromTo(stem, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'power1.out' }, at + .5);
      const cot = el('g', { transform: `translate(${x} ${n1(sy - hgt)})` }, fxMid);
      cot.innerHTML = `<path d="${leafD(15, 11)}" fill="#7CC250" transform="rotate(-62)"/><path d="${leafD(15, 11)}" fill="#68B23E" transform="rotate(62)"/>`;
      tl.from(cot.children, { scale: 0, transformOrigin: '50% 100%', duration: .55, ease: 'back.out(2.6)', stagger: .08 }, at + 1.6);
    }
    tl.add(() => sparkleAt(C.cx, topSurface - 30), 3.6);
  }

  function tlFilter(tl) {
    const [lo, hi] = xRange(C.poly, topSurface - 4);
    const poolTop = Math.max(C.top + 4, topSurface - 34);
    hudT.textContent = t('Filtering…');
    tl.to(hud, { opacity: 1, duration: .3 }, 0);
    const pool = el('rect', { x: 0, y: poolTop, width: W, height: topSurface - poolTop + 6, fill: 'rgba(122,88,48,.88)' }, fxIn);
    stream('#8A6236', topSurface, .9, true);
    tl.from(pool, { scaleY: 0, svgOrigin: `${C.cx} ${topSurface + 6}`, duration: 1, ease: 'power1.inOut' }, .25);
    // dirt specks trapped in the top layer
    const r = rng(seed + 11), specks = el('g', { opacity: 0 }, fxIn);
    let s = ''; for (let i = 0; i < 40; i++) s += `<circle cx="${n1(R(r, lo + 6, hi - 6))}" cy="${n1(R(r, topSurface + 2, topSurface + 16))}" r="${n1(R(r, .8, 2))}" fill="#5A3A1C"/>`;
    specks.innerHTML = s;
    const n = bandEls.length, dirty = [122, 88, 48], clean = [110, 184, 232];
    const wet = [];
    for (let k = n - 1; k >= 0; k--) {
      const B = bandEls[k], f = (n - 1 - k + 1) / n, c = dirty.map((v, j) => Math.round(v + (clean[j] - v) * f));
      const w = el('path', { d: B.base, fill: `rgba(${c.join(',')},.34)`, opacity: 0 }, B.g);
      wet.push(w);
    }
    const t0 = 1.4, per = 2.6 / n;
    tl.to(pool, { scaleY: 0, svgOrigin: `${C.cx} ${topSurface + 6}`, duration: 2.8, ease: 'power1.in' }, t0)
      .to(specks, { opacity: 1, duration: 1.2 }, t0 + .2)
      .to(wet, { opacity: 1, duration: per * 1.2, stagger: per, ease: 'power1.inOut' }, t0)
      .to(wet, { opacity: .35, duration: 1.4, stagger: per }, t0 + per * 1.5);
    const tEnd = t0 + 2.8;
    if (C.outlet && C.glass) {
      const G = C.glass, [ox, oy] = C.outlet;
      const fill = el('rect', { x: G.x0, y: G.top + (G.bottom - G.top) * .35, width: G.x1 - G.x0, height: (G.bottom - G.top) * .65, fill: 'url(#lyr-clean)', 'clip-path': 'url(#lyr-glass-clip)' }, under);
      tl.from(fill, { scaleY: 0, svgOrigin: `${(G.x0 + G.x1) / 2} ${G.bottom}`, duration: 3, ease: 'power1.out' }, tEnd);
      for (let i = 0; i < 12; i++) {
        const d = el('path', { d: `M${ox} ${oy}q-4 7 0 9q4 -2 0 -9z`, fill: '#8FCBF0', opacity: 0 }, fxTop);
        tl.fromTo(d, { opacity: 1, y: 0 }, { y: G.bottom - oy - 12 - i * 2.4, duration: .5, ease: 'power2.in' }, tEnd + i * .25).to(d, { opacity: 0, duration: .1 });
      }
      tl.add(() => { api.say(t('Look! Clear water drips out at the bottom. The dirt stayed behind in the layers.'), 'good'); sparkleAt((G.x0 + G.x1) / 2, G.top + 20); }, tEnd + 2.4);
    } else {
      const soak = el('ellipse', { cx: C.cx, cy: C.bottom + 8, rx: (hi - lo) / 2, ry: 14, fill: 'rgba(60,110,160,.35)', opacity: 0 }, under);
      tl.to(soak, { opacity: 1, duration: 1.5 }, tEnd).add(() => api.say(t('The water soaked down through every layer and came out clean.'), 'good'), tEnd + 1);
    }
  }

  function tlBubbles(tl) {
    hudT.textContent = t('Air pump on');
    tl.to(hud, { opacity: 1, duration: .3 }, 0);
    const [lo, hi] = xRange(C.poly, C.bottom - 10), x = C.cx;
    const tube = el('g', {}, fxMid);
    tube.innerHTML = `<path d="M${hi + 30} ${C.top - 40}C${hi + 30} ${C.top + 20} ${hi - 20} ${C.top} ${x + 30} ${C.top + 10}L${x + 10} ${C.bottom - 16}" stroke="#7FB3C9" stroke-width="4" fill="none" opacity=".9"/><rect x="${x - 6}" y="${C.bottom - 20}" width="30" height="10" rx="5" fill="#9AA1AA"/>`;
    tl.from(tube, { opacity: 0, duration: .5 }, 0);
    for (let i = 0; i < 36; i++) {
      const b = el('circle', { cx: x + 8 + R(Math.random, -8, 8), cy: C.bottom - 22, r: R(Math.random, 2, 5), fill: 'rgba(255,255,255,.35)', stroke: '#fff', 'stroke-width': 1.2, opacity: 0 }, fxIn);
      const rise = C.bottom - 22 - topSurface;
      tl.fromTo(b, { opacity: .95, y: 0, x: 0 }, { y: -rise, x: R(Math.random, -26, 26), duration: R(Math.random, 1.6, 2.4), ease: 'power1.in' }, .4 + i * .1)
        .to(b, { scale: 1.8, opacity: 0, transformOrigin: '50% 50%', duration: .15 });
    }
    tl.add(() => { api.say(t('Bubbles carry air (oxygen) down to the roots.'), 'good'); sparkleAt(x, topSurface); }, 4);
  }
  function tlNone(tl) {
    const S = xf(stackG, C.cx, C.bottom);
    tl.to(S, { sy: 1.05, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out', onUpdate: S.apply })
      .add(() => sparkleAt(C.cx, topSurface + 20));
  }

  api.say(cfg.mission || t('Build the {kind} layer by layer, from the bottom up.', { kind: kindName }));
  return {
    destroy() {
      timers.forEach(clearTimeout);
      tickers.forEach(t => gsap.ticker.remove(t));
      drags.forEach(d => d.kill());
      gsap.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

export const demo = {
  title: 'Build a vermicompost bin',
  mission: 'Fill the compost bin layer by layer, from the bottom up, to make a cosy home for earthworms. Two cards do not belong!',
  fact: 'Earthworms have no eyes or lungs. They breathe through their moist skin and can eat about half their own weight in food every day.',
  container: 'bin',
  layers: [
    { label: 'Pebbles', texture: 'pebbles', why: 'Pebbles at the bottom let extra water drain away so the bin does not get soggy.' },
    { label: 'Coarse sand', texture: 'sand', why: 'Sand stops soil from slipping into the gaps between the pebbles.' },
    { label: 'Garden soil', texture: 'soil', why: 'Soft, moist soil is the bedding where the worms live and hide.' },
    { label: 'Earthworms', texture: 'worms', why: 'The worms go into the soft bedding, ready to eat.' },
    { label: 'Cow dung', texture: 'cow-dung', why: 'Cow dung is food for the worms and adds helpful microbes.' },
    { label: 'Dry leaves', texture: 'dry-leaves', why: 'Dry leaves add carbon and keep the bin airy.' },
    { label: 'Kitchen waste', texture: 'kitchen-waste', why: 'Peels and vegetable scraps on top feed the worms every day.' },
  ],
  distractors: [
    { label: 'Plastic bags', texture: 'plastic', why: 'Plastic never rots. Worms cannot eat it and it blocks air.' },
    { label: 'Glossy paper', texture: 'newspaper', why: 'Shiny, coloured magazine paper has inks and coatings that are bad for worms. Use plain cardboard or newspaper instead.' },
  ],
  after: { anim: 'compost', text: 'In 6–8 weeks the worms turn the waste into dark, crumbly vermicompost that smells like a forest floor.' },
  win: 'Your bin is ready. Keep it moist and shady, and the worms will make rich compost for the school garden.',
};
