// Animated SVG illustrations for every Grade 6, 7 and 8 project, plus small icons.
// Motion lives in assets/css/art.css and switches off with "reduce motion".

const ART = {
  garden: `
  <svg viewBox="0 0 200 140" class="art art-garden" aria-hidden="true">
    <circle cx="168" cy="26" r="13" class="sun"/>
    <rect x="10" y="104" width="180" height="26" rx="8" class="soil"/>
    <g class="sprout s1"><path d="M48 104 V78" class="stem"/><path d="M48 86 C 36 80, 34 70, 36 66 C 46 68, 50 76, 48 86 Z" class="leaf"/><path d="M48 80 C 58 72, 64 70, 66 72 C 64 82, 56 84, 48 80 Z" class="leaf"/></g>
    <g class="sprout s2"><path d="M96 104 V66" class="stem"/><path d="M96 78 C 82 72, 80 60, 82 54 C 94 58, 98 66, 96 78 Z" class="leaf"/><path d="M96 70 C 108 60, 116 58, 118 60 C 116 72, 106 76, 96 70 Z" class="leaf"/><circle cx="96" cy="62" r="5" class="fruit"/></g>
    <g class="sprout s3"><path d="M142 104 V82" class="stem"/><path d="M142 90 C 132 86, 130 78, 132 74 C 140 76, 144 82, 142 90 Z" class="leaf"/><path d="M142 86 C 150 80, 156 78, 158 80 C 156 88, 150 90, 142 86 Z" class="leaf"/></g>
    <g class="can"><path d="M150 40 h26 v20 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 Z" class="tool"/><path d="M150 46 L 128 36" class="spout"/><path d="M176 44 q10 2 6 12" class="handle"/></g>
    <g class="drops"><circle cx="124" cy="46" r="2"/><circle cx="120" cy="56" r="2"/><circle cx="127" cy="62" r="2"/></g>
  </svg>`,
  biodiversity: `
  <svg viewBox="0 0 200 140" class="art art-bio" aria-hidden="true">
    <rect x="10" y="118" width="180" height="12" rx="6" class="soil"/>
    <path d="M52 118 V70" class="trunk"/>
    <circle cx="52" cy="58" r="30" class="canopy"/><circle cx="34" cy="70" r="16" class="canopy"/><circle cx="70" cy="72" r="16" class="canopy"/>
    <g class="flower"><path d="M150 118 V94" class="stem"/><circle cx="150" cy="90" r="6" class="petal"/><circle cx="150" cy="90" r="2.5" class="core"/></g>
    <g class="butterfly"><g class="wing wl"><path d="M120 50 C 104 36, 98 52, 112 58 C 102 64, 110 74, 120 60 Z"/></g><g class="wing wr"><path d="M120 50 C 136 36, 142 52, 128 58 C 138 64, 130 74, 120 60 Z"/></g><path d="M120 46 V64" class="body"/></g>
    <g class="lens"><circle cx="150" cy="40" r="14" class="glass"/><path d="M160 50 L 174 64" class="grip"/></g>
  </svg>`,
  maker: `
  <svg viewBox="0 0 200 140" class="art art-maker" aria-hidden="true">
    <rect x="10" y="118" width="180" height="12" rx="6" class="soil"/>
    <path d="M30 118 L 60 96 L 90 118 Z" class="base"/>
    <g class="arm"><path d="M60 96 L 112 70" class="beam"/><circle cx="114" cy="68" r="7" class="cup"/></g>
    <circle cx="60" cy="96" r="4" class="pivot"/>
    <g class="ball-x"><g class="ball-y"><circle cx="114" cy="68" r="5" class="ball"/></g></g>
    <g class="gear" transform="translate(160 54)"><path d="M-4 -22 h8 l2 6 6 3 6 -3 6 6 -3 6 3 6 6 2 v8 l-6 2 -3 6 3 6 -6 6 -6 -3 -6 3 -2 6 h-8 l-2 -6 -6 -3 -6 3 -6 -6 3 -6 -3 -6 -6 -2 v-8 l6 -2 3 -6 -3 -6 6 -6 6 3 6 -3 Z"/><circle r="6" class="hole"/></g>
  </svg>`,
  games: `
  <svg viewBox="0 0 200 140" class="art art-games" aria-hidden="true">
    <rect x="22" y="12" width="156" height="100" rx="12" class="screen"/>
    <rect x="30" y="20" width="140" height="84" rx="6" class="stage"/>
    <rect x="30" y="88" width="140" height="16" class="ground"/>
    <g class="coin c1"><circle cx="96" cy="44" r="5"/></g><g class="coin c2"><circle cx="122" cy="38" r="5"/></g><g class="coin c3"><circle cx="148" cy="46" r="5"/></g>
    <g class="sprite"><rect x="52" y="64" width="22" height="24" rx="7" class="bod"/><circle cx="59" cy="73" r="2"/><circle cx="67" cy="73" r="2"/><path d="M54 64 l3 -7 4 7 M64 64 l4 -7 3 7" class="ears"/></g>
    <g class="flag"><path d="M150 26 V12" class="pole"/><path d="M150 12 h12 l-4 4 4 4 h-12 Z"/></g>
    <rect x="86" y="116" width="28" height="14" rx="4" class="base"/>
    <g class="blocks"><rect x="8" y="118" width="22" height="9" rx="3" class="b1"/><rect x="170" y="118" width="22" height="9" rx="3" class="b2"/></g>
  </svg>`,
  museum: `
  <svg viewBox="0 0 200 140" class="art art-museum" aria-hidden="true">
    <path d="M24 46 L 100 12 L 176 46 Z" class="roof"/>
    <rect x="24" y="46" width="152" height="8" class="lintel"/>
    <g class="cols"><rect x="34" y="56" width="12" height="54"/><rect x="154" y="56" width="12" height="54"/></g>
    <rect x="18" y="110" width="164" height="10" rx="3" class="step"/>
    <path class="beam" d="M100 54 L 70 110 H 130 Z"/>
    <rect x="86" y="92" width="28" height="18" rx="2" class="plinth"/>
    <path d="M92 92 C 88 80, 92 70, 100 66 C 108 70, 112 80, 108 92 Z" class="vase"/>
    <path d="M94 80 h12" class="band"/>
    <g class="spark"><path d="M128 66 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z"/></g>
  </svg>`,
  cooking: `
  <svg viewBox="0 0 200 140" class="art art-cook" aria-hidden="true">
    <rect x="10" y="118" width="180" height="12" rx="6" class="soil"/>
    <path d="M40 80 h80 a40 34 0 0 1 -80 0 Z" class="bowl"/>
    <g class="whisk"><path d="M96 30 L 84 76" class="handle"/><ellipse cx="82" cy="80" rx="7" ry="12" transform="rotate(14 82 80)" class="loop"/></g>
    <g class="bits"><circle cx="58" cy="76" r="5" class="k1"/><circle cx="70" cy="72" r="4" class="k2"/><circle cx="104" cy="74" r="5" class="k3"/></g>
    <path d="M144 64 h28 l-4 54 h-20 Z" class="glass"/>
    <path d="M146 80 h24 l-3 36 h-18 Z" class="juice"/>
    <path d="M162 64 L 170 40" class="straw"/>
    <g class="fizz"><circle cx="154" cy="100" r="1.8"/><circle cx="160" cy="92" r="1.6"/><circle cx="156" cy="86" r="1.4"/></g>
  </svg>`,

  nursery: `
  <svg viewBox="0 0 200 140" class="art art-nursery" aria-hidden="true">
    <path d="M24 30 V112 M176 30 V112" class="pole"/>
    <path d="M18 30 Q100 14 182 30 L176 40 Q100 26 24 40 Z" class="net"/>
    <rect x="30" y="96" width="140" height="18" rx="4" class="tray"/>
    <g class="cells">${[0,1,2,3,4].map(i => `<rect x="${38 + i * 26}" y="100" width="20" height="10" rx="2"/>`).join('')}</g>
    ${[0,1,2,3,4].map(i => `<g class="seedling sd${i}"><path d="M${48 + i * 26} 100 V${84 - (i % 2) * 6}" class="stem"/><path d="M${48 + i * 26} ${88 - (i % 2) * 6} c-8 -4 -10 -10 -8 -13 c7 1 9 7 8 13 z" class="leaf"/><path d="M${48 + i * 26} ${86 - (i % 2) * 6} c8 -5 12 -8 14 -6 c-2 7 -8 8 -14 6 z" class="leaf"/></g>`).join('')}
    <rect x="10" y="114" width="180" height="12" rx="6" class="soil"/>
  </svg>`,
  habitat: `
  <svg viewBox="0 0 200 140" class="art art-habitat" aria-hidden="true">
    <rect x="10" y="118" width="180" height="12" rx="6" class="soil"/>
    <path d="M60 118 V64" class="post"/>
    <path d="M36 66 L60 44 L84 66 Z" class="roof"/><rect x="40" y="66" width="40" height="30" class="box"/><circle cx="60" cy="80" r="6" class="hole"/>
    <g class="bird"><ellipse cx="102" cy="58" rx="12" ry="8" class="bbody"/><circle cx="112" cy="52" r="6" class="bbody"/><path d="M117 52 l6 2 -6 2 z" class="beak"/><circle cx="113" cy="51" r="1.4" class="eye"/></g>
    <g class="flower"><path d="M150 118 V90" class="stem"/><circle cx="150" cy="86" r="8" class="petal"/><circle cx="150" cy="86" r="3" class="core"/></g>
    <g class="bee"><ellipse cx="0" cy="0" rx="7" ry="5" class="bee-b"/><path d="M-2 -5 V5 M2 -5 V5" class="stripe"/><ellipse cx="-2" cy="-7" rx="4" ry="3" class="wing"/><ellipse cx="3" cy="-7" rx="4" ry="3" class="wing"/></g>
    <path d="M120 118 q10 -14 20 0" class="bath"/>
  </svg>`,
  tiedye: `
  <svg viewBox="0 0 200 140" class="art art-tiedye" aria-hidden="true">
    <path d="M60 24 L84 16 Q100 26 116 16 L140 24 L156 50 L138 58 V124 H62 V58 L44 50 Z" class="shirt"/>
    <g class="swirl"><circle cx="100" cy="78" r="30" class="r1"/><circle cx="100" cy="78" r="21" class="r2"/><circle cx="100" cy="78" r="12" class="r3"/><circle cx="100" cy="78" r="4" class="r4"/></g>
    <g class="dots">${[[74,40],[126,40],[70,112],[130,112],[84,104],[116,52]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
    <g class="knot"><path d="M164 90 q10 -10 18 0 q-8 10 -18 0 z"/><path d="M182 90 l10 -6 M182 90 l10 6" class="thread"/></g>
  </svg>`,
  ai: `
  <svg viewBox="0 0 200 140" class="art art-ai" aria-hidden="true">
    <rect x="20" y="16" width="110" height="84" rx="10" class="screen"/>
    <rect x="28" y="24" width="94" height="68" rx="5" class="photo"/>
    <path d="M60 80 C 50 64, 58 44, 76 42 C 92 44, 98 62, 88 78 C 80 88, 66 88, 60 80 Z" class="mango"/>
    <path d="M76 42 q4 -8 10 -8" class="mstem"/>
    <rect x="28" y="24" width="94" height="4" class="scan"/>
    <rect x="58" y="104" width="34" height="10" rx="3" class="base"/>
    <g class="labels"><rect x="140" y="26" width="48" height="12" rx="6" class="l1"/><rect x="140" y="46" width="34" height="12" rx="6" class="l2"/><rect x="140" y="66" width="22" height="12" rx="6" class="l3"/></g>
    <g class="nodes"><circle cx="148" cy="100" r="5"/><circle cx="168" cy="92" r="5"/><circle cx="184" cy="108" r="5"/><path d="M148 100 L168 92 L184 108 L148 100" class="link"/></g>
  </svg>`,
  puppets: `
  <svg viewBox="0 0 200 140" class="art art-puppets" aria-hidden="true">
    <rect x="16" y="14" width="168" height="10" rx="3" class="rod"/>
    <path d="M18 24 Q38 70 30 112 L18 112 Z" class="curtain"/><path d="M182 24 Q162 70 170 112 L182 112 Z" class="curtain"/>
    <path class="spot" d="M100 24 L 64 112 H 136 Z"/>
    <rect x="16" y="104" width="168" height="22" rx="4" class="stage"/>
    <g class="sock"><path d="M86 104 V70 Q86 52 104 52 Q122 52 122 70 V104 Z" class="sockb"/><circle cx="98" cy="66" r="4" class="eye"/><circle cx="112" cy="66" r="4" class="eye"/><circle cx="98" cy="66" r="1.6" class="pupil"/><circle cx="112" cy="66" r="1.6" class="pupil"/><path d="M96 80 q9 8 18 0" class="mouth"/></g>
    <g class="strings"><path d="M52 24 V60 M68 24 V54" class="str"/><circle cx="60" cy="66" r="9" class="mhead"/><path d="M52 76 h16 l-2 20 h-12 z" class="mbody"/></g>
  </svg>`,
  health: `
  <svg viewBox="0 0 200 140" class="art art-health" aria-hidden="true">
    <rect x="22" y="56" width="76" height="56" rx="8" class="kit"/><rect x="48" y="46" width="24" height="12" rx="4" class="handle"/>
    <path d="M60 70 v20 M50 80 h20" class="cross"/>
    <g class="heart"><path d="M150 96 C 120 76, 122 48, 140 46 C 146 46, 150 50, 150 54 C 150 50, 154 46, 160 46 C 178 48, 180 76, 150 96 Z"/></g>
    <path d="M10 124 H60 L68 112 L76 132 L86 104 L94 124 H190" class="ecg"/>
  </svg>`,
  hydro: `
  <svg viewBox="0 0 200 140" class="art art-hydro" aria-hidden="true">
    <path d="M54 50 H106 V120 a6 6 0 0 1 -6 6 H60 a6 6 0 0 1 -6 -6 Z" class="bottle"/>
    <path d="M58 80 H102 V118 a4 4 0 0 1 -4 4 H62 a4 4 0 0 1 -4 -4 Z" class="water"/>
    <path d="M60 50 L80 64 L100 50" class="neck"/>
    <path d="M80 64 V104 M80 84 l-8 14 M80 88 l8 16 M80 96 l-5 14" class="roots"/>
    <g class="plant"><path d="M80 64 V34" class="stem"/><path d="M80 44 c-12 -4 -16 -14 -14 -18 c10 1 14 9 14 18 z" class="leaf"/><path d="M80 40 c12 -8 18 -12 20 -9 c-3 10 -11 12 -20 9 z" class="leaf"/></g>
    <g class="bub"><circle cx="66" cy="114" r="2.4"/><circle cx="94" cy="110" r="2"/><circle cx="72" cy="104" r="1.6"/><circle cx="90" cy="118" r="1.8"/></g>
    <g class="ph"><rect x="132" y="40" width="14" height="70" rx="3" class="strip"/><rect x="132" y="88" width="14" height="22" rx="3" class="tip"/></g>
    <text x="150" y="36" class="phlbl">pH 6.5</text>
  </svg>`,
  animals: `
  <svg viewBox="0 0 200 140" class="art art-animals" aria-hidden="true">
    <rect x="10" y="118" width="180" height="12" rx="6" class="soil"/>
    <g class="cow"><rect x="52" y="64" width="80" height="40" rx="18" class="cbody"/><circle cx="76" cy="80" r="8" class="spot"/><circle cx="110" cy="92" r="6" class="spot"/>
      <path d="M62 102 V118 M74 102 V118 M112 102 V118 M124 102 V118" class="leg"/>
      <g class="chead"><rect x="124" y="50" width="30" height="30" rx="10" class="cbody"/><rect x="132" y="70" width="22" height="12" rx="6" class="snout"/><circle cx="134" cy="60" r="2.4" class="eye"/><path d="M128 50 l-6 -8 M150 50 l6 -8" class="horn"/></g>
      <path d="M52 76 q-12 6 -10 22" class="tail"/></g>
    <g class="tape"><path d="M60 64 Q92 40 126 62" class="tapeline"/><rect x="20" y="40" width="22" height="16" rx="4" class="tapebox"/></g>
    <g class="grass"><path d="M160 118 l4 -14 4 14 M168 118 l5 -18 4 18 M176 118 l3 -12 4 12"/></g>
  </svg>`,
  wood: `
  <svg viewBox="0 0 200 140" class="art art-wood" aria-hidden="true">
    <rect x="18" y="96" width="164" height="12" rx="3" class="bench"/><path d="M30 108 V126 M170 108 V126" class="legs"/>
    <rect x="34" y="76" width="132" height="20" rx="3" class="plank"/>
    <path d="M44 86 h40 M96 82 h50 M70 90 h60" class="grain"/>
    <path d="M118 76 V96" class="cut"/>
    <g class="saw"><path d="M100 20 L156 72 L148 78 L94 28 Z" class="blade"/><path d="M94 28 l-14 -14 14 -6 10 12 z" class="shandle"/></g>
    <g class="dust"><circle cx="122" cy="98" r="1.6"/><circle cx="126" cy="102" r="1.3"/><circle cx="116" cy="101" r="1.4"/></g>
    <g class="bamboo"><rect x="14" y="30" width="10" height="66" rx="5"/><path d="M14 50 h10 M14 70 h10" class="node"/></g>
  </svg>`,
  automation: `
  <svg viewBox="0 0 200 140" class="art art-auto" aria-hidden="true">
    <rect x="20" y="62" width="96" height="58" rx="6" class="board"/>
    <rect x="52" y="80" width="34" height="20" rx="2" class="chip"/>
    <g class="pins">${[0,1,2,3,4,5,6,7].map(i => `<rect x="${28 + i * 10}" y="66" width="5" height="6"/>`).join('')}</g>
    <path d="M100 74 C 130 74, 130 40, 150 40" class="wire w1"/><path d="M100 110 C 140 110, 140 100, 160 100" class="wire w2"/>
    <g class="pir"><rect x="146" y="28" width="22" height="22" rx="4" class="pirbox"/><circle cx="157" cy="39" r="7" class="dome"/></g>
    <g class="waves"><path d="M174 30 q6 9 0 18" /><path d="M180 26 q9 13 0 26"/></g>
    <g class="led"><circle cx="164" cy="96" r="9" class="ledbulb"/><path d="M160 104 V116 M168 104 V112" class="leg"/></g>
    <circle cx="164" cy="96" r="18" class="glow"/>
  </svg>`,
  water: `
  <svg viewBox="0 0 200 140" class="art art-water" aria-hidden="true">
    <path d="M30 30 H80 a10 10 0 0 1 10 10 V50 H74 V44 H30 Z" class="tap"/><rect x="44" y="22" width="18" height="8" rx="3" class="knob"/>
    <g class="drop d1"><path d="M82 58 q-5 8 0 12 q5 -4 0 -12 z"/></g><g class="drop d2"><path d="M82 58 q-5 8 0 12 q5 -4 0 -12 z"/></g>
    <path d="M60 80 H104 L98 126 H66 Z" class="jar"/>
    <path class="fill" d="M64 104 H100 L98 126 H66 Z"/>
    <path d="M70 92 h6 M70 104 h6 M70 116 h6" class="tick"/>
    <g class="gauge"><circle cx="154" cy="70" r="30" class="dial"/><path d="M154 70 L154 46" class="needle"/><circle cx="154" cy="70" r="4" class="hub"/></g>
  </svg>`,
  ads: `
  <svg viewBox="0 0 200 140" class="art art-ads" aria-hidden="true">
    <rect x="30" y="18" width="120" height="70" rx="6" class="board"/>
    <path d="M86 88 V122 M94 88 V122" class="post"/>
    <g class="burst"><path d="M62 52 l6 -16 6 16 16 -6 -10 14 14 8 -16 2 2 16 -12 -10 -12 10 2 -16 -16 -2 14 -8 -10 -14 z"/></g>
    <rect x="96" y="36" width="44" height="8" rx="4" class="line l1"/><rect x="96" y="52" width="34" height="8" rx="4" class="line l2"/><rect x="96" y="68" width="24" height="10" rx="5" class="cta"/>
    <g class="mega"><path d="M150 96 L178 84 V120 L150 108 Z" class="horn"/><rect x="140" y="96" width="12" height="12" rx="2" class="mouth"/></g>
    <g class="sound"><path d="M184 92 q6 10 0 20"/><path d="M190 86 q10 16 0 32"/></g>
  </svg>`,
};

export const art = key => ART[key] || '';

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
