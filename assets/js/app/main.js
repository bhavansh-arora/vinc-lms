// VINC Lab LMS: hash router, app shell and page transitions.
import { load, db, session, user, school, brandDemo, canPersist, DEMO_PW } from './store.js';
import { $, $$, esc, icon, toast, countUp, REDUCED } from './ui.js';
import { renderAuth, DEMO } from './auth.js';
import * as Student from './views/student.js';
import * as Parent from './views/parent.js';
import * as School from './views/school.js';
import * as Admin from './views/admin.js';
import * as Teacher from './views/teacher.js';
import * as Profile from './views/profile.js';

load();

const ROLE_LABEL = { student: 'Student', parent: 'Parent', teacher: 'Teacher', school: 'School', admin: 'Admin' };
const VIEWS = { student: Student, parent: Parent, teacher: Teacher, school: School, admin: Admin };
const root = $('#app');

// Light or dark always follows the device setting; drop any old manual override.
try { localStorage.removeItem('vinclab-theme'); } catch { /* ignore */ }

/* ---------- Session ---------- */
function currentUser() { const s = session.get(); return s ? user(s.userId) : null; }
export function go(path) { if (location.hash === `#${path}`) route(); else location.hash = path; }
let returnTo = null;

// After logging in or signing up.
function enter(u, { fresh }) {
  const first = u.name.split(' ')[0];
  const back = returnTo && returnTo.split('/')[1] === u.role ? returnTo : `/${u.role}`;
  returnTo = null;
  if (u.pwTemp) {
    go(`/${u.role}/profile`);
    setTimeout(() => toast('You logged in with a temporary password. Please choose your own below.', 'warn', 5200), 450);
    return;
  }
  go(back);
  setTimeout(() => toast(fresh ? `Welcome to VINC Lab, ${first}!` : `Welcome back, ${first}.`), 450);
}

/* ---------- Router ---------- */
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, ...rest] = parts;
  if (head === 'login' || head === 'signup') {
    shellKey = null; lastHash = null;
    renderAuth(root, { tab: head, role: head === 'signup' ? rest[0] : null, demo: head === 'login' ? rest[0] : null, onEnter: enter });
    document.title = `${head === 'login' ? 'Log in' : 'Create an account'} · VINC Lab`;
    return;
  }
  if (head === 'brand-demo') {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem('vinclab-brand-draft') || 'null'); } catch { /* ignore */ }
    const sch = brandDemo(draft || { name: 'Your School', studio: 'Your Skills Studio', color: '#1F6F66' });
    const kid = db().users.find(u => u.role === 'student' && u.schoolId === sch.id);
    const coord = db().users.find(u => u.role === 'school' && u.schoolId === sch.id);
    session.set({ userId: kid.id, at: Date.now() });
    go('/student');
    setTimeout(() => toast(`Welcome to ${sch.studio}. To see the school side, log out and use ${coord.login} with ${DEMO_PW}.`, 'ok', 7000), 400);
    return;
  }
  const me = currentUser();
  if (!me) {
    shellKey = null; lastHash = null;
    if (head) returnTo = `/${parts.join('/')}`;
    renderAuth(root, { tab: 'login', onEnter: enter });
    document.title = 'Log in · VINC Lab';
    return;
  }
  if (head !== me.role) { go(`/${me.role}`); return; }
  renderShell(me, rest);
}

/* ---------- Shell ----------
   The sidebar and top bar are built once per user and brand. Moving between pages only swaps
   the page body, so the active-page pill can glide and nothing flickers. */
let shellKey = null;
let lastHash = null;

