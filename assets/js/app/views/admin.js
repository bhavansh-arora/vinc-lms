// VINC Lab admin: network overview, schools, course content and settings.
import { COURSES, GRADES, FORMS, WEIGHTS, projectById } from '../../data/courses.js';
import { db, save, reset, studentsOf, projectsFor, lastActive, addSchool, log, gradeOf, teachersOf, viewAs, isRemote, schoolIdList, createSchoolIds, deleteSchoolId, noteSchoolId } from '../store.js';
import { showCredsSaved } from './shared.js';
import { t, tx, isHi } from '../../i18n.js';
import { accountsPage, deleteSchoolModal, filterAccounts } from './accounts.js';
import { yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, timeAgo, fmtDate, toast, modal, download, bindCopy } from '../ui.js';

export const nav = () => [
  { path: '', label: t('Overview'), icon: 'home' },
  { path: 'schools', label: t('Schools'), icon: 'school' },
  { path: 'school-ids', label: t('School IDs'), short: t('IDs'), icon: 'id-card' },
  { path: 'accounts', label: t('Accounts'), icon: 'key' },
  { path: 'content', label: t('Course content'), short: t('Content'), icon: 'book' },
  { path: 'settings', label: t('Settings'), icon: 'settings' },
];

export function render(ctx) {
  const [page, a] = ctx.params;
  if (page === 'schools') return schools(ctx);
  if (page === 'school-ids') return schoolIdsPage(ctx);
  if (page === 'accounts') return accountsPage(ctx);
  if (page === 'content') return a ? projectContent(ctx, a) : content(ctx);
  if (page === 'settings') return settings(ctx);
  return overview(ctx);
}

function schoolStats(sch) {
  const st = studentsOf(sch.id);
  const ys = st.map(s => yearSummary(db().progress[s.id], projectsFor(s)));
  const active = st.filter(s => { const t = lastActive(s.id); return t && Date.now() - t < 14 * 86400000; }).length;
  const scored = ys.filter(y => y.score != null);
  return {
    students: st.length, active,
    completion: ys.length ? Math.round(ys.reduce((n, y) => n + y.activityPct, 0) / ys.length) : 0,
    score: scored.length ? Math.round(scored.reduce((n, y) => n + y.score, 0) / scored.length) : null,
  };
}

function weeklyActivity() {
  const weeks = Array(12).fill(0); const now = Date.now();
  for (const pr of Object.values(db().progress)) for (const p of Object.values(pr)) for (const a of Object.values(p.acts)) {
    const w = Math.floor((now - a.at) / (7 * 86400000)); if (w >= 0 && w < 12) weeks[11 - w]++;
  }
  return weeks;
}

