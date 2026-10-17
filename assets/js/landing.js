// VINC Lab landing page behaviour.
import { COURSES, GRADES, FORMS, WEIGHTS, LEARNING_OUTCOMES, projectById, projectsOfGrade } from './data/courses.js';
import { art, icon } from './art.js';

const LEADS_INBOX = 'vincdeeptech@gmail.com';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const DEMO_LOGIN = { 6: 'student', 7: 'student7', 8: 'student8' };
const TECH = { 6: 'Scratch games and simple machines', 7: 'An AI Assistant with Teachable Machine', 8: 'Home Automation with Arduino' };
let courseGrade = 6;

/* ---------- Motion helpers ----------
   One set of curves and timings, read from the tokens in tokens.css. Everything here checks the
   reduced-motion setting live: with it on, changes apply instantly and nothing loops. */
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;
const EASE = {
  out: cssVar('--ease-out') || 'cubic-bezier(.22, 1, .36, 1)',
  in: cssVar('--ease-in') || 'cubic-bezier(.55, 0, 1, .45)',
  inOut: cssVar('--ease-in-out') || 'cubic-bezier(.65, 0, .35, 1)',
  spring: cssVar('--ease-spring') || 'cubic-bezier(.34, 1.56, .64, 1)',
};
const ms = (name, fallback) => parseFloat(cssVar(name)) || fallback;
const DUR = { 1: ms('--dur-1', 140), 2: ms('--dur-2', 240), 3: ms('--dur-3', 420), 4: ms('--dur-4', 700) };
const STAGGER = ms('--stagger', 55);
const canAnimate = el => !reduced() && typeof el.animate === 'function';
/** Web Animations wrapper: returns null (and does nothing) when motion is reduced. */
function animate(el, keyframes, opts) {
  if (!canAnimate(el)) return null;
  return el.animate(keyframes, { easing: EASE.out, ...opts });
}
const settled = a => (a ? a.finished.catch(() => {}) : Promise.resolve());
/** Cross-fade an element's content in place: fade the old out, apply update(), fade the new in.
    Rapid calls collapse into one: the latest update wins. */
function swap(el, update) {
  if (!canAnimate(el)) { update(); return; }
  const st = el._swap || (el._swap = {});
  st.update = update;
  if (st.busy) return;
  st.busy = true;
  // The fade-out starts from whatever is on screen, including a fade-in that is still running.
  const out = el.animate([{ opacity: 0, translate: '0 -4px' }], { duration: DUR[1], easing: EASE.in, fill: 'forwards' });
  const finish = () => {
    st.busy = false; st.update();
    st.in = el.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: DUR[3], easing: EASE.out });
    out.cancel();
  };
  out.finished.then(finish, finish);
}
/** Tween a number shown in el from what it currently shows to `to`. */
function tweenNumber(el, to, { fmt = v => String(Math.round(v)), dur = 650, delay = 0 } = {}) {
  const s = el._tw || (el._tw = { v: to });
  cancelAnimationFrame(s.raf);
  if (reduced() || s.v === to) { s.v = to; el.textContent = fmt(to); return; }
  const from = s.v, t0 = performance.now() + delay;
  const step = t => {
    const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
    s.v = from + (to - from) * e;
    el.textContent = fmt(s.v);
    if (k < 1) s.raf = requestAnimationFrame(step); else s.v = to;
  };
  s.raf = requestAnimationFrame(step);
}
/** A sliding pill behind the active button of a segmented control. Returns a function that re-places it. */
function segmented(ctl, isActive) {
  const ind = document.createElement('span');
  ind.className = 'seg-ind'; ind.setAttribute('aria-hidden', 'true');
  ctl.prepend(ind);
  ctl.classList.add('has-ind', 'no-anim');
  const place = () => {
    const b = [...ctl.children].find(c => c !== ind && isActive(c));
    if (!b) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '';
    ctl.style.setProperty('--x', `${b.offsetLeft}px`);
    ctl.style.setProperty('--y', `${b.offsetTop}px`);
    ctl.style.setProperty('--w', `${b.offsetWidth}px`);
    ctl.style.setProperty('--h', `${b.offsetHeight}px`);
  };
  const jump = () => { ctl.classList.add('no-anim'); place(); requestAnimationFrame(() => requestAnimationFrame(() => ctl.classList.remove('no-anim'))); };
  jump();
  if ('ResizeObserver' in window) new ResizeObserver(jump).observe(ctl);
  document.fonts?.ready.then(jump);
  return place;
}

/* ---------- Colour scheme: always follows the device's light or dark setting ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
try { localStorage.removeItem('vinclab-theme'); } catch { /* ignore */ } // drop any old manual override
const SCHEME = matchMedia('(prefers-color-scheme: dark)');