function brandFor(me) { return me.role === 'admin' ? null : school(me.schoolId); }
const initialsOf = name => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function renderShell(me, rest) {
  const isProfile = rest[0] === 'profile';
  const View = isProfile ? Profile : VIEWS[me.role];
  const sch = brandFor(me);
  const s = session.get();
  const ctx = { me, school: sch, params: rest, go, rerender, toast };
  let page;
  try { page = View.render(ctx); } catch (e) { console.error(e); page = { title: 'Something went wrong', html: `<div class="empty"><p>That page could not be shown.</p><a class="btn btn-primary" href="#/${me.role}">Go to the dashboard</a></div>` }; }
  const nav = VIEWS[me.role].nav(ctx);
  const active = isProfile ? 'profile' : (page.nav ?? rest[0] ?? '');
  const key = [me.id, me.name, me.login, me.title, sch?.id, sch?.color, sch?.studio, sch?.name, sch?.initials, s?.by || '', canPersist(), nav.map(n => n.path + n.label).join(',')].join('|');
  const entering = location.hash !== lastHash;
  lastHash = location.hash;
  const old = $('#view');
  const snap = entering || !old ? null : snapshot(old);
  const focusPath = entering || !old ? null : pathTo(document.activeElement, old);

  if (key !== shellKey || !old) { buildShell(me, sch, nav, s); shellKey = key; }
  document.title = `${page.title} · ${sch ? sch.studio : 'VINC Lab'}`;
  if (sch) document.documentElement.style.setProperty('--brand', sch.color); else document.documentElement.style.removeProperty('--brand');

  const title = $('#top-title');
  if (title.textContent !== page.title) {
    title.textContent = page.title;
    if (!REDUCED) title.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  setActive(active);

  const view = $('#view');
  view.innerHTML = page.html;
  if (entering) {
    view.classList.remove('entering'); void view.offsetWidth; view.classList.add('entering');
    stagger(view);
    countAll(view);
    scrollTo(0, 0);
    toggleNav(false);
  } else {
    view.classList.remove('entering');
    tweenFrom(view, snap);
  }
  page.mount?.(view, ctx);
  if (focusPath) restoreFocus(view, focusPath);
}

function rerender() { const y = scrollY; route(); scrollTo(0, y); }

function buildShell(me, sch, nav, s) {
  const first = !$('#view');
  root.className = `app role-${me.role}${first ? ' shell-in' : ''}`;
  const href = n => `#/${me.role}${n.path ? '/' + n.path : ''}`;
  root.innerHTML = `
    <aside class="side" aria-label="Sidebar">
      <a class="side-brand" href="#/${me.role}">
        ${sch ? `<span class="badge">${esc(sch.initials)}</span><span><b>${esc(sch.studio)}</b><small>${esc(sch.name)}</small></span>`
              : `<img class="logo-l" src="assets/logo/vinc-lab-logo.svg" alt="VINC Lab" width="150" height="34"><img class="logo-d" src="assets/logo/vinc-lab-logo-dark.svg" alt="VINC Lab" width="150" height="34">`}
      </a>
      <nav class="side-nav" aria-label="Main">
        <span class="nav-pill" aria-hidden="true"></span>
        ${nav.map(n => `<a href="${href(n)}" data-path="${n.path}">${icon(n.icon)}<span>${esc(n.label)}</span></a>`).join('')}
      </nav>
      <div class="side-foot">
        <a class="me" href="#/${me.role}/profile" data-path="profile"><span class="avatar">${esc(initialsOf(me.name))}</span><span><b>${esc(me.name)}</b><small>${esc(me.login ? `@${me.login}` : me.title || ROLE_LABEL[me.role])}</small></span>${icon('settings', 'me-ic')}</a>
        ${sch ? '<small class="powered">Powered by <b>VINC Lab</b></small>' : ''}
      </div>
    </aside>
    <div class="main">
      <header class="top">
        <button class="icon-btn only-m" id="nav-open" aria-label="Open menu" aria-expanded="false">${icon('menu')}</button>
        <h1 class="top-title" id="top-title"></h1>
        <div class="top-tools">
          ${s?.by ? `<button class="btn btn-sm btn-ghost" id="back-admin">${icon('arrow', 'flip')} <span>Back to admin</span></button>` : ''}
          <a class="me-btn" href="#/${me.role}/profile" data-path="profile" aria-label="Your profile: ${esc(me.name)}"><span class="avatar">${esc(initialsOf(me.name))}</span><span class="me-name">${esc(me.name.split(' ')[0])}</span></a>
          <button class="icon-btn" id="logout" aria-label="Log out" title="Log out">${icon('logout')}</button>
        </div>
      </header>
      ${canPersist() ? '' : '<p class="warn-bar">This browser is blocking storage, so changes will not be kept after you leave.</p>'}
      <main id="view" class="view" tabindex="-1"></main>
    </div>
    <nav class="tabbar" aria-label="Main">
      <span class="tab-pill" aria-hidden="true"></span>
      ${nav.slice(0, 5).map(n => `<a href="${href(n)}" data-path="${n.path}">${icon(n.icon)}<span>${esc(n.short || n.label)}</span></a>`).join('')}
    </nav>`;
  $('#logout').addEventListener('click', () => { session.clear(); toast('You have logged out.'); go('/login'); });
  $('#back-admin')?.addEventListener('click', () => { session.set({ userId: s.by, at: Date.now() }); go('/admin/schools'); });
  $('#nav-open').addEventListener('click', () => toggleNav(!root.classList.contains('nav-open')));
  $$('.side-nav a, .me', root).forEach(a => a.addEventListener('click', () => toggleNav(false)));
  if (first) setTimeout(() => root.classList.remove('shell-in'), 900);
  pillReady = false;
}

// Mobile drawer: the menu button opens it; the backdrop, Escape or choosing a page closes it.
function toggleNav(open) { root.classList.toggle('nav-open', open); $('#nav-open')?.setAttribute('aria-expanded', String(open)); }
root.addEventListener('click', e => { if (e.target === root && root.classList.contains('nav-open')) toggleNav(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('nav-open')) toggleNav(false); });

// Mark the current page in the sidebar and tab bar, and slide the highlight pill to it.
let pillReady = false;
function setActive(path) {
  for (const a of $$('.side-nav a, .tabbar a, .me, .me-btn', root)) {
    const on = a.dataset.path === path;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  const place = (pill, link, axis) => {
    if (!pill) return;
    if (!link) { pill.style.opacity = '0'; return; }
    if (!pillReady) pill.style.transition = 'none';
    pill.style.opacity = '1';
    if (axis === 'y') { pill.style.translate = `0 ${link.offsetTop}px`; pill.style.height = `${link.offsetHeight}px`; }
    else { pill.style.translate = `${link.offsetLeft}px 0`; pill.style.width = `${link.offsetWidth}px`; }
    if (!pillReady) { void pill.offsetWidth; pill.style.transition = ''; }
  };
  place($('.nav-pill', root), $(`.side-nav a[data-path="${path}"]`, root), 'y');
  place($('.tab-pill', root), $(`.tabbar a[data-path="${path}"]`, root), 'x');
  pillReady = true;
}
// The tab bar only lays out on small screens; re-place the pill when the layout changes.
addEventListener('resize', () => { const on = $('.side-nav a.on, .tabbar a.on', root); pillReady = false; setActive(on?.dataset.path ?? '__none'); });

/* ---------- Page entrance ----------
   Top-level blocks rise in one after another; cards inside grids follow their parent. */
const GRIDS = '.kpis, .grade-cards, .teacher-cards, .ptiles, .gallery, .mini-list, .grid-2, .score-cards, .badges, .kid-switch, .today-grid, .proj-strip, .act-list, .lesson-list, .act-main, .steps';
function stagger(view) {
  [...view.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 9)));
  for (const g of $$(GRIDS, view)) [...g.children].forEach((c, j) => c.style.setProperty('--j', Math.min(j, 8)));
  for (const t of $$('.heat tbody', view)) [...t.rows].forEach((r, k) => r.style.setProperty('--r', Math.min(k, 14)));
}
// Count numbers up on arrival: KPI tiles and ring labels.
function countAll(view) {
  if (REDUCED) return;
  for (const b of $$('.kpi b, .ring-txt b, .big-num', view)) {
    const t = b.firstChild;
    if (!t || t.nodeType !== 3) continue;
    const m = t.textContent.trim().match(/^(\d{1,5})(%?)$/);
    if (!m) continue;
    const span = document.createElement('span');
    t.replaceWith(span);
    countUp(span, +m[1], { suffix: m[2], dur: 1000 });
  }
}

