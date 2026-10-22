// Circuit lab: place parts on a board, wire terminals together, and watch real current flow.
// A small nodal-analysis solver (Kirchhoff's laws, LEDs as diodes, an Arduino running a fixed
// program) works out the voltage at every terminal, so glows, dots and pops follow real physics.
// Config (SPEC §2.14): board 'simple' | 'breadboard' | 'arduino'; parts: palette (repeat a name for
// more copies); goal: { text, needs, check: 'closed-loop' | 'sensor-trigger', output }.
import { h, esc, sparkle, shake } from '../kit.js';
import { t as tr } from '../../../i18n.js'; // `tr`: this file already uses `t` for terminals

export const meta = { title: 'Circuit builder', needs: ['gsap'] };

const VB = 4.5; // battery pack: three 1.5 V cells
const SC = t => (t === 'arduino' ? 1 : 1.22); // drawing scale of a part on the board
// Terminals: [key, label, x, y, nx, ny, role]  role: pos | neg | sig  (wire colour)
const PART = {
  battery: { name: tr('Battery pack'), terms: [['n', '−', -78, 6, -1, 0, 'neg'], ['p', '+', 78, 6, 1, 0, 'pos']] },
  switch: { name: tr('Push switch'), terms: [['a', '', -62, 26, -1, 0, 'sig'], ['b', '', 62, 26, 1, 0, 'sig']] },
  led: { name: 'LED', terms: [['a', '+', -56, 30, -1, 0, 'sig'], ['k', '−', 56, 30, 1, 0, 'sig']] },
  resistor: { name: tr('Resistor 220 Ω'), terms: [['a', '', -66, 0, -1, 0, 'sig'], ['b', '', 66, 0, 1, 0, 'sig']] },
  buzzer: { name: tr('Buzzer'), terms: [['p', '+', -56, 30, -1, 0, 'sig'], ['n', '−', 56, 30, 1, 0, 'sig']] },
  motor: { name: tr('Motor + fan'), terms: [['a', '', -62, 30, -1, 0, 'sig'], ['b', '', 62, 30, 1, 0, 'sig']] },
  bulb: { name: tr('Bulb'), terms: [['a', '', -56, 32, -1, 0, 'sig'], ['b', '', 56, 32, 1, 0, 'sig']] },
  pir: { name: tr('PIR motion sensor'), terms: [['vcc', 'VCC', -28, 50, 0, 1, 'pos'], ['out', 'OUT', 0, 50, 0, 1, 'sig'], ['gnd', 'GND', 28, 50, 0, 1, 'neg']] },
  ldr: { name: tr('LDR light sensor'), terms: [['a', '', -50, 26, -1, 0, 'sig'], ['b', '', 50, 26, 1, 0, 'sig']] },
  arduino: { name: 'Arduino Uno', terms: [['gnd2', 'GND', -18, -92, 0, -1, 'neg'], ['d13', '13', 22, -92, 0, -1, 'sig'], ['d7', '7', 70, -92, 0, -1, 'sig'], ['d2', '2', 118, -92, 0, -1, 'sig'],
    ['v5', '5V', -66, 92, 0, 1, 'pos'], ['gnd', 'GND', -26, 92, 0, 1, 'neg'], ['a0', 'A0', 50, 92, 0, 1, 'sig']] },
};
const WIRE_COLS = ['#F2C230', '#3FA34D', '#2F7FD0', '#E8833A', '#9B59B6', '#17A2B8'];
const NEED_LABEL = n => PART[n]?.name || n;

