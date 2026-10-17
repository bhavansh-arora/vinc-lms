// Animated SVG illustrations for each Grade 6 project, plus small icons.
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
    <circle cx="114" cy="68" r="5" class="ball"/>
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