/* ---------- Header ---------- */
const header = $('.site-header'), menuBtn = $('#menu-btn'), nav = $('#nav');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
}
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
$$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
document.addEventListener('click', e => { if (nav.classList.contains('open') && !header.contains(e.target)) setMenu(false); });
const bar = $('#progress-bar');
const timeline = $('#timeline');
let scrollQueued = false;
function onScroll() {
  scrollQueued = false;
  const h = document.documentElement;
  bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
  header.classList.toggle('scrolled', h.scrollTop > 8);
  const r = timeline.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
  timeline.style.setProperty('--tp', p.toFixed(3));
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- Hero canvas: bubbles rising through a soft node network ---------- */
(function heroCanvas() {
  const c = $('#bg-canvas'); const ctx = c.getContext('2d');
  let w = 0, h = 0, dpr = 1, nodes = [], bubbles = [], mouse = { x: -999, y: -999 }, raf = 0, last = 0, visible = true;
  const palette = () => [cssVar('--olive'), cssVar('--amber'), cssVar('--rust'), cssVar('--plum'), cssVar('--teal')];
  let colors = palette();
  function size() {
    const nw = c.clientWidth, nh = c.clientHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    c.width = nw * dpr; c.height = nh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Only re-seed when the width really changes. Mobile browsers resize the height as the URL bar
    // shows and hides; re-seeding then would make the whole network jump mid-scroll.
    if (!nodes.length || Math.abs(nw - w) > 40) {
      w = nw; h = nh;
      const n = Math.round(Math.min(46, w * h / 26000));
      nodes = Array.from({ length: n }, (_, i) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, c: i % 5 }));
      bubbles = Array.from({ length: Math.round(n * .6) }, () => newBubble(true));
    } else {
      const sy = nh / (h || nh);
      nodes.forEach(a => { a.y *= sy; }); bubbles.forEach(b => { b.y *= sy; });
      w = nw; h = nh;
    }
    if (reduced()) draw(0, 0);
  }
  function newBubble(anywhere) {
    return { x: Math.random() * w, y: anywhere ? Math.random() * h : h + 20, r: 2 + Math.random() * 7, s: .25 + Math.random() * .6, ph: Math.random() * 6.28, c: Math.floor(Math.random() * 5) };
  }
  function draw(t, f) {
    ctx.clearRect(0, 0, w, h);
    for (const a of nodes) {
      a.x += a.vx * f; a.y += a.vy * f;
      const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
      if (d < 160) { a.x += dx * .004 * f; a.y += dy * .004 * f; }
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) { ctx.globalAlpha = (1 - d / 130) * .22; ctx.strokeStyle = colors[a.c]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const a of nodes) { ctx.globalAlpha = .55; ctx.fillStyle = colors[a.c]; ctx.beginPath(); ctx.arc(a.x, a.y, 2.4, 0, 6.28); ctx.fill(); }
    for (const b of bubbles) {
      b.y -= b.s * f; b.x += Math.sin(t / 900 + b.ph) * .3 * f;
      if (b.y < -20) Object.assign(b, newBubble(false));
      ctx.globalAlpha = .18; ctx.strokeStyle = colors[b.c]; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.stroke();
      ctx.globalAlpha = .08; ctx.fillStyle = colors[b.c]; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Movement is scaled by elapsed time, so the network drifts at the same speed on 60 Hz and 120 Hz screens.
  function frame(t) {
    const f = Math.min(3, (t - (last || t)) / 16.67 || 1); last = t;
    draw(t, f);
    raf = visible && !reduced() ? requestAnimationFrame(frame) : 0;
  }
  const start = () => { if (!raf && visible && !reduced()) { last = 0; raf = requestAnimationFrame(frame); } };
  c.parentElement.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  c.parentElement.addEventListener('pointerleave', () => { mouse = { x: -999, y: -999 }; });
  addEventListener('resize', size);
  SCHEME.addEventListener('change', () => { colors = palette(); if (reduced()) draw(0, 0); });
  RM.addEventListener('change', () => { if (reduced()) draw(0, 0); else start(); });
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; start(); }).observe(c);
  size(); draw(0, 0); start();
})();

/* ---------- Orbit ----------
   Planets are placed every frame from one angle. Hovering or focusing the orbit eases the speed down
   to a stop (and back up on leave) instead of freezing it. On load, the planets glide out from the core. */
