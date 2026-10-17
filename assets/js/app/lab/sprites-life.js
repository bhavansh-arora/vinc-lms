// Life sprites for the virtual labs: plants, food plants, nature, insects, birds, animals, garden
// and farm materials. Each value is SVG markup for a 100x100 viewBox (no outer <svg>); ids inside a
// sprite are prefixed with its name so many sprites can share one page.
export const SPRITES = {
  // ---- fruits -------------------------------------------------------------------------------
  'tomato': `<defs><radialGradient id="tomato-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF8466"/><stop offset=".55" stop-color="#E53B2A"/><stop offset="1" stop-color="#B01F17"/></radialGradient></defs>
  <ellipse cx="50" cy="90" rx="30" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M50 29c-21 0-37 12-37 31 0 17 16 29 37 29s37-12 37-29c0-19-16-31-37-31z" fill="url(#tomato-g)"/>
  <path d="M33 34q-6 8-3 16M67 34q6 8 3 16" stroke="#A81E16" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>
  <ellipse cx="31" cy="50" rx="5" ry="9" fill="#fff" opacity=".4" transform="rotate(30 31 50)"/>
  <path d="M50 35c-5 0-12 2-17-2 4-2 9-3 12-2-2-3-5-6-5-10 4 1 8 5 10 8 2-3 6-7 10-8 0 4-3 7-5 10 3-1 8 0 12 2-5 4-12 2-17 2z" fill="#3E9B3A"/>
  <path d="M50 30q0-8 5-12" stroke="#2F7A26" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

  'apple': `<defs><radialGradient id="apple-g" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#FF7C6B"/><stop offset=".6" stop-color="#E0323B"/><stop offset="1" stop-color="#A81A2A"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="27" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M50 33c-6-5-14-6-21-3-12 5-15 20-12 33 4 14 13 25 24 25 4 0 6-2 9-2s5 2 9 2c11 0 20-11 24-25 3-13 0-28-12-33-7-3-15-2-21 3z" fill="url(#apple-g)"/>
  <ellipse cx="32" cy="50" rx="5" ry="10" fill="#fff" opacity=".38" transform="rotate(20 32 50)"/>
  <path d="M50 34q0-11 5-17" stroke="#6B3E1E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M54 25c5-8 15-10 22-7-4 8-14 11-22 7z" fill="#4FAA3A"/><path d="M55 24q9-4 18-5" stroke="#2F7A26" stroke-width="1.2" fill="none"/>`,

  'orange': `<defs><radialGradient id="orange-g" cx=".35" cy=".32" r=".8"><stop offset="0" stop-color="#FFC266"/><stop offset=".6" stop-color="#F68A1E"/><stop offset="1" stop-color="#D2650E"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="28" ry="4.5" fill="#000" opacity=".12"/>
  <circle cx="50" cy="58" r="32" fill="url(#orange-g)"/>
  <g fill="#C45A0A" opacity=".35"><circle cx="40" cy="70" r="1.2"/><circle cx="60" cy="76" r="1.2"/><circle cx="70" cy="60" r="1.2"/><circle cx="55" cy="64" r="1.2"/><circle cx="66" cy="45" r="1.2"/><circle cx="30" cy="62" r="1.2"/></g>
  <ellipse cx="36" cy="45" rx="6" ry="9" fill="#fff" opacity=".4" transform="rotate(35 36 45)"/>
  <circle cx="50" cy="28" r="3" fill="#6E7A2A"/>
  <path d="M51 27c3-9 14-13 23-10-3 9-14 13-23 10z" fill="#3E9B3A"/>`,

  'lemon': `<defs><radialGradient id="lemon-g" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFF38A"/><stop offset=".6" stop-color="#F7D72A"/><stop offset="1" stop-color="#D9AE0A"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="32" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M12 58c4-2 7-4 9-9 5-11 16-17 29-17s24 6 29 17c2 5 5 7 9 9-4 2-7 4-9 9-5 11-16 17-29 17s-24-6-29-17c-2-5-5-7-9-9z" fill="url(#lemon-g)"/>
  <ellipse cx="38" cy="46" rx="11" ry="4.5" fill="#fff" opacity=".5" transform="rotate(-12 38 46)"/>
  <path d="M52 33c2-9 12-14 21-12-2 9-12 14-21 12z" fill="#4FAA3A"/>`,

  'mango': `<defs><linearGradient id="mango-g" x1=".85" y1=".1" x2=".2" y2=".95"><stop offset="0" stop-color="#E8462A"/><stop offset=".35" stop-color="#FF8A2A"/><stop offset=".75" stop-color="#FFC531"/><stop offset="1" stop-color="#F2B01E"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="28" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M44 17c18-2 34 12 35 32 1 22-13 40-31 40-12 0-22-6-25-15-1-5 2-8 5-12 3-5 2-10 1-16-2-14 3-27 15-29z" fill="url(#mango-g)"/>
  
  <ellipse cx="38" cy="40" rx="4.5" ry="10" fill="#fff" opacity=".4" transform="rotate(10 38 40)"/>
  <path d="M47 18q-2-6 1-10" stroke="#6B3E1E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M48 11c8-6 20-5 26 1-8 6-19 5-26-1z" fill="#3E9B3A"/><path d="M49 11q12 0 23 1" stroke="#2F7A26" stroke-width="1.2" fill="none"/>`,

  'unripe-mango': `<defs><linearGradient id="unripe-mango-g" x1=".85" y1=".1" x2=".2" y2=".95"><stop offset="0" stop-color="#3E8E2A"/><stop offset=".55" stop-color="#6DB83A"/><stop offset="1" stop-color="#A6D65A"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="28" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M44 17c18-2 34 12 35 32 1 22-13 40-31 40-12 0-22-6-25-15-1-5 2-8 5-12 3-5 2-10 1-16-2-14 3-27 15-29z" fill="url(#unripe-mango-g)"/>
  <g fill="#E4F5B8" opacity=".55"><circle cx="58" cy="42" r="1.2"/><circle cx="66" cy="58" r="1.2"/><circle cx="50" cy="66" r="1.2"/><circle cx="42" cy="78" r="1.2"/><circle cx="62" cy="74" r="1.2"/></g>
  <ellipse cx="38" cy="40" rx="4.5" ry="10" fill="#fff" opacity=".35" transform="rotate(10 38 40)"/>
  <path d="M47 18q-2-6 1-10" stroke="#6B3E1E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M48 11c8-6 20-5 26 1-8 6-19 5-26-1z" fill="#2F8A2E"/><path d="M49 11q12 0 23 1" stroke="#1F6A20" stroke-width="1.2" fill="none"/>`,

  'banana': `<defs><linearGradient id="banana-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE36B"/><stop offset="1" stop-color="#F1B81C"/></linearGradient></defs>
  <ellipse cx="54" cy="88" rx="30" ry="4" fill="#000" opacity=".12"/>
  <path d="M20 28c-2 26 18 48 50 50 8 0 13-2 13-5 0-2-3-3-8-3-26-2-42-18-46-40-1-4-9-5-9-2z" fill="#E7A817"/>
  <path d="M16 36c2 26 22 44 52 44 8 0 12-2 12-5 0-2-4-3-9-3-24-1-40-14-46-34-2-5-9-6-9-2z" fill="url(#banana-g)"/>
  <path d="M24 44q10 22 40 28" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55" stroke-linecap="round"/>
  <path d="M15 37l1-12c0-3 6-3 6 0l2 9z" fill="#6E8A2A"/><path d="M80 75q3 0 4-1 0 3-2 4z" fill="#5A3A1A"/>`,

  'grapes': `<defs><radialGradient id="grapes-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#C78BEA"/><stop offset=".6" stop-color="#8E44BF"/><stop offset="1" stop-color="#5E2687"/></radialGradient></defs>
  <path d="M50 30q0-10 4-16" stroke="#6B3E1E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M53 19c6-7 18-8 25-3-6 7-18 8-25 3z" fill="#4FAA3A"/>
  <g fill="url(#grapes-g)"><circle cx="25" cy="36" r="9.5"/><circle cx="42" cy="34" r="9.5"/><circle cx="59" cy="34" r="9.5"/><circle cx="76" cy="36" r="9.5"/><circle cx="33" cy="51" r="9.5"/><circle cx="50" cy="50" r="9.5"/><circle cx="67" cy="51" r="9.5"/><circle cx="41" cy="66" r="9.5"/><circle cx="59" cy="66" r="9.5"/><circle cx="50" cy="81" r="9.5"/></g>
  <g fill="#fff" opacity=".5"><circle cx="22" cy="33" r="2.4"/><circle cx="39" cy="31" r="2.4"/><circle cx="56" cy="31" r="2.4"/><circle cx="73" cy="33" r="2.4"/><circle cx="30" cy="48" r="2.4"/><circle cx="47" cy="47" r="2.4"/><circle cx="64" cy="48" r="2.4"/><circle cx="38" cy="63" r="2.4"/><circle cx="56" cy="63" r="2.4"/><circle cx="47" cy="78" r="2.4"/></g>`,

  'papaya': `<defs><linearGradient id="papaya-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BCB45"/><stop offset=".6" stop-color="#E8C23A"/><stop offset="1" stop-color="#F09A2A"/></linearGradient><radialGradient id="papaya-f" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#FF9A4A"/><stop offset="1" stop-color="#F26A2A"/></radialGradient></defs>
  <ellipse cx="50" cy="92" rx="26" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M50 10c-13 0-19 15-21 30-3 19-7 31 4 42 7 7 27 7 34 0 11-11 7-23 4-42-2-15-8-30-21-30z" fill="url(#papaya-g)"/>
  <path d="M50 16c-10 0-15 13-17 26-2 17-5 27 3 36 6 5 22 5 28 0 8-9 5-19 3-36-2-13-7-26-17-26z" fill="url(#papaya-f)"/>
  <path d="M50 38c-6 0-9 8-9 18s3 18 9 18 9-8 9-18-3-18-9-18z" fill="#FFC27A"/>
  <g fill="#2B1A10"><circle cx="47" cy="46" r="2.3"/><circle cx="53" cy="48" r="2.3"/><circle cx="46" cy="54" r="2.3"/><circle cx="52" cy="56" r="2.3"/><circle cx="47" cy="62" r="2.3"/><circle cx="53" cy="64" r="2.3"/><circle cx="50" cy="69" r="2.1"/><circle cx="50" cy="42" r="2"/></g>
  <path d="M50 10q0-5 3-7" stroke="#6B8A2A" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  'coconut': `<defs><radialGradient id="coconut-g" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#C08850"/><stop offset=".6" stop-color="#8E5A2C"/><stop offset="1" stop-color="#6A4020"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="32" ry="4.5" fill="#000" opacity=".12"/>
  <circle cx="44" cy="54" r="31" fill="url(#coconut-g)"/>
  <path d="M24 42q6-4 9 2M30 66q5-4 8 1M50 74q5-3 8 2M58 30q5-2 7 3M22 56q4-3 7 1" stroke="#5A361A" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
  <g fill="#3E2412"><circle cx="40" cy="30" r="3"/><circle cx="49" cy="30" r="3"/><circle cx="44.5" cy="37" r="3"/></g>
  <ellipse cx="31" cy="44" rx="5" ry="8" fill="#fff" opacity=".2" transform="rotate(30 31 44)"/>
  <path d="M56 74a17 17 0 0 0 34 0z" fill="#8E5A2C"/><ellipse cx="73" cy="74" rx="17" ry="5.5" fill="#FFFDF6"/><ellipse cx="73" cy="74.5" rx="12" ry="3.5" fill="#EFE6D4"/><path d="M60 80q6 6 14 6" stroke="#B88250" stroke-width="2" fill="none" stroke-linecap="round"/>`,

  'cucumber': `<defs><linearGradient id="cucumber-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7BC24A"/><stop offset=".5" stop-color="#3E9A32"/><stop offset="1" stop-color="#2A7428"/></linearGradient></defs>
  <ellipse cx="50" cy="86" rx="34" ry="4" fill="#000" opacity=".12"/>
  <g transform="rotate(-28 50 52)"><rect x="12" y="40" width="76" height="24" rx="12" fill="url(#cucumber-g)"/>
  <path d="M22 47h56M24 57h52" stroke="#B7E28A" stroke-width="2" stroke-dasharray="6 6" opacity=".55" stroke-linecap="round"/>
  <path d="M22 45q20-3 50 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".35" stroke-linecap="round"/>
  <circle cx="88" cy="52" r="3.5" fill="#F5C842"/><rect x="7" y="49" width="7" height="6" rx="2" fill="#5E7A22"/></g>`,

  // ---- vegetables & herbs ---------------------------------------------------------------------
  'brinjal': `<defs><radialGradient id="brinjal-g" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#B57BE0"/><stop offset=".5" stop-color="#7A35A8"/><stop offset="1" stop-color="#55207A"/></radialGradient></defs>
  <ellipse cx="46" cy="91" rx="28" ry="4" fill="#000" opacity=".12"/>
  <path d="M42 34c-15 6-24 22-22 37 2 11 11 18 23 17 16-2 27-13 32-28 4-12 2-22-6-28-8-6-18-4-27 2z" fill="url(#brinjal-g)"/>
  <ellipse cx="34" cy="62" rx="4.5" ry="11" fill="#fff" opacity=".35" transform="rotate(35 34 62)"/>
  <path d="M42 36c3-8 14-13 25-11 5 1 7 4 5 8-1 3-4 4-2 8 1 4-3 5-6 3-3-1-4 2-8 1-3-1-2-5-6-5-4 0-9 0-8-4z" fill="#4E9A35"/>
  <path d="M66 28q5-9 14-12" stroke="#5E8A2A" stroke-width="5" fill="none" stroke-linecap="round"/>`,

  'okra': `<defs><linearGradient id="okra-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A2D96A"/><stop offset="1" stop-color="#4E9A32"/></linearGradient><g id="okra-p"><path d="M-14 0c9-4 19-4 28 0 2 24-4 48-13 68-1 2-2 2-3 0C-11 48-16 24-14 0z" fill="url(#okra-g)"/><path d="M-6 2c0 22 2 44 5 64M6 2c0 22-1 44-4 64" stroke="#3B7E26" stroke-width="1.6" fill="none" opacity=".7"/><path d="M-10 4q0 24 6 46" stroke="#fff" stroke-width="2.4" fill="none" opacity=".4" stroke-linecap="round"/><path d="M-16 2c-2-6 4-10 8-8 2-4 14-4 16 0 4-2 10 2 8 8-6 3-26 3-32 0z" fill="#3B7A26"/><path d="M0 -6v-8" stroke="#5E8A2A" stroke-width="4" stroke-linecap="round"/></g></defs>
  <ellipse cx="52" cy="90" rx="32" ry="4" fill="#000" opacity=".12"/>
  <use href="#okra-p" transform="translate(36 22) rotate(-18)"/><use href="#okra-p" transform="translate(60 18) rotate(-34)"/>`,

  'chilli': `<defs><linearGradient id="chilli-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5A3C"/><stop offset="1" stop-color="#C41E14"/></linearGradient><linearGradient id="chilli-h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7CC84A"/><stop offset="1" stop-color="#2F8A2A"/></linearGradient></defs>
  <ellipse cx="54" cy="90" rx="30" ry="4" fill="#000" opacity=".12"/>
  <path d="M46 22c-4 6-2 14 4 21 9 11 18 20 32 26 3 1 4-2 2-3-11-8-18-18-23-30-3-7-6-12-11-14-2-1-3-1-4 0z" fill="url(#chilli-h)"/>
  <path d="M42 22c-1-4 2-7 6-7 3 0 6 2 6 5-4 0-5 1-7 3-2-1-3-1-5-1z" fill="#2F6A20"/><path d="M47 16q1-6 6-9" stroke="#3E7A26" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M26 36c-5 7-3 16 3 25 10 13 23 24 42 30 4 1 5-2 2-4-14-10-24-21-30-36-3-8-6-13-12-15-2 0-4 0-5 0z" fill="url(#chilli-g)"/>
  <path d="M28 44q4 14 18 28" stroke="#fff" stroke-width="2.5" fill="none" opacity=".45" stroke-linecap="round"/>
  <path d="M21 38c-2-6 2-10 8-10 5 0 8 3 8 8-4-1-6 1-8 3-3-2-5-2-8-1z" fill="#3E8E2A"/><path d="M28 29q1-8 7-12" stroke="#3E7A26" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

  'carrot': `<defs><linearGradient id="carrot-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB050"/><stop offset=".6" stop-color="#F57A1A"/><stop offset="1" stop-color="#D9600E"/></linearGradient></defs>
  <ellipse cx="50" cy="92" rx="22" ry="3.5" fill="#000" opacity=".12"/>
  <g transform="rotate(18 50 60)"><path d="M50 36c-4-10-12-20-22-24 0 10 8 20 20 26zM50 36c-1-12 1-24 6-32 5 10 3 22-3 32zM50 36c6-8 15-14 25-14-3 10-13 15-24 16z" fill="#4FAA3A"/>
  <path d="M35 38c9-5 21-5 30 0 2 15-6 38-13 54-1 2-3 2-4 0-7-16-15-39-13-54z" fill="url(#carrot-g)"/>
  <path d="M39 50h7M54 58h7M41 66h6M53 74h5M46 82h4" stroke="#C9560A" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>
  <path d="M40 42q0 14 6 32" stroke="#fff" stroke-width="2.5" fill="none" opacity=".4" stroke-linecap="round"/></g>`,

  'radish': `<defs><linearGradient id="radish-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F3EEE4"/><stop offset="1" stop-color="#D8CCBA"/></linearGradient></defs>
  <ellipse cx="50" cy="93" rx="20" ry="3.5" fill="#000" opacity=".12"/>
  <path d="M48 36C38 28 26 24 18 26c2 10 14 16 28 14zM50 36c-4-12-2-24 4-32 7 8 6 22-2 32zM52 36c8-10 18-14 28-12-2 10-14 16-26 14z" fill="#3E9B3A"/>
  <path d="M48 36c-6-6-14-9-22-9M52 34c0-10 1-18 2-24M53 36c8-6 15-8 22-8" stroke="#2A7428" stroke-width="1.5" fill="none"/>
  <path d="M40 38c6-3 14-3 20 0 3 14 0 34-8 52-1 2-3 2-4 0-8-18-11-38-8-52z" fill="url(#radish-g)" stroke="#B9A88E" stroke-width="1.5"/>
  <path d="M41 39c6-2 12-2 18 0l-1 6c-5-2-11-2-16 0z" fill="#B7DC7A"/>
  <path d="M50 90v5" stroke="#B9A88E" stroke-width="1.5" stroke-linecap="round"/><path d="M45 52q1 12 4 22" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,

  'onion': `<defs><radialGradient id="onion-g" cx=".38" cy=".4" r=".75"><stop offset="0" stop-color="#F2A2BE"/><stop offset=".55" stop-color="#C8507A"/><stop offset="1" stop-color="#93294F"/></radialGradient></defs>
  <ellipse cx="50" cy="92" rx="28" ry="4" fill="#000" opacity=".12"/>
  <path d="M46 28c-1-6 1-11 4-16 3 5 5 10 4 16z" fill="#C9A36A"/>
  <path d="M50 26c-4 8-12 12-20 18-8 6-12 14-10 24 3 12 15 20 30 20s27-8 30-20c2-10-2-18-10-24-8-6-16-10-20-18z" fill="url(#onion-g)"/>
  <path d="M44 34q-14 20-6 50M56 34q14 20 6 50M50 32v54" stroke="#7E1F43" stroke-width="1.5" fill="none" opacity=".4"/>
  <ellipse cx="34" cy="56" rx="4.5" ry="9" fill="#fff" opacity=".4" transform="rotate(25 34 56)"/>
  <path d="M46 88l-2 4M50 88v5M54 88l2 4" stroke="#B89A72" stroke-width="1.8" stroke-linecap="round"/>`,

  'potato': `<defs><radialGradient id="potato-g" cx=".38" cy=".35" r=".8"><stop offset="0" stop-color="#F0C988"/><stop offset=".6" stop-color="#D3A055"/><stop offset="1" stop-color="#A9742F"/></radialGradient></defs>
  <ellipse cx="52" cy="88" rx="34" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M20 46c5-13 19-17 34-15 17 2 29 11 29 26 0 15-13 27-32 27-19 0-35-8-35-21 0-7 2-11 4-17z" fill="url(#potato-g)"/>
  <g stroke="#8A5A22" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"><path d="M34 47q3 2 6 0M60 44q3 2 6 0M47 64q3 2 6 0M70 66q2 2 5 0M28 66q2 2 5 0"/></g>
  <g fill="#9A6A2A" opacity=".35"><circle cx="40" cy="56" r="1.2"/><circle cx="58" cy="56" r="1.2"/><circle cx="52" cy="74" r="1.2"/><circle cx="66" cy="76" r="1.2"/></g>
  <ellipse cx="34" cy="40" rx="8" ry="4" fill="#fff" opacity=".35" transform="rotate(-20 34 40)"/>`,

  'garlic': `<defs><radialGradient id="garlic-g" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F3EADC"/><stop offset="1" stop-color="#D7C6AE"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="26" ry="4" fill="#000" opacity=".12"/>
  <path d="M47 28l1-16h4l1 16z" fill="#D9C7A6" stroke="#B9A07C" stroke-width="1.2"/>
  <path d="M50 24c-2 8-8 12-16 18-8 6-12 14-10 24 2 12 12 20 26 20s24-8 26-20c2-10-2-18-10-24-8-6-14-10-16-18z" fill="url(#garlic-g)" stroke="#B9A07C" stroke-width="1.5"/>
  <path d="M50 38v46M40 44q-8 18 0 38M60 44q8 18 0 38" stroke="#C7A0B8" stroke-width="1.6" fill="none"/>
  <ellipse cx="36" cy="58" rx="3.5" ry="8" fill="#fff" opacity=".9" transform="rotate(20 36 58)"/>
  <path d="M45 86l-2 4M50 86v5M55 86l2 4" stroke="#B9A07C" stroke-width="1.6" stroke-linecap="round"/>`,

  'ginger': `<defs><linearGradient id="ginger-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0CB8A"/><stop offset="1" stop-color="#C08A42"/></linearGradient></defs>
  <ellipse cx="50" cy="84" rx="38" ry="4" fill="#000" opacity=".12"/>
  <path d="M12 64c0-8 8-12 16-10 1-9 10-14 18-10 3-10 14-14 20-6 6-6 17-2 16 7 7 2 8 12 1 14-3 7-13 8-19 5-6 7-19 7-26 2-9 5-26 4-26-2z" fill="url(#ginger-g)"/>
  <path d="M30 56q3 6 0 12M48 50q3 8 0 16M66 48q3 6 1 12M20 62q2 3 0 6" stroke="#9E6A2A" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>
  <ellipse cx="80" cy="66" rx="5" ry="4" fill="#F7E2A2" stroke="#C08A42" stroke-width="1.2"/>
  <path d="M30 51q8-4 14-2M56 42q6-4 10-2" stroke="#fff" stroke-width="2.2" fill="none" opacity=".45" stroke-linecap="round"/>`,

  'beans': `<defs><linearGradient id="beans-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FD05A"/><stop offset="1" stop-color="#3E9030"/></linearGradient></defs>
  <ellipse cx="52" cy="88" rx="32" ry="4" fill="#000" opacity=".12"/>
  <g id="beans-p" fill="url(#beans-g)"><path d="M16 22c6 0 10 6 16 16 10 17 22 32 46 44 3 2 2 5-1 5-26-4-42-22-54-42-4-7-9-13-10-18 0-3 1-5 3-5z"/><path d="M20 30q14 28 50 52" stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/></g>
  <use href="#beans-p" transform="translate(14 -8)"/><use href="#beans-p" transform="translate(-6 8)"/>
  <path d="M14 22l-4-6M8 30l-5-4M28 14l-3-6" stroke="#4E8A2A" stroke-width="2.5" stroke-linecap="round"/>`,

  'peas': `<defs><radialGradient id="peas-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#C2EC7A"/><stop offset="1" stop-color="#5BAA32"/></radialGradient></defs>
  <ellipse cx="50" cy="80" rx="38" ry="4" fill="#000" opacity=".12"/>
  <path d="M10 50c18-12 58-14 80 0 2 2 0 5-2 6-22 18-58 18-76 2-3-2-4-6-2-8z" fill="#3E8E2A"/>
  <path d="M14 50c18-6 52-6 72 0-20 12-52 12-72 0z" fill="#9CD45E"/>
  <g fill="url(#peas-g)"><circle cx="24" cy="51" r="7"/><circle cx="38" cy="50" r="7.5"/><circle cx="52" cy="50" r="7.5"/><circle cx="66" cy="50" r="7.5"/><circle cx="78" cy="51" r="6.5"/></g>
  <g fill="#fff" opacity=".6"><circle cx="22" cy="48" r="1.8"/><circle cx="36" cy="47" r="1.8"/><circle cx="50" cy="47" r="1.8"/><circle cx="64" cy="47" r="1.8"/><circle cx="76" cy="48" r="1.6"/></g>
  <path d="M12 58c22 14 56 14 76-2" stroke="#2F7A26" stroke-width="1.5" fill="none"/>
  <path d="M10 50q-6-2-6-10" stroke="#4E8A2A" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  'cabbage': `<defs><radialGradient id="cabbage-g" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#E2F5BE"/><stop offset=".6" stop-color="#A9D97A"/><stop offset="1" stop-color="#6FAE4A"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="34" ry="4.5" fill="#000" opacity=".12"/>
  <path d="M14 58c-4-18 10-30 20-30-10 10-12 24-6 38 4 10 12 16 22 20-20 2-34-10-36-28zM86 58c4-18-10-30-20-30 10 10 12 24 6 38-4 10-12 16-22 20 20 2 34-10 36-28z" fill="#5E9E3E"/>
  <circle cx="50" cy="58" r="29" fill="url(#cabbage-g)"/>
  <path d="M50 86c-8-14-10-30-4-46M50 86c10-12 16-28 12-44M50 86c-14-6-22-18-22-32M50 86c14-6 22-18 22-30" stroke="#F4FBE6" stroke-width="2" fill="none" opacity=".8" stroke-linecap="round"/>
  <path d="M30 48c6-12 22-18 36-12" stroke="#7EBB55" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,

  'lettuce': `<defs><linearGradient id="lettuce-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6EC7E"/><stop offset="1" stop-color="#6DBA3E"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="30" ry="4" fill="#000" opacity=".12"/>
  <path d="M50 88C30 82 12 64 14 38q5-4 9 0 4-6 9-2 5-5 9 0 4-4 8 0C52 54 54 72 50 88z" fill="#5FAE38"/>
  <path d="M50 88C70 82 88 64 86 38q-5-4-9 0-4-6-9-2-5-5-9 0-4-4-8 0C48 54 46 72 50 88z" fill="#5FAE38"/>
  <path d="M50 88C36 80 28 60 30 30q5-5 10-1 5-5 10 0 5-5 10 0 5-4 10 1C72 60 64 80 50 88z" fill="url(#lettuce-g)"/>
  <path d="M50 86V36M50 70l-10-12M50 70l10-12M50 54l-8-10M50 54l8-10" stroke="#F2FBE0" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M24 74q-6-14-6-30M76 74q6-14 6-30" stroke="#B9E08A" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,

  'spinach': `<defs><linearGradient id="spinach-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5DB040"/><stop offset="1" stop-color="#22702C"/></linearGradient></defs>
  <ellipse cx="50" cy="93" rx="18" ry="3.5" fill="#000" opacity=".12"/>
  <path d="M50 92V58M50 92l-12-30M50 92l12-30M50 92L28 70M50 92l22-22" stroke="#8CC45A" stroke-width="3" stroke-linecap="round"/>
  <g fill="url(#spinach-g)"><path d="M50 60c-12-8-16-28-6-50 12 14 14 34 6 50z"/><path d="M38 64c-14-2-24-18-22-38 14 6 24 22 22 38z"/><path d="M62 64c14-2 24-18 22-38-14 6-24 22-22 38z"/><path d="M28 72c-12 2-22-8-24-22 12 0 22 8 24 22z"/><path d="M72 72c12 2 22-8 24-22-12 0-22 8-24 22z"/></g>
  <path d="M50 58c-4-14-4-30-4-42M38 62c-8-8-14-18-16-30M62 62c8-8 14-18 16-30" stroke="#B5E08C" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <rect x="43" y="76" width="14" height="6" rx="2" fill="#C9A36A"/>`,

  'coriander': `<defs><path id="coriander-l" d="M0 2c-9-1-14-8-12-15 3 0 5 2 6 4 0-6 3-9 6-11 3 2 6 5 6 11 1-2 3-4 6-4 2 7-3 14-12 15z"/></defs>
  <ellipse cx="50" cy="93" rx="16" ry="3" fill="#000" opacity=".12"/>
  <path d="M50 92V40M50 92C44 74 34 60 24 50M50 92c6-18 16-32 28-42M50 66c-6-8-12-12-18-14M50 60c6-6 12-10 18-12M50 40c-4-8-10-12-16-14M50 40c4-8 10-12 16-14" stroke="#6BA845" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <g fill="#3E9B3A"><use href="#coriander-l" transform="translate(50 30)"/><use href="#coriander-l" transform="translate(32 24) rotate(-30)"/><use href="#coriander-l" transform="translate(68 24) rotate(30)"/><use href="#coriander-l" transform="translate(22 46) rotate(-50)"/><use href="#coriander-l" transform="translate(78 46) rotate(50)"/><use href="#coriander-l" transform="translate(30 52) rotate(-70) scale(.8)"/><use href="#coriander-l" transform="translate(70 48) rotate(70) scale(.8)"/></g>
  `,

  'mint': `<defs><linearGradient id="mint-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7EDB6A"/><stop offset="1" stop-color="#2E9A4A"/></linearGradient><path id="mint-l" d="M0 0c4-12 18-19 31-13-3 15-18 20-31 13z"/></defs>
  <ellipse cx="50" cy="93" rx="14" ry="3" fill="#000" opacity=".12"/>
  <path d="M50 92V14" stroke="#7A5A3A" stroke-width="3" stroke-linecap="round"/>
  <g fill="url(#mint-g)"><use href="#mint-l" transform="translate(51 72)"/><use href="#mint-l" transform="translate(49 72) scale(-1 1)"/><use href="#mint-l" transform="translate(51 50) scale(.85)"/><use href="#mint-l" transform="translate(49 50) scale(-.85 .85)"/><use href="#mint-l" transform="translate(51 30) scale(.7)"/><use href="#mint-l" transform="translate(49 30) scale(-.7 .7)"/><path d="M50 18c-6-6-6-12 0-16 6 4 6 10 0 16z"/></g>
  <path d="M53 70q10-5 22-7M47 70q-10-5-22-7M53 48q9-4 18-6M47 48q-9-4-18-6M53 28q7-3 14-4M47 28q-7-3-14-4" stroke="#C8F2B0" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  // ---- seeds, plants, flowers ---------------------------------------------------------------------
  'seed': `<defs><radialGradient id="seed-g" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#E0A86A"/><stop offset=".6" stop-color="#A86C34"/><stop offset="1" stop-color="#7A4A1E"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="34" ry="4" fill="#000" opacity=".12"/>
  <path d="M24 46c3-15 21-23 37-17 14 5 21 19 16 34-5 15-20 23-33 19-7-2-7-9-11-11-8-5-12-12-9-25z" fill="url(#seed-g)"/>
  <ellipse cx="33" cy="64" rx="5" ry="2.6" fill="#F3DEB8" transform="rotate(50 33 64)"/>
  <ellipse cx="46" cy="38" rx="9" ry="4" fill="#fff" opacity=".4" transform="rotate(-20 46 38)"/>
  <ellipse cx="80" cy="82" rx="7" ry="4.5" fill="#A86C34" transform="rotate(-20 80 82)"/><ellipse cx="17" cy="82" rx="6" ry="4" fill="#8E5A28" transform="rotate(25 17 82)"/>`,

  'seed-packet': `<defs><linearGradient id="seed-packet-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6E2"/><stop offset="1" stop-color="#EBD7AE"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="30" ry="4" fill="#000" opacity=".12"/>
  <path d="M26 18l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4v67a3 3 0 0 1-3 3H29a3 3 0 0 1-3-3z" fill="url(#seed-packet-g)" stroke="#B89A6A" stroke-width="1.5"/>
  <path d="M26 66h48v14H26z" fill="#3E9B3A"/><path d="M33 73h22M60 73h8" stroke="#CDEFB0" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="50" cy="41" r="17" fill="#CDEBF2"/>
  <path d="M50 58V40M50 50c-4-5-10-6-14-3 4 4 10 5 14 3zM50 46c4-5 10-6 14-3-4 4-10 5-14 3z" stroke="#3E9B3A" stroke-width="2.5" fill="#4FAA3A" stroke-linecap="round"/>
  <circle cx="50" cy="34" r="6" fill="#F2A21E" stroke="#F7C64A" stroke-width="5" stroke-dasharray="0 4.7" stroke-linecap="round"/><circle cx="50" cy="34" r="3" fill="#C9560A"/>
  <ellipse cx="82" cy="88" rx="3.5" ry="2.3" fill="#8E5A28"/><ellipse cx="88" cy="84" rx="3.2" ry="2.1" fill="#A86C34" transform="rotate(30 88 84)"/>`,

  'seedling': `<defs><linearGradient id="seedling-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BDB5E"/><stop offset="1" stop-color="#3E9B3A"/></linearGradient><linearGradient id="seedling-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6A40"/><stop offset="1" stop-color="#6B4524"/></linearGradient></defs>
  <path d="M12 90c4-13 20-19 38-19s34 6 38 19z" fill="url(#seedling-s)"/>
  <path d="M50 76c0-10 0-20 0-30" stroke="#5DAA3A" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M49 50c-5-13-19-18-31-12 4 13 18 18 31 12z" fill="url(#seedling-g)"/><path d="M51 45c4-15 18-21 32-17-3 15-17 21-32 17z" fill="url(#seedling-g)"/>
  <path d="M47 49q-12-5-24-9M53 44q12-8 24-12" stroke="#D8F2B8" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <g fill="#B88A5E"><ellipse cx="30" cy="84" rx="3" ry="2"/><ellipse cx="68" cy="82" rx="2.5" ry="1.8"/><ellipse cx="58" cy="87" rx="2" ry="1.4"/></g>`,

  'sapling': `<defs><linearGradient id="sapling-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BDB5E"/><stop offset="1" stop-color="#3E9B3A"/></linearGradient><path id="sapling-l" d="M0 0c2-8 9-13 17-12-1 8-9 13-17 12z" fill="url(#sapling-g)"/></defs>
  <path d="M14 92c4-10 18-14 36-14s32 4 36 14z" fill="#7E5232"/>
  <path d="M64 86V34" stroke="#C9A36A" stroke-width="3" stroke-linecap="round"/><path d="M50 60l14 2M50 44l14 2" stroke="#E8DCC0" stroke-width="2"/>
  <path d="M50 84C49 66 52 46 50 22M50 56c-6-4-10-10-12-16M51 44c5-4 10-8 12-14M50 34c-4-3-7-6-8-10" stroke="#8A5A30" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <use href="#sapling-l" transform="translate(50 22) rotate(-80)"/><use href="#sapling-l" transform="translate(50 22) rotate(-120) scale(-1 1)"/><use href="#sapling-l" transform="translate(38 40) rotate(-150)"/><use href="#sapling-l" transform="translate(38 40) rotate(-60)"/><use href="#sapling-l" transform="translate(63 30) rotate(-40)"/><use href="#sapling-l" transform="translate(63 30) rotate(-110)"/><use href="#sapling-l" transform="translate(42 24) rotate(-140)"/><use href="#sapling-l" transform="translate(50 60) rotate(-170)"/><use href="#sapling-l" transform="translate(51 52) rotate(-10)"/>`,

  'plant-pot': `<defs><linearGradient id="plant-pot-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EE9468"/><stop offset=".5" stop-color="#D06A40"/><stop offset="1" stop-color="#A84A2A"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="26" ry="4" fill="#000" opacity=".14"/>
  <path d="M24 42h52l-7 44a4 4 0 0 1-4 3H35a4 4 0 0 1-4-3z" fill="url(#plant-pot-g)"/>
  <rect x="18" y="30" width="64" height="15" rx="4" fill="url(#plant-pot-g)"/>
  <path d="M18 41h64" stroke="#8E3A1E" stroke-width="2" opacity=".35"/>
  <ellipse cx="50" cy="31" rx="29" ry="3.5" fill="#5E3A1E"/>
  <path d="M31 50l4 32" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`,

  'tomato-plant': `<defs><radialGradient id="tomato-plant-t" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF8466"/><stop offset=".6" stop-color="#E53B2A"/><stop offset="1" stop-color="#B01F17"/></radialGradient><linearGradient id="tomato-plant-p" x1="0" x2="1"><stop offset="0" stop-color="#EE9468"/><stop offset="1" stop-color="#A84A2A"/></linearGradient><path id="tomato-plant-l" d="M0 0c3-6 9-8 14-6l-3 3 5 1-4 3 4 2c-6 3-13 1-16-3z" fill="#3E9B3A"/></defs>
  <ellipse cx="50" cy="93" rx="22" ry="3.5" fill="#000" opacity=".14"/>
  <path d="M66 74V12" stroke="#C9A36A" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M50 74C48 56 52 36 50 14M50 56c-8-4-16-4-22 0M50 40c8-4 14-6 20-4M50 28c-6-4-12-4-16-2M51 64c6-2 12-2 16 2" stroke="#4E8A2A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <use href="#tomato-plant-l" transform="translate(50 15) rotate(-70)"/><use href="#tomato-plant-l" transform="translate(50 15) rotate(-110) scale(1 -1)"/><use href="#tomato-plant-l" transform="translate(34 26) rotate(170)"/><use href="#tomato-plant-l" transform="translate(70 36) rotate(-20)"/><use href="#tomato-plant-l" transform="translate(28 56) rotate(160)"/><use href="#tomato-plant-l" transform="translate(66 66) rotate(10)"/><use href="#tomato-plant-l" transform="translate(50 46) rotate(200)"/>
  <circle cx="30" cy="64" r="8" fill="url(#tomato-plant-t)"/><circle cx="42" cy="66" r="7" fill="url(#tomato-plant-t)"/><circle cx="66" cy="44" r="7.5" fill="url(#tomato-plant-t)"/><circle cx="36" cy="34" r="6" fill="#8CC84A"/>
  <g fill="#fff" opacity=".5"><circle cx="27" cy="61" r="2"/><circle cx="40" cy="63" r="1.7"/><circle cx="63" cy="41" r="1.8"/></g>
  <path d="M34 76h32l-4 15H38z" fill="url(#tomato-plant-p)"/><rect x="31" y="72" width="38" height="7" rx="2.5" fill="#C9623A"/>`,

  'tulsi': `<defs><linearGradient id="tulsi-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7CC85A"/><stop offset="1" stop-color="#2F7A30"/></linearGradient><linearGradient id="tulsi-p" x1="0" x2="1"><stop offset="0" stop-color="#F2DDB0"/><stop offset="1" stop-color="#D2B47E"/></linearGradient><path id="tulsi-l" d="M0 0c2-6 8-9 13-7-2 6-8 9-13 7z" fill="url(#tulsi-g)"/></defs>
  <ellipse cx="50" cy="93" rx="24" ry="3.5" fill="#000" opacity=".14"/>
  <path d="M50 66V34M50 56L34 40M50 52l16-14M50 44l-8-16M50 44l8-18" stroke="#7A4A5A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g><use href="#tulsi-l" transform="translate(50 36) rotate(-60)"/><use href="#tulsi-l" transform="translate(50 36) rotate(-120) scale(1 -1)"/><use href="#tulsi-l" transform="translate(34 40) rotate(-160)"/><use href="#tulsi-l" transform="translate(34 40) rotate(-100)"/><use href="#tulsi-l" transform="translate(66 38) rotate(-20)"/><use href="#tulsi-l" transform="translate(66 38) rotate(-80)"/><use href="#tulsi-l" transform="translate(42 46) rotate(180)"/><use href="#tulsi-l" transform="translate(58 46) rotate(0)"/><use href="#tulsi-l" transform="translate(42 30) rotate(-110)"/><use href="#tulsi-l" transform="translate(58 28) rotate(-60)"/><use href="#tulsi-l" transform="translate(50 56) rotate(160)"/><use href="#tulsi-l" transform="translate(50 56) rotate(20)"/></g>
  <path d="M42 28V12M58 26V10M50 34V8" stroke="#8A4A7A" stroke-width="3" stroke-dasharray="2 2"/>
  <path d="M30 64h40v6H30zM32 70h36l-3 20H35z" fill="url(#tulsi-p)"/><path d="M30 64h40v6H30z" fill="#C25A2A"/><path d="M40 78l10-4 10 4-10 5z" fill="#E07A3A"/>`,

  'marigold': `<defs><radialGradient id="marigold-g" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE07A" stop-opacity=".9"/><stop offset="1" stop-color="#FFE07A" stop-opacity="0"/></radialGradient></defs>
  <path d="M50 60v34" stroke="#4E8A2A" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M50 80c-6-6-16-6-22-2 6 6 16 6 22 2zM50 72c6-6 16-6 22-2-6 6-16 6-22 2z" fill="#3E9B3A"/>
  <path d="M38 62c4 2 8 2 12 0 4 2 8 2 12 0-2-4-8-5-12-4-4-1-10 0-12 4z" fill="#2F7A26"/>
  <circle cx="50" cy="38" r="21" fill="#E36C0A"/>
  <circle cx="50" cy="38" r="21" fill="none" stroke="#E36C0A" stroke-width="15" stroke-dasharray="0 8.8" stroke-linecap="round"/>
  <circle cx="50" cy="38" r="14" fill="none" stroke="#F58C14" stroke-width="13" stroke-dasharray="0 7.3" stroke-linecap="round"/>
  <circle cx="50" cy="38" r="7" fill="#FBA824" stroke="#FBA824" stroke-width="9" stroke-dasharray="0 5.5" stroke-linecap="round"/>
  <circle cx="50" cy="38" r="4" fill="#FFC23A"/>
  <circle cx="50" cy="38" r="28" fill="url(#marigold-g)"/>`,

  'hibiscus': `<defs><radialGradient id="hibiscus-g" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="34"><stop offset="0" stop-color="#8E0A26"/><stop offset=".3" stop-color="#D8243A"/><stop offset="1" stop-color="#FF5A5A"/></radialGradient><path id="hibiscus-p" d="M0 0C-14-6-22-22-13-32c6-6 16-5 20 0C17-23 12-6 0 0z" fill="url(#hibiscus-g)"/></defs>
  <path d="M30 70c-12 4-20 14-20 24 12-2 20-10 22-22zM66 70c12 2 22 10 24 22-12 0-22-8-26-18z" fill="#3E9B3A"/>
  <g transform="translate(48 48)"><use href="#hibiscus-p"/><use href="#hibiscus-p" transform="rotate(72)"/><use href="#hibiscus-p" transform="rotate(144)"/><use href="#hibiscus-p" transform="rotate(216)"/><use href="#hibiscus-p" transform="rotate(288)"/>
  <path d="M-4-10q-2-8 2-14M8-2q8-4 14-2" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>
  <circle r="6" fill="#7A0820"/><path d="M0 0q12-6 20-22" stroke="#FFD0D6" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g fill="#FFD23A"><circle cx="20" cy="-23" r="2.4"/><circle cx="15" cy="-20" r="2"/><circle cx="22" cy="-17" r="2"/><circle cx="17" cy="-26" r="2"/></g></g>`,

  'rose': `<defs><radialGradient id="rose-g" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FF6A7A"/><stop offset=".6" stop-color="#E02A48"/><stop offset="1" stop-color="#A8122E"/></radialGradient></defs>
  <path d="M50 52c0 16-2 28 0 42" stroke="#3E7A2A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M49 72l-4-2M51 82l4-2" stroke="#3E7A2A" stroke-width="2" stroke-linecap="round"/>
  <path d="M49 66c-8-8-20-8-28-2 8 8 20 8 28 2zM51 76c8-10 20-10 28-4-8 8-20 10-28 4z" fill="#3E9B3A"/><path d="M48 66q-12-3-24-2M52 76q12-5 24-4" stroke="#8CD06A" stroke-width="1.3" fill="none"/>
  <path d="M38 52c4 4 8 4 12 2 4 2 8 2 12-2-4-4-8-4-12-2-4-2-8-2-12 2z" fill="#2F7A26"/>
  <path d="M28 28c0 16 10 26 22 26s22-10 22-26c-4-8-12-12-22-12S32 20 28 28z" fill="url(#rose-g)"/>
  <path d="M50 30c4 0 6 4 3 7-4 4-11 1-11-5 0-8 10-12 17-8 8 5 7 17-1 22-9 5-21 1-24-9" stroke="#8E0E26" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M28 30c2 14 10 22 22 24-14-6-18-14-18-26zM72 30c-2 14-10 22-22 24 14-6 18-14 18-26z" fill="#C8183A"/>
  <ellipse cx="38" cy="24" rx="5" ry="2.5" fill="#fff" opacity=".35" transform="rotate(-25 38 24)"/>`,

  'sunflower': `<defs><linearGradient id="sunflower-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F5A80E"/><stop offset="1" stop-color="#FFDA3A"/></linearGradient><path id="sunflower-p" d="M0-10C5-16 5-26 0-32-5-26-5-16 0-10z" fill="url(#sunflower-g)"/></defs>
  <path d="M50 60v34" stroke="#4E8A2A" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 82c-8-10-22-10-30-2 8 8 22 10 30 2zM50 72c8-10 22-10 30-2-8 8-22 10-30 2z" fill="#3E9B3A"/>
  <g transform="translate(50 38)"><use href="#sunflower-p"/><use href="#sunflower-p" transform="rotate(24)"/><use href="#sunflower-p" transform="rotate(48)"/><use href="#sunflower-p" transform="rotate(72)"/><use href="#sunflower-p" transform="rotate(96)"/><use href="#sunflower-p" transform="rotate(120)"/><use href="#sunflower-p" transform="rotate(144)"/><use href="#sunflower-p" transform="rotate(168)"/><use href="#sunflower-p" transform="rotate(192)"/><use href="#sunflower-p" transform="rotate(216)"/><use href="#sunflower-p" transform="rotate(240)"/><use href="#sunflower-p" transform="rotate(264)"/><use href="#sunflower-p" transform="rotate(288)"/><use href="#sunflower-p" transform="rotate(312)"/><use href="#sunflower-p" transform="rotate(336)"/>
  <circle r="14" fill="#7A4218"/><circle r="9" fill="none" stroke="#4E2410" stroke-width="3" stroke-dasharray="0 4" stroke-linecap="round"/><circle r="4" fill="#5A2E12"/><circle cx="-5" cy="-6" r="3" fill="#fff" opacity=".2"/></g>`,

  'tree': `<defs><radialGradient id="tree-g" gradientUnits="userSpaceOnUse" cx="38" cy="20" r="58"><stop offset="0" stop-color="#9BDB5E"/><stop offset=".55" stop-color="#4FA83A"/><stop offset="1" stop-color="#2E7A2E"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="30" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M44 91c2-10 3-26 1-38h10c-2 12-1 28 1 38z" fill="#8A5A30"/><path d="M50 62l-10-8M51 58l9-8" stroke="#8A5A30" stroke-width="4" stroke-linecap="round"/>
  <g fill="url(#tree-g)"><circle cx="50" cy="30" r="22"/><circle cx="30" cy="44" r="16"/><circle cx="70" cy="44" r="16"/><circle cx="40" cy="58" r="13"/><circle cx="60" cy="58" r="13"/><circle cx="50" cy="46" r="18"/></g>
  <g fill="#fff" opacity=".22"><circle cx="42" cy="22" r="7"/><circle cx="25" cy="40" r="4.5"/></g>`,

  'neem-tree': `<defs><radialGradient id="neem-tree-g" gradientUnits="userSpaceOnUse" cx="40" cy="14" r="60"><stop offset="0" stop-color="#8CC84E"/><stop offset=".55" stop-color="#4A9636"/><stop offset="1" stop-color="#2A6A2A"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="36" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M43 91c3-10 4-20 2-30-6-4-14-6-20-6l2-4c8 0 14 2 20 6 2-6 1-12-1-16h9c-1 6-1 11 1 15 6-5 13-8 20-8l1 4c-7 1-13 4-18 9-2 10 0 20 3 30z" fill="#7A4E2A"/>
  <g fill="url(#neem-tree-g)"><ellipse cx="50" cy="34" rx="40" ry="20"/><circle cx="24" cy="44" r="13"/><circle cx="76" cy="44" r="13"/><circle cx="50" cy="44" r="14"/></g>
  <path d="M14 30a36 18 0 0 1 72 0" fill="none" stroke="#4A9636" stroke-width="12" stroke-dasharray="0 9" stroke-linecap="round"/>
  <g stroke="#C8EE9A" stroke-width="1.3" fill="none" opacity=".7" stroke-linecap="round"><path d="M26 30l6-4m-6 4l6 2m-6-2l-3-3m3 3l-3 3M60 24l6-4m-6 4l6 2m-6-2l-3-3m3 3l-3 3M46 40l6-4m-6 4l6 2m-6-2l-3-3m3 3l-3 3M72 38l5-3m-5 3l5 2"/></g>`,

  'bamboo-plant': `<defs><linearGradient id="bamboo-plant-g" x1="0" x2="1"><stop offset="0" stop-color="#A6D85A"/><stop offset=".6" stop-color="#6AB03A"/><stop offset="1" stop-color="#4A8A2A"/></linearGradient><path id="bamboo-plant-l" d="M0 0c6-4 14-4 20-1-6 3-14 4-20 1z" fill="#4FAA3A"/></defs>
  <ellipse cx="50" cy="92" rx="30" ry="4" fill="#000" opacity=".14"/>
  <g fill="url(#bamboo-plant-g)"><rect x="30" y="22" width="9" height="70" rx="3"/><rect x="46" y="8" width="10" height="84" rx="3"/><rect x="63" y="30" width="8" height="62" rx="3"/></g>
  <g stroke="#3E7A26" stroke-width="2.2" stroke-linecap="round"><path d="M30 40h9M30 60h9M30 78h9M46 26h10M46 46h10M46 66h10M46 84h10M63 48h8M63 68h8"/></g>
  <use href="#bamboo-plant-l" transform="translate(39 40) rotate(-20)"/><use href="#bamboo-plant-l" transform="translate(30 60) rotate(200)"/><use href="#bamboo-plant-l" transform="translate(56 26) rotate(-30)"/><use href="#bamboo-plant-l" transform="translate(46 46) rotate(210)"/><use href="#bamboo-plant-l" transform="translate(71 48) rotate(-25)"/><use href="#bamboo-plant-l" transform="translate(51 9) rotate(-60)"/><use href="#bamboo-plant-l" transform="translate(51 9) rotate(-130)"/><use href="#bamboo-plant-l" transform="translate(34 23) rotate(-120)"/><use href="#bamboo-plant-l" transform="translate(67 31) rotate(-50)"/>`,

  'grass': `<ellipse cx="50" cy="90" rx="34" ry="4" fill="#000" opacity=".12"/>
  <path d="M50 90C46 70 36 50 20 40c8 16 14 32 18 50zM50 90c0-24 4-50 14-70-2 22-4 46-6 70zM46 90c-4-18-4-38 0-58 4 20 6 40 6 58zM56 90c6-16 16-28 30-34-10 10-18 22-22 34zM40 90c-6-10-16-18-28-20 8 6 14 12 18 20z" fill="#3E9B3A"/>
  <path d="M42 90c-2-16-8-30-16-40 8 8 14 22 18 40zM58 90c4-18 10-34 20-44-6 12-10 28-12 44zM52 90c2-14 6-26 12-34-2 10-4 22-4 34z" fill="#8CD05A"/>`,

  'flower': `<defs><radialGradient id="flower-g" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="24"><stop offset=".2" stop-color="#E0559A"/><stop offset="1" stop-color="#FF9AC8"/></radialGradient><circle id="flower-p" cx="0" cy="-14" r="11" fill="url(#flower-g)"/></defs>
  <path d="M50 52v42" stroke="#4E8A2A" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M50 80c-6-10-18-12-26-6 6 8 18 10 26 6zM50 70c6-10 18-12 26-6-6 8-18 10-26 6z" fill="#4FAA3A"/>
  <g transform="translate(50 36)"><use href="#flower-p"/><use href="#flower-p" transform="rotate(72)"/><use href="#flower-p" transform="rotate(144)"/><use href="#flower-p" transform="rotate(216)"/><use href="#flower-p" transform="rotate(288)"/>
  <circle r="8" fill="#FFC531"/><circle r="8" fill="none" stroke="#F09A12" stroke-width="2" stroke-dasharray="0 3.5" stroke-linecap="round"/><circle cx="-3" cy="-3" r="2.5" fill="#fff" opacity=".6"/></g>`,

  'leaf': `<defs><linearGradient id="leaf-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2F8A2E"/><stop offset="1" stop-color="#8CD05A"/></linearGradient></defs>
  <path d="M18 84c4-36 26-62 66-68-2 40-26 64-60 64z" fill="url(#leaf-g)"/>
  <path d="M14 88l6-6c14-18 32-36 58-58" stroke="#D8F2B8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M30 70l-2-14M30 70l14 0M42 56l-2-14M42 56l14 1M54 44l-1-12M54 44l12 0" stroke="#D8F2B8" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M14 88l6-6" stroke="#6B8A2A" stroke-width="3.5" stroke-linecap="round"/>`,

  'peepal-leaf': `<defs><linearGradient id="peepal-leaf-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2F8A2E"/><stop offset="1" stop-color="#9BD45E"/></linearGradient></defs>
  <path d="M50 78c-10 8-32 4-34-14-2-16 14-28 26-38 4-4 6-10 8-20 2 10 4 16 8 20 12 10 28 22 26 38-2 18-24 22-34 14z" fill="url(#peepal-leaf-g)"/>
  <path d="M50 96V12" stroke="#E2F5C6" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M50 70C40 66 28 64 22 58M50 58C42 52 34 46 30 38M50 46c-4-6-8-10-10-16M50 70c10-4 22-6 28-12M50 58c8-6 16-12 20-20M50 46c4-6 8-10 10-16" stroke="#E2F5C6" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M50 78v18" stroke="#8A6A3A" stroke-width="3" stroke-linecap="round"/>`,

  'roots': `<defs><linearGradient id="roots-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6A40"/><stop offset="1" stop-color="#6B4524"/></linearGradient></defs>
  <rect x="8" y="44" width="84" height="48" rx="8" fill="url(#roots-g)"/>
  <path d="M8 46q42-6 84 0" stroke="#5DAA3A" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M50 46V20" stroke="#4E9A32" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M50 30c-6-10-18-12-26-6 6 8 18 10 26 6zM50 24c6-10 18-12 26-6-6 8-18 10-26 6z" fill="#4FAA3A"/>
  <path d="M50 46c0 14-2 26 0 40M50 54c-8 4-14 12-18 22M50 54c8 4 14 10 20 20M49 66c-6 2-10 6-12 12M51 64c4 4 8 8 10 14M32 76c-4 2-6 6-6 10M70 74c4 2 6 6 8 10M50 74l-6 10M50 76l5 8" stroke="#F3E3C0" stroke-width="2" fill="none" stroke-linecap="round"/>
  <g fill="#B88A5E"><ellipse cx="20" cy="58" rx="3" ry="2"/><ellipse cx="82" cy="60" rx="3.5" ry="2.2"/><ellipse cx="74" cy="86" rx="2.5" ry="1.8"/><ellipse cx="18" cy="84" rx="2.5" ry="1.6"/></g>`,

  'sprouts': `<defs><radialGradient id="sprouts-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#B2DC6A"/><stop offset="1" stop-color="#5E9A2E"/></radialGradient><g id="sprouts-s"><path d="M2 2c4 8 12 10 18 8" stroke="#FFF6E0" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M2 2c4 8 12 10 18 8" stroke="#D8C8A0" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/><ellipse rx="7" ry="5" fill="url(#sprouts-g)"/><ellipse cx="-2" cy="-2" rx="2.5" ry="1.4" fill="#fff" opacity=".5"/></g></defs>
  <ellipse cx="50" cy="86" rx="38" ry="5" fill="#000" opacity=".12"/>
  <use href="#sprouts-s" transform="translate(22 76)"/><use href="#sprouts-s" transform="translate(40 80) rotate(20)"/><use href="#sprouts-s" transform="translate(60 78) rotate(-30)"/><use href="#sprouts-s" transform="translate(76 80) scale(-1 1)"/><use href="#sprouts-s" transform="translate(30 64) rotate(-20)"/><use href="#sprouts-s" transform="translate(50 62) rotate(40)"/><use href="#sprouts-s" transform="translate(68 64) scale(-1 1) rotate(-10)"/><use href="#sprouts-s" transform="translate(40 48) rotate(-50)"/><use href="#sprouts-s" transform="translate(60 48) scale(-1 1) rotate(-40)"/>
  <path d="M50 46c-2-8 0-14 4-18" stroke="#FFF6E0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M54 28c-2-6 2-10 8-10 0 6-4 10-8 10zM54 28c-6-2-10 0-12 4 6 2 10 0 12-4z" fill="#6DBA3E"/>`,

  'microgreens': `<defs><linearGradient id="microgreens-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9A464"/><stop offset="1" stop-color="#A8723A"/></linearGradient><g id="microgreens-s"><path d="M0 0v-22" stroke="#C8E8A0" stroke-width="2"/><path d="M0-22c-3-5-8-6-11-3 3 4 8 5 11 3zM0-22c3-5 8-6 11-3-3 4-8 5-11 3z" fill="#5DB040"/></g></defs>
  <ellipse cx="50" cy="91" rx="40" ry="4" fill="#000" opacity=".14"/>
  <g><use href="#microgreens-s" transform="translate(20 66) scale(.9)"/><use href="#microgreens-s" transform="translate(32 64)"/><use href="#microgreens-s" transform="translate(44 66) scale(.85)"/><use href="#microgreens-s" transform="translate(56 64) scale(1.05)"/><use href="#microgreens-s" transform="translate(68 66) scale(.9)"/><use href="#microgreens-s" transform="translate(80 65) scale(.95)"/><use href="#microgreens-s" transform="translate(26 68) scale(.7)"/><use href="#microgreens-s" transform="translate(38 68) scale(.65)"/><use href="#microgreens-s" transform="translate(50 68) scale(.75)"/><use href="#microgreens-s" transform="translate(62 68) scale(.7)"/><use href="#microgreens-s" transform="translate(74 68) scale(.68)"/></g>
  <path d="M12 66h76l-4 22a3 3 0 0 1-3 2H19a3 3 0 0 1-3-2z" fill="url(#microgreens-t)"/><path d="M12 66h76" stroke="#5E3A1E" stroke-width="4" stroke-linecap="round"/><path d="M20 76h60" stroke="#8A5A2A" stroke-width="1.5" opacity=".5"/>`,

  'mushroom': `<defs><radialGradient id="mushroom-g" cx=".4" cy=".25" r=".85"><stop offset="0" stop-color="#E8B888"/><stop offset=".6" stop-color="#C08050"/><stop offset="1" stop-color="#8A5530"/></radialGradient><linearGradient id="mushroom-s" x1="0" x2="1"><stop offset="0" stop-color="#FFF8EC"/><stop offset="1" stop-color="#DCCDB4"/></linearGradient></defs>
  <ellipse cx="50" cy="90" rx="36" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M68 70c0 8-1 14-2 20h12c-1-6-2-12-2-20z" fill="url(#mushroom-s)"/><path d="M58 72c2-10 10-16 14-16s12 6 14 16c-6 2-22 2-28 0z" fill="url(#mushroom-g)"/>
  <path d="M38 52c0 14-2 26-4 38h22c-2-12-4-24-4-38z" fill="url(#mushroom-s)"/>
  <path d="M14 54c2-24 18-38 31-38s29 14 31 38c-10 4-52 4-62 0z" fill="url(#mushroom-g)"/>
  <path d="M18 54c9 3 45 3 54 0" stroke="#F3E3C8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="34" cy="30" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-30 34 30)"/>
  <g fill="#F5E2C4" opacity=".7"><circle cx="50" cy="28" r="2.5"/><circle cx="60" cy="40" r="2"/><circle cx="28" cy="44" r="2"/></g>`,

  'weed': `<ellipse cx="50" cy="91" rx="32" ry="4" fill="#000" opacity=".12"/>
  <path d="M50 90c-8-6-18-6-26-14l6-1-8-4 7-2-8-5 8-1c6 4 14 10 21 27zM50 90c8-6 18-6 26-14l-6-1 8-4-7-2 8-5-8-1c-6 4-14 10-21 27zM50 90c-4-8-6-18-4-28l3 4 2-7 3 5c2 8 0 18-4 26z" fill="#5E9A32"/>
  <path d="M48 90C46 70 40 50 30 34M52 90c2-22 10-40 20-52" stroke="#6E8A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="30" cy="30" r="9" fill="#F5C531" stroke="#F5C531" stroke-width="6" stroke-dasharray="0 4.7" stroke-linecap="round"/><circle cx="30" cy="30" r="4" fill="#E8A010"/>
  <circle cx="73" cy="32" r="12" fill="#F4F0E6" opacity=".9"/><g stroke="#C9C0AE" stroke-width="1"><path d="M73 32l0-11M73 32l8 8M73 32l-8 8M73 32l11 0M73 32l-11 0M73 32l8-8M73 32l-8-8M73 32l0 11"/></g><circle cx="73" cy="32" r="2.5" fill="#A89878"/>`,

  'neem-leaves': `<defs><linearGradient id="neem-leaves-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7CC85A"/><stop offset="1" stop-color="#2E8A2E"/></linearGradient><path id="neem-leaves-l" d="M0 0c3-6 10-11 18-12-2 7-10 12-18 12z" fill="url(#neem-leaves-g)"/></defs>
  <path d="M14 90C30 70 52 42 82 12" stroke="#7A8A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <use href="#neem-leaves-l" transform="translate(26 76) rotate(-100)"/><use href="#neem-leaves-l" transform="translate(28 74) rotate(-10)"/><use href="#neem-leaves-l" transform="translate(36 64) rotate(-100)"/><use href="#neem-leaves-l" transform="translate(39 61) rotate(-10)"/><use href="#neem-leaves-l" transform="translate(47 51) rotate(-100)"/><use href="#neem-leaves-l" transform="translate(50 48) rotate(-10)"/><use href="#neem-leaves-l" transform="translate(58 38) rotate(-100)"/><use href="#neem-leaves-l" transform="translate(61 35) rotate(-10)"/><use href="#neem-leaves-l" transform="translate(69 26) rotate(-100)"/><use href="#neem-leaves-l" transform="translate(72 23) rotate(-10)"/><use href="#neem-leaves-l" transform="translate(80 14) rotate(-50) scale(.9)"/>`,
};
