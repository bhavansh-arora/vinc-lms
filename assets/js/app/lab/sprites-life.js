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
  <g fill="#2A6A2A" opacity=".35"><ellipse cx="34" cy="40" rx="9" ry="5"/><ellipse cx="62" cy="44" rx="10" ry="5"/><ellipse cx="48" cy="30" rx="8" ry="4"/></g><g fill="#B8E68A" opacity=".45"><ellipse cx="30" cy="26" rx="8" ry="4"/><ellipse cx="54" cy="20" rx="9" ry="3.5"/><ellipse cx="72" cy="30" rx="6" ry="3"/></g>`,

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

  'sprouts': `<defs><radialGradient id="sprouts-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#B2DC6A"/><stop offset="1" stop-color="#5E9A2E"/></radialGradient><g id="sprouts-s"><path d="M2 2c4 8 12 10 18 8" stroke="#CDB98E" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M2 2c4 8 12 10 18 8" stroke="#FFF8E8" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse rx="7" ry="5" fill="url(#sprouts-g)"/><ellipse cx="-2" cy="-2" rx="2.5" ry="1.4" fill="#fff" opacity=".5"/></g></defs>
  <ellipse cx="50" cy="86" rx="38" ry="5" fill="#000" opacity=".12"/>
  <use href="#sprouts-s" transform="translate(22 76)"/><use href="#sprouts-s" transform="translate(40 80) rotate(20)"/><use href="#sprouts-s" transform="translate(60 78) rotate(-30)"/><use href="#sprouts-s" transform="translate(76 80) scale(-1 1)"/><use href="#sprouts-s" transform="translate(30 64) rotate(-20)"/><use href="#sprouts-s" transform="translate(50 62) rotate(40)"/><use href="#sprouts-s" transform="translate(68 64) scale(-1 1) rotate(-10)"/><use href="#sprouts-s" transform="translate(40 48) rotate(-50)"/><use href="#sprouts-s" transform="translate(60 48) scale(-1 1) rotate(-40)"/>
  <path d="M50 46c-2-8 0-14 4-18" stroke="#CDB98E" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M50 46c-2-8 0-14 4-18" stroke="#FFF8E8" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M54 28c-2-6 2-10 8-10 0 6-4 10-8 10zM54 28c-6-2-10 0-12 4 6 2 10 0 12-4z" fill="#6DBA3E"/>`,

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

  'neem-leaves': `<defs><linearGradient id="neem-leaves-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7CC85A"/><stop offset="1" stop-color="#2E8A2E"/></linearGradient><path id="neem-leaves-l" d="M0 0c2-8 10-15 21-16-1 9-10 16-21 16z" fill="url(#neem-leaves-g)"/></defs>
  <path d="M14 92C30 72 52 42 80 14" stroke="#7A8A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <use href="#neem-leaves-l" transform="translate(24 79) rotate(-45) scale(1.00)"/><use href="#neem-leaves-l" transform="translate(26 81) rotate(-48) scale(1.00 -1.00)"/><use href="#neem-leaves-l" transform="translate(33 69) rotate(-45) scale(0.95)"/><use href="#neem-leaves-l" transform="translate(35 71) rotate(-48) scale(0.95 -0.95)"/><use href="#neem-leaves-l" transform="translate(42 59) rotate(-45) scale(0.90)"/><use href="#neem-leaves-l" transform="translate(44 61) rotate(-48) scale(0.90 -0.90)"/><use href="#neem-leaves-l" transform="translate(51 49) rotate(-45) scale(0.85)"/><use href="#neem-leaves-l" transform="translate(53 51) rotate(-48) scale(0.85 -0.85)"/><use href="#neem-leaves-l" transform="translate(60 39) rotate(-45) scale(0.80)"/><use href="#neem-leaves-l" transform="translate(62 41) rotate(-48) scale(0.80 -0.80)"/><use href="#neem-leaves-l" transform="translate(69 29) rotate(-45) scale(0.75)"/><use href="#neem-leaves-l" transform="translate(71 31) rotate(-48) scale(0.75 -0.75)"/><use href="#neem-leaves-l" transform="translate(78 18) rotate(-80) scale(.8)"/>`,
  // ---- garden & farm materials ---------------------------------------------------------------------
  'soil-bag': `<defs><linearGradient id="soil-bag-g" x1="0" x2="1"><stop offset="0" stop-color="#F2DFB0"/><stop offset=".6" stop-color="#DCC08A"/><stop offset="1" stop-color="#BFA06A"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="32" ry="4" fill="#000" opacity=".14"/>
  <path d="M22 38c-3 18-3 34 1 48 1 4 53 4 54 0 4-14 4-30 1-48z" fill="url(#soil-bag-g)"/>
  <path d="M22 60h56v14H22z" fill="#4E9A3A" opacity=".9"/><path d="M44 70c0-6 4-9 6-9 0 3-2 7-6 9zM52 70c0-5 4-8 8-8-1 4-4 7-8 8z" fill="#CDEFB0"/>
  <path d="M30 44l1 36" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
  <ellipse cx="50" cy="38" rx="29" ry="7" fill="#EBD5A2" stroke="#BFA06A" stroke-width="2"/>
  <path d="M25 38c4-10 14-16 25-16s21 6 25 16c-6 4-44 4-50 0z" fill="#6B4524"/><path d="M34 30c4-4 10-6 16-6" stroke="#9A6A40" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g fill="#9A6A40"><circle cx="58" cy="30" r="1.6"/><circle cx="44" cy="33" r="1.4"/><circle cx="64" cy="35" r="1.4"/></g>`,

  'compost': `<defs><radialGradient id="compost-g" cx=".45" cy=".2" r=".9"><stop offset="0" stop-color="#8E6440"/><stop offset=".6" stop-color="#5E3E22"/><stop offset="1" stop-color="#4A2E18"/></radialGradient></defs>
  <ellipse cx="50" cy="89" rx="42" ry="5" fill="#000" opacity=".14"/>
  <path d="M8 88c4-22 20-44 42-44s38 22 42 44c-24 4-60 4-84 0z" fill="url(#compost-g)"/>
  <path d="M30 56c6-8 14-12 22-12" stroke="#B08A5E" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M36 66l8-3-2 6zM62 74l7 2-6 4z" fill="#FFF3DE"/><path d="M52 58c4-4 10-4 12 0-4 3-8 3-12 0zM24 76c3-5 9-6 12-3-4 4-9 5-12 3z" fill="#6E9A3A"/>
  <g fill="#3A2210"><circle cx="46" cy="76" r="2"/><circle cx="70" cy="64" r="1.8"/><circle cx="28" cy="82" r="1.6"/><circle cx="58" cy="84" r="1.8"/><circle cx="76" cy="80" r="1.5"/></g>
  <g fill="#C8A06A"><circle cx="40" cy="80" r="1.3"/><circle cx="64" cy="66" r="1.3"/><circle cx="54" cy="70" r="1.2"/></g>
  <path d="M50 46c0-6 0-10 2-14M52 34c-4-4-10-4-12 0 4 3 8 3 12 0zM52 34c3-5 9-6 12-3-3 4-8 5-12 3z" stroke="#5DAA3A" stroke-width="2.5" fill="#5DAA3A" stroke-linecap="round"/>`,

  'compost-bin': `<defs><linearGradient id="compost-bin-g" x1="0" x2="1"><stop offset="0" stop-color="#6CC04A"/><stop offset=".55" stop-color="#3E9636"/><stop offset="1" stop-color="#2A742A"/></linearGradient></defs>
  <ellipse cx="50" cy="92" rx="30" ry="4" fill="#000" opacity=".14"/>
  <path d="M24 30h52l-4 58a3 3 0 0 1-3 3H31a3 3 0 0 1-3-3z" fill="url(#compost-bin-g)"/>
  <path d="M20 22h60a3 3 0 0 1 3 3v5H17v-5a3 3 0 0 1 3-3z" fill="#2E7A2C"/><rect x="42" y="15" width="16" height="8" rx="3" fill="#2E7A2C"/>
  <g fill="#1E5A22"><circle cx="34" cy="42" r="2"/><circle cx="44" cy="42" r="2"/><circle cx="56" cy="42" r="2"/><circle cx="66" cy="42" r="2"/></g>
  <rect x="38" y="70" width="24" height="14" rx="2" fill="#1E5A22"/><rect x="40" y="72" width="20" height="10" rx="1.5" fill="#6B4524"/>
  <path d="M50 64c-6 0-10-4-10-10 6 0 10 4 10 10zM50 64c0-8 4-12 10-12 0 6-4 12-10 12z" fill="#CDEFB0"/>
  <path d="M31 36l3 46" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`,

  'earthworm': `<ellipse cx="50" cy="84" rx="40" ry="4" fill="#000" opacity=".12"/>
  <path d="M12 74c8-18 22-20 30-8s20 14 28 0c5-8 11-12 17-10" stroke="#E2887A" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M12 74c8-18 22-20 30-8s20 14 28 0c5-8 11-12 17-10" stroke="#B85E54" stroke-width="12" fill="none" stroke-dasharray="1.4 5.5" opacity=".55"/>
  <path d="M60 76c4-1 8-4 10-8" stroke="#F2B0A0" stroke-width="12" fill="none"/>
  <path d="M16 68c7-12 18-14 25-5M46 70c6 6 14 7 20 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>
  <circle cx="88" cy="60" r="2.4" fill="#2B1A10"/><circle cx="88.8" cy="59.2" r=".8" fill="#fff"/>`,

  'kitchen-waste': `<ellipse cx="50" cy="88" rx="42" ry="5" fill="#000" opacity=".12"/>
  <path d="M10 86c6-10 16-14 30-12 10-6 26-6 34 0 8-2 14 4 16 12z" fill="#7E5232"/>
  <path d="M18 78c-2-14 4-24 12-28-2 10 0 20 6 28zM24 78c8-6 16-12 18-22 4 10 0 18-8 24z" fill="#F2C531"/><path d="M30 50l-2-4" stroke="#6B4A1A" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M54 54c-6-2-10 4-8 10 2 4 6 4 6 8s-2 6 0 8c4 2 10 0 12-4 2-6-4-8-4-12 0-4 4-6 2-8-2-2-6 0-8-2z" fill="#FFF0D6"/><path d="M54 54c-4-2-8 2-8 8M58 80c2 0 6-2 7-5" stroke="#D8343A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 54l1-6" stroke="#6B3E1E" stroke-width="2" stroke-linecap="round"/>
  <path d="M66 74c0-8 6-12 12-12s12 4 12 12c-2-2-4 0-6-2-2 2-4 0-6 2-2-2-4 0-6-2-2 2-4 0-6 2z" fill="#FFF6E8" stroke="#D9C4A0" stroke-width="1.2"/>
  <path d="M36 70c2-6 10-8 14-4-4 4-10 6-14 4zM74 56c4-6 12-6 14-2-4 4-10 4-14 2z" fill="#5DAA3A"/><path d="M40 82c4-4 10-4 14 0" stroke="#F57A1A" stroke-width="4" fill="none" stroke-linecap="round"/>`,

  'dry-leaves': `<ellipse cx="50" cy="86" rx="38" ry="4" fill="#000" opacity=".12"/>
  <path d="M14 76c6-20 22-30 42-28-6 18-20 30-42 28z" fill="#B8742E"/><path d="M14 76c14-10 28-20 42-28" stroke="#E8B878" stroke-width="1.6" fill="none"/>
  <path d="M46 82c-4-22 6-40 26-50 6 20-4 40-26 50z" fill="#D9A040"/><path d="M46 82c8-18 16-34 26-50" stroke="#F6D58E" stroke-width="1.6" fill="none"/>
  <path d="M30 60c2-16 14-28 30-30-2 16-14 28-30 30z" fill="#9A5226"/><path d="M30 60c10-10 20-20 30-30" stroke="#D99A62" stroke-width="1.5" fill="none"/>
  <path d="M62 84c8-10 20-14 30-10-8 10-20 14-30 10z" fill="#C8862E"/><path d="M62 84c10-4 20-8 30-10" stroke="#EEC07A" stroke-width="1.4" fill="none"/>
  <path d="M46 82l-4 6M14 76l-4 4" stroke="#7A4A1E" stroke-width="2" stroke-linecap="round"/>`,

  'cow-dung': `<defs><radialGradient id="cow-dung-g" cx=".45" cy=".25" r=".85"><stop offset="0" stop-color="#9A8450"/><stop offset=".6" stop-color="#6E5A30"/><stop offset="1" stop-color="#54441F"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="42" ry="5" fill="#000" opacity=".14"/>
  <path d="M10 80c0-10 12-16 22-16 2-8 12-14 20-12 8-4 20 0 22 8 10 0 18 8 16 18-4 6-76 8-80 2z" fill="url(#cow-dung-g)"/>
  <path d="M22 72c8-4 16-4 22-2M40 62c8-4 18-4 26 0M60 72c8-2 14 0 20 4" stroke="#B8A26A" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M30 66l10-6M66 64l8 4M50 78l10-2" stroke="#D8C07A" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="44" cy="56" rx="7" ry="2.5" fill="#fff" opacity=".2"/>`,

  'mulch': `<defs><linearGradient id="mulch-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5E38"/><stop offset="1" stop-color="#5E3E22"/></linearGradient></defs>
  <path d="M6 62h88v24a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="url(#mulch-g)"/>
  <g stroke-width="3.2" stroke-linecap="round"><path d="M10 62l10-3M24 64l12 1M40 61l8-4M58 61l10 2M72 64l12-3M84 60l8 2M14 68l8 2M66 68l9-2M30 68l8-2" stroke="#E2B860"/><path d="M18 60l8 4M34 60l10-2M64 59l8 4M78 62l6-4M8 66l6-2M88 66l-6 2M50 66l-8 1" stroke="#C88A3A"/></g>
  <path d="M51 60V32" stroke="#4E9A32" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M51 42c-6-10-18-12-24-6 6 8 18 10 24 6zM51 36c6-10 18-12 24-6-6 8-18 10-24 6z" fill="#5DB040"/>
  <g fill="#B88A5E"><ellipse cx="22" cy="80" rx="3" ry="2"/><ellipse cx="74" cy="82" rx="3" ry="2"/><ellipse cx="50" cy="86" rx="2.5" ry="1.5"/></g>`,

  'cocopeat': `<defs><linearGradient id="cocopeat-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A86A3E"/><stop offset="1" stop-color="#7A4626"/></linearGradient></defs>
  <ellipse cx="50" cy="88" rx="42" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M12 52l30-12 32 8-30 14z" fill="#C08050"/><path d="M12 52l32 10v26L12 78z" fill="url(#cocopeat-g)"/><path d="M44 62l30-14v26L44 88z" fill="#6A3C20"/>
  <g stroke="#D9A070" stroke-width="1.2" opacity=".7" stroke-linecap="round"><path d="M18 60l8 2M22 68l12 4M16 72l6 2M30 78l8 2M24 52l10-3M40 48l12 2M50 54l10-4"/></g>
  <g stroke="#3E2212" stroke-width="1.2" opacity=".5"><path d="M50 70l14-6M54 78l12-6"/></g>
  <path d="M62 88c0-10 6-16 14-16 10 0 16 6 16 16z" fill="#9A5E34"/>
  <g stroke="#D29A64" stroke-width="1.4" fill="none" stroke-linecap="round"><path d="M68 80c4-2 6 0 10-2M72 86c4-2 8 0 12-2M80 76c2 0 4 2 6 0"/></g>`,

  'net-pot': `<defs><linearGradient id="net-pot-g" x1="0" x2="1"><stop offset="0" stop-color="#7A808A"/><stop offset=".5" stop-color="#565B64"/><stop offset="1" stop-color="#3E434B"/></linearGradient></defs>
  <ellipse cx="50" cy="92" rx="24" ry="3.5" fill="#000" opacity=".14"/>
  <path d="M52 40V18M52 26c-6-8-16-8-20-2 6 6 14 6 20 2zM52 22c4-8 14-10 20-4-4 6-14 8-20 4z" stroke="#4E9A32" stroke-width="3" fill="#5DB040" stroke-linecap="round"/>
  <g fill="#E07A3A"><circle cx="36" cy="40" r="5.5"/><circle cx="47" cy="38" r="5.5"/><circle cx="58" cy="39" r="5.5"/><circle cx="67" cy="41" r="5"/></g><g fill="#fff" opacity=".4"><circle cx="34" cy="38" r="1.5"/><circle cx="45" cy="36" r="1.5"/><circle cx="56" cy="37" r="1.5"/></g>
  <path d="M28 44h44l-6 40a4 4 0 0 1-4 3H38a4 4 0 0 1-4-3z" fill="url(#net-pot-g)"/>
  <g fill="#E07A3A"><rect x="34" y="50" width="5" height="12" rx="2"/><rect x="44" y="50" width="5" height="12" rx="2"/><rect x="54" y="50" width="5" height="12" rx="2"/><rect x="63" y="50" width="4" height="12" rx="2"/><rect x="37" y="68" width="5" height="12" rx="2"/><rect x="47" y="68" width="5" height="12" rx="2"/><rect x="57" y="68" width="5" height="12" rx="2"/></g>
  <rect x="22" y="40" width="56" height="7" rx="3" fill="#8A909A"/>
  <path d="M46 87c-2 4-6 6-6 8M52 87v8M58 87c2 4 4 6 6 8" stroke="#F3E3C0" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,

  'fodder': `<defs><linearGradient id="fodder-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BDB5E"/><stop offset="1" stop-color="#3E8E2A"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="30" ry="4" fill="#000" opacity=".14"/>
  <path d="M42 58C34 42 22 30 8 26c10 10 20 22 28 36zM46 58c-6-18-4-36 2-50 6 16 6 34 2 50zM54 58c4-18 14-32 28-40-6 14-14 28-20 42zM58 62c10-12 22-18 34-18-10 6-20 14-28 22zM40 62c-10-8-22-10-32-8 10 4 20 8 28 14z" fill="url(#fodder-g)"/>
  <path d="M38 60h24l2 28H36z" fill="#6AB03A"/><path d="M41 62l-1 24M46 62v24M50 62v24M54 62v24M59 62l1 24" stroke="#3E8E2A" stroke-width="1.6"/>
  <ellipse cx="50" cy="88" rx="14" ry="3.5" fill="#C8E89A"/><g fill="#8CC85A"><circle cx="42" cy="88" r="1.6"/><circle cx="47" cy="89" r="1.6"/><circle cx="52" cy="88" r="1.6"/><circle cx="57" cy="89" r="1.6"/></g>
  <path d="M36 68c8 3 20 3 28 0l-1 7c-8 3-18 3-26 0z" fill="#C9A36A"/><path d="M48 50c-2-12-2-24 0-36M58 52c6-12 12-22 20-30" stroke="#D8F2B8" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,

  'hay': `<defs><linearGradient id="hay-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7D774"/><stop offset="1" stop-color="#D9A83A"/></linearGradient></defs>
  <ellipse cx="50" cy="90" rx="42" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M10 44l22-12h58l-22 12z" fill="#FBE59A"/><path d="M10 44h58v44H10z" fill="url(#hay-g)"/><path d="M68 44l22-12v44L68 88z" fill="#C9962E"/>
  <g stroke="#B88220" stroke-width="1.5" opacity=".6" stroke-linecap="round"><path d="M14 52h16M36 56h20M16 64h12M40 70h18M14 78h22M48 82h14M74 50l10-6M74 64l12-8M74 78l10-6"/></g>
  <g stroke="#FFF2BE" stroke-width="1.5" opacity=".8" stroke-linecap="round"><path d="M20 38h18M48 36h16M60 40h12"/></g>
  <path d="M28 44v44M50 44v44M28 44l22-12M50 44l22-12" stroke="#A8622A" stroke-width="2.5"/>
  <path d="M10 88l-4 3M18 88l-2 4M60 88l2 4M90 74l4 2" stroke="#E8B848" stroke-width="2" stroke-linecap="round"/>`,

  'feed-bag': `<defs><linearGradient id="feed-bag-g" x1="0" x2="1"><stop offset="0" stop-color="#E6C88E"/><stop offset=".6" stop-color="#C9A266"/><stop offset="1" stop-color="#A8824A"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="36" ry="4" fill="#000" opacity=".14"/>
  <path d="M38 26c-10 6-16 20-16 34 0 12 2 22 6 28 4 2 40 2 44 0 4-6 6-16 6-28 0-14-6-28-16-34z" fill="url(#feed-bag-g)"/>
  <path d="M38 26c-2-6 0-12 4-14 4 3 12 3 16 0 4 2 6 8 4 14z" fill="#D9B87A"/><path d="M37 26c8 2 18 2 26 0" stroke="#7A4A1E" stroke-width="3" stroke-linecap="round"/>
  <g stroke="#9A7A42" stroke-width="1" opacity=".4"><path d="M30 44h40M28 56h44M28 68h44M30 80h40"/></g>
  <path d="M50 76V48M50 56c-4-2-6-6-6-10 4 2 6 6 6 10zM50 56c4-2 6-6 6-10-4 2-6 6-6 10zM50 66c-4-2-6-6-6-10 4 2 6 6 6 10zM50 66c4-2 6-6 6-10-4 2-6 6-6 10z" stroke="#7A5A22" stroke-width="2" fill="#7A5A22" stroke-linecap="round"/>
  <g fill="#F2C24A"><ellipse cx="80" cy="88" rx="2.5" ry="1.6"/><ellipse cx="86" cy="86" rx="2.5" ry="1.6"/><ellipse cx="84" cy="90" rx="2.5" ry="1.6"/><ellipse cx="90" cy="89" rx="2.2" ry="1.5"/><ellipse cx="76" cy="90" rx="2.2" ry="1.5"/></g>`,

  'egg': `<defs><radialGradient id="egg-g" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#FFF4E2"/><stop offset=".6" stop-color="#EBCB9E"/><stop offset="1" stop-color="#C99A66"/></radialGradient></defs>
  <ellipse cx="50" cy="90" rx="24" ry="4" fill="#000" opacity=".14"/>
  <path d="M50 12c-16 0-28 26-28 46 0 18 12 30 28 30s28-12 28-30c0-20-12-46-28-46z" fill="url(#egg-g)"/>
  <ellipse cx="38" cy="38" rx="5" ry="10" fill="#fff" opacity=".7" transform="rotate(20 38 38)"/>`,

  'milk-can': `<defs><linearGradient id="milk-can-g" x1="0" x2="1"><stop offset="0" stop-color="#9AA4AE"/><stop offset=".3" stop-color="#EEF2F5"/><stop offset=".6" stop-color="#B8C2CC"/><stop offset="1" stop-color="#7A8692"/></linearGradient></defs>
  <ellipse cx="50" cy="92" rx="26" ry="4" fill="#000" opacity=".14"/>
  <path d="M28 52c0-8 8-12 14-14V30h16v8c6 2 14 6 14 14v34a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4z" fill="url(#milk-can-g)"/>
  <rect x="38" y="20" width="24" height="11" rx="3" fill="url(#milk-can-g)"/><rect x="45" y="14" width="10" height="7" rx="3" fill="#8A96A2"/>
  <path d="M28 60h44M28 80h44" stroke="#7A8692" stroke-width="2.5"/>
  <path d="M28 54c-8 0-10 12-2 14M72 54c8 0 10 12 2 14" stroke="#7A8692" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

  'water-trough': `<defs><linearGradient id="water-trough-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8C2B8"/><stop offset="1" stop-color="#8E877C"/></linearGradient><linearGradient id="water-trough-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD0F2"/><stop offset="1" stop-color="#3A9AD0"/></linearGradient></defs>
  <ellipse cx="50" cy="88" rx="44" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M6 48h88l-6 36a4 4 0 0 1-4 3H16a4 4 0 0 1-4-3z" fill="url(#water-trough-g)"/>
  <path d="M12 52h76l-2 10H14z" fill="url(#water-trough-w)"/>
  <path d="M4 46h92v6H4z" fill="#D9D3C8"/><path d="M22 57h14M50 57h22" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>
  <path d="M18 70h20M54 76h18M30 80h10" stroke="#7A7368" stroke-width="1.5" opacity=".5" stroke-linecap="round"/>`,

  'nest': `<defs><linearGradient id="nest-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B88450"/><stop offset="1" stop-color="#7A4E2A"/></linearGradient><radialGradient id="nest-e" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#F2FBFF"/><stop offset="1" stop-color="#8CC8E0"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="40" ry="4.5" fill="#000" opacity=".14"/>
  <ellipse cx="50" cy="56" rx="34" ry="9" fill="#5E3A1E"/>
  <ellipse cx="38" cy="54" rx="8" ry="10" fill="url(#nest-e)"/><ellipse cx="52" cy="52" rx="8" ry="10" fill="url(#nest-e)"/><ellipse cx="64" cy="55" rx="7.5" ry="9.5" fill="url(#nest-e)"/>
  <path d="M14 56c2 18 18 28 36 28s34-10 36-28c-10 6-24 8-36 8s-26-2-36-8z" fill="url(#nest-g)"/>
  <g stroke="#D9A86A" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M18 62q20 10 44 4M24 70q16 8 40 0M40 80q14 2 26-4M16 58l-6-4M84 58l8-5M30 66q10 4 26 2"/></g>
  <g stroke="#5E3A1E" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M22 66q14 6 30 4M50 76q14-2 24-8M78 64q-6 6-14 6"/></g>`,

  'bird-bath': `<defs><linearGradient id="bird-bath-g" x1="0" x2="1"><stop offset="0" stop-color="#D9D2C6"/><stop offset=".5" stop-color="#B9B0A2"/><stop offset="1" stop-color="#8E8578"/></linearGradient></defs>
  <ellipse cx="50" cy="92" rx="24" ry="4" fill="#000" opacity=".14"/>
  <path d="M42 54h16l-3 28h-10z" fill="url(#bird-bath-g)"/><path d="M32 84c0-4 8-6 18-6s18 2 18 6v6H32z" fill="url(#bird-bath-g)"/>
  <path d="M12 40c2 10 18 16 38 16s36-6 38-16z" fill="url(#bird-bath-g)"/>
  <ellipse cx="50" cy="40" rx="38" ry="7" fill="#CFC8BC"/><ellipse cx="50" cy="40" rx="33" ry="5" fill="#6CC2EA"/>
  <path d="M34 40q8-2 16 0M58 39q6-1 10 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>
  <g fill="#7FD0F2"><circle cx="30" cy="30" r="2"/><circle cx="24" cy="24" r="1.5"/><circle cx="72" cy="30" r="2"/><circle cx="78" cy="25" r="1.5"/></g>`,

  'insect-hotel': `<defs><linearGradient id="insect-hotel-g" x1="0" x2="1"><stop offset="0" stop-color="#C8905A"/><stop offset="1" stop-color="#94603A"/></linearGradient></defs>
  <ellipse cx="50" cy="93" rx="32" ry="3.5" fill="#000" opacity=".14"/>
  <path d="M50 8L12 36h76z" fill="#A8562E"/><path d="M50 14L22 34h56z" fill="#E8C890"/>
  <rect x="18" y="34" width="64" height="58" rx="2" fill="url(#insect-hotel-g)"/>
  <rect x="22" y="38" width="56" height="16" fill="#6B4524"/><rect x="22" y="58" width="26" height="30" fill="#6B4524"/><rect x="52" y="58" width="26" height="30" fill="#E8C870"/>
  <g fill="#E8C890" stroke="#B8844A" stroke-width="1.5"><circle cx="28" cy="46" r="4.5"/><circle cx="38" cy="46" r="4.5"/><circle cx="48" cy="46" r="4.5"/><circle cx="58" cy="46" r="4.5"/><circle cx="68" cy="46" r="4.5"/></g>
  <g fill="#5E3A1E"><circle cx="28" cy="46" r="1.8"/><circle cx="38" cy="46" r="1.8"/><circle cx="48" cy="46" r="1.8"/><circle cx="58" cy="46" r="1.8"/><circle cx="68" cy="46" r="1.8"/></g>
  <ellipse cx="35" cy="73" rx="9" ry="12" fill="#9A5E2E"/><path d="M28 66l14 0M27 72l16 0M27 78l16 0M29 84l12 0" stroke="#5E3A1E" stroke-width="2" stroke-dasharray="3 2"/>
  <g stroke="#C8962E" stroke-width="1.5"><path d="M54 62h22M54 68h22M54 74h22M54 80h22M54 86h22"/></g>
  <path d="M42 38v-4" stroke="#6B4524" stroke-width="2"/>`,

  'beehive': `<defs><linearGradient id="beehive-g" x1="0" x2="1"><stop offset="0" stop-color="#FFD966"/><stop offset=".6" stop-color="#EDB22E"/><stop offset="1" stop-color="#C98A1A"/></linearGradient></defs>
  <ellipse cx="50" cy="91" rx="34" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M18 88c-2-36 12-66 32-66s34 30 32 66z" fill="url(#beehive-g)"/>
  <path d="M26 42h48M21 56h58M18 70h64M18 84h64" stroke="#B87A12" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  <path d="M38 28q-6 8-6 14" stroke="#FFF0B0" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
  <path d="M42 88a8 8 0 0 1 16 0z" fill="#5E3A12"/>
  <g transform="translate(80 30)"><ellipse rx="6" ry="4.5" fill="#F5C531"/><path d="M-2-4v8M2-4v8" stroke="#2B1A10" stroke-width="2"/><ellipse cx="-1" cy="-5" rx="3.5" ry="2.5" fill="#E2F2FF" opacity=".9"/></g>
  <g transform="translate(16 40) scale(.8)"><ellipse rx="6" ry="4.5" fill="#F5C531"/><path d="M-2-4v8M2-4v8" stroke="#2B1A10" stroke-width="2"/><ellipse cx="1" cy="-5" rx="3.5" ry="2.5" fill="#E2F2FF" opacity=".9"/></g>`,
  // ---- sky & water ------------------------------------------------------------------------------
  'sun': `<defs><radialGradient id="sun-g" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF08A"/><stop offset=".6" stop-color="#FFC531"/><stop offset="1" stop-color="#F59A12"/></radialGradient><path id="sun-r" d="M-4-30L0-44 4-30z" fill="#FFB321" stroke="#FFB321" stroke-width="4" stroke-linejoin="round"/></defs>
  <g transform="translate(50 50)"><use href="#sun-r"/><use href="#sun-r" transform="rotate(30)"/><use href="#sun-r" transform="rotate(60)"/><use href="#sun-r" transform="rotate(90)"/><use href="#sun-r" transform="rotate(120)"/><use href="#sun-r" transform="rotate(150)"/><use href="#sun-r" transform="rotate(180)"/><use href="#sun-r" transform="rotate(210)"/><use href="#sun-r" transform="rotate(240)"/><use href="#sun-r" transform="rotate(270)"/><use href="#sun-r" transform="rotate(300)"/><use href="#sun-r" transform="rotate(330)"/>
  <circle r="25" fill="url(#sun-g)"/><ellipse cx="-9" cy="-10" rx="7" ry="4.5" fill="#fff" opacity=".45" transform="rotate(-35 -9 -10)"/></g>`,

  'moon': `<defs><radialGradient id="moon-g" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#FFF4B8"/><stop offset=".6" stop-color="#F7D768"/><stop offset="1" stop-color="#E2B23A"/></radialGradient></defs>
  <path d="M60 12C40 14 22 30 22 52s18 38 40 38c10 0 18-3 24-8-26 2-44-14-44-36 0-14 8-26 18-34z" fill="url(#moon-g)"/>
  <g fill="#E2B23A" opacity=".55"><circle cx="34" cy="58" r="4"/><circle cx="44" cy="74" r="3"/><circle cx="32" cy="40" r="2.5"/></g>
  <path d="M74 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM84 50l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#F7C531"/>`,

  'cloud': `<defs><linearGradient id="cloud-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#EEF3F8"/><stop offset="1" stop-color="#BACBDC"/></linearGradient></defs>
  <path d="M24 74c-10 0-16-7-16-15s7-15 16-14c2-12 12-20 24-20 11 0 20 7 23 17 11 0 21 7 21 17 0 9-7 15-17 15z" fill="url(#cloud-g)"/>
  <path d="M24 74c-10 0-16-7-16-15s7-15 16-14c2-12 12-20 24-20 11 0 20 7 23 17 11 0 21 7 21 17 0 9-7 15-17 15z" fill="none" stroke="#A9BCCF" stroke-width="1.5"/>
  <path d="M30 42q4-10 16-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  'rain': `<defs><linearGradient id="rain-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6D2DE"/><stop offset="1" stop-color="#7E92A8"/></linearGradient><path id="rain-d" d="M0-6C2-2 4 1 4 3a4 4 0 0 1-8 0c0-2 2-5 4-9z" fill="#3E9AE0"/></defs>
  <path d="M24 58c-10 0-16-6-16-14s7-14 16-13c2-11 12-19 24-19 11 0 20 7 23 16 11 0 21 7 21 16 0 8-7 14-17 14z" fill="url(#rain-g)"/>
  <path d="M30 30q4-9 16-11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
  <use href="#rain-d" transform="translate(28 70)"/><use href="#rain-d" transform="translate(46 76)"/><use href="#rain-d" transform="translate(64 70)"/><use href="#rain-d" transform="translate(36 88)"/><use href="#rain-d" transform="translate(56 92)"/><use href="#rain-d" transform="translate(74 86)"/>`,

  'water-drop': `<defs><radialGradient id="water-drop-g" cx=".4" cy=".6" r=".7"><stop offset="0" stop-color="#9FE0FF"/><stop offset=".6" stop-color="#3EA6EA"/><stop offset="1" stop-color="#1E78C8"/></radialGradient></defs>
  <ellipse cx="50" cy="91" rx="22" ry="4" fill="#000" opacity=".12"/>
  <path d="M50 8C40 26 22 44 22 60a28 28 0 0 0 56 0C78 44 60 26 50 8z" fill="url(#water-drop-g)"/>
  <path d="M34 58q0 12 10 18" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/><circle cx="36" cy="48" r="2.5" fill="#fff" opacity=".7"/>`,

  // ---- insects & small creatures -------------------------------------------------------------------
  'bee': `<defs><radialGradient id="bee-g" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#FFE47A"/><stop offset=".6" stop-color="#F7C21E"/><stop offset="1" stop-color="#D99A0E"/></radialGradient></defs>
  <ellipse cx="50" cy="88" rx="26" ry="4" fill="#000" opacity=".1"/>
  <ellipse cx="40" cy="30" rx="12" ry="18" fill="#E6F4FF" opacity=".85" transform="rotate(-25 40 30)" stroke="#9CC8E6" stroke-width="1.5"/><ellipse cx="58" cy="28" rx="11" ry="17" fill="#E6F4FF" opacity=".85" transform="rotate(20 58 28)" stroke="#9CC8E6" stroke-width="1.5"/>
  <path d="M84 58l8 2-8 3z" fill="#4A3A2A"/>
  <ellipse cx="54" cy="58" rx="30" ry="21" fill="url(#bee-g)"/>
  <path d="M50 38c-4 12-4 28 0 40M64 40c-3 10-3 26 0 36M76 46c-2 8-2 16 0 24" stroke="#3A2A1A" stroke-width="6" fill="none"/>
  <circle cx="24" cy="56" r="13" fill="#4A3828"/><circle cx="20" cy="53" r="3.6" fill="#fff"/><circle cx="19" cy="53" r="2" fill="#2B1A10"/><path d="M14 61q4 3 8 0" stroke="#F7C21E" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M20 44c-4-8-8-12-12-12M27 43c0-8 2-14 6-16" stroke="#4A3828" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="8" cy="32" r="2.5" fill="#4A3828"/><circle cx="33" cy="27" r="2.5" fill="#4A3828"/>
  <ellipse cx="50" cy="46" rx="10" ry="3" fill="#fff" opacity=".4"/>`,

  'butterfly': `<defs><linearGradient id="butterfly-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB547"/><stop offset="1" stop-color="#F27A12"/></linearGradient></defs>
  <path d="M48 46C40 24 24 12 12 16 2 20 6 40 16 48c8 6 22 4 32-2z" fill="url(#butterfly-g)" stroke="#4A2A1A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M52 46C60 24 76 12 88 16c10 4 6 24-4 32-8 6-22 4-32-2z" fill="url(#butterfly-g)" stroke="#4A2A1A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M48 52c-10 0-24 4-28 16-3 10 6 18 14 14 8-4 12-16 14-30zM52 52c10 0 24 4 28 16 3 10-6 18-14 14-8-4-12-16-14-30z" fill="#FFC86A" stroke="#4A2A1A" stroke-width="3" stroke-linejoin="round"/>
  <g fill="#fff"><circle cx="14" cy="24" r="2.5"/><circle cx="22" cy="19" r="2"/><circle cx="86" cy="24" r="2.5"/><circle cx="78" cy="19" r="2"/><circle cx="28" cy="74" r="2"/><circle cx="72" cy="74" r="2"/></g>
  <path d="M30 30l12 12M70 30L58 42" stroke="#C85A0A" stroke-width="2" opacity=".5" stroke-linecap="round"/>
  <ellipse cx="50" cy="52" rx="4" ry="20" fill="#4A2A1A"/><circle cx="50" cy="31" r="5" fill="#4A2A1A"/>
  <path d="M48 28c-4-8-8-12-12-14M52 28c4-8 8-12 12-14" stroke="#4A2A1A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="36" cy="14" r="2.2" fill="#4A2A1A"/><circle cx="64" cy="14" r="2.2" fill="#4A2A1A"/>`,

  'ladybird': `<defs><radialGradient id="ladybird-g" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FF6A52"/><stop offset=".6" stop-color="#E5281E"/><stop offset="1" stop-color="#B01810"/></radialGradient></defs>
  <ellipse cx="50" cy="90" rx="30" ry="4" fill="#000" opacity=".12"/>
  <path d="M24 46l-10-6M22 62l-12 2M28 76l-10 8M76 46l10-6M78 62l12 2M72 76l10 8" stroke="#3A2A2A" stroke-width="3" stroke-linecap="round"/>
  <circle cx="50" cy="28" r="13" fill="#3A2A2A"/><circle cx="44" cy="24" r="3" fill="#fff"/><circle cx="56" cy="24" r="3" fill="#fff"/>
  <path d="M44 18c-3-6-6-8-9-8M56 18c3-6 6-8 9-8" stroke="#3A2A2A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="60" r="29" fill="url(#ladybird-g)"/>
  <path d="M50 31v58" stroke="#3A2A2A" stroke-width="2.5"/>
  <g fill="#3A2A2A"><circle cx="36" cy="48" r="5.5"/><circle cx="64" cy="48" r="5.5"/><circle cx="32" cy="66" r="5"/><circle cx="68" cy="66" r="5"/><circle cx="42" cy="80" r="4"/><circle cx="58" cy="80" r="4"/></g>
  <ellipse cx="38" cy="40" rx="6" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 38 40)"/>`,

  'aphid': `<defs><radialGradient id="aphid-g" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#D8F59A"/><stop offset=".6" stop-color="#9ED45A"/><stop offset="1" stop-color="#6AAA32"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="32" ry="4" fill="#000" opacity=".1"/>
  <path d="M40 66l-8 16M50 70l-2 16M62 68l6 16M36 56l-14 6M30 50l-14-2" stroke="#5E8A2A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M74 52l14-4M72 60l14 4" stroke="#5E8A2A" stroke-width="3" stroke-linecap="round"/>
  <path d="M34 54c0-14 14-24 30-22 14 2 20 12 18 22-2 12-16 18-30 16-12-2-18-6-18-16z" fill="url(#aphid-g)"/>
  <circle cx="28" cy="48" r="10" fill="#9ED45A"/><circle cx="24" cy="45" r="2.8" fill="#2B1A10"/><circle cx="23" cy="44" r="1" fill="#fff"/>
  <path d="M24 39c-6-10-6-20 2-28M30 38c4-10 12-16 22-18" stroke="#5E8A2A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <ellipse cx="54" cy="40" rx="10" ry="3.5" fill="#fff" opacity=".5"/>
  <g transform="translate(70 22) scale(.45)"><path d="M34 54c0-14 14-24 30-22 14 2 20 12 18 22-2 12-16 18-30 16-12-2-18-6-18-16z" fill="url(#aphid-g)"/><circle cx="28" cy="48" r="10" fill="#9ED45A"/><circle cx="24" cy="45" r="3" fill="#2B1A10"/></g>`,

  'caterpillar': `<defs><radialGradient id="caterpillar-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#C8F27A"/><stop offset=".7" stop-color="#6CC23A"/><stop offset="1" stop-color="#3E9030"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="40" ry="4" fill="#000" opacity=".12"/>
  <g fill="#3E7A2A"><circle cx="16" cy="82" r="3"/><circle cx="29" cy="82" r="3"/><circle cx="54" cy="82" r="3"/><circle cx="67" cy="82" r="3"/></g>
  <g fill="url(#caterpillar-g)"><circle cx="16" cy="72" r="11"/><circle cx="29" cy="70" r="12"/><circle cx="41" cy="60" r="12"/><circle cx="54" cy="70" r="12"/><circle cx="67" cy="70" r="12"/></g>
  <g fill="#F7D23A"><circle cx="29" cy="64" r="2.2"/><circle cx="41" cy="54" r="2.2"/><circle cx="54" cy="64" r="2.2"/><circle cx="67" cy="64" r="2.2"/><circle cx="16" cy="67" r="2"/></g>
  <circle cx="80" cy="60" r="14" fill="url(#caterpillar-g)"/>
  <circle cx="78" cy="57" r="3.5" fill="#2B1A10"/><circle cx="88" cy="57" r="3.5" fill="#2B1A10"/><circle cx="79" cy="56" r="1.2" fill="#fff"/><circle cx="89" cy="56" r="1.2" fill="#fff"/>
  <path d="M80 66q4 3 8 0" stroke="#2B1A10" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M76 47l-4-10M86 47l4-10" stroke="#3E7A2A" stroke-width="2.2" stroke-linecap="round"/><circle cx="72" cy="36" r="2.6" fill="#E5402A"/><circle cx="90" cy="36" r="2.6" fill="#E5402A"/>`,

  'ant': `<defs><radialGradient id="ant-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#C8643A"/><stop offset=".6" stop-color="#9A3A1C"/><stop offset="1" stop-color="#6E2410"/></radialGradient></defs>
  <ellipse cx="50" cy="84" rx="38" ry="4" fill="#000" opacity=".12"/>
  <g stroke="#7A2E14" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M46 60l-8 8-4 12M50 60l0 10 4 10M54 58l8 8 10 10M46 56l-10-4-8 6M54 56l12-6 10 4"/></g>
  <ellipse cx="72" cy="58" rx="17" ry="12" fill="url(#ant-g)"/><ellipse cx="50" cy="56" rx="9" ry="7" fill="url(#ant-g)"/><circle cx="28" cy="50" r="11" fill="url(#ant-g)"/>
  <circle cx="23" cy="47" r="2.6" fill="#fff"/><circle cx="22.5" cy="47" r="1.5" fill="#2B1A10"/>
  <path d="M24 40c-4-10-10-14-16-14M30 40c0-10 4-16 10-20" stroke="#7A2E14" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <g fill="#fff" opacity=".4"><ellipse cx="68" cy="52" rx="6" ry="2.5"/><ellipse cx="26" cy="44" rx="3" ry="1.5"/></g>`,

  'snail': `<defs><radialGradient id="snail-g" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#F7C27A"/><stop offset=".6" stop-color="#D9843A"/><stop offset="1" stop-color="#A85A22"/></radialGradient></defs>
  <ellipse cx="50" cy="86" rx="40" ry="4" fill="#000" opacity=".12"/>
  <path d="M10 84c0-8 8-10 16-10h56c6 0 8 2 8 6 0 4-4 6-10 6H14c-3 0-4-1-4-2z" fill="#B8C49A"/>
  <path d="M80 76c4-10 4-20 2-28M86 76c4-10 6-18 8-26" stroke="#B8C49A" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="82" cy="46" r="3.4" fill="#4A4A3A"/><circle cx="94" cy="48" r="3.4" fill="#4A4A3A"/>
  <circle cx="48" cy="52" r="28" fill="url(#snail-g)"/>
  <path d="M48 52c4 0 6-4 4-7-3-4-10-2-11 3-2 7 5 13 12 12 10-1 15-12 11-21-5-11-19-14-28-7-11 8-11 25-1 33" stroke="#8A4A1A" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="36" cy="34" rx="7" ry="3.5" fill="#fff" opacity=".4" transform="rotate(-35 36 34)"/>
  <path d="M84 72q4 2 6 0" stroke="#4A4A3A" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,

  'spider': `<defs><radialGradient id="spider-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8A6A7A"/><stop offset=".6" stop-color="#4E3A46"/><stop offset="1" stop-color="#3A2A34"/></radialGradient></defs>
  <path d="M50 0v40" stroke="#B8B0A8" stroke-width="1.5"/>
  <g stroke="#6E5662" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M42 56l-14-10-8 8M42 60l-18-2-6 10M42 64l-14 8-2 12M44 68l-8 12 0 10M58 56l14-10 8 8M58 60l18-2 6 10M58 64l14 8 2 12M56 68l8 12 0 10"/></g>
  <circle cx="50" cy="46" r="9" fill="url(#spider-g)"/>
  <ellipse cx="50" cy="68" rx="15" ry="17" fill="url(#spider-g)"/>
  <path d="M42 64h16M44 72h12M46 79h8" stroke="#F2C531" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="46" cy="45" r="2.6" fill="#fff"/><circle cx="54" cy="45" r="2.6" fill="#fff"/><circle cx="46.4" cy="45.4" r="1.3" fill="#2B1A10"/><circle cx="54.4" cy="45.4" r="1.3" fill="#2B1A10"/>
  <ellipse cx="45" cy="60" rx="4" ry="2" fill="#fff" opacity=".3" transform="rotate(-30 45 60)"/>`,

  'frog': `<defs><radialGradient id="frog-g" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#A6E26A"/><stop offset=".6" stop-color="#5BB43A"/><stop offset="1" stop-color="#3A8A2A"/></radialGradient></defs>
  <ellipse cx="50" cy="90" rx="36" ry="4.5" fill="#000" opacity=".14"/>
  <path d="M22 78c-8 2-12 8-8 12h18M78 78c8 2 12 8 8 12H68" fill="#4E9E32"/>
  <path d="M20 66c0-18 14-30 30-30s30 12 30 30c0 14-12 24-30 24S20 80 20 66z" fill="url(#frog-g)"/>
  <ellipse cx="50" cy="72" rx="18" ry="14" fill="#E2F5B8"/>
  <path d="M36 88c-2-6 0-10 4-10M64 88c2-6 0-10-4-10" stroke="#3A8A2A" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="34" cy="38" r="12" fill="url(#frog-g)"/><circle cx="66" cy="38" r="12" fill="url(#frog-g)"/>
  <circle cx="34" cy="37" r="7.5" fill="#fff"/><circle cx="66" cy="37" r="7.5" fill="#fff"/><circle cx="35" cy="38" r="4.2" fill="#2B1A10"/><circle cx="65" cy="38" r="4.2" fill="#2B1A10"/><circle cx="36.5" cy="36.5" r="1.4" fill="#fff"/><circle cx="66.5" cy="36.5" r="1.4" fill="#fff"/>
  <path d="M38 56q12 8 24 0" stroke="#2A6A20" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <circle cx="30" cy="58" r="3.5" fill="#F3A07A" opacity=".6"/><circle cx="70" cy="58" r="3.5" fill="#F3A07A" opacity=".6"/>`,
};