(function orbit() {
  const o = $('#orbit'); const planets = $$('.planet', o); const cap = $('#orbit-caption'); const core = $('.core', o);
  const ICON = { life: 'leaf', machines: 'gear', services: 'hand' };
  planets.forEach(p => { $('.pi', p).innerHTML = icon(ICON[p.dataset.form]); });
  const BASE = 0.008; // degrees per ms
  let angle = -90, speed = 0, hover = false, focus = false, holdUntil = 0, last = 0, raf = 0, visible = true;
  let intro = reduced() ? 1 : 0; const introAt = performance.now() + 420;
  let px = 0, py = 0, tx = 0, ty = 0, rx = 0, ry = 0;
  // Keep the wide planet labels inside the screen on phones: squeeze the orbit into an ellipse if needed.
  function measure() {
    const W = o.clientWidth, r = o.getBoundingClientRect();
    const cx = r.left + W / 2, vw = document.documentElement.clientWidth;
    const half = Math.max(...planets.map(p => p.offsetWidth)) / 2;
    ry = W * 0.42;
    rx = Math.max(W * 0.2, Math.min(ry, Math.min(cx, vw - cx) - half - 8));
  }
  const backOut = k => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  function place() {
    const e = intro >= 1 ? 1 : backOut(intro);
    planets.forEach((p, i) => {
      const a = (angle + i * 120) * Math.PI / 180;
      p.style.transform = `translate(${(Math.cos(a) * rx * e).toFixed(2)}px, ${(Math.sin(a) * ry * e).toFixed(2)}px)`;
      p.style.opacity = intro >= 1 ? '' : Math.min(1, intro * 2.5).toFixed(3);
    });
    core.style.transform = Math.abs(px) + Math.abs(py) < .01 ? '' : `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
  }
  function tick(t) {
    const dt = Math.min(50, t - (last || t)); last = t;
    if (!reduced()) {
      const target = hover || focus || t < holdUntil ? 0 : BASE;
      speed += (target - speed) * (1 - Math.exp(-dt / 380));
      angle += speed * dt;
      if (intro < 1 && t > introAt) intro = Math.min(1, (t - introAt) / 1100);
      const a = 1 - Math.exp(-dt / 160);
      px += (tx - px) * a; py += (ty - py) * a;
    } else { intro = 1; px = py = 0; }
    place();
    raf = visible && !reduced() ? requestAnimationFrame(tick) : 0;
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
  o.addEventListener('pointerenter', () => { hover = true; });
  o.addEventListener('pointerleave', () => { hover = false; tx = ty = 0; });
  o.addEventListener('pointerdown', () => { holdUntil = performance.now() + 6000; });
  o.addEventListener('focusin', () => { focus = true; });
  o.addEventListener('focusout', e => { focus = o.contains(e.relatedTarget); });
  o.addEventListener('pointermove', e => {
    const r = o.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 14; ty = ((e.clientY - r.top) / r.height - .5) * 14;
  });
  planets.forEach(p => p.addEventListener('click', () => {
    planets.forEach(q => q.setAttribute('aria-pressed', q === p));
    const f = FORMS[p.dataset.form];
    swap(cap, () => {
      cap.innerHTML = `<strong>${esc(f.name)}</strong><span class="muted">Two projects in every grade. Schools pick one each year.</span>
        ${GRADES.map(g => `<span class="pills"><span class="chip g-chip g${g}">Grade ${g}</span>${projectsOfGrade(g).filter(x => x.form === f.key).map(x => `<a class="chip" href="#course" data-open="${x.id}">${esc(x.title)}</a>`).join('')}</span>`).join('')}`;
      $$('[data-open]', cap).forEach(a => a.addEventListener('click', e => { e.preventDefault(); openDrawer(a.dataset.open); }));
    });
  }));
  addEventListener('resize', () => { measure(); place(); });
  document.fonts?.ready.then(() => { measure(); place(); });
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) start(); }).observe(o);
  RM.addEventListener('change', start);
  measure(); place(); start();
})();

/* ---------- Ticker: ease the speed down on hover rather than stopping dead ---------- */
(function ticker() {
  const tk = $('.ticker'), track = $('.ticker-track');
  const anim = track.getAnimations?.()[0];
  if (!anim) return;
  let rate = 1, target = 1, raf = 0, last = 0;
  const loop = t => {
    const dt = Math.min(50, t - (last || t)); last = t;
    rate += (target - rate) * (1 - Math.exp(-dt / 180));
    if (Math.abs(target - rate) < .01) rate = target;
    anim.playbackRate = Math.max(rate, 0.0001);
    if (rate === 0) anim.pause(); else if (anim.playState === 'paused') anim.play();
    raf = rate !== target ? requestAnimationFrame(loop) : 0;
  };
  const go = v => { if (reduced()) return; target = v; if (v && anim.playState === 'paused') anim.play(); if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
  tk.addEventListener('pointerenter', () => go(0));
  tk.addEventListener('pointerleave', () => go(1));
})();

/* ---------- Projects ---------- */
const grid = $('#projects');
let formFilter = 'all', gridToken = 0;
const cardHTML = (p, i) => `
  <button class="pcard f-${p.form}" data-id="${p.id}" data-form="${p.form}" aria-haspopup="dialog" style="--fd:${i * 35}ms">
    <div class="art-box">${art(p.art)}</div>
    <div class="meta"><span class="form-tag">${esc(FORMS[p.form].short)}</span><span class="chip">Grade ${p.grade} · ${p.periods} periods</span></div>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.tagline)}</p>
    <span class="more">See the ${p.activities.length} activities ${icon('arrow')}</span>
  </button>`;
function applyFilter() {
  $$('.pcard', grid).forEach(c => c.classList.toggle('dim', formFilter !== 'all' && c.dataset.form !== formFilter));
}
/** Render the cards for courseGrade. With `swapAnim`, the old cards fade down and out, the grid height glides
    to its new size, and the new cards rise in one after another. */
async function renderProjects(swapAnim) {
  const token = ++gridToken;
  const old = $$('.pcard', grid);
  const h0 = grid.offsetHeight;
  if (swapAnim && old.length && canAnimate(grid)) {
    grid.style.minHeight = `${h0}px`;
    await Promise.all(old.map((c, i) => settled(c.animate([{ opacity: 0, translate: '0 10px', scale: .98 }], { duration: DUR[2], delay: i * 18, easing: EASE.in, fill: 'forwards' }))));
    if (token !== gridToken) return;
  }
  grid.innerHTML = projectsOfGrade(courseGrade).map(cardHTML).join('');
  applyFilter();
  $$('.pcard', grid).forEach((card, i) => {
    card.addEventListener('click', () => openDrawer(card.dataset.id));
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    if (swapAnim) animate(card, [{ opacity: 0, translate: '0 22px', scale: .97, offset: 0 }], { duration: DUR[4], delay: 40 + i * STAGGER, fill: 'backwards' });
    else reveal(card);
  });
  if (swapAnim) {
    grid.style.minHeight = '';
    const h1 = grid.offsetHeight;
    if (Math.abs(h1 - h0) > 2) animate(grid, [{ height: `${h0}px` }, { height: `${h1}px` }], { duration: DUR[3] });
  }
}
$$('.filter').forEach(b => b.addEventListener('click', () => {
  $$('.filter').forEach(x => x.setAttribute('aria-pressed', x === b));
  formFilter = b.dataset.filter;
  applyFilter();
}));
// Grade tabs for the course explorer
const gtabs = $('#grade-tabs');
gtabs.innerHTML = GRADES.map(g => `<button role="tab" class="g${g}" data-g="${g}" aria-selected="${g === courseGrade}" tabindex="${g === courseGrade ? 0 : -1}"><span class="gn">${g}</span>Grade ${g}</button>`).join('');
const placeGradeInd = segmented(gtabs, b => b.getAttribute('aria-selected') === 'true');
function selectGrade(g) {
  if (g === courseGrade) return;
  courseGrade = g;
  $$('[data-g]', gtabs).forEach(b => { const on = +b.dataset.g === g; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
  placeGradeInd();
  renderProjects(true);
}
$$('[data-g]', gtabs).forEach((b, i, all) => {
  b.addEventListener('click', () => selectGrade(+b.dataset.g));
  b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; selectGrade(+n.dataset.g); n.focus(); });
});

/* ---------- Project drawer ---------- */
const drawer = $('#drawer'), inner = $('#drawer-inner');
function openDrawer(id) {
  const p = projectById(id); if (!p) return;
  const f = FORMS[p.form];
  drawer.classList.remove('closing');
  inner.className = `drawer-inner f-${p.form}`;
  inner.innerHTML = `
    <button class="x" aria-label="Close">${icon('close')}</button>
    <p class="label" style="color:var(--f)">Grade ${p.grade} · ${esc(f.name)} · Project ${p.num}</p>
    <h2 id="drawer-title">${esc(p.title)}</h2>
    <p class="lead-sm">${esc(p.summary)}</p>
    <div class="facts"><span class="chip">${icon('book')} Kaushal Bodh Grade ${p.grade}, pp. ${p.pages[0]}–${p.pages[1]}</span><span class="chip">${icon('calendar')} ${p.periods} periods</span><span class="chip">${icon('school')} ${esc(p.subjects)}</span></div>
    <div class="art-box">${art(p.art)}</div>
    <h4>Activities</h4>
    <ol class="acts">${p.activities.map((a, i) => `<li style="--i:${Math.min(i, 10)}"><span class="n">${a.n}</span><div><b>${esc(a.title)}</b><small>${esc(a.task)}</small></div><span class="pg">p. ${a.page}</span></li>`).join('')}</ol>
    <div class="cols2">
      <div><h4>Students will</h4><ul>${p.goals.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <div><h4>Safety first</h4><ul>${p.safety.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <div><h4>You'll need</h4><ul>${p.materials.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <div><h4>Careers to explore</h4><ul>${p.careers.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
    </div>
    <h4>How it's assessed</h4>
    <div class="weights-mini">${WEIGHTS.map((w, i) => `<i style="width:${w.weight}%;background:${segColor(i)};--i:${i}"></i>`).join('')}</div>
    <p class="small muted">${p.quiz.length}-question quiz · ${p.viva.length} viva prompts · activity book · portfolio · observation rubric</p>
    <p><a class="btn btn-primary" href="app.html#/login/${DEMO_LOGIN[p.grade]}">Open a Grade ${p.grade} student demo</a></p>`;
  $('.x', inner).addEventListener('click', closeDrawer);
  if (!drawer.open) drawer.showModal();
  inner.scrollTop = 0;
}
// Slide out before closing (Esc, the close button and the backdrop all come through here).
function closeDrawer() {
  if (!drawer.open || drawer.classList.contains('closing')) return;
  if (reduced()) { drawer.close(); return; }
  drawer.classList.add('closing');
  const finish = () => { if (drawer.classList.contains('closing')) { drawer.classList.remove('closing'); drawer.close(); } };
  const onEnd = e => { if (e.target === drawer && e.animationName === 'lp-drawer-out' && !e.pseudoElement) { drawer.removeEventListener('animationend', onEnd); finish(); } };
  drawer.addEventListener('animationend', onEnd);
  setTimeout(finish, DUR[2] + 200);
}
drawer.addEventListener('cancel', e => { e.preventDefault(); closeDrawer(); });
drawer.addEventListener('close', () => drawer.classList.remove('closing'));
drawer.addEventListener('click', e => { if (e.target === drawer) closeDrawer(); });

/* ---------- Planner ----------
   The timeline keeps one segment per slot and only changes its flex-grow, so picking a project slides the
   segments to their new sizes. Labels and numbers cross-fade or count instead of snapping. */
const DEFAULT_PICKS = { 6: { life: 'g6p1', machines: 'g6p3', services: 'g6p6' }, 7: { life: 'g7p1', machines: 'g7p4', services: 'g7p6' }, 8: { life: 'g8p1', machines: 'g8p4', services: 'g8p5' } };
const FORM_KEYS = ['life', 'machines', 'services'];
let planGrade = 6;
let picks = { ...DEFAULT_PICKS[6] };
const pickWrap = $('#planner-picks');
const pgTabs = $('#plan-grades');
pgTabs.innerHTML = GRADES.map(g => `<button class="g${g}" data-pg="${g}" aria-pressed="${g === planGrade}"><span class="gn">${g}</span>Grade ${g}</button>`).join('');
const placePlanInd = segmented(pgTabs, b => b.getAttribute('aria-pressed') === 'true');
$$('[data-pg]', pgTabs).forEach(b => b.addEventListener('click', () => {
  if (+b.dataset.pg === planGrade) return;
  planGrade = +b.dataset.pg; picks = { ...DEFAULT_PICKS[planGrade] };
  $$('[data-pg]', pgTabs).forEach(x => x.setAttribute('aria-pressed', x === b));
  placePlanInd();
  swap(pickWrap, renderPicks);
  renderPlan();
}));
function renderPicks() {
  pickWrap.innerHTML = Object.values(FORMS).map(f => `
  <div class="pick-group f-${f.key}" role="group" aria-labelledby="pg-${f.key}">
    <h3 id="pg-${f.key}">${esc(f.name)}</h3>
    <div class="opts">${projectsOfGrade(planGrade).filter(p => p.form === f.key).map(p => `<button class="pick" data-form="${f.key}" data-id="${p.id}" aria-pressed="${picks[f.key] === p.id}">${esc(p.title)}<small>${p.periods} periods</small></button>`).join('')}</div>
  </div>`).join('');
  $$('.pick', pickWrap).forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.form;
    picks[f] = picks[f] === b.dataset.id ? null : b.dataset.id;
    $$(`.pick[data-form="${f}"]`, pickWrap).forEach(x => x.setAttribute('aria-pressed', picks[f] === x.dataset.id));
    renderPlan();
  }));
}
renderPicks();
const tl = $('#tl');
const SLOTS = [...FORM_KEYS, 'empty', 'mela'];
tl.innerHTML = SLOTS.map(k => `<div class="seg ${k} off" data-slot="${k}"><div class="seg-in"><b></b><small></small></div></div>`).join('');
const segEl = Object.fromEntries(SLOTS.map(k => [k, $(`[data-slot="${k}"]`, tl)]));
function setSeg(k, grow, title = '', sub = '') {
  const el = segEl[k], seg = $('.seg-in', el), b = $('b', el), small = $('small', el);
  const wasOff = el.classList.contains('off');
  el.style.flexGrow = grow;
  el.classList.toggle('off', !grow);
  if (!grow) return; // keep the old label while the segment collapses
  el.title = title;
  if (b.textContent === title && small.textContent === sub) return;
  const apply = () => { b.textContent = title; small.textContent = sub; };
  if (wasOff || !b.textContent) apply(); else swap(seg, apply);
}
$('#planner-sum').innerHTML = `
  <div><b id="ps-used">0</b><span>project periods (about <span id="ps-total">160</span> in a year)</span></div>
  <div><b id="ps-hours">0 h</b><span>of hands-on work, of the 110 h CBSE asks for</span></div>
  <div><b id="ps-forms">0/3</b><span>forms of work covered</span></div>
  <p class="note" id="ps-note"></p>`;
function renderPlan() {
  const total = COURSES[planGrade].periodsPerYear; // 160 periods ≈ 40 weeks × 4
  const chosen = FORM_KEYS.map(f => projectById(picks[f])).filter(Boolean);
  const used = chosen.reduce((s, p) => s + p.periods, 0);
  const mela = 4;
  const free = Math.max(0, total - used - mela);
  const over = used + mela - total;
  FORM_KEYS.forEach(f => { const p = projectById(picks[f]); setSeg(f, p ? p.periods : 0, p?.title, p ? `${Math.round(p.periods / 4)} wks · ${p.periods} periods` : ''); });
  if (chosen.length < 3) setSeg('empty', Math.max(20, free), `Pick ${3 - chosen.length} more`);
  else setSeg('empty', free, 'Buffer', `${free} periods`);
  setSeg('mela', mela, 'Mela');
  tl.setAttribute('aria-label', `Year timeline: ${chosen.map(p => `${p.title}, ${p.periods} periods`).join('; ') || 'no projects picked'}; Kaushal Mela, ${mela} periods`);
  const hours = Math.round(used * 40 / 60);
  let note = 'CBSE asks for one project from each form of work every year.';
  if (chosen.length === 3) note = over > 0
    ? `A complete Kaushal Bodh year, ${over} period${over > 1 ? 's' : ''} over the usual 160. Use a Saturday period or shorten one activity.`
    : `A complete Kaushal Bodh year with ${free} periods spare for revision, the viva week and Mela preparation.`;
  $('#ps-total').textContent = total;
  tweenNumber($('#ps-used'), used);
  tweenNumber($('#ps-hours'), hours, { fmt: v => `${Math.round(v)} h` });
  tweenNumber($('#ps-forms'), chosen.length, { fmt: v => `${Math.round(v)}/3`, dur: 400 });
  const noteEl = $('#ps-note');
  if (noteEl.textContent !== note) { if (noteEl.textContent) swap(noteEl, () => { noteEl.textContent = note; }); else noteEl.textContent = note; }
}
// First paint: no sliding, just the plan.
SLOTS.forEach(k => { segEl[k].style.transition = 'none'; });
renderPlan();
requestAnimationFrame(() => requestAnimationFrame(() => SLOTS.forEach(k => { segEl[k].style.transition = ''; })));

/* ---------- Assessment calculator ----------
   The donut is built once. Each segment's drawn length eases toward its slider value every frame, so
   dragging a slider or switching light/dark never redraws or snaps. It sweeps in the first time it is seen. */
const SEG_VARS = ['--teal-2', '--amber', '--olive', '--plum', '--rust'];
function segColor(i) { return `var(${SEG_VARS[i]})`; }
const sample = { written: 90, viva: 75, book: 85, portfolio: 70, observation: 80 };
$('#sliders').innerHTML = WEIGHTS.map((w, i) => `
  <div class="slider" style="--c:var(${SEG_VARS[i]})">
    <label for="s-${w.key}">${esc(w.label)}<small>${w.weight}%</small></label>
    <output id="o-${w.key}" for="s-${w.key}">${sample[w.key]}%</output>
    <input type="range" id="s-${w.key}" min="0" max="100" step="5" value="${sample[w.key]}" data-key="${w.key}">
  </div>`).join('');
$('#legend').innerHTML = WEIGHTS.map((w, i) => `<li style="--c:var(${SEG_VARS[i]})"><i></i>${esc(w.label)} ${w.weight}%</li>`).join('');
const donutSvg = $('#donut');
const R = 90, CIRC = 2 * Math.PI * R, GAP = 4;
donutSvg.innerHTML = `<title id="donut-title">Assessment weights</title><circle class="track" cx="110" cy="110" r="${R}" stroke-width="26"/>`
  + WEIGHTS.map((w, i) => `<circle class="seg" cx="110" cy="110" r="${R}" style="stroke:${segColor(i)}" stroke-opacity=".25" stroke-width="26" stroke-dasharray="0 ${CIRC}" transform="rotate(-90 110 110)"><title>${esc(w.label)} ${w.weight}%</title></circle>
    <circle class="seg fill" cx="110" cy="110" r="${R}" style="stroke:${segColor(i)}" stroke-width="26" stroke-dasharray="0 ${CIRC}" transform="rotate(-90 110 110)"/>`).join('');
const bgSegs = $$('.seg:not(.fill)', donutSvg), fillSegs = $$('.seg.fill', donutSvg);
const scoreEl = $('#score'), bandEl = $('#band');
const dn = { cur: WEIGHTS.map(() => 0), tgt: WEIGHTS.map(w => sample[w.key] / 100), sweep: 0, sweepTgt: 0, raf: 0, last: 0 };
function band(score) {
  if (score >= 85) return 'Exemplary';
  if (score >= 70) return 'Proficient';
  if (score >= 50) return 'Developing';
  return 'Beginning';
}
function paintDonut() {
  let off = 0, score = 0;
  WEIGHTS.forEach((w, i) => {
    const len = CIRC * w.weight / 100 * dn.sweep;
    const got = len * dn.cur[i];
    bgSegs[i].setAttribute('stroke-dasharray', `${Math.max(0, len - GAP).toFixed(2)} ${CIRC.toFixed(2)}`);
    bgSegs[i].setAttribute('stroke-dashoffset', (-off).toFixed(2));
    fillSegs[i].setAttribute('stroke-dasharray', `${Math.max(0, got - GAP).toFixed(2)} ${CIRC.toFixed(2)}`);
    fillSegs[i].setAttribute('stroke-dashoffset', (-off).toFixed(2));
    off += len;
    score += w.weight * dn.cur[i];
  });
  scoreEl.textContent = Math.round(score * dn.sweep);
}
function donutFrame(t) {
  const dt = Math.min(50, t - (dn.last || t)); dn.last = t;
  const a = 1 - Math.exp(-dt / 120), s = 1 - Math.exp(-dt / 240);
  let moving = false;
  dn.sweep += (dn.sweepTgt - dn.sweep) * s;
  if (Math.abs(dn.sweepTgt - dn.sweep) < 5e-4) dn.sweep = dn.sweepTgt; else moving = true;
  dn.cur = dn.cur.map((v, i) => {
    const n = v + (dn.tgt[i] - v) * (dn.sweep < 1 ? s : a);
    if (Math.abs(dn.tgt[i] - n) < 5e-4) return dn.tgt[i];
    moving = true; return n;
  });
  paintDonut();
  dn.raf = moving ? requestAnimationFrame(donutFrame) : 0;
  if (!moving) dn.last = 0;
}
function updateDonut() {
  const target = Math.round(WEIGHTS.reduce((s, w) => s + w.weight * sample[w.key] / 100, 0));
  const label = dn.sweepTgt ? band(target) : '—';
  if (bandEl.textContent !== label) swap(bandEl, () => { bandEl.textContent = label; });
  if (reduced()) { dn.sweep = dn.sweepTgt; dn.cur = [...dn.tgt]; paintDonut(); return; }
  if (!dn.raf) { dn.last = 0; dn.raf = requestAnimationFrame(donutFrame); }
}
$$('#sliders input').forEach(inp => inp.addEventListener('input', () => {
  sample[inp.dataset.key] = +inp.value;
  $(`#o-${inp.dataset.key}`).textContent = `${inp.value}%`;
  dn.tgt = WEIGHTS.map(w => sample[w.key] / 100);
  updateDonut();
}));
function showDonut() { if (dn.sweepTgt) return; dn.sweepTgt = 1; updateDonut(); }
if (reduced()) showDonut(); else paintDonut();