/* ---------------------------------------------------------------- part art (local coords) */
function art(type, id) {
  switch (type) {
    case 'battery': return `
      <path d="M-62 6 H-78" stroke="#222" stroke-width="5" stroke-linecap="round"/><path d="M62 6 H78" stroke="#D93A2B" stroke-width="5" stroke-linecap="round"/>
      <rect x="-64" y="-34" width="128" height="74" rx="10" fill="#26282c"/><rect x="-64" y="-34" width="128" height="74" rx="10" fill="url(#lc-sheen)"/>
      ${[-22, 0, 22].map((y, i) => `<g transform="translate(0 ${y + 4})"><rect x="-52" y="-9" width="100" height="18" rx="5" fill="url(#lc-cell)"/><rect x="${i % 2 ? -52 : 20}" y="-9" width="28" height="18" rx="5" fill="#2B2B2B"/><rect x="${i % 2 ? -57 : 47}" y="-4" width="6" height="8" rx="2" fill="#c9ced6"/><rect x="-46" y="-6" width="88" height="3" rx="1.5" fill="#fff" opacity=".35"/></g>`).join('')}
      <rect x="-30" y="42" width="60" height="16" rx="8" fill="#FFF9EF" stroke="#2B1A10" stroke-opacity=".2"/><text x="0" y="54" class="lc-small">${VB} V</text>`;
    case 'switch': return `
      <path d="M-24 26 H-62 M24 26 H62" stroke="#9aa3ad" stroke-width="4" stroke-linecap="round"/>
      <rect x="-32" y="-26" width="64" height="58" rx="8" fill="#2B2B2B"/><rect x="-32" y="-26" width="64" height="58" rx="8" fill="url(#lc-sheen)"/>
      <rect x="-26" y="-20" width="52" height="46" rx="6" fill="#c9ced6"/>
      <g class="lc-cap"><circle cx="0" cy="3" r="17" fill="#8e1e1a"/><circle cx="0" cy="0" r="17" fill="url(#lc-capg)"/><ellipse cx="-5" cy="-6" rx="6" ry="3" fill="#fff" opacity=".45"/></g>
      <rect class="lc-swtag" x="-24" y="38" width="48" height="18" rx="9"/><text class="lc-swtxt lc-small" x="0" y="51">${tr('OFF')}</text>`;
    case 'led': return `
      <circle class="lc-glow" cx="0" cy="-18" r="58" fill="url(#lc-ledglow)"/>
      <path d="M-8 6 V18 Q-8 30 -20 30 H-56" stroke="#a7aeb7" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M8 6 V12 Q8 30 20 30 H56" stroke="#a7aeb7" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="5" rx="21" ry="6" fill="#8e1e1a"/>
      <path class="lc-dome" d="M-17 5 V-18 A17 17 0 0 1 17 -18 V5 Z"/>
      <path class="lc-crack" d="M-6 -30 L0 -20 L-5 -12 L3 -2" stroke="#111" stroke-width="2" fill="none"/>
      <path d="M-10 -20 A10 10 0 0 1 -3 -31" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <text x="-36" y="22" class="lc-small lc-pol">+ long</text><text x="36" y="22" class="lc-small lc-pol">−</text>`;
    case 'resistor': return `
      <path d="M-66 0 H66" stroke="#a7aeb7" stroke-width="4" stroke-linecap="round"/>
      <path d="M-38 -12 Q-42 0 -38 12 L-28 12 Q-24 9 -20 9 H20 Q24 9 28 12 L38 12 Q42 0 38 -12 L28 -12 Q24 -9 20 -9 H-20 Q-24 -9 -28 -12 Z" fill="url(#lc-res)"/>
      <rect x="-30" y="-12" width="6" height="24" fill="#D33A2C"/><rect x="-16" y="-9" width="6" height="18" fill="#D33A2C"/><rect x="-4" y="-9" width="6" height="18" fill="#7A4A1E"/><rect x="24" y="-12" width="6" height="24" fill="#C9A43A"/>
      <path d="M-34 -8 H34" stroke="#fff" stroke-width="2" opacity=".35"/>
      <text x="0" y="34" class="lc-small">220 Ω</text>`;
    case 'buzzer': return `
      <path d="M-14 22 V30 H-56 M14 22 V30 H56" stroke="#a7aeb7" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g class="lc-waves"><path d="M40 -26 A26 26 0 0 1 40 10"/><path d="M52 -36 A40 40 0 0 1 52 20"/><path d="M-40 -26 A26 26 0 0 0 -40 10"/><path d="M-52 -36 A40 40 0 0 0 -52 20"/></g>
      <g class="lc-vib"><circle cx="0" cy="-8" r="32" fill="url(#lc-buzz)"/><circle cx="0" cy="-8" r="22" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2"/><circle cx="0" cy="-8" r="5" fill="#0c0c0c"/>
      <text x="-16" y="-20" class="lc-small" fill="#eee">+</text><ellipse cx="-12" cy="-26" rx="9" ry="4" fill="#fff" opacity=".18"/></g>`;
    case 'motor': return `
      <path d="M-30 18 V30 H-62 M-4 18 V30 H62" stroke="#a7aeb7" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="-42" y="-14" width="70" height="36" rx="12" fill="url(#lc-metal)"/><rect x="18" y="-10" width="16" height="28" rx="5" fill="#f2f2f2" stroke="#bbb"/>
      <rect x="-34" y="-8" width="44" height="4" rx="2" fill="#fff" opacity=".6"/>
      <rect x="-2" y="-36" width="4" height="24" fill="#888"/>
      <g class="lc-fan" style="transform-origin: 0px -40px"><g transform="translate(0 -40)">${[0, 120, 240].map(a => `<ellipse rx="8" ry="24" cy="-20" fill="${['#2F7FD0', '#E8833A', '#3FA34D'][a / 120]}" transform="rotate(${a})" opacity=".92"/>`).join('')}<circle r="6" fill="#444"/></g></g>`;
    case 'bulb': return `
      <circle class="lc-glow" cx="0" cy="-24" r="64" fill="url(#lc-bulbglow)"/>
      <path d="M-12 20 V32 H-56 M12 20 V32 H56" stroke="#a7aeb7" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="-24" y="8" width="48" height="16" rx="4" fill="#2B2B2B"/>
      <rect x="-12" y="-6" width="24" height="16" rx="3" fill="url(#lc-metal)"/><path d="M-12 -2 H12 M-12 3 H12" stroke="#777" stroke-width="1.5"/>
      <circle class="lc-glass" cx="0" cy="-24" r="22" fill="rgba(220,235,245,.55)" stroke="#9fb3c2" stroke-width="1.5"/>
      <path class="lc-fil" d="M-6 -6 V-22 L-3 -27 L0 -22 L3 -27 L6 -22 V-6" fill="none" stroke-width="2"/>
      <ellipse cx="-8" cy="-32" rx="5" ry="8" fill="#fff" opacity=".55" transform="rotate(25 -8 -32)"/>`;
    case 'pir': return `
      ${[-28, 0, 28].map(x => `<path d="M${x} 30 V50" stroke="#c9a43a" stroke-width="4" stroke-linecap="round"/>`).join('')}
      <g class="lc-cone"><path d="M0 -20 L-70 -100 A110 110 0 0 1 70 -100 Z" fill="url(#lc-cone)"/></g>
      <rect x="-46" y="-18" width="92" height="50" rx="6" fill="#2E7D4F"/><rect x="-46" y="-18" width="92" height="50" rx="6" fill="url(#lc-sheen)"/>
      <rect x="-38" y="14" width="10" height="10" rx="2" fill="#E8833A"/><rect x="28" y="14" width="10" height="10" rx="2" fill="#E8833A"/>
      <circle class="lc-dome" cx="0" cy="-14" r="30" fill="url(#lc-pirdome)"/>
      <path d="M-22 -26 Q0 -34 22 -26 M-28 -12 Q0 -20 28 -12 M-24 2 Q0 -6 24 2 M-10 -42 V12 M10 -42 V12" stroke="#000" stroke-opacity=".08" fill="none" stroke-width="2"/>
      <circle class="lc-pirled" cx="34" cy="-8" r="4"/>`;
    case 'ldr': return `
      <path d="M-10 4 V26 H-50 M10 4 V26 H50" stroke="#a7aeb7" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle class="lc-ldrdisc" cx="0" cy="-14" r="22" fill="url(#lc-ldr)" stroke="#fff" stroke-width="3"/>
      <path d="M-13 -22 H13 V-18 H-13 V-14 H13 V-10 H-13 V-6 H10" stroke="#7a2e10" stroke-width="2" fill="none"/>
      <circle cx="-8" cy="-26" r="4" fill="#fff" opacity=".5"/>`;
    case 'arduino': return `
      <rect x="-150" y="-100" width="300" height="200" rx="12" fill="url(#lc-pcb)"/>
      ${[[-138, -88], [138, -88], [-138, 88], [138, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#f3f3f3" stroke="#0a5d60" stroke-width="2"/>`).join('')}
      <rect x="-166" y="-70" width="46" height="40" rx="4" fill="url(#lc-metal)"/><rect x="-162" y="30" width="38" height="36" rx="4" fill="#1d1d1d"/>
      <rect x="-48" y="-104" width="184" height="18" rx="3" fill="#1d1d1d"/><rect x="-86" y="86" width="160" height="18" rx="3" fill="#1d1d1d"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${-44 + i * 20}" y="-99" width="8" height="8" fill="#555"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<rect x="${-82 + i * 20}" y="91" width="8" height="8" fill="#555"/>`).join('')}
      <rect x="-20" y="22" width="120" height="30" rx="3" fill="#1b1b1b"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${-16 + i * 10}" y="18" width="4" height="4" fill="#bbb"/><rect x="${-16 + i * 10}" y="52" width="4" height="4" fill="#bbb"/>`).join('')}
      <text x="40" y="42" class="lc-small" fill="#bbb" font-size="9">ATMEGA328P</text>
      <text x="-60" y="-12" fill="#fff" font-size="30" font-weight="800" font-style="italic" opacity=".92">UNO</text>
      <text x="-60" y="10" fill="#fff" font-size="11" opacity=".8">Arduino</text>
      <rect x="110" y="-60" width="14" height="14" rx="3" fill="#C9302C"/><circle cx="117" cy="-53" r="4" fill="#E8E8E8"/>
      <text x="-2" y="-62" fill="#fff" font-size="9">L</text><rect class="lc-ledL" x="6" y="-70" width="10" height="7" rx="2"/>
      <text x="96" y="-14" fill="#fff" font-size="9">ON</text><rect x="114" y="-22" width="10" height="7" rx="2" fill="#5ef06b"/>
      <text x="-60" y="76" fill="#fff" font-size="9" opacity=".8">POWER</text><text x="40" y="76" fill="#fff" font-size="9" opacity=".8">ANALOG IN</text><text x="30" y="-76" fill="#fff" font-size="9" opacity=".8">DIGITAL (PWM~)</text>`;
  }
  return '';
}
const DEFS = `<defs>
  <linearGradient id="lc-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="lc-cell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C948"/><stop offset=".5" stop-color="#E0A21B"/><stop offset="1" stop-color="#9a6a08"/></linearGradient>
  <radialGradient id="lc-capg" cx=".35" cy=".3"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".6" stop-color="#D93A2B"/><stop offset="1" stop-color="#9a2318"/></radialGradient>
  <linearGradient id="lc-led" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a3201b"/><stop offset=".45" stop-color="#d9433a"/><stop offset="1" stop-color="#8e1e1a"/></linearGradient>
  <radialGradient id="lc-led-on" cx=".45" cy=".35"><stop offset="0" stop-color="#fff6e8"/><stop offset=".35" stop-color="#ff7a5e"/><stop offset="1" stop-color="#ff2d1a"/></radialGradient>
  <radialGradient id="lc-ledglow"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".95"/><stop offset=".35" stop-color="#ff4a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient>
  <radialGradient id="lc-bulbglow"><stop offset="0" stop-color="#fff3b0" stop-opacity="1"/><stop offset=".4" stop-color="#ffd54a" stop-opacity=".5"/><stop offset="1" stop-color="#ffc400" stop-opacity="0"/></radialGradient>
  <linearGradient id="lc-res" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DDB2"/><stop offset="1" stop-color="#C9A673"/></linearGradient>
  <radialGradient id="lc-buzz" cx=".35" cy=".3"><stop offset="0" stop-color="#555"/><stop offset="1" stop-color="#111"/></radialGradient>
  <linearGradient id="lc-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f4"/><stop offset=".5" stop-color="#b6bec8"/><stop offset="1" stop-color="#7b838e"/></linearGradient>
  <radialGradient id="lc-pirdome" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#ececec"/><stop offset="1" stop-color="#c9c9c9"/></radialGradient>
  <radialGradient id="lc-cone" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#ff5a7a" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a7a" stop-opacity="0"/></radialGradient>
  <radialGradient id="lc-ldr" cx=".4" cy=".35"><stop offset="0" stop-color="#ffb070"/><stop offset="1" stop-color="#d0601e"/></radialGradient>
  <linearGradient id="lc-pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0FA3A8"/><stop offset="1" stop-color="#00787d"/></linearGradient>
  <linearGradient id="lc-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6C08A"/><stop offset="1" stop-color="#C99A5B"/></linearGradient>
  <pattern id="lc-holes" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="6" height="6" rx="1" fill="#bdb6a6"/></pattern>
  <filter id="lc-drop" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#2B1A10" flood-opacity=".3"/></filter>
  <filter id="lc-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

