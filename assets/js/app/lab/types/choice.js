// VINC Lab · choice — a visual-novel story with choices (interviews, role-play, customer service).
// A drawn backdrop for the place, the cast standing large with idle breathing (the speaker bobs while talking),
// speech bubbles that type out (tap to skip), choices as big cards. Good choices send sparkles into an
// "impression" meter; poor ones get a gentle redo with an explanation.
//
// Config (SPEC §2.9). Supported patterns and extras:
//   - a choice with good:false whose `to` is the same node (or missing) → feedback, then the same choices
//     come back with that card crossed out (the speaker's line is not re-typed)
//   - a choice with good:false whose `to` is another node → feedback, then the story goes there
//   - nodes with `next` and no choices → tap to continue;  `end: true` nodes may have `who` (that person speaks)
//   - cast members may use { emoji } instead of { sprite }; a node without `who` is narration
//   - extras: node.place (change the backdrop), node.mood ('happy'|'think'|'surprised'|'sad'|'love'),
//             choice.sprite / choice.emoji (art on the card), cfg.meter: false (hide the impression meter)
import { h, esc, shake, pop, sparkle } from '../kit.js';
import { t } from '../../../i18n.js';

export const meta = { title: 'Story choices', needs: ['gsap'] };

const PEOPLE = { farmer: '👨‍🌾', gardener: '🧑‍🌾', girl: '👧', boy: '👦', teacher: '👩‍🏫', shopkeeper: '🧔', customer: '🧑', grandmother: '👵', grandfather: '👴', doctor: '🧑‍⚕️', vet: '🧑‍⚕️', nurse: '👩‍⚕️', artisan: '🧑‍🎨', carpenter: '🧑‍🔧', mechanic: '🧑‍🔧', chef: '🧑‍🍳', puppeteer: '🧑‍🎤', family: '👨‍👩‍👧', mascot: '🤖', cow: '🐄', goat: '🐐', hen: '🐔', 'sock-puppet': '🧦', 'scratch-cat': '🐱' };
const MOOD = { happy: '😊', think: '💭', surprised: '❗', sad: '💧', love: '💖', question: '❓', idea: '💡' };
const LETTERS = 'ABCDEF';
const NAME_COLORS = ['var(--teal)', 'var(--rust)', 'var(--amber-ink)', 'var(--olive)', 'var(--plum)'];

function actorArt(api, m) {
  if (m.sprite && api.hasSprite(m.sprite)) return api.sprite(m.sprite);
  const e = m.emoji || PEOPLE[m.sprite] || (m.id === 'me' ? '🧒' : '🙂');
  return `<span class="chc-emoji" aria-hidden="true">${esc(e)}</span>`;
}
function smallArt(api, it) {
  if (!it) return '';
  if (it.sprite && api.hasSprite(it.sprite)) return api.sprite(it.sprite);
  return it.emoji ? `<span class="lab-emoji" aria-hidden="true">${esc(it.emoji)}</span>` : '';
}