/* ---------- Dashboard tabs ----------
   The pill slides to the chosen tab; the old panel slides out toward where you came from while the new one
   slides in, and the panel area glides to its new height instead of jumping. */
const tabs = $$('.dash-tabs [role="tab"]');
const panelOf = t => $('#' + t.getAttribute('aria-controls'));
const dashPanels = $('.dash-panels');
const placeDashInd = segmented($('.dash-tabs'), b => b.getAttribute('aria-selected') === 'true');
let dashIdx = Math.max(0, tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'));
function selectTab(t) {
  const i = tabs.indexOf(t); if (i === dashIdx) return;
  const dir = i > dashIdx ? 1 : -1;
  const oldP = panelOf(tabs[dashIdx]), newP = panelOf(t);
  dashIdx = i;
  tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
  placeDashInd();
  const bar = t.parentElement;
  if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
  const h0 = dashPanels.offsetHeight;
  tabs.map(panelOf).forEach(p => {
    p._anims?.forEach(a => a.cancel()); p._anims = null; p.style.cssText = '';
    if (p !== oldP && p !== newP) p.hidden = true;
  });
  newP.hidden = false;
  if (!canAnimate(dashPanels)) { oldP.hidden = true; return; }
  Object.assign(oldP.style, { position: 'absolute', top: '0', left: '0', right: '0', pointerEvents: 'none' });
  const h1 = dashPanels.offsetHeight;
  const out = oldP.animate([{ opacity: 0, translate: `${-dir * 28}px 0` }], { duration: DUR[2], easing: EASE.in, fill: 'forwards' });
  oldP._anims = [out];
  out.finished.then(() => { oldP.hidden = true; oldP.style.cssText = ''; out.cancel(); oldP._anims = null; }, () => {});
  newP._anims = [newP.animate([{ opacity: 0, translate: `${dir * 36}px 0`, offset: 0 }], { duration: DUR[4], delay: 70, easing: EASE.out, fill: 'backwards' })];
  if (Math.abs(h1 - h0) > 1) dashPanels.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: DUR[3], easing: EASE.out });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(n); n.focus();
  });
});
$('.m-heat').innerHTML = Array.from({ length: 40 }, (_, i) => `<i style="--v:${20 + ((i * 37) % 80)};animation-delay:${(i % 10) * 22 + Math.floor(i / 10) * 40}ms"></i>`).join('');