/** A friendly orange cat, side view, facing right (about 120 × 90, feet at y = 0). */
export function catSVG() {
  return `<g class="lc-cat"><ellipse cx="0" cy="2" rx="46" ry="6" fill="#000" opacity=".15"/>
    <path class="lc-tail" d="M-40 -40 Q-70 -60 -58 -86" stroke="#E8833A" stroke-width="10" fill="none" stroke-linecap="round"/>
    <g class="lc-leg lc-l1"><rect x="-34" y="-26" width="11" height="28" rx="5" fill="#D9701F"/></g><g class="lc-leg lc-l2"><rect x="18" y="-26" width="11" height="28" rx="5" fill="#D9701F"/></g>
    <ellipse cx="-4" cy="-38" rx="44" ry="22" fill="#F0913F"/><path d="M-30 -52 q6 10 0 22 M-14 -58 q6 12 0 26 M2 -58 q6 12 0 26" stroke="#D9701F" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="-2" cy="-28" rx="30" ry="9" fill="#FBE3C8"/>
    <g class="lc-leg lc-l3"><rect x="-24" y="-26" width="11" height="28" rx="5" fill="#F0913F"/></g><g class="lc-leg lc-l4"><rect x="28" y="-26" width="11" height="28" rx="5" fill="#F0913F"/></g>
    <g transform="translate(40 -62)"><path d="M-18 -10 L-14 -34 L-2 -18 Z M18 -10 L14 -34 L2 -18 Z" fill="#E8833A"/><path d="M-14 -14 L-12 -28 L-5 -18 Z M14 -14 L12 -28 L5 -18 Z" fill="#F7B9B0"/>
    <circle r="22" fill="#F0913F"/><ellipse cx="4" cy="8" rx="13" ry="9" fill="#FBE3C8"/><ellipse cx="-7" cy="-3" rx="3.4" ry="4.6" fill="#2B1A10"/><ellipse cx="11" cy="-3" rx="3.4" ry="4.6" fill="#2B1A10"/>
    <circle cx="-6" cy="-5" r="1.2" fill="#fff"/><circle cx="12" cy="-5" r="1.2" fill="#fff"/><path d="M2 4 l3 3 l3 -3 Z" fill="#E86A7A"/><path d="M5 7 q-4 5 -8 2 M5 7 q4 5 8 2" stroke="#2B1A10" stroke-width="1.5" fill="none"/>
    <path d="M14 6 h14 M14 10 h13 M-6 6 h-12 M-6 10 h-11" stroke="#2B1A10" stroke-width="1" opacity=".6"/></g></g>`;
}

/* ---------------------------------------------------------------- the solver */
function gauss(A, b) {
  const n = b.length;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-14) continue;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = Math.abs(A[r][r]) < 1e-14 ? 0 : s / A[r][r]; }
  return x;
}
/**
 * Simulate the board. parts: placed instances [{id,type}], wires: [{id,a,b}], sw: {id: closed},
 * env: { motion, dark }, burnt: Set. Returns { V(term), I: {partId: amps}, W: {wireId: amps}, ard, pir, short }.
 */
function simulate(parts, wires, sw, env, burnt) {
  const idx = new Map(), node = k => { if (!idx.has(k)) idx.set(k, idx.size); return idx.get(k); };
  for (const p of parts) for (const t of PART[p.type].terms) node(`${p.id}:${t[0]}`);
  const T = (p, k) => node(`${p.id}:${k}`);
  const ard = parts.find(p => p.type === 'arduino');
  const bat = parts.find(p => p.type === 'battery');
  const ref = bat ? T(bat, 'n') : ard ? T(ard, 'gnd') : -1;
  const out = { I: {}, W: {}, V: () => 0, ard: { d13: false, input: false }, pir: {}, short: null, ok: ref >= 0 };
  if (ref < 0) return out;
  const diodes = new Map(); // id -> on
  for (const p of parts) if ((p.type === 'led' && !burnt.has(p.id)) || p.type === 'buzzer') diodes.set(p.id, true);
  const pirOn = new Map(parts.filter(p => p.type === 'pir').map(p => [p.id, false]));
  let ardOut = false, V = [];
  const N = idx.size;
  const build = () => {
    const els = [];
    for (const w of wires) els.push({ k: 'G', a: node(w.a), b: node(w.b), g: 100, wire: w.id });
    for (const p of parts) {
      const t = k => T(p, k);
      switch (p.type) {
        case 'battery': els.push({ k: 'S', p: t('p'), n: t('n'), v: VB, g: 2, id: p.id }); break;
        case 'switch': els.push({ k: 'G', a: t('a'), b: t('b'), g: sw[p.id] ? 100 : 1e-9, id: p.id }); break;
        case 'resistor': els.push({ k: 'G', a: t('a'), b: t('b'), g: 1 / 220, id: p.id }); break;
        case 'motor': els.push({ k: 'G', a: t('a'), b: t('b'), g: 1 / 12, id: p.id }); break;
        case 'bulb': els.push({ k: 'G', a: t('a'), b: t('b'), g: 1 / 15, id: p.id }); break;
        case 'ldr': els.push({ k: 'G', a: t('a'), b: t('b'), g: env.dark ? 1 / 150000 : 1 / 1000, id: p.id }); break;
        case 'led': els.push(burnt.has(p.id) ? { k: 'G', a: t('a'), b: t('k'), g: 1e-9, id: p.id } : { k: 'D', a: t('a'), b: t('k'), vf: 2, g: 1 / 15, on: diodes.get(p.id), id: p.id }); break;
        case 'buzzer': els.push({ k: 'D', a: t('p'), b: t('n'), vf: 1, g: 1 / 150, on: diodes.get(p.id), id: p.id }); break;
        case 'pir':
          els.push({ k: 'G', a: t('vcc'), b: t('gnd'), g: 1 / 40000, id: p.id });
          if (pirOn.get(p.id)) els.push({ k: 'S', p: t('out'), n: t('gnd'), v: env.motion ? 3.3 : 0, g: 1 / 60, id: `${p.id}:o` });
          break;
        case 'arduino':
          els.push({ k: 'G', a: t('gnd'), b: t('gnd2'), g: 100, id: `${p.id}:g` });
          els.push({ k: 'S', p: t('v5'), n: t('gnd'), v: 5, g: 10, id: `${p.id}:5v` });
          for (const pin of ['d13', 'd7']) els.push({ k: 'S', p: t(pin), n: t('gnd'), v: ardOut ? 5 : 0, g: 1 / 25, id: `${p.id}:${pin}` });
          els.push({ k: 'S', p: t('a0'), n: t('gnd'), v: 5, g: 1 / 35000, id: `${p.id}:pu` }); // INPUT_PULLUP on A0
          els.push({ k: 'G', a: t('d2'), b: t('gnd'), g: 1 / 1e6, id: `${p.id}:pd` });
          break;
      }
    }
    return els;
  };
  const solveOnce = els => {
    const A = Array.from({ length: N }, () => new Array(N).fill(0)), b = new Array(N).fill(0);
    const G = (i, j, g) => { A[i][i] += g; A[j][j] += g; A[i][j] -= g; A[j][i] -= g; };
    for (const e of els) {
      if (e.k === 'G') G(e.a, e.b, e.g);
      else if (e.k === 'S') { G(e.p, e.n, e.g); b[e.p] += e.v * e.g; b[e.n] -= e.v * e.g; }
      else if (e.k === 'D') { if (e.on) { G(e.a, e.b, e.g); b[e.a] += e.vf * e.g; b[e.b] -= e.vf * e.g; } else G(e.a, e.b, 1e-9); }
    }
    for (let i = 0; i < N; i++) A[i][i] += 1e-9;
    for (let k = 0; k < N; k++) { A[ref][k] = 0; } A[ref][ref] = 1; b[ref] = 0;
    return gauss(A, b);
  };
  let els;
  for (let pass = 0; pass < 4; pass++) {
    for (let it = 0; it < 16; it++) {
      els = build(); V = solveOnce(els);
      let changed = false;
      for (const e of els) if (e.k === 'D') {
        const dv = V[e.a] - V[e.b], i = e.on ? (dv - e.vf) * e.g : 0;
        if (e.on && i < -1e-7) { diodes.set(e.id, false); changed = true; }
        if (!e.on && dv > e.vf + 1e-6) { diodes.set(e.id, true); changed = true; }
      }
      for (const p of parts) if (p.type === 'pir') { const on = V[T(p, 'vcc')] - V[T(p, 'gnd')] > 4; if (on !== pirOn.get(p.id)) { pirOn.set(p.id, on); changed = true; } }
      if (!changed) break;
    }
    if (!ard) break;
    const g = V[T(ard, 'gnd')], hasPir = parts.some(p => p.type === 'pir'), hasLdr = parts.some(p => p.type === 'ldr');
    const input = hasPir ? V[T(ard, 'd2')] - g > 2.5 : hasLdr ? V[T(ard, 'a0')] - g > 2.5 : true;
    out.ard.input = input; out.ard.mode = hasPir ? 'pir' : hasLdr ? 'ldr' : 'on';
    if (input === ardOut) break;
    ardOut = input;
  }
  out.ard.d13 = ardOut;
  for (const p of parts) if (p.type === 'pir') out.pir[p.id] = { powered: pirOn.get(p.id), firing: pirOn.get(p.id) && env.motion };
  out.V = key => (idx.has(key) ? V[idx.get(key)] : 0);
  for (const e of els) {
    let i = 0;
    if (e.k === 'G') i = (V[e.a] - V[e.b]) * e.g;
    else if (e.k === 'S') i = e.v * e.g - (V[e.p] - V[e.n]) * e.g; // out of the + side
    else if (e.k === 'D') i = e.on ? (V[e.a] - V[e.b] - e.vf) * e.g : 0;
    if (e.wire) out.W[e.wire] = i; else if (e.id) out.I[e.id] = (out.I[e.id] || 0) + i;
  }
  if (bat && out.I[bat.id] > 1.2) out.short = bat.id;
  if (ard && out.I[`${ard.id}:5v`] > .6) out.short = ard.id;
  out.diodeRev = {};
  for (const p of parts) if (p.type === 'led' || p.type === 'buzzer') { const [a, b] = p.type === 'led' ? ['a', 'k'] : ['p', 'n']; out.diodeRev[p.id] = V[T(p, b)] - V[T(p, a)] > 1; }
  return out;
}

