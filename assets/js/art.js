// Animated SVG illustrations for every Grade 6, 7 and 8 project, plus small icons.
// Each scene is a small layered flat illustration: a soft glow backdrop in the colour of its form of work
// (life = olive, machines = rust, services = plum), a midground, the subject, and a few lively details.
// Colours come from the site tokens (plus a few --art-* tokens in art.css), so light and dark mode both work.
// Motion lives in assets/css/art.css (keyframes prefixed "art-") and switches off with "reduce motion".
// Gradient, pattern and clip ids get a per-call suffix, so one scene can appear many times on a page.

const F = { o: 'olive', r: 'rust', p: 'plum' };
const r1 = v => Math.round(v * 10) / 10;
const st = (o, c, a) => `<stop offset="${o}" style="stop-color:${c}${a == null ? '' : `;stop-opacity:${a}`}"/>`;
const lg = (id, x2, y2, ...s) => `<linearGradient id="${id}" x2="${x2}" y2="${y2}">${s.map(a => st(...a)).join('')}</linearGradient>`;
const rg = (id, cx, cy, r, ...s) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${s.map(a => st(...a)).join('')}</radialGradient>`;
// Backdrop: a glow that fades out to the family's soft tint, so the scene melts into the card's tinted box.
// It overflows the viewBox so letterboxed containers (4:3 boxes) are filled too.
const bg = (u, f, cx, cy) => rg(`${u}a`, cx, cy, .7, [0, `var(--art-glow-${f})`], [1, `var(--${F[f]}-soft)`]);
const sky = u => `<rect x="-20" y="-40" width="240" height="220" fill="url(#${u}a)"/>`;
const cloud = (x, y, s) => `<path class="cl" transform="translate(${x} ${y}) scale(${s})" d="M0 0a6 6 0 0 1 4-10a8 8 0 0 1 14-4a6.5 6.5 0 0 1 11 6a4.5 4.5 0 0 1 1 8z"/>`;
const spark = (x, y, s, c = 'spk') => `<path class="${c}" d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z"/>`;
const leafD = (x, y, l, a) => {
  const co = Math.cos(a * Math.PI / 180), si = Math.sin(a * Math.PI / 180), P = (u, v) => `${r1(u * l * co - v * l * si)} ${r1(u * l * si + v * l * co)}`;
  return `M${x} ${y}c${P(.3, -.38)} ${P(.75, -.38)} ${P(1, 0)}c${P(-.25, .38)} ${P(-.7, .38)} ${P(-1, 0)}z`;
};
const leaf = (x, y, l, a, c = 'l1') => `<path class="${c}" d="${leafD(x, y, l, a)}"/>`;
// Several leaves of one colour as a single path: lv('l1', [x, y, length, angle], ...)
const lv = (c, ...ls) => `<path class="${c}" d="${ls.map(a => leafD(...a)).join('')}"/>`;
const polar = (cx, cy, r, deg) => `${r1(cx + r * Math.cos(deg * Math.PI / 180))} ${r1(cy + r * Math.sin(deg * Math.PI / 180))}`;
const rays = (cx, cy, a, b, n, o = 0) => `<path d="${[...Array(n)].map((_, i) => `M${polar(cx, cy, a, o + i * 360 / n)}L${polar(cx, cy, b, o + i * 360 / n)}`).join('')}"/>`;
// Spur gear: n teeth around pitch radius rp, tooth centres at ph + k * 360/n degrees.
const gear = (cx, cy, rp, n, ph, c) => {
  const p = 360 / n, pts = [];
  for (let i = 0; i < n; i++) {
    const a = ph + i * p;
    pts.push(polar(cx, cy, rp - 2.4, a - p * .3), polar(cx, cy, rp + 2.4, a - p * .17), polar(cx, cy, rp + 2.4, a + p * .17), polar(cx, cy, rp - 2.4, a + p * .3));
  }
  return `<path class="${c}" d="M${pts.join('L')}Z"/>`;
};
const star = (cx, cy, a, b, n) => `M${[...Array(n * 2)].map((_, i) => polar(cx, cy, i % 2 ? b : a, -90 + i * 180 / n)).join('L')}Z`;
const heart = 'c-1.6-2.6-6-2.4-6 1.4c0 3 3.4 5 6 7.4c2.6-2.4 6-4.4 6-7.4c0-3.8-4.4-4-6-1.4z';
const wrap = (key, u, defs, body) => `<svg viewBox="0 0 200 140" class="art art-${key}" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;

const ART = {
  /* ---------------- Grade 6 ---------------- */
  garden: u => wrap('garden', u,
    bg(u, 'o', .2, .3) + lg(`${u}b`, 0, 1, [0, 'var(--art-soil-hi)'], [1, 'var(--art-soil)']) + lg(`${u}c`, 1, 0, [0, 'var(--teal-2)'], [1, 'var(--teal)']), `
    ${sky(u)}
    <path class="hill" d="M-20 96C20 80 60 82 100 92S170 76 220 88V170H-20Z"/>
    <g class="sun"><circle class="glow" cx="34" cy="30" r="21"/><g class="rays">${rays(34, 30, 15, 19.5, 10)}</g><circle class="gd" cx="34" cy="30" r="11"/><circle class="hi" cx="30.5" cy="26.5" r="3.4"/></g>
    <g class="cl1">${cloud(62, 30, 1)}</g><g class="cl2">${cloud(170, 16, .62)}</g>
    <g class="fence"><rect x="-20" y="94" width="240" height="3"/><path d="${[...Array(13)].map((_, i) => `M${2 + i * 16} 106V90l3-4 3 4v16z`).join('')}"/></g>
    <path fill="url(#${u}b)" d="M-20 104Q100 94 220 104V170H-20Z"/>
    <path class="furrow" d="M6 113q18-3 36 0M64 111q18-3 36 0M122 111q18-3 36 0M176 113q12-2 24 0"/>
    <rect class="wo" x="-20" y="122" width="240" height="48"/><path class="seam" d="M-20 131H220"/><path class="nail" d="M14 127h.1M100 127h.1M186 127h.1"/>
    <g class="tom"><rect class="wo2" x="52" y="44" width="3" height="64" rx="1.5"/><path class="stem" d="M44 108C41 94 48 86 44 74S45 58 47 48"/>
      ${lv('l1', [44, 98, 14, -155], [45, 70, 12, -22])}${lv('l0', [45, 90, 13, -28], [44, 80, 12, -160])}${lv('l2', [46, 59, 10, -150], [47, 50, 9, -40])}
      <circle class="rs" cx="37" cy="84" r="5.6"/><circle class="rs" cx="52" cy="75" r="5"/><circle class="rs" cx="39" cy="63" r="4.3"/>
      <circle class="hi" cx="35.2" cy="82" r="1.7"/><circle class="hi" cx="50.4" cy="73.2" r="1.4"/><circle class="hi" cx="37.6" cy="61.5" r="1.2"/>
      <path class="calyx" d="M35 78.8h4M50 70.4h4M37.6 59.2h3"/></g>
    <g class="let"><ellipse class="sh" cx="98" cy="105" rx="18" ry="3"/><path class="l0" d="M81 104c-5-8 2-17 10-14c2-9 13-9 15 0c8-3 15 6 10 14z"/><path class="l1" d="M85 104c-3-7 4-13 9-10c3-7 10-7 12 1c6-1 10 5 7 9z"/><path class="l2" d="M90 104c0-6 4-9 8-6.5c4-2.5 8 .5 8 6.5z"/><path class="vein" d="M98 103v-8M93 103l-4-6M103 103l4-6"/></g>
    <g class="car k1"><path class="ctop" d="M150 102q-7-9-9-20M150 102q0-12 2-22M150 102q6-8 11-17"/><path class="am" d="M143 103q7-6 14 0q-2 6-7 8q-5-2-7-8z"/></g>
    <g class="car k2"><path class="ctop" d="M176 104q-6-8-8-17M176 104q0-11 2-19M176 104q5-7 10-14"/><path class="am" d="M170 105q6-5 12 0q-2 5-6 7q-4-2-6-7z"/></g>
    <g class="drops"><ellipse class="wa" cx="96" cy="68" rx="1.5" ry="2.3"/><ellipse class="wa" cx="100" cy="68" rx="1.5" ry="2.3"/><ellipse class="wa" cx="103.5" cy="68" rx="1.5" ry="2.3"/></g>
    <g class="can"><path class="cant" d="M129 34q13-16 26 0M157 39q9 1 6 13M127 52L106 37"/><ellipse class="te" cx="104" cy="35.5" rx="2.6" ry="5.2" transform="rotate(35.5 104 35.5)"/>
      <rect x="124" y="33" width="33" height="25" rx="6" fill="url(#${u}c)"/><path class="band" d="M124 40h33"/><rect class="hi" x="128" y="42" width="4" height="12" rx="2"/></g>
    <g class="bf"><g class="bfy"><g transform="translate(178 70)"><g class="wl"><path class="pl" d="M0 0C-7-11-15-8-13-1C-15 6-6 9 0 2Z"/><circle class="gd" cx="-8" cy="-4" r="1.6"/></g><g class="wr"><path class="pl" d="M0 0C7-11 15-8 13-1C15 6 6 9 0 2Z"/><circle class="gd" cx="8" cy="-4" r="1.6"/></g><path class="bfb" d="M0-4V5"/></g></g></g>`),

  biodiversity: u => wrap('bio', u,
    bg(u, 'o', .55, .4) + rg(`${u}b`, .35, .3, .75, [0, 'var(--art-l2)'], [1, 'var(--olive)']) + rg(`${u}c`, .35, .3, .8, [0, 'var(--art-hi)', .75], [1, 'var(--teal-soft)', .35]), `
    ${sky(u)}
    <path class="hill" d="M-20 90C30 70 70 74 110 86S180 68 220 78V170H-20Z"/>
    <path class="hill2" d="M-20 104C40 92 90 96 130 104S190 96 220 100V170H-20Z"/>
    <g class="birds"><g class="bd bd1"><path d="M128 22q4-4 8 0q4-4 8 0"/></g><g class="bd bd2"><path d="M150 32q3-3 6 0q3-3 6 0"/></g></g>
    <ellipse class="sh" cx="44" cy="117" rx="26" ry="3"/>
    <path class="wo2" d="M38 118C40 104 38 90 42 76h7c3 14 1 28 4 42z"/><path class="br" d="M45 92l-10-8M46 84l9-8"/>
    <circle fill="url(#${u}b)" cx="30" cy="66" r="15"/><circle fill="url(#${u}b)" cx="62" cy="64" r="16"/><circle fill="url(#${u}b)" cx="45" cy="50" r="22"/>
    <circle class="hi" cx="38" cy="42" r="5" opacity=".35"/><circle class="l2" cx="56" cy="56" r="3"/><circle class="l2" cx="34" cy="62" r="2.4"/>
    <g class="fl lf1">${leaf(28, 76, 6, 30, 'l2')}</g><g class="fl lf2">${leaf(60, 78, 6, -20, 'gd')}</g>
    <path class="l1" d="M-20 116Q100 108 220 116V170H-20Z"/><path class="l0" d="M-20 128Q100 122 220 128V170H-20Z"/>
    <g class="flw"><path class="stem" d="M124 116v-12M146 116v-18M168 116v-10"/>
      <g class="fw1"><circle class="pl" cx="146" cy="96" r="5"/><circle class="gd" cx="146" cy="96" r="2"/></g><circle class="gd" cx="124" cy="102" r="3.6"/><circle class="rs" cx="124" cy="102" r="1.4"/><circle class="wt" cx="168" cy="104" r="3.4"/><circle class="gd" cx="168" cy="104" r="1.3"/></g>
    <g class="bug"><ellipse class="rs" cx="90" cy="112" rx="2.6" ry="2.1"/><path class="dk" d="M88 110.6a2 2 0 0 1 4 0z"/></g>
    <g class="lens"><circle fill="url(#${u}c)" cx="90" cy="104" r="13"/>
      <g class="mag"><ellipse class="rs" cx="90" cy="107" rx="7" ry="5.6"/><path class="dk" d="M84.5 103.6a5.5 4 0 0 1 11 0z"/><path class="ln" d="M90 102v10.6"/><circle class="dk" cx="87" cy="108" r="1.2"/><circle class="dk" cx="93" cy="106.4" r="1.2"/><circle class="dk" cx="92.4" cy="110" r="1"/></g>
      <circle class="rim" cx="90" cy="104" r="13"/><path class="grip" d="M99.5 113.5L109 123"/><path class="lglint" d="M82 98a10 10 0 0 1 6-4"/></g>
    <g class="bee"><g class="beey"><g transform="translate(146 82)"><ellipse class="wing" cx="-1" cy="-4" rx="3" ry="2"/><ellipse class="gd" rx="4" ry="3"/><path class="stripe" d="M-1-3v6M1.6-3v6"/></g></g></g>
    <g class="book"><rect class="sh" x="162" y="86" width="32" height="34" rx="3" opacity=".6"/><rect class="wt" x="160" y="82" width="32" height="34" rx="3"/><path class="ringl" d="M166 82v-3M174 82v-3M182 82v-3"/>
      <circle class="l1" cx="167" cy="91" r="2.6"/><circle class="pl" cx="167" cy="100" r="2.6"/><circle class="gd" cx="167" cy="109" r="2.6"/><path class="ln" d="M172 91h9M172 100h9M172 109h9"/>
      <path class="tk t1" d="M182.5 91l2 2 3.5-4"/><path class="tk t2" d="M182.5 100l2 2 3.5-4"/><path class="tk t3" d="M182.5 109l2 2 3.5-4"/></g>`),

  maker: u => wrap('maker', u,
    bg(u, 'r', .5, .45) + lg(`${u}b`, 0, 1, [0, 'var(--art-wood)'], [1, 'var(--art-wood2)']) + rg(`${u}c`, .35, .3, .7, [0, 'var(--art-ball)'], [1, 'var(--rust)']), `
    ${sky(u)}
    <path class="wall" d="M-20 104H220V118H-20Z"/>
    <g class="gr1">${gear(150, 40, 18, 12, 20, 'te')}<circle class="hole" cx="150" cy="40" r="10"/><circle class="te" cx="150" cy="40" r="6"/><path class="spoke" d="M140 40h20M150 30v20"/><circle class="mt" cx="150" cy="40" r="2.4"/></g>
    <g class="gr2">${gear(174.6, 57.2, 12, 8, 35, 'am')}<circle class="hole" cx="174.6" cy="57.2" r="4.6"/><circle class="mt" cx="174.6" cy="57.2" r="2"/></g>
    <rect fill="url(#${u}b)" x="-20" y="118" width="240" height="52"/><rect class="edge" x="-20" y="118" width="240" height="2.4"/><path class="seam" d="M-20 132H220"/>
    <ellipse class="sh" cx="62" cy="119.4" rx="36" ry="2.6"/>
    <path class="frame" d="M38 115L60 95L82 115M47 107h26"/><rect class="wo2" x="28" y="112" width="66" height="6" rx="2"/>
    <g class="arm"><path class="beam" d="M60 96L109 70.5"/><path class="cup" d="M105.6 73.6a8.4 8.4 0 0 0 15.4-6.6"/></g>
    <circle class="mt" cx="60" cy="96" r="3.6"/><circle class="hi" cx="59" cy="95" r="1.2"/>
    <g class="ball-x"><g class="ball-y"><g class="ball"><circle fill="url(#${u}c)" cx="114" cy="68" r="5"/><circle class="hi" cx="112.4" cy="66.2" r="1.5"/></g></g></g>
    <g class="puff"><ellipse class="dust" cx="14" cy="116.5" rx="5" ry="2.2"/><ellipse class="dust" cx="25" cy="116" rx="4" ry="1.9"/></g>
    <ellipse class="sh" cx="156" cy="119.4" rx="28" ry="2.4"/>
    <path class="speed" d="M100 104h14M106 110h10M96 98h10"/>
    <g class="air"><circle class="dust" cx="126" cy="96" r="2.4"/><circle class="dust a2" cx="126" cy="96" r="1.8"/></g>
    <g class="cb"><path class="straw" d="M146 92L128 96"/><g class="bal"><ellipse class="pl" cx="151" cy="81" rx="9.5" ry="10.5"/><circle class="hi" cx="147" cy="77" r="2.6"/><path class="pl" d="M149 91h4l-2 3z"/></g>
      <rect class="bottle" x="134" y="95" width="42" height="15" rx="7.5"/><rect class="am" x="175" y="98.5" width="6" height="8" rx="1.5"/><rect class="hi" x="140" y="97.6" width="26" height="2.4" rx="1.2"/></g>
    <g class="wh w1"><circle class="rs" cx="143" cy="112" r="6.5"/><path class="spk2" d="M143 106.6v10.8M137.6 112h10.8"/><circle class="wt" cx="143" cy="112" r="2"/></g>
    <g class="wh w2"><circle class="rs" cx="168" cy="112" r="6.5"/><path class="spk2" d="M168 106.6v10.8M162.6 112h10.8"/><circle class="wt" cx="168" cy="112" r="2"/></g>`),

  games: u => wrap('games', u,
    bg(u, 'r', .55, .45) + lg(`${u}b`, 0, 1, [0, 'var(--art-stage)'], [1, 'var(--art-glow)']) + lg(`${u}c`, 0, 1, [0, 'var(--art-wood)'], [1, 'var(--art-wood2)']), `
    ${sky(u)}
    <rect fill="url(#${u}c)" x="-20" y="112" width="240" height="58"/><rect class="edge" x="-20" y="112" width="240" height="2.4"/>
    <ellipse class="sh" cx="121" cy="113.5" rx="34" ry="2.4"/><path class="mt2" d="M112 99h18l3 10h-24z"/><rect class="mt2" x="96" y="107.5" width="50" height="5" rx="2.5"/>
    <rect class="dk" x="50" y="8" width="142" height="92" rx="9"/><rect fill="url(#${u}b)" x="56" y="14" width="130" height="78" rx="4"/>
    ${cloud(74, 34, .55)}${cloud(150, 28, .45)}
    <rect class="l1" x="56" y="77" width="130" height="15"/><rect class="l2" x="56" y="76" width="130" height="3"/><path class="tuft" d="M66 84l2-3 2 3M120 86l2-3 2 3M168 83l2-3 2 3"/>
    <rect class="am" x="134" y="56" width="30" height="7" rx="1.5"/><path class="brick" d="M144 56v7M154 56v7"/>
    <g class="cn k2"><circle class="coin" cx="141" cy="49" r="3.4"/></g><g class="cn k3"><circle class="coin" cx="156" cy="49" r="3.4"/></g>
    <path class="ol" d="M61 24v-7h7l-2 2 2 2h-7"/><path class="flagp" d="M61 25v-8"/><circle class="rs" cx="74" cy="20.5" r="3.2"/>
    <g class="score"><path class="gd" d="${star(176, 22, 4.4, 2, 5)}"/></g>
    <g class="coin1"><circle class="coin" cx="98" cy="32" r="4.6"/><path class="cshine" d="M98 29.4v5.2"/></g>
    <text class="plus" x="92" y="26">+1</text>
    <g class="sps"><g class="spsy"><ellipse class="sh" cx="74" cy="77" rx="9" ry="1.8"/></g></g>
    <g class="sp"><g class="spy"><path class="tail" d="M67 71q-7-1-6-9"/><rect class="am" x="67" y="62" width="14" height="13" rx="5"/><rect class="am" x="68" y="71" width="4" height="6" rx="2"/><rect class="am" x="76" y="71" width="4" height="6" rx="2"/>
      <ellipse class="wt" cx="74" cy="68.5" rx="4" ry="4.2"/><path class="am" d="M66.6 53l1-8.6 5.6 5zM81.4 53l-1-8.6-5.6 5z"/><circle class="am" cx="74" cy="55.6" r="8"/>
      <ellipse class="wt" cx="74" cy="59" rx="3.6" ry="2.3"/><circle class="dk" cx="70.8" cy="54.6" r="1.3"/><circle class="dk" cx="77.2" cy="54.6" r="1.3"/><circle class="rs" cx="74" cy="57.6" r=".9"/></g></g>
    <g class="blk"><path class="gd" d="M6 31q9-7 18 0h18v10h-26l-2 2h-6l-2-2h0z"/><path class="te" d="M6 41h4l2 2h6l2-2h22v10h-22l-2 2h-6l-2-2h-4z"/><path class="am" d="M6 51h4l2 2h6l2-2h22v10h-22l-2 2h-6l-2-2h-4z"/>
      <path class="btx" d="M10 36.6h12M10 46.4h16M10 56.4h10"/><g class="blk4"><path class="pl" d="M6 61h4l2 2h6l2-2h22v10h-22l-2 2h-6l-2-2h-4z"/><path class="btx" d="M10 66.4h14"/></g></g>
    ${spark(46, 61, 3.6, 'spk snap')}`),

  museum: u => wrap('museum', u,
    bg(u, 'p', .5, .35) + lg(`${u}b`, 0, 1, [0, 'var(--art-floor)'], [1, 'var(--art-floor2)']) + lg(`${u}c`, 0, 1, [0, 'var(--art-gold)', .5], [1, 'var(--art-gold)', 0]) + lg(`${u}d`, 1, 0, [0, 'var(--rust)'], [.45, 'var(--amber)'], [1, 'var(--rust)']) + `<clipPath id="${u}e"><rect x="78" y="44" width="44" height="38"/></clipPath>`, `
    ${sky(u)}
    <rect class="wain" x="-20" y="88" width="240" height="26"/><rect class="trim" x="-20" y="87" width="240" height="2.4"/>
    <rect fill="url(#${u}b)" x="-20" y="112" width="240" height="58"/><path class="fline" d="M-20 120H220M20 112L-4 140M100 112v28M180 112l24 28"/>
    <rect class="gd" x="14" y="20" width="36" height="29" rx="2"/><rect class="pic" x="17.5" y="23.5" width="29" height="22"/><path class="l1" d="M17.5 45.5l8-9 6 6 4-4 10.8 7z"/><circle class="am" cx="40" cy="29.5" r="2.6"/>
    <rect class="gd" x="152" y="16" width="31" height="37" rx="2"/><rect class="pic" x="155.5" y="19.5" width="24" height="30"/><circle class="pl" cx="167.5" cy="30" r="5"/><path class="pl" d="M159 49.5q8.5-15 17 0z"/>
    <rect class="dk" x="93" y="-4" width="14" height="9" rx="3"/>
    <path class="beam" fill="url(#${u}c)" d="M94.5 5h11L132 112H68z"/>
    <g class="motes"><circle class="mo m1" cx="92" cy="70" r="1"/><circle class="mo m2" cx="108" cy="62" r=".8"/><circle class="mo m3" cx="101" cy="40" r=".9"/></g>
    <path class="rope" d="M30 96Q65 108 100 98T170 96"/><rect class="gd" x="28" y="92" width="4" height="22" rx="1"/><circle class="gd" cx="30" cy="91" r="3"/><rect class="gd" x="168" y="92" width="4" height="22" rx="1"/><circle class="gd" cx="170" cy="91" r="3"/>
    <ellipse class="sh" cx="100" cy="114" rx="26" ry="3"/><rect class="ped" x="84" y="86" width="32" height="28"/><rect class="ped2" x="80" y="82" width="40" height="6" rx="1.5"/><rect class="ped2" x="82" y="110" width="36" height="4" rx="1"/>
    <rect class="wt" x="92" y="94" width="16" height="9" rx="1"/><path class="lbl" d="M94.5 97h11M94.5 100h7"/>
    <path fill="url(#${u}d)" d="M93 56h14v4c7 2 11 8 10 14c-1 6-6 8-10 8h-14c-4 0-9-2-10-8c-1-6 3-12 10-14z"/><rect class="rs" x="91" y="54" width="18" height="3" rx="1.5"/>
    <path class="pband" d="M85 70h30M86 76h28"/><path class="zig" d="M87 66.5l3.25 2 3.25-2 3.25 2 3.25-2 3.25 2 3.25-2 3.25 2 3.25-2"/><path class="hi" d="M89 64c-2 3-2 8 0 11l2-1c-1-3-1-6 0-9z"/>
    <rect class="case" x="78" y="44" width="44" height="38" rx="1.5"/><rect class="lid" x="76" y="41" width="48" height="4" rx="1.5"/>
    <g clip-path="url(#${u}e)"><path class="glare" d="M66 90L82 38h7L73 90z"/></g>
    <g class="sp1">${spark(114, 52, 3.6)}</g><g class="sp2">${spark(86, 60, 2.6)}</g>
    <g class="vis"><ellipse class="sh" cx="34" cy="121" rx="13" ry="2.4"/><rect class="am" x="21" y="94" width="8" height="15" rx="3"/><path class="te" d="M25 121v-21q0-10 10-10t10 10v21z"/><path class="arm2" d="M43 100q6 2 9-4"/>
      <g class="vh"><circle class="skin" cx="35" cy="83" r="7.4"/><path class="hair" d="M27.6 83c-1-6 3-10 8-10c5 0 8 3 8 7c-4-3-10-3-16 3z"/><circle class="dk" cx="39.6" cy="83" r="1"/></g></g>`),

  cooking: u => wrap('cook', u,
    bg(u, 'p', .5, .5) + lg(`${u}b`, 0, 1, [0, 'var(--art-wood)'], [1, 'var(--art-wood2)']) + lg(`${u}c`, 0, 1, [0, 'var(--teal-2)'], [1, 'var(--teal)']) + lg(`${u}d`, 0, 1, [0, 'var(--art-gold)'], [1, 'var(--amber)']), `
    ${sky(u)}
    <path class="tiles" d="M-20 34H220M-20 58H220M-20 82H220M-20 106H220${[...Array(9)].map((_, i) => `M${4 + i * 24} ${i % 2 ? 34 : 58}v24`).join('')}"/>
    <rect fill="url(#${u}b)" x="-20" y="110" width="240" height="60"/><rect class="edge" x="-20" y="110" width="240" height="2.6"/>
    <ellipse class="sh" cx="31" cy="111.4" rx="25" ry="2"/><rect class="wo" x="8" y="103" width="48" height="7" rx="3.5"/><circle class="hole" cx="51" cy="106.5" r="1.5"/>
    <ellipse class="l1" cx="16" cy="102.6" rx="4.4" ry="1.8"/><ellipse class="l2" cx="16" cy="102.4" rx="3.2" ry="1.1"/><ellipse class="l1" cx="25" cy="102.6" rx="4.4" ry="1.8"/><ellipse class="l2" cx="25" cy="102.4" rx="3.2" ry="1.1"/>
    <g class="knife"><path class="blade" d="M29 101.6L47 92l2.4 3.4L32 103z"/><path class="dk" d="M47 92l6-3.4 2.4 3.4-6 3.4z"/></g>
    <ellipse class="sh" cx="96" cy="111.2" rx="30" ry="2.4"/>
    <ellipse class="bin" cx="96" cy="82" rx="31" ry="7"/>
    <circle class="rs" cx="82" cy="80" r="5"/><circle class="hi" cx="80.6" cy="78.4" r="1.2"/><rect class="gd" x="91" y="73" width="8.6" height="8.6" rx="2" transform="rotate(15 95 77)"/>
    <circle class="l1" cx="106" cy="78.6" r="5.2"/><circle class="l2" cx="106" cy="78.6" r="3.6"/><circle class="wt" cx="106" cy="78.6" r="1.3"/><circle class="pl" cx="97" cy="82" r="3.8"/><circle class="pl" cx="115" cy="81.6" r="3.6"/><circle class="am" cx="74" cy="82.4" r="3.4"/>
    <g class="spoon"><path class="spn" d="M134 30L106 78"/><ellipse class="wo2" cx="104" cy="82" rx="4.4" ry="6.4" transform="rotate(30 104 82)"/></g>
    <g class="fall fr1"><circle class="pl" cx="90" cy="22" r="3.8"/><circle class="hi" cx="88.8" cy="20.8" r="1.1"/></g>
    <g class="fall fr2"><path class="rs" d="M104 12c4 0 6 2 6 5c0 4-3 7-6 9c-3-2-6-5-6-9c0-3 2-5 6-5z"/><path class="l1" d="M100.6 12.4l3.4 1.6 3.4-1.6-3.4-2.6z"/><path class="seed" d="M102 17h.1M106 17h.1M104 20h.1"/></g>
    <path fill="url(#${u}c)" d="M64 82h64c0 18-14 28-32 28s-32-10-32-28z"/><path class="rim" d="M65 82.4h62"/><path class="hi" d="M70 88c2 8 8 14 16 16c-6-4-10-9-12-16z" opacity=".35"/><rect class="te" x="84" y="107.6" width="24" height="3" rx="1.5"/>
    <g class="spl"><circle class="wt" cx="86" cy="76" r="1.3"/><circle class="wt" cx="94" cy="74" r="1.1"/><circle class="wt" cx="108" cy="75" r="1.2"/></g>
    <ellipse class="sh" cx="160" cy="111.2" rx="16" ry="2"/>
    <path class="straw" d="M158 106L167 56h7"/>
    <path fill="url(#${u}d)" d="M147.6 76h24.8l-2.4 33h-20z"/><rect class="ice" x="151" y="79" width="8" height="8" rx="1.8" transform="rotate(-12 155 83)"/>
    <g class="bbl"><circle class="wt" cx="154" cy="104" r="1.3"/><circle class="wt" cx="164" cy="100" r="1.1"/><circle class="wt" cx="159" cy="106" r="1.4"/></g>
    <path class="glass" d="M146 66h28l-3.2 44h-21.6z"/><path class="hi" d="M149.6 70l2 34h2.4l-1.6-34z" opacity=".5"/>
    <circle class="lem" cx="174" cy="68" r="7"/><circle class="lem2" cx="174" cy="68" r="5.4"/><path class="lems" d="M174 62.6v10.8M168.6 68h10.8M170.2 64.2l7.6 7.6M177.8 64.2l-7.6 7.6"/>
    <g class="sp1">${spark(60, 58, 3.4)}</g><g class="sp2">${spark(132, 64, 2.6)}</g>`),

  /* ---------------- Grade 7 ---------------- */
  nursery: u => wrap('nursery', u,
    bg(u, 'o', .5, .45) + `<pattern id="${u}m" width="5" height="5" patternUnits="userSpaceOnUse"><path class="mesh" d="M0 0L5 5M5 0L0 5"/></pattern>` + lg(`${u}b`, 0, 1, [0, 'var(--art-gold)', .5], [1, 'var(--art-gold)', 0]), `
    ${sky(u)}
    <path class="hill" d="M-20 100C30 86 80 88 120 98S190 88 220 94V170H-20Z"/>
    <g class="lt"><path fill="url(#${u}b)" class="rr1" d="M50 28h14l22 88H66z"/><path fill="url(#${u}b)" class="rr2" d="M110 24h12l24 92h-18z"/></g>
    <rect class="soilc" x="-20" y="116" width="240" height="54"/><path class="grav" d="M10 124h.1M30 130h.1M56 122h.1M90 128h.1M120 124h.1M150 131h.1M178 123h.1"/>
    <rect class="wo2" x="14" y="20" width="4" height="98" rx="1"/><rect class="wo2" x="182" y="20" width="4" height="98" rx="1"/>
    <path class="pipe" d="M16 40H184"/>
    ${[56, 100, 144].map((x, i) => `<g class="mist m${i}"><path class="cone" d="M${x - 2} 42h4l10 24h-24z"/><circle class="dr" cx="${x - 5}" cy="48" r="1"/><circle class="dr d2" cx="${x + 4}" cy="46" r=".9"/></g><rect class="dk" x="${x - 2}" y="38.5" width="4" height="4.5" rx="1"/>`).join('')}
    <path class="net" d="M6 20Q100 2 194 20V31Q100 13 6 31Z"/><path fill="url(#${u}m)" d="M6 20Q100 2 194 20V31Q100 13 6 31Z"/><path class="netedge" d="M6 31Q100 13 194 31"/>
    <rect class="wo" x="22" y="100" width="156" height="5" rx="1.5"/><path class="leg" d="M30 105v12M170 105v12M100 105v12"/>
    <rect class="dk" x="27" y="90" width="70" height="11" rx="2"/><rect class="dk" x="103" y="90" width="70" height="11" rx="2"/>
    <path class="cell" d="${[38, 55, 72, 89, 114, 131, 148, 165].map(x => `M${x - 7} 91.6h14v6.6h-14z`).join('')}"/>
    <g class="seed"><ellipse class="wo2" cx="38" cy="90.4" rx="3.4" ry="2.4"/><path class="crack" d="M36 89.4l2 1.4 2-1.4"/><path class="stem s0" d="M38 89q0-5 3.4-5.4"/></g>
    <g class="sd k1"><path class="stem" d="M55 91V83q0-3 2.6-3"/><ellipse class="l2" cx="58.2" cy="80.4" rx="2.4" ry="1.6"/></g>
    <g class="sd k2"><path class="stem" d="M72 91V80"/>${lv('l2', [72, 80, 6.4, -160], [72, 80, 6.4, -20])}</g>
    <g class="sd k3"><path class="stem" d="M89 91V75"/>${lv('l1', [89, 80, 7, -160], [89, 80, 7, -20])}${lv('l2', [89, 75, 6, -110])}<rect class="ntag" x="93" y="80" width="5" height="11" rx="1"/></g>
    <g class="sd k4"><path class="stem" d="M114 91V72"/>${lv('l1', [114, 84, 8, -160], [114, 84, 8, -20])}${lv('l2', [114, 76, 7, -140], [114, 74, 7, -40])}</g>
    <g class="sd k5"><path class="stem" d="M131 91V69"/>${lv('l0', [131, 85, 9, -165], [131, 85, 9, -15])}${lv('l1', [131, 77, 8, -150], [131, 75, 8, -30])}${lv('l2', [131, 70, 6, -95])}</g>
    <g class="sd k6"><path class="stem" d="M148 91V66"/>${lv('l0', [148, 86, 10, -165], [148, 86, 10, -15])}${lv('l1', [148, 78, 9, -150], [148, 76, 9, -30])}${lv('l2', [148, 69, 7, -125], [148, 68, 7, -55])}</g>
    <g class="sd k7"><path class="stem" d="M165 91V62"/>${lv('l0', [165, 86, 11, -165], [165, 86, 11, -15])}${lv('l1', [165, 78, 10, -150], [165, 75, 10, -30])}${lv('l2', [165, 68, 8, -130], [165, 66, 8, -50])}<rect class="ntag" x="169" y="80" width="5" height="11" rx="1"/></g>`),

  habitat: u => wrap('habitat', u,
    bg(u, 'o', .6, .35) + lg(`${u}b`, 0, 1, [0, 'var(--art-stone)'], [1, 'var(--art-stone2)']) + lg(`${u}c`, 1, 0, [0, 'var(--art-water)'], [1, 'var(--art-water2)']) + `<g id="${u}F">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-5" rx="3.6" ry="5.2" transform="rotate(${a})"/>`).join('')}<circle class="gd" r="2.4"/></g>`, `
    ${sky(u)}
    <path class="hill" d="M-20 102c10-20 40-22 52-8c10-14 34-12 40 2c12-10 30-8 36 4c10-12 34-14 44-2c14-8 34-6 48 6V170H-20Z"/>
    <path class="l1" d="M-20 116Q100 108 220 116V170H-20Z"/><path class="l0" d="M-20 130Q100 124 220 130V170H-20Z"/>
    <ellipse class="sh" cx="40" cy="118" rx="16" ry="2.4"/><rect class="wo2" x="37" y="88" width="6" height="30"/>
    <rect class="wo" x="16" y="44" width="48" height="46"/><path class="rs" d="M10 46L40 24L70 46Z"/><path class="trimr" d="M10 46L40 24L70 46"/>
    <rect class="cave" x="19" y="47" width="42" height="40"/>
    <circle class="log" cx="24" cy="52.4" r="3.6"/><circle class="log" cx="32" cy="52.4" r="3.6"/><path class="lring" d="M24 52.4h.1M32 52.4h.1"/>
    <g class="bam">${[44, 49.5, 55].map(x => `<circle class="l2" cx="${x}" cy="52.4" r="2.6"/><circle class="dk" cx="${x}" cy="52.4" r="1.2"/>`).join('')}</g>
    <path class="straw" d="M20 61v11M23 61v11M26 61v11M29 61v11M32 61v11M35 61v11M38 61v11"/>
    <ellipse class="am" cx="50" cy="66.5" rx="7" ry="5"/><path class="cone" d="M44 64.5h12M44 68.5h12M47 62v9M53 62v9"/>
    <circle class="dk" cx="25" cy="80" r="1.3"/><circle class="dk" cx="30" cy="77" r="1.3"/><circle class="dk" cx="34" cy="82" r="1.3"/><circle class="dk" cx="28" cy="84" r="1"/>
    <path class="wo2" d="M42 75h17v10H42z" opacity=".55"/><path class="div" d="M19 59H61M19 74H61M40 47V59M40 74V87"/>
    <g class="bee"><g class="beey"><g transform="translate(72 64)"><ellipse class="wing" cx="-1" cy="-4" rx="3" ry="2"/><ellipse class="gd" rx="4" ry="3"/><path class="stripe" d="M-1-3v6M1.6-3v6"/></g></g></g>
    <ellipse class="sh" cx="106" cy="120" rx="18" ry="2.4"/><path fill="url(#${u}b)" d="M99 120l3-26h8l3 26z"/><rect class="stone" x="92" y="116" width="28" height="5" rx="2"/>
    <path fill="url(#${u}b)" d="M79 88h54q-4 11-27 11t-27-11z"/><ellipse class="stone" cx="106" cy="88" rx="27" ry="4.2"/><ellipse fill="url(#${u}c)" cx="106" cy="88.2" rx="23" ry="2.8"/>
    <ellipse class="rip rp1" cx="112" cy="88.2" rx="5" ry="1"/><ellipse class="rip rp2" cx="112" cy="88.2" rx="5" ry="1"/>
    <g class="spw"><path class="dk" d="M126 87l-1 3M129 87l1 3"/><path class="tail2" d="M133 81l9-4-2 6z"/><ellipse class="wo" cx="129" cy="82" rx="7" ry="5"/><path class="wo2" d="M128 79c4-1 8 1 9 3c-3 1-7 1-9-3z"/>
      <circle class="wo" cx="122.4" cy="77.6" r="4"/><path class="dk" d="M118.8 77.6l-3.4 1.2 3.4 1z"/><circle class="dk" cx="121.4" cy="76.8" r=".9"/><ellipse class="wt" cx="124" cy="81" rx="2.4" ry="1.6"/></g>
    <path class="l0" d="M148 118c-8-14-2-32 14-34c4-15 26-15 30 0c12 3 16 20 10 34z"/><circle class="l1" cx="170" cy="94" r="12"/><circle class="l1" cx="188" cy="102" r="9"/><circle class="l2" cx="160" cy="104" r="7"/>
    <g class="fl1"><use class="rs" href="#${u}F" transform="translate(166 76)"/><path class="stamen" d="M166 76l-6-6"/></g>
    <use class="pl" href="#${u}F" transform="translate(188 92) scale(.75)"/>
    <g class="sb"><g class="sbw"><g transform="translate(184 58)"><path class="te" d="M7 2l8 5-1-6z"/><ellipse class="pl" cx="2" cy="0" rx="7.4" ry="4.2" transform="rotate(-20)"/><ellipse class="gd" cx="0" cy="2" rx="4" ry="2.2" transform="rotate(-20)"/>
      <circle class="te" cx="-5" cy="-3" r="3.6"/><path class="beak" d="M-8-2.4q-6 2-9 7"/><circle class="dk" cx="-5.6" cy="-3.6" r=".8"/><g class="sbwing"><ellipse class="wing2" cx="3" cy="-6" rx="3" ry="6.4" transform="rotate(20 3 -6)"/></g></g></g></g>
    <path class="tufts" d="M8 130l3-8 2 8M60 128l2-6 3 6M140 131l3-7 2 7M180 132l2-6 3 6"/>`),

  tiedye: u => wrap('tiedye', u,
    bg(u, 'r', .5, .4) + lg(`${u}b`, 0, 1, [0, 'var(--plum)'], [.55, 'var(--rust)'], [1, 'var(--amber)']) + `<clipPath id="${u}k"><path d="M66 21Q100 28 134 21L136 98q-5 4-10 0t-10 0t-10 0t-10 0t-10 0t-10 0t-10 0z"/></clipPath>` + rg(`${u}c`, .5, .5, .5, [0, 'var(--art-gold)', .9], [1, 'var(--art-gold)', 0]), `
    ${sky(u)}
    <path class="cline" d="M-20 15Q100 31 220 15"/>
    <g class="cloth">
      <path fill="url(#${u}b)" d="M66 21Q100 28 134 21L136 98q-5 4-10 0t-10 0t-10 0t-10 0t-10 0t-10 0t-10 0z"/>
      <g clip-path="url(#${u}k)"><circle class="bleed" fill="url(#${u}c)" cx="100" cy="60" r="30"/>
        <path class="dots" d="M100 60h0${[...Array(8)].map((_, i) => `M${polar(100, 60, 9, i * 45)}h0`).join('')}${[...Array(14)].map((_, i) => `M${polar(100, 60, 19, i * 360 / 14 + 10)}h0`).join('')}"/>
          <path class="dots2" d="${[[77, 34], [123, 34], [77, 88], [123, 88]].map(([x, y]) => `M${x - 3} ${y}h0M${x + 3} ${y}h0M${x} ${y - 3}h0M${x} ${y + 3}h0`).join('')}"/>
        <path class="fold" d="M84 24L82 100M118 24L120 100"/></g>
      <rect class="wo" x="70" y="16" width="4.4" height="11" rx="1.2"/><rect class="wo" x="125.6" y="16" width="4.4" height="11" rx="1.2"/></g>
    <g class="drip d1"><ellipse class="pl" cx="86" cy="103" rx="1.6" ry="2.3"/></g><g class="drip d2"><ellipse class="rs" cx="116" cy="103" rx="1.6" ry="2.3"/></g>
    <rect class="flr" x="-20" y="120" width="240" height="50"/><path class="seam" d="M-20 128H220"/>
    <ellipse class="sh" cx="34" cy="122" rx="23" ry="3"/><path class="pot" d="M14 98h40l-4 22q-16 4-32 0z"/><ellipse class="pot2" cx="34" cy="98" rx="20" ry="4.2"/><ellipse class="dyey" cx="34" cy="98.6" rx="17" ry="2.8"/><path class="potb" d="M17 106h34"/>
    <g transform="translate(60 116)">${[0, 60, 120, 180, 240, 300].map(a => `<ellipse class="am" cx="0" cy="-3" rx="2" ry="3.4" transform="rotate(${a})"/>`).join('')}<circle class="gd" r="2"/></g><path class="root" d="M62 121q5-1 8 1"/>
    <ellipse class="sh" cx="166" cy="122" rx="23" ry="3"/><ellipse class="pot2" cx="166" cy="98" rx="20" ry="4.2"/><ellipse class="dyei" cx="166" cy="98.6" rx="17" ry="2.8"/>
    <g class="dip"><path class="str" d="M166-20V79"/><circle class="bun" cx="166" cy="88" r="10"/><path class="wrp" d="M157 84q9 4 18 0M156.6 91q9.4 4 18.8 0"/><path class="bun" d="M163 78q3-6 6 0z"/><circle class="hi" cx="162" cy="84" r="2.4"/></g>
    <g class="dd"><ellipse class="dyei" cx="160" cy="95" rx="1.3" ry="1.9"/><ellipse class="dyei" cx="171" cy="95" rx="1.2" ry="1.8"/></g>
    <path class="pot" d="M146 98a20 4.2 0 0 0 40 0l-4 22q-16 4-32 0z"/><path class="potb" d="M149 106h34"/>
    <ellipse class="rip" cx="166" cy="98.6" rx="8" ry="1.4"/>
    <g class="sp1">${spark(146, 44, 3.6)}</g><g class="sp2">${spark(52, 38, 2.8)}</g><g class="sp3">${spark(150, 70, 2.2)}</g>`),

  ai: u => wrap('ai', u,
    bg(u, 'r', .45, .45) + lg(`${u}b`, 1, 1, [0, 'var(--art-gold)'], [.55, 'var(--amber)'], [1, 'var(--rust)']) + lg(`${u}c`, 0, 1, [0, 'var(--art-glow)'], [1, 'var(--art-screen)']) + lg(`${u}d`, 0, 1, [0, 'var(--teal-2)', 0], [1, 'var(--teal-2)', .45]), `
    ${sky(u)}
    <rect class="desk" x="-20" y="116" width="240" height="54"/><rect class="edge" x="-20" y="116" width="240" height="2.4"/>
    <ellipse class="sh" cx="62" cy="117" rx="50" ry="3"/><rect class="dk" x="10" y="14" width="102" height="96" rx="9"/><rect fill="url(#${u}c)" x="16" y="20" width="90" height="84" rx="4"/><circle class="cam" cx="61" cy="17" r="1.3"/>
    <ellipse class="plate" cx="61" cy="88" rx="32" ry="7"/>
    <path fill="url(#${u}b)" d="M42 80c-6-16 4-34 22-34c14 0 22 12 18 26c-3 10-12 14-22 14c-8 0-15-1-18-6z"/><ellipse class="hi" cx="52" cy="58" rx="3.6" ry="7" transform="rotate(25 52 58)" opacity=".5"/>
    <path class="mstem" d="M64 46q1-5 4-7"/>${leaf(67, 42, 14, -30)}
    <g class="box"><path class="brk" d="M34 50v-8h8M80 42h8v8M88 80v8h-8M42 88h-8v-8"/></g>
    <g class="atag"><rect class="te" x="34" y="30" width="40" height="9" rx="2"/><text class="tagt" x="37" y="36.7">MANGO 92%</text></g>
    <g class="scan"><rect fill="url(#${u}d)" x="16" y="20" width="90" height="12"/><rect class="scanl" x="16" y="31" width="90" height="1.4"/></g>
    <rect class="sh" x="122" y="18" width="70" height="58" rx="7" opacity=".5"/><rect class="wt" x="120" y="15" width="70" height="58" rx="7"/>
    ${[[27, 'am', 50], [43, 'rs', 9], [59, 'l1', 5]].map(([y, c, w], i) => `<circle class="${c}" cx="129" cy="${y}" r="3.6"/><rect class="trk" x="136" y="${y - 2.5}" width="48" height="5" rx="2.5"/><rect class="${c} cbar br${i}" x="136" y="${y - 2.5}" width="${w}" height="5" rx="2.5"/>`).join('')}
    <path class="lk" d="M128 88L156 82M128 88L156 98M128 104L156 82M128 104L156 98M128 104L156 114M128 120L156 98M128 120L156 114M156 82L184 98M156 98L184 98M156 114L184 98"/>
    <path class="pulse" d="M128 88L156 98L184 98M128 120L156 114L184 98"/>
    ${[[128, 88], [128, 104], [128, 120], [156, 82], [156, 98], [156, 114], [184, 98]].map(([x, y], i) => `<circle class="nd q${i}" cx="${x}" cy="${y}" r="4"/>`).join('')}`),

  puppets: u => wrap('puppets', u,
    bg(u, 'p', .5, .3) + `<linearGradient id="${u}b" x2=".18" spreadMethod="reflect">${st(0, 'var(--rust)')}${st(1, 'var(--art-curtain)')}</linearGradient>` + lg(`${u}c`, 0, 1, [0, 'var(--art-night)'], [1, 'var(--art-night2)']), `
    ${sky(u)}
    <rect fill="url(#${u}c)" x="20" y="18" width="160" height="86"/>
    <circle class="moon" cx="152" cy="40" r="7"/><circle class="moonc" cx="155.4" cy="37.6" r="6"/>
    <g class="st1">${spark(48, 34, 2.6)}</g><g class="st2">${spark(120, 28, 2)}</g><g class="st3">${spark(88, 46, 1.8)}</g>
    <g class="pa"><rect class="te" x="52" y="60" width="32" height="50" rx="16"/><path class="hair" d="M60 62q2-8 7-3q2-7 7 0q3-6 6 2"/>
      <circle class="wt" cx="62" cy="72" r="4.4"/><circle class="wt" cx="75" cy="72" r="4.4"/><circle class="dk" cx="63.4" cy="72.6" r="2.1"/><circle class="dk" cx="76.4" cy="72.6" r="2.1"/>
      <g class="ma"><ellipse class="mouth" cx="68.6" cy="85" rx="8.6" ry="4.6"/><ellipse class="tongue" cx="68.6" cy="87.4" rx="4.2" ry="2"/></g></g>
    <g class="pb"><rect class="am" x="116" y="60" width="32" height="50" rx="16"/><circle class="pdot" cx="122" cy="96" r="2"/><circle class="pdot" cx="140" cy="100" r="2.4"/><circle class="pdot" cx="131" cy="104" r="1.6"/>
      <path class="pl" d="M124 60l-6-5v9zM124 60l6-5v9z"/><circle class="pl" cx="124" cy="60" r="2"/>
      <circle class="wt" cx="125" cy="72" r="4.4"/><circle class="wt" cx="138" cy="72" r="4.4"/><circle class="dk" cx="123.6" cy="72.6" r="2.1"/><circle class="dk" cx="136.6" cy="72.6" r="2.1"/>
      <g class="mb"><ellipse class="mouth" cx="131.4" cy="85" rx="8.6" ry="4.6"/><ellipse class="tongue" cx="131.4" cy="87.4" rx="4.2" ry="2"/></g></g>
    <g class="ba"><path class="sbub" d="M82 26h26a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5h-16l-7 7v-7h-3a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5z"/><path class="bdots" d="M86 35.5h.1M95 35.5h.1M104 35.5h.1"/></g>
    <g class="bb"><path class="sbub" d="M118 22h-26a5 5 0 0 0-5 5v9a5 5 0 0 0 5 5h16l7 7v-7h3a5 5 0 0 0 5-5v-9a5 5 0 0 0-5-5z"/><path class="rs" transform="translate(105 29.6)" d="M0 0${heart}"/></g>
    <g class="cu1"><path fill="url(#${u}b)" d="M14 16H62C56 34 44 52 34 64C40 80 42 92 40 106H14Z"/><rect class="gd" x="28" y="62" width="10" height="4" rx="2" transform="rotate(-30 33 64)"/></g>
    <g class="cu2"><path fill="url(#${u}b)" d="M186 16H138C144 34 156 52 166 64C160 80 158 92 160 106H186Z"/><rect class="gd" x="162" y="62" width="10" height="4" rx="2" transform="rotate(30 167 64)"/></g>
    <path class="val" d="M10 8H190V22${[...Array(10)].map(() => 'q-9 8-18 0').join('')}Z"/><path class="trimv" d="M10 21H190"/>
    <rect class="booth" x="8" y="102" width="184" height="60" rx="3"/><rect class="gd" x="8" y="102" width="184" height="3.4"/>
    ${[40, 100, 160].map(x => `<path class="gd" opacity=".75" d="${star(x, 120, 5, 2.2, 5)}"/>`).join('')}`),

  health: u => wrap('health', u,
    bg(u, 'p', .5, .5) + lg(`${u}b`, 1, 1, [0, 'var(--art-heart)'], [1, 'var(--plum)']) + `<clipPath id="${u}c"><rect x="15" y="31" width="80" height="54" rx="3"/></clipPath>` + lg(`${u}d`, 0, 1, [0, 'var(--art-wood)'], [1, 'var(--art-wood2)']), `
    ${sky(u)}
    <rect fill="url(#${u}d)" x="-20" y="114" width="240" height="56"/><rect class="edge" x="-20" y="114" width="240" height="2.4"/>
    <ellipse class="sh" cx="56" cy="115.4" rx="26" ry="2.2"/><rect class="mt2" x="50" y="90" width="12" height="20"/><rect class="mt2" x="38" y="108" width="36" height="6" rx="3"/>
    <rect class="dk" x="10" y="26" width="90" height="64" rx="7"/><rect class="scr" x="15" y="31" width="80" height="54" rx="3"/>
    <path class="grid" d="M15 44H95M15 58H95M15 72H95M31 31V85M47 31V85M63 31V85M79 31V85"/>
    <g clip-path="url(#${u}c)"><g class="ecg"><path class="ecgl" d="M15 64${'h8q2-3 4 0h3l2 3 3-18 3 22 2-7h4q3-5 6 0h8'.repeat(5)}"/></g></g>
    <g class="bpm"><path class="pl" transform="translate(23 39.4) scale(.7)" d="M0 0${heart}"/></g><text class="bpmt" x="29" y="44">72</text>
    <g class="hb"><path class="hring" d="M150 70C126 56 118 40 126 30C132 22 144 22 150 32C156 22 168 22 174 30C182 40 174 56 150 70Z"/>
      <path class="ht" fill="url(#${u}b)" d="M150 70C126 56 118 40 126 30C132 22 144 22 150 32C156 22 168 22 174 30C182 40 174 56 150 70Z"/>
      <path class="hi" d="M130 33c3-4 8-5 11-2c-5 0-8 3-9 7z" opacity=".55"/><path class="plus" d="M161 35v9M156.5 39.5h9"/></g>
    <ellipse class="sh" cx="122" cy="115.6" rx="34" ry="2.6"/><ellipse class="plate" cx="122" cy="108" rx="34" ry="9.6"/><ellipse class="plate2" cx="122" cy="107" rx="27" ry="7"/>
    ${leaf(104, 107, 10, -150)}${leaf(106, 108, 10, -100, 'l2')}${leaf(108, 107, 9, -40, 'l0')}
    <path class="carrot" d="M118 103l7 1M117 106l8 .4M119 109l7-.6"/>
    <ellipse class="rice" cx="113" cy="110.4" rx="5" ry="2"/><circle class="rice" cx="110" cy="109.4" r="1.6"/>
    <ellipse class="dal" cx="134" cy="106" rx="8" ry="3.6"/><ellipse class="gd" cx="134" cy="105.4" rx="6" ry="2.4"/><circle class="rs" cx="127" cy="110.6" r="2.4"/><circle class="tom" cx="127" cy="110.6" r="1.4"/>
    <path class="fork" d="M158 111l-2-14M155 97v-4M157 97v-4"/>
    <g class="apl"><ellipse class="sh" cx="176" cy="115" rx="9" ry="1.8"/><path class="rs" d="M176 98c-6-4-12 0-12 7s5 10 8 10c2 0 3-1 4-1s2 1 4 1c3 0 8-3 8-10s-6-11-12-7z"/><path class="stemd" d="M176 99q0-4 2-6"/>${leaf(177, 95, 7, -30)}<ellipse class="hi" cx="170" cy="103" rx="1.6" ry="3" opacity=".5"/></g>
    <g class="sp1">${spark(188, 92, 3)}</g>`),

  /* ---------------- Grade 8 ---------------- */
  hydro: u => wrap('hydro', u,
    bg(u, 'o', .5, .35) + lg(`${u}d`, 0, 1, [0, 'var(--art-grow)', .35], [1, 'var(--art-grow)', 0]) + rg(`${u}e`, .4, .35, .8, [0, 'var(--art-l2)'], [1, 'var(--olive)']) + `<g id="${u}L"><ellipse fill="url(#${u}e)" cx="-9" cy="-6" rx="9" ry="5.6" transform="rotate(-25 -9 -6)"/><ellipse fill="url(#${u}e)" cx="9" cy="-6" rx="9" ry="5.6" transform="rotate(25 9 -6)"/><ellipse class="l0" cx="0" cy="-12" rx="7" ry="9"/><ellipse fill="url(#${u}e)" cx="-5" cy="-10" rx="6" ry="8" transform="rotate(-20 -5 -10)"/><ellipse fill="url(#${u}e)" cx="5" cy="-10" rx="6" ry="8" transform="rotate(20 5 -10)"/><path class="vein" d="M0-2v-14M-5-4l-4-8M5-4l4-8"/></g>` + lg(`${u}c`, 0, 1, [0, 'var(--art-water)'], [1, 'var(--art-water2)']), `
    ${sky(u)}
    <path class="wire" d="M60-10V8M140-10V8"/><path class="cone" fill="url(#${u}d)" d="M42 13H158L186 66H14z"/>
    <rect class="dk" x="38" y="7" width="124" height="7" rx="3.5"/><path class="leds" d="M46 14h108"/>
    <rect class="flr" x="-20" y="122" width="240" height="48"/><path class="seam" d="M-20 128H220"/>
    <path class="leg" d="M24 82V122M176 82V122"/>
    <ellipse class="sh" cx="60" cy="123" rx="34" ry="2.6"/>
    <path class="tube" d="M40 96V82"/><path class="tflow" d="M40 96V82"/>
    <rect class="tank" x="28" y="94" width="64" height="28" rx="4"/><rect fill="url(#${u}c)" x="31" y="101" width="58" height="18" rx="2"/><path class="wl" d="M31 101h58"/>
    <rect class="dk" x="54" y="115.4" width="12" height="3" rx="1.5"/><path class="atube" d="M66 117q14 0 26-6h10"/>
    <g class="pump"><rect class="am" x="100" y="106" width="16" height="12" rx="3"/><circle class="wt" cx="108" cy="112" r="2"/></g>
    <g class="bbl">${[[56, 2.2], [60, 1.6], [64, 2.4], [58, 1.4], [62, 1.8]].map(([x, r], i) => `<circle class="wt bu${i}" cx="${x}" cy="113" r="${r}"/>`).join('')}</g>
    <rect class="pipe" x="12" y="64" width="176" height="18" rx="9"/><rect fill="url(#${u}c)" x="16" y="73.4" width="168" height="6.4" rx="3.2"/><path class="flow" d="M22 76.6H180"/>
    ${[56, 100, 144].map((x, i) => `<path class="root rt${i}" d="M${x - 3} 68q-2 6 0 11M${x} 68q2 5-1 12M${x + 3} 68q3 6 1 10"/><path class="dk" d="M${x - 8} 62h16l-2 7h-12z"/>`).join('')}
    <path class="pipeh" d="M18 67.4H182"/><rect class="cap" x="8" y="62" width="8" height="22" rx="3"/><rect class="cap" x="184" y="62" width="8" height="22" rx="3"/>
    ${[[56, .85, 1], [100, 1.12, 2], [144, .95, 3]].map(([x, sc, k]) => `<g class="lt k${k}"><use href="#${u}L" transform="translate(${x} 62) scale(${sc})"/></g>`).join('')}
    <ellipse class="sh" cx="152" cy="123" rx="20" ry="2.2"/><rect class="wt" x="134" y="96" width="36" height="26" rx="4"/><rect class="scr" x="138" y="100" width="28" height="11" rx="2"/><text class="ph" x="141" y="108.6">pH 6.5</text><circle class="l1" cx="145" cy="116" r="1.8"/><circle class="rs" cx="152" cy="116" r="1.8"/><circle class="okd" cx="159" cy="116" r="1.8"/>`),

  animals: u => wrap('animals', u,
    bg(u, 'o', .45, .3), `
    ${sky(u)}
    <g class="cl1">${cloud(30, 26, .85)}</g><g class="cl2">${cloud(132, 18, .6)}</g>
    <path class="hill" d="M-20 84C30 66 80 70 120 82S190 70 220 76V170H-20Z"/>
    <path class="barn" d="M2 86V66l15-12 15 12v20z"/><path class="barnr" d="M-1 68l18-15 18 15"/><path class="barnd" d="M11 86V74h12v12M11 74l12 12M23 74l-12 12"/>
    <g class="fence"><path d="M-20 86H220M-20 93H220"/><path class="post" d="M6 80v18M42 80v18M78 80v18M114 80v18M150 82v16M194 80v18"/></g>
    <path class="l1" d="M-20 98Q100 90 220 98V170H-20Z"/><path class="l0" d="M-20 128Q100 122 220 128V170H-20Z"/>
    <ellipse class="sh" cx="80" cy="118.4" rx="42" ry="3.4"/>
    <rect class="cowl" x="98" y="94" width="7" height="24" rx="3"/><rect class="cowl" x="106" y="94" width="7" height="23" rx="3"/><path class="hoof" d="M98 116h7M106 115h7"/>
    <g class="tail"><path class="tailp" d="M114 78q8 6 6 22"/><ellipse class="dk" cx="120" cy="102" rx="2.4" ry="4"/></g>
    <rect class="cow" x="46" y="68" width="70" height="34" rx="16"/><path class="dk" d="M64 70c6 2 10 8 6 14c-4 4-12 2-14-4c-2-5 2-10 8-10z"/><path class="dk" d="M98 74c6-2 12 2 12 8c0 5-6 7-10 5c-5-2-6-11-2-13z"/>
    <ellipse class="udder" cx="96" cy="102" rx="6" ry="3.6"/>
    <rect class="tape" x="78" y="68.6" width="5" height="33.4" rx="1"/><path class="tks" d="M78 73h2.4M78 77h2.4M78 81h2.4M78 85h2.4M78 89h2.4M78 93h2.4M78 97h2.4"/>
    <rect class="cowl" x="52" y="94" width="7" height="24" rx="3"/><rect class="cowl" x="62" y="94" width="7" height="24" rx="3"/><path class="hoof" d="M52 116h7M62 116h7"/>
    <g class="head"><path class="cow" d="M56 72c-4-6-20-8-25-1c-5 6-5 16-1 20c4 4 15 4 19 0c4-5 9-11 7-19z"/><path class="dk" d="M40 70c4-2 9-1 11 3c-4 3-9 3-11-3z"/>
      <ellipse class="snout" cx="33" cy="90" rx="7.4" ry="5"/><circle class="dk" cx="31" cy="89.4" r=".9"/><circle class="dk" cx="35.6" cy="89.4" r=".9"/><circle class="dk" cx="39" cy="79" r="1.7"/>
      <g class="ear"><path class="cow" d="M50 72l11-4-4 8z"/><path class="udder" d="M52 72.4l6-2-2 4z"/></g><path class="horn" d="M45 70q-2-6 2-9"/></g>
    <g class="tufts"><path d="M18 120l2-7 2 7M24 121l2-5 2 5"/></g>
    <g class="love"><path class="rs" transform="translate(64 56)" d="M0 0${heart}"/></g>
    <ellipse class="sh" cx="162" cy="119" rx="24" ry="2.6"/>
    <path class="trough" d="M124 106h32l-3 12h-26z"/><path class="hay" d="M127 106l4-5M132 106l2-6M137 106l3-5M142 106l1-6M147 106l3-5M151 106l-1-5"/>
    <path class="goatl" d="M154 102v16M160 102v16M176 102v16M182 102v16"/>
    <path class="goatt" d="M184 92q5-4 4-9"/><rect class="goat" x="150" y="86" width="36" height="20" rx="10"/>
    <g class="gh"><path class="goat" d="M156 90c-2-8-8-12-14-10c-4 2-6 8-4 14c1 4 6 6 10 4z"/><path class="beard" d="M142 96q0 6 3 8"/><path class="ghorn" d="M150 81q4-6 10-3"/><path class="goat" d="M152 84l9 2-6 4z"/><circle class="dk" cx="146" cy="86" r="1.3"/><circle class="dk" cx="139.4" cy="92" r=".8"/></g>
    <g class="tufts t2"><path d="M188 128l2-7 2 7M100 126l2-6 2 6"/></g>`),

  wood: u => wrap('wood', u,
    bg(u, 'r', .55, .4) + lg(`${u}b`, 0, 1, [0, 'var(--art-wood-l)'], [1, 'var(--art-wood)']) + lg(`${u}c`, 0, 1, [0, 'var(--art-wood2)'], [1, 'var(--art-wood3)']) + lg(`${u}d`, 0, 1, [0, 'var(--art-steel)'], [1, 'var(--art-metal2)']), `
    ${sky(u)}
    <g class="bam">${[[8, 'l1', 0], [20, 'l2', 1], [31, 'l0', 2]].map(([x, c, k]) => `<g class="bs s${k}"><rect class="${c}" x="${x}" y="-12" width="6" height="110" rx="2"/><path class="node" d="M${x} ${10 + k * 6}h6M${x} ${38 + k * 6}h6M${x} ${66 + k * 6}h6"/>${leaf(x + 6, 10 + k * 6, 11, -30 + k * 10, 'l2')}${leaf(x, 38 + k * 6, 10, -150 - k * 8, 'l1')}</g>`).join('')}</g>
    <rect class="shelf" x="66" y="52" width="48" height="4" rx="1"/><path class="brk2" d="M72 56l4 6M108 56l-4 6"/>
    <path class="am" d="M74 52l2-16h28l2 16z"/><path class="weave" d="M77 40h26M76 44h28M75.6 48h29M82 36v16M90 36v16M98 36v16"/><path class="bh" d="M78 36q12-12 24 0"/>
    <rect class="flr" x="-20" y="128" width="240" height="42"/>
    <rect class="wo2" x="18" y="104" width="8" height="30"/><rect class="wo2" x="176" y="104" width="8" height="30"/>
    <rect fill="url(#${u}c)" x="-20" y="96" width="240" height="8"/><rect class="edge" x="-20" y="96" width="240" height="1.6"/><rect class="apron" x="-20" y="104" width="240" height="8"/>
    <g class="saw"><g transform="translate(124 82) rotate(-50)"><path fill="url(#${u}d)" d="M-34 0H50V-13L-34-6z"/><path class="teeth" d="M-34 0${'l2 2.4 2-2.4'.repeat(21)}"/><circle class="hole2" cx="40" cy="-8" r="1.5"/>
      <path class="rs" d="M48-16h14q9 0 9 9v4q0 9-9 9h-14zM55-9v5q0 3 3 3h3q3 0 3-3v-5q0-3-3-3h-3q-3 0-3 3z" fill-rule="evenodd"/><circle class="mt" cx="51.4" cy="-11" r="1"/><circle class="mt" cx="51.4" cy="1" r="1"/></g></g>
    <ellipse class="sh" cx="106" cy="96.6" rx="66" ry="1.6"/><rect fill="url(#${u}b)" x="42" y="82" width="126" height="14" rx="2"/>
    <path class="grain" d="M48 87q20-2 40 0t40 0M52 91q30 2 60-1M132 88q14-2 30 1M140 92q10 1 22-1"/><ellipse class="knot" cx="70" cy="89" rx="3.4" ry="1.6"/>
    <path class="kerf" d="M124 82v5"/><path class="pen" d="M124 87v9"/>
    <path class="clamp" d="M47 77h9v34h-9"/><rect class="mt" x="45" y="108" width="13" height="3" rx="1.5"/>
    <ellipse class="dust" cx="126" cy="96.8" rx="8" ry="1.4"/>
    <g class="sd">${[[-1, 0], [1, 1], [-1, 2], [1, 3], [0, 4]].map(([s, i]) => `<circle class="dust dp${i}" cx="124" cy="82" r="${1 + (i % 2) * .3}"/>`).join('')}</g>
    <path class="sq" d="M172 96V78h4v14h18v4z"/>`),

  automation: u => wrap('auto', u,
    bg(u, 'r', .45, .55) + lg(`${u}b`, 0, 1, [0, 'var(--art-night)'], [1, 'var(--art-night2)']) + rg(`${u}c`, .5, .5, .5, [0, 'var(--art-gold)', .75], [.5, 'var(--art-gold)', .22], [1, 'var(--art-gold)', 0]) + lg(`${u}d`, 0, 1, [0, 'var(--art-wood)'], [1, 'var(--art-wood2)']), `
    ${sky(u)}
    <rect class="wf" x="128" y="8" width="60" height="48" rx="3"/><rect fill="url(#${u}b)" x="132" y="12" width="52" height="40" rx="1.5"/>
    <circle class="moon" cx="170" cy="25" r="6.4"/><circle class="moonc" cx="173" cy="22.6" r="5.4"/>
    <g class="st1">${spark(142, 22, 2.2)}</g><g class="st2">${spark(152, 42, 1.8)}</g><path class="mun" d="M158 12v40M132 32h52"/>
    <rect class="pcb2" x="92" y="20" width="22" height="16" rx="3"/><circle class="sled" cx="110" cy="24" r="1.3"/><path class="dome" d="M97 36a6 6 0 0 0 12 0z"/><path class="facet" d="M100 36.4v3.6M103 36.4v5.4M106 36.4v3.6"/>
    <g class="waves"><path class="wv v1" d="M95 46q8 6 16 0"/><path class="wv v2" d="M91 52q12 9 24 0"/><path class="wv v3" d="M87 58q16 12 32 0"/></g>
    <path class="wire w1" d="M64 98C80 90 92 70 99 37"/><path class="wire w2" d="M74 104C110 108 140 112 166 108"/>
    <rect fill="url(#${u}d)" x="-20" y="112" width="240" height="58"/><rect class="edge" x="-20" y="112" width="240" height="2.4"/>
    <g class="cat"><g><path class="catt" d="M111 103q9-1 8-12"/><g class="lg1"><rect class="catb" x="91" y="106" width="3.4" height="7" rx="1.7"/><rect class="catb" x="104" y="106" width="3.4" height="7" rx="1.7"/></g>
      <g class="lg2"><rect class="catb" x="94.6" y="106" width="3.4" height="7" rx="1.7"/><rect class="catb" x="107.6" y="106" width="3.4" height="7" rx="1.7"/></g>
      <ellipse class="catb" cx="101" cy="104" rx="11" ry="6"/><circle class="catb" cx="89" cy="99" r="5.4"/><path class="catb" d="M85 96l.4-6 4 3.6zM93 96l-.4-6-4 3.6z"/><circle class="ceye" cx="87" cy="98.6" r=".9"/><circle class="ceye" cx="91" cy="98.6" r=".9"/></g></g>
    <ellipse class="sh" cx="46" cy="113" rx="40" ry="2.4"/>
    <g transform="matrix(1 0 -.3 .5 26 96)"><rect class="pcb" width="64" height="32" rx="3"/><rect class="dk" x="8" y="2" width="44" height="5" rx="1"/><path class="pins" d="M10 4.5h41"/><rect class="dk" x="14" y="25" width="38" height="5" rx="1"/><path class="pins" d="M16 27.5h35"/>
      <rect class="dk" x="22" y="12" width="20" height="9" rx="1"/><rect class="mt" x="-4" y="6" width="12" height="9" rx="1"/><circle class="pled" cx="56" cy="16" r="2.2"/><circle class="logo" cx="49" cy="16" r="3"/></g>
    <ellipse class="glow" fill="url(#${u}c)" cx="170" cy="82" rx="38" ry="38"/>
    <ellipse class="sh" cx="170" cy="113" rx="16" ry="2"/><rect class="mt2" x="158" y="106" width="24" height="6" rx="3"/><rect class="mt" x="164" y="92" width="12" height="15" rx="2"/><path class="screw" d="M164 96h12M164 100h12M164 104h12"/>
    <circle class="bulb" cx="170" cy="82" r="12"/><path class="fil" d="M166 88v-4l2-3 2 3 2-3 2 3v4"/><ellipse class="hi" cx="165" cy="77" rx="2.6" ry="4" transform="rotate(30 165 77)" opacity=".6"/>
    <g class="beams">${rays(170, 82, 16, 21, 8, 22.5)}</g>`),

  water: u => wrap('water', u,
    bg(u, 'p', .5, .45) + lg(`${u}b`, 0, 1, [0, 'var(--art-steel)'], [1, 'var(--art-metal2)']) + lg(`${u}c`, 1, 0, [0, 'var(--art-water)'], [1, 'var(--art-water2)']) + lg(`${u}d`, 1, 0, [0, 'var(--teal-2)'], [.5, 'var(--teal)'], [1, 'var(--art-tealdk)']) + `<clipPath id="${u}e"><rect x="156.6" y="75" width="7" height="9.4"/></clipPath>`, `
    ${sky(u)}
    <path class="tiles" d="M-20 64H220M-20 88H220M-20 112H220${[...Array(9)].map((_, i) => `M${10 + i * 24} ${i % 2 ? 64 : 88}v24`).join('')}"/>
    <rect class="flr" x="-20" y="118" width="240" height="52"/><path class="seam" d="M-20 124H220"/>
    <rect fill="url(#${u}b)" x="-20" y="26" width="76" height="10"/><rect class="mt2" x="22" y="23" width="6" height="16" rx="1.5"/>
    <path fill="url(#${u}b)" d="M50 24h16q8 0 8 8v14h-10v-10h-14z"/><rect class="mt2" x="63" y="45" width="12" height="4" rx="1"/>
    <rect class="mt2" x="56" y="16" width="4" height="9"/><rect class="te" x="47" y="12" width="22" height="5" rx="2.5"/><circle class="hi" cx="51" cy="13.8" r="1" opacity=".7"/>
    <g class="form"><ellipse class="wa" cx="69" cy="51" rx="2.2" ry="2.6"/></g>
    <g class="drop"><path class="wa" d="M69 50q-3.4 5-3.4 7.4a3.4 3.4 0 0 0 6.8 0q0-2.4-3.4-7.4z"/></g>
    <path class="bh" d="M47 90q23-30 46 0"/>
    <ellipse class="sh" cx="70" cy="123" rx="28" ry="3"/><ellipse class="bin" cx="70" cy="90" rx="24" ry="5"/><ellipse fill="url(#${u}c)" cx="70" cy="95.4" rx="21.4" ry="3.8"/>
    <ellipse class="rip rp1" cx="69" cy="95.4" rx="5" ry="1"/><ellipse class="rip rp2" cx="69" cy="95.4" rx="5" ry="1"/>
    <path fill="url(#${u}d)" d="M46 90a24 5 0 0 0 48 0l-5 32h-38z"/><path class="rim" d="M46 90a24 5 0 0 0 48 0"/><path class="mk" d="M84 100h5M85 108h4M86 116h3"/><path class="hi" d="M51 96l3 22h3l-2-21z" opacity=".35"/>
    <g class="spl"><circle class="wa" cx="64" cy="92" r="1"/><circle class="wa" cx="74" cy="91.4" r="1.1"/></g>
    <rect fill="url(#${u}b)" x="108" y="98" width="112" height="10"/><rect class="mt2" x="118" y="95" width="5" height="16" rx="1.5"/>
    <ellipse class="sh" cx="152" cy="103" rx="30" ry="3"/><circle class="te" cx="152" cy="66" r="31"/><circle class="mring" cx="152" cy="66" r="31"/><circle class="face" cx="152" cy="66" r="25"/>
    <path class="dial" d="${[...Array(12)].map((_, i) => `M${polar(152, 66, 21, i * 30 - 90)}L${polar(152, 66, i % 3 ? 23 : 24.4, i * 30 - 90)}`).join('')}"/>
    <rect class="dk" x="137" y="74" width="28" height="11" rx="1.6"/><text class="dig" x="139" y="82.4">047</text>
    <g clip-path="url(#${u}e)"><g class="odo"><text class="dig dw" x="157.4" y="82.4">${[...'01234567890'].map((d, i) => `<tspan x="157.4" dy="${i ? 9.4 : 0}">${d}</tspan>`).join('')}</text></g></g>
    <g class="needle"><path class="ndl" d="M152 66V48"/><path class="ndl2" d="M152 66v5"/></g><circle class="dk" cx="152" cy="66" r="3"/>
    <path class="wa" transform="translate(152 54) scale(.8)" d="M0-6q-4 5-4 7.6a4 4 0 0 0 8 0q0-2.6-4-7.6z"/>
    <g class="sp1">${spark(94, 74, 3)}</g>`),

  ads: u => wrap('ads', u,
    bg(u, 'p', .45, .45) + lg(`${u}d`, 1, 0, [0, 'var(--plum)'], [1, 'var(--art-heart)']) + lg(`${u}b`, 0, 1, [0, 'var(--art-gold)'], [1, 'var(--amber)']), `
    ${sky(u)}
    <rect class="shopw" x="110" y="30" width="100" height="90"/>
    <rect class="win" x="122" y="62" width="34" height="26" rx="2"/><circle class="am" cx="130" cy="80" r="3.4"/><circle class="rs" cx="139" cy="80" r="3.4"/><circle class="l1" cx="148" cy="80" r="3.4"/><path class="shelf2" d="M122 84h34"/>
    <rect class="door" x="166" y="60" width="24" height="60" rx="1.5"/><circle class="gd" cx="170.4" cy="92" r="1.2"/>
    <g class="awn"><path d="M106 30h108v12${[...Array(6)].map(() => 'q-9 8-18 0').join('')}z" class="awnw"/><path class="awnr" d="${[...Array(3)].map((_, i) => `M${106 + i * 36} 30h18v12q-9 8-18 0z`).join('')}"/></g>
    <rect class="flr" x="-20" y="118" width="240" height="52"/><path class="seam" d="M-20 124H220"/>
    <path class="easel" d="M30 122L44 26M86 122L72 26M58 30v92"/><ellipse class="sh" cx="58" cy="122" rx="32" ry="2.6"/>
    <rect class="sh" x="22" y="24" width="76" height="74" rx="3" opacity=".6"/><rect class="poster" x="20" y="20" width="76" height="74" rx="3"/>
    <g class="burst"><path fill="url(#${u}b)" d="${star(58, 48, 22, 15, 12)}"/></g>
    <rect class="am" x="50" y="40" width="16" height="18" rx="3"/><rect class="rs" x="49" y="36" width="18" height="5" rx="1.5"/><rect class="wt" x="52" y="45" width="12" height="7" rx="1"/><path class="pl" transform="translate(58 47.4) scale(.42)" d="M0 0${heart}"/>
    <rect class="ln" x="30" y="72" width="56" height="5" rx="2.5"/><rect class="ln2" x="38" y="80" width="40" height="3.4" rx="1.7"/>
    <g class="cta"><rect class="rs" x="42" y="85.4" width="32" height="6.4" rx="3.2"/></g>
    <g class="adbdg"><circle class="te" cx="88" cy="26" r="8"/><path class="wt" d="${star(88, 26, 4.4, 2, 5)}"/></g>
    <g class="mega"><path class="dk" d="M126 104l-4 12h6l3-10z"/><rect class="dk" x="114" y="94" width="10" height="11" rx="2.4"/>
      <path fill="url(#${u}d)" d="M122 93L156 76V122L122 106Z"/><ellipse class="bell" cx="156" cy="99" rx="5" ry="23"/><ellipse class="bell2" cx="156.6" cy="99" rx="3" ry="18"/><path class="hi" d="M126 96l26-14v6l-26 12z" opacity=".35"/></g>
    <g class="snd"><path class="swv s1" d="M166 88q7 11 0 22"/><path class="swv s2" d="M172 81q11 18 0 36"/><path class="swv s3" d="M178 74q15 25 0 50"/></g>
    <g class="lk1"><path class="rs" transform="translate(176 62)" d="M0 0${heart}"/></g><g class="lk2"><path class="gd" transform="translate(190 76) scale(.8)" d="M0 0${heart}"/></g>
    <g class="sp1">${spark(14, 16, 3.4)}</g><g class="sp2">${spark(104, 14, 2.6)}</g><g class="sp3">${spark(108, 58, 2.2)}</g>`),
};

let seq = 0;
export const art = key => (ART[key] ? ART[key](`a${(seq++).toString(36)}`) : '');

const ICONS = {
  leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  hand: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 15a1.6 1.6 0 0 1 2.6-1.9L7 14"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5V14M12 17.2v.1"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  home: '<path d="M3 11 12 3.5 21 11M5.5 9.5V20h13V9.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6 6 0 0 1 4 5.7"/>',
  school: '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/>',
  brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5z"/><path d="M6 13c-2 0-3.5 1.5-3.5 4 0 1.5-.5 2.5-1 3 3 .5 6-1 6.5-3.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9.5 18h5"/>',
  flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
};

export const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
