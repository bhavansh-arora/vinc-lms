// VINC Lab · explore — find things in a big, living, illustrated scene.
// Tools: a magnifier that really magnifies (a clipped, scaled copy of the scene follows the lens),
// a camera viewfinder (flash + a polaroid that drops into an album) or plain tapping.
// bicycle / workshop scenes are "identify the parts" diagrams with numbered markers and leader lines.
// Extra config (optional): hotspot.at: '<anchor name>' instead of x/y (see ANCHORS), hotspot.hint,
// cfg.identify: true|false (ask "find the …" one by one; default true for bicycle/workshop).
import { esc, sparkle, onResize } from '../kit.js';

export const meta = { title: 'Explore and find', needs: ['gsap'] };

const W = 1000, H = 625;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = n => Math.round(n * 10) / 10;
function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
let UID = 0;

/* Emoji used inside the SVG when a sprite is not drawn yet. */
const EMO = { ladybird: '🐞', butterfly: '🦋', bee: '🐝', ant: '🐜', snail: '🐌', spider: '🕷️', earthworm: '🪱', caterpillar: '🐛', frog: '🐸', fish: '🐟', sparrow: '🐦', myna: '🐦', pigeon: '🕊️', peacock: '🦚', squirrel: '🐿️', lizard: '🦎', cow: '🐄', calf: '🐄', goat: '🐐', hen: '🐔', chick: '🐤', buffalo: '🐃', sheep: '🐑', mushroom: '🍄', flower: '🌼', marigold: '🌼', hibiscus: '🌺', rose: '🌹', sunflower: '🌻', tree: '🌳', 'neem-tree': '🌳', leaf: '🍃', 'peepal-leaf': '🍃', 'neem-leaves': '🌿', grass: '🌱', seedling: '🌱', sapling: '🌱', tomato: '🍅', carrot: '🥕', chilli: '🌶️', mango: '🥭', banana: '🍌', apple: '🍎', lemon: '🍋', nest: '🪺', egg: '🥚', 'water-drop': '💧', tap: '🚰', 'leaking-tap': '🚰', bucket: '🪣', shower: '🚿', toilet: '🚽', soap: '🧼', toothbrush: '🪥', 'old-coin': '🪙', coin: '🪙', 'clay-pot': '🏺', 'old-photo': '🖼️', diya: '🪔', statue: '🗿', 'old-radio': '📻', textile: '🧵', camera: '📷', bicycle: '🚲', 'bicycle-bell': '🔔', tyre: '🛞', 'air-pump': '🎈', spanner: '🔧', screwdriver: '🪛', pliers: '🔧', hammer: '🔨', saw: '🪚', nail: '📌', 'oil-can': '🛢️', clock: '⏰', iron: '🧺', 'washing-machine': '🧺', smartphone: '📱', battery: '🔋', bulb: '💡', fan: '🌀', 'first-aid-kit': '🧰', knife: '🔪', 'chopping-board': '🔪', spoon: '🥄', plate: '🍽️', bowl: '🥣', glass: '🥛', dustbin: '🗑️', recycle: '♻️', 'watering-can': '🚿', 'spray-bottle': '🧴', thermometer: '🌡️', 'water-tank': '🛢️', pipe: '🔧', compost: '🟫', cocopeat: '🟫', 'seedling-tray': '🌱', 'label-tag': '🏷️', 'bamboo-pole': '🎋', 'shade-net': '🕸️', aphid: '🐛', 'pir-sensor': '📡', ldr: '🔆', 'price-tag': '🏷️', 'rupee-note': '💵', 'shopping-bag': '🛍️' };

/* Named places in each scene, in % of the scene, so lesson authors can write { at: 'chain' }. */
export const ANCHORS = {
  garden: { sky: [50, 10], fence: [30, 50], 'tree-top': [86, 28], branch: [78, 38], 'tree-trunk': [88, 64], flowers: [16, 58], bed: [30, 70], soil: [30, 74], leaves: [62, 70], 'under-rock': [66, 90], path: [50, 88], 'compost-bin': [6, 66], grass: [84, 88] },
  campus: { sky: [50, 8], flag: [88, 16], window: [44, 34], door: [52, 50], tree: [12, 34], bench: [30, 76], tap: [84, 66], dustbin: [72, 72], 'notice-board': [68, 50], ground: [50, 86], pots: [28, 56] },
  kitchen: { window: [16, 26], shelf: [50, 22], jars: [50, 18], stove: [36, 56], pot: [36, 50], sink: [72, 60], tap: [72, 48], counter: [56, 62], board: [56, 58], fridge: [92, 46], cabinet: [30, 80], floor: [60, 95], basket: [62, 55] },
  farm: { sky: [50, 10], hut: [14, 50], haystack: [30, 58], field: [52, 70], scarecrow: [56, 54], well: [74, 62], tree: [88, 34], channel: [50, 90], shed: [38, 48], ground: [20, 88] },
  street: { sky: [50, 8], wires: [50, 14], shop: [18, 42], awning: [42, 36], lamp: [62, 30], signal: [90, 40], footpath: [50, 70], road: [50, 86], zebra: [76, 88], tree: [8, 40], 'bus-stop': [80, 56], dustbin: [58, 66] },
  museum: { 'painting-1': [18, 28], 'painting-2': [82, 28], arch: [50, 38], 'case-1': [22, 62], 'case-2': [50, 66], 'case-3': [78, 62], statue: [93, 58], plaque: [30, 52], bench: [50, 86], floor: [50, 94] },
  home: { window: [18, 32], fan: [50, 8], clock: [74, 22], sofa: [44, 66], table: [50, 80], lamp: [14, 62], shelf: [88, 48], tv: [70, 52], rug: [50, 90], plant: [30, 76], door: [93, 50], switch: [80, 40] },
  park: { sky: [50, 10], kite: [70, 14], 'tree-1': [12, 34], 'tree-2': [88, 32], bench: [33, 70], swing: [62, 58], slide: [80, 66], flowers: [18, 84], path: [50, 90], lamp: [46, 46], grass: [70, 88], birdbath: [10, 70] },
  pond: { sky: [50, 10], branch: [18, 20], water: [50, 70], 'lily-pad': [38, 68], lotus: [62, 64], reeds: [8, 60], 'reeds-right': [92, 60], rock: [25, 87], bank: [50, 95], mud: [76, 92] },
  bicycle: { saddle: [43, 34.5], 'seat-post': [43.9, 39], handlebar: [62, 33], grip: [58.6, 34.6], bell: [65.4, 34.2], 'brake-lever': [60.6, 36.4], headlamp: [69.2, 45], frame: [57.6, 56], 'top-tube': [54.4, 42], fork: [70.2, 56], 'front-wheel': [80, 76], 'rear-wheel': [20, 76], tyre: [73, 91], hub: [73, 67.2], spokes: [64, 76], valve: [81.6, 50.6], chain: [37.6, 72.4], chainring: [48, 70.4], sprocket: [27, 67.2], pedal: [52.4, 81], crank: [50.4, 76], 'front-brake': [72.4, 45.4], 'rear-brake': [28.6, 46], carrier: [29, 42], mudguard: [84.2, 49.6], 'rear-mudguard': [15.8, 49.6], reflector: [18.6, 43.4], stand: [31.4, 84] },
  workshop: { hammer: [12, 24], saw: [26, 22], spanner: [38, 22], screwdriver: [46, 24], pliers: [54, 24], 'try-square': [62, 22], chisel: [70.5, 24], vice: [9, 56], plank: [32, 60], clamp: [44, 57], 'hand-drill': [58, 55], nails: [68, 58], 'measuring-tape': [22, 60], sandpaper: [50, 62], 'oil-can': [86, 34], paint: [90, 52], lamp: [40, 8], drawer: [30, 75], stool: [82, 82], glue: [80, 34] },
  market: { sky: [50, 6], bunting: [50, 12], 'stall-1': [18, 52], 'stall-2': [50, 50], 'stall-3': [82, 52], scale: [56, 47], 'price-board': [42, 44], crates: [50, 58], basket: [28, 84], cart: [72, 80], sacks: [8, 78], ground: [50, 94] },
  bathroom: { window: [12, 14], tap: [22, 40], basin: [22, 50], mirror: [22, 24], shower: [84, 26], toilet: [70, 60], bucket: [28, 74], mug: [36, 78], towel: [50, 30], soap: [32, 46], geyser: [56, 14], drain: [50, 90], pipe: [46, 82], floor: [60, 94] },
};
const NOTEBOOK = { garden: 'Garden notebook', campus: 'Campus notebook', kitchen: 'Kitchen notes', farm: 'Farm notebook', street: 'Street notes', museum: 'Museum notes', home: 'Home notes', park: 'Park notebook', pond: 'Pond notebook', bicycle: 'Parts named', workshop: 'Tools named', market: 'Market notes', bathroom: 'Spotted' };

/* ================================================================================================
   Scene art. Every scene is drawn in a 1000 x 625 box as layers: back (sky/wall), far, mid, near.
   ============================================================================================== */
