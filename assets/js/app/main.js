// VINC Lab LMS: hash router, app shell and demo login.
import { load, db, session, user, school, brandDemo, canPersist } from './store.js';
import { $, $$, esc, icon, toast } from './ui.js';
import * as Student from './views/student.js';
import * as Parent from './views/parent.js';
import * as School from './views/school.js';
import * as Admin from './views/admin.js';

load();

const DEMO = { student: 'u_aarav', parent: 'u_priya', school: 'u_sch_greenwood_coord', admin: 'u_admin' };
const ROLE_LABEL = { student: 'Student', parent: 'Parent', school: 'School', admin: 'Admin' };
const VIEWS = { student: Student, parent: Parent, school: School, admin: Admin };
const root = $('#app');

/* ---------- Theme ---------- */
const THEME_KEY = 'vinclab-theme';
try { const t = localStorage.getItem(THEME_KEY); if (t) document.documentElement.dataset.theme = t; } catch { /* ignore */ }
function toggleTheme() {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme); } catch { /* ignore */ }
}

/* ---------- Session ---------- */
function signIn(userId, extra = {}) { session.set({ userId, at: Date.now(), ...extra }); }
function currentUser() { const s = session.get(); return s ? user(s.userId) : null; }
export function go(path) { if (location.hash === `#${path}`) route(); else location.hash = path; }

/* ---------- Router ---------- */
addEventListener('hashchange', route);
route();

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, ...rest] = parts;
  if (head === 'login' && rest[0] && DEMO[rest[0]]) { signIn(DEMO[rest[0]]); go(`/${rest[0]}`); return; }
  if (head === 'brand-demo') {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem('vinclab-brand-draft') || 'null'); } catch { /* ignore */ }
    const sch = brandDemo(draft || { name: 'Your School', studio: 'Your Skills Studio', color: '#1F6F66' });
    const kid = db().users.find(u => u.role === 'student' && u.schoolId === sch.id);
    signIn(kid.id);
    go('/student');
    setTimeout(() => toast(`Welcome to ${sch.studio}. Use "View as" to switch to the school dashboard.`), 300);
    return;
  }
  const me = currentUser();
  if (!me || head === 'login') { renderLogin(); return; }
  if (head !== me.role) { go(`/${me.role}`); return; }
  renderShell(me, rest);
}