/* ---------------------------------------------------------------- layout */
function layout(wide, hasArd, n) {
  if (wide) {
    if (hasArd) { const xs = [570, 840], ys = [150, 340, 530]; return { w: 1000, h: 660, ard: { x: 220, y: 340 }, slots: ys.flatMap(y => xs.map(x => ({ x, y }))).slice(0, Math.max(n, 2)), catY: 640 }; }
    const cols = n > 6 ? 4 : 3, xs = cols === 4 ? [140, 380, 620, 860] : [190, 500, 810], ys = [210, 470];
    return { w: 1000, h: 640, slots: ys.flatMap(y => xs.map(x => ({ x, y }))).slice(0, Math.max(n, 2)), catY: 620 };
  }
  if (hasArd) { const xs = [160, 440], ys = [450, 650, 850]; const k = Math.min(6, Math.max(n, 2)); return { w: 600, h: 120 + 200 * Math.ceil(k / 2) + 260, ard: { x: 300, y: 230 }, slots: ys.flatMap(y => xs.map(x => ({ x, y }))).slice(0, k), catY: 120 + 200 * Math.ceil(k / 2) + 240 }; }
  const k = Math.min(8, Math.max(n, 2)), rows = Math.ceil(k / 2), xs = [160, 440];
  return { w: 600, h: 150 + rows * 210 + 30, slots: Array.from({ length: rows }, (_, r) => xs.map(x => ({ x, y: 190 + r * 210 }))).flat().slice(0, k), catY: 150 + rows * 210 + 10 };
}

