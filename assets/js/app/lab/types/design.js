// VINC Lab · design: a small poster / label / card editor that saves a PNG to the child's portfolio.
// SVG canvas with background colours and patterns, editable text (double-tap), stickers with
// drag / scale / rotate handles, layer order, delete, a live checklist and PNG export.
import { esc, sparkle, onResize } from '../kit.js';

export const meta = { title: 'Design studio', needs: ['gsap'] };

const SIZES = { poster: [600, 800], label: [720, 440], card: [720, 480], menu: [600, 840], badge: [620, 620], banner: [960, 380] };
// Web-safe font stacks only, so the exported PNG looks exactly like the editor.
const FONTS = [
  { id: 'sans', name: 'Clean', css: 'Arial, Helvetica, sans-serif', weight: 700 },
  { id: 'serif', name: 'Classic', css: "Georgia, 'Times New Roman', serif", weight: 700 },
  { id: 'fun', name: 'Fun', css: "'Comic Sans MS', 'Comic Neue', 'Chalkboard SE', 'Marker Felt', cursive", weight: 700 },
  { id: 'loud', name: 'Loud', css: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif", weight: 400 },
];
const STYLES = [{ id: 'plain', name: 'Plain' }, { id: 'outline', name: 'Outline' }, { id: 'pill', name: 'Ribbon' }];
const PATTERNS = ['none', 'dots', 'stripes', 'rays', 'frame', 'confetti'];
const PAT_NAME = { none: 'Plain', dots: 'Dots', stripes: 'Stripes', rays: 'Sunburst', frame: 'Frame', confetti: 'Confetti' };
const EXTRA = ['#FFFFFF', '#2B1A10', '#F6DFB5', '#CFE6E1', '#F3D3C5', '#DCE8CC', '#F2C21E', '#2A6FB0'];
const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = n => Math.round(n * 10) / 10;
let UID = 0;

function lum(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex).trim());
  if (!m) return 1;
  const [r, g, b] = m.slice(1).map(x => { const v = parseInt(x, 16) / 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b;
}
const isDark = c => lum(c) < .36;

export function mount(stage, cfg, api) {
  const { gsap, Draggable } = api;
  const P = `dz${++UID}`;
  const shape = SIZES[cfg.canvas] ? cfg.canvas : 'poster';
  const [CW, CH] = Array.isArray(cfg.size) && cfg.size.length === 2 ? cfg.size.map(n => clamp(+n || 600, 200, 1600)) : SIZES[shape];
  const palette = (cfg.palette?.length ? cfg.palette : ['#1F6F66', '#D98A1C', '#8C3557', '#4C7424', '#C2502A', '#FFF9EF']).slice(0, 10);
  const swatches = [...new Set([...palette, ...EXTRA].map(c => c.toUpperCase()))].slice(0, 14);
  const textColors = [...new Set(['#2B1A10', '#FFFFFF', ...palette.map(c => c.toUpperCase()), '#C2342A', '#F2C21E'])].slice(0, 10);
  const stickers = (cfg.stickers || []).slice(0, 24);
  const fields = cfg.fields || [];
  const checklist = cfg.checklist?.length ? cfg.checklist : [{ text: 'Add a title', rule: 'text:1' }, { text: 'Add 2 pictures', rule: 'stickers:2' }, { text: 'Choose a background', rule: 'background' }];
  const st = { bg: '#FFFFFF', bgChosen: false, pattern: 'none', els: [], sel: null, fields: Object.fromEntries(fields.map(f => [f.key, ''])) };
  let nid = 0, done = false, saving = false, allOk = false;
  const okState = checklist.map(() => false);
  const drags = [];
  const timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, api.reduced ? 0 : ms); timers.push(t); return t; };

  /* ---------- markup ---------- */
  const tabs = [['bg', '🎨', 'Background'], ['text', '🔤', 'Text'], ['stk', '⭐', 'Stickers'], ...(fields.length ? [['fld', '📝', 'Details']] : [])];
  const clipShape = shape === 'badge' ? `<circle cx="${CW / 2}" cy="${CH / 2}" r="${Math.min(CW, CH) / 2}"/>` : `<rect width="${CW}" height="${CH}" rx="${shape === 'label' ? 44 : shape === 'card' ? 26 : shape === 'badge' ? 0 : 6}"/>`;
  const root = document.createElement('div');
  root.className = `lab-design dz-${shape}`;
  root.innerHTML = `
    <div class="dz-work">
      <div class="dz-tools" role="toolbar" aria-label="Change the selected item"><p class="dz-tools-empty">Tap something on your ${esc(shape)} to change it. Double-tap text to edit it.</p></div>
      <div class="dz-canvaswrap">
        <div class="dz-canvasbox">
          <svg class="dz-svg" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="Your ${esc(shape)} design">
            <defs><clipPath id="${P}-clip">${clipShape}</clipPath><filter id="${P}-sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".25"/></filter></defs>
            <g clip-path="url(#${P}-clip)"><g class="dz-bg"></g><g class="dz-els"></g></g>
            <g class="dz-ui"><g class="dz-ghost"></g><line class="dz-guide dz-guide-v" x1="${CW / 2}" y1="0" x2="${CW / 2}" y2="${CH}"/><line class="dz-guide dz-guide-h" x1="0" y1="${CH / 2}" x2="${CW}" y2="${CH / 2}"/><g class="dz-selbox" visibility="hidden"></g></g>
          </svg>
          <div class="dz-editor" hidden><label class="dz-ed-l" for="${P}-ta">Edit your text</label><textarea id="${P}-ta" rows="2" maxlength="140"></textarea><div class="dz-ed-b"><button type="button" class="dz-btn ghost" data-ed="cancel">Cancel</button><button type="button" class="dz-btn" data-ed="ok">Done ✓</button></div></div>
        </div>
      </div>
    </div>
    <aside class="dz-side">
      <div class="dz-tabs" role="tablist">${tabs.map(([id, ic, name], i) => `<button type="button" role="tab" class="dz-tab" data-tab="${id}" aria-selected="${i === 0}"><span aria-hidden="true">${ic}</span>${name}</button>`).join('')}</div>
      <div class="dz-panes">
        <section class="dz-pane" data-pane="bg">
          <h3 class="dz-h">Colour</h3><div class="dz-swatches">${swatches.map(c => `<button type="button" class="dz-sw" data-bg="${c}" style="--c:${c}" aria-label="Background ${c}"></button>`).join('')}</div>
          <h3 class="dz-h">Pattern</h3><div class="dz-pats">${PATTERNS.map(p => `<button type="button" class="dz-pat${p === 'none' ? ' on' : ''}" data-pat="${p}"><svg viewBox="0 0 60 40" aria-hidden="true">${patternMarkup(p, 60, 40, '#1F6F66', 'mini')}</svg><span>${PAT_NAME[p]}</span></button>`).join('')}</div>
        </section>
        <section class="dz-pane" data-pane="text" hidden>
          <button type="button" class="dz-btn dz-addtext">＋ Add my own text</button>
          ${cfg.texts?.length ? `<h3 class="dz-h">Ideas: tap to add</h3><div class="dz-ideas">${cfg.texts.map((t, i) => `<button type="button" class="dz-idea" data-idea="${i}">${esc(t)}</button>`).join('')}</div>` : ''}
        </section>
        <section class="dz-pane" data-pane="stk" hidden><div class="dz-stks">${stickers.map((s, i) => `<button type="button" class="dz-stk" data-stk="${i}" aria-label="Add ${esc(s.label || s.sprite || s.emoji || 'sticker')}">${api.art(s)}</button>`).join('')}</div></section>
        ${fields.length ? `<section class="dz-pane" data-pane="fld" hidden>${fields.map(f => `<label class="dz-field"><span>${esc(f.label)}</span><input type="text" maxlength="60" data-field="${esc(f.key)}" placeholder="${esc(f.placeholder || 'Type here…')}"></label>`).join('')}<p class="dz-note">What you type appears on your design. Drag it where you like.</p></section>` : ''}
      </div>
      <div class="dz-check"><h3 class="dz-h">Checklist</h3><ul>${checklist.map((c, i) => `<li data-ck="${i}"><span class="dz-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span>${esc(c.text)}</span></li>`).join('')}</ul></div>
      <button type="button" class="dz-save"><span class="dz-save-ic" aria-hidden="true">📁</span><span>Save to my portfolio</span></button>
    </aside>
    <div class="dz-proxies" aria-hidden="true"></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const svg = $('.dz-svg'), elsG = $('.dz-els'), bgG = $('.dz-bg'), selG = $('.dz-selbox'), tools = $('.dz-tools'), editor = $('.dz-editor'), ta = editor.querySelector('textarea');
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- sizing ---------- */
  let upp = 1; // canvas units per screen pixel
  onResize(api, stage, (sw, shh) => {
    const cs = getComputedStyle(stage);
    const w = sw - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const hh = shh - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const wide = w >= 880;
    root.classList.toggle('is-wide', wide);
    const colW = wide ? w - 360 - 20 : w;
    const availH = wide ? hh - tools.offsetHeight - 14 : Math.min(innerHeight * .58, 640);
    let cw = Math.min(colW, availH * CW / CH);
    cw = Math.max(240, Math.floor(cw));
    $('.dz-canvasbox').style.width = `${cw}px`;
    $('.dz-canvasbox').style.height = `${Math.round(cw * CH / CW)}px`;
    upp = CW / cw;
    drawSel();
  });

  /* ---------- background ---------- */
  function patternMarkup(p, w, h, base, mode) {
    const ink = mode === 'mini' ? base : (isDark(base) ? '#FFFFFF' : '#2B1A10');
    const o = mode === 'mini' ? .5 : .14;
    if (p === 'dots') { let s = ''; const g = Math.max(w, h) / 14; for (let y = g / 2, r = 0; y < h; y += g, r++) for (let x = (r % 2 ? g : g / 2); x < w; x += g) s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(g * .16)}"/>`; return `<g fill="${ink}" opacity="${o}">${s}</g>`; }
    if (p === 'stripes') { let s = ''; const g = Math.max(w, h) / 10; for (let x = -h; x < w + h; x += g) s += `<path d="M${r1(x)} 0l${h} ${h}h${r1(g / 2)}l${-h} ${-h}z"/>`; return `<g fill="${ink}" opacity="${o * .8}">${s}</g>`; }
    if (p === 'rays') { const cx = w / 2, cy = h / 2, R = Math.hypot(w, h); let s = ''; for (let i = 0; i < 24; i += 2) { const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12; s += `<path d="M${cx} ${cy}L${r1(cx + Math.cos(a) * R)} ${r1(cy + Math.sin(a) * R)}L${r1(cx + Math.cos(b) * R)} ${r1(cy + Math.sin(b) * R)}z"/>`; } return `<g fill="${ink}" opacity="${o * .9}">${s}</g>`; }
    if (p === 'frame') { const m = Math.min(w, h) * .045; return `<g fill="none" stroke="${ink}" opacity="${mode === 'mini' ? .7 : .55}"><rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" rx="${m}" stroke-width="${m * .5}"/><rect x="${m * 1.9}" y="${m * 1.9}" width="${w - 3.8 * m}" height="${h - 3.8 * m}" rx="${m * .6}" stroke-width="${m * .18}" stroke-dasharray="${m * .6} ${m * .4}"/></g>`; }
    if (p === 'confetti') { let s = ''; const cols = ['#E2483B', '#F2B33D', '#1F6F66', '#8C3557', '#4C7424', '#2A6FB0']; let seed = 7; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const n = mode === 'mini' ? 14 : 46; for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, z = Math.max(w, h) * (.012 + R() * .012); s += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(z * 2.2)}" height="${r1(z)}" rx="${r1(z / 3)}" fill="${cols[i % 6]}" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})"/>`; } return `<g opacity="${mode === 'mini' ? .9 : .75}">${s}</g>`; }
    return '';
  }
  const bgMarkup = () => `<rect width="${CW}" height="${CH}" fill="${st.bg}"/>${patternMarkup(st.pattern, CW, CH, st.bg)}${shape === 'badge' ? `<circle cx="${CW / 2}" cy="${CH / 2}" r="${Math.min(CW, CH) / 2 - 14}" fill="none" stroke="${isDark(st.bg) ? '#FFFFFF' : '#2B1A10'}" stroke-opacity=".35" stroke-width="6" stroke-dasharray="4 10" stroke-linecap="round"/>` : ''}`;
  function renderBg(fromEl) {
    const old = bgG.innerHTML;
    bgG.innerHTML = bgMarkup();
    if (api.reduced || !fromEl) return;
    // circular wipe: the new background grows from the side of the canvas nearest the swatch
    const tmp = document.createElementNS(NS, 'g'); tmp.innerHTML = old; bgG.prepend(tmp);
    const newer = [...bgG.children].slice(1);
    const clip = document.createElementNS(NS, 'clipPath'); clip.id = `${P}-wipe`;
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', CW); c.setAttribute('cy', 0); c.setAttribute('r', 0); clip.append(c);
    svg.querySelector('defs').append(clip);
    const wrap = document.createElementNS(NS, 'g'); wrap.setAttribute('clip-path', `url(#${P}-wipe)`); newer.forEach(n => wrap.append(n)); bgG.append(wrap);
    gsap.to(c, { attr: { r: Math.hypot(CW, CH) }, duration: .6, ease: 'power2.inOut', onComplete: () => { tmp.remove(); [...wrap.childNodes].forEach(n => bgG.append(n)); wrap.remove(); clip.remove(); } });
  }
  root.querySelectorAll('.dz-sw').forEach(b => b.addEventListener('click', () => {
    st.bg = b.dataset.bg; st.bgChosen = true;
    root.querySelectorAll('.dz-sw').forEach(x => x.classList.toggle('on', x === b));
    renderBg(b); api.sound('pop');
    // keep text readable on the new background
    for (const e of st.els) if (e.kind === 'text' && e.autoColor) { e.color = isDark(st.bg) ? '#FFFFFF' : '#2B1A10'; renderEl(e); }
    checkRules();
  }));
  root.querySelectorAll('.dz-pat').forEach(b => b.addEventListener('click', () => {
    st.pattern = b.dataset.pat; if (st.pattern !== 'none') st.bgChosen = true;
    root.querySelectorAll('.dz-pat').forEach(x => x.classList.toggle('on', x === b));
    renderBg(b); api.sound('pop'); checkRules();
  }));
  renderBg();

  /* ---------- elements ---------- */
  function stickerArt(item, size) {
    if (item.sprite && api.hasSprite(item.sprite)) return api.sprite(item.sprite).replace(/^<svg[^>]*>/, `<svg x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="visible">`);
    return `<text x="0" y="${size * .04}" font-size="${size * .8}" font-family="${EMOJI_FONT}" text-anchor="middle" dominant-baseline="central">${esc(item.emoji || '⭐')}</text>`;
  }
  const font = id => FONTS.find(f => f.id === id) || FONTS[0];
  function textInner(e) {
    const f = font(e.font), lines = String(e.text || ' ').split('\n'), lh = e.size * 1.18;
    const y0 = -((lines.length - 1) * lh) / 2;
    const tsp = lines.map((l, i) => `<tspan x="0" y="${r1(y0 + i * lh)}">${esc(l) || ' '}</tspan>`).join('');
    const stroke = e.style === 'outline' ? ` stroke="${isDark(e.color) ? '#FFFFFF' : '#2B1A10'}" stroke-width="${r1(e.size * .14)}" stroke-linejoin="round" paint-order="stroke"` : '';
    const pill = e.style === 'pill' && e.bb ? `<rect x="${r1(e.bb.x - e.size * .45)}" y="${r1(e.bb.y - e.size * .18)}" width="${r1(e.bb.w + e.size * .9)}" height="${r1(e.bb.h + e.size * .36)}" rx="${r1(Math.min(e.size * .5, (e.bb.h + e.size * .36) / 2))}" fill="${isDark(e.color) ? '#FFF9EF' : '#2B1A10'}"/>` : '';
    return `${pill}<text class="dz-t" font-family="${f.css}" font-weight="${f.weight}" font-size="${e.size}" fill="${e.color}" text-anchor="middle" dominant-baseline="central"${stroke}>${tsp}</text>`;
  }
  const inner = e => (e.kind === 'text' ? textInner(e) : stickerArt(e.item, 150));
  const xf = e => `translate(${r1(e.x)} ${r1(e.y)}) rotate(${r1(e.rot)}) scale(${r1(e.flip ? -e.scale * 100 : e.scale * 100) / 100} ${r1(e.scale * 100) / 100})`;

  function renderEl(e) {
    const g = e.g, inn = g.querySelector('.dz-in');
    g.setAttribute('transform', xf(e));
    if (e.kind === 'text') {
      inn.innerHTML = textInner({ ...e, style: e.style === 'pill' ? 'plain' : e.style });
      const t = inn.querySelector('text').getBBox();
      e.bb = { x: t.x, y: t.y, w: t.width, h: t.height };
      if (e.style === 'pill') inn.innerHTML = textInner(e);
      g.setAttribute('aria-label', `Text: ${e.text}`);
    } else if (!inn.firstChild) { inn.innerHTML = inner(e); }
    if (st.sel === e) drawSel();
  }
  function addEl(e, { pop = true } = {}) {
    e.id = ++nid;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `dz-el dz-${e.kind}`); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.setAttribute('aria-label', e.kind === 'text' ? `Text: ${e.text}` : `Sticker: ${e.item.label || e.item.sprite || e.item.emoji || ''}`);
    g.innerHTML = '<g class="dz-in"></g>';
    e.g = g; elsG.append(g); st.els.push(e);
    renderEl(e);
    bindEl(e);
    select(e);
    if (pop && !api.reduced) gsap.from(g.querySelector('.dz-in'), { scale: 0, rotation: -25, transformOrigin: '50% 50%', duration: .7, ease: 'elastic.out(1, .5)' });
    api.sound('pop');
    $('.dz-ghost').style.display = 'none';
    checkRules();
    return e;
  }
  function removeEl(e) {
    st.els = st.els.filter(x => x !== e);
    if (st.sel === e) select(null);
    e.drag?.kill(); e.proxy?.remove();
    api.sound('whoosh');
    const g = e.g;
    if (api.reduced) g.remove(); else gsap.to(g.querySelector('.dz-in'), { scale: 0, rotation: 30, opacity: 0, transformOrigin: '50% 50%', duration: .3, ease: 'back.in(2)', onComplete: () => g.remove() });
    if (e.field) { /* keep the field's text, it can be re-added by typing */ }
    if (!st.els.length) $('.dz-ghost').style.display = '';
    checkRules();
  }
  function reorder(e, dir) {
    const i = st.els.indexOf(e), j = clamp(i + dir, 0, st.els.length - 1);
    if (i === j) { api.say(dir > 0 ? 'It is already on top.' : 'It is already at the back.', 'hint'); return; }
    st.els.splice(i, 1); st.els.splice(j, 0, e);
    st.els.forEach(x => elsG.append(x.g));
    api.sound('click');
    if (!api.reduced) gsap.fromTo(e.g.querySelector('.dz-in'), { scale: 1 }, { scale: dir > 0 ? 1.12 : .9, yoyo: true, repeat: 1, duration: .14, transformOrigin: '50% 50%' });
    drawSel();
  }

  /* ---------- pointer helpers & gestures (Draggable drives a hidden proxy; we do the maths) ---------- */
  function svgPt(px, py) { const p = svg.createSVGPoint(); p.x = px - scrollX; p.y = py - scrollY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function gesture(trigger, h) {
    const proxy = document.createElement('div'); proxy.className = 'dz-proxy'; $('.dz-proxies').append(proxy);
    const [d] = Draggable.create(proxy, {
      trigger, type: 'x,y', minimumMovement: 3, zIndexBoost: false, allowContextMenu: true,
      onPress(ev) { h.press?.(svgPt(this.pointerX, this.pointerY), ev); },
      onDrag() { h.drag?.(svgPt(this.pointerX, this.pointerY)); },
      onRelease() { gsap.set(proxy, { x: 0, y: 0 }); h.release?.(); },
      onClick(ev) { h.click?.(ev); },
    });
    drags.push(d);
    return { d, proxy };
  }
  let lastTap = { id: 0, t: 0 };
  function bindEl(e) {
    let p0, s0;
    const { d, proxy } = gesture(e.g, {
      press(p) { if (done) return; select(e); p0 = p; s0 = { x: e.x, y: e.y }; e.g.classList.add('is-moving'); },
      drag(p) {
        let x = s0.x + p.x - p0.x, y = s0.y + p.y - p0.y;
        const snap = 9 * upp;
        const sv = Math.abs(x - CW / 2) < snap, sh = Math.abs(y - CH / 2) < snap;
        if (sv) x = CW / 2; if (sh) y = CH / 2;
        root.classList.toggle('dz-snap-v', sv); root.classList.toggle('dz-snap-h', sh);
        e.x = clamp(x, -40, CW + 40); e.y = clamp(y, -40, CH + 40);
        e.g.setAttribute('transform', xf(e)); drawSel();
      },
      release() { e.g.classList.remove('is-moving'); root.classList.remove('dz-snap-v', 'dz-snap-h'); },
      click() {
        const now = performance.now();
        if (e.kind === 'text' && lastTap.id === e.id && now - lastTap.t < 420) { openEditor(e); lastTap = { id: 0, t: 0 }; return; }
        lastTap = { id: e.id, t: now };
      },
    });
    e.drag = d; e.proxy = proxy;
    e.g.addEventListener('dblclick', () => e.kind === 'text' && openEditor(e));
    e.g.addEventListener('focus', () => { if (st.sel !== e) select(e); });
    e.g.addEventListener('keydown', ev => {
      const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (mv) { ev.preventDefault(); const k = ev.shiftKey ? 40 : 10; e.x += mv[0] * k; e.y += mv[1] * k; renderEl(e); }
      else if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); removeEl(e); }
      else if (ev.key === 'Enter' && e.kind === 'text') { ev.preventDefault(); openEditor(e); }
      else if (ev.key === '+' || ev.key === '=') { e.scale = clamp(e.scale * 1.1, .2, 6); renderEl(e); }
      else if (ev.key === '-') { e.scale = clamp(e.scale / 1.1, .2, 6); renderEl(e); }
      else if (ev.key === 'Escape') select(null);
    });
  }
  svg.addEventListener('pointerdown', ev => { if (!ev.target.closest('.dz-el, .dz-selbox')) select(null); });

  /* ---------- selection box with handles ---------- */
  selG.innerHTML = `<g class="dz-sel-in"><rect class="dz-sel-rect"/><line class="dz-sel-stalk"/>
    <g class="dz-h-rot" role="button" aria-label="Rotate"><circle class="dz-hc"/><path class="dz-hi" d="M-4.5-1.5a5 5 0 1 1 1.2 5.3M-4.5-1.5v-3.6M-4.5-1.5h3.6"/></g>
    <g class="dz-h-scale" role="button" aria-label="Resize"><circle class="dz-hc"/><path class="dz-hi" d="M-4 4L4-4M0-4h4v4M-4 0v4h4"/></g>
    <g class="dz-h-del" role="button" aria-label="Delete"><circle class="dz-hc dz-hc-del"/><path class="dz-hi" d="M-3.5-3.5l7 7M3.5-3.5l-7 7"/></g></g>`;
  function drawSel() {
    const e = st.sel;
    if (!e || !e.g.isConnected) { selG.setAttribute('visibility', 'hidden'); return; }
    const bb = e.g.querySelector('.dz-in').getBBox();
    const pad = 8 * upp, w = bb.width * e.scale + pad * 2, h = bb.height * e.scale + pad * 2;
    const cx = (bb.x + bb.width / 2) * e.scale * (e.flip ? -1 : 1), cy = (bb.y + bb.height / 2) * e.scale;
    const hr = 15 * upp;
    selG.setAttribute('visibility', 'visible');
    selG.setAttribute('transform', `translate(${r1(e.x)} ${r1(e.y)}) rotate(${r1(e.rot)}) translate(${r1(cx)} ${r1(cy)})`);
    const q = s => selG.querySelector(s);
    Object.entries({ x: -w / 2, y: -h / 2, width: w, height: h, rx: 6 * upp, 'stroke-width': 2 * upp }).forEach(([k, v]) => q('.dz-sel-rect').setAttribute(k, r1(v)));
    q('.dz-sel-rect').setAttribute('stroke-dasharray', `${r1(7 * upp)} ${r1(5 * upp)}`);
    Object.entries({ x1: 0, y1: -h / 2, x2: 0, y2: -h / 2 - 30 * upp, 'stroke-width': 2 * upp }).forEach(([k, v]) => q('.dz-sel-stalk').setAttribute(k, r1(v)));
    const place = (sel, x, y) => { const g = q(sel); g.setAttribute('transform', `translate(${r1(x)} ${r1(y)}) scale(${r1(upp * 10) / 10})`); g.querySelector('.dz-hc').setAttribute('r', 15); };
    place('.dz-h-rot', 0, -h / 2 - 30 * upp - hr * .2);
    place('.dz-h-scale', w / 2, h / 2);
    place('.dz-h-del', -w / 2, -h / 2);
  }
  {
    let c0, d0, sc0;
    gesture(selG.querySelector('.dz-h-scale'), {
      press(p) { const e = st.sel; if (!e) return; c0 = { x: e.x, y: e.y }; d0 = Math.max(10, Math.hypot(p.x - e.x, p.y - e.y)); sc0 = e.scale; },
      drag(p) { const e = st.sel; if (!e) return; e.scale = clamp(sc0 * Math.hypot(p.x - c0.x, p.y - c0.y) / d0, .2, 6); renderEl(e); },
      release() { api.sound('tick'); },
    });
    gesture(selG.querySelector('.dz-h-rot'), {
      drag(p) {
        const e = st.sel; if (!e) return;
        let a = Math.atan2(p.y - e.y, p.x - e.x) * 180 / Math.PI + 90;
        for (const s of [-180, -90, 0, 90, 180, 270]) if (Math.abs(a - s) < 6) a = s;
        e.rot = ((a + 540) % 360) - 180; renderEl(e);
      },
      release() { api.sound('tick'); },
    });
    gesture(selG.querySelector('.dz-h-del'), { click() { if (st.sel) removeEl(st.sel); } });
  }

  /* ---------- toolbar for the selection ---------- */
  function select(e) {
    if (st.sel === e) { drawSel(); return; }
    st.sel = e;
    root.querySelectorAll('.dz-el.is-sel').forEach(g => g.classList.remove('is-sel'));
    e?.g.classList.add('is-sel');
    drawSel();
    renderTools();
    if (e && !api.reduced) gsap.fromTo(selG, { opacity: 0 }, { opacity: 1, duration: .2 });
  }
  function renderTools() {
    const e = st.sel;
    if (!e) { tools.innerHTML = `<p class="dz-tools-empty">Tap something on your ${esc(shape)} to change it. Double-tap text to edit it.</p>`; return; }
    const common = `<span class="dz-sep"></span><button type="button" class="dz-tb" data-act="fwd" aria-label="Bring forward" title="Bring forward">⬆<small>Front</small></button><button type="button" class="dz-tb" data-act="back" aria-label="Send backward" title="Send backward">⬇<small>Back</small></button><button type="button" class="dz-tb dz-tb-del" data-act="del" aria-label="Delete" title="Delete">🗑<small>Delete</small></button>`;
    if (e.kind === 'text') {
      tools.innerHTML = `<button type="button" class="dz-tb" data-act="edit" aria-label="Edit text">✏️<small>Edit</small></button>
        <button type="button" class="dz-tb" data-act="smaller" aria-label="Smaller text">A<sub>−</sub><small>Smaller</small></button><button type="button" class="dz-tb" data-act="bigger" aria-label="Bigger text">A<sup>+</sup><small>Bigger</small></button>
        <button type="button" class="dz-tb dz-tb-font" data-act="font" aria-label="Change font" style="font-family:${font(e.font).css}">Aa<small>${font(e.font).name}</small></button>
        <button type="button" class="dz-tb" data-act="style" aria-label="Change text style">✨<small>${STYLES.find(s => s.id === e.style).name}</small></button>
        <span class="dz-colors">${textColors.map(c => `<button type="button" class="dz-tc${c === e.color.toUpperCase() ? ' on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Text colour ${c}"></button>`).join('')}</span>${common}`;
    } else {
      tools.innerHTML = `<button type="button" class="dz-tb" data-act="smaller" aria-label="Smaller">➖<small>Smaller</small></button><button type="button" class="dz-tb" data-act="bigger" aria-label="Bigger">➕<small>Bigger</small></button><button type="button" class="dz-tb" data-act="flip" aria-label="Flip">↔️<small>Flip</small></button><button type="button" class="dz-tb" data-act="turn" aria-label="Turn">↻<small>Turn</small></button>${common}`;
    }
    if (!api.reduced) gsap.from(tools.children, { y: 8, opacity: 0, duration: .25, stagger: .02, ease: 'power2.out' });
  }
  tools.addEventListener('click', ev => {
    const b = ev.target.closest('button'); const e = st.sel; if (!b || !e) return;
    const act = b.dataset.act;
    if (b.dataset.color) { e.color = b.dataset.color; e.autoColor = false; renderEl(e); renderTools(); api.sound('pop'); return; }
    if (act === 'edit') openEditor(e);
    else if (act === 'bigger' || act === 'smaller') {
      const k = act === 'bigger' ? 1.15 : 1 / 1.15;
      if (e.kind === 'text') { e.size = clamp(Math.round(e.size * k), 14, 200); } else e.scale = clamp(e.scale * k, .2, 6);
      renderEl(e); api.sound('tick');
    } else if (act === 'font') { e.font = FONTS[(FONTS.findIndex(f => f.id === e.font) + 1) % FONTS.length].id; renderEl(e); renderTools(); api.sound('click'); }
    else if (act === 'style') { e.style = STYLES[(STYLES.findIndex(s => s.id === e.style) + 1) % STYLES.length].id; renderEl(e); renderTools(); api.sound('click'); }
    else if (act === 'flip') { e.flip = !e.flip; if (!api.reduced) gsap.fromTo(e.g.querySelector('.dz-in'), { scaleX: -1, transformOrigin: '50% 50%' }, { scaleX: 1, duration: .35 }); renderEl(e); api.sound('whoosh'); }
    else if (act === 'turn') { e.rot = ((e.rot + 15 + 540) % 360) - 180; renderEl(e); api.sound('tick'); }
    else if (act === 'fwd') reorder(e, 1);
    else if (act === 'back') reorder(e, -1);
    else if (act === 'del') removeEl(e);
    if (act !== 'del') drawSel();
  });

  /* ---------- text editing ---------- */
  let editing = null, before = '';
  function openEditor(e) {
    if (done) return;
    editing = e; before = e.text;
    editor.hidden = false; ta.value = e.text;
    if (!api.reduced) gsap.fromTo(editor, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: 'back.out(2)' });
    ta.focus(); ta.select();
  }
  function closeEditor(keep) {
    if (!editing) return;
    const e = editing; editing = null;
    if (!keep) { e.text = before; renderEl(e); }
    if (!e.text.trim()) { removeEl(e); } else if (e.field) { st.fields[e.field] = e.text; const inp = root.querySelector(`[data-field="${CSS.escape(e.field)}"]`); if (inp) inp.value = e.text; }
    editor.hidden = true; checkRules(); renderTools();
    e.g.focus?.({ preventScroll: true });
  }
  ta.addEventListener('input', () => { if (!editing) return; editing.text = ta.value.replace(/\n{3,}/g, '\n\n'); renderEl(editing); checkRules(); });
  ta.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); closeEditor(true); } else if (ev.key === 'Escape') { ev.preventDefault(); closeEditor(false); } });
  editor.addEventListener('click', ev => { const b = ev.target.closest('[data-ed]'); if (b) closeEditor(b.dataset.ed === 'ok'); });

  /* ---------- adding things ---------- */
  const texts = () => st.els.filter(e => e.kind === 'text' && e.text.trim());
  function newText(text, extra = {}) {
    const n = texts().length;
    const title = n === 0;
    const size = title ? Math.round(Math.min(CW, CH) * .11) : Math.round(Math.min(CW, CH) * .062);
    // put new text in the emptiest row, away from the words already there
    const rows = [.16, .3, .44, .58, .72, .86].map(f => f * CH);
    const y = title ? rows[0] : rows.slice(1).reduce((best, r) => {
      const gap = r2 => Math.min(...texts().map(e => Math.abs(e.y - r2)), Infinity);
      return gap(r) > gap(best) + 1 ? r : best;
    }, rows[1]);
    return addEl({ kind: 'text', text, x: CW / 2, y, rot: 0, scale: 1, size, color: isDark(st.bg) ? '#FFFFFF' : '#2B1A10', autoColor: true, font: title ? 'loud' : 'sans', style: 'plain', ...extra });
  }
  $('.dz-addtext').addEventListener('click', () => { const e = newText('Your text'); openEditor(e); });
  root.querySelectorAll('.dz-idea').forEach(b => b.addEventListener('click', () => {
    newText(cfg.texts[+b.dataset.idea]);
    if (!api.reduced) gsap.fromTo(b, { scale: .92 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
  }));
  root.querySelectorAll('.dz-stk').forEach(b => b.addEventListener('click', () => {
    const n = st.els.filter(e => e.kind === 'sticker').length;
    const a = n * 2.4, r = Math.min(CW, CH) * (.12 + (n % 3) * .07);
    const sc = Math.min(CW, CH) * .26 / 150;
    addEl({ kind: 'sticker', item: stickers[+b.dataset.stk], x: clamp(CW / 2 + Math.cos(a) * r, CW * .15, CW * .85), y: clamp(CH * .58 + Math.sin(a) * r, CH * .2, CH * .88), rot: Math.round((Math.random() - .5) * 16), scale: sc });
    if (!api.reduced) gsap.fromTo(b, { scale: .8 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
  }));
  root.querySelectorAll('[data-field]').forEach(inp => inp.addEventListener('input', () => {
    const key = inp.dataset.field, v = inp.value;
    st.fields[key] = v;
    let e = st.els.find(x => x.field === key);
    if (v.trim()) {
      if (!e) e = newText(v, { field: key });
      else { e.text = v; renderEl(e); }
    } else if (e) removeEl(e);
    checkRules();
  }));

  /* ---------- tabs ---------- */
  root.querySelectorAll('.dz-tab').forEach(t => t.addEventListener('click', () => {
    root.querySelectorAll('.dz-tab').forEach(x => x.setAttribute('aria-selected', String(x === t)));
    root.querySelectorAll('.dz-pane').forEach(p => { p.hidden = p.dataset.pane !== t.dataset.tab; });
    const pane = root.querySelector(`.dz-pane[data-pane="${t.dataset.tab}"]`);
    if (!api.reduced) gsap.from(pane.children, { y: 10, opacity: 0, duration: .3, stagger: .04 });
    api.sound('click');
  }));

  /* ---------- checklist ---------- */
  function ruleOk(rule) {
    const [kind, ...rest] = String(rule).split(':'); const arg = rest.join(':');
    if (kind === 'text') return texts().length >= (+arg || 1);
    if (kind === 'stickers') return st.els.filter(e => e.kind === 'sticker').length >= (+arg || 1);
    if (kind === 'contains') return texts().some(e => e.text.toLowerCase().includes(arg.toLowerCase()));
    if (kind === 'background') return st.bgChosen;
    if (kind === 'field') return !!String(st.fields[arg] || '').trim() && st.els.some(e => e.field === arg);
    return false;
  }
  function checkRules() {
    checklist.forEach((c, i) => {
      const ok = ruleOk(c.rule);
      if (ok === okState[i]) return;
      okState[i] = ok;
      const li = root.querySelector(`[data-ck="${i}"]`);
      li.classList.toggle('ok', ok);
      if (ok && !api.reduced) {
        gsap.fromTo(li.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: .35, ease: 'power2.out' });
        gsap.fromTo(li.querySelector('.dz-box'), { scale: .5 }, { scale: 1, duration: .55, ease: 'elastic.out(1.1, .4)' });
        sparkle(api, li.querySelector('.dz-box'));
      }
      if (ok) api.sound('pop');
    });
    const n = okState.filter(Boolean).length;
    api.progress(n / checklist.length * .9);
    const all = n === checklist.length;
    $('.dz-save').classList.toggle('ready', all);
    if (all && !allOk) { api.say('Everything on the checklist is done! Make it look just right, then save it to your portfolio.', 'good'); if (!api.reduced) gsap.fromTo('.lab-design .dz-save', { scale: .9 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' }); }
    allOk = all;
  }

  /* ---------- export to PNG ---------- */
  function exportSvg() {
    const els = st.els.map(e => `<g transform="${xf(e)}">${e.kind === 'text' ? textInner(e) : stickerArt(e.item, 150)}</g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" style="color:#2B1A10"><defs><clipPath id="clip">${clipShape}</clipPath></defs><g clip-path="url(#clip)">${bgMarkup()}${els}</g></svg>`;
  }
  async function exportPng() {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Could not draw the design')); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(exportSvg())}`; });
    const k = Math.min(2, 1400 / Math.max(CW, CH));
    const c = document.createElement('canvas'); c.width = Math.round(CW * k); c.height = Math.round(CH * k);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }
  $('.dz-save').addEventListener('click', async () => {
    if (done || saving) return;
    closeEditor(true);
    const missing = checklist.filter((c, i) => !okState[i]);
    if (missing.length) {
      api.say(`Almost! Still to do: ${missing.map(m => m.text.toLowerCase()).join('; ')}.`, 'hint');
      root.querySelectorAll('.dz-check li:not(.ok)').forEach(li => { if (!api.reduced) gsap.fromTo(li, { x: 0 }, { x: 0, duration: .4, keyframes: { x: [0, -8, 7, -4, 2, 0] } }); });
      return;
    }
    saving = true; select(null);
    let url = '';
    try { url = await exportPng(); } catch (err) { console.error(err); saving = false; api.say('Hmm, the picture could not be saved. Try again.', 'bad'); return; }
    done = true;
    const title = cfg.title || `My ${shape}`;
    api.savePortfolio(url, title);
    api.sound('whoosh');
    celebrate(url);
    later(() => api.complete({ message: cfg.win || `Your ${shape} is saved in your portfolio!` }), 1700);
  });
  function celebrate(url) {
    const box = $('.dz-canvasbox'), btn = $('.dz-save');
    const flash = document.createElement('div'); flash.className = 'dz-flash'; box.append(flash);
    btn.classList.add('saved'); btn.querySelector('span:last-child').textContent = 'Saved!';
    if (api.reduced) return;
    gsap.fromTo(flash, { opacity: .9 }, { opacity: 0, duration: .5, onComplete: () => flash.remove() });
    const a = box.getBoundingClientRect(), b = btn.querySelector('.dz-save-ic').getBoundingClientRect(), rb = root.getBoundingClientRect();
    const img = document.createElement('img'); img.className = 'dz-flyimg'; img.alt = ''; img.src = url;
    root.append(img);
    gsap.set(img, { left: a.left - rb.left, top: a.top - rb.top, width: a.width, height: a.height });
    gsap.timeline()
      .to(img, { scale: .92, rotation: -3, duration: .25, ease: 'power2.out' })
      .to(img, { duration: .8, ease: 'power3.in', x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2), scale: .04, rotation: 12, opacity: .6, onComplete: () => { img.remove(); sparkle(api, btn); api.sound('drop'); } });
  }

  /* ---------- start ---------- */
  $('.dz-ghost').innerHTML = `<rect x="${CW * .08}" y="${CH * .08}" width="${CW * .84}" height="${CH * .84}" rx="${Math.min(CW, CH) * .04}" class="dz-ghost-r"/>
    <text x="${CW / 2}" y="${CH / 2 - Math.min(CW, CH) * .07}" text-anchor="middle" class="dz-ghost-t" font-size="${Math.min(CW, CH) * .06}">Your ${esc(shape)} starts here</text>
    <text x="${CW / 2}" y="${CH / 2 + Math.min(CW, CH) * .03}" text-anchor="middle" class="dz-ghost-s" font-size="${Math.min(CW, CH) * .036}">Pick a colour · add words · add stickers</text>`;
  checkRules();
  api.progress(0);
  api.say(cfg.mission || 'Make your design, tick the checklist and save it!');
  if (!api.reduced) {
    gsap.from(svg, { scale: .92, opacity: 0, duration: .6, ease: 'back.out(1.6)', delay: .1 });
    gsap.from(root.querySelectorAll('.dz-sw, .dz-pat'), { y: 14, opacity: 0, duration: .4, stagger: .025, ease: 'back.out(3)', delay: .3, clearProps: 'transform,opacity' });
    gsap.from(root.querySelectorAll('.dz-check li'), { x: 20, opacity: 0, duration: .4, stagger: .06, delay: .4 });
  }

  return {
    destroy() {
      timers.forEach(clearTimeout);
      drags.forEach(d => d.kill());
      gsap.killTweensOf(root.querySelectorAll('*'));
      root.querySelectorAll('.dz-flyimg').forEach(n => n.remove());
    },
  };
}

export const demo = {
  type: 'design',
  title: 'Garden Sale Poster',
  canvas: 'poster',
  mission: 'Our school garden is selling fresh vegetables on Saturday! Make a bright poster: a catchy title, pictures of the produce, the price and where the sale is.',
  fact: 'Good posters can be read from 3 metres away: big title, few words, and one bright colour that stands out.',
  palette: ['#1F6F66', '#D98A1C', '#8C3557', '#4C7424', '#FFF9EF'],
  stickers: [
    { sprite: 'tomato', emoji: '🍅' }, { sprite: 'spinach', emoji: '🥬' }, { sprite: 'carrot', emoji: '🥕' }, { sprite: 'chilli', emoji: '🌶️' },
    { sprite: 'brinjal', emoji: '🍆' }, { sprite: 'lemon', emoji: '🍋' }, { sprite: 'sunflower', emoji: '🌻' }, { sprite: 'bee', emoji: '🐝' },
    { sprite: 'watering-can', emoji: '🚿' }, { sprite: 'shopping-bag', emoji: '🛍️' }, { sprite: 'price-tag', emoji: '🏷️' }, { emoji: '🌿' }, { emoji: '⭐' }, { emoji: '🧺' },
  ],
  texts: ['Fresh from our school garden!', 'Grown without chemicals', '₹20 a bunch', 'Saturday, 10 am to 1 pm', 'Bring your own bag!'],
  fields: [{ key: 'place', label: 'Where is the sale?', placeholder: 'e.g. Near the school gate' }],
  checklist: [
    { text: 'Add a catchy title', rule: 'text:1' },
    { text: 'Add at least 3 pictures', rule: 'stickers:3' },
    { text: 'Show the price (₹)', rule: 'contains:₹' },
    { text: 'Say where the sale is', rule: 'field:place' },
    { text: 'Choose a background colour', rule: 'background' },
  ],
  win: 'What a poster! It is saved in your portfolio, ready to print and stick on the notice board.',
};