/* ---------- Re-render in place ----------
   When a page redraws after an action (marking, saving), bars, rings and numbers glide from
   their old values to the new ones instead of jumping. Focus returns to the same control. */
function snapshot(view) {
  return {
    bars: $$('.bar i', view).map(i => i.style.width),
    rings: $$('.ring-val', view).map(c => c.getAttribute('stroke-dashoffset')),
    nums: $$('.kpi b, .ring-txt b', view).map(b => b.textContent.trim()),
  };
}
function tweenFrom(view, snap) {
  if (!snap || REDUCED) return;
  const bars = $$('.bar i', view);
  if (bars.length === snap.bars.length) bars.forEach((el, i) => {
    const to = el.style.width; if (snap.bars[i] === to) return;
    el.style.transition = 'none'; el.style.width = snap.bars[i]; void el.offsetWidth; el.style.transition = ''; el.style.width = to;
  });
  const rings = $$('.ring-val', view);
  if (rings.length === snap.rings.length) rings.forEach((el, i) => {
    const to = el.getAttribute('stroke-dashoffset'); if (snap.rings[i] === to) return;
    el.style.transition = 'none'; el.style.strokeDashoffset = snap.rings[i]; void el.getBoundingClientRect(); el.style.transition = ''; el.style.strokeDashoffset = to;
  });
  const nums = $$('.kpi b, .ring-txt b', view);
  if (nums.length === snap.nums.length) nums.forEach((b, i) => {
    const t = b.firstChild; if (!t || t.nodeType !== 3) return;
    const a = snap.nums[i].match(/^(\d{1,5})/), m = t.textContent.trim().match(/^(\d{1,5})(%?)$/);
    if (!a || !m || +a[1] === +m[1]) return;
    const span = document.createElement('span'); t.replaceWith(span);
    countUp(span, +m[1], { from: +a[1], suffix: m[2], dur: 700 });
  });
}
function pathTo(el, rootEl) {
  if (!el || !rootEl.contains(el) || el === rootEl) return null;
  if (el.id) return { id: el.id };
  const path = [];
  for (let n = el; n && n !== rootEl; n = n.parentElement) path.unshift([...n.parentElement.children].indexOf(n));
  return { path, tag: el.tagName };
}
function restoreFocus(view, p) {
  let el = p.id ? document.getElementById(p.id) : view;
  if (!p.id) for (const i of p.path) { el = el?.children[i]; if (!el) break; }
  if (el && (!p.tag || el.tagName === p.tag) && el !== document.activeElement) el.focus({ preventScroll: true });
}

export { DEMO };

addEventListener('hashchange', route);
route();
