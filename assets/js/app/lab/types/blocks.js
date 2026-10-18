// Blocks lab: Scratch-style block coding. Drag notched blocks from the palette into a script,
// wrap blocks inside C-shaped "repeat" / "if" blocks, then run the script on the stage.
// Modes (SPEC §2.15): maze (reach the flag, collect coins, avoid bushes), dance (copy a dance:
// optional cfg.target = ['move','jump',…]; a built-in dance is used when absent), sensor (Arduino +
// LED + PIR: "if motion → LED on, wait, LED off", tested by a cat walking past).
import { h, esc, sparkle, shake } from '../kit.js';

export const meta = { title: 'Block coding', needs: ['gsap'] };

const CAT = { motion: '#4C97FF', looks: '#9966FF', sound: '#CF63CF', control: '#FFAB19', events: '#FFBF00', arduino: '#0FBD8C' };
const DARK = { motion: '#3373CC', looks: '#774DCB', sound: '#BD42BD', control: '#CF8B17', events: '#CC9900', arduino: '#0B8E69' };
const B = {
  move: { cat: 'motion', label: 'move', arg: { vals: [1, 2, 3, 4, 5], def: 1, after: 'steps' }, icon: '➜' },
  turnLeft: { cat: 'motion', label: 'turn ↺ left', icon: '↺' },
  turnRight: { cat: 'motion', label: 'turn ↻ right', icon: '↻' },
  jump: { cat: 'motion', label: 'jump', icon: '⤒' },
  say: { cat: 'looks', label: 'say', arg: { vals: ['Hello!', 'Namaste!', 'Yay!', 'Meow!'], def: 'Hello!' }, icon: '💬' },
  playSound: { cat: 'sound', label: 'play sound', arg: { vals: ['meow', 'beep', 'drum'], def: 'meow' }, icon: '♪' },
  wait: { cat: 'control', label: 'wait', arg: { vals: [1, 2, 3], def: 1, after: 'sec' }, icon: '⏱' },
  repeat: { cat: 'control', label: 'repeat', arg: { vals: [2, 3, 4, 5, 6, 8, 10], def: 3 }, c: true, icon: '🔁' },
  ifSensor: { cat: 'control', label: 'if motion seen then', c: true, icon: '❓' },
  ledOn: { cat: 'arduino', label: 'turn LED on', icon: '💡' },
  ledOff: { cat: 'arduino', label: 'turn LED off', icon: '⚫' },
};
const DIRS = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] }, ORDER = ['up', 'right', 'down', 'left'];
const T = 64; // stage tile size (viewBox units)
const shortName = o => ({ move: 'move', turnLeft: 'left', turnRight: 'right', jump: 'jump', say: 'say', playSound: 'sound' }[o] || o);

/* ---------------------------------------------------------------- shapes */
const NOTCH = 'l6 6 h20 l6 -6';
const TAB = 'l-6 6 h-20 l-6 -6';
function stackPath(w, hh) { return `M0 4 a4 4 0 0 1 4 -4 H16 ${NOTCH} H${w - 4} a4 4 0 0 1 4 4 V${hh - 4} a4 4 0 0 1 -4 4 H48 ${TAB} H4 a4 4 0 0 1 -4 -4 Z`; }
function hatPath(w, hh) { return `M0 22 C20 -6 76 -6 100 18 H${w - 4} a4 4 0 0 1 4 4 V${hh - 4} a4 4 0 0 1 -4 4 H48 ${TAB} H4 a4 4 0 0 1 -4 -4 Z`; }
function cPath(w, top, inner, foot) {
  const y1 = top, y2 = top + inner, y3 = y2 + foot;
  return `M0 4 a4 4 0 0 1 4 -4 H16 ${NOTCH} H${w - 4} a4 4 0 0 1 4 4 V${y1 - 4} a4 4 0 0 1 -4 4 H64 ${TAB} H20 a4 4 0 0 0 -4 4 V${y2 - 4} a4 4 0 0 0 4 4 H32 ${NOTCH} H${w - 4} a4 4 0 0 1 4 4 V${y3 - 4} a4 4 0 0 1 -4 4 H48 ${TAB} H4 a4 4 0 0 1 -4 -4 Z`;
}

/* ---------------------------------------------------------------- art */
function catArt() {
  return `<g class="lb-catbody"><ellipse cx="0" cy="2" rx="30" ry="5" fill="#000" opacity=".16"/>
    <path class="lb-tail" d="M-24 -22 Q-44 -34 -36 -52" stroke="#E8833A" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="-20" y="-16" width="8" height="18" rx="4" fill="#D9701F"/><rect x="10" y="-16" width="8" height="18" rx="4" fill="#D9701F"/>
    <ellipse cx="-2" cy="-22" rx="26" ry="14" fill="#F0913F"/><path d="M-16 -32 q4 6 0 13 M-6 -35 q4 7 0 15" stroke="#D9701F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="-1" cy="-15" rx="18" ry="6" fill="#FBE3C8"/>
    <rect x="-13" y="-16" width="8" height="18" rx="4" fill="#F0913F"/><rect x="16" y="-16" width="8" height="18" rx="4" fill="#F0913F"/>
    <g transform="translate(20 -40)"><path d="M-12 -6 L-9 -22 L-1 -12 Z M12 -6 L9 -22 L1 -12 Z" fill="#E8833A"/><path d="M-9 -9 L-8 -18 L-3 -12 Z M9 -9 L8 -18 L3 -12 Z" fill="#F7B9B0"/>
    <circle r="15" fill="#F0913F"/><ellipse cx="3" cy="5" rx="9" ry="6.5" fill="#FBE3C8"/><ellipse cx="-4" cy="-2" rx="2.4" ry="3.3" fill="#2B1A10"/><ellipse cx="8" cy="-2" rx="2.4" ry="3.3" fill="#2B1A10"/>
    <circle cx="-3.4" cy="-3.4" r=".9" fill="#fff"/><circle cx="8.6" cy="-3.4" r=".9" fill="#fff"/><path d="M2 2.5 l2 2 l2 -2 Z" fill="#E86A7A"/><path d="M4 4.5 q-3 3.5 -6 1.5 M4 4.5 q3 3.5 6 1.5" stroke="#2B1A10" stroke-width="1.1" fill="none"/></g></g>`;
}
const bush = (x, y) => `<g class="lb-bush" transform="translate(${x} ${y})"><ellipse cx="0" cy="22" rx="26" ry="6" fill="#000" opacity=".18"/>
  <circle cx="-13" cy="6" r="15" fill="#2F6B2A"/><circle cx="13" cy="6" r="15" fill="#2F6B2A"/><circle cx="0" cy="-6" r="18" fill="#3E8A35"/><circle cx="-14" cy="2" r="12" fill="#4C9A3F"/><circle cx="12" cy="0" r="13" fill="#4C9A3F"/>
  <circle cx="-5" cy="-12" r="6" fill="#7CC36A" opacity=".7"/><circle cx="-8" cy="8" r="2.6" fill="#D9342B"/><circle cx="9" cy="10" r="2.6" fill="#D9342B"/><circle cx="4" cy="-4" r="2.6" fill="#D9342B"/></g>`;
