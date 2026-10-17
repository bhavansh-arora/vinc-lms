// Sprites for making and doing: garden tools, measuring instruments, water fixtures, simple machines,
// waste-material toys, bicycle tools, woodworking, tie-dye, electronics, computers and hydroponics.
// Each value is SVG markup for a 100x100 viewBox (no outer <svg>). Ids are prefixed with the sprite name.
// Small helpers below keep the drawings consistent and the file lean.

const MS = '#5F6C77';  // metal edge
const WS = '#8A5226';  // wood edge
const O = '#2B1A10';   // ink
const D = { v: 'x2="0" y2="1"', h: 'x2="1" y2="0"', d: 'x2="1" y2="1"' };
/** soft ground shadow */
const sh = (rx = 30, cx = 50, cy = 91) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx / 6.5).toFixed(1)}" fill="#000" opacity=".14"/>`;
/** linear gradient a -> b; d = v | h | d */
const lg = (id, a, b, d = 'v') => `<linearGradient id="${id}" x1="0" y1="0" ${D[d]}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
/** radial gradient, lit from the top left */
const rg = (id, a, b) => `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
const metal = (id, d = 'h') => lg(id, '#EEF2F5', '#8D9AA5', d);
const wood = (id, d = 'h') => lg(id, '#E8B273', '#B47236', d);
const defs = (...g) => `<defs>${g.join('')}</defs>`;
/** cog outline: centre, outer radius, tooth depth, tooth count */
const cog = (cx, cy, r, t, n) => {
  let d = '';
  for (let i = 0; i < n * 4; i++) {
    const a = (i + 0.5) / (n * 4) * Math.PI * 2, rr = i % 4 < 2 ? r : r - t;
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
};
/** ring (donut) path; use with fill-rule="evenodd" */
const ring = (cx, cy, R, r) => `M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0zM${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
/** point on a circle, as "x y" */
const pt = (cx, cy, r, deg) => `${(cx + r * Math.cos(deg * Math.PI / 180)).toFixed(1)} ${(cy + r * Math.sin(deg * Math.PI / 180)).toFixed(1)}`;
/** repeat a template n times */
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
/** wall tap shared by tap and leaking-tap */
const tapArt = p => `
  <rect x="6" y="28" width="9" height="28" rx="3" fill="url(#${p}-c)" stroke="${MS}" stroke-width="2"/>
  <path d="M14 35h40q22 0 22 22v8H62v-8q0-8-8-8H14z" fill="url(#${p}-c)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <rect x="59" y="63" width="20" height="7" rx="3" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <rect x="33" y="22" width="9" height="14" fill="#AEB9C2" stroke="${MS}" stroke-width="2"/>
  <rect x="20" y="13" width="36" height="10" rx="5" fill="url(#${p}-c)" stroke="${MS}" stroke-width="2"/>
  <circle cx="37.5" cy="18" r="3" fill="#3E8FD6"/>
  <path d="M19 39h32" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
  <defs>${lg(p + '-c', '#F5F8FA', '#8796A3')}</defs>`;
/** a glove: fill gradient id, cuff colour */
const glove = (g, cuff, edge) => `
  <g stroke="${edge}" stroke-width="2" stroke-linejoin="round">
  <path d="M30 86V52q-9-6-14-14q-3-6 3-8q5-1 10 6l3 4V24q0-5 4.5-5t4.5 5v-6q0-5 4.5-5t4.5 5v4q0-5 4.5-5t4.5 5v6q0-4 4-4t4 4v34q0 10-4 18v8z" fill="url(#${g})"/>
  <rect x="27" y="78" width="38" height="16" rx="4" fill="${cuff}"/></g>
  <path d="M41 25v19M50 23v21M59 29v15" stroke="${edge}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  <path d="M36 26v10M45 20v10M54 24v8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".4"/>`;

export const SPRITES = {
  // ---------- garden tools ----------
  'trowel': `${sh(26, 50, 90)}
  <g transform="rotate(38 50 48)">
  <path d="M50 5C64 17 70 33 66 49Q50 56 34 49C30 33 36 17 50 5Z" fill="url(#trowel-m)" stroke="${MS}" stroke-width="2"/>
  <path d="M50 12v34" stroke="#fff" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>
  <rect x="47" y="51" width="6" height="11" fill="#7D8A95"/>
  <rect x="42.5" y="60" width="15" height="33" rx="7.5" fill="url(#trowel-w)" stroke="${WS}" stroke-width="2"/>
  <rect x="42" y="59" width="16" height="6" rx="2" fill="#C9D2D8" stroke="${MS}" stroke-width="1.5"/>
  <path d="M47 70q2 8 0 15M53 71q-1 6 1 11" stroke="${WS}" stroke-width="1.2" fill="none" opacity=".6"/>
  <circle cx="50" cy="87.5" r="2" fill="#7A4520"/></g>
  ${defs(metal('trowel-m', 'd'), wood('trowel-w'))}`,

  'spade': `${sh(22, 44, 92)}
  <g transform="rotate(18 50 50)">
  <rect x="39" y="4" width="22" height="13" rx="5" fill="none" stroke="url(#spade-w)" stroke-width="5"/>
  <rect x="46" y="15" width="8" height="40" rx="3" fill="url(#spade-w)" stroke="${WS}" stroke-width="2"/>
  <path d="M44 50h12l3 9H41z" fill="#9AA7B1" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M30 58h40v20q0 12-20 18q-20-6-20-18z" fill="url(#spade-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <rect x="28" y="56" width="44" height="5" rx="2.5" fill="#B9C4CC" stroke="${MS}" stroke-width="1.5"/>
  <path d="M36 66v12q1 6 7 10" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55" stroke-linecap="round"/></g>
  ${defs(metal('spade-m', 'd'), wood('spade-w'))}`,

  'hand-fork': `${sh(26, 50, 90)}
  <g transform="rotate(38 50 48)">
  <path d="M38 42V12M50 44V8M62 42V12" stroke="${MS}" stroke-width="8" stroke-linecap="round"/>
  <path d="M38 42V12M50 44V8M62 42V12" stroke="url(#hand-fork-m)" stroke-width="5" stroke-linecap="round"/>
  <path d="M37 40q13 16 26 0" stroke="${MS}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M37 40q13 16 26 0" stroke="#AEB9C2" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="47" y="50" width="6" height="12" fill="#7D8A95"/>
  <rect x="42.5" y="60" width="15" height="33" rx="7.5" fill="url(#hand-fork-g)" stroke="#2C6E3F" stroke-width="2"/>
  <rect x="42" y="59" width="16" height="6" rx="2" fill="#C9D2D8" stroke="${MS}" stroke-width="1.5"/>
  <path d="M46.5 69v16" stroke="#fff" stroke-width="2.5" opacity=".4" stroke-linecap="round"/></g>
  ${defs(metal('hand-fork-m'), lg('hand-fork-g', '#6CC07A', '#2F8A4A', 'h'))}`,

  'hoe': `${sh(30, 46, 92)}
  <path d="M86 6L34 74" stroke="${WS}" stroke-width="9" stroke-linecap="round"/>
  <path d="M86 6L34 74" stroke="url(#hoe-w)" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M36 72q-6 2-10 6" stroke="#7D8A95" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M12 76h30q2 0 2 2l1 11q0 2-2 2H11q-2 0-2-2l1-11q0-2 2-2z" fill="url(#hoe-m)" stroke="${MS}" stroke-width="2"/>
  <path d="M15 80h24" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>
  ${defs(metal('hoe-m', 'v'), wood('hoe-w', 'd'))}`,

  'rake': `${sh(32, 50, 92)}
  <g transform="rotate(-8 50 50)">
  <rect x="46" y="3" width="8" height="64" rx="4" fill="url(#rake-w)" stroke="${WS}" stroke-width="2"/>
  <path d="M24 66q26-18 52 0" stroke="${MS}" stroke-width="3" fill="none"/>
  <path d="${rep(8, i => `M${22 + i * 8} 72v15`)}" stroke="${MS}" stroke-width="5" stroke-linecap="round"/>
  <path d="${rep(8, i => `M${22 + i * 8} 72v15`)}" stroke="#C3CDD5" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="16" y="64" width="68" height="9" rx="4.5" fill="url(#rake-m)" stroke="${MS}" stroke-width="2"/>
  <path d="M49 8v54" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/></g>
  ${defs(metal('rake-m', 'v'), wood('rake-w'))}`,

  'shears': `${sh(28, 50, 92)}
  <path d="M46 44C38 30 42 14 58 5c3 13 1 27-4 39z" fill="url(#shears-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M52 46c9-10 17-22 13-34c-10 5-16 16-19 30z" fill="#9AA7B1" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M50 12c-3 8-3 18 0 26" stroke="#fff" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>
  <path d="M38 64q8 4 4 8q-4 4 4 8M62 64q-8 4-4 8q4 4-4 8" stroke="#AEB9C2" stroke-width="2.5" fill="none"/>
  <g stroke="#8E2A22" stroke-width="2" stroke-linejoin="round" fill="url(#shears-r)">
  <path d="M45 44c-9 14-15 30-20 46q6 4 10 0c4-15 10-29 16-41z"/>
  <path d="M55 44c9 14 15 30 20 46q-6 4-10 0c-4-15-10-29-16-41z"/></g>
  <circle cx="50" cy="45" r="6" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/><circle cx="50" cy="45" r="2" fill="${MS}"/>
  ${defs(metal('shears-m', 'd'), lg('shears-r', '#F0705F', '#C2392C', 'h'))}`,

  'watering-can': `${sh(32, 50, 91)}
  <path d="M40 40q0-24 22-24q20 0 20 24q1 14-10 22" stroke="#246B38" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M40 40q0-24 22-24q20 0 20 24q1 14-10 22" stroke="#4FA862" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M31 72L12 37l7-4 18 31z" fill="url(#watering-can-g)" stroke="#246B38" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="13" cy="33" rx="8" ry="4.5" transform="rotate(-30 13 33)" fill="#7CCB86" stroke="#246B38" stroke-width="2"/>
  <path d="M28 44q0-6 6-6h32q6 0 6 6v38q0 6-6 6H34q-6 0-6-6z" fill="url(#watering-can-g)" stroke="#246B38" stroke-width="2"/>
  <path d="M28 52h44M28 76h44" stroke="#246B38" stroke-width="1.5" opacity=".5"/>
  <path d="M35 46v30" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>
  <g fill="#4DA8E8"><path d="M6 44q-2 4 0 5t2-5l-1-2z"/><path d="M12 50q-2 4 0 5t2-5l-1-2z"/><path d="M4 56q-2 4 0 5t2-5l-1-2z"/></g>
  ${defs(lg('watering-can-g', '#74C783', '#34904B', 'h'))}`,

  'wheelbarrow': `${sh(40, 52, 91)}
  <path d="M30 70L94 54M58 66l3 20h-8" stroke="#46505A" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 40h68l-12 28H28z" fill="url(#wheelbarrow-r)" stroke="#8E2A22" stroke-width="2" stroke-linejoin="round"/>
  <rect x="9" y="35" width="74" height="7" rx="3.5" fill="#E86A55" stroke="#8E2A22" stroke-width="2"/>
  <path d="M22 46l8 18" stroke="#fff" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
  <circle cx="28" cy="76" r="13" fill="#3E444B" stroke="#6B737C" stroke-width="2"/>
  <circle cx="28" cy="76" r="6" fill="url(#wheelbarrow-m)" stroke="${MS}" stroke-width="1.5"/>
  <rect x="88" y="51" width="9" height="6" rx="3" transform="rotate(-14 92 54)" fill="#3E444B"/>
  ${defs(lg('wheelbarrow-r', '#F2735F', '#C2392C'), metal('wheelbarrow-m', 'd'))}`,

  'gloves': `${sh(34, 50, 93)}
  <g transform="translate(12 -2) rotate(12 50 60) scale(-1 1) translate(-100 0)" opacity=".95">${glove('gloves-b', '#E9A93A', '#1E5F5A')}</g>
  <g transform="translate(-8 0) rotate(-8 50 60)">${glove('gloves-a', '#F4C14F', '#1E5F5A')}</g>
  ${defs(lg('gloves-a', '#56C1B6', '#2A8A82', 'h'), lg('gloves-b', '#3E9A92', '#22706A', 'h'))}`,

  'spray-bottle': `${sh(22, 50, 92)}
  <path d="M36 50q-4 0-4 6v28q0 6 6 6h24q6 0 6-6V56q0-6-4-6z" fill="url(#spray-bottle-b)" stroke="#2F6E9A" stroke-width="2"/>
  <path d="M33 66h34v18q0 5-5 5H38q-5 0-5-5z" fill="#3E8FC0" opacity=".55"/>
  <path d="M38 56v26" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>
  <rect x="40" y="38" width="20" height="13" rx="2" fill="#F4F0E6" stroke="#8C7A66" stroke-width="2"/>
  <path d="M34 24q0-6 6-6h22q6 0 6 6v14H38z" fill="url(#spray-bottle-h)" stroke="#9A4A12" stroke-width="2" stroke-linejoin="round"/>
  <path d="M34 20H20v8h14" fill="#F28C38" stroke="#9A4A12" stroke-width="2" stroke-linejoin="round"/>
  <path d="M40 38q-6 6-3 16" stroke="#9A4A12" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M40 38q-6 6-3 16" stroke="#F28C38" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g fill="#4DA8E8"><circle cx="13" cy="18" r="2"/><circle cx="8" cy="24" r="1.6"/><circle cx="12" cy="29" r="1.8"/><circle cx="6" cy="16" r="1.4"/><circle cx="4" cy="30" r="1.3"/></g>
  ${defs(lg('spray-bottle-b', '#A6DBF5', '#5BA9D8', 'h'), lg('spray-bottle-h', '#FFB066', '#E2741F'))}`,

};