function kit(P, seed) {
  const R = rng(seed);
  const u = id => `url(#${P}-${id})`;
  const sh = (cx, cy, rx, ry, o = 1) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${u('sh')}" opacity="${o}"/>`;
  const cloud = (x, y, s = 1, dur = 50, dx = 70) => `<g class="xp-cloud" style="--dur:${dur}s;--dx:${dx}px;animation-delay:${-r1(R() * dur)}s"><g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="4" cy="22" rx="74" ry="9" fill="#2B4A6B" opacity=".07"/>
    <path class="xp-cl" d="M-62 16a20 20 0 0 1 14-30a30 30 0 0 1 52-14a26 26 0 0 1 44 10a18 18 0 0 1 16 34z"/>
    <path class="xp-cl2" d="M-62 16h126a18 18 0 0 0 4-10c-14 8-40 9-62 6s-48 0-68 4z"/></g></g>`;
  const sun = (x, y) => `<g class="xp-sun"><circle cx="${x}" cy="${y}" r="110" fill="${u('sun')}"/>
    <g class="xp-rays" stroke="#FFD45C" stroke-width="6" stroke-linecap="round" opacity=".7">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${r1(x + Math.cos(a) * 50)}" y1="${r1(y + Math.sin(a) * 50)}" x2="${r1(x + Math.cos(a) * 66)}" y2="${r1(y + Math.sin(a) * 66)}"/>`; }).join('')}</g>
    <circle cx="${x}" cy="${y}" r="38" fill="#FFCB45"/><circle cx="${x}" cy="${y}" r="38" fill="${u('sunball')}"/></g>
    <g class="xp-moon"><circle cx="${x}" cy="${y}" r="70" fill="${u('moonglow')}"/><path d="M${x + 6} ${y - 30}a30 30 0 1 0 22 46a24 24 0 1 1 -22 -46z" fill="#F6EBC8"/></g>`;
  const stars = (n = 26, maxY = 260) => `<g class="xp-stars">${Array.from({ length: n }, () => `<circle cx="${r1(R() * W)}" cy="${r1(R() * maxY)}" r="${r1(1 + R() * 1.6)}" style="animation-delay:${r1(R() * 3)}s"/>`).join('')}</g>`;
  const birds = (x, y) => `<g transform="translate(0 ${y})"><g class="xp-birds" style="animation-delay:${-r1((x / 1000) * 26)}s">${[0, 1, 2].map(i => `<g transform="translate(${i * 26} ${(i % 2) * 12})"><path class="xp-bird" style="animation-delay:${i * .17}s" d="M0 0q7-8 13 0q6-8 13 0" fill="none" stroke="#3A3A4A" stroke-width="2.6" stroke-linecap="round"/></g>`).join('')}</g></g>`;
  const hill = (y, a, fill, phase = 0) => `<path d="M0 ${y} C ${120 + phase} ${y - a} ${300 + phase} ${y - a} ${450 + phase} ${y - a * .2} S ${760 + phase} ${y + a * .25} ${W} ${y - a * .6} V${H} H0Z" fill="${fill}"/>`;
  function tree(x, y, s = 1, tone = 0, sway = true) {
    const c = [['#3D7A2B', '#58A03A', '#86C55A'], ['#2F6B3A', '#4C9450', '#7DBF6E'], ['#5C7F22', '#7FA632', '#A9CF55']][tone % 3];
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="${sway ? 'xp-sway' : ''}" style="--sd:${r1(4 + R() * 3)}s">
      ${sh(0, 4, 78, 13)}
      <path d="M-15 4C-10-40-8-80-16-118H16C8-80 10-40 15 4Z" fill="${u('bark')}"/>
      <path d="M-2-86q-26-16-40-36M4-96q22-14 34-34" stroke="#6B4423" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g fill="${c[0]}"><circle cx="-58" cy="-140" r="44"/><circle cx="0" cy="-176" r="56"/><circle cx="58" cy="-142" r="46"/><circle cx="-30" cy="-112" r="40"/><circle cx="34" cy="-110" r="40"/></g>
      <g fill="${c[1]}"><circle cx="-56" cy="-150" r="36"/><circle cx="-4" cy="-186" r="46"/><circle cx="52" cy="-152" r="36"/><circle cx="-24" cy="-130" r="30"/><circle cx="26" cy="-130" r="30"/></g>
      <g fill="${c[2]}" opacity=".85"><circle cx="-66" cy="-162" r="16"/><circle cx="-20" cy="-206" r="20"/><circle cx="34" cy="-170" r="14"/><circle cx="-40" cy="-134" r="9"/></g></g></g>`;
  }
  const bush = (x, y, s = 1, c = ['#3F7F2C', '#5DA23E', '#8BCB5E']) => `<g transform="translate(${x} ${y}) scale(${s})">${sh(0, 2, 56, 9)}
    <g fill="${c[0]}"><circle cx="-30" cy="-18" r="24"/><circle cx="0" cy="-30" r="30"/><circle cx="30" cy="-18" r="24"/></g>
    <g fill="${c[1]}"><circle cx="-28" cy="-22" r="18"/><circle cx="-2" cy="-36" r="22"/><circle cx="28" cy="-22" r="17"/></g>
    <g fill="${c[2]}" opacity=".8"><circle cx="-12" cy="-46" r="8"/><circle cx="-34" cy="-30" r="6"/></g><rect x="-50" y="-14" width="100" height="14" rx="7" fill="${c[0]}"/></g>`;
  const flower = (x, y, col, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q-2-14 0-26" stroke="#4E8A2E" stroke-width="3" fill="none"/><path d="M0-10q-10-4-12 2q8 3 12-2z" fill="#5DA23E"/>
    <g fill="${col}">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-34" rx="5" ry="8" transform="rotate(${a} 0 -27)"/>`).join('')}</g><circle cy="-27" r="4.5" fill="#7A4A12"/><circle cx="-1.5" cy="-28.5" r="1.5" fill="#fff" opacity=".6"/></g>`;
  function tufts(y0, n, cols = ['#4F8F2E', '#6FB244', '#8FCB5A'], h = 34) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = r1((i + R() * .6) * (W / n)), hh = h * (.7 + R() * .6);
      let d = '';
      for (let b = 0; b < 4; b++) { const bx = x + (b - 1.5) * 6, lean = (R() - .5) * 18; d += `M${r1(bx - 3)} ${y0}Q${r1(bx + lean * .3)} ${r1(y0 - hh * .6)} ${r1(bx + lean)} ${r1(y0 - hh * (.6 + R() * .5))}Q${r1(bx + lean * .2 + 2)} ${r1(y0 - hh * .4)} ${r1(bx + 3)} ${y0}Z`; }
      out += `<path class="xp-tuft" style="animation-delay:${-r1(R() * 4)}s" d="${d}" fill="${cols[i % cols.length]}"/>`;
    }
    return out;
  }
  const fence = (x1, x2, y, h = 70, col = '#F3E6CC', sh2 = '#D9C6A2') => {
    let p = '';
    for (let x = x1; x < x2; x += 34) p += `<path d="M${x} ${y}v${-h}l11-12l11 12v${h}z" fill="${col}"/><path d="M${x + 16} ${y}v${-h}l6 0v${h}z" fill="${sh2}" opacity=".7"/>`;
    return `<g>${sh((x1 + x2) / 2, y + 2, (x2 - x1) / 2, 8, .7)}<rect x="${x1 - 6}" y="${y - h + 12}" width="${x2 - x1 + 12}" height="10" rx="3" fill="${sh2}"/><rect x="${x1 - 6}" y="${y - 26}" width="${x2 - x1 + 12}" height="10" rx="3" fill="${sh2}"/>${p}</g>`;
  };
  const rock = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${sh(0, 2, 40, 7)}<path d="M-36 2C-40-14-26-30-6-32C14-34 34-22 38-4C40 4 30 6 0 6S-34 6-36 2Z" fill="#9AA0A6"/><path d="M-22-18C-14-26 2-28 12-24C2-22-10-18-18-12Z" fill="#C9CED2"/><path d="M-36 2C-20 4 20 4 38-4C40 4 30 6 0 6S-34 6-36 2Z" fill="#7A8086"/></g>`;
  const win = (x, y, w, h, frame = '#FFF7EA') => `<g><rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="6" fill="${frame}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${u('sky')}"/>
    <path d="M${x} ${y + h * .78}q${w * .3}-${h * .2} ${w * .55}-${h * .08}t${w * .45}-${h * .02}V${y + h}H${x}z" fill="#8CC05A"/><circle cx="${x + w * .78}" cy="${y + h * .28}" r="${Math.min(w, h) * .1}" class="xp-winsun"/>
    <path d="M${x + w * .1} ${y}l${w * .5} ${h}h${w * .2}l-${w * .5}-${h}z" fill="#fff" opacity=".18"/><rect x="${x + w / 2 - 3}" y="${y}" width="6" height="${h}" fill="${frame}"/><rect x="${x}" y="${y + h / 2 - 3}" width="${w}" height="6" fill="${frame}"/>
    <rect x="${x - 14}" y="${y + h + 6}" width="${w + 28}" height="10" rx="4" fill="${frame}"/><rect x="${x - 14}" y="${y + h + 14}" width="${w + 28}" height="4" fill="#000" opacity=".08"/></g>`;
  const tiles = (x, y, w, h, s, col, grout) => { let g = ''; for (let yy = y; yy < y + h; yy += s) g += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}"/>`; for (let xx = x; xx < x + w; xx += s) g += `<line x1="${xx}" y1="${y}" x2="${xx}" y2="${y + h}"/>`; return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/><g stroke="${grout}" stroke-width="2">${g}</g>`; };
  const lightsweep = (x, y, w, h) => `<path d="M${x} ${y}h${w * .12}l${-w * .1} ${h}h${-w * .12}z" fill="#fff" opacity=".12"/>`;
  return { R, u, sh, cloud, sun, stars, birds, hill, tree, bush, flower, tufts, fence, rock, win, tiles, lightsweep };
}

const COMMON_DEFS = P => `
  <linearGradient id="${P}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="xp-sky-a"/><stop offset=".7" class="xp-sky-b"/><stop offset="1" class="xp-sky-c"/></linearGradient>
  <radialGradient id="${P}-sun"><stop offset="0" stop-color="#FFF3B8" stop-opacity=".95"/><stop offset=".38" stop-color="#FFE18A" stop-opacity=".45"/><stop offset="1" stop-color="#FFE18A" stop-opacity="0"/></radialGradient>
  <radialGradient id="${P}-sunball" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#FFF6C9"/><stop offset=".5" stop-color="#FFD860" stop-opacity=".6"/><stop offset="1" stop-color="#F5A623" stop-opacity=".3"/></radialGradient>
  <radialGradient id="${P}-moonglow"><stop offset="0" stop-color="#FFF4D0" stop-opacity=".35"/><stop offset="1" stop-color="#FFF4D0" stop-opacity="0"/></radialGradient>
  <radialGradient id="${P}-sh"><stop offset="0" stop-color="#1E140C" stop-opacity=".42"/><stop offset=".6" stop-color="#1E140C" stop-opacity=".16"/><stop offset="1" stop-color="#1E140C" stop-opacity="0"/></radialGradient>
  <linearGradient id="${P}-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A3D26A"/><stop offset="1" stop-color="#5E9C35"/></linearGradient>
  <linearGradient id="${P}-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9DA8C"/><stop offset="1" stop-color="#93C066"/></linearGradient>
  <linearGradient id="${P}-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3B0"/><stop offset="1" stop-color="#B4D48E"/></linearGradient>
  <linearGradient id="${P}-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6640"/><stop offset="1" stop-color="#6B4024"/></linearGradient>
  <linearGradient id="${P}-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A4E2C"/><stop offset=".45" stop-color="#9C6A3E"/><stop offset="1" stop-color="#6A4226"/></linearGradient>
  <linearGradient id="${P}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9A266"/><stop offset="1" stop-color="#AE7440"/></linearGradient>
  <linearGradient id="${P}-wooddark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A86F3F"/><stop offset="1" stop-color="#7C4E2A"/></linearGradient>
  <linearGradient id="${P}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8BD6E2"/><stop offset=".5" stop-color="#4FAFC4"/><stop offset="1" stop-color="#2D8099"/></linearGradient>
  <linearGradient id="${P}-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2F5F7"/><stop offset=".5" stop-color="#B7C0C8"/><stop offset="1" stop-color="#8A949E"/></linearGradient>
  <linearGradient id="${P}-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#C9D1D8"/><stop offset=".55" stop-color="#9AA5AF"/><stop offset="1" stop-color="#DDE3E8"/></linearGradient>
  <linearGradient id="${P}-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#E8F6FA" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>
  <linearGradient id="${P}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8946A"/><stop offset="1" stop-color="#A06B42"/></linearGradient>
  <radialGradient id="${P}-vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></radialGradient>
  <radialGradient id="${P}-glow"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".95"/><stop offset=".55" stop-color="#FFD25E" stop-opacity=".35"/><stop offset="1" stop-color="#FFD25E" stop-opacity="0"/></radialGradient>
  <radialGradient id="${P}-cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".55"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>
  <linearGradient id="${P}-lensglass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#BFE6FF" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>
  <linearGradient id="${P}-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A8"/><stop offset=".5" stop-color="#D9A33A"/><stop offset="1" stop-color="#8E5E14"/></linearGradient>
  <linearGradient id="${P}-handle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B4632F"/><stop offset=".5" stop-color="#8A4520"/><stop offset="1" stop-color="#5E2C12"/></linearGradient>`;

/* Each scene: (k) => ({ defs, back, far, mid, near }) */
const SCENES = {
  garden(k) {
    const { u, sh, tree, bush, flower, fence, rock, tufts } = k;
    const bed = (x, y, w, h) => `<g>${sh(x + w / 2, y + h + 6, w / 2 + 16, 12)}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#B5643D"/><rect x="${x}" y="${y}" width="${w}" height="${h * .35}" rx="8" fill="#CB7A4E"/>
      <rect x="${x + 10}" y="${y + 6}" width="${w - 20}" height="${h - 22}" rx="8" fill="${u('soil')}"/>${Array.from({ length: Math.floor(w / 26) }, (_, i) => `<line x1="${x + 18 + i * 26}" y1="${y + h}" x2="${x + 18 + i * 26}" y2="${y + h * .4}" stroke="#9A4F2C" stroke-width="2" opacity=".5"/>`).join('')}</g>`;
    const leafy = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="xp-sway" style="--sd:${3 + (x % 3)}s"><path d="M0 0C-18-10-22-30-10-38C-4-26 0-12 0 0Z" fill="#4E9A35"/><path d="M0 0C18-10 22-30 10-38C4-26 0-12 0 0Z" fill="#6DB548"/><path d="M0 0C-6-16-4-34 2-44C8-30 6-14 0 0Z" fill="#8ACB5C"/></g></g>`;
    const tomato = (x, y) => `<g transform="translate(${x} ${y})"><line x1="0" y1="0" x2="0" y2="-92" stroke="#B88A55" stroke-width="5" stroke-linecap="round"/>
      <g class="xp-sway" style="--sd:5s"><path d="M0 0q-6-30 2-70" stroke="#4E8A2E" stroke-width="4" fill="none"/>${[[-14, -24], [12, -40], [-12, -56], [10, -70]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="13" ry="7" fill="#58A03A" transform="rotate(${a > 0 ? -20 : 20} ${a} ${b})"/>`).join('')}
      <circle cx="8" cy="-28" r="8" fill="#E2483B"/><circle cx="-8" cy="-46" r="7" fill="#EE6A3A"/><circle cx="6" cy="-58" r="6" fill="#E2483B"/><circle cx="5" cy="-31" r="2.4" fill="#fff" opacity=".6"/></g></g>`;
    return {
      defs: '',
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(860, 90)}${k.cloud(170, 80, 1)}${k.cloud(520, 54, .8, 64, 90)}${k.cloud(760, 160, .6, 44, 50)}${k.birds(330, 120)}`,
      far: `${k.hill(300, 90, u('hill2'), 40)}${k.hill(330, 60, u('hill1'), -80)}
        <g transform="translate(70 262)"><rect width="200" height="64" fill="#EADBC0"/><path d="M-12 0L100-36L212 0Z" fill="#C2502A"/><g fill="#7FB3C8">${[20, 70, 120, 160].map(x => `<rect x="${x}" y="16" width="26" height="26" rx="3"/>`).join('')}</g></g>
        ${k.tree(330, 330, .45, 1, false)}${k.tree(400, 334, .38, 2, false)}${k.tree(640, 330, .5, 0, false)}`,
      mid: `<rect y="320" width="${W}" height="${H - 320}" fill="${u('grass')}"/>
        <path d="M430 ${H}C460 520 520 470 470 400C450 370 500 345 520 330L560 330C540 350 520 372 540 400C590 470 560 540 600 ${H}Z" fill="#E8D3A8"/>
        ${[[480, 590], [520, 520], [500, 450], [528, 380]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${26 - i * 4}" ry="${9 - i}" fill="#CDB48A"/>`).join('')}
        ${fence(0, 440, 330, 64)}${fence(600, 1000, 330, 64)}
        ${[[30, 330, '#F28A1E'], [70, 334, '#F2C21E'], [110, 330, '#E94B5A'], [150, 334, '#F28A1E'], [650, 334, '#E94B5A'], [700, 330, '#F2C21E'], [740, 334, '#F28A1E']].map(([x, y, c]) => flower(x, y, c, 1.1)).join('')}
        ${tree(880, 420, 1.15, 0)}
        <g transform="translate(36 430)">${sh(0, 4, 50, 10)}<rect x="-38" y="-80" width="76" height="84" rx="8" fill="#3F7E3A"/><rect x="-44" y="-92" width="88" height="18" rx="6" fill="#2F6A2C"/><g stroke="#2F6A2C" stroke-width="3">${[-24, -8, 8, 24].map(x => `<line x1="${x}" y1="-70" x2="${x}" y2="-6"/>`).join('')}</g><path d="M-30-80h20v84h-20z" fill="#fff" opacity=".08"/></g>
        ${bed(120, 410, 300, 70)}${[150, 196, 242, 288, 334, 380].map((x, i) => i % 2 ? leafy(x, 432, .9) : tomato(x, 438)).join('')}
        ${bed(600, 440, 230, 66)}${[628, 668, 708, 748, 788].map(x => leafy(x, 462, 1)).join('')}
        ${bush(240, 560, 1)}${rock(660, 570, 1.1)}${rock(720, 585, .6)}
        <g transform="translate(370 560)">${sh(0, 4, 40, 8)}<path d="M-30-30h44l6 34h-56z" fill="#3F8FB0"/><path d="M14-26q26-6 30-26" stroke="#3F8FB0" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-30-30q-14 0-14 14" stroke="#2F7090" stroke-width="5" fill="none"/><ellipse cx="-8" cy="-30" rx="22" ry="5" fill="#2F7090"/><path d="M-24-24h6v26h-6z" fill="#fff" opacity=".25"/></g>`,
      near: tufts(H + 4, 34),
    };
  },
  campus(k) {
    const { u, sh, tree, bush, tufts } = k;
    const windows = Array.from({ length: 2 }, (_, r) => Array.from({ length: 7 }, (_, c) => { const x = 236 + c * 80 + (c > 2 ? 50 : 0), y = 150 + r * 86; return c === 3 && r === 1 ? '' : `<rect x="${x}" y="${y}" width="48" height="52" rx="4" fill="#5E95B3"/><rect x="${x}" y="${y}" width="48" height="52" rx="4" fill="${u('glass')}"/><rect x="${x - 4}" y="${y + 50}" width="56" height="7" rx="2" fill="#E6D3B3"/><line x1="${x + 24}" y1="${y}" x2="${x + 24}" y2="${y + 52}" stroke="#F4E9D6" stroke-width="3"/>`; }).join('')).join('');
    return {
      defs: `<linearGradient id="${k.P}-bld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E7C8"/><stop offset="1" stop-color="#E8D2A8"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(120, 80)}${k.cloud(380, 70, .9)}${k.cloud(700, 50, .7, 60, 80)}${k.birds(560, 110)}`,
      far: `${k.hill(330, 50, u('hill2'), 0)}${[60, 140, 760, 840, 940].map((x, i) => k.tree(x, 330, .42, i % 3, false)).join('')}`,
      mid: `<rect y="330" width="${W}" height="${H - 330}" fill="#D9B98A"/><rect y="330" width="${W}" height="40" fill="#C9A675"/>
        <path d="M0 ${H}V520Q500 470 ${W} 520V${H}Z" fill="${u('grass')}"/>
        ${sh(520, 335, 360, 16)}<rect x="200" y="110" width="640" height="225" fill="url(#${k.P}-bld)"/><rect x="200" y="186" width="640" height="10" fill="#C2502A"/><rect x="190" y="96" width="660" height="20" rx="4" fill="#C2502A"/><rect x="190" y="112" width="660" height="6" fill="#000" opacity=".12"/>
        ${windows}<rect x="478" y="236" width="84" height="99" rx="6" fill="#7A4A2A"/><rect x="486" y="244" width="32" height="91" rx="3" fill="#94603A"/><rect x="522" y="244" width="32" height="91" rx="3" fill="#94603A"/><path d="M462 236h116l-12-18h-92z" fill="#C2502A"/>
        <rect x="466" y="335" width="108" height="10" fill="#BFA785"/><rect x="456" y="345" width="128" height="10" fill="#B09676"/>
        <g transform="translate(486 120)"><circle cx="34" cy="34" r="26" fill="#FFF9EF" stroke="#7A4A2A" stroke-width="5"/><path d="M34 34V18M34 34l10 6" stroke="#2B1A10" stroke-width="3" stroke-linecap="round"/></g>
        <g transform="translate(870 60)"><rect x="-3" width="6" height="290" fill="url(#${k.P}-metal)"/><circle cy="-4" r="7" fill="#D9A33A"/><g class="xp-flag"><path d="M3 6h70v16H3z" fill="#F28A1E"/><path d="M3 22h70v16H3z" fill="#FFFFFF"/><path d="M3 38h70v16H3z" fill="#2E8B3E"/><circle cx="38" cy="30" r="5" fill="none" stroke="#1F3A8A" stroke-width="1.6"/></g>${sh(0, 292, 30, 6)}</g>
        ${tree(110, 420, 1.05, 1)}<ellipse cx="110" cy="424" rx="80" ry="14" fill="#B79E7C"/><path d="M30 424a80 14 0 0 0 160 0v14a80 14 0 0 1-160 0z" fill="#9C8466"/>
        <g transform="translate(680 290)">${sh(0, 58, 46, 6)}<rect x="-4" y="0" width="6" height="58" fill="#7A4A2A"/><rect x="42" y="0" width="6" height="58" fill="#7A4A2A" transform="translate(-50 0)"/><rect x="-44" y="-40" width="92" height="62" rx="5" fill="#7A4A2A"/><rect x="-38" y="-34" width="80" height="50" rx="3" fill="#E7D9B8"/><rect x="-30" y="-28" width="26" height="18" fill="#F6DFB5"/><rect x="2" y="-26" width="32" height="14" fill="#CFE6E1"/><rect x="-24" y="-4" width="40" height="12" fill="#EED0DC"/><circle cx="-17" cy="-28" r="2.5" fill="#C2502A"/><circle cx="18" cy="-26" r="2.5" fill="#1F6F66"/></g>
        ${[268, 330, 720, 782].map(x => `<g transform="translate(${x} 352)">${sh(0, 2, 20, 4)}<path d="M-14-22h28l-4 22h-20z" fill="#C2502A"/><rect x="-16" y="-26" width="32" height="6" rx="2" fill="#A8401F"/>${k.bush(0, -22, .32)}</g>`).join('')}
        <g transform="translate(300 480)">${sh(0, 8, 90, 10)}<rect x="-80" y="-30" width="160" height="12" rx="4" fill="${u('wood')}"/><rect x="-80" y="-12" width="160" height="10" rx="4" fill="${u('wooddark')}"/><rect x="-70" y="-2" width="8" height="10" fill="#555"/><rect x="62" y="-2" width="8" height="10" fill="#555"/><rect x="-80" y="-56" width="160" height="12" rx="4" fill="${u('wood')}"/><rect x="-72" y="-46" width="6" height="18" fill="#555"/><rect x="66" y="-46" width="6" height="18" fill="#555"/></g>
        <g transform="translate(830 420)">${sh(0, 4, 70, 9)}<rect x="-66" y="-46" width="132" height="50" rx="6" fill="#9AA5AF"/><rect x="-66" y="-46" width="132" height="12" rx="6" fill="#C9D1D8"/>${[-40, 0, 40].map(x => `<g><rect x="${x - 4}" y="-74" width="8" height="30" fill="url(#${k.P}-metal)"/><path d="M${x - 4} -74h18v8h-18z" fill="#B7C0C8"/><circle cx="${x}" cy="-80" r="6" fill="#1F6F66"/></g>`).join('')}</g>
        ${[[640, 452, '#2E8B3E'], [690, 452, '#2A6FB0']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${sh(0, 2, 22, 5)}<path d="M-18-50h36l-4 50h-28z" fill="${c}"/><rect x="-21" y="-56" width="42" height="9" rx="3" fill="${c}"/><path d="M-14-46h8v44h-6z" fill="#fff" opacity=".15"/></g>`).join('')}
        ${bush(940, 470, .9)}`,
      near: tufts(H + 4, 30),
    };
  },
  kitchen(k) {
    const { u, sh, tiles, win } = k;
    const jar = (x, y, c, lid) => `<g transform="translate(${x} ${y})"><rect x="-16" y="-40" width="32" height="40" rx="7" fill="#EAF4F6" opacity=".8"/><rect x="-13" y="-22" width="26" height="20" rx="4" fill="${c}"/><rect x="-17" y="-48" width="34" height="10" rx="3" fill="${lid}"/><rect x="-11" y="-36" width="5" height="30" rx="2" fill="#fff" opacity=".6"/></g>`;
    return {
      defs: `<linearGradient id="${k.P}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E9CF"/><stop offset="1" stop-color="#EED9B5"/></linearGradient><linearGradient id="${k.P}-granite" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A4F55"/><stop offset=".5" stop-color="#5E646B"/><stop offset="1" stop-color="#43484E"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="url(#${k.P}-wall)"/>${tiles(0, 250, 860, 140, 35, '#E2F0EE', '#C7DDD9')}`,
      far: `${win(70, 70, 190, 150)}
        <rect x="360" y="148" width="320" height="12" rx="3" fill="${u('wooddark')}"/>${sh(520, 166, 160, 6, .6)}
        ${jar(392, 148, '#F2C14E', '#C2502A')}${jar(440, 148, '#E36B2C', '#1F6F66')}${jar(488, 148, '#7BB342', '#8C3557')}${jar(536, 148, '#B35A2A', '#D98A1C')}${jar(584, 148, '#F4E6C8', '#4C7424')}${jar(632, 148, '#8C3557', '#C2502A')}
        <rect x="360" y="70" width="320" height="10" rx="3" fill="${u('wooddark')}"/>${[400, 450, 520, 600].map((x, i) => `<g transform="translate(${x} 70)"><path d="M0 0v${30 + i * 4}" stroke="#555" stroke-width="2"/><circle cy="${36 + i * 4}" r="${8 + (i % 2) * 4}" fill="url(#${k.P}-metal)"/></g>`).join('')}`,
      mid: `<rect y="390" width="${W}" height="${H - 390}" fill="${u('wood')}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${20 + i * 170}" y="420" width="150" height="170" rx="8" fill="#C48A52"/><rect x="${30 + i * 170}" y="430" width="130" height="150" rx="6" fill="none" stroke="#A86F3F" stroke-width="3"/><rect x="${80 + i * 170}" y="440" width="30" height="7" rx="3" fill="url(#${k.P}-metal)"/>`).join('')}
        <rect y="370" width="${W - 140}" height="26" rx="4" fill="url(#${k.P}-granite)"/><rect y="370" width="${W - 140}" height="5" fill="#fff" opacity=".18"/>${sh(430, 398, 420, 8, .6)}
        <g transform="translate(360 370)"><rect x="-110" y="-20" width="220" height="22" rx="6" fill="#2F3338"/><rect x="-104" y="-16" width="208" height="5" rx="2" fill="#555B62"/>${[-55, 55].map(x => `<g><ellipse cx="${x}" cy="-20" rx="36" ry="7" fill="#1E2125"/><ellipse cx="${x}" cy="-21" rx="22" ry="4" fill="#3A3F45"/></g>`).join('')}${[-80, -40, 40, 80].map(x => `<circle cx="${x}" cy="-6" r="5" fill="#C9D1D8"/>`).join('')}
          <g transform="translate(-55 -24)"><path d="M-40 0h80l-6-46h-68z" fill="url(#${k.P}-metal)"/><rect x="-44" y="-52" width="88" height="10" rx="4" fill="#9AA5AF"/><path d="M40-40h22" stroke="#2B1A10" stroke-width="6" stroke-linecap="round"/><path d="M-30-40h10v38h-8z" fill="#fff" opacity=".35"/>
            ${[0, 1, 2].map(i => `<path class="xp-steam" style="animation-delay:${i * 1.1}s" d="M${-18 + i * 18} -58q-10-14 0-28q10-14 0-28" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>`).join('')}</g>
          <g transform="translate(58 -24)"><path d="M-30 0h60l4-30h-68z" fill="#2B1A10"/><ellipse cy="-30" rx="34" ry="8" fill="#4A3A2E"/><ellipse cy="-30" rx="26" ry="5" fill="#E8B04A"/><path d="M34-28h40" stroke="#2B1A10" stroke-width="6" stroke-linecap="round"/></g></g>
        <g transform="translate(560 368)">${sh(0, 2, 70, 6)}<rect x="-62" y="-10" width="124" height="12" rx="5" fill="#E2B27A"/><rect x="-62" y="-10" width="124" height="4" rx="2" fill="#fff" opacity=".3"/><circle cx="-26" cy="-16" r="11" fill="#E2483B"/><circle cx="-29" cy="-19" r="3" fill="#fff" opacity=".6"/><path d="M0-12q14-20 34-6q-14 6-34 6z" fill="#6DB548"/><rect x="18" y="-16" width="40" height="4" rx="2" fill="url(#${k.P}-metal)" transform="rotate(-8 18 -16)"/></g>
        <g transform="translate(720 372)"><rect x="-74" y="-4" width="148" height="20" rx="6" fill="#B7C0C8"/><path d="M-62 0h124l-10 28h-104z" fill="#8A949E"/><ellipse cy="2" rx="60" ry="6" fill="#6B757E"/>
          <path d="M0-4v-60q0-10 10-10h20" stroke="url(#${k.P}-chrome)" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="-8" y="-30" width="16" height="10" rx="3" fill="#9AA5AF"/><circle class="xp-drip" cx="30" cy="-64" r="4" fill="#5BB8D8"/></g>
        <g transform="translate(920 390)">${sh(0, 230, 70, 8)}<rect x="-70" y="-240" width="140" height="470" rx="12" fill="#E9EEF1"/><rect x="-70" y="-240" width="140" height="470" rx="12" fill="url(#${k.P}-glass)"/><line x1="-70" y1="-80" x2="70" y2="-80" stroke="#B7C0C8" stroke-width="3"/><rect x="-56" y="-200" width="8" height="90" rx="4" fill="#9AA5AF"/><rect x="-56" y="-60" width="8" height="120" rx="4" fill="#9AA5AF"/><rect x="10" y="-220" width="44" height="30" rx="4" fill="#F28A1E" opacity=".9"/><circle cx="32" cy="-205" r="7" fill="#fff"/></g>
        <g transform="translate(200 560)">${sh(0, 50, 36, 6)}<rect x="-30" y="-30" width="60" height="80" rx="24" fill="#C2342A"/><rect x="-10" y="-46" width="20" height="18" rx="4" fill="#555"/><path d="M-22-14h10v56h-10z" fill="#fff" opacity=".2"/></g>
        <g transform="translate(620 360)"><path d="M-36 0h72l-8-26h-56z" fill="#C89255"/><path d="M-34-4h68M-30-14h60" stroke="#A86F3F" stroke-width="2"/><circle cx="-14" cy="-30" r="12" fill="#F2C21E"/><circle cx="10" cy="-30" r="12" fill="#E2483B"/><circle cx="-2" cy="-40" r="10" fill="#7BB342"/></g>`,
      near: `<rect y="${H - 22}" width="${W}" height="22" fill="#8A5A36"/>`,
    };
  },
  farm(k) {
    const { u, sh, tree, tufts, rock } = k;
    const rows = Array.from({ length: 9 }, (_, i) => { const y = 360 + i * 26 + i * i * 1.6; return `<path d="M${500 - 120 - i * 70} ${y}Q500 ${y - 10} ${500 + 120 + i * 70} ${y}" stroke="${i % 2 ? '#5E9B33' : '#76B444'}" stroke-width="${7 + i * 1.6}" fill="none" stroke-linecap="round" stroke-dasharray="${2 + i} ${6 + i}"/>`; }).join('');
    return {
      defs: '',
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(160, 96)}${k.cloud(420, 70, 1)}${k.cloud(760, 110, .8, 56, 90)}${k.birds(600, 80)}`,
      far: `${k.hill(300, 80, u('hill2'), 60)}${k.hill(320, 46, u('hill1'), -120)}${[540, 600, 660, 710].map((x, i) => k.tree(x, 318, .3, i % 3, false)).join('')}`,
      mid: `<rect y="318" width="${W}" height="${H - 318}" fill="#B9C76A"/><path d="M0 330H${W}V${H}H0Z" fill="${u('grass')}" opacity=".55"/>
        <path d="M180 340H820L${W + 200} ${H}H-200Z" fill="#8B6A3E"/><path d="M200 344H800L${W + 100} ${H}H-100Z" fill="#9D7A47"/>${rows}
        <path d="M0 ${H - 40}Q500 ${H - 70} ${W} ${H - 40}V${H - 18}Q500 ${H - 46} 0 ${H - 18}Z" fill="${u('water')}"/><path class="xp-shimmer" d="M120 ${H - 44}h60M420 ${H - 54}h80M760 ${H - 46}h50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
        <g transform="translate(140 336)">${sh(0, 4, 100, 12)}<rect x="-70" y="-70" width="140" height="74" fill="#E4C38E"/><rect x="-14" y="-40" width="30" height="44" rx="3" fill="#7A4A2A"/><rect x="34" y="-50" width="24" height="20" fill="#5E95B3"/><path d="M-96-62L0-130L96-62Z" fill="#C9A44E"/><path d="M-96-62L0-130L96-62" stroke="#A9842E" stroke-width="6" fill="none"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${-84 + i * 18} -62l${i < 5 ? 10 : 8} ${i < 5 ? -8 : -6}" stroke="#A9842E" stroke-width="2"/>`).join('')}</g>
        <g transform="translate(300 370)">${sh(0, 4, 56, 8)}<path d="M-50 0C-50-50-30-80 0-84C30-80 50-50 50 0Z" fill="#E1B64C"/><path d="M-40-10C-38-46-22-70 0-74" stroke="#C99A2E" stroke-width="3" fill="none"/><path d="M40-10C38-46 22-70 0-74M0-84V0" stroke="#C99A2E" stroke-width="3" fill="none"/><path d="M-6-84q6-12 12 0" stroke="#7A4A2A" stroke-width="4" fill="none"/></g>
        <g transform="translate(380 330)">${sh(0, 4, 70, 8)}<rect x="-60" y="-50" width="6" height="54" fill="#7A4A2A"/><rect x="54" y="-50" width="6" height="54" fill="#7A4A2A"/><path d="M-72-50h144l-10-20h-124z" fill="#B5643D"/><rect x="-54" y="-30" width="108" height="34" fill="#6B4024" opacity=".35"/></g>
        <g transform="translate(560 340)"><g class="xp-sway" style="--sd:5s"><line x1="0" y1="10" x2="0" y2="-70" stroke="#7A4A2A" stroke-width="6"/><line x1="-40" y1="-46" x2="40" y2="-46" stroke="#7A4A2A" stroke-width="5"/><path d="M-22-50h44l-6 40h-32z" fill="#C2502A"/><circle cy="-70" r="15" fill="#E8C99A"/><path d="M-24-76h48l-24-20z" fill="#C9A44E"/><circle cx="-5" cy="-70" r="2" fill="#2B1A10"/><circle cx="5" cy="-70" r="2" fill="#2B1A10"/><path d="M-40-46l-8 10M40-46l8 10" stroke="#E1B64C" stroke-width="4"/></g></g>
        <g transform="translate(740 400)">${sh(0, 6, 60, 9)}<ellipse cy="-6" rx="46" ry="12" fill="#8A949E"/><path d="M-46-6v-34h92v34" fill="#B0866A"/><path d="M-46-40h92" stroke="#8C6248" stroke-width="3"/>${[-30, -10, 10, 30].map(x => `<rect x="${x - 8}" y="-38" width="16" height="10" fill="#8C6248" opacity=".5"/>`).join('')}<ellipse cy="-40" rx="46" ry="11" fill="#5A4A3E"/><ellipse cy="-40" rx="38" ry="8" fill="#2D7590"/>
          <rect x="-44" y="-110" width="6" height="72" fill="#7A4A2A"/><rect x="38" y="-110" width="6" height="72" fill="#7A4A2A"/><rect x="-50" y="-114" width="100" height="8" rx="3" fill="#7A4A2A"/><circle cy="-100" r="10" fill="#9AA5AF"/><line x1="0" y1="-100" x2="0" y2="-56" stroke="#555" stroke-width="2"/><path d="M-8-58h16l-2 14h-12z" fill="#9AA5AF"/></g>
        ${tree(880, 420, 1.2, 0)}${rock(440, 580, .8)}`,
      near: tufts(H + 4, 26, ['#5E9B33', '#7EBA48', '#A0CF5E']),
    };
  },
  street(k) {
    const { u, sh, tree } = k;
    const shop = (x, w, wall, aw1, aw2, sign) => `<g>
      <rect x="${x}" y="150" width="${w}" height="200" fill="${wall}"/><rect x="${x}" y="150" width="${w}" height="10" fill="#000" opacity=".1"/>
      <rect x="${x + 14}" y="168" width="${w - 28}" height="34" rx="4" fill="${sign}"/><rect x="${x + 24}" y="180" width="${w * .4}" height="10" rx="3" fill="#fff" opacity=".85"/>
      ${[0, 1].map(j => `<rect x="${x + 20 + j * (w / 2 - 6)}" y="96" width="${w / 2 - 30}" height="40" rx="3" fill="#5E95B3"/>`).join('')}<rect x="${x}" y="80" width="${w}" height="70" fill="${wall}" opacity=".85"/>${[0, 1].map(j => `<rect x="${x + 20 + j * (w / 2 - 6)}" y="92" width="${w / 2 - 30}" height="42" rx="3" fill="#6AA4C2"/><rect x="${x + 20 + j * (w / 2 - 6)}" y="92" width="${w / 2 - 30}" height="42" rx="3" fill="${u('glass')}"/>`).join('')}
      <path d="M${x - 6} 210h${w + 12}l-14 34h${-w + 16}z" fill="${aw1}"/>${Array.from({ length: Math.floor(w / 28) }, (_, i) => `<path d="M${x + i * 28 + 4} 210h14l-2 34h-14z" fill="${aw2}"/>`).join('')}<path d="M${x + 8} 244${Array.from({ length: Math.floor(w / 20) }, () => 'q5 8 10 0t10 0').join('')}" fill="${aw1}"/>
      <rect x="${x + 16}" y="258" width="${w - 32}" height="92" fill="#3A3F45"/>${Array.from({ length: 8 }, (_, i) => `<line x1="${x + 16}" y1="${264 + i * 11}" x2="${x + w - 16}" y2="${264 + i * 11}" stroke="#555B62" stroke-width="3"/>`).join('')}<rect x="${x + 30}" y="282" width="${w - 60}" height="68" fill="#F6DFB5"/><rect x="${x + 36}" y="300" width="${w - 72}" height="8" fill="#C2502A" opacity=".6"/><rect x="${x + 36}" y="320" width="${w - 72}" height="8" fill="#1F6F66" opacity=".5"/></g>`;
    return {
      defs: '',
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(900, 70)}${k.cloud(250, 50, .8)}${k.cloud(620, 40, .6, 60, 60)}`,
      far: `<g fill="#B9C3CF" opacity=".9">${[[0, 120, 90], [80, 90, 70], [140, 140, 80], [600, 110, 90], [680, 80, 60], [740, 130, 100], [850, 100, 80], [920, 140, 90]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="240"/>`).join('')}</g><g fill="#D6DEE7" opacity=".7">${Array.from({ length: 30 }, (_, i) => `<rect x="${10 + (i * 37) % 980}" y="${140 + (i * 53) % 120}" width="10" height="14"/>`).join('')}</g>
        <path d="M0 40Q250 70 500 46T${W} 52" stroke="#2B2B33" stroke-width="2" fill="none"/><path d="M0 58Q250 92 500 66T${W} 72" stroke="#2B2B33" stroke-width="2" fill="none"/>`,
      mid: `${shop(20, 190, '#F2C9A0', '#C2502A', '#F6EADB', '#1F6F66')}${shop(220, 200, '#CFE6E1', '#1F6F66', '#E6F2EF', '#C2502A')}${shop(430, 170, '#F6DFB5', '#D98A1C', '#FFF4DA', '#8C3557')}${shop(620, 160, '#EED0DC', '#8C3557', '#F8E8EF', '#4C7424')}
        <rect x="790" y="120" width="210" height="230" fill="#E4D6C1"/>${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${808 + c * 64}" y="${140 + r * 66}" width="44" height="48" rx="3" fill="#6AA4C2"/>`).join('')).join('')}
        <rect y="350" width="${W}" height="120" fill="#C9C3B8"/>${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 50}" y1="350" x2="${i * 50 - 20}" y2="470" stroke="#B3ACA0" stroke-width="2"/>`).join('')}<rect y="350" width="${W}" height="6" fill="#A39C90"/>
        <rect y="466" width="${W}" height="14" fill="#E4DED2"/><rect y="480" width="${W}" height="${H - 480}" fill="#4A4E55"/><rect y="480" width="${W}" height="10" fill="#000" opacity=".2"/>
        ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 120 + 10}" y="550" width="60" height="8" rx="3" fill="#F2F0E8"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<rect x="${690 + i * 22}" y="${492}" width="12" height="${H - 492}" fill="#F2F0E8" opacity=".9"/>`).join('')}
        <g transform="translate(620 470)">${sh(0, 2, 30, 6)}<rect x="-5" y="-300" width="10" height="300" fill="#4A4E55"/><path d="M0-300q0-24 40-24h20" stroke="#4A4E55" stroke-width="8" fill="none"/><path d="M50-330h34l-6 12h-22z" fill="#2B2F35"/><ellipse cx="67" cy="-316" rx="14" ry="4" fill="#FFF3B8"/><path d="M53-316l-40 160h108l-40-160z" fill="url(#${k.P}-cone)" class="xp-lampglow"/></g>
        <g transform="translate(900 470)">${sh(0, 2, 26, 5)}<rect x="-5" y="-250" width="10" height="250" fill="#2B2F35"/><rect x="-22" y="-330" width="44" height="100" rx="8" fill="#2B2F35"/><circle class="xp-tl xp-tl-r" cy="-310" r="11" fill="#E2483B"/><circle class="xp-tl xp-tl-a" cy="-280" r="11" fill="#F2B33D"/><circle class="xp-tl xp-tl-g" cy="-250" r="11" fill="#3FBF5A"/></g>
        <g transform="translate(790 470)">${sh(0, 2, 80, 8)}<rect x="-70" y="-120" width="8" height="120" fill="#7A858F"/><rect x="62" y="-120" width="8" height="120" fill="#7A858F"/><path d="M-84-126h168l-8-14h-152z" fill="#1F6F66"/><rect x="-60" y="-50" width="120" height="10" rx="3" fill="#7A858F"/><rect x="-40" y="-110" width="80" height="44" rx="4" fill="#CFE6E1" opacity=".8"/></g>
        <g transform="translate(580 466)">${sh(0, 2, 20, 4)}<path d="M-16-50h32l-4 50h-24z" fill="#2E8B3E"/><rect x="-19" y="-56" width="38" height="9" rx="3" fill="#256F31"/></g>
        ${tree(60, 470, .95, 1)}<path d="M30 470h60l-6-30h-48z" fill="none" stroke="#C2502A" stroke-width="5"/>
        <g class="xp-auto"><g transform="translate(0 560)">${sh(40, 8, 60, 8)}<path d="M0 0v-44q0-20 22-26h40q16 0 24 18l14 26v26z" fill="#2E8B3E"/><path d="M8-44q2-16 18-20h30v34h-48z" fill="#F2C21E"/><rect x="64" y="-44" width="22" height="18" rx="3" fill="#6AA4C2"/><rect x="-6" y="-8" width="110" height="8" rx="3" fill="#2B2F35"/><circle cx="14" cy="4" r="12" fill="#2B2F35"/><circle cx="14" cy="4" r="5" fill="#C9D1D8"/><circle cx="88" cy="4" r="12" fill="#2B2F35"/><circle cx="88" cy="4" r="5" fill="#C9D1D8"/></g></g>`,
      near: '',
    };
  },
  museum(k) {
    const { u, sh } = k;
    const frame = (x, y, w, h, scene) => `<g>${sh(x + w / 2, y + h + 10, w / 2, 6, .5)}<rect x="${x - 12}" y="${y - 12}" width="${w + 24}" height="${h + 24}" rx="3" fill="#C9963A"/><rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#8E5E14"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F3E3C0"/>${scene}<rect x="${x - 12}" y="${y - 12}" width="${w + 24}" height="6" fill="#fff" opacity=".25"/></g>`;
    const kase = (x, y, w, h) => `<g>${sh(x + w / 2, y + h + 110, w / 2 + 20, 12)}<rect x="${x + 6}" y="${y + h}" width="${w - 12}" height="110" fill="${u('wooddark')}"/><rect x="${x}" y="${y + h}" width="${w}" height="14" fill="#5E3A1E"/><rect x="${x + 20}" y="${y + h + 30}" width="${w - 40}" height="50" rx="3" fill="none" stroke="#5E3A1E" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#DDEFF3" opacity=".35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#C9D1D8" stroke-width="4"/><path d="M${x + 10} ${y + 6}l30 ${h - 12}h16l-30-${h - 12}z" fill="#fff" opacity=".4"/><rect x="${x}" y="${y - 8}" width="${w}" height="10" fill="#5E3A1E"/></g>`;
    return {
      defs: `<linearGradient id="${k.P}-mwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A2E3E"/><stop offset="1" stop-color="#9C4256"/></linearGradient><linearGradient id="${k.P}-mfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A06E"/><stop offset="1" stop-color="#E1BF8C"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="url(#${k.P}-mwall)"/><rect width="${W}" height="40" fill="#F3E3C0"/><rect y="40" width="${W}" height="10" fill="#C9963A"/><rect y="400" width="${W}" height="18" fill="#F3E3C0"/>`,
      far: `<path d="M420 400V230a80 80 0 0 1 160 0V400z" fill="#F3E3C0"/><path d="M436 400V234a64 64 0 0 1 128 0V400z" fill="#4A1D28"/><path d="M436 400V300h128v100z" fill="#5E2A36"/><rect x="470" y="300" width="60" height="60" fill="#C9963A" opacity=".5"/>
        ${frame(110, 110, 150, 110, `<rect x="110" y="170" width="150" height="50" fill="#8CC05A"/><circle cx="220" cy="140" r="14" fill="#F2B33D"/><path d="M110 180l40-30 30 20 30-26 50 36v40h-150z" fill="#5E9B33"/>`)}
        ${frame(740, 110, 150, 110, `<rect x="740" y="110" width="150" height="110" fill="#1F3A5A"/><circle cx="815" cy="160" r="30" fill="#E8C99A"/><path d="M785 220q30-40 60 0z" fill="#8C3557"/><circle cx="805" cy="156" r="3" fill="#2B1A10"/><circle cx="825" cy="156" r="3" fill="#2B1A10"/>`)}
        ${[180, 500, 820].map(x => `<g><rect x="${x - 14}" y="40" width="28" height="18" rx="4" fill="#2B2F35"/><path d="M${x - 10} 58L${x - 110} 420H${x + 110}L${x + 10} 58z" fill="url(#${k.P}-cone)" class="xp-spot"/></g>`).join('')}`,
      mid: `<rect y="418" width="${W}" height="${H - 418}" fill="url(#${k.P}-mfloor)"/>${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 90 - 40}" y1="${H}" x2="${500 + (i * 90 - 540) * .35}" y2="418" stroke="#B38755" stroke-width="2"/>`).join('')}${[450, 500, 560].map(y => `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#B38755" stroke-width="1.5" opacity=".6"/>`).join('')}
        <rect y="418" width="${W}" height="30" fill="#fff" opacity=".08"/>
        ${kase(150, 280, 150, 110)}${kase(420, 300, 160, 110)}${kase(700, 280, 150, 110)}
        <g transform="translate(300 330)"><rect x="-26" y="-18" width="52" height="30" rx="3" fill="#F3E3C0"/><rect x="-20" y="-10" width="40" height="4" fill="#8E5E14"/><rect x="-20" y="0" width="28" height="3" fill="#8E5E14" opacity=".6"/></g>
        <g transform="translate(930 520)">${sh(0, 4, 50, 8)}<rect x="-40" y="-120" width="80" height="124" fill="#E8E1D3"/><rect x="-46" y="-130" width="92" height="14" fill="#D7CFC0"/><path d="M-26-130c0-40 10-60 26-60s26 20 26 60z" fill="#BDB5A6"/><circle cy="-206" r="22" fill="#CFC7B8"/><path d="M-16-212q16-14 32 0" stroke="#A9A194" stroke-width="4" fill="none"/></g>
        ${[180, 400, 600, 820].map(x => `<g transform="translate(${x} 560)">${sh(0, 4, 18, 4)}<rect x="-4" y="-60" width="8" height="60" fill="#C9963A"/><circle cy="-62" r="8" fill="#E1B64C"/><rect x="-14" y="-4" width="28" height="6" rx="3" fill="#8E5E14"/></g>`).join('')}
        <path d="M180 506Q290 540 400 506M400 506Q500 540 600 506M600 506Q710 540 820 506" stroke="#8C1F2E" stroke-width="7" fill="none" stroke-linecap="round"/>`,
      near: `<g transform="translate(500 600)">${sh(0, 2, 120, 8)}<rect x="-110" y="-30" width="220" height="16" rx="5" fill="${u('wooddark')}"/><rect x="-100" y="-14" width="10" height="20" fill="#5E3A1E"/><rect x="90" y="-14" width="10" height="20" fill="#5E3A1E"/></g>`,
    };
  },
  home(k) {
    const { u, sh, win } = k;
    return {
      defs: `<linearGradient id="${k.P}-hwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E0C4"/><stop offset="1" stop-color="#E9CFAA"/></linearGradient><linearGradient id="${k.P}-sofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3F8F86"/><stop offset="1" stop-color="#1F6F66"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="url(#${k.P}-hwall)"/><rect y="0" width="${W}" height="16" fill="#fff" opacity=".4"/><rect y="440" width="${W}" height="12" fill="#D6B98E"/>`,
      far: `${win(90, 110, 200, 170)}<g class="xp-curtain"><path d="M60 90h70q-10 120 6 220h-76z" fill="#C2502A"/><path d="M80 90v220M104 90v220" stroke="#A8401F" stroke-width="3"/></g><g class="xp-curtain xp-curtain-r"><path d="M320 90h-70q10 120-6 220h76z" fill="#C2502A"/><path d="M300 90v220M276 90v220" stroke="#A8401F" stroke-width="3"/></g><rect x="50" y="82" width="280" height="10" rx="4" fill="#7A4A2A"/>
        <g transform="translate(740 140)"><circle r="42" fill="#FFF9EF" stroke="#7A4A2A" stroke-width="7"/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-34" x2="0" y2="-30" stroke="#2B1A10" stroke-width="3" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0V-22" stroke="#2B1A10" stroke-width="4" stroke-linecap="round" transform="rotate(-60)"/><path d="M0 0V-28" stroke="#2B1A10" stroke-width="3" stroke-linecap="round" transform="rotate(60)"/><line class="xp-sec" x1="0" y1="6" x2="0" y2="-32" stroke="#C2502A" stroke-width="1.6"/><circle r="4" fill="#C2502A"/></g>
        <g transform="translate(800 250)"><rect x="-18" y="-24" width="36" height="48" rx="4" fill="#FFF9EF" stroke="#C9B48E" stroke-width="2"/><rect x="-10" y="-14" width="8" height="14" rx="2" fill="#555"/><rect x="2" y="-14" width="8" height="14" rx="2" fill="#555"/></g>
        <g transform="translate(500 0)"><rect x="-4" width="8" height="40" fill="#7A858F"/><ellipse cy="46" rx="20" ry="10" fill="#C9D1D8"/><g class="xp-fan" style="transform-origin:0px 46px"><path d="M0 46L-170 34q-10 12 0 22z" fill="#9AA5AF"/><path d="M0 46L170 58q10-12 0-22z" fill="#9AA5AF"/><path d="M0 46L-10 70l20 0z" fill="#9AA5AF" opacity=".6"/></g><ellipse cy="50" rx="12" ry="6" fill="#7A858F"/></g>
        <g transform="translate(880 440)">${sh(0, 2, 80, 8)}<rect x="-80" y="-300" width="160" height="300" rx="4" fill="${u('wooddark')}"/>${[-240, -170, -100].map(y => `<rect x="-70" y="${y}" width="140" height="8" fill="#5E3A1E"/>`).join('')}${[[-64, -292, '#C2502A'], [-48, -292, '#1F6F66'], [-30, -288, '#D98A1C'], [-12, -292, '#8C3557'], [20, -232, '#4C7424'], [36, -228, '#C2502A'], [52, -232, '#2A6FB0'], [-60, -162, '#D98A1C'], [-40, -162, '#1F6F66']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="14" height="${y === -288 || y === -228 ? 48 : 52}" rx="2" fill="${c}"/>`).join('')}<circle cx="30" cy="-128" r="18" fill="#C89255"/><rect x="-66" y="-90" width="60" height="80" rx="4" fill="#5E3A1E"/><rect x="4" y="-90" width="62" height="80" rx="4" fill="#5E3A1E"/></g>`,
      mid: `<rect y="452" width="${W}" height="${H - 452}" fill="url(#${k.P}-floor)"/>${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${470 + i * 22}" x2="${W}" y2="${470 + i * 22}" stroke="#A06B42" stroke-width="1.5" opacity=".5"/>`).join('')}
        <ellipse cx="500" cy="560" rx="320" ry="52" fill="#8C3557"/><ellipse cx="500" cy="560" rx="290" ry="42" fill="none" stroke="#F2B33D" stroke-width="4" stroke-dasharray="14 10"/>
        <g transform="translate(700 440)">${sh(0, 2, 110, 8)}<rect x="-100" y="-60" width="200" height="60" rx="5" fill="${u('wooddark')}"/><rect x="-90" y="-180" width="180" height="108" rx="6" fill="#1E2125"/><rect x="-82" y="-172" width="164" height="92" rx="3" fill="#2E3A48"/><path d="M-82-172l60 92h30l-60-92z" fill="#fff" opacity=".07"/><rect x="-20" y="-72" width="40" height="12" fill="#1E2125"/></g>
        <g transform="translate(440 500)">${sh(0, 4, 200, 14)}<rect x="-190" y="-130" width="380" height="90" rx="30" fill="url(#${k.P}-sofa)"/><rect x="-210" y="-80" width="60" height="80" rx="22" fill="#1F6F66"/><rect x="150" y="-80" width="60" height="80" rx="22" fill="#1F6F66"/><rect x="-160" y="-60" width="320" height="50" rx="16" fill="#2A8378"/><line x1="0" y1="-58" x2="0" y2="-12" stroke="#1F6F66" stroke-width="3"/><rect x="-130" y="-112" width="70" height="52" rx="14" fill="#F2B33D" transform="rotate(-8 -95 -86)"/><rect x="-196" y="-6" width="10" height="10" fill="#5E3A1E"/><rect x="186" y="-6" width="10" height="10" fill="#5E3A1E"/></g>
        <g transform="translate(500 570)">${sh(0, 2, 110, 10)}<rect x="-100" y="-40" width="200" height="14" rx="5" fill="${u('wood')}"/><rect x="-90" y="-26" width="10" height="28" fill="#8A5A36"/><rect x="80" y="-26" width="10" height="28" fill="#8A5A36"/><rect x="-30" y="-56" width="40" height="16" rx="3" fill="#FFF9EF"/><path d="M30-40c0-14 20-14 20 0z" fill="#C2502A"/></g>
        <g transform="translate(140 452)">${sh(0, 2, 30, 6)}<rect x="-4" y="-150" width="8" height="150" fill="#7A858F"/><path d="M-36-150h72l-14-50h-44z" fill="#F6DFB5"/><ellipse cy="-150" rx="36" ry="6" fill="#E9CFAA"/><path d="M-30-150l-40 150h140l-40-150z" fill="url(#${k.P}-cone)" opacity=".5"/></g>
        <g transform="translate(300 600)">${sh(0, 2, 34, 6)}<path d="M-26-40h52l-8 40h-36z" fill="#C2502A"/>${k.bush(0, -40, .6)}</g>
        <g transform="translate(940 452)"><rect x="-40" y="-260" width="80" height="260" fill="#9C6A3E"/><rect x="-32" y="-250" width="64" height="110" rx="3" fill="#B07740"/><rect x="-32" y="-130" width="64" height="120" rx="3" fill="#B07740"/><circle cx="-24" cy="-130" r="5" fill="#F2B33D"/></g>`,
      near: '',
    };
  },
  park(k) {
    const { u, sh, tree, bush, flower, tufts, rock } = k;
    return {
      defs: '',
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(110, 90)}${k.cloud(330, 80, 1)}${k.cloud(560, 40, .7, 60, 80)}${k.cloud(860, 130, .6)}
        <g class="xp-kite"><path d="M700 60l26 30-26 36-26-36z" fill="#E2483B"/><path d="M700 60v66M674 90h52" stroke="#fff" stroke-width="2" opacity=".7"/><path d="M700 126q-10 20 6 40t-4 40" stroke="#2B1A10" stroke-width="1.5" fill="none"/><path d="M700 150l-8 4 8 4zM704 176l-8 4 8 4z" fill="#F2B33D"/></g>`,
      far: `${k.hill(320, 70, u('hill2'), -40)}${[200, 260, 330, 690, 760].map((x, i) => k.tree(x, 330, .4, i % 3, false)).join('')}`,
      mid: `<rect y="320" width="${W}" height="${H - 320}" fill="${u('grass')}"/>
        <path d="M380 ${H}C420 540 300 470 420 410S560 360 520 320H600C640 370 520 400 560 450S700 560 640 ${H}Z" fill="#E7D2A6"/>
        ${tree(120, 410, 1.15, 1)}${tree(880, 400, 1.1, 0)}
        <g transform="translate(330 470)">${sh(0, 6, 90, 10)}<rect x="-80" y="-30" width="160" height="12" rx="4" fill="${u('wood')}"/><rect x="-80" y="-56" width="160" height="12" rx="4" fill="${u('wood')}"/><path d="M-74-44v50M74-44v50" stroke="#3A3F45" stroke-width="6"/></g>
        <g transform="translate(620 300)"><path d="M-90 130L-70 0H70L90 130" stroke="#C2502A" stroke-width="10" fill="none" stroke-linejoin="round"/>${sh(-30, 132, 30, 5)}${sh(32, 132, 30, 5)}
          <g class="xp-swing"><path d="M-40 0v84M-10 0v84" stroke="#555" stroke-width="2.5"/><rect x="-48" y="82" width="46" height="9" rx="3" fill="#F2B33D"/></g><g class="xp-swing xp-swing-2"><path d="M14 0v84M44 0v84" stroke="#555" stroke-width="2.5"/><rect x="6" y="82" width="46" height="9" rx="3" fill="#1F6F66"/></g></g>
        <g transform="translate(790 450)">${sh(20, 4, 90, 10)}<path d="M-60 0V-120M-30 0V-120" stroke="#9AA5AF" stroke-width="7"/>${[-100, -80, -60, -40, -20].map(y => `<path d="M-60 ${y}h30" stroke="#9AA5AF" stroke-width="5"/>`).join('')}<path d="M-30-120h14Q20-120 50-40T110 0" stroke="#E2483B" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M-30-130h30v10h-30z" fill="#E2483B"/></g>
        <g transform="translate(450 360)">${sh(0, 2, 18, 4)}<rect x="-4" y="-190" width="8" height="190" fill="#2B2F35"/><path d="M-18-190h36l-6-20h-24z" fill="#2B2F35"/><ellipse cy="-188" rx="12" ry="4" fill="#FFF3B8"/></g>
        <g transform="translate(100 470)">${sh(0, 2, 36, 6)}<path d="M-8 0h16l-4-50h-8z" fill="#BDB5A6"/><path d="M-40-52h80q-6 18-40 18t-40-18z" fill="#D7CFC0"/><ellipse cy="-52" rx="40" ry="8" fill="#5BB8D8"/><ellipse cx="-10" cy="-54" rx="12" ry="2" fill="#fff" opacity=".6"/></g>
        <g>${[[130, 560, '#E94B5A'], [170, 548, '#F2C21E'], [210, 562, '#F28A1E'], [250, 550, '#E94B5A'], [150, 590, '#F28A1E'], [230, 594, '#F2C21E']].map(([x, y, c]) => flower(x, y, c, 1.1)).join('')}</g>
        ${bush(700, 560, .9)}${rock(940, 580, .8)}<g transform="translate(560 470)">${sh(0, 2, 18, 4)}<path d="M-14-44h28l-4 44h-20z" fill="#2E8B3E"/><rect x="-16" y="-50" width="32" height="8" rx="3" fill="#256F31"/></g>`,
      near: tufts(H + 4, 34),
    };
  },
  pond(k) {
    const { u, sh, tree, tufts, rock } = k;
    const lily = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0L30-4A32 12 0 1 1 26 6z" fill="#4E9A35"/><path d="M0 0L30-4A32 12 0 0 0 -20-8" fill="#6DB548"/><path d="M-20 0h30" stroke="#3E7F2C" stroke-width="1.5"/></g>`;
    const reeds = (x, y, flip = 1) => `<g transform="translate(${x} ${y}) scale(${flip} 1)">${Array.from({ length: 7 }, (_, i) => `<g class="xp-reed" style="animation-delay:${-i * .5}s"><path d="M${i * 12} 0q${4 + i} -${80 + i * 14} ${-6 + i * 2} -${150 + (i % 3) * 30}" stroke="${i % 2 ? '#4E8A2E' : '#6DA544'}" stroke-width="5" fill="none" stroke-linecap="round"/>${i % 2 ? `<rect x="${i * 12 - 9 + i * 2}" y="-${150 + (i % 3) * 30}" width="9" height="30" rx="4.5" fill="#7A4A2A"/>` : ''}</g>`).join('')}</g>`;
    return {
      defs: `<linearGradient id="${k.P}-pond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5DB7C9"/><stop offset="1" stop-color="#2A7489"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(780, 80)}${k.cloud(300, 70, 1)}${k.cloud(560, 120, .6, 50, 60)}${k.birds(140, 140)}`,
      far: `${k.hill(290, 70, u('hill2'), 20)}${[60, 160, 260, 380, 620, 720, 820, 940].map((x, i) => tree(x, 300, .5 + (i % 3) * .08, i % 3, false)).join('')}`,
      mid: `<rect y="290" width="${W}" height="${H - 290}" fill="${u('grass')}"/>
        <path d="M40 330C200 300 800 300 960 330C1010 420 990 540 880 570C700 610 300 610 120 570C10 540-10 420 40 330Z" fill="#8A6A44"/>
        <path d="M60 340C220 312 780 312 940 340C985 420 970 530 870 556C700 596 300 596 130 556C30 530 15 420 60 340Z" fill="url(#${k.P}-pond)"/>
        <path d="M100 350C260 330 740 330 900 350" stroke="#fff" stroke-width="3" opacity=".35" fill="none"/>
        
        ${[[300, 470], [560, 420], [760, 500], [430, 520]].map(([x, y], i) => `<ellipse class="xp-ripple" style="animation-delay:${i * .9}s" cx="${x}" cy="${y}" rx="50" ry="12" fill="none" stroke="#fff" stroke-width="2.5"/>`).join('')}
        ${lily(380, 430, 1.2)}${lily(460, 470, .9)}${lily(640, 450, 1.1)}${lily(720, 400, .8)}${lily(260, 400, .9)}${lily(560, 520, 1)}
        <g transform="translate(620 400)"><path d="M0 0q-18-10-16-30q10 8 16 30z" fill="#F3A6C0"/><path d="M0 0q18-10 16-30q-10 8-16 30z" fill="#F3A6C0"/><path d="M0 0q-8-20 0-40q8 20 0 40z" fill="#F7C3D5"/><path d="M0 0q-26 0-30-16q16 0 30 16zM0 0q26 0 30-16q-16 0-30 16z" fill="#E987A8"/></g>
        ${reeds(30, 400)}${reeds(970, 400, -1)}${rock(240, 560, 1.1)}${rock(790, 575, .8)}
        <path d="M0 160C80 150 150 170 220 200" stroke="#6B4423" stroke-width="16" fill="none" stroke-linecap="round"/>${[[90, 150], [150, 180], [200, 200], [120, 190]].map(([x, y]) => `<g fill="#4E9A35"><ellipse cx="${x}" cy="${y + 14}" rx="18" ry="8" transform="rotate(30 ${x} ${y + 14})"/><ellipse cx="${x + 10}" cy="${y + 22}" rx="14" ry="6" fill="#6DB548"/></g>`).join('')}`,
      near: tufts(H + 4, 30, ['#4E8A2E', '#6DA544', '#8FC05A']),
    };
  },
  bicycle(k) {
    const { u, sh } = k;
    const R = [270, 420], F = [730, 420], BB = [480, 440];
    const wheel = ([x, y]) => `<g><circle cx="${x}" cy="${y}" r="143" fill="none" stroke="#2B2F35" stroke-width="16"/><circle cx="${x}" cy="${y}" r="143" fill="none" stroke="#3A3F45" stroke-width="16" stroke-dasharray="4 7"/><circle cx="${x}" cy="${y}" r="133" fill="none" stroke="url(#${k.P}-chrome)" stroke-width="6"/>
      <g stroke="#B7C0C8" stroke-width="1.6">${Array.from({ length: 18 }, (_, i) => { const a = i * Math.PI / 9, b = a + .5; return `<line x1="${r1(x + Math.cos(a) * 10)}" y1="${r1(y + Math.sin(a) * 10)}" x2="${r1(x + Math.cos(b) * 131)}" y2="${r1(y + Math.sin(b) * 131)}"/>`; }).join('')}</g><circle cx="${x}" cy="${y}" r="14" fill="url(#${k.P}-metal)"/><circle cx="${x}" cy="${y}" r="5" fill="#555"/></g>`;
    const tube = (a, b, w = 14, c = '#1F5FA8') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const ST = [440, 250], HT1 = [650, 258], HT2 = [668, 312];
    return {
      defs: `<linearGradient id="${k.P}-peg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE4D2"/><stop offset="1" stop-color="#E2D3BA"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="url(#${k.P}-peg)"/><g fill="#CDBB9C">${Array.from({ length: 20 * 12 }, (_, i) => `<circle cx="${25 + (i % 20) * 50}" cy="${25 + Math.floor(i / 20) * 46}" r="3"/>`).join('')}</g>`,
      far: `<rect y="570" width="${W}" height="${H - 570}" fill="#9C8A72"/><rect y="570" width="${W}" height="6" fill="#7E6E58"/>`,
      mid: `${sh(500, 574, 380, 16)}
        <path d="M${R[0] - 158} ${R[1] - 30}A160 160 0 0 1 ${R[0] + 120} ${R[1] - 110}" stroke="#C9D1D8" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M${F[0] - 120} ${F[1] - 110}A160 160 0 0 1 ${F[0] + 158} ${F[1] - 30}" stroke="#C9D1D8" stroke-width="12" fill="none" stroke-linecap="round"/>
        ${wheel(R)}${wheel(F)}
        <path d="M${F[0] + 88} ${F[1] - 108}l8-12" stroke="#555" stroke-width="5" stroke-linecap="round"/>
        <g stroke="#3A3F45" stroke-width="5">${tube([200, 262], [420, 262], 7, '#3A3F45')}${tube([210, 262], R, 5, '#3A3F45')}${tube([380, 262], R, 5, '#3A3F45')}</g><rect x="182" y="262" width="22" height="12" rx="3" fill="#E2483B"/><rect x="186" y="264" width="8" height="5" fill="#fff" opacity=".6"/>
        <path d="M${R[0]} ${R[1] - 18}L${BB[0]} ${BB[1] - 42}M${R[0]} ${R[1] + 18}L${BB[0]} ${BB[1] + 42}" stroke="#4A4E55" stroke-width="7" stroke-dasharray="6 3" class="xp-chain"/>
        <circle cx="${R[0]}" cy="${R[1]}" r="20" fill="#7A858F"/><circle cx="${R[0]}" cy="${R[1]}" r="20" fill="none" stroke="#4A4E55" stroke-width="4" stroke-dasharray="3 3"/>
        ${tube(R, BB, 12)}${tube(R, [446, 270], 11)}${tube(BB, ST)}${tube([444, 262], HT1)}${tube(HT2, BB, 16)}
        <path d="M${HT2[0]} ${HT2[1]}Q${F[0] - 20} ${F[1] - 70} ${F[0]} ${F[1]}" stroke="#1F5FA8" stroke-width="11" fill="none" stroke-linecap="round"/>${tube(HT1, HT2, 18, '#174E8C')}
        <path d="M${ST[0] - 4} ${ST[1]}l-4-26" stroke="url(#${k.P}-chrome)" stroke-width="10" stroke-linecap="round"/>
        <path d="M392 222q38-14 80 0q4 10-8 14h-60q-16-2-12-14z" fill="#2B2F35"/><path d="M400 222q30-8 64 0" stroke="#555B62" stroke-width="3" fill="none"/>
        <path d="M${HT1[0] - 2} ${HT1[1]}l-6-44" stroke="url(#${k.P}-chrome)" stroke-width="9" stroke-linecap="round"/><path d="M644 214q-20-4-50 0q-12 2-8 10" stroke="url(#${k.P}-chrome)" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="574" y="208" width="30" height="13" rx="6" fill="#2B2F35"/><path d="M600 222q12 6 22 2" stroke="#555" stroke-width="4" fill="none" stroke-linecap="round"/>
        <g transform="translate(656 212)"><circle r="9" fill="url(#${k.P}-metal)"/><circle cx="-2" cy="-3" r="3" fill="#fff" opacity=".7"/></g>
        <g transform="translate(688 282)"><path d="M0-12h18l6 12-6 12h-18z" fill="#2B2F35"/><ellipse cx="22" rx="5" ry="11" fill="#FFF3B8"/></g>
        <path d="M712 284h28M270 284h32" stroke="#555" stroke-width="7" stroke-linecap="round"/><rect x="718" y="278" width="10" height="16" rx="2" fill="#2B2F35"/><rect x="283" y="282" width="10" height="16" rx="2" fill="#2B2F35"/>
        <circle cx="${BB[0]}" cy="${BB[1]}" r="44" fill="#9AA5AF"/><circle cx="${BB[0]}" cy="${BB[1]}" r="44" fill="none" stroke="#6B757E" stroke-width="6" stroke-dasharray="4 4"/><circle cx="${BB[0]}" cy="${BB[1]}" r="30" fill="url(#${k.P}-metal)"/><circle cx="${BB[0]}" cy="${BB[1]}" r="9" fill="#555"/>
        <line x1="${BB[0]}" y1="${BB[1]}" x2="514" y2="500" stroke="url(#${k.P}-chrome)" stroke-width="10" stroke-linecap="round"/><rect x="496" y="498" width="44" height="14" rx="4" fill="#2B2F35"/><rect x="500" y="501" width="36" height="3" fill="#F2B33D"/>
        <path d="M330 432L312 548" stroke="#555" stroke-width="7" stroke-linecap="round"/><path d="M300 550h24" stroke="#555" stroke-width="6" stroke-linecap="round"/>`,
      near: '',
    };
  },
  workshop(k) {
    const { u, sh } = k;
    const outline = (d) => `<path d="${d}" fill="none" stroke="#B9A27E" stroke-width="3" stroke-dasharray="5 4"/>`;
    return {
      defs: `<linearGradient id="${k.P}-peg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9B98A"/><stop offset="1" stop-color="#C9A675"/></linearGradient><linearGradient id="${k.P}-wwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCE3E6"/><stop offset="1" stop-color="#C6D0D4"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="url(#${k.P}-wwall)"/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 34}" x2="${W}" y2="${i * 34}" stroke="#B8C3C8" stroke-width="1.5"/>`).join('')}`,
      far: `<rect x="40" y="60" width="700" height="250" rx="6" fill="url(#${k.P}-peg2)"/><rect x="40" y="60" width="700" height="250" rx="6" fill="none" stroke="#A9844E" stroke-width="8"/><g fill="#A9844E">${Array.from({ length: 23 * 8 }, (_, i) => `<circle cx="${62 + (i % 23) * 30}" cy="${80 + Math.floor(i / 23) * 30}" r="3"/>`).join('')}</g>
        <g transform="translate(120 150)">${outline('M-40-40h80v26h-80zM-6-14h12v80h-12z')}<rect x="-40" y="-44" width="80" height="26" rx="5" fill="url(#${k.P}-metal)"/><rect x="-6" y="-18" width="12" height="86" rx="5" fill="#A86F3F"/></g>
        <g transform="translate(262 140)"><path d="M-50-50h100l10 24-110 0z" fill="#8A5A36"/><path d="M-60-26h110l-6 110-90-30z" fill="url(#${k.P}-metal)"/><path d="M-56 54l90 30" stroke="#6B757E" stroke-width="3" stroke-dasharray="3 3"/></g>
        <g transform="translate(380 140)"><path d="M-6-60h12v110h-12z" fill="url(#${k.P}-chrome)"/><path d="M-18-74a18 18 0 1 0 36 0l-10 0v12h-16v-12z" fill="#9AA5AF"/><circle cy="58" r="16" fill="none" stroke="#9AA5AF" stroke-width="10"/></g>
        <g transform="translate(460 150)"><rect x="-10" y="-70" width="20" height="56" rx="8" fill="#E2483B"/><rect x="-10" y="-70" width="6" height="56" rx="3" fill="#fff" opacity=".3"/><rect x="-3" y="-16" width="6" height="80" fill="url(#${k.P}-chrome)"/></g>
        <g transform="translate(540 150)"><path d="M-14-70q-6 40 10 70M14-70q6 40-10 70" stroke="#2F6FB0" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-4 0l-6 50M4 0l6 50" stroke="#9AA5AF" stroke-width="9" stroke-linecap="round"/><circle cy="2" r="6" fill="#555"/></g>
        <g transform="translate(620 140)"><path d="M-30-60h18v110h-18z" fill="#A86F3F"/><path d="M-12-60h70v16h-70z" fill="url(#${k.P}-metal)"/></g>
        <g transform="translate(705 150)"><rect x="-8" y="-70" width="16" height="50" rx="5" fill="#C89255"/><path d="M-5-20h10v70l-5 10-5-10z" fill="url(#${k.P}-chrome)"/></g>
        <rect x="780" y="140" width="190" height="10" rx="3" fill="${u('wooddark')}"/><rect x="780" y="300" width="190" height="10" rx="3" fill="${u('wooddark')}"/>
        <g transform="translate(860 140)"><path d="M-22 0v-46h44v46z" fill="#2E8B3E"/><path d="M-12-46v-14h24v14" fill="#9AA5AF"/><path d="M12-56q22-4 26 14" stroke="#9AA5AF" stroke-width="4" fill="none"/></g><g transform="translate(800 140)"><rect x="-14" y="-40" width="28" height="40" rx="4" fill="#F2F0E8"/><rect x="-14" y="-24" width="28" height="12" fill="#2A6FB0"/><rect x="-6" y="-50" width="12" height="10" fill="#E2483B"/></g>
        <g transform="translate(900 300)">${[[-50, '#C2502A'], [-10, '#1F6F66'], [30, '#F2B33D']].map(([x, c]) => `<g transform="translate(${x} 0)"><rect x="-17" y="-52" width="34" height="52" rx="3" fill="url(#${k.P}-metal)"/><rect x="-17" y="-40" width="34" height="24" fill="${c}"/><ellipse cy="-52" rx="17" ry="4" fill="#9AA5AF"/></g>`).join('')}</g>
        <g transform="translate(400 0)"><g class="xp-hanglamp"><line x1="0" y1="0" x2="0" y2="40" stroke="#2B2F35" stroke-width="3"/><path d="M-30 64h60l-12-24h-36z" fill="#2B2F35"/><ellipse cy="64" rx="30" ry="6" fill="#FFF3B8"/><path d="M-28 64L-180 400H180L28 64z" fill="url(#${k.P}-cone)"/></g></g>`,
      mid: `<rect y="470" width="${W}" height="${H - 470}" fill="#A8A29A"/>${[[120, 590], [300, 560], [520, 600], [700, 570], [880, 600]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="40" ry="6" fill="#D9B98A" opacity=".6"/>`).join('')}
        ${sh(400, 474, 380, 14)}<rect x="30" y="378" width="740" height="24" rx="4" fill="${u('wood')}"/><rect x="30" y="378" width="740" height="6" rx="3" fill="#fff" opacity=".25"/><rect x="40" y="402" width="720" height="10" fill="#8A5A36"/><rect x="50" y="402" width="24" height="70" fill="#8A5A36"/><rect x="726" y="402" width="24" height="70" fill="#8A5A36"/>
        <rect x="190" y="412" width="220" height="56" rx="4" fill="#9C6A3E"/><rect x="200" y="420" width="200" height="40" rx="3" fill="#B07740"/><rect x="280" y="434" width="40" height="8" rx="4" fill="url(#${k.P}-metal)"/>
        <g transform="translate(90 378)"><rect x="-40" y="-36" width="18" height="36" fill="#2F6FB0"/><rect x="22" y="-36" width="18" height="36" fill="#2F6FB0"/><rect x="-22" y="-26" width="44" height="22" fill="#8A949E"/><rect x="-60" y="-24" width="20" height="8" rx="3" fill="url(#${k.P}-chrome)"/><circle cx="-62" cy="-20" r="7" fill="#555"/></g>
        <g transform="translate(320 378)"><rect x="-120" y="-14" width="240" height="14" fill="#E2B27A"/><path d="M-120-14h240" stroke="#C48A52" stroke-width="2"/><path d="M-80-8q40-4 80 0t80 0" stroke="#C48A52" stroke-width="1.5" fill="none"/></g>
        <g transform="translate(440 362)"><path d="M-16-26h32v8h-10v28h10v8h-32v-8h10v-28h-10z" fill="#E2483B"/><rect x="-3" y="-44" width="6" height="22" fill="url(#${k.P}-chrome)"/></g>
        <g transform="translate(580 378)"><path d="M-40-8h60v-14h-60z" fill="#9AA5AF"/><circle cx="-10" cy="-30" r="20" fill="none" stroke="#9AA5AF" stroke-width="6"/><rect x="20" y="-18" width="40" height="6" fill="url(#${k.P}-chrome)"/><rect x="-60" y="-20" width="22" height="12" rx="5" fill="#A86F3F"/></g>
        <g transform="translate(680 378)"><rect x="-22" y="-34" width="44" height="34" rx="4" fill="url(#${k.P}-metal)"/><g stroke="#555" stroke-width="2">${[-12, -4, 4, 12].map(x => `<line x1="${x}" y1="-34" x2="${x + 3}" y2="-46"/>`).join('')}</g></g>
        <g transform="translate(220 378)"><circle cy="-16" r="16" fill="#F2B33D"/><circle cy="-16" r="6" fill="#2B2F35"/><rect x="10" y="-10" width="30" height="5" fill="#F2F0E8"/></g>
        <rect x="480" y="368" width="54" height="10" rx="2" fill="#C8A26A" transform="rotate(-4 507 373)"/>
        <g transform="translate(820 600)">${sh(0, 2, 50, 8)}<ellipse cy="-90" rx="46" ry="10" fill="${u('wood')}"/><path d="M-36-86l-10 86M36-86l10 86M0-86v86" stroke="#8A5A36" stroke-width="7"/><path d="M-40-30h80" stroke="#8A5A36" stroke-width="5"/></g>`,
      near: '',
    };
  },
  market(k) {
    const { u, sh } = k;
    const heap = (x, y, col, n = 12, r = 9) => { const RR = k.R; let o = ''; for (let i = 0; i < n; i++) { const row = Math.floor(i / 5), cx = x + (i % 5 - 2) * r * 1.7 + row * r * .8, cy = y - row * r * 1.3; o += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${col}"/><circle cx="${r1(cx - r * .3)}" cy="${r1(cy - r * .35)}" r="${r * .3}" fill="#fff" opacity=".45"/>`; } return o; };
    const stall = (x, c1, c2, goods) => `<g>${sh(x, 470, 150, 14)}<rect x="${x - 130}" y="220" width="8" height="250" fill="#7A4A2A"/><rect x="${x + 122}" y="220" width="8" height="250" fill="#7A4A2A"/>
      <path d="M${x - 150} 230L${x - 120} 170H${x + 120}L${x + 150} 230Z" fill="${c1}"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${x - 150 + i * 50 + 12} 230L${x - 120 + i * 40 + 10} 170H${x - 120 + i * 40 + 30}L${x - 150 + i * 50 + 37} 230Z" fill="${c2}"/>`).join('')}<path d="M${x - 150} 230${Array.from({ length: 10 }, () => 'q7.5 12 15 0t15 0').join('')}" fill="${c1}"/>
      <rect x="${x - 140}" y="370" width="280" height="18" rx="4" fill="${u('wood')}"/><rect x="${x - 130}" y="388" width="260" height="80" fill="${u('wooddark')}"/>${[0, 1, 2].map(i => `<rect x="${x - 120 + i * 82}" y="330" width="74" height="40" rx="4" fill="#C89255"/><path d="M${x - 118 + i * 82} 345h70M${x - 118 + i * 82} 357h70" stroke="#A86F3F" stroke-width="2"/>`).join('')}${goods}</g>`;
    return {
      defs: '',
      back: `<rect width="${W}" height="${H}" fill="${u('sky')}"/>${k.stars()}${k.sun(500, 60)}${k.cloud(180, 60, .8)}${k.cloud(840, 90, .7, 50, 70)}`,
      far: `<g>${[[0, 110, 160, '#E9CFAA'], [150, 90, 120, '#F3D3C5'], [260, 130, 140, '#CFE6E1'], [620, 100, 150, '#F6DFB5'], [760, 120, 120, '#EED0DC'], [870, 90, 140, '#E9CFAA']].map(([x, y, w, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${330 - y}" fill="${c}"/><g fill="#8DB3C8">${[0, 1, 2].map(i => `<rect x="${x + 16 + i * (w / 3)}" y="${y + 20}" width="${w / 3 - 26}" height="30" rx="3"/>`).join('')}</g>`).join('')}</g>
        <path d="M0 40Q250 100 500 50T${W} 60" stroke="#7A4A2A" stroke-width="2" fill="none"/><g class="xp-bunting">${Array.from({ length: 20 }, (_, i) => { const x = 20 + i * 50, y = 40 + Math.sin(i / 3) * 18 + (i < 10 ? i * 2.4 : (20 - i) * 1.4); return `<path d="M${x} ${r1(y)}h26l-13 26z" fill="${['#E2483B', '#F2B33D', '#1F6F66', '#8C3557', '#4C7424'][i % 5]}"/>`; }).join('')}</g>`,
      mid: `<rect y="330" width="${W}" height="${H - 330}" fill="#D9C3A0"/><rect y="330" width="${W}" height="20" fill="#C9B08A"/>${Array.from({ length: 30 }, (_, i) => `<ellipse cx="${(i * 97) % W}" cy="${380 + (i * 41) % 230}" rx="${6 + (i % 4) * 3}" ry="2" fill="#B89E78"/>`).join('')}
        ${stall(180, '#E2483B', '#FFF4DA', heap(110, 324, '#E2483B') + heap(192, 324, '#F28A1E') + heap(274, 324, '#7BB342'))}
        ${stall(500, '#1F6F66', '#E6F2EF', heap(430, 324, '#7A3E8E') + heap(512, 324, '#F2C21E', 10, 10) + heap(594, 324, '#C2342A'))}
        ${stall(820, '#D98A1C', '#FFF4DA', heap(750, 324, '#4C9A35') + heap(832, 324, '#F2B33D') + heap(914, 324, '#E86A3A'))}
        <g transform="translate(560 300)"><rect x="-4" y="-40" width="8" height="40" fill="#555"/><path d="M-50-40h100" stroke="#555" stroke-width="5"/><path d="M-50-40l-14 26h28zM50-40l-14 26h28z" fill="none" stroke="#555" stroke-width="2"/><ellipse cx="-50" cy="-14" rx="18" ry="5" fill="url(#${k.P}-metal)"/><ellipse cx="50" cy="-14" rx="18" ry="5" fill="url(#${k.P}-metal)"/></g>
        <g transform="translate(420 290)"><rect x="-26" y="-20" width="52" height="36" rx="3" fill="#2B2F35"/><rect x="-26" y="-20" width="52" height="36" rx="3" fill="none" stroke="#A86F3F" stroke-width="4"/><path d="M-14-6h28M-14 4h18" stroke="#F2F0E8" stroke-width="3" stroke-linecap="round"/></g>
        <g transform="translate(80 520)">${sh(0, 4, 50, 8)}<path d="M-40 0q-6-50 10-70h60q16 20 10 70z" fill="#D9C08A"/><path d="M-30-70q30 10 60 0" stroke="#B89E68" stroke-width="3" fill="none"/><path d="M-36-30h72" stroke="#B89E68" stroke-width="2"/></g>
        <g transform="translate(280 540)">${sh(0, 4, 56, 8)}<path d="M-50-30h100l-10 34h-80z" fill="#C89255"/><path d="M-50-30h100" stroke="#A86F3F" stroke-width="5"/><path d="M-44-20h88M-40-8h80" stroke="#A86F3F" stroke-width="2"/>${heap(270, 506, '#F28A1E', 6, 10)}</g>
        <g transform="translate(720 520)">${sh(0, 50, 130, 10)}<rect x="-120" y="-30" width="240" height="40" rx="6" fill="#4C7424"/><rect x="-120" y="-30" width="240" height="10" rx="5" fill="#6DA544"/>${heap(-50, -38, '#F2C21E', 10, 11)}<circle cx="-80" cy="34" r="30" fill="#2B2F35"/><circle cx="-80" cy="34" r="12" fill="#9AA5AF"/><circle cx="80" cy="34" r="30" fill="#2B2F35"/><circle cx="80" cy="34" r="12" fill="#9AA5AF"/><path d="M120-20l50-20" stroke="#7A4A2A" stroke-width="7" stroke-linecap="round"/>${heap(40, -38, '#E2483B', 10, 10)}</g>`,
      near: '',
    };
  },
  bathroom(k) {
    const { u, sh, tiles } = k;
    return {
      defs: '',
      back: `${tiles(0, 0, W, 460, 50, '#D8ECF2', '#B9D6DF')}<rect y="300" width="${W}" height="12" fill="#2A8378" opacity=".5"/>`,
      far: `<g transform="translate(120 90)"><rect x="-70" y="-50" width="140" height="100" rx="6" fill="#FFF9EF"/><rect x="-60" y="-40" width="120" height="80" fill="#EAF4F6"/><rect x="-60" y="-40" width="120" height="80" fill="${u('glass')}"/><line x1="0" y1="-40" x2="0" y2="40" stroke="#FFF9EF" stroke-width="5"/><path d="M-54-34l40 68M10-34l40 68" stroke="#fff" stroke-width="6" opacity=".6"/></g>
        <g transform="translate(220 150)"><rect x="-70" y="-90" width="140" height="150" rx="12" fill="#C9D1D8"/><rect x="-62" y="-82" width="124" height="134" rx="8" fill="#BFE2EC"/><path d="M-50-70l40 110h20l-40-110z" fill="#fff" opacity=".5"/></g>
        <g transform="translate(560 90)">${sh(0, 54, 40, 6, .5)}<rect x="-40" y="-50" width="80" height="100" rx="30" fill="#F2F0E8"/><rect x="-40" y="-50" width="20" height="100" rx="10" fill="#fff" opacity=".6"/><circle cx="20" cy="20" r="6" fill="#E2483B"/><path d="M-14 50v40M14 50v40" stroke="url(#${k.P}-chrome)" stroke-width="6"/></g>
        <g transform="translate(500 240)"><rect x="-80" y="-4" width="160" height="8" rx="4" fill="url(#${k.P}-chrome)"/><path d="M-60 4h90v80q-40 10-90 0z" fill="#E2483B"/><path d="M-60 4h90v12h-90z" fill="#C2342A"/><path d="M-50 20v60M-30 20v62M-10 20v62M10 20v62" stroke="#C2342A" stroke-width="2"/></g>
        <g transform="translate(840 100)"><path d="M120-100v60q0 20-20 20H40" stroke="url(#${k.P}-chrome)" stroke-width="10" fill="none"/><path d="M10-30h50l-6 24h-38z" fill="url(#${k.P}-metal)"/><ellipse cx="35" cy="-6" rx="22" ry="5" fill="#9AA5AF"/>${[0, 1, 2, 3, 4].map(i => `<line class="xp-shower" style="animation-delay:${i * .2}s" x1="${20 + i * 8}" y1="4" x2="${18 + i * 8}" y2="22" stroke="#7CC7E0" stroke-width="3" stroke-linecap="round"/>`).join('')}<path d="M100 -20v300" stroke="url(#${k.P}-chrome)" stroke-width="8"/><rect x="88" y="180" width="24" height="16" rx="4" fill="#9AA5AF"/></g>`,
      mid: `${tiles(0, 460, W, H - 460, 60, '#E7E2D8', '#CFC8BA')}<rect y="456" width="${W}" height="8" fill="#B9B1A2"/>
        <g transform="translate(220 340)">${sh(0, 120, 60, 8)}<rect x="-12" y="20" width="24" height="100" rx="8" fill="#F2F0E8"/><path d="M-90-20h180q0 50-90 50t-90-50z" fill="#F7F5F0"/><path d="M-90-20h180v-8h-180z" fill="#E7E2D8"/><ellipse cy="-20" rx="70" ry="10" fill="#D8ECF2"/>
          <path d="M0-28v-36q0-8 8-8h22" stroke="url(#${k.P}-chrome)" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="-10" y="-50" width="20" height="10" rx="3" fill="#9AA5AF"/><circle class="xp-drip" cx="30" cy="-70" r="4" fill="#5BB8D8"/>
          <g transform="translate(66 -32)"><ellipse rx="18" ry="5" fill="#9AA5AF"/><rect x="-12" y="-12" width="24" height="10" rx="5" fill="#F3A6C0"/></g></g>
        <g transform="translate(700 470)">${sh(0, 4, 80, 10)}<path d="M-50-150h100v60h-100z" fill="#F7F5F0"/><rect x="-54" y="-156" width="108" height="10" rx="4" fill="#E7E2D8"/><path d="M-60-90h120q0 60-40 70v20h-40v-20q-40-10-40-70z" fill="#F7F5F0"/><ellipse cy="-90" rx="60" ry="12" fill="#E7E2D8"/><ellipse cy="-90" rx="46" ry="8" fill="#D8ECF2"/><path d="M-50-150h20v58h-20z" fill="#fff" opacity=".6"/><rect x="34" y="-144" width="12" height="6" rx="3" fill="#9AA5AF"/></g>
        <g transform="translate(300 560)">${sh(0, 4, 56, 9)}<path d="M-46-80h92l-10 82h-72z" fill="#2A6FB0"/><ellipse cy="-80" rx="46" ry="10" fill="#1F5A94"/><ellipse cy="-78" rx="38" ry="7" fill="#7CC7E0"/><path d="M-40-80q40-40 80 0" stroke="#555" stroke-width="3" fill="none"/><path d="M-36-70h14v66h-10z" fill="#fff" opacity=".2"/></g>
        <g transform="translate(372 576)">${sh(0, 2, 26, 5)}<path d="M-18-36h30l-3 36h-24z" fill="#F2B33D"/><path d="M12-30q16 0 14 14t-16 10" stroke="#F2B33D" stroke-width="5" fill="none"/></g>
        <path d="M0 500h80q20 0 20-20v-60" stroke="url(#${k.P}-chrome)" stroke-width="8" fill="none"/><path d="M420 470v40q0 20 20 20h120" stroke="url(#${k.P}-chrome)" stroke-width="8" fill="none"/>
        <g transform="translate(500 586)"><circle r="18" fill="#9AA5AF"/><g stroke="#555" stroke-width="2">${[-8, -2, 4, 10].map(x => `<line x1="${x}" y1="-12" x2="${x}" y2="12"/>`).join('')}</g></g>`,
      near: '',
    };
  },
};

/* ================================================================================================
   The lab
   ============================================================================================== */
export function mount(stage, cfg, api) {
  const { gsap, Draggable } = api;
  const P = `xp${++UID}`;
  const sceneName = SCENES[cfg.scene] ? cfg.scene : 'garden';
  const tool = ['magnifier', 'tap', 'camera'].includes(cfg.tool) ? cfg.tool : 'tap';
  const diagram = sceneName === 'bicycle' || sceneName === 'workshop';
  const anchors = ANCHORS[sceneName] || {};
  const spots = (cfg.hotspots || []).map((h, i) => {
    let x = h.x, y = h.y;
    if (h.at && anchors[h.at]) [x, y] = anchors[h.at];
    if (!Number.isFinite(+x) || !Number.isFinite(+y)) return null;
    return { ...h, i, x: clamp(+x, 2, 98) * W / 100, y: clamp(+y, 3, 97) * H / 100, s: clamp(+h.size || 1, .4, 2.5), found: false };
  }).filter(Boolean).map((s, i) => ({ ...s, i }));
  if (!spots.length) { stage.innerHTML = '<div class="lab-err"><p>This lab has nothing to find yet.</p></div>'; return { destroy() {} }; }
  const need = clamp(Math.round(cfg.find || spots.length), 1, spots.length);
  const identify = cfg.identify ?? diagram;
  const k = kit(P, 7 + sceneName.length * 31);
  k.P = P;
  const S = SCENES[sceneName](k);
  const timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, api.reduced ? Math.min(ms, 60) : ms); timers.push(t); return t; };
  let target = null, foundN = 0, hintsUsed = 0, done = false, busy = false;

  /* ---------- markup ---------- */
  const ART = 72; // hotspot art size in scene units
  function svgArt(item, size) {
    if (item.sprite && api.hasSprite(item.sprite)) {
      return api.sprite(item.sprite).replace(/^<svg[^>]*>/, `<svg x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="visible">`);
    }
    const e = item.emoji || EMO[item.sprite] || '✨';
    return `<text x="0" y="${size * .06}" font-size="${size * .78}" text-anchor="middle" dominant-baseline="central">${esc(e)}</text>`;
  }
  function spotMarkup(s, copy) {
    const size = ART * s.s;
    const cls = `xp-hs${s.hidden ? ' is-hidden' : ''}${s.found ? ' is-found' : ''}`;
    if (diagram) {
      return `<g class="${cls} xp-mk" data-i="${s.i}" transform="translate(${r1(s.x)} ${r1(s.y)})"${copy ? '' : ` role="button" tabindex="${tool === 'tap' && !s.hidden ? 0 : -1}" aria-label="Part ${s.i + 1}"`}>
        <circle class="xp-mk-halo" r="20"/><circle class="xp-mk-dot" r="15"/><text class="xp-mk-n" y="1" text-anchor="middle" dominant-baseline="central">${s.i + 1}</text>
        <path class="xp-mk-ok" d="M-7 0l5 5 9-10" /><circle class="xp-hit" r="${Math.max(30, 34 * s.s)}"/></g>`;
    }
    return `<g class="${cls}" data-i="${s.i}" transform="translate(${r1(s.x)} ${r1(s.y)})"${copy ? '' : ` role="button" tabindex="${tool === 'tap' ? 0 : -1}" aria-label="${s.found ? esc(s.label) : 'Something to find'}"`}>
      ${copy && s.hidden ? `<circle class="xp-reveal" r="${size * .62}" fill="url(#${P}-glow)"/>` : ''}
      <ellipse class="xp-hs-sh" cx="0" cy="${r1(size * .44)}" rx="${r1(size * .34)}" ry="${r1(size * .08)}" fill="url(#${P}-sh)"/>
      <g class="xp-hs-art" style="animation-delay:${-r1((s.i * .37) % 3)}s">${svgArt(s, size)}</g>
      <g class="xp-hs-badge" transform="translate(${r1(size * .36)} ${r1(-size * .36)})"><circle r="11"/><path d="M-5 0l3.5 3.5 6.5-7"/></g>
      <circle class="xp-hit" r="${r1(Math.max(size * .55, 36))}"/></g>`;
  }
  const world = copy => `<g class="xp-back">${S.back}</g><g class="xp-far">${S.far}</g><g class="xp-mid">${S.mid}</g><g class="xp-spots">${spots.map(s => spotMarkup(s, copy)).join('')}</g><g class="xp-near">${S.near}</g>`;

  const LR = 96, LZ = 2.1;          // lens radius, zoom
  const VW = 300, VH = 204, VZ = 1.5; // viewfinder size, zoom
  const toolSvg = tool === 'magnifier' ? `
    <g class="xp-tool xp-lens" tabindex="-1">
      <ellipse cx="16" cy="24" rx="${LR + 6}" ry="${LR}" fill="url(#${P}-sh)" opacity=".8"/>
      <g transform="rotate(42)"><rect x="${LR + 6}" y="-15" width="118" height="30" rx="15" fill="url(#${P}-handle)"/><rect x="${LR + 2}" y="-19" width="24" height="38" rx="6" fill="url(#${P}-ring)"/><rect x="${LR + 40}" y="-11" width="70" height="6" rx="3" fill="#fff" opacity=".18"/></g>
      <clipPath id="${P}-lclip"><circle r="${LR - 7}"/></clipPath>
      <g clip-path="url(#${P}-lclip)"><rect x="${-LR}" y="${-LR}" width="${LR * 2}" height="${LR * 2}" class="xp-lensbg"/><g class="xp-mag"><g class="xp-copy">${world(true)}</g></g><circle r="${LR - 7}" fill="url(#${P}-lensglass)"/></g>
      <circle r="${LR - 3}" fill="none" stroke="url(#${P}-ring)" stroke-width="12"/><circle r="${LR - 9}" fill="none" stroke="#5E3A0E" stroke-width="1.5" opacity=".5"/><path d="M${-LR * .55} ${-LR * .5}a${LR * .78} ${LR * .78} 0 0 1 ${LR * .6} ${-LR * .26}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>
      <circle class="xp-dwell" r="${LR + 8}" transform="rotate(-90)" stroke-dasharray="${r1(2 * Math.PI * (LR + 8))}" stroke-dashoffset="${r1(2 * Math.PI * (LR + 8))}"/>
      <circle class="xp-grab" r="${LR}" fill="transparent"/></g>` : tool === 'camera' ? `
    <g class="xp-tool xp-vf">
      <path class="xp-vf-dim" fill-rule="evenodd" d="M-3000-3000H3000V3000H-3000ZM${-VW / 2} ${-VH / 2}v${VH}h${VW}v${-VH}Z"/>
      <clipPath id="${P}-vclip"><rect x="${-VW / 2}" y="${-VH / 2}" width="${VW}" height="${VH}" rx="10"/></clipPath>
      <g clip-path="url(#${P}-vclip)"><rect x="${-VW / 2}" y="${-VH / 2}" width="${VW}" height="${VH}" class="xp-lensbg"/><g class="xp-mag"><g class="xp-copy">${world(true)}</g></g>
        <g class="xp-vf-grid"><line x1="${-VW / 6}" y1="${-VH / 2}" x2="${-VW / 6}" y2="${VH / 2}"/><line x1="${VW / 6}" y1="${-VH / 2}" x2="${VW / 6}" y2="${VH / 2}"/><line x1="${-VW / 2}" y1="${-VH / 6}" x2="${VW / 2}" y2="${-VH / 6}"/><line x1="${-VW / 2}" y1="${VH / 6}" x2="${VW / 2}" y2="${VH / 6}"/></g></g>
      <g class="xp-vf-corners">${[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => `<path d="M${a * VW / 2 - a * 2} ${b * VH / 2 - b * 30}V${b * VH / 2 - b * 2}H${a * VW / 2 - a * 30}"/>`).join('')}</g>
      <rect class="xp-vf-focus" x="-26" y="-20" width="52" height="40" rx="6"/>
      <g class="xp-vf-rec" transform="translate(${-VW / 2 + 16} ${-VH / 2 + 22})"><circle r="6"/><text x="12" y="1" dominant-baseline="central">REC</text></g>
      <g class="xp-vf-batt" transform="translate(${VW / 2 - 50} ${-VH / 2 + 15})"><rect width="30" height="14" rx="3"/><rect x="31" y="4" width="3" height="6"/><rect x="3" y="3" width="18" height="8" rx="1.5" class="xp-vf-batt-in"/></g>
      <rect class="xp-grab" x="${-VW / 2}" y="${-VH / 2}" width="${VW}" height="${VH}" fill="transparent"/></g>` : '';

  const toolText = identify
    ? { magnifier: ['🔍', 'Some parts hide! Use the magnifier, then tap the numbered dot.'], camera: ['📷', 'Frame the numbered dot of the part, then press the shutter.'], tap: ['👆', 'Tap the numbered dot on the part I name.'] }[tool]
    : { magnifier: ['🔍', 'Drag the magnifier. Hold it still over something to look closer.'], camera: ['📷', 'Frame something in the viewfinder, then press the shutter.'], tap: ['👆', 'Tap anything you spot in the scene.'] }[tool];
  const root = document.createElement('div');
  root.className = `lab-explore xp-scene-${sceneName} xp-t-${tool}${diagram ? ' xp-diagram' : ''}`;
  root.innerHTML = `
    <div class="xp-bar">
      <div class="xp-chip xp-toolchip"><span aria-hidden="true">${toolText[0]}</span><span>${esc(toolText[1])}</span></div>
      ${identify ? `<div class="xp-chip xp-target" aria-live="polite"><small>Find the</small><b></b></div>` : ''}
      <div class="xp-chip xp-count" aria-live="polite"><b>0</b><span>/ ${need}</span><small>${identify ? 'named' : 'found'}</small></div>
      <button type="button" class="xp-hint"><span aria-hidden="true">💡</span> Hint</button>
    </div>
    <div class="xp-main">
      <div class="xp-viewwrap">
        <div class="xp-view"><div class="xp-scene">
          <svg class="xp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title || 'Scene')}: ${esc(sceneName)} scene" tabindex="0">
            <defs>${COMMON_DEFS(P)}${S.defs || ''}</defs>
            <g class="xp-world">${world(false)}</g>
            <rect width="${W}" height="${H}" fill="url(#${P}-vig)" pointer-events="none"/><rect class="xp-night" width="${W}" height="${H}" pointer-events="none"/>
            <g class="xp-labels"></g><g class="xp-fx"></g>${toolSvg}
            <rect class="xp-flash" width="${W}" height="${H}" fill="#fff" opacity="0" pointer-events="none"/>
          </svg>
        </div></div>
        ${tool === 'camera' ? `<button type="button" class="xp-shutter" aria-label="Take a photo"><span></span></button>` : ''}
        <div class="xp-card" hidden role="status"></div>
        <div class="xp-swipe" aria-hidden="true">⟵ swipe to look around ⟶</div>
      </div>
      <aside class="xp-book${tool === 'camera' ? ' is-album' : ''}" aria-label="${esc(tool === 'camera' ? 'Photo album' : NOTEBOOK[sceneName])}">
        <h3 class="xp-book-h">${esc(tool === 'camera' ? 'Photo album' : NOTEBOOK[sceneName])}</h3>
        <ol class="xp-slots">${Array.from({ length: need }, (_, i) => `<li class="xp-slot"><span class="xp-slot-n">${i + 1}</span><span class="xp-slot-q" aria-hidden="true">?</span></li>`).join('')}</ol>
      </aside>
    </div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('.xp-svg'), view = $('.xp-view'), sceneEl = $('.xp-scene'), card = $('.xp-card'), fx = $('.xp-fx'), labelsG = $('.xp-labels');
  const toolEl = $('.xp-tool'), mag = $('.xp-mag');
  const slots = [...root.querySelectorAll('.xp-slot')];
  const both = i => root.querySelectorAll(`.xp-hs[data-i="${i}"]`);
  const mainSpot = i => $(`.xp-world .xp-hs[data-i="${i}"]`);

  /* ---------- sizing: fit the scene; on phones make it wider and let the child pan ---------- */
  let narrow = false;
  onResize(api, stage, (sw, shh) => {
    const cs = getComputedStyle(stage);
    const w = sw - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const hh = shh - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const wide = w >= 860;
    root.classList.toggle('is-wide', wide);
    const barH = $('.xp-bar').offsetHeight + 10;
    let sceneW;
    if (wide) { sceneW = Math.min(w - 300, (hh - barH) * W / H); narrow = false; }
    else if (w < 620) { sceneW = Math.round(w * 1.6); narrow = true; }
    else { sceneW = Math.min(w, Math.max(320, (hh - barH - 130) * W / H)); narrow = false; }
    sceneW = Math.max(300, Math.floor(sceneW));
    sceneEl.style.width = `${sceneW}px`; sceneEl.style.height = `${Math.round(sceneW * H / W)}px`;
    $('.xp-viewwrap').style.width = narrow ? '100%' : `${sceneW}px`;
    root.classList.toggle('is-pan', narrow);
  });
  requestAnimationFrame(() => { if (narrow) view.scrollLeft = (view.scrollWidth - view.clientWidth) / 2; });

  /* ---------- helpers ---------- */
  function svgPoint(cx, cy) { const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  const unfound = () => spots.filter(s => !s.found);
  const toolPos = () => toolEl ? { x: +gsap.getProperty(toolEl, 'x'), y: +gsap.getProperty(toolEl, 'y') } : null;
  function ripple(x, y, color = '#fff') {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 10); c.setAttribute('class', 'xp-ripplefx'); c.style.stroke = color;
    fx.append(c);
    gsap.to(c, { attr: { r: 46 }, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => c.remove() });
  }

  /* ---------- parallax ---------- */
  const layers = { back: [...root.querySelectorAll('.xp-back')], far: [...root.querySelectorAll('.xp-far')], near: [...root.querySelectorAll('.xp-near')] };
  const qt = {};
  if (!api.reduced) for (const [n, els] of Object.entries(layers)) qt[n] = gsap.quickTo(els, 'x', { duration: .9, ease: 'power3.out' });
  function parallax(fxv) { if (api.reduced) return; qt.back(-fxv * 8); qt.far(-fxv * 16); qt.near(fxv * 22); }
  svg.addEventListener('pointermove', e => { const b = svg.getBoundingClientRect(); parallax((e.clientX - b.left) / b.width - .5); });

  /* ---------- tool: magnifier / viewfinder ---------- */
  let dwellSpot = null, dwellT = 0;
  const DWELL = .6;
  const dwellCirc = 2 * Math.PI * (LR + 8);
  function syncTool() {
    if (!toolEl) return;
    const { x, y } = toolPos();
    const z = tool === 'magnifier' ? LZ : VZ;
    mag.setAttribute('transform', `scale(${z}) translate(${r1(-x)} ${r1(-y)})`);
  }
  function placeTool(x, y, anim = true) {
    if (!toolEl) return;
    x = clamp(x, 0, W); y = clamp(y, 0, H);
    if (anim && !api.reduced) gsap.to(toolEl, { x, y, duration: .55, ease: 'power3.out', onUpdate: syncTool });
    else { gsap.set(toolEl, { x, y }); syncTool(); }
  }
  function spotUnder(x, y, r) {
    let best = null, bd = Infinity;
    for (const s of unfound()) { const d = Math.hypot(s.x - x, s.y - y); const rr = r * (diagram ? 1 : Math.max(.8, s.s)); if (d < rr && d < bd) { bd = d; best = s; } }
    return best;
  }
  const tick = () => {
    if (tool !== 'magnifier' || done || busy || identify) return;
    const { x, y } = toolPos();
    const s = spotUnder(x, y, 46);
    if (s !== dwellSpot) { dwellSpot = s; dwellT = 0; }
    else if (s) dwellT += gsap.ticker.deltaRatio() / 60;
    const p = s ? Math.min(1, dwellT / DWELL) : 0;
    $('.xp-dwell').setAttribute('stroke-dashoffset', r1(dwellCirc * (1 - p)));
    if (s && p >= 1) { dwellSpot = null; dwellT = 0; attempt(s); }
  };
  if (tool === 'magnifier') gsap.ticker.add(tick);

  let drag = null;
  if (toolEl) {
    // start somewhere with nothing to find right under the tool
    const cands = [[.5, .5], [.3, .45], [.7, .45], [.5, .25], [.25, .7], [.75, .7], [.15, .3], [.85, .3], [.5, .8]];
    const score = ([cx, cy]) => Math.min(...spots.map(s => Math.hypot(s.x - cx * W, s.y - cy * H)));
    const [sx, sy] = cands.find(c => score(c) > 150) || cands.reduce((a, c) => (score(c) > score(a) ? c : a));
    const start = { x: sx * W, y: sy * H };
    gsap.set(toolEl, { x: start.x, y: start.y }); syncTool();
    [drag] = Draggable.create(toolEl, {
      type: 'x,y', autoScroll: narrow ? 1 : 0, minimumMovement: 4,
      liveSnap: { x: v => clamp(v, 0, W), y: v => clamp(v, 0, H) },
      onPress() { toolEl.classList.add('is-drag'); hideCard(); },
      onDrag() { syncTool(); parallax(this.x / W - .5); },
      onRelease() { toolEl.classList.remove('is-drag'); },
      onClick(e) {
        const p = svgPoint(e.clientX ?? this.pointerX, e.clientY ?? this.pointerY);
        const { x, y } = toolPos();
        if (tool === 'camera') { snap(); return; }
        // map the click through the lens back to the world
        const wx = x + (p.x - x) / LZ, wy = y + (p.y - y) / LZ;
        const s = spotUnder(wx, wy, 40);
        if (s) attempt(s); else ripple(p.x, p.y, '#FFE7A0');
      },
    });
    api.onCleanup(() => drag?.kill());
  }

  /* ---------- scene clicks ---------- */
  svg.addEventListener('click', e => {
    if (done || e.target.closest('.xp-tool')) return;
    const p = svgPoint(e.clientX, e.clientY);
    hideCard();
    if (tool === 'tap') {
      const g = e.target.closest('.xp-world .xp-hs');
      if (g) { attempt(spots[+g.dataset.i]); return; }
      const s = spotUnder(p.x, p.y, 34);
      if (s) { attempt(s); return; }
      ripple(p.x, p.y); api.sound('tick');
      return;
    }
    // magnifier / camera: glide the tool to where the child tapped
    api.sound('whoosh');
    placeTool(p.x, p.y);
  });
  svg.addEventListener('keydown', e => {
    if (done) return;
    const step = e.shiftKey ? 60 : 24;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (toolEl && mv) { e.preventDefault(); const { x, y } = toolPos(); placeTool(x + mv[0], y + mv[1], false); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      const g = e.target.closest?.('.xp-hs');
      if (g) { e.preventDefault(); attempt(spots[+g.dataset.i]); return; }
      if (toolEl) {
        e.preventDefault();
        if (tool === 'camera') snap(); else { const { x, y } = toolPos(); const s = spotUnder(x, y, 50); if (s) attempt(s); else { ripple(x, y, '#FFE7A0'); api.say('Nothing new right under the lens. Keep looking!', 'hint'); } }
      }
    }
  });
  $('.xp-shutter')?.addEventListener('click', () => snap());

  /* ---------- finding ---------- */
  function attempt(s) {
    if (done || busy || !s) return;
    if (s.found) { api.say(`You already found the ${s.label}.`); return; }
    if (identify && target && s !== target) {
      api.mistake();
      const el = mainSpot(s.i);
      el?.classList.add('is-wrong');
      if (el && !api.reduced) gsap.fromTo(el.querySelector('.xp-mk-dot') || el, { x: 0 }, { x: 0, duration: .45, keyframes: { x: [0, -6, 6, -4, 3, 0] } });
      later(() => el?.classList.remove('is-wrong'), 700);
      api.say(`Not that one: that is the ${s.label}. ${target.hint || `Look again for the ${target.label}.`}`, 'bad');
      return;
    }
    found(s);
  }

  function found(s, fromPhoto = null) {
    s.found = true; foundN++;
    both(s.i).forEach(g => { g.classList.add('is-found'); g.setAttribute('aria-label', s.label); });
    const main = mainSpot(s.i);
    if (!api.reduced) {
      const art = main.querySelector('.xp-hs-art') || main.querySelector('.xp-mk-dot');
      gsap.fromTo(art, { scale: .6, transformOrigin: '50% 50%' }, { scale: 1, duration: .7, ease: 'elastic.out(1, .45)' });
    }
    ripple(s.x, s.y, '#F2B33D');
    api.sound('pop');
    if (diagram) drawLabel(s);
    const slot = slots[foundN - 1];
    if (fromPhoto) flyPhoto(fromPhoto, slot, s); else flyToSlot(s, slot);
    showCard(s);
    api.say(`${s.label}! ${s.fact || ''}`.trim(), 'good');
    $('.xp-count b').textContent = foundN;
    if (!api.reduced) gsap.fromTo('.lab-explore .xp-count', { scale: 1.18 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    api.progress(foundN / need);
    if (foundN >= need) { finish(); return; }
    if (identify) later(nextTarget, 900);
  }

  function flyToSlot(s, slot) {
    if (!slot) return;
    const from = mainSpot(s.i).getBoundingClientRect();
    const rb = root.getBoundingClientRect();
    const fill = () => {
      slot.classList.add('is-full');
      slot.innerHTML = `<span class="xp-slot-n">${slots.indexOf(slot) + 1}</span><span class="xp-slot-art">${api.art(s)}</span><span class="xp-slot-l">${esc(s.label)}</span>`;
      if (!api.reduced) { gsap.fromTo(slot, { scale: .7 }, { scale: 1, duration: .55, ease: 'back.out(2.6)' }); sparkle(api, slot); }
    };
    if (api.reduced) { fill(); return; }
    const to = slot.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'xp-fly';
    fly.innerHTML = api.art(s);
    root.append(fly);
    const sz = Math.max(40, Math.min(90, from.width));
    gsap.set(fly, { left: from.left - rb.left + from.width / 2 - sz / 2, top: from.top - rb.top + from.height / 2 - sz / 2, width: sz, height: sz });
    const dx = to.left - from.left + to.width / 2 - from.width / 2, dy = to.top - from.top + to.height / 2 - from.height / 2;
    gsap.timeline({ onComplete: () => { fly.remove(); fill(); } })
      .from(fly, { scale: .2, duration: .25, ease: 'back.out(3)' })
      .to(fly, { duration: .85, ease: 'power2.inOut', rotation: 360, scale: .6, motionPath: { path: [{ x: 0, y: 0 }, { x: dx * .4, y: Math.min(dy, 0) - 90 }, { x: dx, y: dy }], curviness: 1.4 } }, '+=.15');
  }

  /* ---------- identify: target prompt & leader labels ---------- */
  function nextTarget() {
    if (done) return;
    const left = unfound();
    if (!left.length) return;
    target = left[Math.floor(Math.random() * left.length)];
    const t = $('.xp-target');
    if (t) {
      t.querySelector('b').innerHTML = `<span class="xp-target-art">${api.art(target)}</span>${esc(target.label)}`;
      if (!api.reduced) gsap.fromTo(t, { scale: .8, opacity: .3 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2.4)' });
    }
    root.querySelectorAll('.xp-hs.is-target').forEach(g => g.classList.remove('is-target'));
  }
  const placed = { L: [], R: [] };
  function drawLabel(s) {
    const side = s.x < W / 2 ? 'L' : 'R';
    let y = clamp(s.y, 30, H - 30);
    const taken = placed[side];
    for (let guard = 0; guard < 30 && taken.some(t => Math.abs(t - y) < 40); guard++) y += (y > H / 2 ? -40 : 40);
    y = clamp(y, 24, H - 24); taken.push(y);
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'xp-lbl');
    const label = s.label.length > 22 ? `${s.label.slice(0, 21)}…` : s.label;
    const tw = Math.max(70, label.length * 10.5 + 26);
    const lx = side === 'L' ? 12 : W - 12 - tw;
    const ax = side === 'L' ? lx + tw : lx;
    const elbow = side === 'L' ? Math.min(s.x - 30, ax + 40) : Math.max(s.x + 30, ax - 40);
    g.innerHTML = `<path class="xp-lbl-line" d="M${r1(s.x)} ${r1(s.y)}L${r1(elbow)} ${r1(y)}L${r1(ax)} ${r1(y)}"/><circle class="xp-lbl-dot" cx="${r1(s.x)}" cy="${r1(s.y)}" r="5"/>
      <g class="xp-lbl-tag" transform="translate(${r1(lx)} ${r1(y - 17)})"><rect width="${r1(tw)}" height="34" rx="17"/><circle cx="17" cy="17" r="11" class="xp-lbl-n"/><text x="17" y="18" text-anchor="middle" dominant-baseline="central" class="xp-lbl-nt">${s.i + 1}</text><text x="34" y="18" dominant-baseline="central">${esc(label)}</text></g>`;
    labelsG.append(g);
    if (!api.reduced) {
      gsap.timeline().from(g.querySelector('.xp-lbl-line'), { drawSVG: '0%', duration: .55, ease: 'power2.inOut' })
        .from(g.querySelector('.xp-lbl-tag'), { scale: 0, transformOrigin: side === 'L' ? '100% 50%' : '0% 50%', duration: .45, ease: 'back.out(2.2)' }, '-=.15');
    }
  }

  /* ---------- fact card ---------- */
  function showCard(s) {
    card.innerHTML = `<button type="button" class="xp-card-x" aria-label="Close">×</button><div class="xp-card-art">${api.art(s)}</div><div class="xp-card-t"><b>${esc(s.label)}</b>${s.fact ? `<p>${esc(s.fact)}</p>` : ''}</div>`;
    card.hidden = false;
    card.querySelector('.xp-card-x').onclick = hideCard;
    if (!api.reduced) gsap.fromTo(card, { y: 30, opacity: 0, scale: .9 }, { y: 0, opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.8)' });
  }
  function hideCard() {
    if (card.hidden) return;
    if (api.reduced) { card.hidden = true; return; }
    gsap.to(card, { y: 20, opacity: 0, duration: .2, onComplete: () => { card.hidden = true; } });
  }

  /* ---------- camera ---------- */
  function snap() {
    if (done || busy || tool !== 'camera') return;
    busy = true;
    const { x, y } = toolPos();
    const ww = VW / VZ, hh = VH / VZ;
    const inFrame = unfound().filter(s => Math.abs(s.x - x) < ww / 2 - 6 && Math.abs(s.y - y) < hh / 2 - 6).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    let s = inFrame[0] || null;
    if (identify && s && target && !inFrame.includes(target)) s = inFrame[0];
    api.sound('tick'); later(() => api.sound('whoosh'), 80);
    const flash = $('.xp-flash');
    gsap.fromTo(flash, { opacity: .95 }, { opacity: 0, duration: api.reduced ? .05 : .45, ease: 'power2.out' });
    if (!api.reduced) gsap.fromTo($('.xp-shutter span'), { scale: .7 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
    const photo = makePolaroid(x, y, ww, hh, s ? s.label : 'Hmm…');
    if (identify && s && target && s !== target) { // snapped the wrong part
      dropPhoto(photo, false);
      busy = false; attempt(s); return;
    }
    if (!s) {
      dropPhoto(photo, false);
      api.say(inFrame.length === 0 && unfound().length ? 'Nothing new in that photo. Frame something you have not found yet, right in the middle.' : 'Nice photo, but you already have that one!', 'hint');
      busy = false; return;
    }
    busy = false;
    found(s, photo);
  }
  function makePolaroid(x, y, ww, hh, caption) {
    const v = toolEl.querySelector('.xp-grab').getBoundingClientRect();
    const rb = root.getBoundingClientRect();
    const fig = document.createElement('figure');
    fig.className = 'xp-polaroid xp-fly';
    fig.innerHTML = `<svg viewBox="${r1(x - ww / 2)} ${r1(y - hh / 2)} ${r1(ww)} ${r1(hh)}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="xp-copy xp-still">${world(true)}</g></svg><figcaption>${esc(caption)}</figcaption>`;
    root.append(fig);
    const w = v.width;
    gsap.set(fig, { left: v.left - rb.left, top: v.top - rb.top, width: w });
    return fig;
  }
  function dropPhoto(fig, keep) {
    if (api.reduced) { fig.remove(); return; }
    gsap.timeline({ onComplete: () => fig.remove() })
      .to(fig, { y: -20, rotation: -4, duration: .25, ease: 'power2.out' })
      .to(fig, { y: 420, rotation: 28, opacity: 0, duration: .8, ease: 'power2.in' });
  }
  function flyPhoto(fig, slot, s) {
    const fill = () => {
      slot.classList.add('is-full', 'is-photo');
      const svgCopy = fig.querySelector('svg').outerHTML;
      slot.innerHTML = `<span class="xp-slot-n">${slots.indexOf(slot) + 1}</span><span class="xp-slot-photo">${svgCopy}</span><span class="xp-slot-l">${esc(s.label)}</span>`;
      slot.style.setProperty('--rot', `${(Math.random() * 8 - 4).toFixed(1)}deg`);
      fig.remove();
      if (!api.reduced) { gsap.fromTo(slot, { scale: .7, y: -10 }, { scale: 1, y: 0, duration: .55, ease: 'back.out(2.6)' }); sparkle(api, slot); }
    };
    if (!slot) { fig.remove(); return; }
    if (api.reduced) { fill(); return; }
    const a = fig.getBoundingClientRect(), b = slot.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const sc = Math.max(.25, b.width / a.width);
    gsap.timeline({ onComplete: fill })
      .fromTo(fig, { scale: 1.05, opacity: 0 }, { scale: 1, opacity: 1, duration: .2 })
      .to(fig, { y: -26, rotation: -5, duration: .35, ease: 'power2.out' }, '+=.35')
      .to(fig, { duration: .8, ease: 'power2.in', scale: sc, rotation: 8, motionPath: { path: [{ x: 0, y: -26 }, { x: dx * .5, y: Math.min(dy, -26) - 60 }, { x: dx, y: dy }], curviness: 1.2 } });
  }

  /* ---------- hint & glints ---------- */
  $('.xp-hint').addEventListener('click', () => {
    if (done) return;
    const left = unfound(); if (!left.length) return;
    const s = identify && target ? target : left[Math.floor(Math.random() * left.length)];
    api.mistake(); hintsUsed++;
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'xp-hintring');
    g.innerHTML = `<circle cx="${s.x}" cy="${s.y}" r="60"/><circle cx="${s.x}" cy="${s.y}" r="60"/>`;
    fx.append(g);
    const rings = g.querySelectorAll('circle');
    gsap.fromTo(rings, { attr: { r: 120 }, opacity: 0 }, { attr: { r: 36 }, opacity: 1, duration: .9, stagger: .3, ease: 'power2.out', repeat: api.reduced ? 0 : 1, onComplete: () => later(() => g.remove(), 900) });
    if (narrow) view.scrollTo({ left: s.x / W * view.scrollWidth - view.clientWidth / 2, behavior: api.reduced ? 'auto' : 'smooth' });
    const where = s.y < H * .35 ? 'up high' : s.y > H * .7 ? 'down low' : 'in the middle';
    const side = s.x < W * .35 ? 'on the left' : s.x > W * .65 ? 'on the right' : 'near the centre';
    api.say(`${identify ? `The ${s.label} is` : 'Look'} ${where}, ${side}.${s.hidden && tool !== 'tap' ? ` It is well hidden: use the ${tool === 'camera' ? 'camera zoom' : 'magnifier'}!` : ''}`, 'hint');
    if (!identify && tool === 'magnifier' && s.hidden) placeTool(s.x + (Math.random() > .5 ? 120 : -120), s.y);
  });
  if (!api.reduced) {
    const glint = () => {
      if (done) return;
      const hid = unfound().filter(s => s.hidden || tool === 'tap');
      if (hid.length) {
        const s = hid[Math.floor(Math.random() * hid.length)];
        const NS = 'http://www.w3.org/2000/svg';
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', 'M0-12L3-3L12 0L3 3L0 12L-3 3L-12 0L-3-3Z'); p.setAttribute('class', 'xp-glint');
        p.setAttribute('transform', `translate(${s.x + 14} ${s.y - 14})`);
        fx.append(p);
        gsap.fromTo(p, { scale: 0, rotation: 0, transformOrigin: '50% 50%' }, { scale: 1, rotation: 90, duration: .5, yoyo: true, repeat: 1, ease: 'power2.inOut', onComplete: () => p.remove() });
      }
      later(glint, 6500 + Math.random() * 3000);
    };
    later(glint, 5000);
  }

  /* ---------- finish ---------- */
  function finish() {
    done = true;
    target = null;
    $('.xp-target')?.classList.add('is-done');
    if ($('.xp-target b')) $('.xp-target b').textContent = 'All done!';
    const book = $('.xp-book');
    book.classList.add('is-complete');
    later(() => {
      const st = document.createElement('div'); st.className = 'xp-stamp'; st.textContent = tool === 'camera' ? 'Album full!' : identify ? 'All named!' : 'Complete!';
      book.append(st);
      if (!api.reduced) gsap.fromTo(st, { scale: 2.4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -12, duration: .5, ease: 'back.out(2)' });
      api.sound('drop');
    }, 900);
    later(() => api.complete({ message: cfg.win || (identify ? `You named all ${need} parts!` : `You found all ${need}! Your ${tool === 'camera' ? 'album' : 'notebook'} is full.`) }), 2200);
  }

  /* ---------- intro ---------- */
  api.say(identify ? `Find each part I name. ${toolText[1]}` : `${toolText[1]} Find ${need} things.`);
  if (!api.reduced) {
    const tl = gsap.timeline({ delay: .15 });
    tl.from(root.querySelectorAll('.xp-world .xp-far'), { y: 40, opacity: 0, duration: .8, ease: 'power3.out' })
      .from(root.querySelectorAll('.xp-world .xp-mid'), { y: 24, opacity: 0, duration: .7, ease: 'power3.out' }, '-=.55')
      .from(root.querySelectorAll('.xp-world .xp-hs:not(.is-hidden)'), { scale: 0, transformOrigin: '50% 50%', duration: .5, stagger: .06, ease: 'back.out(2.5)' }, '-=.3')
      .from(root.querySelectorAll('.xp-world .xp-near'), { y: 30, duration: .6, ease: 'power2.out' }, '<')
      .from(slots, { y: 16, opacity: 0, duration: .4, stagger: .05, ease: 'back.out(2)' }, '<');
    if (toolEl) tl.from(toolEl, { scale: 0, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2)', onUpdate: syncTool }, '-=.2');
    if (narrow) { tl.fromTo('.lab-explore .xp-swipe', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .4 }).to('.lab-explore .xp-swipe', { opacity: 0, duration: .5, delay: 2.2 }); }
  }
  if (identify) nextTarget();

  return {
    destroy() {
      timers.forEach(clearTimeout);
      gsap.ticker.remove(tick);
      drag?.kill();
      gsap.killTweensOf(root.querySelectorAll('*'));
      root.querySelectorAll('.xp-fly').forEach(f => f.remove());
    },
  };
}

export const demo = {
  type: 'explore',
  title: 'Garden Bug Hunt',
  scene: 'garden',
  tool: 'magnifier',
  mission: 'Our school garden is full of tiny life. Slide the magnifier around and find 6 creatures. Some hide in the soil and under leaves!',
  fact: 'One handful of healthy garden soil holds more living things than there are people on Earth.',
  hotspots: [
    { at: 'flowers', label: 'Honey bee', sprite: 'bee', emoji: '🐝', fact: 'Bees carry pollen from flower to flower, so our tomatoes and beans can make fruit.' },
    { x: 62, y: 68, label: 'Ladybird', sprite: 'ladybird', emoji: '🐞', fact: 'One ladybird can eat about 50 aphids a day. Farmers call it a friend.', hidden: true, size: .8 },
    { at: 'soil', label: 'Earthworm', sprite: 'earthworm', emoji: '🪱', fact: 'Earthworms tunnel through soil, letting in air and water, and their castings feed plants.', hidden: true },
    { at: 'under-rock', label: 'Snail', sprite: 'snail', emoji: '🐌', fact: 'Snails hide in cool, damp places during the day and come out at night to eat leaves.', hidden: true, size: .8 },
    { x: 27, y: 46, label: 'Sparrow', sprite: 'sparrow', emoji: '🐦', fact: 'House sparrows (gauraiya) nest near people. Their numbers have fallen in big cities.' },
    { at: 'branch', label: 'Butterfly', sprite: 'butterfly', emoji: '🦋', fact: 'Butterflies taste with their feet! They land on a leaf to check if it is good for their eggs.' },
    { x: 86, y: 62, label: 'Ant trail', sprite: 'ant', emoji: '🐜', fact: 'Ants leave a scent trail so their nest-mates can follow them to food.', hidden: true, size: .7 },
    { x: 46, y: 64, label: 'Caterpillar', sprite: 'caterpillar', emoji: '🐛', fact: 'A caterpillar eats and grows for 2–3 weeks before it turns into a butterfly or moth.', hidden: true, size: .8 },
  ],
  find: 6,
  win: 'Super survey! A garden with many kinds of creatures is a healthy garden.',
};