/* ---------- White-label preview ---------- */
const BRAND_COLORS = ['#1F6F66', '#2D5BA8', '#7A3FA0', '#B23A48', '#C26A12', '#3E7B2A', '#0F4C5C'];
let brandColor = BRAND_COLORS[0];
$('#swatches').innerHTML = BRAND_COLORS.map((c, i) => `<button type="button" class="swatch" style="--c:${c}" data-c="${c}" aria-pressed="${i === 0}" aria-label="Colour ${i + 1}"></button>`).join('');
const initials = s => s.split(/\s+/).filter(w => w && !/^(of|the|and|&)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'S';
// "Greenwood Public School" → "Greenwood Skills Studio"; "St. Joseph's High School" → "St. Joseph's Skills Studio".
function studioName(school) {
  const words = school.split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const short = /^(st\.?|sri|shri|the|dr\.?|sir|new|dav|dps)$/i.test(words[0]) || words[0].length <= 3;
  return `${words.slice(0, short && words[1] ? 2 : 1).join(' ')} Skills Studio`;
}
function renderBrand() {
  const name = $('#b-name').value.trim() || 'Your School';
  const studio = $('#b-studio').value.trim() || `${name} Skill Studio`;
  const badge = $('#bp-badge'), ini = initials(name);
  $('#bp-school').textContent = name;
  $('#bp-studio').textContent = studio;
  if (badge.textContent !== ini) { badge.textContent = ini; animate(badge, [{ scale: .8, offset: 0 }], { duration: DUR[3], easing: EASE.spring }); }
  $('#brand-preview').style.setProperty('--bc', brandColor);
}
$('#b-name').addEventListener('input', () => {
  const v = $('#b-name').value.trim();
  if (!$('#b-studio').dataset.touched) $('#b-studio').value = studioName(v);
  renderBrand();
});
$('#b-studio').addEventListener('input', () => { $('#b-studio').dataset.touched = '1'; renderBrand(); });
$$('.swatch').forEach(s => s.addEventListener('click', () => {
  $$('.swatch').forEach(x => x.setAttribute('aria-pressed', x === s));
  brandColor = s.dataset.c; renderBrand();
  animate($('.bp-ring'), [{ scale: .9, offset: 0 }], { duration: DUR[3], easing: EASE.spring });
}));
$('#brand-form').addEventListener('submit', e => {
  e.preventDefault();
  store.set('vinclab-brand-draft', JSON.stringify({ name: $('#b-name').value.trim() || 'Your School', studio: $('#b-studio').value.trim(), color: brandColor }));
  location.href = 'app.html#/brand-demo';
});
renderBrand();

/* ---------- Learning outcomes ---------- */
const GOALS = [
  { title: 'Skills and knowledge of work', note: 'Tools, steps, care of equipment, safety', los: [1, 2, 3, 4, 5, 6] },
  { title: 'Vocations in the world of work', note: 'Why the work matters, quality and quantity', los: [7, 8, 9, 10, 11] },
  { title: 'Values while working', note: 'Observed by teachers in every activity', los: [12, 13, 14, 15, 16, 17] },
  { title: 'Skills for the home', note: 'Taking the learning home', los: [18] },
];
const WHERE = lo => {
  if (lo >= 12 && lo <= 17) return 'Teacher observation rubric (20%)';
  if ([1, 2, 3, 6].includes(lo)) return 'Viva rubric (30%) and activity book (30%)';
  if ([7, 8, 9].includes(lo)) return 'Viva rubric (30%) and written test (10%)';
  if (lo === 18) return '"Try it at home" tasks in the portfolio (10%)';
  return 'Activity book (30%) and portfolio (10%)';
};
$('#lo-grid').innerHTML = GOALS.map((g, i) => `
  <div class="lo-col"><h3>CG ${i + 1} · ${esc(g.title)}</h3><p>${esc(g.note)}</p>
  <div class="chips">${g.los.map(l => `<button class="lo" data-lo="${l}" aria-pressed="false">LO ${l}</button>`).join('')}</div></div>`).join('');
const loDetail = $('#lo-detail');
$$('.lo').forEach(b => b.addEventListener('click', () => {
  $$('.lo').forEach(x => x.setAttribute('aria-pressed', x === b));
  const l = +b.dataset.lo;
  swap(loDetail, () => { loDetail.innerHTML = `<b>LO ${l}.</b> ${esc(LEARNING_OUTCOMES[l])}.<br><span class="muted">Measured in: ${esc(WHERE(l))}</span>`; });
}));

/* ---------- Roadmap ---------- */
$('#road').innerHTML = GRADES.map(g => `
  <div class="road-card g${g}"><span class="big" aria-hidden="true">${g}</span>
    <span class="chip live">Live</span>
    <h3>Grade ${g}</h3><ul>${projectsOfGrade(g).map(p => `<li>${esc(p.title)}</li>`).join('')}</ul>
    <p class="tech">${icon('flask')} ${esc(TECH[g])}</p>
    <a class="btn btn-ghost btn-sm demo" href="app.html#/login/${DEMO_LOGIN[g]}">Try a Grade ${g} student</a></div>`).join('');

/* ---------- FAQ: open and close with a height animation ----------
   Without JS (or with reduced motion) the native <details> behaviour is untouched. */
(function faq() {
  const wrap = $('.faq');
  wrap.classList.add('enh');
  $$('details', wrap).forEach(d => {
    const s = $('summary', d), body = $('p', d);
    d.classList.toggle('is-open', d.open);
    d.addEventListener('toggle', () => { if (!d._anim) d.classList.toggle('is-open', d.open); });
    s.addEventListener('click', e => {
      if (!canAnimate(d)) { d.classList.toggle('is-open', !d.open); return; }
      e.preventDefault();
      const opening = !d.classList.contains('is-open');
      d.classList.toggle('is-open', opening);
      const startH = d.offsetHeight;
      d._anim?.cancel();
      d.style.overflow = 'hidden';
      if (opening) d.open = true;
      const endH = opening ? d.offsetHeight : s.offsetHeight + (d.offsetHeight - d.clientHeight);
      const a = d.animate([{ height: `${startH}px` }, { height: `${endH}px` }], { duration: opening ? DUR[3] + 60 : DUR[3] - 60, easing: opening ? EASE.out : EASE.inOut });
      d._anim = a;
      if (opening) body.animate([{ opacity: 0, translate: '0 -6px', offset: 0 }], { duration: DUR[3], delay: 60, easing: EASE.out, fill: 'backwards' });
      a.onfinish = () => { if (!opening) d.open = false; d.style.overflow = ''; d._anim = null; };
    });
  });
})();

/* ---------- Enquiry ---------- */
const form = $('#enquiry'), msg = $('#form-msg');
function say(html) { msg.innerHTML = html; animate(msg, [{ opacity: 0, translate: '0 6px', offset: 0 }], { duration: DUR[3] }); }
form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  $$('[aria-invalid]', form).forEach(f => f.removeAttribute('aria-invalid'));
  void form.offsetWidth; // restart the nudge on repeat submits
  $$('[required]', form).forEach(f => { const bad = !f.value.trim(); if (bad) { f.setAttribute('aria-invalid', 'true'); ok = false; } });
  const contact = form.contact.value.trim();
  if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^[+\d][\d\s-]{7,}$/.test(contact)) { form.contact.setAttribute('aria-invalid', 'true'); ok = false; }
  if (!ok) { say('Please fill in your name, school and a valid email or phone number.'); $('[aria-invalid="true"]', form)?.focus(); return; }
  if (form._honey.value) return;
  const data = Object.fromEntries(new FormData(form));
  delete data._honey;
  say('Sending…');
  const btn = $('button[type="submit"]', form); btn.disabled = true;
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${LEADS_INBOX}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, _subject: `VINC Lab pilot request: ${data.school}`, _template: 'table' }),
    });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    say('Thank you. We will get back to you within two working days.');
  } catch {
    const body = encodeURIComponent(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n'));
    say(`We couldn't send that just now. <a href="mailto:${LEADS_INBOX}?subject=${encodeURIComponent('VINC Lab pilot request')}&body=${body}">Email it to us instead</a>.`);
  } finally { btn.disabled = false; }
});