/* ---------------------------------------------------------------- the lab */
export function mount(stage, cfg, api) {
  const { gsap } = api;
  const board = ['simple', 'breadboard', 'arduino'].includes(cfg.board) ? cfg.board : 'simple';
  const goal = { needs: [], check: 'closed-loop', ...(cfg.goal || {}) };
  goal.needs = (goal.needs || []).filter(n => PART[n]);
  const list = (cfg.parts?.length ? cfg.parts : goal.needs).filter(n => PART[n]);
  for (const n of goal.needs) { const need = goal.needs.filter(x => x === n).length; while (list.filter(x => x === n).length < need) list.push(n); }
  if (board === 'arduino' && !list.includes('arduino')) list.unshift('arduino');
  const parts = list.map((type, i) => ({ id: `p${i}`, type, slot: null }));
  const ardPart = parts.find(p => p.type === 'arduino');
  if (ardPart) ardPart.slot = 'ard';
  const output = PART[goal.output] ? goal.output : ['led', 'buzzer', 'bulb', 'motor'].find(t => goal.needs.includes(t)) || 'led';
  const sensor = goal.check === 'sensor-trigger' ? (goal.needs.includes('ldr') || (!goal.needs.includes('pir') && list.includes('ldr')) ? 'ldr' : 'pir') : null;
  const nSlots = parts.filter(p => p.type !== 'arduino').length;

  let wires = [], wid = 0, sw = {}, burnt = new Set(), env = { motion: false, dark: false, night: 0 }, sim = null, sel = null, selTerm = null, done = false, testing = false;
  let curTl = null, L = null, wide = true, lastStatus = '', said = new Set(), timers = [], buzzOsc = null, actx = null;
  parts.filter(p => p.type === 'switch').forEach(p => { sw[p.id] = false; });

  const root = h(`<div class="lab-circuit board-${board}">
    <aside class="lc-palette" aria-label="${tr('Parts box')}"><p class="lc-h">${tr('Parts box')}</p><div class="lc-cards"></div><p class="lc-tip">${tr('Drag a part onto the board, or tap it and then tap an empty spot.')}</p></aside>
    <div class="lc-main">
      <div class="lc-boardwrap"><svg class="lc-board" role="application" aria-label="${tr('Circuit board')}"></svg></div>
      <div class="lc-tools">
        <button type="button" class="lc-btn lc-hint">💡 ${tr('Hint')}</button>
        <button type="button" class="lc-btn lc-clear">✂️ ${tr('Clear wires')}</button>
        ${sensor ? `<button type="button" class="lc-btn lc-test">${sensor === 'pir' ? `🐈 ${tr('Send the cat')}` : `🌙 ${tr('Make it night')}`}</button>` : ''}
      </div>
    </div>
    <aside class="lc-side">
      <div class="lc-goalcard"><p class="lc-h">${tr('Goal')}</p><p class="lc-goaltxt">${esc(goal.text || tr('Build a closed circuit'))}</p>
        <ul class="lc-needs">${goal.needs.map(n => `<li data-need="${n}"><span class="lc-tick" aria-hidden="true"></span>${esc(NEED_LABEL(n))}</li>`).join('')}</ul></div>
      <div class="lc-status" aria-live="polite"><span class="lc-lamp"></span><span class="lc-stxt">${tr('Place the parts')}</span></div>
      ${ardPart ? `<pre class="lc-code" aria-label="${tr('The program on the Arduino')}"></pre>` : ''}
    </aside>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('.lc-board'), cards = $('.lc-cards');

  /* ---- palette ---- */
  function renderPalette() {
    const types = [...new Set(parts.filter(p => p.type !== 'arduino').map(p => p.type))];
    cards.innerHTML = types.map(t => {
      const left = parts.filter(p => p.type === t && p.slot == null).length;
      return `<button type="button" class="lc-card${left ? '' : ' empty'}${sel === t ? ' sel' : ''}" data-type="${t}" ${left ? '' : 'disabled'} aria-label="${esc(left > 1 ? tr('{name}, {n} left', { name: PART[t].name, n: left }) : PART[t].name)}">
        <svg viewBox="-90 -70 180 140" aria-hidden="true">${art(t, 'pal')}</svg><span>${esc(PART[t].name)}</span>${left > 1 ? `<b>×${left}</b>` : ''}</button>`;
    }).join('');
  }
  cards.addEventListener('pointerdown', e => {
    const c = e.target.closest('.lc-card'); if (!c || c.disabled) return;
    startPaletteDrag(e, c);
  });
  cards.addEventListener('keydown', e => { const c = e.target.closest('.lc-card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectType(c.dataset.type); } });
  function selectType(t) { sel = sel === t ? null : t; api.sound('click'); renderPalette(); render(); if (sel) api.say(tr('Now tap an empty spot on the board for the {name}.', { name: PART[t].name }), 'hint'); }

  function startPaletteDrag(e, card) {
    const type = card.dataset.type, x0 = e.clientX, y0 = e.clientY; let ghost = null, moved = false;
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      if (!moved) { moved = true; ghost = card.cloneNode(true); ghost.classList.add('lc-ghost'); api.root.append(ghost); api.sound('click'); svg.classList.add('dropping'); }
      ghost.style.left = `${ev.clientX}px`; ghost.style.top = `${ev.clientY}px`;
      const p = toSvg(ev); const s = nearestSlot(p, true); svg.querySelectorAll('.lc-slot').forEach(el => el.classList.toggle('over', +el.dataset.slot === s));
    };
    const up = ev => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      svg.classList.remove('dropping');
      if (!moved) { selectType(type); return; }
      const s = nearestSlot(toSvg(ev), true);
      if (s != null) { place(type, s, ghost); } else if (ghost && gsap) { const r = card.getBoundingClientRect(); gsap.to(ghost, { left: r.left + r.width / 2, top: r.top + r.height / 2, scale: .6, opacity: 0, duration: .35, ease: 'power2.in', onComplete: () => ghost.remove() }); return; }
      ghost?.remove();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  function place(type, slot, ghost) {
    const p = parts.find(q => q.type === type && q.slot == null); if (!p) return;
    p.slot = slot; sel = null; api.sound('drop');
    renderPalette(); render();
    const g = svg.querySelector(`.lc-part[data-id="${p.id}"] .lc-inner`);
    if (gsap && g && !api.reduced) gsap.from(g, { y: -40, scale: 1.15, opacity: 0, duration: .5, ease: 'back.out(2.2)' });
    if (goal.needs.includes(type)) { const li = root.querySelector(`[data-need="${type}"]`); if (li && gsap && !api.reduced) gsap.fromTo(li, { scale: 1.08 }, { scale: 1, duration: .4, ease: 'back.out(3)' }); }
    if (type === 'led' && !said.has('led')) { said.add('led'); api.say(tr('The LED has a long leg (+) and a short leg (−). Current can only go in through the + leg.'), 'hint'); }
    else if (type === 'arduino' || type === 'pir') { /* nothing */ }
    analyse(true);
  }
  function unplace(p) {
    wires = wires.filter(w => !w.a.startsWith(`${p.id}:`) && !w.b.startsWith(`${p.id}:`));
    p.slot = null; burnt.delete(p.id); if (p.type === 'switch') sw[p.id] = false;
    api.sound('whoosh'); renderPalette(); render(); analyse(true);
  }

  /* ---- coordinates ---- */
  function toSvg(ev) { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  function nearestSlot(p, freeOnly) {
    let best = null, bd = 140;
    L.slots.forEach((s, i) => { if (freeOnly && parts.some(q => q.slot === i)) return; const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  const posOf = p => p.slot === 'ard' ? L.ard : L.slots[p.slot];
  function termPos(key) {
    const [id, k] = key.split(':'); const p = parts.find(q => q.id === id); const t = PART[p.type].terms.find(x => x[0] === k); const o = posOf(p);
    const k2 = SC(p.type); return { x: o.x + t[2] * k2, y: o.y + t[3] * k2, nx: t[4], ny: t[5], role: t[6] };
  }
  function wireColor(w) {
    const ra = termPos(w.a).role, rb = termPos(w.b).role;
    if (ra === 'pos' || rb === 'pos') return '#D93A2B';
    if (ra === 'neg' || rb === 'neg') return '#2B2B2B';
    return WIRE_COLS[w.n % WIRE_COLS.length];
  }
  function wirePath(a, b) {
    const d = Math.max(40, Math.min(150, Math.hypot(b.x - a.x, b.y - a.y) * .4)), sag = Math.min(60, Math.abs(b.x - a.x) * .12 + 16);
    return `M${a.x} ${a.y} C${a.x + a.nx * d} ${a.y + a.ny * d + sag} ${b.x + b.nx * d} ${b.y + b.ny * d + sag} ${b.x} ${b.y}`;
  }

  /* ---- render ---- */
  function boardBg() {
    const { w, h: hh } = L;
    let s = `<rect class="lc-bg" x="6" y="6" width="${w - 12}" height="${hh - 12}" rx="26"/>`;
    if (board === 'breadboard') {
      s += `<rect x="22" y="22" width="${w - 44}" height="${hh - 44}" rx="16" fill="#F3EFE6" stroke="#d8d0bf" stroke-width="2"/>
        <rect x="40" y="40" width="${w - 80}" height="${hh - 80}" fill="url(#lc-holes)" opacity=".9"/>
        <rect x="40" y="${hh / 2 - 6}" width="${w - 80}" height="12" fill="#e2dccd"/>
        <path d="M40 34 H${w - 40}" stroke="#D93A2B" stroke-width="3"/><path d="M40 ${hh - 34} H${w - 40}" stroke="#2F7FD0" stroke-width="3"/>`;
    } else {
      s += `<rect x="18" y="18" width="${w - 36}" height="${hh - 36}" rx="20" fill="url(#lc-wood)"/>`;
      for (let i = 0; i < 18; i++) { const y = 30 + i * (hh - 60) / 18; s += `<path d="M30 ${y} Q${w * .3} ${y + 6 * Math.sin(i)} ${w * .6} ${y - 3} T${w - 30} ${y + 2}" stroke="#a87a43" stroke-opacity=".18" stroke-width="2" fill="none"/>`; }
      for (const [x, y] of [[40, 40], [w - 40, 40], [40, hh - 40], [w - 40, hh - 40]]) s += `<circle cx="${x}" cy="${y}" r="9" fill="url(#lc-metal)"/><path d="M${x - 5} ${y - 5} L${x + 5} ${y + 5}" stroke="#666" stroke-width="2"/>`;
    }
    return s;
  }
  function render() {
    const hasArd = !!ardPart;
    wide = svg.parentElement.clientWidth >= 620;
    L = layout(wide, hasArd, nSlots);
    svg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
    let s = DEFS + boardBg();
    if (sensor === 'ldr') s += `<g class="lc-sky"><rect x="18" y="18" width="${L.w - 36}" height="76" rx="18" class="lc-skyday"/><rect x="18" y="18" width="${L.w - 36}" height="76" rx="18" class="lc-skynight"/>
      <circle class="lc-sun" cx="${L.w - 90}" cy="56" r="22" fill="#FFD54A"/><g class="lc-moon"><circle cx="${L.w - 90}" cy="56" r="18" fill="#f4ead0"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${60 + i * (L.w - 220) / 12}" cy="${34 + (i * 37 % 44)}" r="2" fill="#fff"/>`).join('')}</g>
      <text x="40" y="62" class="lc-skytxt"></text></g>`;
    L.slots.forEach((sl, i) => {
      const occ = parts.some(p => p.slot === i);
      s += `<g class="lc-slot${occ ? ' occ' : ''}${sel && !occ ? ' ready' : ''}" data-slot="${i}" transform="translate(${sl.x} ${sl.y})" ${occ ? '' : `tabindex="0" role="button" aria-label="${tr('Empty spot {n}', { n: i + 1 })}"`}>
        <rect x="-96" y="-72" width="192" height="144" rx="20"/>${occ ? '' : '<path d="M-10 0 H10 M0 -10 V10" class="lc-plus"/>'}</g>`;
    });
    if (sensor === 'ldr') s += `<rect class="lc-nightveil" x="18" y="94" width="${L.w - 36}" height="${L.h - 112}" rx="18"/>`;
    for (const p of parts) if (p.slot != null) {
      const o = posOf(p);
      s += `<g class="lc-part lc-t-${p.type}${burnt.has(p.id) ? ' burnt' : ''}${p.type === 'switch' && sw[p.id] ? ' closed' : ''}" data-id="${p.id}" transform="translate(${o.x} ${o.y})">
        <g class="lc-inner"><g transform="scale(${SC(p.type)})"><g class="lc-body" filter="url(#lc-drop)" ${p.type !== 'arduino' ? 'tabindex="0" role="button"' : ''} aria-label="${esc(p.type === 'switch' ? tr('{name}, tap to switch on or off', { name: PART[p.type].name }) : PART[p.type].name)}">${art(p.type, p.id)}</g></g>
        ${p.type !== 'arduino' ? `<g class="lc-x" role="button" aria-label="${esc(tr('Remove {name}', { name: PART[p.type].name }))}" transform="translate(96 -70)"><circle r="15"/><path d="M-5 -5 L5 5 M5 -5 L-5 5"/></g>` : ''}</g></g>`;
    }
    s += '<g class="lc-wires">';
    for (const w of wires) {
      const a = termPos(w.a), b = termPos(w.b), d = wirePath(a, b), c = wireColor(w);
      s += `<g class="lc-wire" data-w="${w.id}"><path d="${d}" class="lc-wshadow"/><path d="${d}" class="lc-wout"/><path d="${d}" class="lc-wcol" stroke="${c}"/><path d="${d}" class="lc-whi"/><path d="${d}" class="lc-dots"/><path d="${d}" class="lc-whit"/></g>`;
    }
    s += '<path class="lc-temp" d=""/></g><g class="lc-terms">';
    for (const p of parts) if (p.slot != null) for (const t of PART[p.type].terms) {
      const key = `${p.id}:${t[0]}`, q = termPos(key);
      s += `<g class="lc-term${selTerm === key ? ' sel' : ''}" data-term="${key}" transform="translate(${q.x} ${q.y})" tabindex="0" role="button" aria-label="${esc(tr('{name} {leg} terminal', { name: PART[p.type].name, leg: t[1] || tr('leg') }))}">
        <circle class="lc-hit" r="30"/><circle class="lc-pad" r="9"/><circle class="lc-padin" r="4"/>${t[1] && p.type === 'arduino' ? `<text class="lc-tl" y="${t[5] < 0 ? -16 : 26}">${esc(t[1])}</text>` : ''}${t[1] && (p.type === 'pir') ? `<text class="lc-tl" y="26">${esc(t[1])}</text>` : ''}${t[1] && p.type === 'battery' ? `<text class="lc-tl lc-big" y="-16">${esc(t[1])}</text>` : ''}</g>`;
    }
    s += '</g>';
    if (sensor === 'pir') s += `<g class="lc-catlayer" transform="translate(-160 ${L.catY})">${catSVG()}</g>`;
    s += '<g class="lc-fx"></g>';
    svg.innerHTML = s;
    applySim();
  }

  /* ---- simulation → visuals ---- */
  const placed = () => parts.filter(p => p.slot != null);
  function run(e = env, swOverride) { return simulate(placed(), wires, swOverride || sw, e, burnt); }
  function applySim() {
    sim = run();
    const I = sim.I;
    for (const p of placed()) {
      const g = svg.querySelector(`.lc-part[data-id="${p.id}"]`); if (!g) continue;
      const i = Math.abs(I[p.id] || 0);
      if (p.type === 'led') { const b = burnt.has(p.id) ? 0 : Math.min(1, i / .012); g.classList.toggle('on', b > .05); g.style.setProperty('--b', b.toFixed(2)); if (!burnt.has(p.id) && i > .045) popLED(p); }
      if (p.type === 'bulb') { const b = Math.min(1, i / .25); g.classList.toggle('on', b > .15); g.style.setProperty('--b', b.toFixed(2)); }
      if (p.type === 'motor') { const on = i > .05; g.classList.toggle('on', on); g.style.setProperty('--spin', `${Math.max(.08, .6 - i)}s`); g.classList.toggle('rev', (I[p.id] || 0) < 0); }
      if (p.type === 'buzzer') g.classList.toggle('on', i > .005);
      if (p.type === 'switch') { g.classList.toggle('closed', !!sw[p.id]); const t = g.querySelector('.lc-swtxt'); if (t) t.textContent = sw[p.id] ? tr('ON') : tr('OFF'); }
      if (p.type === 'pir') { g.classList.toggle('powered', !!sim.pir[p.id]?.powered); g.classList.toggle('firing', !!sim.pir[p.id]?.firing); }
      if (p.type === 'ldr') g.classList.toggle('dark', env.dark);
      if (p.type === 'arduino') g.classList.toggle('d13', sim.ard.d13);
      if (p.type === 'battery') g.classList.toggle('short', sim.short === p.id);
    }
    for (const w of wires) {
      const el = svg.querySelector(`.lc-wire[data-w="${w.id}"]`); if (!el) continue;
      const i = sim.W[w.id] || 0, on = Math.abs(i) > .0008;
      el.classList.toggle('flow', on); el.classList.toggle('rev', i < 0);
      el.style.setProperty('--flow', `${Math.max(.25, Math.min(2.4, .9 - Math.log10(Math.abs(i) + 1e-6) * .35 - .9)).toFixed(2)}s`);
    }
    buzz(placed().some(p => p.type === 'buzzer' && Math.abs(I[p.id] || 0) > .005));
    if (sim.short && !said.has(`short${wires.length}`)) { said.add(`short${wires.length}`); api.mistake(); api.say(tr('Short circuit! The wire joins + straight to − with nothing in between, so a huge current flows and the battery gets hot. Remove that wire.'), 'bad'); const b = svg.querySelector(`.lc-part[data-id="${sim.short}"]`); if (b) { shake(api, b); puff(posOf(parts.find(p => p.id === sim.short)), '#9a9a9a'); } }
    updateCode();
    updateNeeds();
  }
  function popLED(p) {
    burnt.add(p.id); api.mistake();
    const o = posOf(p); api.sound('pop');
    const g = svg.querySelector(`.lc-part[data-id="${p.id}"]`);
    if (g) { g.classList.add('flash'); setTimeout(() => { g.classList.remove('flash', 'on'); g.classList.add('burnt'); }, 180); }
    puff({ x: o.x, y: o.y - 30 }, '#8a8a8a');
    api.say(tr('Pop! Too much current burnt out the LED. An LED always needs a resistor in its loop to limit the current. Tap the burnt LED for a new one.'), 'bad');
    setTimeout(() => applySim(), 250);
  }
  function puff(o, col) {
    const fx = svg.querySelector('.lc-fx'); if (!fx || !gsap) return;
    for (let i = 0; i < (api.reduced ? 3 : 9); i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', o.x + (Math.random() - .5) * 20); c.setAttribute('cy', o.y); c.setAttribute('r', 8 + Math.random() * 8); c.setAttribute('fill', col); c.setAttribute('opacity', '.7');
      fx.append(c);
      gsap.to(c, { attr: { cy: o.y - 60 - Math.random() * 50, cx: o.x + (Math.random() - .5) * 70, r: 20 + Math.random() * 12 }, opacity: 0, duration: 1.2 + Math.random() * .6, ease: 'power1.out', onComplete: () => c.remove() });
    }
  }

  /* ---- soft buzzer sound (own oscillator; respects the lab's mute button) ---- */
  const isMuted = () => api.root.querySelector('.lab-snd')?.getAttribute('aria-pressed') === 'false';
  function buzz(on) {
    if (on && !isMuted()) {
      if (buzzOsc) return;
      try {
        actx ||= new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), lfo = actx.createOscillator(), lg = actx.createGain(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = 880; lfo.frequency.value = 9; lg.gain.value = .012; g.gain.value = 0;
        lfo.connect(lg).connect(g.gain); o.connect(g).connect(actx.destination);
        g.gain.setTargetAtTime(.02, actx.currentTime, .05);
        o.start(); lfo.start(); buzzOsc = { o, lfo, g };
      } catch { /* no audio */ }
    } else if (buzzOsc) {
      const { o, lfo, g } = buzzOsc; buzzOsc = null;
      try { g.gain.setTargetAtTime(0, actx.currentTime, .04); o.stop(actx.currentTime + .2); lfo.stop(actx.currentTime + .2); } catch { /* ignore */ }
    }
  }

  /* ---- the Arduino program card ---- */
  function updateCode() {
    const pre = $('.lc-code'); if (!pre) return;
    const mode = sensor || 'on', hi = sim?.ard.d13;
    const lines = mode === 'pir' ? ['void loop() {', `  if (digitalRead(2) == HIGH) {   // ${tr('motion!')}`, `    digitalWrite(13, HIGH);   // ${tr('LED on')}`, '  } else {', `    digitalWrite(13, LOW);    // ${tr('LED off')}`, '  }', '}']
      : mode === 'ldr' ? [`// ${tr('LDR from A0 to GND')}`, 'void setup() { pinMode(A0, INPUT_PULLUP); }', 'void loop() {', `  if (analogRead(A0) > 500) {  // ${tr('dark!')}`, '    digitalWrite(13, HIGH);', '  } else {', '    digitalWrite(13, LOW);', '  }', '}']
        : ['void loop() {', `  digitalWrite(13, HIGH);   // ${tr('pins 13 and 7 on')}`, '}'];
    const active = mode === 'on' ? [1] : mode === 'pir' ? (hi ? [1, 2] : [3, 4]) : (hi ? [3, 4] : [5, 6]);
    pre.innerHTML = lines.map((l, i) => `<span class="${active.includes(i) ? 'act' : ''}">${esc(l)}</span>`).join('\n');
  }

  /* ---- goal analysis ---- */
  function needsPlaced() { return goal.needs.every((n, i) => placed().filter(p => p.type === n).length >= goal.needs.filter(x => x === n).length); }
  function updateNeeds() {
    root.querySelectorAll('.lc-needs li').forEach(li => li.classList.toggle('done', placed().some(p => p.type === li.dataset.need)));
    const placedN = goal.needs.filter(n => placed().some(p => p.type === n)).length;
    if (!done) api.progress(Math.min(.9, placedN / Math.max(1, goal.needs.length) * .45 + (outOn(sim) ? .45 : wires.length ? Math.min(.3, wires.length * .05) : 0)));
  }
  const outParts = () => placed().filter(p => p.type === output);
  function outOn(s) {
    if (!s) return false;
    return outParts().some(p => { const i = Math.abs(s.I[p.id] || 0); return output === 'led' ? !burnt.has(p.id) && i > .002 : output === 'bulb' ? i > .05 : output === 'motor' ? i > .05 : i > .005; });
  }
  const carries = (s, type) => placed().some(p => p.type === type && Math.abs(s.I[p.id] || 0) > 2e-5);
  function staticCheck() {
    if (!needsPlaced()) return { ok: false, why: 'parts' };
    if (goal.check === 'sensor-trigger') {
      const A = run({ motion: false, dark: false }), B = run(sensor === 'pir' ? { motion: true, dark: false } : { motion: false, dark: true });
      if (B.short || A.short) return { ok: false, why: 'short', s: B };
      if (!outOn(B)) return { ok: false, why: 'off', s: B };
      if (outOn(A)) return { ok: false, why: 'always', s: A };
      for (const n of goal.needs) if (!['arduino', 'pir'].includes(n) && !carries(B, n)) return { ok: false, why: 'unused', part: n, s: B };
      return { ok: true, s: B };
    }
    const swIds = placed().filter(p => p.type === 'switch').map(p => p.id);
    const allOn = Object.fromEntries(swIds.map(id => [id, true]));
    const B = run(env, { ...sw, ...allOn });
    if (B.short) return { ok: false, why: 'short', s: B };
    if (!outOn(B)) return { ok: false, why: 'off', s: B };
    for (const n of goal.needs) if (n !== 'arduino' && !carries(B, n)) return { ok: false, why: 'unused', part: n, s: B };
    if (goal.needs.includes('switch') && swIds.length) { const A = run(env, { ...sw, ...Object.fromEntries(swIds.map(id => [id, false])) }); if (outOn(A)) return { ok: false, why: 'always', s: A }; }
    return { ok: true, s: B, needSwitch: swIds.some(id => !sw[id]) };
  }
  function hint(c = staticCheck()) {
    const miss = goal.needs.find(n => !placed().some(p => p.type === n));
    if (c.why === 'parts' && miss) return tr('First put the {name} on the board.', { name: NEED_LABEL(miss) });
    if (c.why === 'short') return tr('There is a short circuit: + is joined to − with no part in between. Take that wire away.');
    const s = c.s || sim;
    const bl = placed().find(p => burnt.has(p.id)); if (bl) return tr('Tap the burnt LED to get a fresh one, and add a resistor to its loop this time.');
    const rev = placed().find(p => (p.type === 'led' || p.type === 'buzzer') && s?.diodeRev?.[p.id]);
    if (rev) return tr(ardPart ? 'The {name} is the wrong way round. Its + leg must connect towards the + of the Arduino pin. Swap its two wires.' : 'The {name} is the wrong way round. Its + leg must connect towards the + of the battery. Swap its two wires.', { name: NEED_LABEL(rev.type) });
    const loose = placed().find(p => goal.needs.includes(p.type) && p.type !== 'arduino' && PART[p.type].terms.some(t => !wires.some(w => w.a === `${p.id}:${t[0]}` || w.b === `${p.id}:${t[0]}`)));
    if (loose) return tr('The {name} still has a loose terminal. Drag a wire from it to the next part.', { name: NEED_LABEL(loose.type) });
    if (c.why === 'unused') return tr('The {name} is on the board but no current flows through it. Put it in the same loop.', { name: NEED_LABEL(c.part) });
    if (c.why === 'always') return goal.check === 'sensor-trigger' ? tr('The output is on even before the sensor is triggered. Let the sensor (through the Arduino) control it.') : tr('The output stays on even when the switch is off. Put the switch in the same loop, one after the other.');
    if (goal.check === 'sensor-trigger') {
      if (sensor === 'pir') return ardPart ? tr('Wire the PIR: VCC to 5V, GND to GND and OUT to pin 2. Then pin 13 → resistor → LED + leg, and the LED − leg to GND.') : tr('Power the PIR from the battery (VCC to +, GND to −), then run its OUT through the resistor and the LED back to −.');
      return tr('Wire the LDR from A0 to GND. Then pin 13 → resistor → LED + leg, and the LED − leg to GND.');
    }
    return ardPart ? tr('Make one loop: pin 13 → resistor → LED + leg, then LED − leg → GND.') : tr('Make one closed loop: battery + → switch → resistor → LED + leg, then LED − leg → battery −.');
  }
  function analyse(changed) {
    if (done) return;
    const c = staticCheck();
    let st = tr('Place the parts'), cls = '';
    if (sim?.short || c.why === 'short') { st = tr('Short circuit!'); cls = 'bad'; }
    else if (c.why === 'parts') st = tr('Place the parts');
    else if (c.why === 'short') { st = tr('Short circuit!'); cls = 'bad'; }
    else if (c.ok && goal.check === 'sensor-trigger') { st = sensor === 'pir' ? tr('Ready! Send the cat past') : tr('Ready! Make it night'); cls = 'ready'; }
    else if (c.ok && c.needSwitch) { st = tr('Loop closed. Press the switch!'); cls = 'ready'; }
    else if (c.ok) { st = tr('Current is flowing!'); cls = 'good'; }
    else st = wires.length ? tr('Loop not finished') : tr('Draw wires between terminals');
    const se = $('.lc-status'); se.className = `lc-status ${cls}`; $('.lc-stxt').textContent = st;
    if (changed && st !== lastStatus) {
      if (cls === 'ready' && goal.check === 'sensor-trigger') api.say(sensor === 'pir' ? tr('Your wiring looks ready. Tap "Send the cat" to test it!') : tr('Your wiring looks ready. Tap "Make it night" to test it!'), 'good');
      else if (cls === 'ready') api.say(tr('The loop is complete. Tap the switch to turn it on!'), 'hint');
    }
    lastStatus = st;
    if (goal.check !== 'sensor-trigger' && c.ok && !c.needSwitch) win();
  }
  function win(msg) {
    if (done) return; done = true;
    const p = outParts().find(q => !burnt.has(q.id)) || outParts()[0];
    const g = p && svg.querySelector(`.lc-part[data-id="${p.id}"] .lc-body`);
    api.say(msg || (output === 'led' ? tr('It glows! Current flows from +, through every part, and back to −.') : output === 'buzzer' ? tr('Bzzzz! The closed loop lets current flow through the buzzer.') : output === 'motor' ? tr('Whirr! The motor spins because current flows round the loop.') : tr('It lights up! The loop is closed.')), 'good');
    if (g) sparkle(api, g);
    $('.lc-status').className = 'lc-status good'; $('.lc-stxt').textContent = tr('You did it!');
    timers.push(setTimeout(() => api.complete(), api.reduced ? 600 : 2600));
  }

  /* ---- board interaction ---- */
  svg.addEventListener('pointerdown', e => {
    if (testing) return;
    const term = e.target.closest('.lc-term'), x = e.target.closest('.lc-x'), part = e.target.closest('.lc-part'), slot = e.target.closest('.lc-slot'), wire = e.target.closest('.lc-wire');
    if (x) { e.preventDefault(); unplace(parts.find(p => p.id === part.dataset.id)); return; }
    if (term) { e.preventDefault(); startWire(e, term.dataset.term); return; }
    if (part) { e.preventDefault(); startPartDrag(e, part); return; }
    if (wire) { e.preventDefault(); removeWire(wire.dataset.w); return; }
    if (slot && sel) { place(sel, +slot.dataset.slot); return; }
    svg.querySelectorAll('.lc-part.picked').forEach(g => g.classList.remove('picked'));
  });
  svg.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const term = e.target.closest('.lc-term'), slot = e.target.closest('.lc-slot'), part = e.target.closest('.lc-part');
    if (term) { e.preventDefault(); tapTerm(term.dataset.term); }
    else if (slot && sel) { e.preventDefault(); place(sel, +slot.dataset.slot); }
    else if (part) { e.preventDefault(); tapPart(parts.find(p => p.id === part.dataset.id)); }
  });
  function removeWire(id) {
    const w = wires.find(q => q.id === id); if (!w) return;
    const el = svg.querySelector(`.lc-wire[data-w="${id}"]`);
    api.sound('pop');
    const fin = () => { wires = wires.filter(q => q !== w); render(); analyse(true); };
    if (gsap && el && !api.reduced) gsap.to(el, { opacity: 0, scale: .96, transformOrigin: 'center', duration: .2, onComplete: fin }); else fin();
  }
  function tapTerm(key) {
    if (!selTerm) { selTerm = key; api.sound('click'); render(); return; }
    if (selTerm === key) { selTerm = null; render(); return; }
    addWire(selTerm, key); selTerm = null; render();
  }
  function addWire(a, b) {
    if (a === b) return false;
    if (wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) return false;
    wires.push({ id: `w${++wid}`, a, b, n: wid }); api.sound('drop');
    render();
    const el = svg.querySelector(`.lc-wire[data-w="w${wid}"] .lc-wcol`);
    if (gsap && el && !api.reduced && window.DrawSVGPlugin) gsap.from(svg.querySelectorAll(`.lc-wire[data-w="w${wid}"] path:not(.lc-dots)`), { drawSVG: '0%', duration: .35, ease: 'power2.out' });
    if (wires.length === 1 && !said.has('wire') && !sim?.short) { said.add('wire'); api.say(tr('Nice wire! Tap a wire to remove it. Keep joining parts until the loop is closed.'), 'info'); }
    analyse(true); return true;
  }
  function startWire(e, key) {
    const a = termPos(key), temp = svg.querySelector('.lc-temp'); let moved = false;
    const x0 = e.clientX, y0 = e.clientY;
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return; moved = true;
      const p = toSvg(ev), t = termAt(p, key);
      const b = t ? termPos(t) : { x: p.x, y: p.y, nx: 0, ny: 0 };
      temp.setAttribute('d', wirePath(a, b)); temp.setAttribute('stroke', a.role === 'pos' ? '#D93A2B' : a.role === 'neg' ? '#2B2B2B' : WIRE_COLS[(wid + 1) % WIRE_COLS.length]);
      svg.querySelectorAll('.lc-term').forEach(el => el.classList.toggle('hot', el.dataset.term === t));
    };
    const up = ev => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      temp.setAttribute('d', '');
      if (!moved) { tapTerm(key); return; }
      const t = termAt(toSvg(ev), key);
      if (t) addWire(key, t); else { selTerm = null; render(); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  function termAt(p, not) {
    let best = null, bd = 40;
    for (const q of placed()) for (const t of PART[q.type].terms) { const k = `${q.id}:${t[0]}`; if (k === not) continue; const o = termPos(k); const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; best = k; } }
    return best;
  }
  function tapPart(p) {
    if (p.type === 'switch') { sw[p.id] = !sw[p.id]; api.sound('click'); const cap = svg.querySelector(`.lc-part[data-id="${p.id}"] .lc-cap`); applySim(); if (gsap && cap && !api.reduced) gsap.fromTo(cap, { y: 0 }, { y: sw[p.id] ? 3 : 0, duration: .15 }); analyse(true); return; }
    if (burnt.has(p.id)) { burnt.delete(p.id); api.sound('pop'); api.say(tr('Here is a fresh LED. Add a resistor to its loop so it does not burn out.'), 'hint'); render(); analyse(true); return; }
    const g = svg.querySelector(`.lc-part[data-id="${p.id}"]`);
    svg.querySelectorAll('.lc-part.picked').forEach(x => { if (x !== g) x.classList.remove('picked'); });
    g?.classList.toggle('picked'); api.sound('click');
  }
  function startPartDrag(e, el) {
    const p = parts.find(q => q.id === el.dataset.id); if (p.type === 'arduino') return;
    const x0 = e.clientX, y0 = e.clientY, s0 = toSvg(e), inner = el.querySelector('.lc-inner'); let moved = false;
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return; moved = true; el.classList.add('dragging');
      const p2 = toSvg(ev); inner.setAttribute('transform', `translate(${p2.x - s0.x} ${p2.y - s0.y})`);
      const s = nearestSlot(p2, true); svg.querySelectorAll('.lc-slot').forEach(x => x.classList.toggle('over', +x.dataset.slot === s));
    };
    const up = ev => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      el.classList.remove('dragging');
      if (!moved) { tapPart(p); return; }
      const pt = toSvg(ev), s = nearestSlot(pt, true);
      const off = pt.x < 0 || pt.y < 0 || pt.x > L.w || pt.y > L.h || document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.lc-palette');
      if (off) { unplace(p); return; }
      if (s != null) { p.slot = s; api.sound('drop'); }
      render(); analyse(true);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }

  /* ---- tools ---- */
  $('.lc-hint').addEventListener('click', () => { api.sound('click'); api.say(hint(), 'hint'); });
  $('.lc-clear').addEventListener('click', () => { if (!wires.length || testing) return; wires = []; selTerm = null; api.sound('whoosh'); render(); analyse(true); });
  $('.lc-test')?.addEventListener('click', () => runTest());
  async function runTest() {
    if (testing || done) return;
    const c = staticCheck();
    if (c.why === 'parts') { api.say(hint(c), 'hint'); return; }
    testing = true; root.classList.add('testing'); $('.lc-test').disabled = true;
    const tl = curTl = gsap.timeline();
    if (sensor === 'pir') {
      const cat = svg.querySelector('.lc-catlayer'), pirs = placed().filter(p => p.type === 'pir').map(p => posOf(p).x);
      api.say(tr('Here comes the cat…'), 'info');
      const state = { x: -160 };
      cat.classList.add('walking');
      await new Promise(res => tl.to(state, { x: L.w + 160, duration: api.reduced ? 1.6 : 6, ease: 'none', onUpdate: () => {
        cat.setAttribute('transform', `translate(${state.x} ${L.catY})`);
        const m = pirs.some(px => Math.abs(px - state.x) < 170);
        if (m !== env.motion) { env.motion = m; applySim(); if (m) api.sound('tick'); }
      }, onComplete: res }));
      cat.classList.remove('walking'); env.motion = false; applySim();
    } else {
      api.say(tr('The sun is setting…'), 'info');
      const sky = svg.querySelector('.lc-sky'), st = { n: 0 };
      await new Promise(res => tl.to(st, { n: 1, duration: api.reduced ? .8 : 2.6, ease: 'power1.inOut', onUpdate: () => { root.style.setProperty('--night', st.n.toFixed(3)); const d = st.n > .5; if (d !== env.dark) { env.dark = d; applySim(); } } }).to({}, { duration: api.reduced ? .4 : 1.6, onComplete: res }));
      sky?.classList.add('night');
    }
    const ok = staticCheck();
    testing = false; root.classList.remove('testing'); $('.lc-test').disabled = false;
    if (ok.ok) win(sensor === 'pir' ? tr('The cat walked past, the PIR saw it, and your LED switched on by itself, then off again. Smart!') : tr('Night fell, the LDR\'s resistance went up, and the Arduino switched the light on all by itself!'));
    else {
      api.mistake(); api.say(`${sensor === 'pir' ? tr('Nothing happened when the cat passed.') : tr('The light did not come on at night.')} ${hint(ok)}`, 'hint');
      if (sensor === 'ldr') timers.push(setTimeout(() => { if (done) return; root.style.setProperty('--night', '0'); env.dark = false; applySim(); }, 1200));
    }
  }

  /* ---- init + resize ---- */
  renderPalette(); render(); analyse(false);
  const ro = new ResizeObserver(() => { const wnow = svg.parentElement.clientWidth >= 620; if (wnow !== wide) render(); });
  ro.observe(svg.parentElement);
  api.say(cfg.mission || goal.text || tr('Build the circuit!'));
  return {
    destroy() {
      ro.disconnect(); timers.forEach(clearTimeout); buzz(false);
      try { actx?.close(); } catch { /* ignore */ }
      curTl?.kill();
      root.remove();
    },
  };
}

export const demo = {
  title: 'Torch on a Board',
  board: 'simple',
  mission: 'Build a simple torch circuit. Place the battery pack, switch, resistor and LED on the board, then draw wires from terminal to terminal to make one closed loop. Press the switch to light the LED — without burning it out!',
  fact: 'The longer leg of an LED is its + leg. An LED lets current flow only one way, like a one-way door.',
  parts: ['battery', 'switch', 'resistor', 'led', 'buzzer', 'motor'],
  goal: { text: 'Make the LED glow when the switch is on', needs: ['battery', 'switch', 'resistor', 'led'], check: 'closed-loop', output: 'led' },
  win: 'Your torch works! Current flows round a closed loop: from +, through the switch, resistor and LED, and back to −.',
};
