// Shared helpers for lab types. Import what you need: import { h, art, dragDrop, ... } from '../kit.js';
// Read-only for lab type authors: if a type needs something special, keep it inside the type's file.
import { itemArt } from './runtime.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Build an element from an HTML string (first element). */
export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

/** Art for a config item ({ sprite } / { emoji }) at an optional pixel size. Empty string if none. */
export const art = (item, size) => itemArt(item, size);

/** A labelled token (art + label) used for draggable items, cards and choices. */
export const token = (item, cls = '') => `<div class="lab-token ${cls}">${art(item) ? `<span class="lab-token-art">${art(item)}</span>` : ''}<span class="lab-token-label">${esc(item.label ?? item.text ?? '')}</span></div>`;

/** Seeded shuffle (Fisher–Yates). Same seed gives the same order. */
export function shuffle(arr, seed = Date.now()) {
  const a = [...arr];
  let s = seed % 2147483647 || 1;
  const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Shake an element (wrong answer). */
export function shake(api, el) { if (!api.gsap || api.reduced) return; api.gsap.fromTo(el, { x: 0 }, { x: 0, duration: .45, ease: 'none', keyframes: { x: [0, -10, 9, -6, 4, 0] } }); }
/** Pop an element (right answer). */
export function pop(api, el, scale = 1.15) { if (!api.gsap || api.reduced) return; api.gsap.fromTo(el, { scale: 1 }, { scale, duration: .16, yoyo: true, repeat: 1, ease: 'power2.out' }); }
/** Small sparkle burst at an element's centre, inside the lab. */
export function sparkle(api, el, colors = ['#F0B44C', '#4C7424', '#1F6F66', '#C2502A']) {
  if (!api.gsap || api.reduced) return;
  const host = api.root, hb = host.getBoundingClientRect(), b = el.getBoundingClientRect();
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('i');
    p.className = 'lab-spark';
    p.style.background = colors[i % colors.length];
    p.style.left = `${b.left - hb.left + b.width / 2}px`; p.style.top = `${b.top - hb.top + b.height / 2}px`;
    host.append(p);
    const a = (i / 14) * Math.PI * 2, r = 40 + Math.random() * 50;
    api.gsap.to(p, { x: Math.cos(a) * r, y: Math.sin(a) * r, scale: 0, duration: .7, ease: 'power2.out', onComplete: () => p.remove() });
  }
}

/**
 * Drag items onto targets with GSAP Draggable.
 * items: elements to drag. targets: elements to drop on.
 * accept(item, target) -> true (snap into target) | false (fly back) | 'stay' (leave where dropped)
 * onDrop(item, target, ok) is called after.
 * Returns { kill() }.
 */
export function dragDrop(api, { items, targets, accept, onDrop, onPress, overlap = '40%', snapTo }) {
  const { Draggable, gsap } = api;
  const ds = [];
  for (const it of items) {
    const [d] = Draggable.create(it, {
      type: 'x,y', zIndexBoost: true, dragClickables: true, cursor: 'grab', activeCursor: 'grabbing',
      onPress() { it.classList.add('dragging'); onPress?.(it); api.sound('click'); },
      onDrag() { targets.forEach(t => t.classList.toggle('over', this.hitTest(t, overlap))); },
      onRelease() {
        it.classList.remove('dragging');
        const t = targets.find(x => this.hitTest(x, overlap));
        targets.forEach(x => x.classList.remove('over'));
        if (!t) { back(it); return; }
        const ok = accept(it, t);
        if (ok === true) {
          if (snapTo !== false) moveInto(api, it, snapTo ? snapTo(it, t) : t);
          api.sound('drop');
        } else if (ok === false) { back(it); }
        onDrop?.(it, t, ok);
      },
    });
    ds.push(d);
  }
  function back(it) { gsap.to(it, { x: 0, y: 0, duration: .45, ease: 'back.out(1.6)' }); }
  return { kill() { ds.forEach(d => d.kill()); }, draggables: ds };
}

/** Animate an element into a container: re-parent it and tween from where it was. */
export function moveInto(api, el, container, { append = true } = {}) {
  const before = el.getBoundingClientRect();
  api.gsap.set(el, { x: 0, y: 0 });
  if (append) container.append(el);
  const after = el.getBoundingClientRect();
  api.gsap.fromTo(el, { x: before.left - after.left, y: before.top - after.top }, { x: 0, y: 0, duration: .4, ease: 'power3.out' });
}

/**
 * Safe arithmetic: numbers, + - * / ^ %, parentheses, min/max/round/floor/ceil/abs/sqrt, and variables.
 * evalExpr('(sprouted / sown) * 100', { sprouted: 42, sown: 50 }) -> 84
 */
export function evalExpr(expr, vars = {}) {
  const src = String(expr); let i = 0;
  const FN = { min: Math.min, max: Math.max, round: Math.round, floor: Math.floor, ceil: Math.ceil, abs: Math.abs, sqrt: Math.sqrt };
  const ws = () => { while (/\s/.test(src[i])) i++; };
  const num = () => { ws(); const m = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i)); if (m) { i += m[0].length; return +m[0]; } return null; };
  function atom() {
    ws();
    if (src[i] === '(') { i++; const v = sum(); ws(); if (src[i] !== ')') throw new Error(`Missing ) in ${expr}`); i++; return v; }
    const n = num(); if (n != null) return n;
    const m = /^[A-Za-z_]\w*/.exec(src.slice(i));
    if (!m) throw new Error(`Bad expression: ${expr}`);
    i += m[0].length; ws();
    if (src[i] === '(' && FN[m[0]]) { i++; const args = [sum()]; ws(); while (src[i] === ',') { i++; args.push(sum()); ws(); } i++; return FN[m[0]](...args); }
    if (!(m[0] in vars)) throw new Error(`Unknown value "${m[0]}" in ${expr}`);
    return +vars[m[0]];
  }
  function pow() { ws(); if (src[i] === '-') { i++; return -pow(); } const v = atom(); ws(); if (src[i] === '^') { i++; return v ** pow(); } return v; }
  function prod() { let v = pow(); ws(); while ('*/%'.includes(src[i]) && src[i]) { const op = src[i++]; const r = pow(); v = op === '*' ? v * r : op === '/' ? v / r : v % r; ws(); } return v; }
  function sum() { let v = prod(); ws(); while ((src[i] === '+' || src[i] === '-')) { const op = src[i++]; const r = prod(); v = op === '+' ? v + r : v - r; ws(); } return v; }
  const v = sum();
  ws();
  if (i < src.length) throw new Error(`Unexpected "${src.slice(i)}" in ${expr}`);
  return v;
}

/** Format a number for children: up to 2 decimals, Indian digit grouping. */
export const fmt = (n, d = 2) => Number.isFinite(n) ? (+n.toFixed(d)).toLocaleString('en-IN') : '—';

/** A primary lab button. */
export const button = (label, cls = '') => `<button type="button" class="lab-act ${cls}">${label}</button>`;

/** Resize observer helper: calls fn(width, height) now and on resize; cleaned up with the lab. */
export function onResize(api, el, fn) {
  const ro = new ResizeObserver(([e]) => fn(e.contentRect.width, e.contentRect.height));
  ro.observe(el);
  api.onCleanup(() => ro.disconnect());
}

/** Wait (respects reduced motion). */
export const wait = (api, ms) => new Promise(r => setTimeout(r, api.reduced ? 0 : ms));