/* ---------- Login ---------- */
function renderLogin() {
  document.title = 'Log in · VINC Lab';
  root.className = 'login-page';
  document.documentElement.style.removeProperty('--brand');
  const others = db().users.filter(u => u.role === 'school' || (u.role === 'student' && u.roll <= 2));
  root.innerHTML = `
    <div class="login-wrap">
      <a class="login-logo" href="index.html" aria-label="VINC Lab home">
        <img class="logo-l" src="assets/logo/vinc-lab-logo.svg" alt="VINC Lab" width="200" height="45">
        <img class="logo-d" src="assets/logo/vinc-lab-logo-dark.svg" alt="VINC Lab" width="200" height="45">
      </a>
      <h1>Log in to your skill studio</h1>
      <p class="muted">This is a demo. Pick an account to explore. Everything you do stays in this browser.</p>
      <div class="role-grid">
        ${[
          ['student', 'Aarav Sharma', 'Grade 6 A · Greenwood Public School', 'star'],
          ['parent', 'Priya Sharma', "Aarav's mother", 'home'],
          ['school', 'Kavita Rao', 'Kaushal Bodh coordinator · Greenwood', 'school'],
          ['admin', 'Neha Kapoor', 'VINC Lab admin', 'settings'],
        ].map(([role, name, sub, ic]) => `
          <button class="role-card r-${role}" data-user="${DEMO[role]}">
            <span class="role-ic">${icon(ic)}</span>
            <span class="role-tag">${ROLE_LABEL[role]}</span>
            <b>${esc(name)}</b><small>${esc(sub)}</small>
            <span class="go">Enter ${icon('arrow')}</span>
          </button>`).join('')}
      </div>
      <details class="more-users"><summary>More demo accounts</summary>
        <label for="any-user" class="sr-only">Choose an account</label>
        <select id="any-user">${others.map(u => `<option value="${u.id}">${esc(u.name)} · ${ROLE_LABEL[u.role]} · ${esc(school(u.schoolId)?.name || '')}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" id="any-go">Log in</button>
      </details>
      <p class="login-foot"><a href="index.html">← Back to vinclab</a> · <button class="linkish" id="theme-l">Switch theme</button></p>
    </div>`;
  $$('.role-card', root).forEach(b => b.addEventListener('click', () => { signIn(b.dataset.user); go(`/${user(b.dataset.user).role}`); }));
  $('#any-go').addEventListener('click', () => { const id = $('#any-user').value; signIn(id); go(`/${user(id).role}`); });
  $('#theme-l').addEventListener('click', toggleTheme);
}

/* ---------- Shell ---------- */
function brandFor(me) {
  if (me.role === 'admin') return null;
  return school(me.schoolId);
}

function renderShell(me, rest) {
  const View = VIEWS[me.role];
  const sch = brandFor(me);
  const ctx = { me, school: sch, params: rest, go, rerender: () => { const y = scrollY; route(); scrollTo(0, y); }, toast };
  let page;
  try { page = View.render(ctx); } catch (e) { console.error(e); page = { title: 'Something went wrong', html: `<div class="empty"><p>That page could not be shown.</p><button class="btn btn-primary" onclick="location.hash='#/${me.role}'">Go to the dashboard</button></div>` }; }
  const nav = View.nav(ctx);
  const active = page.nav || rest[0] || '';
  document.title = `${page.title} · ${sch ? sch.studio : 'VINC Lab'}`;
  root.className = `app role-${me.role}`;
  // Set on <html> so dialogs and toasts (outside #app) also pick up the school's colour.
  if (sch) document.documentElement.style.setProperty('--brand', sch.color); else document.documentElement.style.removeProperty('--brand');
  const s = session.get();
  root.innerHTML = `
    <aside class="side" aria-label="Sidebar">
      <a class="side-brand" href="#/${me.role}">
        ${sch ? `<span class="badge">${esc(sch.initials)}</span><span><b>${esc(sch.studio)}</b><small>${esc(sch.name)}</small></span>`
              : `<img class="logo-l" src="assets/logo/vinc-lab-logo.svg" alt="VINC Lab" width="150" height="34"><img class="logo-d" src="assets/logo/vinc-lab-logo-dark.svg" alt="VINC Lab" width="150" height="34">`}
      </a>
      <nav class="side-nav" aria-label="Main">
        ${nav.map(n => `<a href="#/${me.role}${n.path ? '/' + n.path : ''}" class="${n.path === active ? 'on' : ''}" ${n.path === active ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${esc(n.label)}</span></a>`).join('')}
      </nav>
      <div class="side-foot">
        <div class="me"><span class="avatar">${esc(me.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><span><b>${esc(me.name)}</b><small>${esc(me.title || ROLE_LABEL[me.role])}</small></span></div>
        ${sch ? '<small class="powered">Powered by <b>VINC Lab</b></small>' : ''}
      </div>
    </aside>
    <div class="main">
      <header class="top">
        <button class="icon-btn only-m" id="nav-open" aria-label="Open menu">${icon('menu')}</button>
        <h1 class="top-title">${esc(page.title)}</h1>
        <div class="top-tools">
          <label class="viewas"><span>View as</span>
            <select id="viewas" aria-label="Switch demo account">
              ${Object.entries(DEMO).map(([r, id]) => `<option value="${id}" ${id === me.id ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}
              ${Object.values(DEMO).includes(me.id) ? '' : `<option value="${me.id}" selected>${esc(me.name)}</option>`}
            </select>
          </label>
          ${s?.by ? `<button class="btn btn-sm btn-ghost" id="back-admin">Back to admin</button>` : ''}
          <button class="icon-btn" id="theme" aria-label="Switch colour theme">${icon('moon')}</button>
          <button class="icon-btn" id="logout" aria-label="Log out">${icon('logout')}</button>
        </div>
      </header>
      ${canPersist() ? '' : '<p class="warn-bar">This browser is blocking storage, so changes will not be kept after you leave.</p>'}
      <main id="view" class="view" tabindex="-1">${page.html}</main>
    </div>
    <nav class="tabbar" aria-label="Main">
      ${nav.slice(0, 5).map(n => `<a href="#/${me.role}${n.path ? '/' + n.path : ''}" class="${n.path === active ? 'on' : ''}">${icon(n.icon)}<span>${esc(n.short || n.label)}</span></a>`).join('')}
    </nav>`;
  $('#viewas').addEventListener('change', e => { signIn(e.target.value); go(`/${user(e.target.value).role}`); });
  $('#logout').addEventListener('click', () => { session.clear(); go('/login'); });
  $('#theme').addEventListener('click', toggleTheme);
  $('#back-admin')?.addEventListener('click', () => { signIn(s.by); go('/admin/schools'); });
  $('#nav-open').addEventListener('click', () => root.classList.toggle('nav-open'));
  $$('.side-nav a', root).forEach(a => a.addEventListener('click', () => root.classList.remove('nav-open')));
  scrollTo(0, 0);
  page.mount?.($('#view'), ctx);
}