/* ---------- Scroll reveals, count-ups and magnetic buttons ----------
   Reveals run once per element. Elements that arrive in the same batch (a row of cards, say) are staggered
   top-to-bottom, left-to-right. They animate opacity and `translate` only, so hover lifts on `transform`
   and the course filter's `scale`/`filter` keep working on revealed elements. */
const onReveal = new Map();
const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  const shown = entries.filter(e => e.isIntersecting).map(e => e.target);
  shown.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
  shown.forEach((el, i) => {
    io.unobserve(el);
    el.classList.add('in');
    animate(el, [{ opacity: 0, translate: '0 26px', offset: 0 }], { duration: DUR[4], delay: i * STAGGER * 1.4, fill: 'backwards' });
    onReveal.get(el)?.(i * STAGGER * 1.4);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }) : null;
function reveal(el, hook) {
  if (hook) onReveal.set(el, hook);
  if (!io || reduced()) { hook?.(0); return; }
  el.classList.add('reveal');
  io.observe(el);
}
renderProjects(false);
[
  'section:not(.hero) .section-head', '.two-col > :not(.timeline)', '.timeline li', '.planner-picks', '.dash-tabs', '.dash-panels',
  '.lo-col', '.lo-detail', '#roadmap .label', '#roadmap h2', '.road-card', '.faq-wrap > div:first-child', '.faq details',
].forEach(sel => $$(sel).forEach(el => reveal(el)));
// The planner timeline wipes in from the left; the donut sweeps round.
reveal($('.planner-out'), delay => animate(tl, [{ clipPath: 'inset(0 100% 0 0 round 14px)' }, { clipPath: 'inset(0 0 0 0 round 14px)' }], { duration: 1100, delay: delay + 200, easing: EASE.inOut, fill: 'backwards' }));
const donutWrap = $('.donut-wrap');
if (io && !reduced()) onReveal.set(donutWrap, () => setTimeout(showDonut, 180)); else showDonut();