function spark(vals) {
  const max = Math.max(1, ...vals), W = 600, H = 140;
  const pts = vals.map((v, i) => [i * W / (vals.length - 1), H - 10 - v / max * (H - 30)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${t('Activities completed per week, last 12 weeks')}">
    <path d="${d} L${W} ${H} L0 ${H} Z" class="area"/><path d="${d}" class="line"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4"><title>${t('{n} activities', { n: vals[i] })}</title></circle>`).join('')}</svg>`;
}

/* ---------- Overview ---------- */
function overview(ctx) {
  const D = db();
  const rows = D.schools.map(s => ({ s, ...schoolStats(s) }));
  const students = rows.reduce((n, r) => n + r.students, 0);
  const active = rows.reduce((n, r) => n + r.active, 0);
  const quizzes = Object.values(D.progress).reduce((n, pr) => n + Object.values(pr).reduce((m, p) => m + p.quiz.length, 0), 0);
  const wk = weeklyActivity();
  return {
    title: t('Network overview'), nav: '',
    html: `<div class="kpis">
      <div class="kpi"><span>${icon('school')}</span><b>${D.schools.filter(s => s.active).length}</b><p>${t('Active schools')}</p></div>
      <div class="kpi"><span>${icon('users')}</span><b>${students}</b><p>${t('Students, Grades 6–8')}</p></div>
      <div class="kpi"><span>${icon('eye')}</span><b>${students ? Math.round(active / students * 100) : 0}%</b><p>${t('Active in the last 14 days')}</p></div>
      <div class="kpi"><span>${icon('quiz')}</span><b>${quizzes}</b><p>${t('Quiz attempts')}</p></div>
    </div>
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('chart')} ${t('Activities completed per week')}</h2><span class="muted small">${t('Last 12 weeks, all schools')}</span></div>${spark(wk)}</section>
    <div class="grade-cards">${GRADES.map(g => {
      const kids = D.users.filter(u => u.role === 'student' && gradeOf(u) === g);
      const ys = kids.map(k => yearSummary(D.progress[k.id], projectsFor(k)));
      const comp = ys.length ? Math.round(ys.reduce((n, y) => n + y.activityPct, 0) / ys.length) : 0;
      const sc = ys.filter(y => y.score != null); const avg = sc.length ? Math.round(sc.reduce((n, y) => n + y.score, 0) / sc.length) : null;
      return `<section class="card grade-card g${g}"><div class="gc-top"><span class="gnum">${g}</span><div><b>${t('Grade {g}', { g })}</b><small class="muted">${t('{n} students', { n: kids.length })} · ${t('{n} sections', { n: D.schools.reduce((n, s) => n + s.sections.filter(x => x.grade === g).length, 0) })}</small></div></div>
        <div class="gc-row"><span>${t('Activities')}</span>${bar(comp)}<b>${comp}%</b></div><div class="gc-row"><span>${t('Avg score')}</span>${bar(avg)}<b>${avg == null ? '—' : `${avg}%`}</b></div></section>`;
    }).join('')}</div>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('school')} ${t('Schools')}</h2>
        ${rows.length ? `<ul class="sec-list">${rows.map(r => `<li><span class="badge sm" style="--brand:${r.s.color}">${esc(r.s.initials)}</span><div><b>${esc(r.s.name)}</b><small class="muted">${t('{n} students', { n: r.students })} · ${t('avg score {score}', { score: r.score == null ? '—' : `${r.score}%` })}</small></div>${bar(r.completion, r.s.color)}<span class="num">${r.completion}%</span></li>`).join('')}</ul>` : `<p class="empty-note">${t('No schools yet. A school appears here when its coordinator registers, or when you add one on the Schools page.')}</p>`}
      </section>
      <section class="card"><h2 class="h-card">${icon('bell')} ${t('Live feed')}</h2>
        ${D.log.length ? `<ul class="feed compact">${D.log.slice(0, 9).map(l => `<li><b>${esc(l.who)}</b> ${esc(tx(l.what))} <small class="muted">· ${esc(D.schools.find(s => s.id === l.schoolId)?.name || '')} · ${timeAgo(l.at)}</small></li>`).join('')}</ul>` : `<p class="empty-note">${t('Nothing yet. Sign-ups, finished activities and quiz scores show up here.')}</p>`}
      </section>
    </div>`,
  };
}

/* ---------- Schools ---------- */
function schools(ctx) {
  const D = db();
  return {
    title: t('Schools'), nav: 'schools',
    html: `<div class="toolbar"><p class="muted">${t('Each school gets its own branded studio, sections and coordinator login.')}</p><button class="btn btn-brand btn-sm" id="add">${icon('plus')} ${t('Add school')}</button></div>
    <section class="card tbl-card"><table class="tbl">
      <thead><tr><th>${t('School')}</th><th>${t('School ID')}</th><th>${t('City')}</th><th>${t('Plan')}</th><th>${t('Students')}</th><th>${t('Teachers')}</th><th>${t('Activities')}</th><th>${t('Avg score')}</th><th>${t('Status')}</th><th></th></tr></thead>
      <tbody>${D.schools.map(s => { const st = schoolStats(s); return `<tr>
        <td><div class="sch-cell"><span class="badge sm" style="--brand:${s.color}">${esc(s.initials)}</span><div><b>${esc(s.name)}</b><small class="muted">${esc(s.studio)}</small></div></div></td>
        <td><code class="mono">${esc(s.regCode || '—')}</code></td><td>${esc(s.city)}</td><td>${esc(t(s.plan))}</td><td>${st.students}/${s.seats}</td><td>${teachersOf(s.id).length}</td>
        <td><div class="cell-bar">${bar(st.completion, s.color)}<span>${st.completion}%</span></div></td>
        <td>${st.score == null ? '—' : `${st.score}% <small class="muted">${band(st.score)}</small>`}</td>
        <td><button class="tag ${s.active ? 'ok' : 'todo'} tag-btn" data-toggle="${s.id}" aria-label="${t(s.active ? 'Pause {name}' : 'Activate {name}', { name: esc(s.name) })}">${s.active ? t('Active') : t('Paused')}</button></td>
        <td><div class="btn-row nowrap"><button class="btn btn-sm btn-ghost" data-open="${s.id}">${t('Open dashboard')}</button><button class="btn btn-sm linkish" data-logins="${s.id}">${icon('key')} ${t('Accounts')}</button><button class="btn btn-sm btn-ghost danger" data-delsch="${s.id}" aria-label="${t('Delete {name}', { name: esc(s.name) })}">${icon('trash')}</button></div></td></tr>`; }).join('') || `<tr><td colspan="10" class="muted">${t('No schools yet. Use Add school, or give a coordinator a School ID so they can register on the sign-up page.')}</td></tr>`}</tbody>
    </table></section>`,
    mount(el) {
      $$('[data-open]', el).forEach(b => b.addEventListener('click', async () => {
        const coord = D.users.find(u => u.role === 'school' && u.schoolId === b.dataset.open);
        if (!coord) { toast(t('This school has no coordinator yet.'), 'warn'); return; }
        try { await viewAs(ctx.me, coord); ctx.go('/school'); } catch (e) { toast(e.message, 'bad'); }
      }));
      $$('[data-logins]', el).forEach(b => b.addEventListener('click', () => { filterAccounts({ school: b.dataset.logins, role: 'all', q: '' }); ctx.go('/admin/accounts'); }));
      $$('[data-delsch]', el).forEach(b => b.addEventListener('click', () => deleteSchoolModal(ctx, D.schools.find(x => x.id === b.dataset.delsch), () => ctx.rerender())));
      $$('[data-toggle]', el).forEach(b => b.addEventListener('click', () => {
        const s = D.schools.find(x => x.id === b.dataset.toggle); s.active = !s.active;
        log(ctx.me.name, `${s.active ? 'activated' : 'paused'} ${s.name}`, s.id); save(); ctx.rerender();
      }));
      $('#add', el).addEventListener('click', () => {
        const d = modal(`<h2>${t('Add a school')}</h2>
          <form id="sf" class="form-grid">
            <label>${t('School name')}<input name="name" required maxlength="60"></label>
            <label>${t('Skill studio name')}<input name="studio" maxlength="40" placeholder="${t('e.g. Greenwood Skills Studio')}"></label>
            <label>${t('City')}<input name="city" maxlength="40"></label>
            <label>${t('Plan')}<select name="plan">${['Pilot', 'Standard', 'Premium'].map(x => `<option value="${x}">${t(x)}</option>`).join('')}</select></label>
            <label>${t('Seats')}<input name="seats" type="number" min="10" max="5000" value="60"></label>
            <label>${t('Brand colour')}<input name="color" type="color" value="#1F6F66"></label>
            <label>${t('Coordinator\'s name')}<input name="coord" maxlength="60" placeholder="${t('Who runs Kaushal Bodh at the school')}"></label>
            <label>${t('Coordinator\'s email')}<input name="coordEmail" type="email" maxlength="80"></label>
            <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${t('Cancel')}</button><button class="btn btn-brand">${t('Create school')}</button></div>
          </form>`);
        $('#sf', d).addEventListener('submit', async e => {
          e.preventDefault(); const f = e.target;
          if (!f.name.value.trim()) return;
          const { sch: s, coord, coordPw, teacher, teacherPw } = addSchool({ name: f.name.value.trim(), studio: f.studio.value.trim(), city: f.city.value.trim(), plan: f.plan.value, seats: f.seats.value, color: f.color.value,
            coord: { name: f.coord.value.trim() || undefined, email: f.coordEmail.value.trim() || undefined } });
          log(ctx.me.name, `added ${s.name}`, s.id); save();
          d.close();
          await showCredsSaved(t('{name} is ready', { name: s.name }), [
            { u: coord, name: coord.name, role: t('School coordinator'), icon: 'school', login: coord.login, pw: coordPw },
            { u: teacher, name: teacher.name, role: t('Teacher for 6 A, 7 A and 8 A'), icon: 'book', login: teacher.login, pw: teacherPw },
          ], t('Sections 6 A, 7 A and 8 A are set up. Teachers can also join with the code {tcode}, and students with {scode}.', { tcode: s.joinCode, scode: s.studentCode }));
          ctx.rerender();
        });
      });
    },
  };
}

/* ---------- School IDs ----------
   The admin makes School IDs and gives one to each school. A school needs an unused one to
   register on the sign-up page; each works once. */
let idFilter = 'unused';
// "Link" is a verb elsewhere (profile: link a child, 'जोड़ें'); here it is the noun, a sign-up link.
const LINK = isHi() ? 'लिंक' : 'Link';
const signupLink = id => `${location.origin}${location.pathname}#/signup/school/${id}`;

function schoolIdsPage(ctx) {
  const D = db();
  const list = [...schoolIdList()].sort((a, b) => (!!a.usedBy - !!b.usedBy) || b.createdAt - a.createdAt);
  const unused = list.filter(x => !x.usedBy).length;
  const nameOf = id => D.schools.find(s => s.id === id)?.name || t('a deleted school');
  const shown = list.filter(x => idFilter === 'all' || (idFilter === 'used') === !!x.usedBy);
  return {
    title: t('School IDs'), nav: 'school-ids',
    html: `<section class="card"><h2 class="h-card">${icon('id-card')} ${t('Make School IDs')}</h2>
      <p class="muted">${t('Give one School ID to each school. The coordinator enters it on the sign-up page to register the school. Each School ID works once.')}</p>
      <form id="sid-f" class="sid-form" novalidate>
        <label>${t('How many')}<input name="count" type="number" min="1" max="50" value="1" required></label>
        <label class="grow"><span>${t('Who it is for')} <small class="muted">${t('optional')}</small></span><input name="note" maxlength="80" placeholder="${t('e.g. Sunflower Public School, Pune')}"></label>
        <button class="btn btn-brand" type="submit">${icon('plus')} ${t('Make School IDs')}</button>
      </form>
    </section>
    <div class="toolbar"><div class="seg-tabs" role="group" aria-label="${t('Show')}">${[['unused', t('Unused ({n})', { n: unused })], ['used', t('Used ({n})', { n: list.length - unused })], ['all', t('All ({n})', { n: list.length })]].map(([k, l]) => `<button data-f="${k}" aria-pressed="${idFilter === k}">${l}</button>`).join('')}</div></div>
    <section class="card tbl-card"><table class="tbl sid-tbl">
      <thead><tr><th>${t('School ID')}</th><th>${t('For')}</th><th>${t('Status')}</th><th>${t('Made')}</th><th aria-label="${t('Actions')}"></th></tr></thead>
      <tbody>${shown.map(x => `<tr>
        <td><code class="mono sid-code">${esc(x.id)}</code></td>
        <td>${x.note ? esc(x.note) : '<span class="muted">—</span>'}</td>
        <td>${x.usedBy ? `<span class="tag ok">${t('Used')}</span> <small class="muted">${x.usedAt ? t('by {name}, {date}', { name: esc(nameOf(x.usedBy)), date: fmtDate(x.usedAt, { day: 'numeric', month: 'short', year: 'numeric' }) }) : t('by {name}', { name: esc(nameOf(x.usedBy)) })}</small>` : `<span class="tag todo">${t('Unused')}</span>`}</td>
        <td><small class="muted">${fmtDate(x.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</small></td>
        <td><div class="btn-row nowrap">${x.usedBy ? '' : `<button class="btn btn-sm btn-ghost" data-copy="${esc(x.id)}" title="${t('Copy the School ID')}">${icon('copy')} ${t('ID')}</button><button class="btn btn-sm btn-ghost" data-copy="${esc(signupLink(x.id))}" title="${t('Copy a sign-up link with this School ID filled in')}">${icon('link')} ${LINK}</button>`}
          <button class="btn btn-sm btn-ghost" data-note="${esc(x.id)}" aria-label="${t('Change who {id} is for', { id: esc(x.id) })}" title="${t('Change who it is for')}">${icon('edit')}</button>
          ${x.usedBy && D.schools.some(s => s.id === x.usedBy) ? '' : `<button class="btn btn-sm btn-ghost danger" data-del="${esc(x.id)}" aria-label="${t('Delete {name}', { name: esc(x.id) })}" title="${t('Delete')}">${icon('trash')}</button>`}</div></td></tr>`).join('')
        || `<tr><td colspan="5" class="muted">${list.length ? t('None here.') : t('No School IDs yet. Make one above for each school that will register.')}</td></tr>`}</tbody>
    </table></section>`,
    mount(el) {
      bindCopy(el);
      $$('[data-f]', el).forEach(b => b.addEventListener('click', () => { idFilter = b.dataset.f; ctx.rerender(); }));
      $('#sid-f', el).addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target, btn = $('button[type=submit]', f);
        btn.disabled = true;
        let made;
        try { made = await createSchoolIds(f.count.value, f.note.value); } catch (err) { btn.disabled = false; toast(err.message, 'bad'); return; }
        idFilter = 'unused';
        ctx.rerender();
        const all = made.map(x => x.id).join('\n');
        const d = modal(`<h2>${made.length === 1 ? t('New School ID') : t('{n} new School IDs', { n: made.length })}</h2>
          <p class="muted">${t(made.length === 1 ? 'Send it to each school\'s coordinator. They enter it on the sign-up page under <b>Create account → School</b>, or open the sign-up link, which fills it in.' : 'Send one to each school\'s coordinator. They enter it on the sign-up page under <b>Create account → School</b>, or open the sign-up link, which fills it in.')}</p>
          <ul class="sid-made">${made.map(x => `<li><code class="mono sid-code">${esc(x.id)}</code><button class="btn btn-sm btn-ghost" data-copy="${esc(x.id)}">${icon('copy')} ${t('ID')}</button><button class="btn btn-sm btn-ghost" data-copy="${esc(signupLink(x.id))}">${icon('link')} ${LINK}</button></li>`).join('')}</ul>
          <div class="modal-actions">${made.length > 1 ? `<button class="btn btn-ghost" data-copy="${esc(all)}">${icon('copy')} ${t('Copy all IDs')}</button>` : ''}<button class="btn btn-primary" data-close>${t('Done')}</button></div>`);
        bindCopy(d);
      });
      $$('[data-note]', el).forEach(b => b.addEventListener('click', async () => {
        const x = schoolIdList().find(r => r.id === b.dataset.note); if (!x) return;
        const note = prompt(t('Who is {id} for?', { id: x.id }), x.note || '');
        if (note == null) return;
        try { await noteSchoolId(x.id, note); ctx.rerender(); } catch (err) { toast(err.message, 'bad'); }
      }));
      $$('[data-del]', el).forEach(b => b.addEventListener('click', async () => {
        if (!confirm(t('Delete the School ID {id}? A school can no longer register with it.', { id: b.dataset.del }))) return;
        try { await deleteSchoolId(b.dataset.del); toast(t('School ID deleted.')); ctx.rerender(); } catch (err) { toast(err.message, 'bad'); }
      }));
    },
  };
}

/* ---------- Content ---------- */
function content(ctx) {
  return {
    title: t('Course content'), nav: 'content',
    html: GRADES.map(g => { const C = COURSES[g]; const ps = C.projects; return `<section class="card g${g}"><div class="card-head"><h2 class="h-card"><span class="gnum sm">${g}</span> ${esc(C.book)}</h2><span class="tag ok">${t('Live')}</span></div>
      <p class="muted">${t('{p} projects · {a} activities · {q} quiz questions · {v} viva prompts', { p: ps.length, a: ps.reduce((n, p) => n + p.activities.length, 0), q: ps.reduce((n, p) => n + p.quiz.length, 0), v: ps.reduce((n, p) => n + p.viva.length, 0) })}</p>
      <div class="mini-list">${ps.map(p => `<a class="mini f-${p.form}" href="#/admin/content/${p.id}"><div class="mini-art">${art(p.art)}</div><div><b>${esc(p.title)}</b><small>${esc(FORMS[p.form].short)} · ${t('{a} activities · {q} questions · pp. {from}–{to}', { a: p.activities.length, q: p.quiz.length, from: p.pages[0], to: p.pages[1] })}</small></div></a>`).join('')}</div>
    </section>`; }).join('') + `<p class="muted small">${t('Assessment for every project: {list}.', { list: WEIGHTS.map(w => `${esc(w.label)} ${w.weight}%`).join(' · ') })}</p>`,
  };
}

function projectContent(ctx, pid) {
  const p = projectById(pid);
  if (!p) return content(ctx);
  return {
    title: p.title, nav: 'content',
    html: `<a class="back" href="#/admin/content">← ${t('Course content')}</a>
    <section class="proj-head f-${p.form}"><div class="ph-art">${art(p.art)}</div><div class="ph-copy"><span class="form-tag">${t('Grade {g} · {name}', { g: p.grade, name: esc(FORMS[p.form].name) })}</span><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p></div></section>
    <div class="grid-2">
      <section class="card"><h3 class="h-card">${t('Activities')}</h3><ol class="plain-ol">${p.activities.map(a => `<li><b>${esc(a.title)}</b> <small class="muted">${t('p. {n}', { n: a.page })}</small><br><small>${esc(a.task)}</small></li>`).join('')}</ol></section>
      <section class="card"><h3 class="h-card">${t('Viva prompts')}</h3><ol class="plain-ol">${p.viva.map(v => `<li>${esc(v)}</li>`).join('')}</ol></section>
    </div>
    <section class="card"><h3 class="h-card">${t('Question bank')}</h3><ol class="qbank">${p.quiz.map(q => `<li><b>${esc(q.q)}</b><ul>${q.o.map((o, i) => `<li class="${i === q.a ? 'right' : ''}">${esc(o)}${i === q.a ? ' ✓' : ''}</li>`).join('')}</ul><small class="muted">${esc(q.e)}</small></li>`).join('')}</ol></section>`,
  };
}

/* ---------- Settings ---------- */
function settings(ctx) {
  const D = db();
  const size = new Blob([JSON.stringify(D)]).size;
  return {
    title: t('Settings'), nav: 'settings',
    html: `<div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('settings')} ${t('Data')}</h2>
        <p>${isRemote() ? t('All data is kept on the VINC Lab server, in its Postgres database, with a backup every 3 hours.') : t('This preview keeps all data in this browser ({kb} KB used).', { kb: (size / 1024).toFixed(0) })}${D.createdAt ? ` ${t('Started {date}.', { date: fmtDate(D.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }) })}` : ''}</p>
        <div class="btn-row"><button class="btn btn-ghost" id="export">${icon('download')} ${t('Export data (JSON)')}</button><button class="btn btn-ghost danger" id="reset">${t('Delete all data')}</button></div>
      </section>
      <section class="card"><h2 class="h-card">${icon('shield')} ${isRemote() ? t('Security') : t('Going live')}</h2>
        ${isRemote() ? `<ul><li>${t('Passwords are checked on the server and stored only as scrypt hashes')}</li><li>${t('Each person receives only the data their role allows')}</li><li>${t('Logins are rate-limited against guessing')}</li></ul><p class="muted small">${t('Next ideas: parent sign-in by phone OTP, photo storage outside the database, CBSE-ready mark sheets.')}</p>`
          : `<ul><li>${t('Server-side logins (this preview checks passwords in the browser)')}</li><li>${t('Parent sign-in by phone OTP')}</li><li>${t('Photo storage for portfolios')}</li><li>${t('CBSE-ready mark sheets per section')}</li></ul><p class="muted small">${t('The data shapes used here (schools, users, progress, log) map one-to-one onto the hosted version.')}</p>`}
      </section>
    </div>`,
    mount(el) {
      $('#export', el).addEventListener('click', () => download('vinclab-data.json', JSON.stringify(D, null, 1), 'application/json'));
      $('#reset', el).addEventListener('click', async () => {
        if (!confirm(t('Delete all data? Every school, teacher, student and parent account, and all their work, will be removed. Only the admin login stays.'))) return;
        try { await reset(); toast(t('All data deleted. The admin password is back to its default.')); ctx.go('/admin'); } catch (e) { toast(e.message, 'bad'); }
      });
    },
  };
}