const coin = (x, y, i) => `<g class="lb-coin" data-coin="${i}" transform="translate(${x} ${y})"><g class="lb-coinspin"><circle r="15" fill="#B9861A"/><circle r="13" fill="#F2C230"/><circle r="9.5" fill="none" stroke="#C99A1E" stroke-width="2"/>
  <text y="5.5" text-anchor="middle" font-size="14" font-weight="800" fill="#9a6f12">₹</text><path d="M-8 -7 A11 11 0 0 1 2 -11" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7" stroke-linecap="round"/></g></g>`;
const flagArt = (x, y) => `<g class="lb-goal" transform="translate(${x} ${y})"><ellipse cx="0" cy="24" rx="16" ry="4" fill="#000" opacity=".2"/><rect x="-2" y="-26" width="4" height="50" rx="2" fill="#8a8f99"/>
  <path class="lb-flag" d="M2 -26 Q14 -30 24 -24 T44 -22 V-4 Q34 -10 24 -6 T2 -8 Z" fill="#E0533D"/><circle cx="0" cy="-28" r="3.5" fill="#F0B44C"/></g>`;

/* ---------------------------------------------------------------- the lab */
export function mount(stage, cfg, api) {
  const { gsap } = api;
  const mode = ['maze', 'dance', 'sensor'].includes(cfg.mode) ? cfg.mode : 'maze';
  const pal = (cfg.palette?.length ? cfg.palette : mode === 'sensor' ? ['ifSensor', 'ledOn', 'wait', 'ledOff'] : ['move', 'turnLeft', 'turnRight', 'repeat']).filter(o => B[o]);
  const maxBlocks = cfg.maxBlocks || 99;
  const [GW, GH] = mode === 'maze' ? (Array.isArray(cfg.grid) ? cfg.grid : [6, 5]) : mode === 'dance' ? [5, 3] : [1, 1];
  const start = mode === 'maze' ? { x: 0, y: GH - 1, dir: 'right', ...(cfg.start || {}) } : { x: 1, y: 1, dir: 'right' };
  const goalC = { x: GW - 1, y: 0, ...(cfg.goal || {}) };
  const coins = mode === 'maze' ? (cfg.coins || []).filter(c => c[0] < GW && c[1] < GH) : [];
  const walls = mode === 'maze' ? (cfg.walls || []).filter(c => c[0] < GW && c[1] < GH && !(c[0] === start.x && c[1] === start.y) && !(c[0] === goalC.x && c[1] === goalC.y)) : [];
  const isWall = (x, y) => walls.some(w => w[0] === x && w[1] === y);
  let target = mode === 'dance' ? (Array.isArray(cfg.target) && cfg.target.length ? cfg.target : ['move', 'jump', 'turnRight', 'turnRight', 'say']).filter(o => B[o] && !B[o].c && o !== 'wait') : [];
  if (mode === 'dance') { const ok = target.filter(o => pal.includes(o)); target = ok.length ? ok : pal.filter(o => !B[o].c).slice(0, 4); }

  let script = [], uid = 0, running = false, stopFlag = false, done = false, world = null, timers = [];
  const root = h(`<div class="lab-blocks mode-${mode}">
    <section class="lb-pal" aria-label="Block palette"><p class="lb-h">Blocks</p><div class="lb-palist"></div><p class="lb-count"></p></section>
    <section class="lb-script" aria-label="Your script"><div class="lb-shead"><p class="lb-h">Your script</p><button type="button" class="lb-clear" aria-label="Clear the script">🗑 Clear</button></div>
      <div class="lb-canvas"><div class="lb-stack"></div><div class="lb-shadow" aria-hidden="true"></div><p class="lb-empty">Drag blocks here and snap them under the ${mode === 'sensor' ? 'forever' : 'green flag'} block.</p></div></section>
    <section class="lb-stagebox" aria-label="Stage">
      <div class="lb-stagehead"><button type="button" class="lb-run"><span aria-hidden="true">⚑</span> Run</button><button type="button" class="lb-stop" aria-label="Stop">⏹</button><button type="button" class="lb-reset" aria-label="Reset the stage">↺</button><span class="lb-score" aria-live="polite"></span></div>
      <div class="lb-stagewrap"><svg class="lb-stage" role="img" aria-label="Stage"></svg></div>
      ${mode === 'dance' ? `<div class="lb-target" aria-label="Dance to copy"><span class="lb-tlabel">Copy this dance:</span>${target.map((o, i) => `<span class="lb-chip c-${B[o].cat}" data-i="${i}" title="${esc(B[o].label)}">${B[o].icon}<small>${esc(shortName(o))}</small></span>`).join('')}</div>` : ''}
    </section>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('.lb-stage'), stackEl = $('.lb-stack'), canvas = $('.lb-canvas'), shadowEl = $('.lb-shadow');

  /* ---- palette ---- */
  function renderPalette() {
    const n = countBlocks(script);
    $('.lb-palist').innerHTML = pal.map(op => blockHTML({ op, arg: B[op].arg?.def, kids: B[op].c ? [] : undefined, id: `pal-${op}` }, true)).join('');
    $('.lb-count').innerHTML = maxBlocks < 99 ? `Blocks used: <b>${n}</b> / ${maxBlocks}` : `Blocks used: <b>${n}</b>`;
    $('.lb-count').classList.toggle('full', n >= maxBlocks);
    root.querySelectorAll('.lb-palist .lb-b').forEach(el => { el.classList.toggle('off', n >= maxBlocks); });
    shapeAll($('.lb-palist'));
  }
  function blockHTML(n, inPal) {
    const d = B[n.op], arg = d.arg ? `<button type="button" class="lb-arg" data-id="${n.id}" ${inPal ? 'tabindex="-1"' : ''} aria-label="Change value, now ${esc(n.arg)}">${esc(n.arg)}</button>${d.arg.after ? `<span>${d.arg.after}</span>` : ''}` : '';
    const label = d.label.replace(/↺|↻/, m => `<i>${m}</i>`);
    return `<div class="lb-b c-${d.cat}${d.c ? ' lb-cb' : ''}" data-id="${n.id}" data-op="${n.op}" ${inPal ? `role="button" tabindex="0" aria-label="Add block: ${esc(d.label)}"` : ''}>
      <svg class="lb-shape" aria-hidden="true"><path/></svg>
      <div class="lb-row"><span class="lb-lbl">${label}</span>${arg}${inPal ? '' : `<button type="button" class="lb-del" data-id="${n.id}" aria-label="Remove ${esc(d.label)}">×</button>`}</div>
      ${d.c ? `<div class="lb-inner" data-id="${n.id}">${(n.kids || []).map(k => blockHTML(k)).join('')}</div><div class="lb-foot"></div>` : ''}</div>`;
  }
  function shapeAll(scope) {
    // innermost first so C-blocks know their inner height
    const els = [...scope.querySelectorAll('.lb-b')].reverse();
    for (const el of els) {
      const row = el.querySelector(':scope > .lb-row'), w = Math.max(el.classList.contains('lb-cb') ? 170 : 110, row.scrollWidth + 14);
      el.style.width = `${w}px`;
      const path = el.querySelector(':scope > .lb-shape'), p = path.firstElementChild;
      let hh = 44, d;
      if (el.classList.contains('lb-cb')) { const ih = Math.max(30, el.querySelector(':scope > .lb-inner').offsetHeight); hh = 44 + ih + 26; d = cPath(w, 44, ih, 26); }
      else if (el.classList.contains('lb-hat')) { hh = 58; d = hatPath(w, hh); }
      else d = stackPath(w, 44);
      path.setAttribute('width', w); path.setAttribute('height', hh + 8); path.setAttribute('viewBox', `0 0 ${w} ${hh + 8}`);
      p.setAttribute('d', d);
    }
  }
  function countBlocks(list) { return list.reduce((s, n) => s + 1 + (n.kids ? countBlocks(n.kids) : 0), 0); }

  /* ---- script ---- */
  function renderScript() {
    const hat = mode === 'sensor' ? 'forever <small>(Arduino loop)</small>' : 'when <b class="lb-flagic">⚑</b> clicked';
    stackEl.innerHTML = `<div class="lb-b lb-hat c-${mode === 'sensor' ? 'arduino' : 'events'}"><svg class="lb-shape" aria-hidden="true"><path/></svg><div class="lb-row"><span class="lb-lbl">${hat}</span></div></div>
      <div class="lb-list" data-id="root">${script.map(n => blockHTML(n)).join('')}</div>`;
    shapeAll(stackEl);
    $('.lb-empty').hidden = script.length > 0;
    renderPalette();
  }
  const findList = (id, list = script) => { if (id === 'root') return list; for (const n of list) { if (n.id === id) return n.kids; if (n.kids) { const r = findList(id, n.kids); if (r) return r; } } return null; };
  function removeNode(id, list = script) { const i = list.findIndex(n => n.id === id); if (i >= 0) return list.splice(i, 1)[0]; for (const n of list) if (n.kids) { const r = removeNode(id, n.kids); if (r) return r; } return null; }
  const findNode = (id, list = script) => { for (const n of list) { if (n.id === id) return n; if (n.kids) { const r = findNode(id, n.kids); if (r) return r; } } return null; };
  const newNode = op => ({ id: `b${++uid}`, op, arg: B[op].arg?.def, kids: B[op].c ? [] : undefined });

  /* ---- drag & drop (pointer events; tap a palette block to add it at the end) ---- */
  let drag = null;
  root.addEventListener('pointerdown', e => {
    if (running || e.button > 0) return;
    if (e.target.closest('.lb-arg, .lb-del')) return;
    const el = e.target.closest('.lb-b'); if (!el || el.classList.contains('lb-hat')) return;
    const inPal = !!el.closest('.lb-palist');
    if (inPal && el.classList.contains('off')) { full(); return; }
    e.preventDefault();
    const r = el.getBoundingClientRect();
    drag = { el, inPal, op: el.dataset.op, id: el.dataset.id, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, ghost: null, node: null, target: null };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  });
  function onMove(e) {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      if (drag.inPal) drag.node = newNode(drag.op);
      else { drag.node = removeNode(drag.id); renderScript(); }
      const g = h(`<div class="lab-blocks lb-ghostwrap">${blockHTML(drag.node)}</div>`);
      api.root.append(g); shapeAll(g); drag.ghost = g; api.sound('click');
      root.classList.add('dragging');
    }
    drag.ghost.style.left = `${e.clientX - drag.dx}px`; drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    drag.target = dropTarget(e.clientX - drag.dx, e.clientY - drag.dy);
    if (drag.target) { shadowEl.style.cssText = `display:block; left:${drag.target.x}px; top:${drag.target.y}px; width:${drag.ghost.firstElementChild.offsetWidth}px`; }
    else shadowEl.style.display = 'none';
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    const d = drag; drag = null; if (!d) return;
    root.classList.remove('dragging'); shadowEl.style.display = 'none';
    if (!d.moved) { if (d.inPal) addAtEnd(d.op); return; }
    d.ghost.remove();
    if (d.target) {
      if (d.inPal && countBlocks(script) >= maxBlocks) { full(); renderScript(); return; }
      const list = findList(d.target.list); list.splice(d.target.index, 0, d.node);
      renderScript(); snapFx(d.node.id);
    } else { if (!d.inPal) { api.sound('whoosh'); } renderScript(); }
  }
  function dropTarget(gx, gy) {
    // candidate insertion points: [listId, index, x, y] in canvas coords
    const cr = canvas.getBoundingClientRect(), cands = [];
    if (gx > cr.right + 40 || gx + 60 < cr.left || gy > cr.bottom + 20 || gy + 30 < cr.top) return null;
    for (const list of stackEl.querySelectorAll('.lb-list, .lb-inner')) {
      const kids = [...list.children].filter(c => c.classList.contains('lb-b')), lr = list.getBoundingClientRect();
      for (let i = 0; i <= kids.length; i++) {
        const y = i === 0 ? lr.top : kids[i - 1].getBoundingClientRect().bottom;
        cands.push({ list: list.dataset.id, index: i, x: lr.left - cr.left + canvas.scrollLeft, y: y - cr.top + canvas.scrollTop, cx: lr.left, cy: y });
      }
    }
    let best = null, bd = 90;
    for (const c of cands) { const d = Math.hypot((gx - c.cx) * .6, gy - c.cy); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  function addAtEnd(op) {
    if (countBlocks(script) >= maxBlocks) { full(); return; }
    const n = newNode(op); script.push(n); renderScript(); snapFx(n.id);
  }
  function snapFx(id) {
    api.sound('drop');
    const el = stackEl.querySelector(`.lb-b[data-id="${id}"]`);
    if (el && gsap && !api.reduced) gsap.fromTo(el, { scale: 1.06, y: -6 }, { scale: 1, y: 0, duration: .35, ease: 'back.out(3)' });
    if (!running) resetWorld(false);
  }
  function full() { api.sound('bad'); api.say(`You can use only ${maxBlocks} blocks. Try a repeat block to make your code shorter!`, 'hint'); const c = $('.lb-count'); shake(api, c); }
  root.addEventListener('click', e => {
    const a = e.target.closest('.lb-arg'), del = e.target.closest('.lb-del');
    if (running) return;
    if (a && !a.closest('.lb-palist')) { const n = findNode(a.dataset.id); const vals = B[n.op].arg.vals; n.arg = vals[(vals.indexOf(n.arg) + 1) % vals.length]; api.sound('tick'); renderScript(); const b2 = stackEl.querySelector(`.lb-arg[data-id="${n.id}"]`); b2?.focus(); if (gsap && b2 && !api.reduced) gsap.fromTo(b2, { scale: 1.3 }, { scale: 1, duration: .3, ease: 'back.out(3)' }); }
    if (del) { const el = del.closest('.lb-b'); const fin = () => { removeNode(del.dataset.id); api.sound('whoosh'); renderScript(); }; if (gsap && !api.reduced) gsap.to(el, { x: -30, opacity: 0, duration: .2, onComplete: fin }); else fin(); }
  });
  root.addEventListener('keydown', e => { const b = e.target.closest('.lb-palist .lb-b'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (!running) { if (b.classList.contains('off')) full(); else addAtEnd(b.dataset.op); } } });
  $('.lb-clear').addEventListener('click', () => { if (running || !script.length) return; script = []; api.sound('whoosh'); renderScript(); resetWorld(false); });

  /* ---- worlds ---- */
  const VW = mode === 'sensor' ? 480 : GW * T, VH = mode === 'sensor' ? 300 : GH * T;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const sprName = cfg.sprite || 'scratch-cat';
  const spriteMarkup = api.hasSprite(sprName) ? `<svg x="-34" y="-62" width="68" height="68" viewBox="0 0 100 100">${api.sprite(sprName).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>` : catArt();
  function drawStage() {
    let s = `<defs><radialGradient id="lb-spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff6c0" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient>
      <radialGradient id="lb-ledglow"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".95"/><stop offset=".4" stop-color="#ff4a2a" stop-opacity=".4"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient></defs>`;
    if (mode === 'maze') {
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        s += `<rect x="${x * T}" y="${y * T}" width="${T}" height="${T}" fill="${(x + y) % 2 ? '#86C25A' : '#94CC66'}"/>`;
        s += `<path d="M${x * T + 14 + (x * 7 + y * 3) % 30} ${y * T + 44} l3 -8 l3 8 M${x * T + 38 + (x * 5) % 14} ${y * T + 22} l2.5 -7 l2.5 7" stroke="#6FAE45" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      }
      s += `<rect x="${start.x * T + 6}" y="${start.y * T + 6}" width="${T - 12}" height="${T - 12}" rx="10" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-dasharray="6 6"/>`;
      s += flagArt(goalC.x * T + T / 2 - 18, goalC.y * T + T / 2);
      walls.forEach(w => { s += bush(w[0] * T + T / 2, w[1] * T + T / 2 - 4); });
      coins.forEach((c, i) => { s += coin(c[0] * T + T / 2, c[1] * T + T / 2, i); });
    } else if (mode === 'dance') {
      const cols = ['#8C3557', '#1F6F66', '#D98A1C', '#2F7FD0', '#C2502A'];
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) s += `<rect class="lb-tile" x="${x * T + 2}" y="${y * T + 2}" width="${T - 4}" height="${T - 4}" rx="8" fill="${cols[(x + y * 2) % 5]}" opacity=".85"/><rect x="${x * T + 8}" y="${y * T + 8}" width="${T - 30}" height="6" rx="3" fill="#fff" opacity=".18"/>`;
      s += `<path class="lb-beam b1" d="M40 -10 L-20 ${VH} H120 Z" fill="url(#lb-spot)"/><path class="lb-beam b2" d="M${VW - 40} -10 L${VW - 120} ${VH} H${VW + 20} Z" fill="url(#lb-spot)"/>`;
    } else {
      s += `<rect width="${VW}" height="${VH}" fill="#F3E3C6"/><rect y="0" width="${VW}" height="14" fill="#E3CFA8"/>
        <rect y="${VH - 70}" width="${VW}" height="70" fill="#C9965A"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 64} ${VH - 70} V${VH}" stroke="#a87a43" stroke-opacity=".35"/>`).join('')}<rect y="${VH - 72}" width="${VW}" height="6" fill="#8B5A2B"/>
        <rect x="24" y="${VH - 210}" width="86" height="142" rx="4" fill="#8B5A2B"/><rect x="32" y="${VH - 202}" width="70" height="134" rx="2" fill="#5b3a1e"/><circle cx="92" cy="${VH - 132}" r="4" fill="#F0B44C"/>
        <rect x="180" y="40" width="110" height="80" rx="4" fill="#8B5A2B"/><rect x="186" y="46" width="98" height="68" fill="#9fd6f0" class="lb-window"/><path d="M235 46 V114 M186 80 H284" stroke="#8B5A2B" stroke-width="4"/>
        <g class="lb-pir" transform="translate(150 70)"><path class="lb-cone" d="M0 6 L-90 ${VH - 130} H90 Z" fill="#ff5a7a" opacity="0"/><rect x="-18" y="-10" width="36" height="18" rx="3" fill="#2E7D4F"/><circle cx="0" cy="8" r="13" fill="#f1f1f1" stroke="#ccc"/><circle class="lb-pirled" cx="14" cy="-4" r="2.5" fill="#6a2a2a"/><text x="0" y="-16" text-anchor="middle" font-size="10" font-weight="700" fill="#5E4634">PIR</text></g>
        <rect x="320" y="${VH - 140}" width="140" height="10" rx="3" fill="#8B5A2B"/><rect x="334" y="${VH - 130}" width="8" height="60" fill="#7a4e22"/><rect x="438" y="${VH - 130}" width="8" height="60" fill="#7a4e22"/>
        <g transform="translate(330 ${VH - 186})"><rect width="76" height="46" rx="5" fill="#0FA3A8"/><rect x="10" y="-4" width="50" height="7" fill="#1d1d1d"/><rect x="18" y="18" width="40" height="12" fill="#1b1b1b"/><text x="8" y="40" font-size="9" fill="#fff" font-style="italic" font-weight="800">UNO</text></g>
        <g transform="translate(420 ${VH - 160})"><circle class="lb-ledglow" cx="0" cy="-8" r="44" fill="url(#lb-ledglow)" opacity="0"/><rect x="-18" y="6" width="36" height="14" rx="3" fill="#f3efe6"/><path d="M-4 6 V-2 M4 6 V-2" stroke="#999" stroke-width="2"/><path class="lb-led" d="M-9 0 V-12 A9 9 0 0 1 9 -12 V0 Z" fill="#8e1e1a"/></g>
        <path d="M405 ${VH - 168} q-10 -10 -4 -26" stroke="#E8833A" stroke-width="2" fill="none"/>`;
    }
    s += `<g class="lb-actor"><g class="lb-dirwrap"><g class="lb-dir"><path d="M16 0 L4 -7 V7 Z" fill="#fff" stroke="#2B1A10" stroke-width="1.5" stroke-linejoin="round"/></g></g><g class="lb-sq"><g class="lb-flip">${spriteMarkup}</g></g><g class="lb-bubble" opacity="0"><rect x="-6" y="-104" width="96" height="34" rx="12" fill="#fff" stroke="#2B1A10" stroke-opacity=".25"/><path d="M12 -71 l-4 12 l14 -12 Z" fill="#fff"/><text x="42" y="-82" text-anchor="middle" font-size="15" font-weight="700" fill="#2B1A10"></text></g><g class="lb-notes"></g></g>`;
    svg.innerHTML = s;
    if (gsap && !api.reduced) {
      svg.querySelectorAll('.lb-coinspin').forEach((c, i) => gsap.to(c, { scaleX: .15, duration: .6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * .2, transformOrigin: '50% 50%' }));
      svg.querySelectorAll('.lb-flag').forEach(f => gsap.to(f, { skewY: 6, scaleX: .94, duration: .7, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: '0% 50%' }));
    }
  }

  const actor = () => svg.querySelector('.lb-actor');
  function resetWorld(sayIt = true) {
    world = { x: start.x, y: start.y, dir: start.dir, got: new Set(), led: false, actions: [] };
    if (mode === 'sensor') { world.x = 0; }
    gsap?.killTweensOf(svg.querySelectorAll('.lb-actor, .lb-actor *'));
    drawStage(); placeActor(true); updScore();
    root.querySelectorAll('.lb-chip').forEach(c => c.classList.remove('ok', 'no'));
    if (sayIt) api.say('Stage reset. Change your script and run it again!');
  }
  function cellXY(x, y) { return mode === 'sensor' ? { x: x, y: VH - 46 } : { x: x * T + T / 2, y: y * T + T / 2 + 18 }; }
  function placeActor() {
    const a = actor(), p = mode === 'sensor' ? { x: -60, y: VH - 46 } : cellXY(world.x, world.y);
    a.setAttribute('transform', `translate(${p.x} ${p.y})`); a.dataset.x = p.x; a.dataset.y = p.y;
    setDir(world.dir, true);
    if (mode === 'sensor') a.querySelector('.lb-dirwrap').style.display = 'none';
  }
  function setDir(dir, instant) {
    const a = actor(), flip = a.querySelector('.lb-flip'), arrow = a.querySelector('.lb-dir');
    const ang = { right: 0, down: 90, left: 180, up: -90 }[dir];
    if (gsap && !instant) { gsap.to(arrow, { rotation: ang, svgOrigin: '0 0', duration: .3, ease: 'back.out(2)' }); gsap.to(flip, { scaleX: dir === 'left' ? -1 : 1, svgOrigin: '0 0', duration: .25 }); }
    else { arrow.setAttribute('transform', `rotate(${ang})`); flip.setAttribute('transform', `scale(${dir === 'left' ? -1 : 1} 1)`); if (gsap) { gsap.set(arrow, { rotation: ang, svgOrigin: '0 0' }); gsap.set(flip, { scaleX: dir === 'left' ? -1 : 1, svgOrigin: '0 0' }); } }
  }
  const pos = () => { const a = actor(); return { x: +a.dataset.x, y: +a.dataset.y }; };
  function moveActor(p, dur = .34, hop = 8) {
    const a = actor(), sq = a.querySelector('.lb-sq'), from = pos(), st = { t: 0 };
    a.dataset.x = p.x; a.dataset.y = p.y;
    gsap.killTweensOf(sq);
    const tl = gsap.timeline();
    tl.to(sq, { scaleY: .82, scaleX: 1.12, svgOrigin: '0 0', duration: .07 })
      .to(st, { t: 1, duration: dur, ease: 'power1.inOut', onUpdate: () => { const x = from.x + (p.x - from.x) * st.t, y = from.y + (p.y - from.y) * st.t - Math.sin(st.t * Math.PI) * hop; a.setAttribute('transform', `translate(${x} ${y})`); } }, '<.04')
      .to(sq, { scaleY: 1.12, scaleX: .9, duration: dur * .45, ease: 'power1.out' }, '<')
      .to(sq, { scaleY: .86, scaleX: 1.1, duration: .07 })
      .addLabel('land')
      .to(sq, { scaleY: 1, scaleX: 1, duration: .3, ease: 'elastic.out(1, .45)' });
    // resolve on landing; the wobble keeps playing while the next block starts
    return new Promise(res => tl.call(res, null, 'land'));
  }
  function bump(dir) {
    const a = actor(), p = pos(), [dx, dy] = DIRS[dir], st = { t: 0 };
    api.sound('bad');
    return gsap.to(st, { t: 1, duration: .4, ease: 'none', onUpdate: () => { const k = Math.sin(st.t * Math.PI) * 14; a.setAttribute('transform', `translate(${p.x + dx * k} ${p.y + dy * k})`); }, onComplete: () => a.setAttribute('transform', `translate(${p.x} ${p.y})`) });
  }
  function bubble(text, ms = 900) {
    const b = actor().querySelector('.lb-bubble'); b.querySelector('text').textContent = text;
    const w = Math.max(70, text.length * 9 + 24); b.querySelector('rect').setAttribute('width', w); b.querySelector('text').setAttribute('x', -6 + w / 2);
    return gsap.timeline().fromTo(b, { opacity: 0, scale: .5, svgOrigin: '10 -60' }, { opacity: 1, scale: 1, duration: .25, ease: 'back.out(2.5)' }).to(b, { opacity: 0, duration: .2, delay: ms / 1000 });
  }
  function notes() {
    const g = actor().querySelector('.lb-notes');
    for (let i = 0; i < 3; i++) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.textContent = i % 2 ? '♫' : '♪'; t.setAttribute('font-size', '20'); t.setAttribute('fill', '#CF63CF'); t.setAttribute('x', 10 + i * 8); t.setAttribute('y', -60);
      g.append(t); gsap.to(t, { y: -40 - i * 10, x: 14 + i * 10, opacity: 0, duration: .9, delay: i * .12, onComplete: () => t.remove() });
    }
  }
  function beep(kind) { api.sound(kind === 'drum' ? 'drop' : kind === 'beep' ? 'tick' : 'pop'); }
  function updScore() {
    const s = $('.lb-score');
    if (mode === 'maze') s.innerHTML = coins.length ? `<span class="lb-coinic">₹</span> ${world.got.size} / ${coins.length}` : '';
    else if (mode === 'sensor') s.innerHTML = `LED: <b class="${world.led ? 'on' : ''}">${world.led ? 'ON' : 'off'}</b>`;
    else s.textContent = '';
  }
  class Stop extends Error { }
  class Oops extends Error { constructor(msg, id) { super(msg); this.id = id; } }

  /* ---- actions ---- */
  async function act(n) {
    const op = n.op, arg = n.arg;
    if (mode === 'dance' && op !== 'wait') { world.actions.push(op); markDance(); }
    switch (op) {
      case 'move': {
        const steps = mode === 'maze' ? arg : 1;
        for (let i = 0; i < steps; i++) {
          if (stopFlag) throw new Stop();
          const [dx, dy] = DIRS[world.dir], nx = world.x + dx, ny = world.y + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) { await bump(world.dir); if (mode === 'maze') throw new Oops('Oops! The cat cannot walk off the edge of the garden.', n.id); return; }
          if (isWall(nx, ny)) { await bump(world.dir); throw new Oops('Oops! A bush is in the way. Turn, or jump over it.', n.id); }
          world.x = nx; world.y = ny; api.sound('tick');
          await moveActor(cellXY(nx, ny));
          collect();
        }
        return;
      }
      case 'turnLeft': case 'turnRight': {
        world.dir = ORDER[(ORDER.indexOf(world.dir) + (op === 'turnLeft' ? 3 : 1)) % 4]; api.sound('click');
        const sq = actor().querySelector('.lb-sq');
        setDir(world.dir);
        await gsap.timeline().to(sq, { rotation: op === 'turnLeft' ? -14 : 14, svgOrigin: '0 0', duration: .15 }).to(sq, { rotation: 0, duration: .35, ease: 'elastic.out(1, .4)' });
        return;
      }
      case 'jump': {
        if (mode !== 'maze') { api.sound('whoosh'); await moveActor(pos(), .45, 40); return; }
        const [dx, dy] = DIRS[world.dir], nx = world.x + 2 * dx, ny = world.y + 2 * dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || isWall(nx, ny)) { await moveActor(pos(), .4, 30); throw new Oops(isWall(nx, ny) ? 'The cat would land on a bush! Jump only where the landing square is free.' : 'That jump would land outside the garden!', n.id); }
        world.x = nx; world.y = ny; api.sound('whoosh');
        await moveActor(cellXY(nx, ny), .55, 46);
        collect(); return;
      }
      case 'say': api.sound('pop'); await bubble(String(arg)); return;
      case 'playSound': beep(arg); notes(); await gsap.to({}, { duration: .6 }); return;
      case 'wait': await gsap.to({}, { duration: mode === 'sensor' ? arg : Math.min(arg, 1) * .8 }); return;
      case 'ledOn': case 'ledOff': setLED(op === 'ledOn'); await gsap.to({}, { duration: .25 }); return;
    }
  }
  function collect() {
    if (mode !== 'maze') return;
    coins.forEach((c, i) => {
      if (c[0] === world.x && c[1] === world.y && !world.got.has(i)) {
        world.got.add(i); api.sound('pop');
        const el = svg.querySelector(`.lb-coin[data-coin="${i}"]`);
        if (el) gsap.to(el, { y: '-=40', opacity: 0, scale: 1.4, duration: .5, ease: 'power2.out', svgOrigin: `${c[0] * T + T / 2} ${c[1] * T + T / 2}` });
        updScore(); const sc = $('.lb-score'); gsap.fromTo(sc, { scale: 1.3 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
      }
    });
  }
  function markDance() {
    const i = world.actions.length - 1, chip = root.querySelector(`.lb-chip[data-i="${i}"]`);
    const ok = target[i] === world.actions[i];
    if (chip) { chip.classList.add(ok ? 'ok' : 'no'); if (gsap && !api.reduced) gsap.fromTo(chip, { scale: 1.3 }, { scale: 1, duration: .35, ease: 'back.out(3)' }); }
    if (!ok) throw new Oops(i >= target.length ? 'The dance is already finished. Remove the extra blocks!' : `Step ${i + 1} should be "${B[target[i]].label}", not "${B[world.actions[i]].label}".`, null);
    if (mode === 'dance') svg.querySelectorAll('.lb-tile').forEach(t => gsap.to(t, { opacity: .45 + Math.random() * .55, duration: .2 }));
  }
  function setLED(on) {
    world.led = on; updScore();
    const g = svg.querySelector('.lb-ledglow'), l = svg.querySelector('.lb-led');
    if (g) gsap.to(g, { opacity: on ? 1 : 0, duration: .2 }); if (l) l.setAttribute('fill', on ? '#ff6a4a' : '#8e1e1a');
    api.sound(on ? 'pop' : 'click');
    const now = gsap.ticker.time;
    if (on) { world.onAt = now; if (!world.motionSeen) world.badEarly = true; if (world.motionNow) world.onWithMotion = true; }
    else if (world.onAt != null) { world.maxOn = Math.max(world.maxOn || 0, now - world.onAt); world.onAt = null; }
  }

  /* ---- run ---- */
  const hl = (id, on) => { const el = stackEl.querySelector(`.lb-b[data-id="${id}"]`); el?.classList.toggle('run', on); };
  async function exec(list) {
    for (const n of list) {
      if (stopFlag) throw new Stop();
      hl(n.id, true);
      try {
        if (n.op === 'repeat') { for (let i = 0; i < n.arg; i++) { setIter(n.id, i + 1, n.arg); await exec(n.kids); } setIter(n.id, 0); }
        else if (n.op === 'ifSensor') { await gsap.to({}, { duration: .12 }); if (mode === 'sensor' ? world.motionNow : false) await exec(n.kids); }
        else await act(n);
      } finally { hl(n.id, false); }
    }
  }
  function setIter(id, i, n) { const el = stackEl.querySelector(`.lb-b[data-id="${id}"] > .lb-row .lb-arg`); if (el) el.dataset.iter = i ? `${i}/${n}` : ''; }
  $('.lb-run').addEventListener('click', runIt);
  $('.lb-stop').addEventListener('click', () => { if (running) { stopFlag = true; api.sound('click'); } });
  $('.lb-reset').addEventListener('click', () => { if (!running) { api.sound('click'); resetWorld(); } });
  async function runIt() {
    if (running || done) return;
    if (!script.length) { api.say(`Drag some blocks under the "${mode === 'sensor' ? 'forever' : 'when ⚑ clicked'}" block first.`, 'hint'); shake(api, canvas); return; }
    resetWorld(false);
    running = true; stopFlag = false; root.classList.add('running'); api.sound('whoosh');
    let err = null;
    try {
      if (mode === 'sensor') await runSensor(); else await exec(script);
    } catch (e) { err = e; }
    running = false; root.classList.remove('running');
    stackEl.querySelectorAll('.run').forEach(el => el.classList.remove('run'));
    if (err instanceof Stop) { api.say('Stopped. Press Run to try again.'); return; }
    if (err instanceof Oops) {
      api.mistake(); api.say(err.message, 'bad');
      if (err.id) { const el = stackEl.querySelector(`.lb-b[data-id="${err.id}"]`); el?.classList.add('err'); timers.push(setTimeout(() => el?.classList.remove('err'), 1800)); }
      return;
    }
    if (err) { console.error(err); return; }
    judge();
  }
  function judge() {
    if (mode === 'maze') {
      const atGoal = world.x === goalC.x && world.y === goalC.y, all = world.got.size === coins.length;
      if (atGoal && all) return win('The cat reached the flag and collected every coin!');
      api.mistake();
      if (atGoal) return api.say(`The cat reached the flag but missed ${coins.length - world.got.size} coin(s). Plan a path that visits every coin.`, 'bad');
      const d = Math.abs(goalC.x - world.x) + Math.abs(goalC.y - world.y);
      api.say(`The cat stopped ${d} square${d > 1 ? 's' : ''} away from the flag. Add more blocks to finish the path.`, 'bad');
      return;
    }
    if (mode === 'dance') {
      if (world.actions.length === target.length) return win('Perfect copy! Your cat danced the whole routine.');
      api.mistake(); api.say(`Good start! The dance has ${target.length} moves and your cat did ${world.actions.length}. Keep going.`, 'hint'); return;
    }
    const w = world;
    if (w.badEarly) { api.mistake(); return api.say('The LED switched on before anyone came in. Put "turn LED on" inside the "if motion seen" block.', 'bad'); }
    if (!w.onWithMotion) { api.mistake(); return api.say(script.some(n => n.op === 'ifSensor') ? 'The cat came, but the LED did not switch on. Put "turn LED on" inside the "if motion seen" block.' : 'Use an "if motion seen" block, so the code checks the sensor.', 'bad'); }
    if (w.led) { api.mistake(); return api.say('The LED stayed on after the cat left. Add "wait" and then "turn LED off".', 'bad'); }
    if ((w.maxOn || 0) < .6) { api.mistake(); return api.say('The LED only flickered! Add a "wait" block between "LED on" and "LED off".', 'hint'); }
    win('Light on when the cat came, off after it left. Your room is smart!');
  }
  async function runSensor() {
    const a = actor(), cone = svg.querySelector('.lb-cone'), led = svg.querySelector('.lb-pirled');
    world.motionNow = false; world.motionSeen = false;
    const maxWait = Math.max(1, ...flat(script).filter(n => n.op === 'wait').map(n => n.arg));
    const st = { x: -60 };
    a.classList.add('walking');
    const cat = gsap.timeline()
      .to({}, { duration: 1.2 })
      .to(st, { x: 150, duration: 2.2, ease: 'none' })
      .to({}, { duration: 1.6 })
      .to(st, { x: VW + 60, duration: 2.6, ease: 'none' })
      .to({}, { duration: maxWait + 1.6 });
    cat.eventCallback('onUpdate', () => {
      a.setAttribute('transform', `translate(${st.x} ${VH - 46})`); a.dataset.x = st.x;
      const m = st.x > 60 && st.x < 250;
      if (m !== world.motionNow) { world.motionNow = m; if (m) { world.motionSeen = true; api.sound('tick'); } gsap.to(cone, { opacity: m ? .28 : 0, duration: .2 }); led?.setAttribute('fill', m ? '#ff4040' : '#6a2a2a'); }
    });
    try {
      while (cat.isActive() || cat.progress() < 1) {
        if (stopFlag) throw new Stop();
        await exec(script);
        await gsap.to({}, { duration: .08 });
      }
    } finally { a.classList.remove('walking'); cat.kill(); }
    if (world.onAt != null) world.maxOn = Math.max(world.maxOn || 0, gsap.ticker.time - world.onAt);
  }
  const flat = list => list.flatMap(n => [n, ...(n.kids ? flat(n.kids) : [])]);
  function win(msg) {
    if (done) return; done = true;
    api.say(msg, 'good'); api.progress(1);
    const a = actor();
    if (gsap && !api.reduced) gsap.timeline().to(a.querySelector('.lb-sq'), { y: -26, duration: .25, ease: 'power2.out', yoyo: true, repeat: 3 });
    sparkle(api, svg);
    timers.push(setTimeout(() => api.complete({ message: cfg.win || msg }), api.reduced ? 500 : 1800));
  }

  /* ---- progress: how close the script is ---- */
  const obs = new MutationObserver(() => { if (!done) api.progress(Math.min(.85, countBlocks(script) / Math.max(4, Math.min(maxBlocks, mode === 'dance' ? target.length : 6)) * .8)); });
  obs.observe(stackEl, { childList: true });

  renderScript(); resetWorld(false);
  const ro = new ResizeObserver(() => shapeAll(root)); ro.observe($('.lb-script'));
  api.say(cfg.mission || 'Snap the blocks together and press Run!');
  return {
    destroy() {
      stopFlag = true; timers.forEach(clearTimeout); ro.disconnect(); obs.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      drag?.ghost?.remove(); gsap?.killTweensOf(svg.querySelectorAll('*'));
      root.remove();
    },
  };
}

export const demo = {
  title: 'Cat in the Mango Garden',
  mode: 'maze',
  mission: 'Program the cat to collect the two ₹ coins and reach the flag. Snap blocks under "when ⚑ clicked", then press Run. You have only 8 blocks — a repeat loop will help!',
  fact: 'Scratch was made so that children could build stories and games by snapping blocks together, like LEGO bricks.',
  grid: [6, 5], start: { x: 0, y: 4, dir: 'right' }, goal: { x: 5, y: 0 },
  coins: [[2, 4], [5, 2]], walls: [[1, 2], [3, 3], [3, 1], [4, 4], [0, 1]],
  palette: ['move', 'turnLeft', 'turnRight', 'jump', 'repeat'],
  maxBlocks: 8, sprite: 'scratch-cat',
  win: 'You wrote a short, smart program with a loop. That is how real coders think!',
};
