// Small UI helpers shared by every dashboard.
import { icon as baseIcon } from '../art.js';
import { locale } from '../i18n.js';
export { art } from '../art.js';

// Extra icons for logins and profiles, drawn in the same 24px stroke style as art.js.
const EXTRA = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 4.1M6.3 6.4C3.9 8.1 2.5 12 2.5 12s3.5 7 9.5 7a9.4 9.4 0 0 0 4.4-1.1"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8 20 3M16.5 6.5 19 9M14 9l2 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M6.6 3.5h2.6l1.6 4.2-2 1.4a11 11 0 0 0 6.1 6.1l1.4-2 4.2 1.6v2.6a2.1 2.1 0 0 1-2.3 2.1A17.5 17.5 0 0 1 4.5 5.8a2.1 2.1 0 0 1 2.1-2.3Z"/>',
  sparkle: '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z"/><path d="M19 15.5c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5Z"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.8 5.8"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.7-4.3L3.5 9"/><path d="M3.5 4v5h5"/><path d="M4 13a8 8 0 0 0 14.7 4.3l1.8-2.3"/><path d="M20.5 20v-5h-5"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  'id-card': '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5 16a3.6 3.6 0 0 1 7 0M14.5 10h4M14.5 13.5h3"/>',
  alert: '<path d="M12 3.5 2.8 19.5h18.4L12 3.5Z"/><path d="M12 10v4M12 17v.2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7"/><path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/><path d="M10 11v6M14 11v6"/>',
  idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
};
export const icon = (name, cls = '') => EXTRA[name]
  ? `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[name]}</svg>`
  : baseIcon(name, cls);

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
  return new Date(t).toLocaleDateString(locale(), opts);
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

// Toast: springs up from the bottom, holds, then slides away. A new message replaces the old one.
let toastTimer;
const TOAST_ICON = { ok: 'check', warn: 'alert', bad: 'alert' };
export function toast(msg, kind = 'ok', ms = 3200) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  const wasShown = t.classList.contains('show');
  t.className = `toast ${kind}`;
  t.innerHTML = `<span class="toast-ic">${icon(TOAST_ICON[kind] || 'check')}</span><span>${esc(msg)}</span>`;
  void t.offsetWidth; // restart the entrance when a toast replaces another
  t.classList.add('show');
  if (wasShown) t.classList.add('bump');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show', 'bump'), ms);
}

// Modal built on <dialog>. Opens with a rise-and-settle, closes with a quick fade before it is removed.
// d.close() still works and also animates. Returns the dialog element.
export function modal(html, { wide = false, onClose } = {}) {
  const d = document.createElement('dialog');
  d.className = `modal${wide ? ' wide' : ''}`;
  d.innerHTML = `<div class="modal-in">${html}</div>`;
  document.body.append(d);
  const nativeClose = d.close.bind(d);
  let closing = false;
  d.close = (v) => {
    if (closing || !d.open) return;
    closing = true;
    if (REDUCED) { nativeClose(v); return; }
    d.classList.add('closing');
    const done = () => { clearTimeout(timer); d.removeEventListener('animationend', onEnd); nativeClose(v); };
    const onEnd = e => { if (e.target === d) done(); };
    const timer = setTimeout(done, 280);
    d.addEventListener('animationend', onEnd);
  };
  d.addEventListener('cancel', e => { e.preventDefault(); d.close(); });
  d.addEventListener('close', () => { d.remove(); onClose?.(); });
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  bindCopy(d);
  d.showModal();
  return d;
}

// Buttons with data-copy="text" copy it and flash a tick.
export function bindCopy(el) {
  $$('[data-copy]', el).forEach(b => !b.dataset.copyBound && (b.dataset.copyBound = '1') && b.addEventListener('click', async () => {
    const text = b.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
    }
    b.classList.remove('copied'); void b.offsetWidth; b.classList.add('copied');
    toast(ok ? 'Copied.' : 'Select the text and copy it.', ok ? 'ok' : 'warn', 1600);
  }));
}

// A card listing User IDs and passwords for accounts someone just created or reset.
export function credsHtml(rows, note = 'Share these privately. Each person will be asked to choose their own password after logging in.') {
  return `<div class="creds">${rows.map(r => `<div class="cred">
      <span class="cred-who">${icon(r.icon || 'user')}<span><b>${esc(r.name)}</b><small>${esc(r.role)}</small></span></span>
      <dl>
        <div><dt>User ID</dt><dd><code>${esc(r.login)}</code><button type="button" class="copy-btn" data-copy="${esc(r.login)}" aria-label="Copy User ID">${icon('copy')}</button></dd></div>
        ${r.pw ? `<div><dt>${r.temp === false ? 'Password' : 'Temporary password'}</dt><dd><code>${esc(r.pw)}</code><button type="button" class="copy-btn" data-copy="${esc(r.pw)}" aria-label="Copy password">${icon('copy')}</button></dd></div>` : ''}
        ${r.code ? `<div><dt>Family code</dt><dd><code>${esc(r.code)}</code><button type="button" class="copy-btn" data-copy="${esc(r.code)}" aria-label="Copy family code">${icon('copy')}</button></dd></div>` : ''}
      </dl></div>`).join('')}</div>
    ${note ? `<p class="muted small">${esc(note)}</p>` : ''}`;
}

// Count numbers up from zero (or from a previous value) with an ease-out curve.
export function countUp(node, to, { from = 0, dur = 900, suffix = '' } = {}) {
  if (REDUCED || from === to) { node.textContent = `${to}${suffix}`; return; }
  const t0 = performance.now();
  const ease = x => 1 - Math.pow(1 - x, 4);
  const step = t => {
    const k = Math.min(1, (t - t0) / dur);
    node.textContent = `${Math.round(from + (to - from) * ease(k))}${suffix}`;
    if (k < 1) requestAnimationFrame(step);
  };
  node.textContent = `${from}${suffix}`;
  requestAnimationFrame(step);
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

// Shrink an uploaded photo so it fits in browser storage.
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