/* ------------------------------------------------------------------ backdrops (960 × 400) */
const sky = (id, a, b) => `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const cloud = (x, y, s = 1) => `<g class="chc-cloud" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="10" rx="46" ry="14" fill="#fff"/><circle cx="-18" cy="2" r="16" fill="#fff"/><circle cx="8" cy="-6" r="21" fill="#fff"/><circle cx="30" cy="4" r="14" fill="#fff"/></g>`;
const sunG = (x, y) => `<circle cx="${x}" cy="${y}" r="56" fill="#FFE9A8" opacity=".4"/><circle cx="${x}" cy="${y}" r="34" fill="#F7C948"/>`;
const tree = (x, y, s = 1, c1 = '#4E8A2E', c2 = '#6BAA3C') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="4" rx="46" ry="8" fill="#000" opacity=".12"/><path d="M-8 0C-6 -30 -6 -60 -4 -80H4C6 -60 6 -30 8 0Z" fill="#7A5232"/><circle cx="0" cy="-100" r="44" fill="${c1}"/><circle cx="-30" cy="-80" r="30" fill="${c1}"/><circle cx="30" cy="-82" r="32" fill="${c1}"/><circle cx="-10" cy="-114" r="28" fill="${c2}"/><circle cx="18" cy="-100" r="22" fill="${c2}" opacity=".8"/></g>`;
const bunting = (x1, y1, x2, y2, cols) => { let s = `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${y1 + 30} ${x2} ${y2}" stroke="#7A5232" stroke-width="2" fill="none"/>`; const n = 12; for (let i = 1; i < n; i++) { const t = i / n, x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * (x1 + x2) / 2 + t * t * x2, y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (y1 + 30) + t * t * y2; s += `<path d="M${x - 9} ${y}L${x + 9} ${y}L${x} ${y + 20}Z" fill="${cols[i % cols.length]}"/>`; } return s; };
const windowG = (x, y, w, hh, id, frame = '#FFFDF7') => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6" fill="url(#${id}win)"/><path d="M${x + w / 2} ${y}V${y + hh}M${x} ${y + hh / 2}H${x + w}" stroke="${frame}" stroke-width="6"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6" fill="none" stroke="${frame}" stroke-width="9"/><rect x="${x - 10}" y="${y + hh}" width="${w + 20}" height="10" rx="3" fill="${frame}"/>`;
const winGrad = id => `<linearGradient id="${id}win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFE6F7"/><stop offset=".6" stop-color="#E3F4FB"/><stop offset="1" stop-color="#A6D8EE"/></linearGradient>`;
const floorBoards = (y, c1, c2) => { let s = `<rect y="${y}" width="960" height="${400 - y}" fill="${c1}"/>`; for (let x = -400; x < 1400; x += 80) s += `<path d="M480 ${y}L${x} 400" stroke="${c2}" stroke-width="2" opacity=".55"/>`; s += `<path d="M0 ${y + 30}H960M0 ${y + 70}H960" stroke="${c2}" stroke-width="1.5" opacity=".35"/>`; return s; };

const PLACES = {
  farm: id => `<defs>${sky(id, '#93D0EE', '#E6F5EA')}<linearGradient id="${id}fld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9CF6A"/><stop offset="1" stop-color="#7BAA45"/></linearGradient></defs>
    <rect width="960" height="400" fill="url(#${id}sky)"/>${sunG(820, 70)}${cloud(180, 60)}${cloud(560, 40, .8)}
    <path d="M0 210C120 170 260 190 380 175S640 160 760 185S900 170 960 180V260H0Z" fill="#B7D88F"/>
    <path d="M0 230C160 205 300 222 480 210S800 200 960 215V280H0Z" fill="#9CC86A"/>
    <rect y="250" width="960" height="150" fill="url(#${id}fld)"/>
    <g opacity=".7">${Array.from({ length: 14 }, (_, i) => `<path d="M${560 + i * 28} 252L${380 + i * 52} 400" stroke="#5E8C33" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16"/>`).join('')}</g>
    <g transform="translate(70 120)"><path d="M0 70L80 10L160 70V160H0Z" fill="#B8432A"/><path d="M-10 74L80 2L170 74" stroke="#F4EADB" stroke-width="10" fill="none" stroke-linejoin="round"/><rect x="50" y="90" width="60" height="70" fill="#8C2E1A"/><path d="M50 90L110 160M110 90L50 160" stroke="#F4EADB" stroke-width="6"/><rect x="50" y="90" width="60" height="70" fill="none" stroke="#F4EADB" stroke-width="6"/><circle cx="80" cy="50" r="12" fill="#F4EADB"/><rect x="0" y="156" width="160" height="6" fill="#000" opacity=".12"/></g>
    <g stroke="#9C6B3D" stroke-width="7" stroke-linecap="round"><path d="M260 268H520M260 292H520"/>${[262, 326, 390, 454, 518].map(x => `<path d="M${x} 250V306"/>`).join('')}</g>
    <g transform="translate(880 300)"><ellipse cx="0" cy="34" rx="62" ry="10" fill="#000" opacity=".15"/><path d="M-56 30C-60 -10 -30 -40 0 -40S60 -10 56 30Z" fill="#E3BE5C"/><path d="M-40 0H40M-50 18H50M-30 -20H30" stroke="#C49A3A" stroke-width="3"/></g>
    ${tree(640, 250, .9)}`,
  market: id => `<defs>${sky(id, '#FFD39A', '#FFF0DA')}</defs>
    <rect width="960" height="400" fill="url(#${id}sky)"/>
    <path d="M0 230V150h60v-30h50v40h70v-60h50v70h80v-40h60v50h90v-70h50v60h80v-30h60v40h90v-50h60v60h60v70Z" fill="#EBC79A" opacity=".75"/>
    ${bunting(0, 70, 480, 90, ['#C2502A', '#F0B44C', '#1F6F66', '#8C3557'])}${bunting(480, 90, 960, 64, ['#4C7424', '#F0B44C', '#C2502A', '#1F6F66'])}
    ${[[30, '#C2502A', '#FFF1DA'], [350, '#1F6F66', '#E9F5F2'], [670, '#D98A1C', '#FFF4DE']].map(([x, a, b]) => `<g transform="translate(${x} 130)">
      <rect x="6" y="20" width="8" height="150" fill="#7E4E28"/><rect x="246" y="20" width="8" height="150" fill="#7E4E28"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 29}" y="14" width="29" height="34" fill="${i % 2 ? b : a}"/><path d="M${i * 29} 48a14.5 14.5 0 0 0 29 0Z" fill="${i % 2 ? b : a}"/>`).join('')}<rect x="-4" y="6" width="268" height="10" rx="4" fill="#7E4E28"/>
      <rect x="0" y="120" width="260" height="56" fill="#A86E3A"/><rect x="-6" y="112" width="272" height="10" rx="3" fill="#C99059"/>
      ${[[40, '#E2412B'], [100, '#F28C28'], [160, '#7BB342'], [220, '#F2C230']].map(([cx, c]) => `<ellipse cx="${cx}" cy="112" rx="28" ry="8" fill="#7A4A22"/>${[-14, 0, 14, -7, 7, 0].map((dx, k) => `<circle cx="${cx + dx}" cy="${104 - (k > 2 ? 10 : 0) - (k > 4 ? 9 : 0)}" r="8" fill="${c}"/>`).join('')}`).join('')}</g>`).join('')}
    <rect y="306" width="960" height="94" fill="#D9BC8E"/><path d="M0 306H960" stroke="#C4A272" stroke-width="3"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90} 306L${i * 90 - 40} 400" stroke="#C9AA7C" stroke-width="2"/>`).join('')}`,
  school: id => `<defs>${winGrad(id)}<linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E9CF"/><stop offset="1" stop-color="#EEDBB6"/></linearGradient></defs>
    <rect width="960" height="400" fill="url(#${id}wall)"/><rect y="250" width="960" height="18" fill="#C9A06A"/>
    ${windowG(40, 80, 150, 130, id)}${windowG(770, 80, 150, 130, id)}
    <rect x="260" y="64" width="440" height="190" rx="8" fill="#8A5A2E"/><rect x="272" y="76" width="416" height="166" rx="4" fill="#2F5444"/>
    <g stroke="#F4F1E6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"><path d="M300 120l14-30 14 30M305 110h18M350 90v30h12a8 8 0 0 0 0-16h-12 10a7 7 0 0 0 0-14h-10M410 95a14 14 0 1 0 0 22"/><path d="M560 170c0-30 0-40 0-60M560 130c-14-6-22-18-22-28 12 2 20 12 22 28M560 120c12-8 22-18 22-28-12 2-20 12-22 28" stroke="#BFE3A6"/><path d="M300 200h120M300 220h80" opacity=".6"/><circle cx="640" cy="104" r="16"/><path d="M640 80v-8M640 128v8M616 104h-8M664 104h8"/></g>
    <rect x="300" y="244" width="140" height="8" rx="3" fill="#C9B79A"/><rect x="330" y="240" width="20" height="5" rx="2" fill="#fff"/>
    <circle cx="730" cy="40" r="22" fill="#fff" stroke="#8A5A2E" stroke-width="4"/><path d="M730 40V26M730 40l10 6" stroke="#2B1A10" stroke-width="3" stroke-linecap="round"/>
    ${floorBoards(268, '#C89463', '#A5713F')}
    <g transform="translate(600 286)"><rect x="0" y="0" width="200" height="14" rx="3" fill="#A86E3A"/><rect x="10" y="14" width="180" height="60" fill="#8E5A2C"/><rect x="20" y="24" width="70" height="40" rx="3" fill="#A86E3A"/><rect x="110" y="24" width="70" height="40" rx="3" fill="#A86E3A"/><rect x="30" y="-16" width="40" height="16" rx="2" fill="#C2502A"/><rect x="36" y="-26" width="32" height="10" rx="2" fill="#1F6F66"/><path d="M150 0c0-20 0-24 6-30M156 -30c8-2 12-8 10-14-8 2-12 8-10 14" stroke="#4C7424" stroke-width="3" fill="#7BB342"/><rect x="142" y="-6" width="18" height="10" rx="2" fill="#C2502A"/></g>`,
  museum: id => `<defs><linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DFD0"/><stop offset="1" stop-color="#D9CBB5"/></linearGradient><radialGradient id="${id}spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".7"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient></defs>
    <rect width="960" height="400" fill="url(#${id}wall)"/><rect y="0" width="960" height="26" fill="#C8B79C"/><rect y="236" width="960" height="12" fill="#B9A586"/>
    ${[40, 880].map(x => `<g transform="translate(${x} 26)"><rect x="0" y="0" width="44" height="220" fill="#F1E9DC"/><rect x="0" y="0" width="44" height="220" fill="none" stroke="#CDBFA8" stroke-width="2"/>${[10, 22, 34].map(dx => `<path d="M${dx} 14V206" stroke="#D8CCB8" stroke-width="3"/>`).join('')}<rect x="-8" y="0" width="60" height="16" fill="#E0D4C2"/><rect x="-8" y="204" width="60" height="16" fill="#E0D4C2"/></g>`).join('')}
    ${[[150, 70, 150, 110, '#7FB3C8', '#5E8C33'], [400, 56, 170, 130, '#E7B26B', '#9C5A2A'], [660, 76, 140, 100, '#8C3557', '#F0B44C']].map(([x, y, w, hh, a, b], i) => `<path d="M${x + w / 2 - 50} 0L${x - 10} 400H${x + w + 10}L${x + w / 2 + 50} 0Z" fill="url(#${id}spot)" opacity=".5"/>
      <rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${hh + 20}" rx="4" fill="#B88A3E"/><rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${hh + 8}" fill="#E8C877"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${a}"/>
      ${i === 0 ? `<path d="M${x} ${y + hh}L${x + 50} ${y + 50}L${x + 80} ${y + 80}L${x + 110} ${y + 40}L${x + w} ${y + hh}Z" fill="${b}"/><circle cx="${x + 120}" cy="${y + 26}" r="12" fill="#F7E08A"/>` : i === 1 ? `<ellipse cx="${x + w / 2}" cy="${y + hh - 20}" rx="50" ry="14" fill="${b}" opacity=".6"/><path d="M${x + w / 2 - 34} ${y + hh - 24}C${x + w / 2 - 50} ${y + 50} ${x + w / 2 - 20} ${y + 30} ${x + w / 2} ${y + 30}S${x + w / 2 + 50} ${y + 50} ${x + w / 2 + 34} ${y + hh - 24}Z" fill="${b}"/><path d="M${x + w / 2 - 40} ${y + 70}H${x + w / 2 + 40}" stroke="#F0D59B" stroke-width="5"/>` : `<circle cx="${x + w / 2}" cy="${y + hh / 2}" r="30" fill="${b}"/><circle cx="${x + w / 2}" cy="${y + hh / 2}" r="14" fill="${a}"/>`}`).join('')}
    <rect y="248" width="960" height="152" fill="#B79E7D"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M480 248L${i * 160 - 480} 400" stroke="#A58B69" stroke-width="2"/>`).join('')}<path d="M0 290H960M0 344H960" stroke="#A58B69" stroke-width="2"/>
    <g transform="translate(420 220)"><rect x="0" y="0" width="120" height="78" fill="#7A5232"/><rect x="6" y="-70" width="108" height="70" fill="#DDEFF5" opacity=".55" stroke="#C9DCE2" stroke-width="3"/><path d="M40 -8C30 -20 32 -44 50 -50H70C88 -44 90 -20 80 -8Z" fill="#B8662E"/><path d="M46 -50h28v-8H46Z" fill="#9A5222"/><path d="M36 -28H84" stroke="#F0B44C" stroke-width="3"/><path d="M14 -64l20 50" stroke="#fff" stroke-width="4" opacity=".6"/></g>
    <g stroke="#B5172E" stroke-width="5" fill="none"><path d="M120 330Q250 360 380 330M580 330Q710 360 840 330"/></g>${[120, 380, 580, 840].map(x => `<g transform="translate(${x} 330)"><rect x="-4" y="-50" width="8" height="66" fill="#C9A34A"/><circle cx="0" cy="-52" r="8" fill="#E2C46A"/><ellipse cx="0" cy="16" rx="16" ry="5" fill="#C9A34A"/></g>`).join('')}`,
  clinic: id => `<defs>${winGrad(id)}<linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F3EE"/><stop offset="1" stop-color="#D5EAE2"/></linearGradient></defs>
    <rect width="960" height="400" fill="url(#${id}wall)"/><rect y="230" width="960" height="40" fill="#C3E0D6"/>
    ${windowG(60, 70, 160, 140, id)}<g stroke="#DDE9E6" stroke-width="5">${[90, 110, 130, 150, 170, 190].map(y => `<path d="M64 ${y}H216"/>`).join('')}</g>
    <g transform="translate(300 60)"><rect width="90" height="130" rx="4" fill="#fff" stroke="#BFD4CE" stroke-width="3"/>${[['E', 34, 22], ['F P', 22, 50], ['T O Z', 16, 74], ['L P E D', 12, 96], ['P E C F D', 9, 114]].map(([t, fs, y]) => `<text x="45" y="${y}" text-anchor="middle" font-size="${fs}" font-weight="800" font-family="sans-serif" fill="#2B1A10">${t}</text>`).join('')}</g>
    <g transform="translate(430 50)"><rect width="130" height="170" rx="6" fill="#fff" stroke="#BFD4CE" stroke-width="3"/><path d="M65 0V170" stroke="#BFD4CE" stroke-width="3"/><rect x="40" y="20" width="50" height="50" rx="8" fill="#E2412B"/><path d="M65 30V60M50 45H80" stroke="#fff" stroke-width="10"/><circle cx="56" cy="110" r="4" fill="#9AB3AC"/><circle cx="74" cy="110" r="4" fill="#9AB3AC"/></g>
    <rect y="270" width="960" height="130" fill="#D7E2DF"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90} 270L${i * 90 - 60} 400" stroke="#C3D2CE" stroke-width="2"/>`).join('')}<path d="M0 320H960" stroke="#C3D2CE" stroke-width="2"/>
    <g transform="translate(620 210)"><rect x="0" y="40" width="300" height="24" rx="8" fill="#F4F7F6"/><rect x="0" y="34" width="300" height="12" rx="6" fill="#9FD3C7"/><rect x="230" y="16" width="70" height="24" rx="12" fill="#fff"/><rect x="14" y="64" width="10" height="70" fill="#8FA7AD"/><rect x="276" y="64" width="10" height="70" fill="#8FA7AD"/><path d="M30 46C80 66 200 66 260 46" stroke="#7CC2B3" stroke-width="3" fill="none"/></g>
    <g transform="translate(250 260)"><rect x="-22" y="0" width="44" height="40" rx="6" fill="#C2502A"/><path d="M-26 0C-30 -40 -10 -60 0 -70C10 -60 30 -40 26 0" fill="#5E9A34"/><path d="M0 -70V0" stroke="#3F7A22" stroke-width="3"/></g>`,
  home: id => `<defs>${winGrad(id)}<linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8E2C2"/><stop offset="1" stop-color="#F0CFA3"/></linearGradient></defs>
    <rect width="960" height="400" fill="url(#${id}wall)"/><rect y="236" width="960" height="14" fill="#C2502A" opacity=".8"/>
    ${windowG(90, 70, 170, 140, id, '#FFF7EA')}<path d="M70 56C110 60 120 140 106 220H70Z" fill="#8C3557"/><path d="M280 56C240 60 230 140 244 220H280Z" fill="#8C3557"/><rect x="62" y="48" width="226" height="10" rx="4" fill="#7A4A22"/>
    <g transform="translate(360 60)"><rect width="90" height="70" rx="4" fill="#B88A3E"/><rect x="8" y="8" width="74" height="54" fill="#F4EADB"/><circle cx="34" cy="30" r="9" fill="#C68A5A"/><circle cx="56" cy="30" r="9" fill="#A86E3A"/><path d="M20 62c2-14 26-14 28 0M42 62c2-14 26-14 28 0" fill="#1F6F66"/></g>
    <g transform="translate(500 110)"><rect x="0" y="0" width="200" height="10" rx="3" fill="#7A4A22"/><path d="M20 0c-6-14 0-26 12-26s18 12 12 26Z" fill="#B8662E"/><path d="M70 0V-34H110V0Z" fill="#1F6F66"/><path d="M76 -34V-40H104V-34" fill="#2A8378"/><path d="M150 0c-10 0-14-6-12-10h24c2 4-2 10-12 10Z" fill="#C2502A"/><path d="M150 -10c-4-6 0-14 0-16 0 2 4 10 0 16Z" fill="#F0B44C"/></g>
    <g transform="translate(760 70)"><rect width="130" height="180" rx="4" fill="#9C6234"/><rect x="10" y="10" width="50" height="160" rx="3" fill="#B57A43"/><rect x="70" y="10" width="50" height="160" rx="3" fill="#B57A43"/><circle cx="56" cy="96" r="4" fill="#F0B44C"/><circle cx="74" cy="96" r="4" fill="#F0B44C"/><path d="M-6 0H136" stroke="#7A4A22" stroke-width="8"/><g fill="#F28C28">${[10, 30, 50, 70, 90, 110].map(x => `<circle cx="${x + 10}" cy="6" r="5"/>`).join('')}</g></g>
    <rect y="250" width="960" height="150" fill="#D8955F"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 100} 250L${i * 100 - 50} 400" stroke="#C58049" stroke-width="2"/>`).join('')}<path d="M0 300H960M0 356H960" stroke="#C58049" stroke-width="2"/>
    <g transform="translate(480 344)"><ellipse rx="110" ry="26" fill="#fff" opacity=".9"/><ellipse rx="86" ry="19" fill="#E2412B"/><ellipse rx="62" ry="13" fill="#F2C230"/><ellipse rx="38" ry="8" fill="#1F6F66"/><ellipse rx="14" ry="3" fill="#fff"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<circle cx="${Math.cos(a) * 98}" cy="${Math.sin(a) * 23}" r="5" fill="#8C3557"/>`; }).join('')}</g>
    <g transform="translate(150 270)"><rect x="0" y="0" width="190" height="16" rx="5" fill="#8A5A2E"/><path d="M8 4h174" stroke="#E8D3AE" stroke-width="10" stroke-dasharray="6 3"/><rect x="6" y="14" width="10" height="42" fill="#7A4A22"/><rect x="174" y="14" width="10" height="42" fill="#7A4A22"/></g>`,
  shop: id => `<defs><linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E5C7"/><stop offset="1" stop-color="#EBD1A6"/></linearGradient></defs>
    <rect width="960" height="400" fill="url(#${id}wall)"/>
    <rect x="300" y="8" width="360" height="40" rx="8" fill="#1F6F66"/><rect x="306" y="14" width="348" height="28" rx="5" fill="none" stroke="#F0B44C" stroke-width="2" stroke-dasharray="6 4"/>
    ${[60, 140, 220].map(y => `<rect x="20" y="${y}" width="920" height="10" fill="#9C6234"/><rect x="20" y="${y + 10}" width="920" height="6" fill="#000" opacity=".08"/>`).join('')}
    ${[60, 140, 220].map((y, r) => Array.from({ length: 22 }, (_, i) => { const x = 34 + i * 41, cols = ['#E2412B', '#F2C230', '#1F6F66', '#8C3557', '#4C7424', '#F28C28', '#3D8FD1']; const c = cols[(i * 3 + r * 2) % cols.length]; return (i + r) % 3 === 0 ? `<rect x="${x}" y="${y - 44}" width="30" height="44" rx="6" fill="${c}" opacity=".85"/><rect x="${x + 4}" y="${y - 52}" width="22" height="10" rx="2" fill="#D4C3A3"/><rect x="${x + 6}" y="${y - 30}" width="18" height="14" rx="2" fill="#fff" opacity=".7"/>` : (i + r) % 3 === 1 ? `<path d="M${x} ${y}V${y - 38}l4 -6h22l4 6V${y}Z" fill="${c}"/><rect x="${x + 4}" y="${y - 28}" width="22" height="12" rx="2" fill="#fff" opacity=".6"/>` : `<rect x="${x}" y="${y - 30}" width="32" height="30" rx="3" fill="#C9965A"/><path d="M${x} ${y - 20}H${x + 32}" stroke="#A8743F" stroke-width="2"/><rect x="${x + 8}" y="${y - 16}" width="16" height="9" rx="1" fill="${c}"/>`; }).join('')).join('')}
    <rect y="268" width="960" height="132" fill="#CDB08A"/><path d="M0 268H960" stroke="#B49570" stroke-width="3"/>
    <g transform="translate(560 246)"><rect x="0" y="0" width="400" height="20" rx="4" fill="#B57A43"/><rect x="0" y="20" width="400" height="120" fill="#8E5A2C"/><path d="M100 20V140M200 20V140M300 20V140" stroke="#6F4421" stroke-width="3"/><g transform="translate(300 0)"><rect x="-40" y="-8" width="80" height="10" rx="3" fill="#7D8C94"/><rect x="-6" y="-40" width="12" height="34" fill="#9AA8AF"/><ellipse cx="0" cy="-44" rx="44" ry="8" fill="#C9D3D8"/><rect x="-20" y="-28" width="40" height="18" rx="4" fill="#2B2B2B"/><text x="0" y="-15" text-anchor="middle" font-size="12" font-family="monospace" fill="#7CF29A">1.00</text></g><circle cx="60" cy="-14" r="14" fill="#E2412B"/><circle cx="84" cy="-12" r="12" fill="#F28C28"/><circle cx="72" cy="-30" r="12" fill="#E2412B"/></g>`,
  stage: id => `<defs><radialGradient id="${id}spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".55"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient><linearGradient id="${id}cur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E1F2E"/><stop offset=".5" stop-color="#C33A47"/><stop offset="1" stop-color="#8E1F2E"/></linearGradient></defs>
    <rect width="960" height="400" fill="#2A1A2E"/><rect x="140" width="680" height="300" fill="#3A2440"/>
    <path d="M330 0L180 330H520L430 0Z" fill="url(#${id}spot)"/><path d="M640 0L460 330H820L700 0Z" fill="url(#${id}spot)" opacity=".8"/>
    ${[0, 1].map(s => `<g transform="${s ? 'translate(960 0) scale(-1 1)' : ''}">${Array.from({ length: 5 }, (_, i) => `<path d="M${i * 34} 0C${i * 34 + 10} 120 ${i * 34 - 6} 220 ${i * 34 + 6} 330H${i * 34 + 40}C${i * 34 + 28} 220 ${i * 34 + 44} 120 ${i * 34 + 34} 0Z" fill="url(#${id}cur)"/>`).join('')}<path d="M0 330H180V340H0Z" fill="#6E1622"/></g>`).join('')}
    <path d="M0 0H960V56C900 74 840 60 800 74S700 60 660 74S560 60 520 74S440 60 400 74S300 60 260 74S160 60 120 74S40 60 0 74Z" fill="#B02C3A"/><path d="M0 8H960" stroke="#F0B44C" stroke-width="6"/>${Array.from({ length: 24 }, (_, i) => `<circle cx="${20 + i * 40}" cy="70" r="5" fill="#F0B44C"/>`).join('')}
    <rect y="300" width="960" height="100" fill="#8B5A2B"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 80} 300V400" stroke="#6F4421" stroke-width="2"/>`).join('')}<rect y="300" width="960" height="8" fill="#A9733C"/>
    <rect y="384" width="960" height="16" fill="#3A2416"/>${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${48 + i * 96}" cy="384" rx="16" ry="6" fill="#FFE9A8" opacity=".85"/>`).join('')}`,
  village: id => `<defs>${sky(id, '#9AD3EE', '#F3F0DA')}</defs>
    <rect width="960" height="400" fill="url(#${id}sky)"/>${sunG(160, 70)}${cloud(470, 50, .9)}${cloud(800, 70, .7)}
    <path d="M0 200C150 140 300 180 420 160S700 120 960 170V260H0Z" fill="#A9CB82"/>
    <rect y="240" width="960" height="160" fill="#C9B07A"/><path d="M380 400C420 330 460 290 480 240H540C560 290 640 330 700 400Z" fill="#DCC48E"/>
    ${[[40, 150, '#C2502A'], [230, 170, '#B8662E'], [700, 160, '#A84A2A']].map(([x, y, roof]) => `<g transform="translate(${x} ${y})"><ellipse cx="80" cy="94" rx="96" ry="10" fill="#000" opacity=".12"/><rect x="0" y="30" width="160" height="62" fill="#F1DDB7"/><rect x="0" y="80" width="160" height="12" fill="#8C5A2E" opacity=".35"/><path d="M-14 34L80 -14L174 34Z" fill="${roof}"/><path d="M-14 34L80 -14L174 34" stroke="#7A3A1A" stroke-width="4" fill="none"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${k * 28 - 4} 34L80 -10" stroke="#7A3A1A" stroke-width="1.5" opacity=".4"/>`).join('')}<rect x="64" y="48" width="32" height="44" rx="2" fill="#7A4A22"/><rect x="18" y="46" width="28" height="24" fill="#5A8FB0"/><path d="M32 46v24M18 58h28" stroke="#F1DDB7" stroke-width="3"/><path d="M110 92c10-8 26-8 36 0" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></g>`).join('')}
    <g transform="translate(520 250)"><rect x="-100" y="0" width="200" height="30" rx="6" fill="#C9B79A"/><rect x="-100" y="0" width="200" height="8" rx="4" fill="#DCCFB6"/>${tree(0, 6, 1.5, '#3F7A28', '#5E9A34')}</g>
    <g transform="translate(860 300)"><ellipse cx="0" cy="40" rx="60" ry="10" fill="#000" opacity=".12"/><rect x="-50" y="0" width="100" height="40" fill="#B9A58A"/><ellipse cx="0" cy="0" rx="50" ry="12" fill="#8C7A64"/><ellipse cx="0" cy="0" rx="40" ry="8" fill="#3A5A6E"/><path d="M-50 12H50M-50 26H50" stroke="#9C8C74" stroke-width="2"/><path d="M-40 0V-60M40 0V-60M-46 -60H46" stroke="#7A4A22" stroke-width="6" stroke-linecap="round"/><path d="M0 -60V-20" stroke="#5E4634" stroke-width="2"/><rect x="-8" y="-24" width="16" height="14" rx="2" fill="#8C7A64"/></g>`,
};

/* ------------------------------------------------------------------ mount */
let UID = 0;
export function mount(stage, cfg, api) {
  const g = api.gsap, uid = `chc${++UID}`;
  const nodes = cfg.nodes || {};
  const cast = (cfg.cast || []).filter(Boolean);
  const byId = Object.fromEntries(cast.map((c, i) => [c.id, { ...c, color: NAME_COLORS[i % NAME_COLORS.length] }]));
  const meId = byId.me ? 'me' : (cast.find(c => /^(you|me|तुम|मैं|आप)$/i.test(c.name || ''))?.id ?? null);
  const npcs = cast.filter(c => c.id !== meId);
  const lead = npcs[0];
  const timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, api.reduced ? Math.min(ms, 120) : ms); timers.push(t); return t; };
  let place = PLACES[cfg.place] ? cfg.place : 'village';
  let cur = null, curId = null, typing = null, waitTap = null, busy = false, impression = .35, finished = false;

  /* distances for progress */
  const edges = id => { const n = nodes[id] || {}; return [...(n.choices || []).map(c => c.to), n.next].filter(t => t && nodes[t]); };
  const dist = {};
  (() => { // reverse BFS from end nodes
    const ends = Object.keys(nodes).filter(k => nodes[k].end), q = [...ends];
    ends.forEach(e => { dist[e] = 0; });
    while (q.length) { const t = q.shift(); for (const k of Object.keys(nodes)) if (!(k in dist) && edges(k).includes(t)) { dist[k] = dist[t] + 1; q.push(k); } }
  })();
  const startId = nodes[cfg.start] ? cfg.start : Object.keys(nodes)[0];
  const d0 = Math.max(1, dist[startId] ?? 1);
  const goodSteps = Math.max(1, Object.values(nodes).filter(n => (n.choices || []).some(c => c.good !== false)).length);

  /* layout of actors */
  const pos = {};
  const others = npcs.slice(0, 3);
  if (meId) pos[meId] = 18;
  others.forEach((c, i) => { pos[c.id] = meId ? (others.length === 1 ? 72 : 52 + i * (36 / Math.max(1, others.length - 1))) : (others.length === 1 ? 50 : 26 + i * (48 / Math.max(1, others.length - 1))); });

  const root = h(`<div class="lab-choice pl-${place}">
    <div class="chc-scene">
      <svg class="chc-bg" viewBox="0 0 960 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${PLACES[place](uid)}</svg>
      <div class="chc-cast">${Object.keys(pos).map(id => `<div class="chc-actor ${id === meId ? 'is-me' : ''}" data-id="${esc(id)}" style="left:${pos[id]}%">
        <i class="chc-shadow"></i><div class="chc-breathe"><div class="chc-bob">${actorArt(api, byId[id])}</div></div><span class="chc-emote" aria-hidden="true"></span>
        <span class="chc-tag">${esc(byId[id].name || id)}</span></div>`).join('')}</div>
      ${cfg.meter !== false && lead ? `<div class="chc-meter" role="meter" aria-label="${t('{name}\'s impression of you', { name: esc(lead.name) })}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35">
        <span class="chc-heart" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 4.5 6.8 4.5c2.2 0 3.6 1.3 5.2 3.1 1.6-1.8 3-3.1 5.2-3.1 3.8 0 5.9 4 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg></span>
        <span class="chc-mtxt"><small>${esc(lead.name)}</small><span class="chc-track"><i></i></span></span></div>` : ''}
    </div>
    <div class="chc-dialog" role="group" aria-label="${t('Conversation')}">
      <span class="chc-tail" aria-hidden="true"></span>
      <span class="chc-name"></span>
      <p class="chc-text" aria-live="polite"></p>
      <button type="button" class="chc-more" hidden><span>${t('Tap to continue')}</span> <b aria-hidden="true">▶</b></button>
    </div>
    <div class="chc-choices" role="group" aria-label="${t('Your choices')}"></div>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const dlg = $('.chc-dialog'), txt = $('.chc-text'), nameEl = $('.chc-name'), more = $('.chc-more'), choicesEl = $('.chc-choices'), tail = $('.chc-tail');
  const actors = Object.fromEntries([...root.querySelectorAll('.chc-actor')].map(a => [a.dataset.id, a]));

  /* idle life */
  if (!api.reduced) {
    Object.values(actors).forEach((a, i) => {
      g.to(a.querySelector('.chc-breathe'), { scaleY: 1.022, scaleX: .992, transformOrigin: '50% 100%', duration: 1.6 + i * .27, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    const clouds = root.querySelectorAll('.chc-cloud');
    if (clouds.length) g.to(clouds, { x: '+=40', duration: 14, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 3 });
    g.from(Object.values(actors), { y: 40, opacity: 0, duration: .7, ease: 'back.out(1.6)', stagger: .15, delay: .2 });
  }
  setMeter(impression, false);

  /* ---------- speaking ---------- */
  let bobTl = null;
  function setSpeaker(who) {
    const a = who && actors[who], info = byId[who] || (who === '_you' ? { name: t('You'), color: 'var(--lf)' } : null);
    root.classList.toggle('narrate', !info);
    Object.entries(actors).forEach(([id, el]) => { el.classList.toggle('speaking', id === who); el.classList.toggle('quiet', !!a && id !== who); });
    if (info) { nameEl.textContent = info.name || who; nameEl.style.setProperty('--nc', info.color); nameEl.hidden = false; }
    else nameEl.hidden = true;
    const x = a ? pos[who] : 50;
    dlg.style.setProperty('--tx', `${x}%`);
    tail.hidden = !a;
    dlg.classList.toggle('from-right', a ? pos[who] > 50 : false);
  }
  function speak(who, text, { fast = false } = {}) {
    return new Promise(res => {
      stopTyping();
      setSpeaker(who);
      const full = String(text || '');
      more.hidden = true;
      const a = actors[who];
      if (a && !api.reduced) { bobTl = g.to(a.querySelector('.chc-bob'), { y: -7, duration: .13, yoyo: true, repeat: -1, ease: 'sine.inOut' }); }
      if (!api.reduced) g.fromTo(dlg, { scale: .97 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
      if (api.reduced) { txt.textContent = full; endSpeak(); res(); return; }
      let i = 0;
      txt.textContent = '';
      txt.setAttribute('aria-busy', 'true');
      const step = fast ? 3 : 1;
      typing = { full, res, iv: setInterval(() => {
        i = Math.min(full.length, i + step);
        txt.textContent = full.slice(0, i);
        if (i % 5 === 0) api.sound('tick');
        if (i >= full.length) { const r = typing.res; stopTyping(); endSpeak(); r(); }
      }, fast ? 16 : 26) };
    });
  }
  function skip() { if (!typing) return false; const { full, res } = typing; stopTyping(); txt.textContent = full; endSpeak(); res(); return true; }
  function stopTyping() { if (typing) { clearInterval(typing.iv); typing = null; } }
  function endSpeak() {
    txt.removeAttribute('aria-busy');
    if (bobTl) { bobTl.kill(); bobTl = null; }
    root.querySelectorAll('.chc-bob').forEach(b => g.to(b, { y: 0, duration: .15 }));
  }
  const tapToContinue = () => new Promise(res => {
    more.hidden = false;
    if (!api.reduced) g.fromTo(more, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: .3 });
    waitTap = () => { waitTap = null; more.hidden = true; api.sound('click'); res(); };
    more.focus({ preventScroll: true });
  });
  more.addEventListener('click', e => { e.stopPropagation(); waitTap?.(); });
  dlg.addEventListener('click', () => { if (!skip()) waitTap?.(); });
  $('.chc-scene').addEventListener('click', () => { if (!skip()) waitTap?.(); });

  function emote(who, kind) {
    const a = actors[who]; if (!a) return;
    const e = a.querySelector('.chc-emote');
    e.textContent = MOOD[kind] || kind;
    if (api.reduced) { e.style.opacity = 1; later(() => { e.style.opacity = 0; }, 1400); return; }
    g.timeline().fromTo(e, { y: 10, scale: .2, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .45, ease: 'back.out(3)' }).to(e, { y: -14, opacity: 0, duration: .5, delay: 1.1 });
  }

  /* ---------- impression meter ---------- */
  function setMeter(v, animate = true) {
    impression = Math.max(0, Math.min(1, v));
    const bar = root.querySelector('.chc-track i'); if (!bar) return;
    root.querySelector('.chc-meter').setAttribute('aria-valuenow', Math.round(impression * 100));
    if (animate && !api.reduced) g.to(bar, { scaleX: impression, duration: .7, ease: 'elastic.out(1, .6)' }); else g.set(bar, { scaleX: impression });
  }
  function sparkTrail(from) {
    const meter = root.querySelector('.chc-heart');
    if (!meter || api.reduced) return;
    const hb = root.getBoundingClientRect(), a = from.getBoundingClientRect(), b = meter.getBoundingClientRect();
    const sx = a.left + a.width / 2 - hb.left, sy = a.top + a.height / 2 - hb.top, ex = b.left + b.width / 2 - hb.left, ey = b.top + b.height / 2 - hb.top;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('i'); p.className = 'chc-spark'; p.textContent = i % 3 ? '✦' : '♥';
      p.style.left = `${sx}px`; p.style.top = `${sy}px`;
      root.append(p);
      const mx = (sx + ex) / 2 + (Math.random() - .5) * 260, my = (sy + ey) / 2 - Math.random() * 60;
      g.to(p, { duration: .9 + Math.random() * .3, delay: i * .04, ease: 'power1.inOut', motionPath: { path: [{ x: 0, y: 0 }, { x: mx - sx, y: my - sy }, { x: ex - sx, y: ey - sy }], curviness: 1.3 }, scale: .5, onComplete: () => p.remove() });
    }
    later(() => { g.fromTo(meter, { scale: 1.5 }, { scale: 1, duration: .6, ease: 'elastic.out(1.3,.4)' }); api.sound('pop'); }, 950);
  }

  /* ---------- story flow ---------- */
  function setPlace(p) {
    if (!PLACES[p] || p === place) return;
    const bg = $('.chc-bg');
    const swap = () => { bg.innerHTML = PLACES[p](uid); root.classList.remove(`pl-${place}`); place = p; root.classList.add(`pl-${p}`); };
    if (api.reduced) return swap();
    g.timeline().to(bg, { opacity: 0, duration: .3 }).add(swap).to(bg, { opacity: 1, duration: .4 });
  }
  async function go(id) {
    const node = nodes[id];
    if (!node) { console.warn(`choice: missing node "${id}"`); return finish(cur?.stars); }
    cur = node; curId = id;
    choicesEl.innerHTML = '';
    if (node.place) setPlace(node.place);
    const d = dist[id];
    if (d != null) api.progress(Math.min(.95, 1 - d / d0));
    if (node.mood && node.who) emote(node.who, node.mood);
    await speak(node.who, node.say || '');
    if (curId !== id) return;
    if (node.end) {
      await tapToContinue();
      return finish(node.stars);
    }
    if (node.choices?.length) return showChoices(node);
    if (node.next) { await tapToContinue(); if (curId === id) go(node.next); return; }
    await tapToContinue(); finish(node.stars);
  }
  function finish(stars) {
    if (finished) return; finished = true;
    api.progress(1);
    if (lead && !api.reduced) { Object.values(actors).forEach(a => g.fromTo(a.querySelector('.chc-bob'), { y: 0 }, { y: -16, duration: .22, yoyo: true, repeat: 3, ease: 'power2.out' })); }
    const opts = {}; if (Number.isFinite(stars)) opts.stars = Math.max(1, Math.min(3, stars));
    later(() => api.complete(opts), 400);
  }
  function showChoices(node, crossed = new Set()) {
    choicesEl.innerHTML = node.choices.map((c, i) => `<button type="button" class="chc-card ${crossed.has(i) ? 'crossed' : ''}" data-i="${i}" ${crossed.has(i) ? 'disabled aria-disabled="true"' : ''}>
      <b class="chc-key">${LETTERS[i] || i + 1}</b>${c.sprite || c.emoji ? `<span class="chc-card-art">${smallArt(api, c)}</span>` : ''}<span class="chc-card-t">${esc(c.text)}</span></button>`).join('');
    choicesEl.style.setProperty('--cols', node.choices.length === 4 ? 2 : Math.min(3, node.choices.length));
    const cards = [...choicesEl.querySelectorAll('.chc-card')];
    if (!api.reduced) g.fromTo(cards, { y: 24, scale: .94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .45, stagger: .08, ease: 'back.out(1.8)', clearProps: 'transform,opacity' });
    cards.forEach(b => b.addEventListener('click', () => choose(node, +b.dataset.i, b, crossed)));
    if (matchMedia('(max-width: 760px)').matches) choicesEl.scrollIntoView({ block: 'nearest', behavior: api.reduced ? 'auto' : 'smooth' });
    busy = false;
  }
  async function choose(node, i, card, crossed) {
    if (busy || card.disabled) return;
    busy = true;
    const c = node.choices[i], id = curId, good = c.good !== false;
    api.sound('click');
    choicesEl.querySelectorAll('.chc-card').forEach(b => { b.disabled = true; b.classList.toggle('picked', b === card); });
    if (!api.reduced) g.to(card, { y: -6, scale: 1.02, duration: .2, ease: 'power2.out' });
    if (good) {
      card.classList.add('good');
      sparkle(api, card); sparkTrail(card);
      setMeter(impression + (1 - .35) / goodSteps + .02);
      if (node.who) emote(node.who, 'love');
      api.say(c.feedback || t('Good choice!'), 'good');
      floatText(card, '+ ♥');
      await new Promise(r => later(r, 650));
      await speak(meId || '_you', c.text, { fast: true });
      await new Promise(r => later(r, 500));
      if (curId !== id) return;
      const to = c.to && nodes[c.to] ? c.to : node.next;
      if (to) go(to); else finish();
      return;
    }
    // a choice that is not good
    api.mistake();
    card.classList.add('bad');
    shake(api, card);
    setMeter(impression - .5 / goodSteps);
    if (node.who) { emote(node.who, 'question'); const a = actors[node.who]; if (a) shake(api, a.querySelector('.chc-bob')); }
    api.say(c.feedback || t('Hmm, that did not go so well. Try another way.'), 'bad');
    const retry = !c.to || c.to === id || !nodes[c.to];
    const fb = h(`<div class="chc-fb" role="status"><span class="chc-fb-ic" aria-hidden="true">🤔</span><div><b>${retry ? t('Let’s try that again') : t('Hmm…')}</b><p>${esc(c.feedback || t('Think about how that would make the other person feel.'))}</p></div>
      <button type="button" class="chc-fb-go">${retry ? t('↺ Choose again') : t('See what happens ▶')}</button></div>`);
    choicesEl.append(fb);
    if (!api.reduced) g.from(fb, { y: 16, opacity: 0, duration: .4, ease: 'back.out(2)' });
    fb.querySelector('.chc-fb-go').focus({ preventScroll: true });
    if (matchMedia('(max-width: 760px)').matches) fb.scrollIntoView({ block: 'nearest', behavior: api.reduced ? 'auto' : 'smooth' });
    fb.querySelector('.chc-fb-go').addEventListener('click', () => {
      api.sound('whoosh');
      if (retry) {
        crossed.add(i);
        if (crossed.size >= node.choices.length) crossed.clear();
        setSpeaker(node.who); txt.textContent = node.say || '';
        showChoices(node, crossed);
      } else go(c.to);
    }, { once: true });
  }
  function floatText(el, text) {
    if (api.reduced) return;
    const hb = root.getBoundingClientRect(), b = el.getBoundingClientRect();
    const t = document.createElement('i'); t.className = 'chc-float'; t.textContent = text;
    t.style.left = `${b.right - hb.left - 40}px`; t.style.top = `${b.top - hb.top}px`;
    root.append(t);
    g.fromTo(t, { y: 0, opacity: 0, scale: .6 }, { y: -50, opacity: 1, scale: 1.1, duration: .5, ease: 'back.out(2)', onComplete: () => g.to(t, { opacity: 0, y: -70, duration: .4, onComplete: () => t.remove() }) });
  }

  const onKey = e => {
    if (e.target.closest?.('input, textarea')) return;
    if (/^[1-6]$/.test(e.key) || /^[a-fA-F]$/.test(e.key)) {
      const n = /\d/.test(e.key) ? +e.key - 1 : 'abcdef'.indexOf(e.key.toLowerCase());
      const b = choicesEl.querySelectorAll('.chc-card')[n];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    } else if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button')) {
      if (skip() || waitTap) { e.preventDefault(); waitTap?.(); }
    }
  };
  api.root.addEventListener('keydown', onKey);

  later(() => go(startId), 650);

  return {
    destroy() {
      stopTyping();
      timers.forEach(clearTimeout);
      api.root.removeEventListener('keydown', onKey);
      g.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

/* ------------------------------------------------------------------ demo */
export const demo = {
  title: 'Interview a farmer',
  mission: 'Your class is visiting Ramesh ji’s farm. Ask good questions to learn how he grows his vegetables — be polite and curious!',
  fact: 'Good interviewers ask open questions (how, why, what) that cannot be answered with just “yes” or “no”.',
  place: 'farm',
  cast: [
    { id: 'farmer', name: 'Ramesh ji', sprite: 'farmer' },
    { id: 'me', name: 'You', sprite: 'girl' },
  ],
  start: 'hello',
  nodes: {
    hello: { who: 'farmer', mood: 'happy', say: 'Namaste, children! Welcome to my farm. What would you like to know?',
      choices: [
        { text: 'Namaste, Ramesh ji! Thank you for meeting us. Could we ask you a few questions about your work?', to: 'tools', good: true, feedback: 'A greeting and a thank-you start an interview well.' },
        { text: 'How much money do you earn?', to: 'hello', good: false, feedback: 'Money is a private question to begin with. Start by greeting him and asking about his work.' },
      ] },
    tools: { who: 'farmer', say: 'Of course! Ask me anything. I have been farming here for twenty-five years.',
      choices: [
        { text: 'Which tools do you use every day, and what is each one for?', to: 'tools2', good: true, feedback: 'An open question — he can explain a lot.' },
        { text: 'Do you use tools?', to: 'short', good: false, feedback: 'That can be answered with just “yes”. Ask “which” or “how” instead.' },
      ] },
    short: { who: 'farmer', mood: 'think', say: 'Yes.', next: 'tools' },
    tools2: { who: 'farmer', mood: 'idea', say: 'My khurpi for weeding, a spade for digging beds, and a sprayer for neem oil. The khurpi is my best friend!', next: 'water' },
    water: { who: 'me', say: 'Wow, a khurpi! I will note that down.', next: 'water2' },
    water2: { who: 'farmer', say: 'Good. What else would you like to ask?',
      choices: [
        { text: 'How do you decide when to water the plants?', to: 'water3', good: true, feedback: 'Great follow-up about his daily work.' },
        { text: 'My father says farming is old-fashioned. Is that true?', to: 'water2', good: false, feedback: 'That could hurt his feelings. Ask about his methods with respect.' },
        { text: 'Why do you put dry leaves around your plants?', to: 'mulch', good: true, feedback: 'You noticed something on the farm — sharp eyes!' },
      ] },
    water3: { who: 'farmer', say: 'I push my finger into the soil. If it is dry up to the first knuckle, I water — early in the morning, so less water is lost to the sun.', next: 'bye' },
    mulch: { who: 'farmer', mood: 'happy', say: 'That is mulch! It keeps the soil cool and wet, stops weeds, and slowly turns into food for the soil.', next: 'bye' },
    bye: { who: 'farmer', say: 'You ask very good questions. Any last thing?',
      choices: [
        { text: 'Thank you so much for your time, Ramesh ji. Can we take a photo of your khurpi for our project?', to: 'end', good: true, feedback: 'Thanking him and asking permission is perfect.' },
        { text: 'Okay, bye.', to: 'bye', good: false, feedback: 'A little too quick! Thank him for his time before you leave.' },
      ] },
    end: { end: true, who: 'farmer', mood: 'love', say: 'Of course! Come back when the tomatoes are ripe. Best of luck with your project!' },
  },
  win: 'You ran a polite, curious interview — just like a real reporter!',
};
