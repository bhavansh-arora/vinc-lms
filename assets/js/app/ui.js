// Small UI helpers shared by every dashboard.
export { icon, art } from '../art.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ring(pct, { size = 120, stroke = 12, color = 'var(--brand)', label, sub } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct || 0));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--paper-2)" stroke-width="${stroke}"/>
      <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}" style="--c:${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>
    <div class="ring-txt"><b>${label ?? `${Math.round(v)}%`}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
  </div>`;
}

export function bar(pct, color = 'var(--brand)') {
  const v = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return `<span class="bar" role="img" aria-label="${pct == null ? 'Not marked yet' : `${Math.round(v)} percent`}"><i style="width:${v}%;background:${color}"></i></span>`;
}

export function fmtDate(t, opts = { day: 'numeric', month: 'short' }) {
  if (!t) return '—';
  return new Date(t).toLocaleDateString('en-IN', opts);
}
export function timeAgo(t) {
  if (!t) return 'never';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : fmtDate(t);
}
export const daysUntil = iso => Math.ceil((new Date(`${iso}T09:00:00`) - Date.now()) / 86400000);

let toastTimer;
export function toast(msg, kind = 'ok') {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.className = `toast ${kind} show`;
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Simple modal built on <dialog>. Returns the dialog element.
export function modal(html, { wide = false, onClose } = {}) {
  const d = document.createElement('dialog');
  d.className = `modal${wide ? ' wide' : ''}`;
  d.innerHTML = `<div class="modal-in">${html}</div>`;
  document.body.append(d);
  d.addEventListener('close', () => { d.remove(); onClose?.(); });
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  d.showModal();
  return d;
}

export function confetti(colors = ['#D98A1C', '#1F6F66', '#C2502A', '#8C3557', '#4C7424']) {
  if (REDUCED) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.append(c);
  const ctx = c.getContext('2d');
  const W = c.width = innerWidth, H = c.height = innerHeight;
  const bits = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[Math.floor(Math.random() * colors.length)] }));
  const t0 = performance.now();
  (function f(t) {
    ctx.clearRect(0, 0, W, H);
    for (const b of bits) { b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.r += b.vr; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore(); }
    if (t - t0 < 2600) requestAnimationFrame(f); else c.remove();
  })(t0);
}

// Shrink an uploaded photo so the demo fits in browser storage.
export function resizeImage(file, max = 560, q = 0.72) {
  return new Promise((res, rej) => {
    if (!file || !file.type.startsWith('image/')) { rej(new Error('Please choose an image file.')); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That image could not be read.')); };
    img.src = url;
  });
}

export function download(name, text, type = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const csvCell = v => /[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '');

export const FORM_COLOR = { life: 'var(--olive)', machines: 'var(--rust)', services: 'var(--plum)' };
export const FORM_SOFT = { life: 'var(--olive-soft)', machines: 'var(--rust-soft)', services: 'var(--plum-soft)' };
export const PART_COLOR = { written: 'var(--teal-2)', viva: 'var(--amber)', book: 'var(--olive)', portfolio: 'var(--plum)', observation: 'var(--rust)' };