// Count-ups in the hero start once the stats have risen into place.
const HERO_SETTLED = 1150;
$$('.count').forEach(el => {
  const to = +el.dataset.to;
  el.style.minWidth = `${String(to).length}ch`;
  if (reduced() || !io) return;
  el._tw = { v: 0 }; el.textContent = '0';
  const cio = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    cio.disconnect();
    tweenNumber(el, to, { dur: 1400, delay: Math.max(0, HERO_SETTLED - performance.now()) });
  }, { threshold: 0.5 });
  cio.observe(el);
});

// Magnetic buttons lean toward the pointer and ease back when it leaves. They move with `translate`,
// so the hover lift and the press scale on `transform` still apply.
$$('.magnetic').forEach(b => {
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, last = 0;
  const loop = t => {
    const dt = Math.min(50, t - (last || t)); last = t;
    const a = 1 - Math.exp(-dt / (tx || ty ? 90 : 180));
    x += (tx - x) * a; y += (ty - y) * a;
    const rest = Math.abs(tx - x) + Math.abs(ty - y) < .05;
    if (rest) { x = tx; y = ty; }
    b.style.translate = x || y ? `${x.toFixed(2)}px ${y.toFixed(2)}px` : '';
    raf = rest ? 0 : requestAnimationFrame(loop);
    if (rest) last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  b.addEventListener('pointermove', e => {
    if (reduced() || e.pointerType !== 'mouse') return;
    const r = b.getBoundingClientRect();
    const cx = r.left - x + r.width / 2, cy = r.top - y + r.height / 2;
    tx = (e.clientX - cx) * .12; ty = (e.clientY - cy) * .22; kick();
  });
  b.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
});
