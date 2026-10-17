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

  // ---------- measuring and garden aids ----------
  'magnifier': `${sh(24, 58, 92)}
  <path d="M58 58l26 26" stroke="#7A2E1E" stroke-width="15" stroke-linecap="round"/>
  <path d="M58 58l26 26" stroke="url(#magnifier-h)" stroke-width="10" stroke-linecap="round"/>
  <path d="M62 66l14 14" stroke="#fff" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
  <circle cx="40" cy="40" r="26" fill="url(#magnifier-g)" opacity=".85"/>
  <circle cx="40" cy="40" r="26" fill="none" stroke="${MS}" stroke-width="10"/>
  <circle cx="40" cy="40" r="26" fill="none" stroke="url(#magnifier-m)" stroke-width="6.5"/>
  <path d="M26 34q3-10 13-13" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
  ${defs(rg('magnifier-g', '#F2FBFF', '#8CC8E8'), metal('magnifier-m', 'd'), lg('magnifier-h', '#E2694E', '#9C3B26', 'd'))}`,

  'ruler': `${sh(36, 50, 86)}
  <g transform="rotate(-24 50 50)">
  <rect x="5" y="38" width="90" height="24" rx="3" fill="url(#ruler-y)" stroke="#A97510" stroke-width="2"/>
  <path d="${rep(18, i => `M${10 + i * 4.8} 38v${i % 4 === 0 ? 10 : i % 2 ? 4.5 : 7}`)}" stroke="#6B4A12" stroke-width="1.4"/>
  <path d="M9 57h82" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>
  <circle cx="88" cy="54" r="2" fill="#A97510"/></g>
  ${defs(lg('ruler-y', '#FBE07A', '#E8B22E'))}`,

  'measuring-tape': `${sh(36, 50, 91)}
  <rect x="58" y="74" width="36" height="9" fill="#FBE07A" stroke="#A97510" stroke-width="1.5"/>
  <path d="${rep(7, i => `M${62 + i * 4.5} 74v${i % 2 ? 3 : 5}`)}" stroke="#6B4A12" stroke-width="1.2"/>
  <path d="M94 71v15" stroke="#6B7782" stroke-width="4" stroke-linecap="round"/>
  <rect x="34" y="15" width="14" height="10" rx="3" fill="#4A5058"/>
  <rect x="8" y="22" width="62" height="64" rx="18" fill="url(#measuring-tape-y)" stroke="#9A5B0A" stroke-width="2"/>
  <circle cx="39" cy="54" r="19" fill="#4A5058" stroke="#2E3338" stroke-width="2"/>
  <circle cx="39" cy="54" r="8" fill="url(#measuring-tape-m)"/>
  <path d="M16 38q3-9 12-12" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".55"/>
  ${defs(lg('measuring-tape-y', '#FFCF4D', '#E58A12', 'd'), metal('measuring-tape-m', 'd'))}`,

  'weighing-scale': `${sh(38, 50, 92)}
  <rect x="44" y="30" width="12" height="13" fill="#8D9AA5"/>
  <ellipse cx="50" cy="29" rx="36" ry="8" fill="url(#weighing-scale-m)" stroke="${MS}" stroke-width="2"/>
  <path d="M18 42h64q4 0 5 4l4 38q0 5-5 5H14q-5 0-5-5l4-38q1-4 5-4z" fill="url(#weighing-scale-r)" stroke="#8E2A22" stroke-width="2"/>
  <circle cx="50" cy="64" r="17" fill="#FFFDF7" stroke="#8E2A22" stroke-width="2.5"/>
  <g stroke="${O}" stroke-width="1.6">${rep(9, i => `<path d="M50 49.5v4" transform="rotate(${-80 + i * 20} 50 64)"/>`)}</g>
  <path d="M50 64l9-9" stroke="#D9483B" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="64" r="2.5" fill="${O}"/>
  <path d="M17 50l-3 30" stroke="#fff" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
  ${defs(lg('weighing-scale-r', '#F2735F', '#C2392C'), metal('weighing-scale-m', 'v'))}`,

  'thermometer': `${sh(14, 50, 95)}
  <rect x="41" y="5" width="18" height="74" rx="9" fill="#F2FAFD" stroke="#6F98AC" stroke-width="2"/>
  <rect x="47" y="34" width="6" height="42" rx="3" fill="#E0463A"/>
  <path d="${rep(9, i => `M54 ${14 + i * 6.5}h${i % 2 ? 3 : 5}`)}" stroke="#6F98AC" stroke-width="1.5"/>
  <circle cx="50" cy="81" r="12" fill="url(#thermometer-r)" stroke="#9E2A20" stroke-width="2"/>
  <path d="M45 11v58" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>
  <circle cx="46" cy="77" r="3" fill="#fff" opacity=".6"/>
  ${defs(rg('thermometer-r', '#FF8A7A', '#C2392C'))}`,

  'ph-strip': `${sh(26, 50, 93)}
  ${[['-22', '#E5484D'], ['0', '#7BC24A'], ['22', '#4A63D8']].map(([a, c]) => `<g transform="rotate(${a} 50 90)">
  <rect x="44" y="16" width="12" height="72" rx="2" fill="#FFFDF7" stroke="#9C8A74" stroke-width="1.8"/>
  <rect x="44" y="16" width="12" height="16" rx="2" fill="${c}" stroke="#9C8A74" stroke-width="1.8"/></g>`).join('')}
  <rect x="20" y="88" width="60" height="6" rx="3" fill="url(#ph-strip-s)"/>
  ${defs(`<linearGradient id="ph-strip-s" x2="1"><stop offset="0" stop-color="#E5484D"/><stop offset=".3" stop-color="#F2C230"/><stop offset=".55" stop-color="#7BC24A"/><stop offset="1" stop-color="#4A4FC8"/></linearGradient>`)}`,

  'ph-meter': `${sh(18, 50, 94)}
  <rect x="44" y="66" width="12" height="16" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <path d="M43 80h14v4q0 7-7 7t-7-7z" fill="#E4F4FA" stroke="#6F98AC" stroke-width="2"/>
  <rect x="32" y="5" width="36" height="64" rx="10" fill="url(#ph-meter-b)" stroke="#1D4F80" stroke-width="2"/>
  <rect x="37" y="12" width="26" height="18" rx="3" fill="#C4E8B4" stroke="#1D4F80" stroke-width="1.5"/>
  <text x="50" y="25.5" font-family="monospace" font-size="11" font-weight="700" fill="#24421F" text-anchor="middle">7.0</text>
  <circle cx="43" cy="41" r="4" fill="#F2C230" stroke="#1D4F80" stroke-width="1.5"/><circle cx="57" cy="41" r="4" fill="#E5484D" stroke="#1D4F80" stroke-width="1.5"/>
  <path d="M40 52h20M40 57h20M40 62h20" stroke="#1D4F80" stroke-width="1.5" opacity=".5"/>
  <path d="M36 34v28" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>
  ${defs(lg('ph-meter-b', '#5AA6E8', '#2668A8', 'h'))}`,

  'seedling-tray': `${sh(42, 50, 90)}
  <path d="M9 52h82l-6 32H15z" fill="url(#seedling-tray-t)" stroke="#2A2F35" stroke-width="2" stroke-linejoin="round"/>
  <path d="${rep(4, i => `M${30 + i * 13.5} 56l-.6 26`)}" stroke="#2A2F35" stroke-width="1.5" opacity=".6"/>
  <rect x="5" y="47" width="90" height="8" rx="3" fill="#78818B" stroke="#2A2F35" stroke-width="2"/>
  ${rep(5, i => { const x = 16 + i * 17, h = [12, 16, 11, 15, 13][i]; return `<ellipse cx="${x}" cy="49" rx="6.5" ry="2.4" fill="#6B4226"/>
  <path d="M${x} 49v-${h}" stroke="#3F8F3A" stroke-width="2.2"/>
  <path d="M${x} ${51 - h}q-8-1-9-7q7-1 9 7zM${x} ${51 - h}q8-1 9-7q-7-1-9 7z" fill="#6CC04A" stroke="#3F8F3A" stroke-width="1"/>`; })}
  ${defs(lg('seedling-tray-t', '#5E666F', '#3B4147'))}`,

  'shade-net': `${sh(44, 50, 93)}
  <circle cx="82" cy="12" r="8" fill="#F7C23C"/>
  <path d="M14 34v56M86 34v56" stroke="${WS}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M30 90q20-12 40 0z" fill="#8A5A36"/>
  ${[30, 50, 70].map((x, i) => `<path d="M${x} 88v-9" stroke="#3F8F3A" stroke-width="2"/><path d="M${x} 81q-8 0-9-7q7-1 9 7zM${x} 81q8 0 9-7q-7-1-9 7z" fill="#6CC04A"/>`).join('')}
  <path d="M5 30Q50 20 95 30v16Q50 36 5 46z" fill="#3E9B5A" stroke="#1F5E33" stroke-width="2" stroke-linejoin="round"/>
  <path d="M5 30Q50 20 95 30v16Q50 36 5 46z" fill="url(#shade-net-p)"/>
  <path d="M10 33Q50 25 90 33" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>
  ${defs(`<pattern id="shade-net-p" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0l5 5M5 0L0 5" stroke="#1F5E33" stroke-width=".9"/></pattern>`)}`,

  'label-tag': `${sh(24, 50, 92)}
  <path d="M37 10h26q5 0 5 5v50L50 86 32 65V15q0-5 5-5z" fill="url(#label-tag-g)" stroke="#8C7A5A" stroke-width="2" stroke-linejoin="round"/>
  <path d="M50 34v-8M50 28q-7 0-8-6q7-1 8 6zM50 28q7 0 8-6q-7-1-8 6z" fill="#5DB35A" stroke="#3F8F3A" stroke-width="1.5"/>
  <path d="M39 44h22M39 51h15M39 58h19" stroke="#8C7A66" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M24 92q26-20 52 0z" fill="#8A5A36"/>
  ${defs(lg('label-tag-g', '#FFFFFF', '#E7DEC8', 'h'))}`,

  // ---------- water ----------
  'bucket': `${sh(32, 50, 92)}
  <path d="M22 37q28-44 56 0" stroke="${MS}" stroke-width="3.5" fill="none"/>
  <path d="M20 36l7 50q23 8 46 0l7-50z" fill="url(#bucket-b)" stroke="#1D4F80" stroke-width="2" stroke-linejoin="round"/>
  <path d="M23 56q27 8 54 0" stroke="#1D4F80" stroke-width="1.5" opacity=".4" fill="none"/>
  <ellipse cx="50" cy="36" rx="30" ry="8" fill="#5FA8E6" stroke="#1D4F80" stroke-width="2"/>
  <ellipse cx="50" cy="37" rx="25" ry="5.5" fill="url(#bucket-w)"/>
  <path d="M28 46l5 34" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>
  <circle cx="21" cy="40" r="3" fill="#1D4F80"/><circle cx="79" cy="40" r="3" fill="#1D4F80"/>
  ${defs(lg('bucket-b', '#5AA6E8', '#2668A8', 'h'), lg('bucket-w', '#D2EEFC', '#86C9EE'))}`,

  'mug': `${sh(28, 48, 92)}
  <path d="M68 42q18 0 18 16t-18 16" stroke="#9E2B4F" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M68 42q18 0 18 16t-18 16" stroke="#E8587A" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  <path d="M20 30h52l-5 54q-21 8-42 0z" fill="url(#mug-b)" stroke="#9E2B4F" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="46" cy="30" rx="26" ry="7" fill="#F69AB0" stroke="#9E2B4F" stroke-width="2"/>
  <ellipse cx="46" cy="31" rx="21" ry="4.5" fill="#9AD6F4"/>
  <path d="M28 40l3 38" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>
  ${defs(lg('mug-b', '#F47C98', '#C93B60', 'h'))}`,

  'tap': tapArt('tap'),

  'leaking-tap': `${tapArt('leaking-tap')}
  <ellipse cx="69" cy="93" rx="16" ry="3.5" fill="#86C9EE" opacity=".8"/>
  <ellipse cx="69" cy="93" rx="8" ry="1.6" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/>
  <path d="M69 72q-5 7-5 10a5 5 0 0 0 10 0q0-3-5-10z" fill="#4DA8E8" stroke="#1F6FAE" stroke-width="1.5"/>
  <path d="M69 84q-3 4-3 6a3 3 0 0 0 6 0q0-2-3-6z" fill="#4DA8E8"/>
  <path d="M67 80q0-2 1-3" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`,

  'pipe': `${sh(26, 56, 92)}
  <rect x="4" y="30" width="58" height="18" fill="url(#pipe-v)" stroke="${MS}" stroke-width="2"/>
  <path d="M60 30A24 24 0 0 1 84 54H64A4 4 0 0 0 60 50z" fill="url(#pipe-d)" stroke="${MS}" stroke-width="2"/>
  <rect x="64" y="52" width="20" height="22" fill="url(#pipe-h)" stroke="${MS}" stroke-width="2"/>
  <rect x="2" y="27" width="7" height="24" rx="2" fill="#B9C4CC" stroke="${MS}" stroke-width="2"/>
  <rect x="52" y="27" width="8" height="24" rx="2" fill="#B9C4CC" stroke="${MS}" stroke-width="2"/>
  <rect x="61" y="52" width="26" height="7" rx="2" fill="#B9C4CC" stroke="${MS}" stroke-width="2"/>
  <rect x="61" y="72" width="26" height="7" rx="2" fill="#B9C4CC" stroke="${MS}" stroke-width="2"/>
  <path d="M12 35h38" stroke="#fff" stroke-width="2.5" opacity=".7" stroke-linecap="round"/>
  <path d="M74 80v8" stroke="#4DA8E8" stroke-width="5" stroke-linecap="round"/>
  ${defs(lg('pipe-v', '#F1F4F6', '#8796A3'), metal('pipe-h'), metal('pipe-d', 'd'))}`,

  'water-meter': `${sh(40, 50, 92)}
  <rect x="3" y="56" width="94" height="14" fill="url(#water-meter-p)" stroke="#8A6414" stroke-width="2"/>
  <rect x="7" y="51" width="11" height="24" rx="2" fill="#E2B24A" stroke="#8A6414" stroke-width="2"/>
  <rect x="82" y="51" width="11" height="24" rx="2" fill="#E2B24A" stroke="#8A6414" stroke-width="2"/>
  <circle cx="50" cy="48" r="31" fill="url(#water-meter-b)" stroke="#1D4F80" stroke-width="2"/>
  <circle cx="50" cy="48" r="23" fill="#F8FBFD" stroke="#1D4F80" stroke-width="2"/>
  <rect x="34" y="35" width="32" height="11" rx="2" fill="#2B2F36"/>
  <text x="50" y="43.6" font-family="monospace" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">0254</text>
  <circle cx="50" cy="59" r="7" fill="none" stroke="#9AA7B1" stroke-width="1.5"/>
  <path d="M50 59l4-5" stroke="#D9483B" stroke-width="2" stroke-linecap="round"/>
  <path d="M27 36q6-13 20-16" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
  ${defs(lg('water-meter-p', '#F6D27A', '#B8862A'), lg('water-meter-b', '#5AA6E8', '#2668A8', 'd'))}`,

  'water-tank': `${sh(36, 50, 93)}
  <path d="M80 78h8v8" stroke="#8D9AA5" stroke-width="5" fill="none" stroke-linejoin="round"/>
  <path d="M30 24q0-12 20-12t20 12z" fill="#5FA8E6" stroke="#1D4F80" stroke-width="2"/>
  <rect x="42" y="7" width="16" height="6" rx="3" fill="#2668A8"/>
  <path d="M20 30q0-6 6-6h48q6 0 6 6v54q0 6-6 6H26q-6 0-6-6z" fill="url(#water-tank-b)" stroke="#1D4F80" stroke-width="2"/>
  <path d="M20 42h60M20 57h60M20 72h60" stroke="#1D4F80" stroke-width="2" opacity=".35"/>
  <path d="M20 44h60M20 59h60M20 74h60" stroke="#fff" stroke-width="1.5" opacity=".25"/>
  <path d="M27 30v52" stroke="#fff" stroke-width="4" opacity=".3" stroke-linecap="round"/>
  ${defs(lg('water-tank-b', '#6BB3EC', '#2668A8', 'h'))}`,

  'shower': `
  <path d="M6 5v16h44v6" stroke="${MS}" stroke-width="8" fill="none" stroke-linejoin="round"/>
  <path d="M6 5v16h44v6" stroke="#C3CDD5" stroke-width="4.5" fill="none" stroke-linejoin="round"/>
  <path d="${rep(6, i => `M${38 + i * 5} 44l${(i - 2.5) * 4} 46`)}" stroke="#5DB6EE" stroke-width="2.6" stroke-dasharray="7 5" stroke-linecap="round"/>
  <path d="M42 28h16l14 12H28z" fill="url(#shower-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="50" cy="41" rx="22" ry="4.5" fill="#AEB9C2" stroke="${MS}" stroke-width="2"/>
  <g fill="${MS}">${rep(5, i => `<circle cx="${38 + i * 6}" cy="41.5" r="1.1"/>`)}</g>
  <path d="M38 34h10" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  ${defs(metal('shower-m'))}`,

  'toilet': `${sh(36, 50, 93)}
  <rect x="58" y="12" width="30" height="40" rx="5" fill="url(#toilet-w)" stroke="#7F97A8" stroke-width="2"/>
  <rect x="55" y="8" width="36" height="7" rx="3" fill="#FFFFFF" stroke="#7F97A8" stroke-width="2"/>
  <rect x="68" y="3" width="10" height="5" rx="2" fill="#9AA7B1"/>
  <path d="M14 54h72v6q0 18-22 21l-2 9H38l2-9q-26-3-26-21z" fill="url(#toilet-w)" stroke="#7F97A8" stroke-width="2" stroke-linejoin="round"/>
  <rect x="9" y="47" width="64" height="8" rx="4" fill="#FFFFFF" stroke="#7F97A8" stroke-width="2"/>
  <path d="M22 62q5 10 18 13M64 18v28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${defs(lg('toilet-w', '#FFFFFF', '#C8D5DF', 'h'))}`,

  'washing-machine': `${sh(34, 50, 94)}
  <rect x="16" y="8" width="68" height="83" rx="8" fill="url(#washing-machine-b)" stroke="#7F97A8" stroke-width="2"/>
  <path d="M16 24h68" stroke="#7F97A8" stroke-width="2"/>
  <rect x="40" y="12" width="20" height="8" rx="2" fill="#2B3A4A"/><rect x="42" y="14" width="8" height="4" fill="#5FE08A"/>
  <circle cx="25" cy="16" r="2.6" fill="#4DA8E8"/><circle cx="32" cy="16" r="2.6" fill="#F28C38"/>
  <circle cx="72" cy="16" r="5" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <circle cx="50" cy="58" r="25" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <circle cx="50" cy="58" r="19" fill="url(#washing-machine-g)" stroke="${MS}" stroke-width="2"/>
  <path d="M32 62q9-6 18 0t18 0v1a19 19 0 0 1-36 0z" fill="#3E8FD6" opacity=".75"/>
  <path d="M40 66q4-8 10-3t4 6z" fill="#E5484D"/>
  <circle cx="58" cy="54" r="2" fill="#fff" opacity=".8"/><circle cx="62" cy="60" r="1.4" fill="#fff" opacity=".8"/>
  <path d="M38 50q4-7 12-8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".85"/>
  ${defs(lg('washing-machine-b', '#FFFFFF', '#CCD7E0', 'h'), rg('washing-machine-g', '#E6F5FD', '#8CC4E6'))}`,

  'rain-barrel': `${sh(32, 50, 93)}
  <path d="M5 6h23v26" stroke="${MS}" stroke-width="9" fill="none" stroke-linejoin="round"/>
  <path d="M5 6h23v26" stroke="#B9C4CC" stroke-width="5.5" fill="none" stroke-linejoin="round"/>
  <path d="M24 34q-4 26 0 52q26 6 52 0q4-26 0-52" fill="url(#rain-barrel-g)" stroke="#2C6E3F" stroke-width="2"/>
  <path d="M22 50q28 6 56 0M22 72q28 6 56 0" stroke="#2C6E3F" stroke-width="2.2" fill="none" opacity=".6"/>
  <ellipse cx="50" cy="34" rx="26" ry="6" fill="#7CCB86" stroke="#2C6E3F" stroke-width="2"/>
  <ellipse cx="50" cy="34.5" rx="20" ry="3.6" fill="#5DB6EE"/>
  <path d="M30 40q-2 22 0 42" stroke="#fff" stroke-width="3.5" opacity=".3" stroke-linecap="round" fill="none"/>
  <path d="M75 76h9v6" stroke="#B8862A" stroke-width="4.5" fill="none" stroke-linejoin="round"/>
  <g fill="#4DA8E8">${[[60, 10], [74, 18], [88, 8], [84, 26]].map(([x, y]) => `<path d="M${x} ${y}q-3 5-3 7a3 3 0 0 0 6 0q0-2-3-7z"/>`).join('')}</g>
  ${defs(lg('rain-barrel-g', '#6CC07A', '#2F8A4A', 'h'))}`,

  // ---------- simple machines ----------
  'lever': `${sh(42, 50, 90)}
  <path d="M40 52L25 86h30z" fill="url(#lever-f)" stroke="#9A4A12" stroke-width="2" stroke-linejoin="round"/>
  <g transform="rotate(10 40 52)">
  <rect x="3" y="45" width="94" height="7" rx="3" fill="url(#lever-w)" stroke="${WS}" stroke-width="2"/>
  <rect x="7" y="27" width="20" height="18" rx="2" fill="#5FA8E6" stroke="#1D4F80" stroke-width="2"/>
  <path d="M7 36h20M17 27v18" stroke="#1D4F80" stroke-width="1.5" opacity=".5"/></g>
  <path d="M86 12v22" stroke="#D9483B" stroke-width="5" stroke-linecap="round"/><path d="M78 30l8 11 8-11z" fill="#D9483B"/>
  ${defs(lg('lever-f', '#FBB55A', '#D9741C', 'h'), wood('lever-w', 'v'))}`,

  'pulley': `${sh(16, 33, 92)}
  <rect x="18" y="3" width="64" height="8" rx="3" fill="url(#pulley-w)" stroke="${WS}" stroke-width="2"/>
  <path d="M50 11v12" stroke="${MS}" stroke-width="4"/>
  <path d="M33 30v42M67 30v56M33 30a17 17 0 0 1 34 0" stroke="#7A5A22" stroke-width="5" fill="none"/>
  <path d="M33 30v42M67 30v56M33 30a17 17 0 0 1 34 0" stroke="#D9B26F" stroke-width="2.5" fill="none"/>
  <circle cx="50" cy="30" r="14" fill="url(#pulley-m)" stroke="${MS}" stroke-width="2"/>
  <circle cx="50" cy="30" r="9" fill="none" stroke="#7D8A95" stroke-width="2"/><circle cx="50" cy="30" r="3.5" fill="${MS}"/>
  <path d="M24 72q9-12 18 0" stroke="${MS}" stroke-width="2" fill="none"/>
  <path d="M21 72h24l-3 18H24z" fill="url(#pulley-b)" stroke="#8A6414" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="67" cy="88" r="3.5" fill="#7A5A22"/>
  <path d="M82 54v18" stroke="#D9483B" stroke-width="4" stroke-linecap="round"/><path d="M76 68l6 9 6-9z" fill="#D9483B"/>
  ${defs(wood('pulley-w', 'v'), metal('pulley-m', 'd'), lg('pulley-b', '#F6D27A', '#C9962E', 'h'))}`,

  'wheel-axle': `${sh(34, 50, 92)}
  <path d="M46 42L26 90M46 42l22 48" stroke="#7A4520" stroke-width="5" stroke-linecap="round"/>
  <path d="M54 42v34" stroke="#7A5A22" stroke-width="4"/><path d="M54 42v34" stroke="#D9B26F" stroke-width="2"/>
  <rect x="45" y="76" width="18" height="15" rx="2" fill="#5FA8E6" stroke="#1D4F80" stroke-width="2"/>
  <path d="${rep(6, i => `M46 42L${pt(46, 42, 27, i * 60 + 15)}`)}" stroke="${WS}" stroke-width="3.5"/>
  <circle cx="46" cy="42" r="29" fill="none" stroke="${WS}" stroke-width="8"/>
  <circle cx="46" cy="42" r="29" fill="none" stroke="url(#wheel-axle-w)" stroke-width="5"/>
  <circle cx="46" cy="42" r="9" fill="url(#wheel-axle-m)" stroke="${MS}" stroke-width="2"/>
  <circle cx="46" cy="42" r="3" fill="${MS}"/>
  <path d="M70 18l8-8" stroke="${MS}" stroke-width="4" stroke-linecap="round"/><circle cx="79" cy="9" r="5" fill="#D9483B" stroke="#8E2A22" stroke-width="2"/>
  ${defs(wood('wheel-axle-w', 'd'), metal('wheel-axle-m', 'd'))}`,

  'inclined-plane': `${sh(44, 50, 91)}
  <path d="M5 88h90V34z" fill="url(#inclined-plane-w)" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M46 80h42M66 70h24M80 58h10" stroke="${WS}" stroke-width="1.5" opacity=".45" stroke-linecap="round"/>
  <g transform="translate(44 64.4) rotate(-31)"><rect x="-11" y="-21" width="22" height="20" rx="2" fill="url(#inclined-plane-c)" stroke="#9A4A12" stroke-width="2"/>
  <path d="M-11 -11h22M-3 -21v20" stroke="#9A4A12" stroke-width="1.5" opacity=".6"/>
  <path d="M16 -14h16" stroke="#D9483B" stroke-width="4.5" stroke-linecap="round"/><path d="M30 -21l10 7-10 7z" fill="#D9483B"/></g>
  ${defs(wood('inclined-plane-w', 'v'), lg('inclined-plane-c', '#FBB55A', '#E07D24'))}`,

  'wedge': `${sh(32, 50, 92)}
  <circle cx="50" cy="62" r="29" fill="#7A4520"/>
  <circle cx="50" cy="62" r="25" fill="url(#wedge-w)"/>
  <circle cx="50" cy="62" r="17" fill="none" stroke="${WS}" stroke-width="1.5" opacity=".5"/>
  <circle cx="50" cy="62" r="9" fill="none" stroke="${WS}" stroke-width="1.5" opacity=".5"/>
  <path d="M43 34l7 38 7-38z" fill="#4A2A12"/>
  <path d="M50 72l-3 7 4 6" stroke="#4A2A12" stroke-width="2" fill="none" stroke-linejoin="round"/>
  <path d="M38 8h24L50 56z" fill="url(#wedge-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <rect x="36" y="4" width="28" height="7" rx="2" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <path d="M44 14l5 26" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>
  <path d="M24 10l6 4M76 10l-6 4M22 22l7 1M78 22l-7 1" stroke="#F2A93B" stroke-width="2.5" stroke-linecap="round"/>
  ${defs(rg('wedge-w', '#F6D3A0', '#D6994F'), metal('wedge-m'))}`,

  'screw': `${sh(18, 54, 92)}
  <g transform="rotate(22 50 50)">
  <path d="M42 22h16v44L50 94 42 66z" fill="url(#screw-m)" stroke="#8A6414" stroke-width="2" stroke-linejoin="round"/>
  <path d="${rep(6, i => `M41 ${30 + i * 7}l18-5`)}M43 72l13-4M45.5 79l8-2.5" stroke="#8A6414" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M29 20q0-14 21-14t21 14z" fill="url(#screw-m)" stroke="#8A6414" stroke-width="2" stroke-linejoin="round"/>
  <path d="M50 6v8" stroke="#8A6414" stroke-width="3"/>
  <path d="M36 15q2-5 8-6" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>
  ${defs(lg('screw-m', '#FBE3A0', '#C9962E', 'h'))}`,

  'gear': `${sh(36, 46, 92)}
  <path d="${cog(40, 58, 30, 7, 10)}" fill="url(#gear-o)" stroke="#9A4A12" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="40" cy="58" r="11" fill="#FBB55A" stroke="#9A4A12" stroke-width="2"/><circle cx="40" cy="58" r="4.5" fill="#9A4A12"/>
  <path d="${cog(73.5, 25.5, 19, 6, 7)}" fill="url(#gear-b)" stroke="#1D4F80" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="73.5" cy="25.5" r="6.5" fill="#8CC4F0" stroke="#1D4F80" stroke-width="2"/><circle cx="73.5" cy="25.5" r="2.6" fill="#1D4F80"/>
  <path d="M22 46q5-9 14-12" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
  ${defs(lg('gear-o', '#FDBA5C', '#DD7420', 'd'), lg('gear-b', '#6BB3EC', '#2A6DB5', 'd'))}`,

  'spring': `${sh(24, 50, 93)}
  <path d="${rep(7, i => { const y = 16 + i * 9.5; return `M72 ${y + 4.5}Q50 ${y - 1} 28 ${y + 9.5}`; })}" stroke="#56626C" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  <path d="${rep(7, i => { const y = 16 + i * 9.5; return `M28 ${y}Q50 ${y + 11} 72 ${y + 4.5}`; })}" stroke="${MS}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="${rep(7, i => { const y = 16 + i * 9.5; return `M28 ${y}Q50 ${y + 11} 72 ${y + 4.5}`; })}" stroke="url(#spring-m)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M28 16h-6M28 82.5h-6" stroke="${MS}" stroke-width="5" stroke-linecap="round"/>
  ${defs(metal('spring-m'))}`,

  'rubber-band': `
  ${[['40', '40', '26', '15', '-18', '#B82E2E', '#F0705F'], ['60', '54', '24', '13', '22', '#B5851A', '#F7CF4A'], ['46', '70', '25', '12', '-4', '#2C7A3F', '#6CC07A']].map(([x, y, rx, ry, a, d, l]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="none" stroke="${d}" stroke-width="6.5"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="none" stroke="${l}" stroke-width="3.5"/>`).join('')}`,

  // ---------- waste-material toys ----------
  'balloon': `
  <path d="M50 76q-5 6 0 10t-1 10" stroke="#8C7A66" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M50 6c18 0 28 14 28 30c0 18-14 32-28 36c-14-4-28-18-28-36c0-16 10-30 28-30z" fill="url(#balloon-r)"/>
  <path d="M45 77l5-6 5 6z" fill="#B82E2E"/>
  <ellipse cx="38" cy="25" rx="5" ry="9" transform="rotate(25 38 25)" fill="#fff" opacity=".55"/>
  ${defs(rg('balloon-r', '#FF8E80', '#C2392C'))}`,

  'plastic-bottle': `${sh(18, 50, 93)}
  <rect x="41" y="5" width="18" height="9" rx="2" fill="#2F7FC1" stroke="#1D4F80" stroke-width="2"/>
  <path d="M43 14h14v6q12 6 12 18v46q0 6-6 6H37q-6 0-6-6V38q0-12 12-18z" fill="url(#plastic-bottle-b)" stroke="#3C8EBB" stroke-width="2" stroke-linejoin="round"/>
  <path d="M32 70h36v14q0 5-5 5H37q-5 0-5-5z" fill="#6FBDEA" opacity=".55"/>
  <rect x="31" y="50" width="38" height="15" fill="#4FA862"/>
  <path d="M33 42h34M33 46h34" stroke="#3C8EBB" stroke-width="1.3" opacity=".5"/>
  <path d="M37 30q-1 4-1 8v42" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round" fill="none"/>
  ${defs(lg('plastic-bottle-b', '#EAF7FD', '#A9DAF2', 'h'))}`,

  'straw': `<g transform="rotate(16 50 50)">
  <path d="M52 96V36q0-8-6-14L32 6" stroke="#B82E2E" stroke-width="11" fill="none"/>
  <path d="M52 96V36q0-8-6-14L32 6" stroke="#F25F5C" stroke-width="7.5" fill="none"/>
  <path d="M52 96V36q0-8-6-14L32 6" stroke="#fff" stroke-width="7.5" fill="none" stroke-dasharray="5 5"/>
  <path d="M47 38h10M47 34h10M46 30h10" stroke="#B82E2E" stroke-width="1" opacity=".6"/></g>`,

  'ice-cream-stick': `${sh(30, 50, 91)}
  <g stroke="#A97B3D" stroke-width="2" fill="url(#ice-cream-stick-w)">${['-28', '0', '28'].map(a => `<rect x="42" y="8" width="16" height="80" rx="8" transform="rotate(${a} 50 84)"/>`).join('')}</g>
  <path d="M46 20v56" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>
  <path d="M53 26q1 20 0 40" stroke="#C9A066" stroke-width="1.2" fill="none"/>
  ${defs(lg('ice-cream-stick-w', '#F8E2B6', '#DDB373', 'h'))}`,

  'cardboard': `${sh(40, 52, 92)}
  <path d="M10 46h52v42H10z" fill="url(#cardboard-f)" stroke="#7A4E22" stroke-width="2" stroke-linejoin="round"/>
  <path d="M62 46l28-13v42L62 88z" fill="#B98546" stroke="#7A4E22" stroke-width="2" stroke-linejoin="round"/>
  <path d="M10 46l28-13h52L62 46z" fill="#EDC283" stroke="#7A4E22" stroke-width="2" stroke-linejoin="round"/>
  <path d="M31 46l28-13h9L40 46z" fill="#E9DDB8" opacity=".9"/>
  <rect x="31" y="46" width="9" height="13" fill="#E9DDB8" opacity=".9"/>
  <path d="M14 70h18M14 75h12" stroke="#7A4E22" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>
  ${defs(lg('cardboard-f', '#E6B572', '#C99350'))}`,

  'glue': `${sh(22, 50, 93)}
  <path d="M45 18l5-14 5 14z" fill="#F28C38" stroke="#9A4A12" stroke-width="2" stroke-linejoin="round"/>
  <rect x="39" y="17" width="22" height="12" rx="2" fill="#F28C38" stroke="#9A4A12" stroke-width="2"/>
  <path d="M36 29h28q6 0 6 8v47q0 6-6 6H36q-6 0-6-6V37q0-8 6-8z" fill="url(#glue-b)" stroke="#8E9CA8" stroke-width="2"/>
  <rect x="31" y="48" width="38" height="24" fill="#2F7FC1"/>
  <path d="M50 52q-6 8-6 11a6 6 0 0 0 12 0q0-3-6-11z" fill="#fff"/>
  <path d="M36 36v46" stroke="#fff" stroke-width="3" opacity=".8" stroke-linecap="round"/>
  ${defs(lg('glue-b', '#FFFFFF', '#D3DCE3', 'h'))}`,

  'scissors': `${sh(26, 50, 93)}
  <g transform="rotate(-24 50 54)">
  <path d="M46 56L37 6q7-1 17 46z" fill="url(#scissors-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M54 56L63 6q-7-1-17 46z" fill="url(#scissors-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M47 57l-8 13M53 57l8 13" stroke="#5B3C8E" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="35" cy="78" rx="11" ry="10" fill="none" stroke="#5B3C8E" stroke-width="9"/>
  <ellipse cx="65" cy="78" rx="11" ry="10" fill="none" stroke="#5B3C8E" stroke-width="9"/>
  <path d="M47 57l-8 13M53 57l8 13" stroke="#9A6FD8" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="35" cy="78" rx="11" ry="10" fill="none" stroke="#9A6FD8" stroke-width="5"/>
  <ellipse cx="65" cy="78" rx="11" ry="10" fill="none" stroke="#9A6FD8" stroke-width="5"/>
  <circle cx="50" cy="54" r="3.5" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/></g>
  ${defs(metal('scissors-m'))}`,

  'tape': `${sh(34, 50, 92)}
  <path d="M70 72q16 5 22 18l-8 3q-6-11-18-15z" fill="#E3C77D" stroke="#A88A3E" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="${ring(46, 52, 33, 17)}" fill-rule="evenodd" fill="url(#tape-t)" stroke="#A88A3E" stroke-width="2"/>
  <circle cx="46" cy="52" r="26" fill="none" stroke="#A88A3E" stroke-width="1.2" opacity=".45"/>
  <path d="${ring(46, 52, 17, 13)}" fill-rule="evenodd" fill="#B98546" stroke="#7A4E22" stroke-width="1.5"/>
  <path d="M22 40q6-14 22-18" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
  ${defs(rg('tape-t', '#F6E3A8', '#D6B45E'))}`,

  'catapult': `${sh(42, 50, 91)}
  <rect x="8" y="78" width="84" height="9" rx="4.5" fill="url(#catapult-w)" stroke="#A97B3D" stroke-width="2"/>
  <rect x="54" y="62" width="13" height="17" rx="2" fill="#E8C68A" stroke="#A97B3D" stroke-width="2"/>
  <path d="M54 66h13M54 70h13M54 74h13" stroke="#A97B3D" stroke-width="1.2"/>
  <path d="M60.5 61v19" stroke="#E5484D" stroke-width="2.5"/>
  <g transform="rotate(-20 14 78)">
  <rect x="8" y="70" width="86" height="9" rx="4.5" fill="url(#catapult-w)" stroke="#A97B3D" stroke-width="2"/>
  <path d="M78 70v-6h14v6" fill="#2F7FC1" stroke="#1D4F80" stroke-width="2" stroke-linejoin="round"/></g>
  <path d="M10 74v12M14 72v14" stroke="#E5484D" stroke-width="2.5"/>
  <path d="M86 40q-4-18-16-24" stroke="#C9A066" stroke-width="2" fill="none" stroke-dasharray="3 4" stroke-linecap="round"/>
  <circle cx="64" cy="14" r="7" fill="url(#catapult-b)" stroke="#B5851A" stroke-width="2"/>
  ${defs(lg('catapult-w', '#F8E2B6', '#DDB373'), rg('catapult-b', '#FFE68A', '#F2B730'))}`,

  'toy-car': `${sh(40, 52, 89)}
  <path d="M8 70q0-12 10-14l12-2 10-16q3-4 8-4h20q6 0 10 6l7 12q9 2 9 12v6q0 4-4 4H12q-4 0-4-4z" fill="url(#toy-car-r)" stroke="#8E2A22" stroke-width="2" stroke-linejoin="round"/>
  <path d="M43 52l7-12q1-2 4-2h9v14zM67 38h3q4 0 6 4l5 10H67z" fill="#BDE6FA" stroke="#8E2A22" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M16 62h72" stroke="#fff" stroke-width="2.5" opacity=".4" stroke-linecap="round"/>
  <circle cx="89" cy="64" r="3" fill="#FFE07A"/><rect x="8" y="61" width="5" height="5" rx="1.5" fill="#FFB0A0"/>
  ${[28, 74].map(x => `<circle cx="${x}" cy="76" r="11" fill="#3E444B" stroke="#6B737C" stroke-width="2"/><circle cx="${x}" cy="76" r="4.5" fill="url(#toy-car-m)"/>`).join('')}
  ${defs(lg('toy-car-r', '#FF7A66', '#C9362A'), metal('toy-car-m', 'd'))}`,

  'balloon-car': `${sh(40, 52, 92)}
  <path d="M16 56q0-8 8-8h44q8 0 12 4l6 2h4v12h-4l-6 2q-4 4-12 4H24q-8 0-8-8z" fill="url(#balloon-car-b)" stroke="#3C8EBB" stroke-width="2" stroke-linejoin="round"/>
  <rect x="88" y="53" width="7" height="14" rx="2" fill="#2F7FC1" stroke="#1D4F80" stroke-width="1.5"/>
  <path d="M22 54h52" stroke="#fff" stroke-width="2.5" opacity=".8" stroke-linecap="round"/>
  <path d="M58 46H8" stroke="#B82E2E" stroke-width="5" stroke-linecap="round"/><path d="M58 46H8" stroke="#F7B3C2" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="66" cy="27" rx="16" ry="18" transform="rotate(25 66 27)" fill="url(#balloon-car-p)"/>
  <path d="M58 44l-2 4h6z" fill="#B0204A"/>
  <ellipse cx="60" cy="19" rx="3.5" ry="6" transform="rotate(30 60 19)" fill="#fff" opacity=".5"/>
  <g fill="#B8C4CE"><circle cx="4" cy="42" r="2.4"/><circle cx="3" cy="50" r="1.8"/></g>
  ${[[30, '#F2C230', '#B5851A'], [72, '#E5484D', '#8E2A22']].map(([x, c, d]) => `<circle cx="${x}" cy="76" r="10" fill="${c}" stroke="${d}" stroke-width="2"/><circle cx="${x}" cy="76" r="5" fill="none" stroke="${d}" stroke-width="1.2" opacity=".6"/><circle cx="${x}" cy="76" r="2" fill="${d}"/>`).join('')}
  ${defs(lg('balloon-car-b', '#EAF7FD', '#A9DAF2'), rg('balloon-car-p', '#FF9FBF', '#D9306A'))}`,

  'propeller-boat': `
  <path d="M8 60h76l10-4-6 16q-2 6-8 6H20q-6 0-9-8z" fill="url(#propeller-boat-h)" stroke="#9A4A12" stroke-width="2" stroke-linejoin="round"/>
  <path d="M12 66h74" stroke="#fff" stroke-width="2.5" opacity=".5" stroke-linecap="round"/>
  <rect x="44" y="48" width="26" height="12" rx="3" fill="#FFF3D6" stroke="#9A4A12" stroke-width="2"/>
  <rect x="21" y="34" width="5" height="27" fill="#7D8A95"/>
  <g transform="translate(23.5 30)">${rep(3, i => `<path d="M0 0c-6-6-4-16 2-17c6 1 4 11-2 17z" transform="rotate(${i * 120})" fill="#5FA8E6" stroke="#1D4F80" stroke-width="1.5"/>`)}<circle r="3.5" fill="#E5484D"/></g>
  <path d="M2 28h-0M6 20q-4 10 0 20" stroke="#B8C4CE" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M2 82q8-6 16 0t16 0 16 0 16 0 16 0 16 0V96H2z" fill="url(#propeller-boat-w)"/>
  <path d="M8 86q6-3 12 0M48 88q6-3 12 0" stroke="#fff" stroke-width="1.8" fill="none" opacity=".7"/>
  ${defs(lg('propeller-boat-h', '#FDBA5C', '#DD7420'), lg('propeller-boat-w', '#7CC4EE', '#3E8FC0'))}`,

  'windmill': `${sh(28, 50, 93)}
  <path d="M36 90l5-50h18l5 50z" fill="url(#windmill-t)" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M45 90v-9q5-5 10 0v9z" fill="${WS}"/><circle cx="50" cy="62" r="4" fill="#5FA8E6" stroke="${WS}" stroke-width="1.5"/>
  <path d="M37 42l13-12 13 12z" fill="#D9483B" stroke="#8E2A22" stroke-width="2" stroke-linejoin="round"/>
  ${rep(4, i => `<g transform="rotate(${i * 90 + 20} 50 36)"><path d="M50 36V5" stroke="${WS}" stroke-width="2.5"/><rect x="51" y="6" width="11" height="25" fill="#FFF7EA" stroke="${WS}" stroke-width="1.6"/><path d="M51 14h11M51 22h11M56.5 6v25" stroke="${WS}" stroke-width="1"/></g>`)}
  <circle cx="50" cy="36" r="4.5" fill="#7A4520"/>
  ${defs(lg('windmill-t', '#F6E7C8', '#D9BF8E', 'h'))}`,

  // ---------- bicycle and tools ----------
  'bicycle': `${sh(44, 50, 89)}
  ${[24, 76].map(x => `<circle cx="${x}" cy="66" r="19" fill="none" stroke="#3E444B" stroke-width="5"/><circle cx="${x}" cy="66" r="15.5" fill="none" stroke="#B9C4CC" stroke-width="1.8"/>
  <path d="${rep(6, i => `M${x} 66L${pt(x, 66, 15, i * 30)}`)}" stroke="#B9C4CC" stroke-width=".9"/><path d="${rep(6, i => `M${x} 66L${pt(x, 66, 15, i * 30 + 180)}`)}" stroke="#B9C4CC" stroke-width=".9"/><circle cx="${x}" cy="66" r="2.5" fill="${MS}"/>`).join('')}
  <path d="M24 63L48 61M24 69L48 71" stroke="#6B7782" stroke-width="1.4"/>
  <path d="M24 66H48L41 40ZM41 40L70 38 48 66M70 38L76 66" stroke="#B62F22" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M24 66H48L41 40ZM41 40L70 38 48 66M70 38L76 66" stroke="#F0604C" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M41 40l-1.5-6M70 38l-2-9" stroke="${MS}" stroke-width="3"/>
  <path d="M31 33q8-4 16 0q-2 3-8 3t-8-3z" fill="#3E444B" stroke="#22262B" stroke-width="1.5"/>
  <path d="M60 29q8-3 14 1" stroke="#3E444B" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="66" r="5" fill="url(#bicycle-m)" stroke="${MS}" stroke-width="1.5"/>
  <path d="M48 66l6 8" stroke="${MS}" stroke-width="3" stroke-linecap="round"/><rect x="51" y="73" width="9" height="3.5" rx="1.5" fill="#3E444B"/>
  ${defs(metal('bicycle-m', 'd'))}`,

  'tyre': `${sh(30, 50, 92)}
  <path d="${ring(50, 48, 39, 24)}" fill-rule="evenodd" fill="url(#tyre-r)" stroke="#23272C" stroke-width="2"/>
  <circle cx="50" cy="48" r="35.5" fill="none" stroke="#69717A" stroke-width="4.5" stroke-dasharray="5 4"/>
  <path d="${ring(50, 48, 24, 20)}" fill-rule="evenodd" fill="url(#tyre-m)" stroke="${MS}" stroke-width="1.5"/>
  <rect x="47.5" y="66" width="5" height="9" rx="1.5" fill="#B9C4CC" stroke="${MS}" stroke-width="1"/>
  <path d="M20 34q8-18 28-22" stroke="#fff" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>
  ${defs(rg('tyre-r', '#5D646D', '#33383E'), metal('tyre-m', 'd'))}`,

  'air-pump': `${sh(32, 50, 93)}
  <path d="M58 78q24 6 24-16t8-30" stroke="#2E3338" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M58 78q24 6 24-16t8-30" stroke="#5D646D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="85" y="20" width="9" height="13" rx="2" fill="#B9C4CC" stroke="${MS}" stroke-width="1.5"/>
  <path d="M20 90q0-6 6-6h48q6 0 6 6z" fill="#4A5058" stroke="#2E3338" stroke-width="2"/>
  <rect x="48" y="10" width="4" height="14" fill="#B9C4CC" stroke="${MS}" stroke-width="1"/>
  <rect x="28" y="5" width="44" height="9" rx="4.5" fill="#4A5058" stroke="#2E3338" stroke-width="2"/>
  <path d="M33 8h14" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>
  <rect x="41" y="22" width="18" height="64" rx="5" fill="url(#air-pump-b)" stroke="#1D4F80" stroke-width="2"/>
  <path d="M45 28v40" stroke="#fff" stroke-width="2.5" opacity=".4" stroke-linecap="round"/>
  <circle cx="50" cy="72" r="9" fill="#fff" stroke="#1D4F80" stroke-width="2"/>
  <path d="M50 72l4-5" stroke="#D9483B" stroke-width="2" stroke-linecap="round"/>
  ${defs(lg('air-pump-b', '#5AA6E8', '#2668A8', 'h'))}`,

  'spanner': `${sh(30, 50, 90)}
  <defs><g id="spanner-s"><path d="M5.9 45H22V55H5.9A15 15 0 1 0 5.9 45Z"/><rect x="28" y="44" width="50" height="12" rx="5"/>
  <path fill-rule="evenodd" d="M70 50a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM${rep(6, i => `${i ? 'L' : ''}${pt(82, 50, 6, i * 60)}`)}Z"/></g>${metal('spanner-m', 'd')}</defs>
  <g transform="rotate(-38 50 50)"><use href="#spanner-s" fill="none" stroke="${MS}" stroke-width="4" stroke-linejoin="round"/><use href="#spanner-s" fill="url(#spanner-m)"/>
  <path d="M30 47h44" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/></g>`,

  'screwdriver': `${sh(30, 50, 90)}
  <g transform="rotate(-42 50 50)">
  <rect x="50" y="46.5" width="36" height="7" fill="url(#screwdriver-m)" stroke="${MS}" stroke-width="1.6"/>
  <path d="M86 46.5l8 2.5v2l-8 2.5z" fill="#AEB9C2" stroke="${MS}" stroke-width="1.6" stroke-linejoin="round"/>
  <rect x="44" y="44" width="8" height="12" rx="2" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/>
  <rect x="6" y="39" width="40" height="22" rx="10" fill="url(#screwdriver-h)" stroke="#8E2A22" stroke-width="2"/>
  <path d="M14 46h26M14 54h26" stroke="#8E2A22" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>
  <path d="M13 43h24" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>
  <path d="M30 39v22" stroke="#F2C230" stroke-width="4"/></g>
  ${defs(metal('screwdriver-m', 'v'), lg('screwdriver-h', '#FF7A66', '#C2392C'))}`,

  'pliers': `${sh(26, 50, 93)}
  <path d="M46 52L32 90M54 52l14 38" stroke="${MS}" stroke-width="8" stroke-linecap="round"/>
  <path d="M46 52L32 90M54 52l14 38" stroke="#AEB9C2" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M39 68l-7 22M61 68l7 22" stroke="#1D4F80" stroke-width="11" stroke-linecap="round"/>
  <path d="M39 68l-7 22M61 68l7 22" stroke="#4D9BE0" stroke-width="7.5" stroke-linecap="round"/>
  <path d="M43 50Q41 24 48 7q2-2 4 0q7 17 5 43z" fill="url(#pliers-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M50 9v40" stroke="${MS}" stroke-width="1.5"/>
  <path d="M46 20h8M45.5 26h9M45 32h10" stroke="${MS}" stroke-width="1.2" opacity=".7"/>
  <circle cx="50" cy="50" r="6.5" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/><circle cx="50" cy="50" r="2" fill="${MS}"/>
  ${defs(metal('pliers-m'))}`,

  'oil-can': `${sh(32, 46, 92)}
  <path d="M48 44L90 13" stroke="#8A6414" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M48 44L90 13" stroke="#EBC25E" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M93 17q-3 5-3 7a3 3 0 0 0 6 0q0-2-3-7z" fill="#E8B330" stroke="#8A6414" stroke-width="1"/>
  <path d="M18 70q-12-4-6-20q4-8 14-4" stroke="#8E2A22" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M16 88q0-34 30-40q30 6 30 40z" fill="url(#oil-can-r)" stroke="#8E2A22" stroke-width="2" stroke-linejoin="round"/>
  <rect x="40" y="40" width="12" height="10" rx="2" fill="#EBC25E" stroke="#8A6414" stroke-width="2"/>
  <rect x="13" y="82" width="66" height="9" rx="3" fill="#B9C4CC" stroke="${MS}" stroke-width="2"/>
  <path d="M26 78q2-14 12-22" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
  ${defs(lg('oil-can-r', '#FF7A66', '#C2392C', 'h'))}`,

  'bicycle-chain': `${sh(34, 50, 92)}
  <path d="${cog(48, 50, 30, 4, 20)}" fill="url(#bicycle-chain-m)" stroke="${MS}" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="48" cy="50" r="18" fill="none" stroke="${MS}" stroke-width="2" opacity=".6"/>
  ${rep(5, i => `<circle cx="${pt(48, 50, 12, i * 72 - 90).split(' ')[0]}" cy="${pt(48, 50, 12, i * 72 - 90).split(' ')[1]}" r="3.6" fill="#7D8A95"/>`)}
  <circle cx="48" cy="50" r="5" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/>
  <path d="M98 30L48 18A32 32 0 1 0 48 82L98 70" stroke="#3E444B" stroke-width="8" fill="none"/>
  <path d="M98 30L48 18A32 32 0 1 0 48 82L98 70" stroke="#C3CDD5" stroke-width="3.5" fill="none" stroke-dasharray="5 2.5"/>
  ${defs(metal('bicycle-chain-m', 'd'))}`,

  'bicycle-bell': `${sh(36, 50, 93)}
  <rect x="6" y="80" width="88" height="9" rx="4.5" fill="#4A5058" stroke="#2E3338" stroke-width="1.5"/>
  <rect x="40" y="72" width="20" height="14" rx="3" fill="#7D8A95"/>
  <path d="M78 66q10-2 14-10" stroke="${MS}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="92" cy="55" r="4" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/>
  <path d="M20 72q0-38 30-38t30 38z" fill="url(#bicycle-bell-m)" stroke="${MS}" stroke-width="2"/>
  <ellipse cx="50" cy="72" rx="32" ry="6" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <circle cx="50" cy="32" r="4" fill="#AEB9C2" stroke="${MS}" stroke-width="1.5"/>
  <path d="M30 64q2-18 14-24" stroke="#fff" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>
  <path d="M16 30q-6 6-4 14M9 23q-10 10-6 24" stroke="#F2A93B" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  ${defs(rg('bicycle-bell-m', '#FFFFFF', '#8D9AA5'))}`,

  // ---------- woodworking ----------
  'hammer': `${sh(30, 50, 91)}
  <g transform="rotate(30 50 50)">
  <rect x="44" y="28" width="12" height="66" rx="5" fill="url(#hammer-w)" stroke="${WS}" stroke-width="2"/>
  <rect x="44" y="70" width="12" height="24" rx="5" fill="#D9483B" stroke="#8E2A22" stroke-width="2"/>
  <path d="M48 34v32" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>
  <path d="M22 14h36v18H22zM58 16q20-2 30 14l-6 4q-8-9-24-8z" fill="url(#hammer-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <rect x="14" y="11" width="11" height="24" rx="3" fill="url(#hammer-m)" stroke="${MS}" stroke-width="2"/>
  <path d="M24 18h30" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/></g>
  ${defs(metal('hammer-m', 'v'), wood('hammer-w'))}`,

  'nail': `${sh(30, 50, 91)}
  <defs><g id="nail-n"><rect x="40" y="10" width="20" height="6" rx="2"/><path d="M46.5 16h7v58L50 86l-3.5-12z"/></g>${metal('nail-m')}</defs>
  ${[['translate(-18 8) rotate(-20 50 50) scale(.8)'], ['translate(22 10) rotate(24 50 50) scale(.75)'], ['translate(0 2) rotate(-4 50 50)']].map(([t]) => `<g transform="${t}"><use href="#nail-n" fill="none" stroke="${MS}" stroke-width="3" stroke-linejoin="round"/><use href="#nail-n" fill="url(#nail-m)"/><path d="M48.5 20v46" stroke="#fff" stroke-width="1.5" opacity=".7"/></g>`).join('')}`,

  'saw': `${sh(34, 50, 90)}
  <g transform="rotate(-28 50 50)">
  <path d="M34 38L95 48V62H34z" fill="url(#saw-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M34 62${rep(15, () => 'l2 4 2-4')}" fill="#AEB9C2" stroke="${MS}" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M40 44l50 8" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>
  <path fill-rule="evenodd" d="M8 34q0-6 6-6h18q6 0 6 6v32q0 6-6 6H14q-6 0-6-6zM17 39h12q2 0 2 2v16q0 2-2 2H17q-2 0-2-2V41q0-2 2-2z" fill="url(#saw-w)" stroke="${WS}" stroke-width="2"/>
  <circle cx="35" cy="44" r="1.8" fill="#C9D2D8"/><circle cx="35" cy="56" r="1.8" fill="#C9D2D8"/></g>
  ${defs(metal('saw-m', 'v'), wood('saw-w', 'd'))}`,

  'chisel': `${sh(30, 50, 90)}
  <g transform="rotate(-40 50 50)">
  <path d="M52 44h32l10 4v4l-10 4H52z" fill="url(#chisel-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M84 44l10 4v4l-10 4z" fill="#DDE4E9"/>
  <path d="M56 47h26" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>
  <rect x="45" y="42" width="9" height="16" rx="2" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/>
  <path d="M10 38q-4 0-4 4v16q0 4 4 4l36-2V40z" fill="url(#chisel-w)" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M14 46q12 2 26 0M16 54q10-1 22 1" stroke="${WS}" stroke-width="1.2" fill="none" opacity=".6"/></g>
  ${defs(metal('chisel-m', 'v'), wood('chisel-w', 'v'))}`,

  'hand-drill': `${sh(20, 50, 94)}
  <g transform="rotate(-12 50 50)">
  <rect x="47" y="18" width="6" height="56" fill="url(#hand-drill-m)" stroke="${MS}" stroke-width="1.6"/>
  <rect x="41" y="2" width="18" height="20" rx="8" fill="url(#hand-drill-w)" stroke="${WS}" stroke-width="2"/>
  <rect x="24" y="48" width="23" height="9" rx="4.5" fill="url(#hand-drill-w)" stroke="${WS}" stroke-width="2"/>
  <path d="${cog(62, 42, 17, 3, 18)}" fill="#E5574A" stroke="#8E2A22" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="62" cy="42" r="10" fill="#F07C6E" stroke="#8E2A22" stroke-width="1.5"/>
  <circle cx="62" cy="42" r="3" fill="#8E2A22"/>
  <path d="M62 42l16-12" stroke="${MS}" stroke-width="4" stroke-linecap="round"/>
  <rect x="74" y="16" width="10" height="16" rx="5" fill="url(#hand-drill-w)" stroke="${WS}" stroke-width="2"/>
  <path d="M43 72h14l-2 10h-10z" fill="url(#hand-drill-m)" stroke="${MS}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M48.5 82h3v12l-1.5 3-1.5-3z" fill="#AEB9C2" stroke="${MS}" stroke-width="1"/>
  <path d="M48.5 85l3 2M48.5 89l3 2" stroke="${MS}" stroke-width="1"/></g>
  ${defs(metal('hand-drill-m'), wood('hand-drill-w'))}`,

  'sandpaper': `${sh(36, 50, 90)}
  <g transform="rotate(-10 50 50)">
  <path d="M14 16h60l12 12v56H14z" fill="#D9A35B" stroke="#8A5A22" stroke-width="2" stroke-linejoin="round"/>
  <path d="M14 16h60l12 12v56H14z" fill="url(#sandpaper-g)"/>
  <path d="M74 16v12h12z" fill="#F7EEDC" stroke="#8A5A22" stroke-width="2" stroke-linejoin="round"/></g>
  <rect x="46" y="60" width="44" height="22" rx="5" fill="url(#sandpaper-w)" stroke="${WS}" stroke-width="2"/>
  <rect x="46" y="78" width="44" height="6" rx="2" fill="#B9813E" stroke="#8A5A22" stroke-width="1.5"/>
  <path d="M52 66h32" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/>
  ${defs(`<pattern id="sandpaper-g" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#8A5A22"/><circle cx="4.5" cy="4" r=".8" fill="#FFF0CC"/></pattern>`, wood('sandpaper-w', 'v'))}`,

  'wood-plank': `${sh(44, 50, 86)}
  <path d="M6 60L70 27h24L30 60z" fill="url(#wood-plank-t)" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M30 60L94 27v10L30 72z" fill="#B47236" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M6 60h24v12H6z" fill="#E2A563" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M10 68q8-6 16 0M13 66q5-3 10 0" stroke="${WS}" stroke-width="1.2" fill="none" opacity=".7"/>
  <path d="M16 57q30-16 60-27M24 57q26-12 58-27" stroke="${WS}" stroke-width="1.3" fill="none" opacity=".45"/>
  <ellipse cx="54" cy="42" rx="5" ry="2.4" transform="rotate(-27 54 42)" fill="none" stroke="${WS}" stroke-width="1.5" opacity=".7"/>
  ${defs(lg('wood-plank-t', '#F0C084', '#D08E4A', 'h'))}`,

  'bamboo-pole': `${sh(36, 50, 90)}
  <g transform="rotate(-35 50 50)">
  <rect x="2" y="42" width="94" height="16" rx="6" fill="url(#bamboo-pole-g)" stroke="#7A6A1E" stroke-width="2"/>
  <path d="${rep(4, i => `M${20 + i * 22} 42v16`)}" stroke="#7A6A1E" stroke-width="2.6"/>
  <path d="${rep(4, i => `M${23 + i * 22} 43v14`)}" stroke="#fff" stroke-width="1.2" opacity=".4"/>
  <path d="M6 46.5h86" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/>
  <ellipse cx="94" cy="50" rx="3" ry="7.5" fill="#F3E7B0" stroke="#7A6A1E" stroke-width="1.5"/>
  <path d="M64 42q4-12 16-14q-4 12-16 14z" fill="#6CC04A" stroke="#3F8F3A" stroke-width="1.2"/></g>
  ${defs(lg('bamboo-pole-g', '#E8D886', '#A8952F'))}`,

  'clamp': `${sh(32, 50, 93)}
  <path d="M68 16H34V76H62" stroke="#9A4A12" stroke-width="15" fill="none" stroke-linejoin="round"/>
  <path d="M68 16H34V76H62" stroke="url(#clamp-o)" stroke-width="10" fill="none" stroke-linejoin="round"/>
  <path d="M30 22v48" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/>
  <rect x="60" y="22" width="16" height="6" rx="2" fill="#B9C4CC" stroke="${MS}" stroke-width="1.5"/>
  <rect x="64" y="34" width="8" height="54" fill="url(#clamp-m)" stroke="${MS}" stroke-width="1.6"/>
  <path d="${rep(9, i => `M64 ${38 + i * 5}l8-2.5`)}" stroke="${MS}" stroke-width="1.3"/>
  <rect x="58" y="30" width="20" height="5" rx="2" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/>
  <rect x="52" y="86" width="32" height="6" rx="3" fill="url(#clamp-m)" stroke="${MS}" stroke-width="1.6"/>
  ${defs(lg('clamp-o', '#FDBA5C', '#E2741F', 'h'), metal('clamp-m'))}`,

  'try-square': `${sh(32, 50, 92)}
  <path d="M30 15h62v13H30z" fill="url(#try-square-m)" stroke="${MS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="${rep(12, i => `M${35 + i * 5} 28v${i % 2 ? -3 : -5.5}`)}" stroke="#3E4A54" stroke-width="1.2"/>
  <path d="M33 18h56" stroke="#fff" stroke-width="1.6" opacity=".7"/>
  <rect x="13" y="12" width="18" height="76" rx="3" fill="url(#try-square-w)" stroke="${WS}" stroke-width="2"/>
  <path d="M18 34q2 20 0 46M25 30q-2 16 0 30" stroke="${WS}" stroke-width="1.2" fill="none" opacity=".5"/>
  <circle cx="22" cy="20" r="2.4" fill="#E2B24A" stroke="#8A6414"/><circle cx="22" cy="40" r="2.4" fill="#E2B24A" stroke="#8A6414"/>
  ${defs(metal('try-square-m', 'v'), wood('try-square-w'))}`,

  'varnish': `${sh(34, 48, 93)}
  <path d="M18 34v50q0 6 24 6t24-6V34z" fill="url(#varnish-m)" stroke="${MS}" stroke-width="2"/>
  <path d="M18 50q24 6 48 0v22q-24 6-48 0z" fill="#C9772B"/>
  <path d="M28 60q14 4 28 0M28 66q14 4 28 0" stroke="#F3C27E" stroke-width="1.5" fill="none" opacity=".8"/>
  <ellipse cx="42" cy="34" rx="24" ry="6" fill="#C3CDD5" stroke="${MS}" stroke-width="2"/>
  <ellipse cx="42" cy="34.4" rx="20" ry="4.2" fill="url(#varnish-v)"/>
  <path d="M25 37v10q0 3 2.5 3t2.5-3v-8" fill="#B5651D"/>
  <g transform="rotate(28 76 46)"><rect x="72" y="2" width="8" height="30" rx="3" fill="url(#varnish-w)" stroke="${WS}" stroke-width="1.6"/>
  <rect x="70" y="30" width="12" height="7" fill="#C3CDD5" stroke="${MS}" stroke-width="1.5"/>
  <path d="M70 37h12v10q-6 5-12 0z" fill="#B5651D" stroke="#7A4520" stroke-width="1.5"/></g>
  ${defs(metal('varnish-m'), rg('varnish-v', '#F7C26A', '#B5651D'), wood('varnish-w'))}`,

  'pen-stand': `${sh(28, 50, 92)}
  <ellipse cx="50" cy="46" rx="22" ry="5" fill="#5A3418"/>
  <g transform="translate(40 50) rotate(-16)"><rect x="-4" y="-40" width="8" height="40" fill="#F2C230" stroke="#B5851A" stroke-width="1.2"/><path d="M-4-40l4-9 4 9z" fill="#F1D2A6" stroke="#B5851A" stroke-width="1.2" stroke-linejoin="round"/><path d="M-1.4-46l1.4-3 1.4 3z" fill="#3E444B"/></g>
  <g transform="translate(52 50) rotate(6)"><rect x="-3.5" y="-46" width="7" height="46" rx="3" fill="#2F7FC1" stroke="#1D4F80" stroke-width="1.2"/><rect x="2.5" y="-42" width="2" height="14" rx="1" fill="#C3CDD5"/></g>
  <g transform="translate(62 50) rotate(22)"><rect x="-4" y="-36" width="8" height="36" fill="#E5484D" stroke="#8E2A22" stroke-width="1.2"/><path d="M-4-36l4-9 4 9z" fill="#F1D2A6" stroke="#8E2A22" stroke-width="1.2" stroke-linejoin="round"/></g>
  <path d="M28 46q22 8 44 0l-3 42q-19 5-38 0z" fill="url(#pen-stand-w)" stroke="${WS}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M29 56q21 7 42 0M30 74q20 6 40 0" stroke="#3FA7A0" stroke-width="4" fill="none"/>
  <path d="M35 58v24" stroke="#fff" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
  ${defs(wood('pen-stand-w'))}`,

};
